import type { Address, OptimizedRoute, RoutePoint, Coordinates } from "@/types/route";
import { geocodeMultipleAddresses, calculateDistance } from "./geocoding";

/**
 * Otimiza a rota de entrega usando algoritmo Nearest Neighbor
 * @param addresses Lista de endereços para otimizar
 * @returns Rota otimizada com geometria
 */
export async function optimizeRoute(addresses: Address[]): Promise<OptimizedRoute | null> {
  try {
    if (addresses.length === 0) {
      throw new Error("Nenhum endereço fornecido");
    }

    console.log(`🗺️ Otimizando rota para ${addresses.length} endereços`);

    // 1. Geocodificar todos os endereços
    console.log("📍 Geocodificando endereços...");
    const addressData = addresses.map(addr => ({
      cep: addr.cep,
      cidade: addr.cidade,
      estado: addr.estado,
      rua: addr.rua
    }));

    const coordinates = await geocodeMultipleAddresses(addressData);

    // Filtrar endereços que não puderam ser geocodificados
    const validAddresses: Array<{address: Address, coordinates: Coordinates}> = [];
    for (let i = 0; i < addresses.length; i++) {
      if (coordinates[i]) {
        validAddresses.push({
          address: addresses[i],
          coordinates: coordinates[i]!
        });
      }
    }

    if (validAddresses.length < 2) {
      throw new Error("Pelo menos 2 endereços válidos são necessários");
    }

    console.log(`✅ ${validAddresses.length} endereços geocodificados com sucesso`);

    // 2. Otimizar ordem usando Nearest Neighbor
    console.log("🔄 Calculando melhor ordem...");
    const optimizedPoints = nearestNeighborOptimization(validAddresses);

    // 3. Calcular distância total
    let totalDistance = 0;
    for (let i = 0; i < optimizedPoints.length - 1; i++) {
      totalDistance += calculateDistance(
        optimizedPoints[i].coordinates,
        optimizedPoints[i + 1].coordinates
      );
    }

    // 4. Buscar geometria da rota usando Google Maps API
    console.log("🛣️ Buscando rota real pelas ruas...");
    const routeGeometry = await fetchRouteGeometry(optimizedPoints);

    // 5. Calcular tempo estimado (40 km/h + 5 min por parada)
    const estimatedTime = Math.round((totalDistance / 40) * 60) + (optimizedPoints.length * 5);

    const result: OptimizedRoute = {
      points: optimizedPoints,
      totalDistance: Math.round(totalDistance * 10) / 10, // Arredondar para 1 casa decimal
      estimatedTime,
      routeGeometry
    };

    console.log(`✅ Rota otimizada: ${result.totalDistance}km, ${formatEstimatedTime(result.estimatedTime)}`);
    return result;

  } catch (error) {
    console.error("❌ Erro ao otimizar rota:", error);
    return null;
  }
}

/**
 * Algoritmo Nearest Neighbor para otimização de rota
 */
function nearestNeighborOptimization(
  addresses: Array<{address: Address, coordinates: Coordinates}>
): RoutePoint[] {
  if (addresses.length === 0) return [];

  const result: RoutePoint[] = [];
  const remaining = [...addresses];

  // Começar pelo primeiro endereço
  let current = remaining.shift()!;
  result.push({
    address: current.address,
    coordinates: current.coordinates,
    order: 1
  });

  // Adicionar os próximos endereços mais próximos
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(current.coordinates, remaining[0].coordinates);

    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(current.coordinates, remaining[i].coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    result.push({
      address: current.address,
      coordinates: current.coordinates,
      order: result.length + 1
    });
  }

  return result;
}

/**
 * Busca a geometria da rota usando Google Maps Directions API
 */
async function fetchRouteGeometry(points: RoutePoint[]): Promise<Coordinates[] | undefined> {
  try {
    if (points.length < 2) return undefined;

    // Usar API Route do Next.js para evitar problemas de CORS
    const start = points[0].coordinates;
    const end = points[points.length - 1].coordinates;

    const url = `/api/directions?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      if (route.overview_polyline && route.overview_polyline.points) {
        // Decodificar polyline para coordenadas
        return decodePolyline(route.overview_polyline.points);
      }
    }

    return undefined;
  } catch (error) {
    console.error("Erro ao buscar geometria da rota:", error);
    return undefined;
  }
}

/**
 * Decodifica uma polyline do Google Maps para array de coordenadas
 */
function decodePolyline(encoded: string): Coordinates[] {
  const coordinates: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    // Decodificar latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decodificar longitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push({
      lat: lat / 100000,
      lng: lng / 100000
    });
  }

  return coordinates;
}

/**
 * Gera URL do Google Maps com a rota completa
 */
export function generateGoogleMapsUrl(route: OptimizedRoute): string {
  if (route.points.length === 0) return "https://maps.google.com";

  const baseUrl = "https://www.google.com/maps/dir/";

  // Adicionar origem
  const origin = `${route.points[0].coordinates.lat},${route.points[0].coordinates.lng}`;

  // Adicionar destino
  const destination = `${route.points[route.points.length - 1].coordinates.lat},${route.points[route.points.length - 1].coordinates.lng}`;

  // Adicionar waypoints (paradas intermediárias)
  const waypoints = route.points.slice(1, -1)
    .map(point => `${point.coordinates.lat},${point.coordinates.lng}`)
    .join('/');

  let url = `${baseUrl}${origin}/${destination}`;
  if (waypoints) {
    url += `/${waypoints}`;
  }

  // Adicionar parâmetros
  url += "?api=1&travelmode=driving";

  return url;
}

/**
 * Formata tempo estimado em minutos para string legível
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}
