"use client";

import { useState, useEffect } from "react";
import { Camera, Edit, FileSpreadsheet, List, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import OCRCamera from "@/components/ocr-camera";
import ManualEntry from "@/components/manual-entry";
import AddressList from "@/components/address-list";
import ExportScreen from "@/components/export-screen";
import RouteMap from "@/components/route-map";
import type { Address } from "@/types/address";

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "ocr" | "manual" | "list" | "export" | "route"
  >("home");
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("formirotas-addresses");
    if (stored) {
      setAddresses(JSON.parse(stored));
    }
  }, []);

  const saveAddress = (address: Address) => {
    const newAddresses = [...addresses, address];
    setAddresses(newAddresses);
    localStorage.setItem("formirotas-addresses", JSON.stringify(newAddresses));
  };

  const deleteAddress = (id: string) => {
    const newAddresses = addresses.filter((addr) => addr.id !== id);
    setAddresses(newAddresses);
    localStorage.setItem("formirotas-addresses", JSON.stringify(newAddresses));
  };

  const updateAddress = (updatedAddress: Address) => {
    const newAddresses = addresses.map((addr) =>
      addr.id === updatedAddress.id ? updatedAddress : addr
    );
    setAddresses(newAddresses);
    localStorage.setItem("formirotas-addresses", JSON.stringify(newAddresses));
  };

  if (currentScreen === "ocr") {
    return (
      <OCRCamera onBack={() => setCurrentScreen("home")} onSave={saveAddress} />
    );
  }

  if (currentScreen === "manual") {
    return (
      <ManualEntry
        onBack={() => setCurrentScreen("home")}
        onSave={saveAddress}
      />
    );
  }

  if (currentScreen === "list") {
    return (
      <AddressList
        addresses={addresses}
        onBack={() => setCurrentScreen("home")}
        onDelete={deleteAddress}
        onUpdate={updateAddress}
      />
    );
  }

  if (currentScreen === "export") {
    return (
      <ExportScreen
        addresses={addresses}
        onBack={() => setCurrentScreen("home")}
      />
    );
  }

  if (currentScreen === "route") {
    return (
      <RouteMap addresses={addresses} onBack={() => setCurrentScreen("home")} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] pb-8 animate-fade-in">
      {/* Header com Logo */}
      <div className="bg-[#003366] pt-12 pb-8 px-6 shadow-lg">
        <img
          src="/logo.png"
          alt="FormiRotas Logo"
          className="w-48 h-auto mx-auto"
        />
      </div>

      {/* Main Content */}
      <div className="px-6 mt-8 space-y-6 max-w-md mx-auto">
        {/* Ler Etiqueta OCR */}
        <Card className="bg-[#003366] border-[#00FFFF] border-2 p-6 hover:shadow-xl hover:shadow-[#00FFFF]/20 transition-all animate-slide-up">
          <Button
            onClick={() => setCurrentScreen("ocr")}
            className="w-full h-24 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold text-xl flex items-center justify-center gap-4 rounded-lg shadow-lg"
          >
            <Camera className="w-8 h-8" />
            Ler Etiqueta (OCR)
          </Button>
        </Card>

        {/* Adicionar Manualmente */}
        <Card
          className="bg-[#2a2a2a] border-[#404040] border p-6 hover:shadow-lg transition-all animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <Button
            onClick={() => setCurrentScreen("manual")}
            className="w-full h-20 bg-[#003366] hover:bg-[#004488] text-white font-semibold text-lg flex items-center justify-center gap-3 rounded-lg"
          >
            <Edit className="w-6 h-6" />
            Adicionar CEP Manualmente
          </Button>
        </Card>

        {/* Lista de Endereços */}
        <Card
          className="bg-[#2a2a2a] border-[#404040] border p-6 hover:shadow-lg transition-all animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <Button
            onClick={() => setCurrentScreen("list")}
            className="w-full h-20 bg-[#333333] hover:bg-[#444444] text-white font-semibold text-lg flex items-center justify-center gap-3 rounded-lg"
          >
            <List className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span>Ver Endereços</span>
              <span className="text-sm text-[#00FFFF] font-normal">
                {addresses.length}{" "}
                {addresses.length === 1 ? "registro" : "registros"}
              </span>
            </div>
          </Button>
        </Card>

        {/* Criar Rota */}
        <Card
          className="bg-[#2a2a2a] border-[#404040] border p-6 hover:shadow-lg transition-all animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          <Button
            onClick={() => setCurrentScreen("route")}
            className="w-full h-20 bg-[#003366] hover:bg-[#004488] text-white font-semibold text-lg flex items-center justify-center gap-3 rounded-lg"
          >
            <Route className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span>Criar Rota de Entrega</span>
              <span className="text-sm text-[#00FFFF] font-normal">
                Otimizar {addresses.length}{" "}
                {addresses.length === 1 ? "endereço" : "endereços"}
              </span>
            </div>
          </Button>
        </Card>

        {/* Exportar */}
        <Card
          className="bg-[#2a2a2a] border-[#404040] border p-6 hover:shadow-lg transition-all animate-slide-up"
          style={{ animationDelay: "400ms" }}
        >
          <Button
            onClick={() => setCurrentScreen("export")}
            className="w-full h-20 bg-[#003366] hover:bg-[#004488] text-white font-semibold text-lg flex items-center justify-center gap-3 rounded-lg"
          >
            <FileSpreadsheet className="w-6 h-6" />
            Exportar para Excel
          </Button>
        </Card>
      </div>
    </div>
  );
}
