import React from 'react';
import { MessageSquare, Moon, ShoppingBag } from 'lucide-react';
import { useContent } from '../contexts/ContentContext';
import { useQuote } from '../contexts/QuoteContext';
import {
  getWhatsAppLink,
  DEFAULT_WHATSAPP_NUMBER,
  checkWhatsAppBusinessHours,
} from '../utils/whatsapp';

interface FloatingActionStackProps {
  onOpenQuote?: () => void;
}

export const FloatingActionStack: React.FC<FloatingActionStackProps> = ({ onOpenQuote }) => {
  const { content } = useContent();
  const quoteContext = useQuote() as any;
  const quoteItems = quoteContext?.quoteItems || quoteContext?.items || [];
  const totalItemsCount = quoteContext?.totalItemsCount ?? quoteItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
  const openQuoteModal = onOpenQuote || quoteContext?.setIsQuoteModalOpen;

  const rawNumber = content['whatsapp_number'] || DEFAULT_WHATSAPP_NUMBER;
  const defaultMsg =
    content['whatsapp_default_message'] ||
    'Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin.';

  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });

  const isBusinessHours = businessStatus.isOnline;
  const isB2BQuotesEnabled = content['enable_b2b_quotes'] !== 'false';
  // Rigorosa condição: cotações e bag só aparecem no expediente E com B2B ativado
  const showQuoteBag = isB2BQuotesEnabled && isBusinessHours && totalItemsCount > 0;

  const whatsappUrl = getWhatsAppLink({
    number: rawNumber,
    message: defaultMsg,
  });

  const handleOpenBag = () => {
    if (openQuoteModal) {
      openQuoteModal();
    }
  };

  return (
    <div
      id="floating-action-stack"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none"
    >
      {/* 1. BAG / LISTA DE COTAÇÃO MULTI-ITEM (BOTÃO DE ÍCONE MINIMALISTA COM BADGE) */}
      {showQuoteBag && (
        <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            type="button"
            id="btn-floating-quote-bag"
            onClick={handleOpenBag}
            title={`Lista de Cotação (${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'})`}
            aria-label={`Lista de Cotação: ${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'itens'}`}
            className="group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A1D20]/95 hover:bg-[#25292E] text-theme-primary hover:text-white border border-[#373E47] hover:border-theme-primary/60 shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none"
          >
            <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-200 group-hover:scale-110" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-md border-2 border-[#1A1D20]">
              {totalItemsCount}
            </span>
          </button>
        </div>
      )}

      {/* 2. BOTÃO PRINCIPAL DE WHATSAPP (ÍCONE INTERATIVO LIMPO) */}
      <a
        id="btn-floating-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`pointer-events-auto group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shadow-2xl transition-all duration-300 ${
          isBusinessHours
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-950/50 hover:shadow-emerald-600/30 hover:scale-105 active:scale-95 border border-emerald-400/40'
            : 'bg-gradient-to-br from-[#2D3238] to-[#1F2327] text-gray-300 shadow-black/60 hover:shadow-amber-950/30 hover:scale-105 active:scale-95 border border-[#3D444D] hover:border-amber-500/50'
        }`}
        aria-label="Atendimento via WhatsApp Comercial"
        title="Falar no WhatsApp"
      >
        {/* BADGE DE STATUS DISCRETA */}
        {isBusinessHours ? (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-[#1A1D20]"></span>
          </span>
        ) : (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#1A1D20] text-[9px] font-bold text-amber-400 border border-amber-500/50 shadow-sm"
            title="Fora do Expediente"
          >
            <Moon className="w-2.5 h-2.5 text-amber-400" />
            <span>Off</span>
          </span>
        )}

        <MessageSquare
          className={`w-6 h-6 drop-shadow-sm group-hover:rotate-6 transition-transform ${
            isBusinessHours ? 'text-white' : 'text-gray-300 group-hover:text-amber-400'
          }`}
        />
      </a>
    </div>
  );
};
