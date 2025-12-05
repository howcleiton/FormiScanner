"use client";

import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Address } from "@/types/address";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportScreenProps {
  addresses: Address[];
  onBack: () => void;
}

export default function ExportScreen({ addresses, onBack }: ExportScreenProps) {
  const { toast } = useToast();

  const exportToExcel = () => {
    if (addresses.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Cadastre alguns endereços antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para exportação
    const data = addresses.map((address, index) => ({
      Nº: index + 1,
      Destinatário: address.destinatario || "",
      CEP: address.cep,
      Rua: address.rua,
      Número: address.numero,
      Bairro: address.bairro,
      Cidade: address.cidade,
      Estado: address.estado,
      "Nº Pedido": address.numeroPedido || "",
      "QR Code": address.qrCode || "",
      "Data/Hora": format(new Date(address.dataHora), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      }),
    }));

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Endereços");

    // Ajustar largura das colunas
    const maxWidth = 20;
    worksheet["!cols"] = [
      { wch: 5 }, // Nº
      { wch: maxWidth }, // Destinatário
      { wch: 12 }, // CEP
      { wch: maxWidth }, // Rua
      { wch: 8 }, // Número
      { wch: maxWidth }, // Bairro
      { wch: maxWidth }, // Cidade
      { wch: 8 }, // Estado
      { wch: 15 }, // Nº Pedido
      { wch: 25 }, // QR Code
      { wch: 16 }, // Data/Hora
    ];

    // Gerar arquivo
    const fileName = `FormiRotas_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Exportação concluída!",
      description: `Arquivo ${fileName} baixado com sucesso.`,
    });
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
          <h1 className="text-xl font-bold text-white">Exportar para Excel</h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 max-w-md mx-auto">
        <Card className="bg-[#2a2a2a] border-[#00FFFF] border-2 p-8 text-center">
          <FileSpreadsheet className="w-20 h-20 text-[#00FFFF] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {addresses.length}
          </h2>
          <p className="text-gray-400 mb-6">
            {addresses.length === 1
              ? "Registro disponível"
              : "Registros disponíveis"}
          </p>

          <Button
            onClick={exportToExcel}
            disabled={addresses.length === 0}
            className="w-full h-14 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold text-lg"
          >
            <Download className="w-6 h-6 mr-2" />
            Exportar para Excel (.xlsx)
          </Button>
        </Card>

        {/* Prévia da Tabela */}
        {addresses.length > 0 && (
          <Card className="bg-[#2a2a2a] border-[#404040] p-6">
            <h3 className="text-lg font-bold text-[#00FFFF] mb-4">
              Prévia dos Dados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#404040]">
                    <th className="text-left py-2 text-gray-400 font-semibold">
                      Destinatário
                    </th>
                    <th className="text-left py-2 text-gray-400 font-semibold">
                      CEP
                    </th>
                    <th className="text-left py-2 text-gray-400 font-semibold">
                      Cidade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.slice(0, 5).map((address) => (
                    <tr
                      key={address.id}
                      className="border-b border-[#404040]/50"
                    >
                      <td className="py-2 text-white">
                        {address.destinatario || "-"}
                      </td>
                      <td className="py-2 text-white">{address.cep}</td>
                      <td className="py-2 text-white">{address.cidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {addresses.length > 5 && (
                <p className="text-gray-500 text-xs mt-2 text-center">
                  + {addresses.length - 5} registros adicionais
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
