export interface PixRequest {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  paymentMethod: 'PIX';
  amount: number;
  traceable: boolean;
  items: Array<{
    unitPrice: number;
    title: string;
    quantity: number;
    tangible: boolean;
  }>;
}

export interface PixResponse {
  pixQrCode: string;
  pixCode: string;
  status: string;
  id: string;
}