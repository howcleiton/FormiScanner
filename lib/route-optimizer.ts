import type { Address, OptimizedRoute, RoutePoint, Coordinates, CurrentLocation } from "@/types/route";
import { geocodeMultipleAddresses, calculateDistance } from "./geocoding";

/**
 * Otimiza a rota de entrega usando algoritmo Nearest Neighbor + Google Maps Optimization
 * @param addresses Lista de endereços para otimizar
 * @returns Rota otimizada com geometria
 */
export async function optimizeRoute(addresses: Address[], currentLocation?: CurrentLocation): Promise<OptimizedRoute | null> {
  try {
    if (addresses.length === 0) {
      throw new Error("Nenhum endereço fornecido");
    }

    const totalPoints = addresses.length + (currentLocation ? 1 : 0);
    console.log(`🗺️ Otimizando rota para ${addresses.length} endereços${currentLocation ? ' + localização atual' : ''}`);

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
    const failedAddresses: Address[] = [];

    for (let i = 0; i < addresses.length; i++) {
      if (coordinates[i]) {
        validAddresses.push({
          address: addresses[i],
          coordinates: coordinates[i]!
        });
      } else {
        failedAddresses.push(addresses[i]);
        console.warn(`⚠️ Não foi possível geocodificar: ${addresses[i].rua}, ${addresses[i].cidade}`);
      }
    }

    if (failedAddresses.length > 0) {
      console.warn(`⚠️ ${failedAddresses.length} endereço(s) não puderam ser geocodificados e serão ignorados`);
    }

    if (validAddresses.length === 0) {
      throw new Error("Nenhum endereço pôde ser geocodificado");
    }

    // Se não tem localização atual, precisa de pelo menos 2 endereços
    if (!currentLocation && validAddresses.length < 2) {
      throw new Error("Pelo menos 2 endereços válidos são necessários para criar uma rota");
    }

    // Se tem localização atual, precisa de pelo menos 1 endereço
    if (currentLocation && validAddresses.length < 1) {
      throw new Error("Pelo menos 1 endereço válido é necessário quando usando localização atual");
    }

    console.log(`✅ ${validAddresses.length} de ${addresses.length} endereços geocodificados com sucesso`);
    if (currentLocation) {
      console.log(`📍 Usando localização atual como ponto de partida: ${currentLocation.coordinates.lat.toFixed(6)}, ${currentLocation.coordinates.lng.toFixed(6)}`);
    }

    // 2. Preparar pontos para otimização
    let pointsToOptimize: Array<{address: Address, coordinates: Coordinates}>;

    if (currentLocation) {
      // Usar localização atual como primeiro ponto
      pointsToOptimize = [
        {
          address: {
            id: 'current-location',
            cep: '',
            rua: 'Localização Atual',
            numero: '',
            bairro: '',
            cidade: 'Localização Atual',
            estado: '',
            dataHora: new Date().toISOString(),
            destinatario: 'Ponto de Partida'
          },
          coordinates: currentLocation.coordinates
        },
        ...validAddresses
      ];
    } else {
      pointsToOptimize = validAddresses;
    }

    // 3. Otimizar ordem inicial usando Nearest Neighbor
    console.log("🔄 Calculando ordem inicial com Nearest Neighbor...");
    let optimizedPoints = nearestNeighborOptimization(pointsToOptimize);

    // 3. Buscar geometria da rota usando Google Maps API (que também otimiza)
    console.log("🛣️ Buscando rota otimizada do Google Maps...");
    const { geometry: routeGeometry, optimizedOrder } = await fetchRouteGeometry(optimizedPoints);

    // 4. Se o Google Maps retornou uma ordem otimizada, aplicar
    if (optimizedOrder && optimizedOrder.length > 0) {
      console.log("🔄 Aplicando ordem otimizada do Google Maps");
      const reorderedPoints: RoutePoint[] = [optimizedPoints[0]]; // Manter origem
      
      // Reordenar waypoints intermediários
      for (const index of optimizedOrder) {
        reorderedPoints.push(optimizedPoints[index + 1]); // +1 porque waypoints começam após a origem
      }
      
      // Adicionar destino
      reorderedPoints.push(optimizedPoints[optimizedPoints.length - 1]);
      
      // Atualizar ordem
      reorderedPoints.forEach((point, idx) => {
        point.order = idx + 1;
      });
      
      optimizedPoints = reorderedPoints;
    }

    // 5. Calcular distância total
    let totalDistance = 0;
    for (let i = 0; i < optimizedPoints.length - 1; i++) {
      totalDistance += calculateDistance(
        optimizedPoints[i].coordinates,
        optimizedPoints[i + 1].coordinates
      );
    }

    // 6. Calcular tempo estimado (40 km/h + 5 min por parada)
    const estimatedTime = Math.round((totalDistance / 40) * 60) + (optimizedPoints.length * 5);

    const result: OptimizedRoute = {
      points: optimizedPoints,
      totalDistance: Math.round(totalDistance * 10) / 10, // Arredondar para 1 casa decimal
      estimatedTime,
      routeGeometry,
      failedAddresses: failedAddresses.length > 0 ? failedAddresses : undefined
    };

    console.log(`✅ Rota otimizada: ${result.totalDistance}km, ${formatEstimatedTime(result.estimatedTime)}`);
    if (failedAddresses.length > 0) {
      console.warn(`⚠️ ${failedAddresses.length} endereço(s) não incluído(s) na rota`);
    }
    
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
async function fetchRouteGeometry(points: RoutePoint[]): Promise<{
  geometry: Coordinates[] | undefined;
  optimizedOrder?: number[];
}> {
  try {
    if (points.length < 2) {
      console.warn('⚠️ Menos de 2 pontos para criar rota');
      return { geometry: undefined };
    }

    console.log(`🛣️ Buscando geometria da rota para ${points.length} pontos`);

    // Usar API Route do Next.js para evitar problemas de CORS
    const start = points[0].coordinates;
    const end = points[points.length - 1].coordinates;
    
    // Waypoints são todos os pontos intermediários
    const waypointCoords = points
      .slice(1, -1)
      .map(p => `${p.coordinates.lat},${p.coordinates.lng}`);

    const params = new URLSearchParams({
      origin: `${start.lat},${start.lng}`,
      destination: `${end.lat},${end.lng}`,
    });

    // Adicionar waypoints se existirem
    if (waypointCoords.length > 0) {
      // Google Maps API tem limite de 25 waypoints
      if (waypointCoords.length > 25) {
        console.warn(`⚠️ Rota tem ${waypointCoords.length} waypoints. Limite é 25. Dividindo em múltiplas rotas...`);
        // Para rotas muito grandes, vamos usar apenas os primeiros 25 waypoints
        const limitedWaypoints = waypointCoords.slice(0, 25).join('|');
        params.append('waypoints', limitedWaypoints);
      } else {
        const waypoints = waypointCoords.join('|');
        params.append('waypoints', waypoints);
        console.log(`📍 Enviando ${waypointCoords.length} waypoints para otimização`);
      }
    }

    const url = `/api/directions?${params.toString()}`;
    console.log('🌐 Chamando API de directions...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status}`);
      return { geometry: undefined };
    }
    
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      console.log('✅ Rota recebida do Google Maps');
      
      // Obter ordem otimizada dos waypoints (se disponível)
      const optimizedOrder = route.waypoint_order;
      if (optimizedOrder && optimizedOrder.length > 0) {
        console.log('🔄 Ordem otimizada recebida:', optimizedOrder);
      }
      
      if (route.overview_polyline && route.overview_polyline.points) {
        // Decodificar polyline para coordenadas
        const geometry = decodePolyline(route.overview_polyline.points);
        console.log(`✅ Geometria decodificada: ${geometry.length} pontos`);
        return { geometry, optimizedOrder };
      }
    } else {
      console.error('❌ Erro na resposta do Google Maps:', data.status, data.error_message);
    }

    return { geometry: undefined };
  } catch (error) {
    console.error("❌ Erro ao buscar geometria da rota:", error);
    return { geometry: undefined };
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
