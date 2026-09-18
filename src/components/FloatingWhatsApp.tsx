import React from 'react';
import { MessageSquare, Moon } from 'lucide-react';
import { useContent } from '../contexts/ContentContext';
import {
  getWhatsAppLink,
  DEFAULT_WHATSAPP_NUMBER,
  checkWhatsAppBusinessHours,
} from '../utils/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  const { content } = useContent();

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

  const whatsappUrl = getWhatsAppLink({
    number: rawNumber,
    message: defaultMsg,
  });

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* BOTÃO FLUTUANTE DE WHATSAPP (ÍCONE INTERATIVO LIMPO) */}
      <a
        id="btn-floating-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 ${
          businessStatus.isOnline
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-950/50 hover:shadow-emerald-600/30 hover:scale-105 active:scale-95 border border-emerald-400/40'
            : 'bg-gradient-to-br from-[#2D3238] to-[#1F2327] text-gray-300 shadow-black/60 hover:shadow-amber-950/30 hover:scale-105 active:scale-95 border border-[#3D444D] hover:border-amber-500/50'
        }`}
        aria-label="Atendimento via WhatsApp Comercial"
        title="Falar no WhatsApp"
      >
        {/* BADGE DE STATUS ONLINE / OFFLINE */}
        {businessStatus.isOnline ? (
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
            businessStatus.isOnline ? 'text-white' : 'text-gray-300 group-hover:text-amber-400'
          }`}
        />
      </a>
    </div>
  );
};
