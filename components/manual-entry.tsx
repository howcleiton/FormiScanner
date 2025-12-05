"use client";

import type React from "react";

import { useState } from "react";
import { ArrowLeft, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Address } from "@/types/address";

interface ManualEntryProps {
  onBack: () => void;
  onSave: (address: Address) => void;
}

export default function ManualEntry({ onBack, onSave }: ManualEntryProps) {
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [addressData, setAddressData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [destinatario, setDestinatario] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [qrCode, setQrCode] = useState("");
  const { toast } = useToast();

  const handleBack = () => {
    // Se tem dados do endereço mas não salvou, perguntar
    if (addressData && !numero.trim()) {
      const confirmar = window.confirm(
        "Você buscou um endereço mas não preencheu o número da residência. Deseja sair sem salvar?"
      );
      if (!confirmar) {
        return;
      }
    }
    onBack();
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
  };

  const searchCEP = async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Digite um CEP válido com 8 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const cleanCEP = cep.replace(/\D/g, "");
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCEP}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Não foi possível encontrar o endereço para este CEP.",
          variant: "destructive",
        });
        return;
      }

      setAddressData(data);
      toast({
        title: "Endereço encontrado!",
        description: "Os dados foram preenchidos automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar o endereço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!addressData || !numero.trim()) {
      toast({
        title: "Dados incompletos",
        description:
          "Por favor, busque o CEP e preencha o número da residência.",
        variant: "destructive",
      });
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      cep,
      rua: addressData.logradouro,
      numero: numero.trim(),
      bairro: addressData.bairro,
      cidade: addressData.localidade,
      estado: addressData.uf,
      dataHora: new Date().toISOString(),
      destinatario: destinatario.trim() || undefined,
      numeroPedido: numeroPedido.trim() || undefined,
      qrCode: qrCode.trim() || undefined,
    };

    console.log("[v0] Salvando endereço manual:", address);
    onSave(address);

    toast({
      title: "Endereço salvo!",
      description: "O endereço foi cadastrado com sucesso.",
    });

    // Aguardar um pouco antes de voltar para garantir que o salvamento foi processado
    setTimeout(() => {
      onBack();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] pb-8">
      {/* Header */}
      <div className="bg-[#003366] pt-12 pb-6 px-6 shadow-lg">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#004488]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">
            Adicionar CEP Manualmente
          </h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 max-w-md mx-auto">
        {/* Campo de CEP */}
        <Card className="bg-[#2a2a2a] border-[#00FFFF] border-2 p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">CEP</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cep}
                onChange={handleCEPChange}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1 h-12 px-4 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:border-[#00FFFF] focus:outline-none text-lg"
              />
              <Button
                onClick={searchCEP}
                disabled={isLoading}
                className="h-12 px-6 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#003366]"></div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Dados do Endereço */}
        {addressData && (
          <Card className="bg-[#2a2a2a] border-[#00FFFF] border-2 p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-[#00FFFF]">
              Dados do Endereço
            </h3>

            <div>
              <label className="text-sm text-gray-400">Rua</label>
              <p className="text-white font-medium">{addressData.logradouro}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Nome do Destinatário
              </label>
              <input
                type="text"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Nome completo"
                className="w-full h-12 px-4 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:border-[#00FFFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Número da Residência *
              </label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Digite o número"
                className="w-full h-12 px-4 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:border-[#00FFFF] focus:outline-none"
                autoFocus
              />
              {!numero && (
                <p className="text-yellow-400 text-xs mt-2 animate-pulse">
                  ⚠️ Preencha o número da residência para salvar o endereço
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Nº Pedido
                </label>
                <input
                  type="text"
                  value={numeroPedido}
                  onChange={(e) => setNumeroPedido(e.target.value)}
                  placeholder="Número do pedido"
                  className="w-full h-12 px-4 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:border-[#00FFFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  QR Code
                </label>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Código QR"
                  className="w-full h-12 px-4 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:border-[#00FFFF] focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Bairro</label>
              <p className="text-white font-medium">{addressData.bairro}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Cidade</label>
                <p className="text-white font-medium">
                  {addressData.localidade}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Estado</label>
                <p className="text-white font-medium">{addressData.uf}</p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!numero}
              className="w-full h-12 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold"
            >
              <Check className="w-5 h-5 mr-2" />
              Salvar Endereço
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
