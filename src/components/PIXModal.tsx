import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, QrCode } from 'lucide-react';

interface PIXModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixData: any;
  onPaymentConfirmed: () => void;
}

export const PIXModal: React.FC<PIXModalProps> = ({ isOpen, onClose, pixData, onPaymentConfirmed }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !pixData) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border-4 border-green-500 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-green-800">Pagamento PIX</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Timer */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-6 text-center text-white">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-bold">Você tem 30 minutos para realizar o pagamento:</span>
          </div>
          <div className="text-3xl font-mono font-bold">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm mt-1">
            Após isso, o código expira.
          </div>
        </div>

        {/* QR Code */}
        {pixData.pixQrCode && (
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-6 text-center">
            <img 
              src={pixData.pixQrCode} 
              alt="QR Code PIX" 
              className="w-48 h-48 mx-auto mb-3"
            />
            <p className="text-sm text-gray-600">
              Escaneie o QR Code com seu app do banco
            </p>
          </div>
        )}

        {/* PIX Code */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Código PIX Copia e Cola:
          </label>
          <div className="relative">
            <textarea
              value={pixData.pixCode || 'Código não disponível'}
              readOnly
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm font-mono resize-none h-24 text-black bg-white"
            />
            <button
              onClick={() => copyToClipboard(pixData.pixCode || '')}
              className={`absolute top-2 right-2 px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={!pixData.pixCode}
            >
              {copied ? (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Copiado!
                </div>
              ) : (
                <div className="flex items-center">
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Valor */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 text-center border-2 border-green-200">
          <div className="text-sm text-green-700 mb-1">Valor a pagar:</div>
          <div className="text-3xl font-bold text-green-800">R$ 29,90</div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3">📱 Como pagar:</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Abra o app do seu banco</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>Escolha "PIX" e depois "Pagar com QR Code" ou "Copia e Cola"</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>Escaneie o QR Code ou cole o código PIX</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
              <span>Confirme o pagamento de R$ 29,90</span>
            </div>
          </div>
        </div>

        {/* Aviso de Pagamento */}
        <div className="bg-yellow-50 rounded-xl p-4 text-center border-2 border-yellow-200">
          <div className="text-yellow-800 font-semibold mb-2">
            ⚠️ Importante
          </div>
          <div className="text-yellow-700 text-sm">
            Após realizar o pagamento, você receberá automaticamente as instruções para acessar o grupo VIP e receber seus números extras.
          </div>
        </div>
      </div>
    </div>
  );
};