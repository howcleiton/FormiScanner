import type { Address } from "@/types/address";
import type { Coordinates, RoutePoint, OptimizedRoute } from "@/types/route";
import { calculateDistance, geocodeCEP } from "./geocoding";

/**
 * Busca a rota real entre dois pontos usando Google Maps Directions API
 * Retorna as coordenadas do caminho pelas ruas
 */
async function getRouteGeometryGoogleMaps(
  start: Coordinates,
  end: Coordinates
): Promise<Coordinates[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.log("Google Maps API key não configurada, usando OSRM");
    return getRouteGeometryOSRM(start, end);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const polyline = route.overview_polyline.points;
      
      // Decodificar polyline do Google Maps
      const coordinates = decodePolyline(polyline);
      return coordinates;
    }

    console.warn("Google Maps API falhou, usando OSRM como fallback");
    return getRouteGeometryOSRM(start, end);
  } catch (error) {
    console.error("Erro ao buscar rota no Google Maps:", error);
    return getRouteGeometryOSRM(start, end);
  }
}

/**
 * Busca a rota real entre dois pontos usando OSRM (Open Source Routing Machine)
 * Fallback gratuito quando Google Maps não está disponível
 */
async function getRouteGeometryOSRM(
  start: Coordinates,
  end: Coordinates
): Promise<Coordinates[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      // Converter de [lng, lat] para {lat, lng}
      return coordinates.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0],
      }));
    }

    // Fallback: retornar linha reta
    return [start, end];
  } catch (error) {
    console.error("Erro ao buscar rota no OSRM:", error);
    // Fallback: retornar linha reta
    return [start, end];
  }
}

/**
 * Decodifica polyline do Google Maps para array de coordenadas
 * Algoritmo: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): Coordinates[] {
  const coordinates: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * Função principal que escolhe automaticamente entre Google Maps e OSRM
 */
async function getRouteGeometry(
  start: Coordinates,
  end: Coordinates
): Promise<Coordinates[]> {
  // Tenta Google Maps primeiro (se API key estiver configurada)
  return getRouteGeometryGoogleMaps(start, end);
}

/**
 * Otimiza a rota de entrega usando o algoritmo Nearest Neighbor (Vizinho Mais Próximo)
 * Este algoritmo sempre escolhe o próximo ponto não visitado mais próximo
 */
export async function optimizeRoute(
  addresses: Address[],
  startPoint?: Coordinates
): Promise<OptimizedRoute | null> {
  if (addresses.length === 0) {
    return null;
  }

  try {
    // 1. Geocodificar todos os endereços
    console.log("Geocodificando endereços...");
    const geocodedPoints: Array<{
      address: Address;
      coordinates: Coordinates | null;
    }> = [];

    for (const address of addresses) {
      const coords = await geocodeCEP(
        address.cep,
        address.cidade,
        address.estado,
        address.rua
      );

      geocodedPoints.push({
        address,
        coordinates: coords,
      });

      // Delay para respeitar rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Filtrar pontos que não foram geocodificados
    const validPoints = geocodedPoints.filter((p) => p.coordinates !== null) as Array<{
      address: Address;
      coordinates: Coordinates;
    }>;

    if (validPoints.length === 0) {
      throw new Error("Nenhum endereço pôde ser geocodificado");
    }

    // 2. Aplicar algoritmo Nearest Neighbor
    const optimizedPoints = nearestNeighborAlgorithm(validPoints, startPoint);

    // 3. Buscar geometria da rota real pelas ruas
    console.log("Buscando rotas pelas ruas...");
    const routeGeometry: Coordinates[] = [];
    let totalDistance = 0;

    for (let i = 0; i < optimizedPoints.length - 1; i++) {
      const start = optimizedPoints[i].coordinates;
      const end = optimizedPoints[i + 1].coordinates;
      
      // Buscar rota real entre os pontos
      const segmentGeometry = await getRouteGeometry(start, end);
      
      // Adicionar geometria do segmento (evitando duplicar o último ponto)
      if (i === 0) {
        routeGeometry.push(...segmentGeometry);
      } else {
        routeGeometry.push(...segmentGeometry.slice(1));
      }
      
      // Calcular distância do segmento
      const distance = calculateDistance(start, end);
      totalDistance += distance;
      
      // Delay para respeitar rate limits do OSRM
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Estimar tempo: 40 km/h média + 5 minutos por parada
    const estimatedTime = (totalDistance / 40) * 60 + optimizedPoints.length * 5;

    return {
      points: optimizedPoints,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedTime: Math.round(estimatedTime),
      routeGeometry: routeGeometry.length > 0 ? routeGeometry : undefined,
    };
  } catch (error) {
    console.error("Erro ao otimizar rota:", error);
    return null;
  }
}

/**
 * Algoritmo Nearest Neighbor (Vizinho Mais Próximo)
 * Complexidade: O(n²)
 */
function nearestNeighborAlgorithm(
  points: Array<{ address: Address; coordinates: Coordinates }>,
  startPoint?: Coordinates
): RoutePoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return [
      {
        address: points[0].address,
        coordinates: points[0].coordinates,
        order: 1,
      },
    ];
  }

  const unvisited = [...points];
  const route: RoutePoint[] = [];
  let currentPoint: Coordinates;

  // Definir ponto de partida
  if (startPoint) {
    currentPoint = startPoint;
  } else {
    // Se não houver ponto de partida, usar o primeiro endereço
    const firstPoint = unvisited.shift()!;
    route.push({
      address: firstPoint.address,
      coordinates: firstPoint.coordinates,
      order: 1,
    });
    currentPoint = firstPoint.coordinates;
  }

  // Encontrar o vizinho mais próximo iterativamente
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      currentPoint,
      unvisited[0].coordinates
    );

    // Encontrar o ponto não visitado mais próximo
    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(currentPoint, unvisited[i].coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    // Adicionar o ponto mais próximo à rota
    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push({
      address: nearest.address,
      coordinates: nearest.coordinates,
      order: route.length + 1,
    });
    currentPoint = nearest.coordinates;
  }

  return route;
}

/**
 * Gera URL do Google Maps com a rota otimizada
 */
export function generateGoogleMapsUrl(route: OptimizedRoute): string {
  if (route.points.length === 0) return "";

  const origin = route.points[0];
  const destination = route.points[route.points.length - 1];
  const waypoints = route.points.slice(1, -1);

  let url = `https://www.google.com/maps/dir/?api=1`;
  url += `&origin=${origin.coordinates.lat},${origin.coordinates.lng}`;
  url += `&destination=${destination.coordinates.lat},${destination.coordinates.lng}`;

  if (waypoints.length > 0) {
    const waypointsStr = waypoints
      .map((p) => `${p.coordinates.lat},${p.coordinates.lng}`)
      .join("|");
    url += `&waypoints=${waypointsStr}`;
  }

  url += `&travelmode=driving`;

  return url;
}

/**
 * Formata o tempo estimado em horas e minutos
 */
export function formatEstimatedTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins} minutos`;
  } else if (mins === 0) {
    return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  } else {
    return `${hours}h ${mins}min`;
  }
}
