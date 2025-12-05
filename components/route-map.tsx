"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Route as RouteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Address } from "@/types/address";
import type { OptimizedRoute } from "@/types/route";
import {
  optimizeRoute,
  generateGoogleMapsUrl,
  formatEstimatedTime,
} from "@/lib/route-optimizer";
import dynamic from "next/dynamic";

// Importar Leaflet dinamicamente para evitar problemas de SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

interface RouteMapProps {
  addresses: Address[];
  onBack: () => void;
}

export default function RouteMap({ addresses, onBack }: RouteMapProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(
    null
  );
  const [mapReady, setMapReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Marcar mapa como pronto
    if (typeof window !== "undefined") {
      setMapReady(true);
    }
  }, []);

  const handleOptimizeRoute = async () => {
    if (addresses.length === 0) {
      toast({
        title: "Nenhum endereço",
        description: "Adicione endereços antes de criar uma rota.",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    toast({
      title: "Otimizando rota...",
      description: "Isso pode levar alguns segundos.",
    });

    try {
      const route = await optimizeRoute(addresses);

      if (!route) {
        throw new Error("Não foi possível otimizar a rota");
      }

      setOptimizedRoute(route);
      toast({
        title: "Rota otimizada!",
        description: `${route.points.length} paradas organizadas.`,
      });
    } catch (error) {
      console.error("Erro ao otimizar rota:", error);
      toast({
        title: "Erro",
        description: "Não foi possível otimizar a rota. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOpenInGoogleMaps = () => {
    if (!optimizedRoute) return;

    const url = generateGoogleMapsUrl(optimizedRoute);
    window.open(url, "_blank");

    toast({
      title: "Abrindo Google Maps",
      description: "A rota será aberta em uma nova aba.",
    });
  };

  // Centro do Brasil como fallback
  const defaultCenter: [number, number] = [-15.7801, -47.9292];
  const mapCenter: [number, number] = optimizedRoute
    ? [
        optimizedRoute.points[0].coordinates.lat,
        optimizedRoute.points[0].coordinates.lng,
      ]
    : defaultCenter;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] pb-8">
      {/* Header */}
      <div className="bg-[#003366] pt-12 pb-6 px-6 shadow-lg">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#004488]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Rota de Entrega</h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 max-w-6xl mx-auto">
        {/* Informações e Controles */}
        <Card className="bg-[#2a2a2a] border-[#00FFFF] border-2 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#00FFFF] mb-2">
                {addresses.length}{" "}
                {addresses.length === 1 ? "Endereço" : "Endereços"} Cadastrados
              </h2>
              {optimizedRoute && (
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    <span className="text-white font-semibold">
                      Distância Total:
                    </span>{" "}
                    {optimizedRoute.totalDistance} km
                  </p>
                  <p className="text-gray-400">
                    <span className="text-white font-semibold">
                      Tempo Estimado:
                    </span>{" "}
                    {formatEstimatedTime(optimizedRoute.estimatedTime)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {!optimizedRoute ? (
                <Button
                  onClick={handleOptimizeRoute}
                  disabled={isOptimizing || addresses.length === 0}
                  className="flex-1 md:flex-none h-12 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold"
                >
                  {isOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#003366] mr-2"></div>
                      Otimizando...
                    </>
                  ) : (
                    <>
                      <RouteIcon className="w-5 h-5 mr-2" />
                      Criar Rota Otimizada
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleOpenInGoogleMaps}
                    className="flex-1 md:flex-none h-12 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Abrir no Google Maps
                  </Button>
                  <Button
                    onClick={() => setOptimizedRoute(null)}
                    className="h-12 bg-[#333333] hover:bg-[#444444] text-white border border-[#404040]"
                  >
                    Nova Rota
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Mapa */}
        {mapReady && optimizedRoute && (
          <Card className="bg-[#2a2a2a] border-[#404040] p-4 overflow-hidden">
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marcadores */}
                {optimizedRoute.points.map((point) => (
                  <Marker
                    key={point.address.id}
                    position={[point.coordinates.lat, point.coordinates.lng]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-[#003366] mb-1">
                          Parada {point.order}
                        </p>
                        {point.address.destinatario && (
                          <p className="font-semibold">
                            {point.address.destinatario}
                          </p>
                        )}
                        <p>
                          {point.address.rua}, {point.address.numero}
                        </p>
                        <p>
                          {point.address.bairro} - {point.address.cidade}/
                          {point.address.estado}
                        </p>
                        <p className="text-gray-600">
                          CEP: {point.address.cep}
                        </p>
                        {point.address.numeroPedido && (
                          <p className="text-gray-600 mt-1">
                            Pedido: {point.address.numeroPedido}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Linha da rota pelas ruas */}
                {optimizedRoute.routeGeometry &&
                optimizedRoute.routeGeometry.length > 0 ? (
                  <Polyline
                    positions={optimizedRoute.routeGeometry.map((coord) => [
                      coord.lat,
                      coord.lng,
                    ])}
                    color="#00FFFF"
                    weight={4}
                    opacity={0.8}
                  />
                ) : (
                  // Fallback: linha reta entre pontos
                  <Polyline
                    positions={optimizedRoute.points.map((p) => [
                      p.coordinates.lat,
                      p.coordinates.lng,
                    ])}
                    color="#00FFFF"
                    weight={3}
                    opacity={0.7}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>
            </div>
          </Card>
        )}

        {/* Lista de Paradas */}
        {optimizedRoute && (
          <Card className="bg-[#2a2a2a] border-[#404040] p-6">
            <h3 className="text-lg font-bold text-[#00FFFF] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ordem de Entrega
            </h3>
            <div className="space-y-3">
              {optimizedRoute.points.map((point) => (
                <div
                  key={point.address.id}
                  className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040] hover:border-[#00FFFF] transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#00FFFF] rounded-full flex items-center justify-center">
                      <span className="text-[#003366] font-bold text-lg">
                        {point.order}
                      </span>
                    </div>
                    <div className="flex-1">
                      {point.address.destinatario && (
                        <p className="text-[#00FFFF] font-semibold mb-1">
                          {point.address.destinatario}
                        </p>
                      )}
                      <p className="text-white font-medium">
                        {point.address.rua}, {point.address.numero}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {point.address.bairro} - {point.address.cidade}/
                        {point.address.estado}
                      </p>
                      <p className="text-gray-500 text-sm">
                        CEP: {point.address.cep}
                      </p>
                      {point.address.numeroPedido && (
                        <p className="text-gray-400 text-sm mt-1">
                          📦 Pedido: {point.address.numeroPedido}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mensagem quando não há endereços */}
        {addresses.length === 0 && (
          <Card className="bg-[#2a2a2a] border-[#404040] p-8 text-center">
            <MapPin className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Nenhum endereço cadastrado</p>
            <p className="text-gray-500 text-sm">
              Adicione endereços para criar uma rota de entrega
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
