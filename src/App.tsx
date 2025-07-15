import React, { useState, useEffect } from 'react';
import { Star, Zap, Clock, Award, ChevronRight, X, AlertTriangle, Gift, MessageCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { getUTMParams, storeUTMParams, getStoredUTMParams, buildUTMString, trackEvent, initializeUTMTracking, getCheckoutUrl } from './utils/utm';
import { TrackingDebug } from './components/TrackingDebug';
import { PaymentModal } from './components/PaymentModal';
import { PIXModal } from './components/PIXModal';

function App() {
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutos em segundos
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPIXModal, setShowPIXModal] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [showThankYouPage, setShowThankYouPage] = useState(false);
  const [utmParams, setUtmParams] = useState(getStoredUTMParams());

  useEffect(() => {
    // Initialize UTM tracking system
    initializeUTMTracking();
    setUtmParams(getStoredUTMParams());
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Track timer expiration
          trackEvent('timer_expired', {
            page: 'upsell',
            time_remaining: 0
          });
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleActivateOffer = () => {
    // Track button click
    trackEvent('upsell_button_click', {
      button: 'activate_offer',
      offer_price: '29.90',
      time_remaining: timeLeft
    });
    
    // Open payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (pixResult: any) => {
    setPixData(pixResult);
    setShowPaymentModal(false);
    setShowPIXModal(true);
    
    // Track PIX generation
    trackEvent('pix_generated', {
      amount: '29.90',
      payment_id: pixResult.id || 'unknown'
    });
  };

  const handlePaymentConfirmed = () => {
    setShowPIXModal(false);
    setShowThankYouPage(true);
    
    // Track payment confirmation
    trackEvent('payment_confirmed', {
      amount: '29.90',
      method: 'pix'
    });
  };

  if (showThankYouPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
        {/* Header com logo Super Rifa */}
        <div className="bg-green-500 py-3 px-3 text-center border-b-4 border-yellow-400">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-white rounded-full p-1.5 mr-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center relative">
                <span className="text-white font-bold text-xs">SUPER</span>
                <div className="absolute -bottom-0.5 bg-yellow-400 text-green-800 text-xs font-bold px-1.5 py-0.5 rounded text-center">
                  RIFA
                </div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-xl font-bold">SUPER</div>
              <div className="text-xl font-bold text-yellow-300">RIFA</div>
              <div className="text-xs">🍀 Sua sorte está aqui! 🍀</div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 py-6 max-w-md">
          {/* Confirmação de Compra */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 mb-6 text-center border-4 border-yellow-400 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-yellow-300 mr-3" />
              <h1 className="text-2xl font-bold text-white">
                PARABÉNS!
              </h1>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-4 border-yellow-400 mb-4">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Sua Vantagem VIP Foi Ativada!
              </h2>
              <div className="text-green-700 font-semibold">
                <p>✅ +150 números extras confirmados</p>
                <p>✅ Acesso à Rifa VIP de R$5.000</p>
                <p>✅ Entrada no Grupo VIP liberada</p>
              </div>
            </div>
            
            <p className="text-yellow-100 text-lg font-semibold">
              🎯 Agora você precisa ENTRAR NO GRUPO para receber seus números!
            </p>
          </div>

          {/* Botão Principal WhatsApp */}
          <div className="mb-6">
            <a 
              href={getCheckoutUrl(`https://wa.me/5511999999999?text=${encodeURIComponent("Oi! Acabei de ativar minha vantagem VIP e quero entrar no grupo para receber meus 150 números extras!")}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              onClick={() => trackEvent('whatsapp_group_click', { 
                source: 'thank_you_page',
                offer: 'vip_group_access'
              })}
            >
              <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-5 px-6 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full animate-pulse border-4 border-yellow-400">
                <div className="flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 mr-3" />
                  ENTRAR NO GRUPO VIP AGORA!
                </div>
              </button>
            </a>
            
            <p className="text-center text-green-200 font-bold text-sm mt-3">
              👆 Clique aqui para acessar o WhatsApp e entrar no grupo
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-green-800 border-t-4 border-yellow-400 py-4">
          <div className="container mx-auto px-3 text-center text-green-100 text-sm">
            <p>🔒 Ambiente 100% seguro | 📱 Suporte 24h | 🎯 Sorteios certificados</p>
          </div>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white">
      <TrackingDebug />
      
      {/* Header com logo Super Rifa */}
      <div className="bg-green-500 py-3 px-3 text-center border-b-4 border-yellow-400">
        <div className="flex items-center justify-center mb-2">
          <div className="bg-white rounded-full p-1.5 mr-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center relative">
              <span className="text-white font-bold text-xs">SUPER</span>
              <div className="absolute -bottom-0.5 bg-yellow-400 text-green-800 text-xs font-bold px-1.5 py-0.5 rounded text-center">
                RIFA
              </div>
            </div>
          </div>
          <div className="text-white">
            <div className="text-xl font-bold">SUPER</div>
            <div className="text-xl font-bold text-yellow-300">RIFA</div>
            <div className="text-xs">🍀 Sua sorte está aqui! 🍀</div>
          </div>
        </div>
        <div className="bg-red-500 text-white py-1 px-3 rounded-full inline-block font-bold text-xs">
          ⚡ OFERTA ÚNICA - APENAS PARA CLIENTES QUE ACABARAM DE COMPRAR
        </div>
      </div>

      <div className="container mx-auto px-3 py-4 max-w-md">
        {/* Cronômetro de Urgência */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 mb-6 text-center border-4 border-yellow-400 shadow-2xl">
          <div className="flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-300 mr-2 animate-pulse" />
            <h2 className="text-lg font-bold text-white">
              Sua Vantagem Única expira em:
            </h2>
          </div>
          
          <div className="bg-white rounded-lg p-3 border-4 border-yellow-400">
            <div className="text-4xl font-mono font-bold text-red-600 tracking-wider">
              {formatTime(timeLeft)}
            </div>
            <div className="text-red-500 text-sm font-semibold mt-1">
              MINUTOS : SEGUNDOS
            </div>
          </div>
          
          <p className="text-yellow-100 text-sm font-semibold mt-3">
            ⏰ Após este tempo, a oferta será automaticamente cancelada!
          </p>
        </div>

        {/* Headline Principal */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-yellow-400 text-green-800 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
            <Star className="w-3 h-3 mr-1" />
            COMPRA APROVADA COM SUCESSO!
          </div>
          
          <h1 className="text-2xl font-bold mb-3 leading-tight">
            <span className="text-yellow-300">ESPERE!</span> Sua Compra Foi Aprovada...
            <br />
            <span className="text-yellow-300">E Liberou uma Vantagem ÚNICA</span> Para Você!
          </h1>
          
          <p className="text-lg text-green-100 font-medium">
            Receba <span className="text-yellow-300 font-bold">+150 NÚMEROS</span> na Hora, Concorra a um 
            <span className="text-yellow-300 font-bold"> PIX de R$5.000</span> e Entre no 
            <span className="text-yellow-300 font-bold"> Grupo VIP</span> Por Aceitar Esta Oferta-Relâmpago!
          </p>
        </div>

        {/* Caixa de Aviso Reformulada */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 border-4 border-yellow-400 rounded-xl p-4 mb-6 shadow-2xl">
          <div className="flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-300 mr-2 animate-bounce" />
            <h3 className="text-lg font-bold text-yellow-300">
              AVISO: OFERTA DE UMA SÓ VEZ
            </h3>
          </div>
          
          <div className="bg-red-800 rounded-lg p-3 border-2 border-yellow-400">
            <p className="text-white text-sm font-semibold text-center leading-relaxed">
              Se você fechar ou atualizar esta página, seu acesso VIP, seus 150 números extras e sua entrada no grupo exclusivo serão 
              <span className="text-yellow-300 font-bold"> automaticamente oferecidos para o próximo cliente</span> em nossa fila de espera. 
              <span className="text-yellow-100 font-bold"> A decisão é sua e o tempo está correndo.</span>
            </p>
          </div>
        </div>

        {/* Área do Vídeo/Imagem - Pacote Triplo */}
        <div className="bg-white rounded-2xl p-6 mb-8 border-4 border-yellow-400 relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
            TRIPLO
          </div>
          
          <div className="text-center">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-2 mx-auto border-4 border-green-600">
                  <Gift className="w-10 h-10 text-green-800" />
                </div>
                <h3 className="text-lg font-bold text-green-800 mb-1">+150 NÚMEROS</h3>
                <p className="text-green-600 font-semibold text-xs">SW4 + Moto BMW</p>
              </div>
              
              <div className="text-xl font-bold text-green-800">+</div>
              
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-2 mx-auto border-4 border-yellow-400">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-800 mb-1">RIFA VIP</h3>
                <p className="text-green-600 font-semibold text-xs">R$ 5.000 em PIX</p>
              </div>
              
              <div className="text-xl font-bold text-green-800">+</div>
              
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mb-2 mx-auto border-4 border-yellow-400">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-800 mb-1">GRUPO VIP</h3>
                <p className="text-green-600 font-semibold text-xs">WhatsApp Exclusivo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Caixa de Preço Reformulada - PACOTE TRIPLO */}
        <div className="bg-white rounded-2xl p-6 mb-6 border-4 border-yellow-400 shadow-2xl">
          <div className="text-center">
            {/* Ancoragem de Preço */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
              <div className="text-gray-600 text-lg mb-1">Valor Normal do Pacote Triplo:</div>
              <div className="text-red-600 text-2xl font-bold line-through mb-1">R$ 225,00</div>
              <div className="text-gray-500 text-xs">
                (Cálculo: 150 Números a R$0,50/un. = R$75 + Rifa VIP = R$75 + Grupo VIP = R$75)
              </div>
            </div>
            
            {/* Preço da Oferta */}
            <div className="mb-4 p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-xl border-4 border-yellow-400">
              <div className="text-yellow-300 text-xl font-semibold mb-1">Sua Oportunidade ÚNICA:</div>
              <div className="text-yellow-300 text-4xl font-bold">Apenas R$ 29,90</div>
              <div className="text-yellow-100 text-base mt-1">✅ Economia imediata de R$ 195,10 (87% OFF)</div>
            </div>
            
            <div className="mb-4">
              <p className="text-green-700 text-base font-semibold">
                💳 Pagamento seguro • 🚀 Ativação imediata • 🎯 Garantia de participação
              </p>
            </div>

            <button 
              onClick={handleActivateOffer}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-green-800 font-bold py-4 px-6 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mb-3 w-full animate-pulse border-4 border-green-600"
            >
              <div className="flex items-center justify-center">
                <ChevronRight className="w-6 h-6 mr-2" />
                ATIVAR VANTAGEM E ENTRAR NO GRUPO!
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
      
      <PIXModal 
        isOpen={showPIXModal}
        onClose={() => setShowPIXModal(false)}
        pixData={pixData}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Footer com confiança */}
      <footer className="bg-green-800 border-t-4 border-yellow-400 py-4 mt-8">
        <div className="container mx-auto px-3 text-center text-green-100 text-sm">
          <p>🔒 Ambiente 100% seguro | 📱 Suporte 24h | 🎯 Sorteios certificados</p>
        </div>
      </footer>
    </div>
  );
}

export default App;