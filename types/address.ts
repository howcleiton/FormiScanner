export interface Address {
  id: string
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  dataHora: string
  destinatario?: string
  numeroPedido?: string
  qrCode?: string
}
