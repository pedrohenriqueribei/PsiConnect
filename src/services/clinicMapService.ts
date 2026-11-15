/**
 * Serviço de visualização de mapas estáticos leves e resolução de geolocalização por CEP
 * Especialmente otimizado para a plataforma Psiconnect, com zero dependências externas pesadas,
 * suporte nativo a modo claro e escuro, cache em memória e fallback algorítmico por faixa de CEP nacional.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export type StaticMapStyle = 'carto-light' | 'carto-dark' | 'carto-voyager' | 'osm';

// Cache em memória de coordenadas por CEP para evitar requisições redundantes
const cepCoordCache = new Map<string, Coordinates>();

// Pre-população com CEPs das unidades modelo
cepCoordCache.set('01414001', { lat: -23.55775, lng: -46.66134 }); // Alameda Santos, 1820 - Jardins, SP
cepCoordCache.set('01414-001', { lat: -23.55775, lng: -46.66134 });
cepCoordCache.set('06454050', { lat: -23.49840, lng: -46.85290 }); // Alphaville, Barueri - SP
cepCoordCache.set('06454-050', { lat: -23.49840, lng: -46.85290 });
cepCoordCache.set('01310100', { lat: -23.56497, lng: -46.65178 }); // Av. Paulista, Bela Vista, SP
cepCoordCache.set('01310-100', { lat: -23.56497, lng: -46.65178 });
cepCoordCache.set('22041001', { lat: -22.96977, lng: -43.18685 }); // Copacabana, RJ
cepCoordCache.set('70070010', { lat: -15.79889, lng: -47.87556 }); // Asa Sul, Brasília - DF

/**
 * Tabela de coordenadas de referência para faixas de CEP brasileiras
 * Usada como fallback ultra-rápido caso a rede esteja instável ou offline.
 */
function getApproximateCoordinatesByCepPrefix(cleanCep: string): Coordinates {
  if (cleanCep.length < 2) {
    return { lat: -23.5505, lng: -46.6333 }; // Marco zero SP default
  }

  const prefix2 = parseInt(cleanCep.slice(0, 2), 10);

  // Faixas regionais dos Correios
  if (prefix2 >= 1 && prefix2 <= 5) return { lat: -23.5575, lng: -46.6608 }; // São Paulo Capital
  if (prefix2 >= 6 && prefix2 <= 9) return { lat: -23.5329, lng: -46.7917 }; // Grande São Paulo
  if (prefix2 >= 11 && prefix2 <= 19) return { lat: -22.9056, lng: -47.0608 }; // SP Interior (Campinas/Santos)
  if (prefix2 >= 20 && prefix2 <= 28) return { lat: -22.9068, lng: -43.1729 }; // Rio de Janeiro
  if (prefix2 === 29) return { lat: -20.3155, lng: -40.3128 }; // Espírito Santo
  if (prefix2 >= 30 && prefix2 <= 39) return { lat: -19.9167, lng: -43.9345 }; // Minas Gerais
  if (prefix2 >= 40 && prefix2 <= 48) return { lat: -12.9777, lng: -38.5016 }; // Bahia
  if (prefix2 === 49) return { lat: -10.9472, lng: -37.0731 }; // Sergipe
  if (prefix2 >= 50 && prefix2 <= 56) return { lat: -8.0476, lng: -34.8770 }; // Pernambuco
  if (prefix2 === 57) return { lat: -9.6658, lng: -35.7350 }; // Alagoas
  if (prefix2 === 58) return { lat: -7.1150, lng: -34.8631 }; // Paraíba
  if (prefix2 === 59) return { lat: -5.7945, lng: -35.2110 }; // Rio Grande do Norte
  if (prefix2 >= 60 && prefix2 <= 63) return { lat: -3.7172, lng: -38.5434 }; // Ceará
  if (prefix2 === 64) return { lat: -5.0920, lng: -42.8038 }; // Piauí
  if (prefix2 === 65) return { lat: -2.5307, lng: -44.3068 }; // Maranhão
  if (prefix2 >= 66 && prefix2 <= 68) return { lat: -1.4558, lng: -48.5044 }; // Pará / Amapá
  if (prefix2 === 69) return { lat: -3.1190, lng: -60.0217 }; // Amazonas / Roraima / Acre
  if (prefix2 >= 70 && prefix2 <= 73) return { lat: -15.7975, lng: -47.8919 }; // Distrito Federal
  if (prefix2 >= 74 && prefix2 <= 76) return { lat: -16.6869, lng: -49.2648 }; // Goiás / Tocantins
  if (prefix2 === 77) return { lat: -10.1844, lng: -48.3336 }; // Tocantins
  if (prefix2 === 78) return { lat: -15.6014, lng: -56.0979 }; // Mato Grosso
  if (prefix2 === 79) return { lat: -20.4697, lng: -54.6201 }; // Mato Grosso do Sul
  if (prefix2 >= 80 && prefix2 <= 87) return { lat: -25.4284, lng: -49.2733 }; // Paraná
  if (prefix2 >= 88 && prefix2 <= 89) return { lat: -27.5954, lng: -48.5480 }; // Santa Catarina
  if (prefix2 >= 90 && prefix2 <= 99) return { lat: -30.0346, lng: -51.2177 }; // Rio Grande do Sul

  return { lat: -23.5505, lng: -46.6333 };
}

