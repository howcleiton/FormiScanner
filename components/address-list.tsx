"use client";

import { useState } from "react";
import { ArrowLeft, Trash2, MapPin, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Address } from "@/types/address";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface AddressListProps {
  addresses: Address[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdate?: (address: Address) => void;
}

export default function AddressList({
  addresses,
  onBack,
  onDelete,
  onUpdate,
}: AddressListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNumero, setEditNumero] = useState("");
  const { toast } = useToast();

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setEditNumero(address.numero);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNumero("");
  };

  const saveEdit = (address: Address) => {
    if (!editNumero.trim()) {
      toast({
        title: "Número inválido",
        description: "Por favor, preencha o número da residência.",
        variant: "destructive",
      });
      return;
    }

    const updatedAddress = {
      ...address,
      numero: editNumero.trim(),
    };

    if (onUpdate) {
      onUpdate(updatedAddress);
      toast({
        title: "Número atualizado!",
        description: "O número da residência foi atualizado com sucesso.",
      });
    }

    setEditingId(null);
    setEditNumero("");
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] pb-8">
      {/* Header */}
      <div className="bg-[#003366] pt-12 pb-6 px-6 shadow-lg">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#004488]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">
            Endereços Cadastrados
          </h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-4 max-w-md mx-auto">
        {addresses.length === 0 ? (
          <Card className="bg-[#2a2a2a] border-[#404040] p-8 text-center">
            <MapPin className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum endereço cadastrado ainda</p>
          </Card>
        ) : (
          addresses.map((address, index) => (
            <Card
              key={address.id}
              className="bg-[#2a2a2a] border-[#404040] p-4 hover:border-[#00FFFF] transition-all animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-[#003366] text-[#00FFFF] text-sm font-bold rounded">
                      {address.cep}
                    </span>
                  </div>

                  {editingId === address.id ? (
                    <div className="space-y-2">
                      <p className="text-white font-medium">{address.rua}</p>
                      <div className="flex items-center gap-2">
                        <label className="text-gray-400 text-sm">Nº:</label>
                        <input
                          type="text"
                          value={editNumero}
                          onChange={(e) => setEditNumero(e.target.value)}
                          className="flex-1 h-10 px-3 bg-[#1a1a1a] border border-[#00FFFF] rounded text-white focus:outline-none"
                          placeholder="Número"
                          autoFocus
                        />
                      </div>
                      <p className="text-gray-400 text-sm">
                        {address.bairro} - {address.cidade}/{address.estado}
                      </p>
                    </div>
                  ) : (
                    <>
                      {address.destinatario && (
                        <p className="text-[#00FFFF] font-semibold text-sm mb-1">
                          👤 {address.destinatario}
                        </p>
                      )}
                      <p className="text-white font-medium">
                        {address.rua}, {address.numero}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {address.bairro} - {address.cidade}/{address.estado}
                      </p>

                      {(address.numeroPedido || address.qrCode) && (
                        <div className="mt-2 pt-2 border-t border-[#404040]">
                          {address.numeroPedido && (
                            <p className="text-gray-400 text-xs">
                              📦 Pedido:{" "}
                              <span className="text-white">
                                {address.numeroPedido}
                              </span>
                            </p>
                          )}
                          {address.qrCode && (
                            <p className="text-gray-400 text-xs mt-1">
                              🔲 QR:{" "}
                              <span className="text-white font-mono text-[10px]">
                                {address.qrCode}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-gray-500 text-xs mt-2">
                        {format(
                          new Date(address.dataHora),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {editingId === address.id ? (
                    <>
                      <Button
                        onClick={() => saveEdit(address)}
                        variant="ghost"
                        size="icon"
                        className="text-green-400 hover:text-green-300 hover:bg-green-950/30"
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => startEdit(address)}
                        variant="ghost"
                        size="icon"
                        className="text-[#00FFFF] hover:text-[#00DDDD] hover:bg-[#003366]/30"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={() => onDelete(address.id)}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
