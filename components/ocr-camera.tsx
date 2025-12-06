"use client";

import type React from "react";

import { useState, useRef } from "react";
import { ArrowLeft, Camera, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";
import PaddleOCR from "paddleocr-browser";
import type { Address } from "@/types/address";

interface OCRCameraProps {
  onBack: () => void;
  onSave: (address: Address) => void;
}

export default function OCRCamera({ onBack, onSave }: OCRCameraProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedCEP, setDetectedCEP] = useState("");
  const [addressData, setAddressData] = useState<any>(null);
  const [numero, setNumero] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [showCEPEdit, setShowCEPEdit] = useState(false);
  const [editableCEP, setEditableCEP] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [qrCode, setQrCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleBack = () => {
    // Se tem dados do endereço mas não salvou, perguntar
    if (addressData && !numero.trim()) {
      const confirmar = window.confirm(
        "Você detectou um endereço mas não preencheu o número da residência. Deseja sair sem salvar?"
      );
      if (!confirmar) {
        return;
      }
    }
    onBack();
  };

  const extractCEP = (text: string): string => {
    console.log("[v0] Texto OCR recebido:", text);

    // Limpa o texto mantendo apenas números e hífens
    const lines = text.split("\n");

    // Procura por CEP em cada linha
    for (const line of lines) {
      // Padrão 1: XXXXX-XXX ou XXXXX XXX ou XXXXXXXX
      const pattern1 = /(\d{5}[-\s]?\d{3})/g;
      // Padrão 2: CEP seguido de números
      const pattern2 = /CEP[:\s]*(\d{5}[-\s]?\d{3})/gi;

      let match = line.match(pattern2);
      if (match && match[1]) {
        const cep = match[1].replace(/\D/g, "");
        if (cep.length === 8) {
          const formattedCEP = cep.replace(/(\d{5})(\d{3})/, "$1-$2");
          console.log("[v0] CEP encontrado (padrão 2):", formattedCEP);
          return formattedCEP;
        }
      }

      match = line.match(pattern1);
      if (match) {
        const cep = match[0].replace(/\D/g, "");
        if (cep.length === 8) {
          const formattedCEP = cep.replace(/(\d{5})(\d{3})/, "$1-$2");
          console.log("[v0] CEP encontrado (padrão 1):", formattedCEP);
          return formattedCEP;
        }
      }
    }

    // Última tentativa: procurar qualquer sequência de 8 dígitos consecutivos
    const allDigits = text.replace(/\D/g, "");
    console.log("[v0] Todos os dígitos encontrados:", allDigits);

    // Procurar por 8 dígitos consecutivos que pareçam um CEP válido
    const matches = allDigits.match(/\d{8}/g);
    if (matches && matches.length > 0) {
      // Pegar o primeiro que pareça um CEP (começando com 0-9)
      for (const match of matches) {
        const formattedCEP = match.replace(/(\d{5})(\d{3})/, "$1-$2");
        console.log("[v0] CEP encontrado (8 dígitos):", formattedCEP);
        return formattedCEP;
      }
    }

    console.log("[v0] Nenhum CEP encontrado");
    return "";
  };

  const extractAdditionalInfo = (text: string) => {
    console.log("[v0] Extraindo informações adicionais...");

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Extrair nome do destinatário - procurar linha após "DESTINATARIO"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      // Se encontrar "DESTINATARIO", pegar a próxima linha que seja um nome
      if (upper.includes("DESTINAT")) {
        // Procurar nas próximas 3 linhas
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j].trim();
          // Verificar se é um nome (tem letras, não é muito curto, não tem muitos números)
          if (nextLine.length > 3 && nextLine.length < 50) {
            const letras = (nextLine.match(/[A-Za-zÀ-ÿ]/g) || []).length;
            const numeros = (nextLine.match(/\d/g) || []).length;

            // Nome deve ter mais letras que números
            if (letras > 3 && letras > numeros) {
              console.log("[v0] Destinatário encontrado:", nextLine);
              setDestinatario(nextLine);
              break;
            }
          }
        }
        break;
      }
    }

    // Extrair número do pedido - procurar "Pedido:" ou linha após "CEP:"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Padrão 1: "CEP: 12345-678 Pedido: XXXXX"
      const pedidoInLine = line.match(/Pedido[:\s]+([A-Z0-9]+)/i);
      if (pedidoInLine && pedidoInLine[1]) {
        console.log(
          "[v0] Número do pedido encontrado (padrão label):",
          pedidoInLine[1]
        );
        setNumeroPedido(pedidoInLine[1]);
        break;
      }

      // Padrão 2: Procurar sequência alfanumérica após "Pedido"
      if (line.toUpperCase().includes("PEDIDO")) {
        // Procurar na mesma linha ou próximas linhas
        const match = line.match(/[A-Z0-9]{8,}/);
        if (match) {
          console.log(
            "[v0] Número do pedido encontrado (mesma linha):",
            match[0]
          );
          setNumeroPedido(match[0]);
          break;
        }
      }
    }

    // Extrair QR Code - procurar padrão BR seguido de números/letras
    const brPattern = /BR[0-9]{10,}[A-Z0-9]*/gi;
    const brMatch = text.match(brPattern);
    if (brMatch && brMatch.length > 0) {
      const qr = brMatch[0];
      console.log("[v0] QR Code encontrado (padrão BR):", qr);
      setQrCode(qr);
    } else {
      // Fallback: procurar sequências alfanuméricas longas
      const qrPattern = /[A-Z0-9]{15,}/g;
      const qrMatches = text.match(qrPattern);
      if (qrMatches && qrMatches.length > 0) {
        const qrCandidates = qrMatches.filter(
          (m) => /[A-Z]/.test(m) && /\d/.test(m)
        );
        if (qrCandidates.length > 0) {
          const qr = qrCandidates.sort((a, b) => b.length - a.length)[0];
          console.log("[v0] QR Code encontrado:", qr);
          setQrCode(qr);
        }
      }
    }
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCapturedImage(imageUrl);
      setDetectedCEP("");
      setAddressData(null);
      setNumero("");
      setOcrText("");
      setDestinatario("");
      setNumeroPedido("");
      setQrCode("");
    };

    reader.readAsDataURL(file);
  };

  const processImage = async (): Promise<void> => {
    if (!capturedImage) return;

    setIsProcessing(true);
    console.log("[v0] Iniciando processamento OCR...");

    try {
      let text = "";
      let ocrEngine = "";

      // Tentar PaddleOCR primeiro (mais preciso)
      try {
        console.log("[v0] Tentando PaddleOCR...");
        const paddleResult = await PaddleOCR.recognize(capturedImage);
        text = paddleResult.text;
        ocrEngine = "PaddleOCR";
        console.log("[v0] PaddleOCR sucesso - Texto extraído:", text);
      } catch (paddleError) {
        console.warn("[v0] PaddleOCR falhou, tentando Tesseract:", paddleError);

        // Fallback para Tesseract
        console.log("[v0] Usando Tesseract como fallback...");
        const tesseractResult = await Tesseract.recognize(
          capturedImage,
          "por",
          {
            logger: (m) => {
              if (m.status === "recognizing text") {
                console.log(
                  "[v0] Progresso Tesseract:",
                  Math.round(m.progress * 100) + "%"
                );
              }
            },
          }
        );

        text = tesseractResult.data.text;
        ocrEngine = "Tesseract";
        console.log("[v0] Tesseract sucesso - Texto extraído:", text);
      }

      console.log(`[v0] Engine OCR usado: ${ocrEngine}`);
      setOcrText(text);

      // Extrair informações adicionais
      extractAdditionalInfo(text);

      const cep = extractCEP(text);

      if (cep) {
        console.log("[v0] CEP extraído:", cep);
        setDetectedCEP(cep);

        // Aguardar um pouco para garantir que o estado foi atualizado
        await new Promise((resolve) => setTimeout(resolve, 100));

        await fetchAddress(cep);

        toast({
          title: "CEP detectado!",
          description: `CEP ${cep} encontrado na imagem.`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Tente tirar uma foto mais próxima e nítida do CEP.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] Erro no OCR:", error);
      toast({
        title: "Erro no OCR",
        description: "Não foi possível processar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAddress = async (cep: string) => {
    try {
      const cleanCEP = cep.replace(/\D/g, "");
      console.log("[v0] Buscando endereço para CEP:", cleanCEP);

      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCEP}/json/`
      );

      console.log("[v0] Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[v0] Dados recebidos da API:", JSON.stringify(data));

      // Verificar se a API retornou erro
      if (data.erro === true || data.erro === "true") {
        console.log("[v0] API retornou erro - CEP não encontrado");
        setShowCEPEdit(true);
        setEditableCEP(cep);
        toast({
          title: "CEP não encontrado",
          description:
            "O CEP detectado pode estar incorreto. Você pode corrigi-lo manualmente.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se os dados essenciais existem
      if (!data.logradouro && !data.bairro && !data.localidade) {
        console.log("[v0] Dados incompletos recebidos da API");
        toast({
          title: "Dados incompletos",
          description: "O CEP foi encontrado mas os dados estão incompletos.",
          variant: "destructive",
        });
        return;
      }

      console.log("[v0] Setando addressData com:", data);
      setAddressData(data);
      console.log("[v0] addressData foi setado! Estado atual:", data);

      // Forçar re-render
      setTimeout(() => {
        console.log("[v0] Verificando se addressData persiste...");
      }, 100);
    } catch (error) {
      console.error("[v0] Erro ao buscar CEP:", error);
      toast({
        title: "Erro",
        description:
          "Não foi possível buscar o endereço. Verifique sua conexão.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (!addressData || !numero.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha o número da residência.",
        variant: "destructive",
      });
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      cep: detectedCEP,
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

    console.log("[v0] Salvando endereço:", address);
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
            Leitura OCR de Etiqueta
          </h1>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 max-w-md mx-auto">
        {!capturedImage ? (
          <Card className="bg-[#2a2a2a] border-[#00FFFF] border-2 p-8 text-center">
            <Camera className="w-16 h-16 text-[#00FFFF] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Capturar Etiqueta
            </h2>
            <p className="text-gray-400 mb-6">
              Tire uma foto da etiqueta com o CEP bem visível
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-14 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold text-lg"
            >
              <Camera className="w-6 h-6 mr-2" />
              Tirar Foto
            </Button>
          </Card>
        ) : (
          <>
            {/* Imagem Capturada */}
            <Card className="bg-[#2a2a2a] border-[#404040] p-4">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Etiqueta capturada"
                className="w-full rounded-lg"
              />
            </Card>

            {!isProcessing && !addressData && (
              <Button
                onClick={processImage}
                className="w-full h-14 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold text-lg"
              >
                <Upload className="w-6 h-6 mr-2" />
                Processar Imagem
              </Button>
            )}

            {isProcessing && (
              <Card className="bg-[#2a2a2a] border-[#00FFFF] p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFFF] mx-auto mb-4"></div>
                <p className="text-white font-semibold">
                  Processando imagem...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Extraindo texto da etiqueta
                </p>
              </Card>
            )}

            {ocrText && !detectedCEP && !isProcessing && (
              <Card className="bg-[#2a2a2a] border-[#ff6b6b] border-2 p-4">
                <h4 className="text-sm font-semibold text-[#ff6b6b] mb-2">
                  Texto extraído (para debug):
                </h4>
                <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {ocrText}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Se o CEP está na imagem mas não foi detectado, tente uma foto
                  mais nítida e próxima.
                </p>
              </Card>
            )}

            {/* Correção manual do CEP */}
            {showCEPEdit && !addressData && !isProcessing && (
              <Card className="bg-[#2a2a2a] border-yellow-500 border-2 p-6 space-y-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">
                  ⚠️ CEP não encontrado
                </h4>
                <p className="text-gray-400 text-sm">
                  O CEP detectado pode estar incorreto. Corrija-o manualmente:
                </p>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    CEP Detectado:
                  </label>
                  <input
                    type="text"
                    value={editableCEP}
                    onChange={(e) => {
                      const formatted = e.target.value
                        .replace(/\D/g, "")
                        .replace(/(\d{5})(\d)/, "$1-$2")
                        .slice(0, 9);
                      setEditableCEP(formatted);
                    }}
                    placeholder="00000-000"
                    className="w-full h-12 px-4 bg-[#1a1a1a] border border-yellow-500 rounded-lg text-white text-lg font-semibold focus:border-[#00FFFF] focus:outline-none"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (editableCEP.replace(/\D/g, "").length === 8) {
                      setShowCEPEdit(false);
                      setDetectedCEP(editableCEP);
                      await fetchAddress(editableCEP);
                    } else {
                      toast({
                        title: "CEP inválido",
                        description: "Digite um CEP válido com 8 dígitos.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full h-12 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold"
                  disabled={editableCEP.replace(/\D/g, "").length !== 8}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Buscar Endereço
                </Button>
              </Card>
            )}

            {addressData && (
              <Card className="bg-[#2a2a2a] border-[#00FFFF] border-2 p-6 space-y-4">
                <h3 className="text-lg font-bold text-[#00FFFF]">
                  Endereço Detectado
                </h3>

                <div>
                  <label className="text-sm text-gray-400">CEP</label>
                  <p className="text-white font-semibold">{detectedCEP}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Rua</label>
                  <p className="text-white">{addressData.logradouro}</p>
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
                  <p className="text-white">{addressData.bairro}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Cidade</label>
                    <p className="text-white">{addressData.localidade}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Estado</label>
                    <p className="text-white">{addressData.uf}</p>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full h-12 bg-[#00FFFF] hover:bg-[#00DDDD] text-[#003366] font-bold"
                  disabled={!numero}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Salvar Endereço
                </Button>
              </Card>
            )}

            <Button
              onClick={() => {
                setCapturedImage(null);
                setDetectedCEP("");
                setAddressData(null);
                setNumero("");
                setOcrText("");
                setDestinatario("");
                setNumeroPedido("");
                setQrCode("");
              }}
              className="w-full h-12 bg-[#333333] hover:bg-[#444444] text-white border border-[#404040]"
            >
              Tirar Nova Foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