/**
 * Consulta de alta precisão por CEP via OpenStreetMap Nominatim
 * com timeout seguro e fallback progressivo.
 */
export async function resolveCoordinatesFromCep(
  cep: string,
  fallbackAddress?: { street?: string; city?: string; state?: string }
): Promise<Coordinates> {
  const clean = (cep || '').replace(/\D/g, '');
  if (!clean) {
    return { lat: -23.55775, lng: -46.66134 };
  }

  // 1. Verifica cache local
  if (cepCoordCache.has(clean)) {
    return cepCoordCache.get(clean)!;
  }

  // 2. Consulta Nominatim com postalcode
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const queryUrl = `https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=brazil&format=json&limit=1`;
    const res = await fetch(queryUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const coords: Coordinates = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        cepCoordCache.set(clean, coords);
        return coords;
      }
    }
  } catch (err) {
    // Network timeout or offline, continue to fallback address query or prefix
  }

  // 3. Fallback: Se houver endereço textual (rua, cidade, estado)
  if (fallbackAddress?.street && fallbackAddress?.city) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const query = encodeURIComponent(`${fallbackAddress.street}, ${fallbackAddress.city}, ${fallbackAddress.state || 'Brasil'}`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const coords: Coordinates = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          cepCoordCache.set(clean, coords);
          return coords;
        }
      }
    } catch {
      // Ignora erro e usa estimativa por CEP
    }
  }

  // 4. Fallback imediato: aproximação determinística pela malha postal
  const approx = getApproximateCoordinatesByCepPrefix(clean);
  cepCoordCache.set(clean, approx);
  return approx;
}

/**
 * Converte coordenadas (lat, lng) e zoom em coordenadas de ladrilhos (tiles) Slippy Map
 * e calcula os offsets em pixels dentro do ladrilho para posicionamento milimétrico do pino.
 */
export function latLngToTileInfo(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const exactX = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const exactY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const tileX = Math.floor(exactX);
  const tileY = Math.floor(exactY);

  const subPixelX = (exactX - tileX) * 256;
  const subPixelY = (exactY - tileY) * 256;

  return {
    tileX,
    tileY,
    exactX,
    exactY,
    subPixelX,
    subPixelY,
    zoom,
  };
}

/**
 * Retorna a URL do ladrilho (tile) correspondente ao estilo escolhido
 */
export function getTileUrl(x: number, y: number, z: number, style: StaticMapStyle): string {
  // Garantir limites no eixo Y
  const maxTile = 2 ** z;
  const normalizedY = Math.max(0, Math.min(maxTile - 1, y));
  const normalizedX = ((x % maxTile) + maxTile) % maxTile;

  switch (style) {
    case 'carto-light':
      return `https://a.basemaps.cartocdn.com/light_all/${z}/${normalizedX}/${normalizedY}.png`;
    case 'carto-dark':
      return `https://a.basemaps.cartocdn.com/dark_all/${z}/${normalizedX}/${normalizedY}.png`;
    case 'carto-voyager':
      return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${normalizedX}/${normalizedY}.png`;
    case 'osm':
    default:
      return `https://tile.openstreetmap.org/${z}/${normalizedX}/${normalizedY}.png`;
  }
}

/**
 * Gera links diretos para os principais aplicativos de GPS e mobilidade
 */
export function generateNavigationLinks(params: {
  tradeName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}) {
  const fullAddress = `${params.street}, ${params.number}, ${params.neighborhood}, ${params.city} - ${params.state}, ${params.zipCode}`;
  const query = encodeURIComponent(`${params.tradeName}, ${fullAddress}`);
  const destinationQuery = encodeURIComponent(fullAddress);

  const latLngQuery = params.lat && params.lng ? `${params.lat},${params.lng}` : '';

  return {
    googleMaps: latLngQuery
      ? `https://www.google.com/maps/search/?api=1&query=${latLngQuery}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`,
    googleMapsDirections: latLngQuery
      ? `https://www.google.com/maps/dir/?api=1&destination=${latLngQuery}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`,
    waze: latLngQuery
      ? `https://waze.com/ul?ll=${params.lat},${params.lng}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`,
    uber: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(
      `${params.tradeName}, ${params.street}, ${params.number}`
    )}${params.lat && params.lng ? `&dropoff[latitude]=${params.lat}&dropoff[longitude]=${params.lng}` : ''}`,
    appleMaps: latLngQuery
      ? `https://maps.apple.com/?ll=${params.lat},${params.lng}&q=${encodeURIComponent(params.tradeName)}`
      : `https://maps.apple.com/?q=${encodeURIComponent(`${params.tradeName}, ${fullAddress}`)}`,
  };
}
