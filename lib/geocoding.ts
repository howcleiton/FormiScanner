import type { Coordinates } from "@/types/route";

/**
 * Converte um CEP brasileiro em coordenadas geográficas
 * Usa a API do Nominatim (OpenStreetMap) - gratuita e sem necessidade de API key
 */
export async function geocodeCEP(
  cep: string,
  cidade: string,
  estado: string,
  rua?: string
): Promise<Coordinates | null> {
  try {
    const cleanCEP = cep.replace(/\D/g, "");

    // Tenta primeiro com o endereço completo se tiver rua
    if (rua) {
      const fullAddress = `${rua}, ${cidade}, ${estado}, ${cleanCEP}, Brasil`;
      const coords = await searchAddress(fullAddress);
      if (coords) return coords;
    }

    // Fallback: busca apenas por CEP e cidade
    const addressQuery = `${cleanCEP}, ${cidade}, ${estado}, Brasil`;
    const coords = await searchAddress(addressQuery);
    if (coords) return coords;

    // Último fallback: busca apenas pela cidade
    const cityQuery = `${cidade}, ${estado}, Brasil`;
    return await searchAddress(cityQuery);
  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
    return null;
  }
}

async function searchAddress(query: string): Promise<Coordinates | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=br`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "FormiRotas App",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Erro na busca de endereço:", error);
    return null;
  }
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * Retorna a distância em quilômetros
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Geocodifica múltiplos endereços com delay para respeitar rate limits
 */
export async function geocodeMultipleAddresses(
  addresses: Array<{
    cep: string;
    cidade: string;
    estado: string;
    rua: string;
  }>
): Promise<Array<Coordinates | null>> {
  const results: Array<Coordinates | null> = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    console.log(`📍 Geocodificando ${i + 1}/${addresses.length}: ${address.rua}, ${address.cidade}`);
    
    // Tentar geocodificar com retry
    let coords = await geocodeCEPWithRetry(
      address.cep,
      address.cidade,
      address.estado,
      address.rua
    );
    
    results.push(coords);
    
    if (coords) {
      console.log(`✅ Sucesso: ${address.rua}, ${address.cidade}`);
    } else {
      console.error(`❌ Falha ao geocodificar: ${address.rua}, ${address.cidade}`);
    }

    // Delay de 500ms entre requisições para respeitar rate limits (reduzido de 1s)
    if (i < addresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Geocodifica um endereço com retry em caso de falha
 */
async function geocodeCEPWithRetry(
  cep: string,
  cidade: string,
  estado: string,
  rua?: string,
  maxRetries: number = 2
): Promise<Coordinates | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const coords = await geocodeCEP(cep, cidade, estado, rua);
      if (coords) return coords;
      
      // Se não encontrou, tentar novamente após um delay
      if (attempt < maxRetries) {
        console.log(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt + 1}:`, error);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  
  return null;
}
