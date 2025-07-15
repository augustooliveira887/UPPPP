import { PixResponse } from '../types/pix';

const PIX_SECRET_KEY = '31593d3e-f4ea-4937-ad1b-625a5fc647d1';
const PIX_API_URL = 'https://pay.rushpayoficial.com/api/v1/transaction.purchase';
const PIX_CHECK_STATUS_URL = 'https://pay.rushpayoficial.com/api/v1/transaction.status';

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
      url: PIX_API_URL,
      body: {
        ...requestBody,
        cpf: '***.***.***-**', // Mascarar CPF no log
        phone: '(**) *****-****' // Mascarar telefone no log
      }
    });

    const response = await fetch(PIX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PIX_SECRET_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Status da resposta PIX:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API PIX:", errorText);
      
      if (response.status === 400) {
        let errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Manter mensagem padrão se não conseguir parsear
        }
        throw new Error(errorMessage);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Erro de autenticação. Verifique se a chave de API está correta.');
      } else if (response.status === 500) {
        throw new Error('Erro no servidor de pagamento. Por favor, aguarde alguns minutos e tente novamente.');
      } else {
        throw new Error(`Erro ao gerar PIX: ${response.status}`);
      }
    }

    const responseText = await response.text();
    console.log('Resposta completa PIX:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Erro ao parsear resposta JSON:', e);
      throw new Error('Erro ao processar resposta do servidor. Por favor, tente novamente.');
    }

    if (!data.pixQrCode || !data.pixCode || !data.id) {
      console.error('Resposta inválida da API PIX:', data);
      throw new Error('Resposta inválida do servidor PIX.');
    }

    console.log('PIX gerado com sucesso:', {
      id: data.id,
      status: data.status,
      hasQrCode: !!data.pixQrCode,
      hasPixCode: !!data.pixCode
    });

    return {
      pixQrCode: data.pixQrCode,
      pixCode: data.pixCode,
      status: data.status || 'pending',
      id: data.id
    };

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    
    // Se for erro de rede/CORS, mostrar mensagem específica
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    
    // Re-throw outros erros
    throw error;
  }
}

export async function verificarStatusPagamento(transactionId: string): Promise<string> {
  try {
    console.log('Verificando status do pagamento:', transactionId);
    
    const response = await fetch(`${PIX_CHECK_STATUS_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': PIX_SECRET_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Aviso ao verificar status: ${response.status}`);
      return 'pending';
    }

    const data = await response.json();
    console.log('Status do pagamento:', data);
    
    return data.status || 'pending';
  } catch (error) {
    console.error('Falha na requisição de verificação de status:', error);
    return 'error';
  }
}
