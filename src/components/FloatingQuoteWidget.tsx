import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';
import { useContent } from '../contexts/ContentContext';
import { checkWhatsAppBusinessHours } from '../utils/whatsapp';

interface FloatingQuoteWidgetProps {
  onClick?: () => void;
  onOpenQuote?: () => void;
}

export const FloatingQuoteWidget: React.FC<FloatingQuoteWidgetProps> = (props) => {
  const { content } = useContent();
  const quoteContext = useQuote() as any;

  const isB2BQuotesEnabled = content['enable_b2b_quotes'] !== 'false';
  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });

  // Ocultar completamente se estiver fora do horário comercial ou se B2B desativado
  if (!isB2BQuotesEnabled || !businessStatus.isOnline) {
    return null;
  }

  // Resgate seguro da quantidade de itens no contexto
  const quoteItems = quoteContext?.quoteItems || [];
  const totalItemsCount =
    quoteContext?.totalItemsCount ??
    quoteItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

  // Ação de abertura compatível com todas as variações do projeto
  const handleOpen = () => {
    if (props.onClick) return props.onClick();
    if (props.onOpenQuote) return props.onOpenQuote();
    if (quoteContext?.setIsQuoteOpen) return quoteContext.setIsQuoteOpen(true);
    if (quoteContext?.openQuote) return quoteContext.openQuote();
    if (quoteContext?.setIsModalOpen) return quoteContext.setIsModalOpen(true);
  };

  // Esconde o botão se a lista estiver vazia
  if (!totalItemsCount || totalItemsCount === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-[45] mb-2 sm:mb-0 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <button
        type="button"
        onClick={handleOpen}
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
  );
};