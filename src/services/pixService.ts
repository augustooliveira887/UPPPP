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
        'Authorization': SECRET_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Status da resposta:', response.status);

    const responseText = await response.text();
    console.log('Resposta completa:', responseText);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('API não encontrada. Por favor, tente novamente mais tarde.');
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
      } else if (response.status === 0) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor está online.');
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
      throw new Error('Servidor indisponível. Por favor, tente novamente em alguns minutos.');
    }
    throw error;
  }
}

export async function verificarStatusPagamento(transactionId: string): Promise<string> {
  try {
    const response = await fetch(`${CHECK_STATUS_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': SECRET_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar status: ${response.status}`);
    }

    const data = await response.json();
    return data.status || 'pending';
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return 'error';
  }
}