import { PixResponse } from '../types/pix';

const SECRET_KEY = '31593d3e-f4ea-4937-ad1b-625a5fc647d1';
const API_URL = 'https://pay.rushpayoficial.com/api/v1/transaction.purchase';
const CHECK_STATUS_URL = 'https://pay.rushpayoficial.com/api/v1/transaction.status';

export async function gerarPix(
  name: string,
  email: string,
  cpf: string,
  phone: string,
  amountCentavos: number,
  itemName: string,
  utmQuery?: string
): Promise<PixResponse> {
  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet. Por favor, verifique sua conexão e tente novamente.');
  }

  const requestBody = {
    name,
    email,
    cpf,
    phone,
    paymentMethod: 'PIX',
    amount: amountCentavos,
    traceable: true,
    utmQuery: utmQuery || '',
    items: [
      {
        unitPrice: amountCentavos,
        title: itemName,
        quantity: 1,
        tangible: false
      }
    ]
  };

  try {
    console.log('Enviando requisição PIX:', {
      url: API_URL,
      body: {
        ...requestBody,
        cpf: '***.***.***-**', // Mascarar CPF no log
        phone: '(**) *****-****' // Mascarar telefone no log
      }
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      mode: 'cors',
      body: JSON.stringify(requestBody)
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Resposta completa:', responseText);

    if (!response.ok) {
      if (response.status === 0 || response.status === 404) {
        // Erro CORS ou API não encontrada - usar dados mock para desenvolvimento
        console.warn('API não disponível, usando dados mock para desenvolvimento');
        return generateMockPixResponse();
      } else if (response.status === 403) {
        throw new Error('Acesso negado. Verifique se a chave de API está correta.');
      } else if (response.status === 400) {
        let errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Manter mensagem padrão se não conseguir parsear
        }
        throw new Error(errorMessage);
      } else if (response.status === 500) {
        throw new Error('Erro no processamento do pagamento. Por favor, aguarde alguns minutos e tente novamente. Se o problema persistir, entre em contato com o suporte.');
      } else {
        let errorMessage = 'Erro desconhecido';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || 'Erro desconhecido';
        } catch (e) {
          errorMessage = `Erro ${response.status}`;
        }
        throw new Error(`Erro no servidor: ${errorMessage}`);
      }
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Erro ao processar resposta do servidor. Por favor, tente novamente.');
    }

    if (!data.pixQrCode || !data.pixCode || !data.status || !data.id) {
      console.error('Resposta inválida:', data);
      throw new Error('Resposta incompleta do servidor. Por favor, tente novamente.');
    }

    return {
      pixQrCode: data.pixQrCode,
      pixCode: data.pixCode,
      status: data.status,
      id: data.id
    };
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('Erro de CORS ou servidor indisponível, usando dados mock');
      return generateMockPixResponse();
    }
    
    // Se for erro de CORS, usar dados mock para desenvolvimento
    if (error.message && error.message.includes('CORS')) {
      console.warn('Erro de CORS detectado, usando dados mock');
      return generateMockPixResponse();
    }
    
    throw error;
  }
}

// Função para gerar dados mock do PIX para desenvolvimento
function generateMockPixResponse(): PixResponse {
  const mockPixCode = "00020126580014br.gov.bcb.pix013636c4b4e4-7b8a-4c5d-9e2f-1a3b5c7d9e0f5204000053039865802BR5925SUPER RIFA DESENVOLVIMENTO6009SAO PAULO62070503***6304A1B2";
  
  // Gerar QR Code usando serviço gratuito
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPixCode)}`;
  
  return {
    pixQrCode: qrCodeUrl,
    pixCode: mockPixCode,
    status: 'pending',
    id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

export async function verificarStatusPagamento(transactionId: string): Promise<string> {
  // Se for um ID mock, simular status
  if (transactionId.startsWith('mock_')) {
    return 'pending';
  }
  
  try {
    const response = await fetch(`${CHECK_STATUS_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.status}`);
    }

    const data = await response.json();
    return data.status || 'pending';
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return 'pending'; // Retornar pending em caso de erro
  }
}