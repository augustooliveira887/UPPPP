// Serviço para validação e consulta de CPF
export interface CPFValidationResult {
  isValid: boolean;
  userData?: {
    name: string;
    email: string;
  };
  error?: string;
}

// Função para validar CPF matematicamente
export function validateCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }
  
  // Verificar se não são todos números iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;
  
  // Validar primeiro dígito
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
  
  // Validar segundo dígito
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
  
  return true;
}

// Função para consultar dados do CPF (usando API gratuita)
export async function consultarCPF(cpf: string): Promise<CPFValidationResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Primeiro, validar matematicamente
  if (!validateCPF(cpfLimpo)) {
    return {
      isValid: false,
      error: 'CPF inválido'
    };
  }
  
  try {
    // Tentar consultar dados do CPF usando API gratuita
    const response = await fetch(`https://api.cpfcnpj.com.br/${cpfLimpo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'OK' && data.nome) {
        return {
          isValid: true,
          userData: {
            name: data.nome,
            email: `cliente${cpfLimpo.slice(-4)}@email.com` // Email genérico
          }
        };
      }
    }
    
    // Se a API não retornar dados válidos, usar dados genéricos
    return {
      isValid: true,
      userData: {
        name: 'Cliente Validado',
        email: `cliente${cpfLimpo.slice(-4)}@email.com`
      }
    };
    
  } catch (error) {
    console.log('Erro na consulta CPF, usando validação local:', error);
    
    // Em caso de erro na API, usar apenas validação matemática
    return {
      isValid: true,
      userData: {
        name: 'Cliente Validado',
        email: `cliente${cpfLimpo.slice(-4)}@email.com`
      }
    };
  }
}

// Função para formatar CPF
export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para limpar CPF (apenas números)
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}