import React from 'react';
import { X, Clock, Moon, MessageSquare, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import { formatWhatsAppForDisplay } from '../utils/whatsapp';

interface OfflineNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl: string;
  whatsappNumber?: string;
  scheduleSummary: string;
  offlineMessage: string;
  currentTimeStr: string;
  currentDayLabel: string;
}

export const OfflineNoticeModal: React.FC<OfflineNoticeModalProps> = ({
  isOpen,
  onClose,
  whatsappUrl,
  whatsappNumber,
  scheduleSummary,
  offlineMessage,
  currentTimeStr,
  currentDayLabel,
}) => {
  if (!isOpen) return null;

  const handleProceed = () => {
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-offline-notice"
        className="relative w-full max-w-lg bg-theme-card rounded-2xl border border-[#373E47] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-[#2D3238] flex items-center justify-between bg-[#181B1E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/60">
                  Fora do Expediente
                </span>
              </div>
              <h3 className="text-base font-bold text-theme-title mt-0.5">
                Atendimento WhatsApp Offline
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-theme-body hover:text-white hover:bg-[#25292E] transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO */}
        <div className="p-6 space-y-5">
          {/* MENSAGEM PRINCIPAL CONFIGURADA */}
          <div className="p-4 rounded-xl bg-theme-bg border border-[#2D3238] space-y-2">
            <p className="text-sm text-[#E2E8F0] leading-relaxed">
              {offlineMessage}
            </p>
          </div>

          {/* DETALHES DO EXPEDIENTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#1A1D20] border border-[#2D3238] space-y-1">
              <span className="text-theme-body flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-theme-primary" />
                Expediente Comercial
              </span>
              <p className="text-white font-semibold">
                {scheduleSummary}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1A1D20] border border-[#2D3238] space-y-1">
              <span className="text-theme-body flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Agora ({currentDayLabel})
              </span>
              <p className="text-white font-semibold flex items-center gap-1.5">
                <span>{currentTimeStr}</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                  Fechado no momento
                </span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Você pode enviar sua solicitação normalmente agora no WhatsApp ({formatWhatsAppForDisplay(whatsappNumber)}). Nossa equipe responderá logo no início do próximo turno!
            </p>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="p-5 border-t border-[#2D3238] bg-[#14171A] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-theme-body hover:text-white hover:bg-[#25292E] transition-colors"
          >
            Voltar ao Site
          </button>

          <button
            id="btn-proceed-offline-whatsapp"
            type="button"
            onClick={handleProceed}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar Mensagem Mesmo Assim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
