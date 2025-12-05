export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RoutePoint {
  address: Address;
  coordinates: Coordinates;
  order: number;
}

export interface OptimizedRoute {
  points: RoutePoint[];
  totalDistance: number;
  estimatedTime: number;
  routeGeometry?: Coordinates[]; // Coordenadas da rota pelas ruas
}

export interface Address {
  id: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  dataHora: string;
  destinatario?: string;
  numeroPedido?: string;
  qrCode?: string;
}
