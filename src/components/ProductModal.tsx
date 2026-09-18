import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Check, Layers, Copy, FileSpreadsheet, Moon, Plus, Minus, ShoppingCart, Heart } from 'lucide-react';
import { Produto, EmpresaInfo } from '../types';
import { EditableText } from './EditableText';
import { useContent } from '../contexts/ContentContext';
import { useQuote } from '../contexts/QuoteContext';
import { useAuth } from '../contexts/AuthContext';
import { getWhatsAppLink, checkWhatsAppBusinessHours, DEFAULT_WHATSAPP_NUMBER } from '../utils/whatsapp';
import { OfflineNoticeModal } from './OfflineNoticeModal';

interface ProductModalProps {
  produto: Produto | null;
  onClose: () => void;
  empresa: EmpresaInfo;
  onOpenQuote?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ produto, onClose, empresa, onOpenQuote }) => {
  const [copied, setCopied] = React.useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [modalQty, setModalQty] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fardin_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isFavorited = (id: string | number) => favorites.includes(String(id));

  const toggleFavorite = (id: string | number) => {
    setFavorites((prev) => {
      const strId = String(id);
      const next = prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId];
      try {
        localStorage.setItem('fardin_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const { content } = useContent();
  const { isEditMode } = useAuth();
  const { addToQuote, isInQuote, getItemQuantity, setIsQuoteModalOpen } = useQuote();

  const isB2BQuotesEnabled = content['enable_b2b_quotes'] !== 'false';

  const configuredNumber = content['whatsapp_number'] || empresa.contato.whatsapp || DEFAULT_WHATSAPP_NUMBER;
  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });
  const isBusinessHours = businessStatus.isOnline;
  // Rigorosa condição: cotações e favoritos B2B só aparecem durante o expediente E com B2B ativado
  const showB2BQuotes = isB2BQuotesEnabled && isBusinessHours;

  useEffect(() => {
    if (produto) {
      setModalQty(1);
    }
  }, [produto]);

  useEffect(() => {
    if (!produto) return;

    const originalTitle = document.title;
    document.title = `${produto.titulo} | Catálogo Metalúrgica Fardin`;

    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": produto.titulo,
      "image": produto.imagem_url,
      "description": produto.descricao,
      "sku": produto.codigo_referencia,
      "brand": {
        "@type": "Brand",
        "name": empresa.nome
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-ld-json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      document.title = originalTitle;
      const existingScript = document.getElementById('product-ld-json');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [produto, empresa.nome]);

  if (!produto) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(produto.codigo_referencia);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = getWhatsAppLink({
    number: configuredNumber,
    product: {
      name: produto.titulo,
      ref: produto.codigo_referencia
    }
  });

  const handleWhatsAppQuote = () => {
    if (!businessStatus.isOnline) {
      setIsOfflineModalOpen(true);
      return;
    }
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div
      id="product-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-theme-bg border border-[#373E47] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* CABEÇALHO DO MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3238] bg-theme-card">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-theme-body">
              <EditableText contentKey="modal_badge" defaultText="Ficha Técnica B2B" as="span" />
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#25292E] text-theme-primary font-mono font-bold border border-[#373E47]">
              {produto.codigo_referencia}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-body hover:text-white hover:bg-[#25292E] transition-colors"
            aria-label="Fechar Janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL (SCROLL SE NECESSÁRIO) */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* FOTO EM ALTA RESOLUÇÃO COM EFEITO LIGHTBOX (ALTO CONTRASTE) */}
            <div className="relative w-full h-[320px] md:h-[380px] bg-gradient-to-b from-slate-200 to-slate-300 rounded-xl p-6 flex items-center justify-center overflow-hidden border border-gray-700/50 shadow-inner group">
              <img
                src={produto.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'}
                alt={produto.titulo}
                className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80';
                  e.currentTarget.className = "w-full h-full object-cover drop-shadow-2xl transition-transform duration-300 hover:scale-105 opacity-80";
                }}
              />
              <div className="absolute top-3 left-3">
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-gray-900/90 text-gray-200 border border-gray-700/80 shadow-md">
                  {produto.categoria}
                </span>
              </div>

              {/* BOTÃO DE FAVORITO PADRÃO E LIMPO (SOMENTE NO EXPEDIENTE COM B2B ATIVO) */}
              {showB2BQuotes && (
                <button
                  type="button"
                  id={`btn-modal-fav-${produto.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(produto.id);
                  }}
                  className={`absolute top-3 right-3 z-10 w-9 h-9 shrink-0 aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
                    isFavorited(produto.id)
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30'
                      : 'bg-gray-900/85 hover:bg-neutral-800 text-gray-300 hover:text-amber-400 border-gray-700/80'
                  }`}
                  title={isFavorited(produto.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  aria-label="Favoritar peça"
                >
                  <Heart
                    className={`w-4 h-4 shrink-0 transition-transform active:scale-125 ${
                      isFavorited(produto.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              )}
            </div>

            {/* ESPECIFICAÇÕES E INFORMAÇÕES */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-theme-title tracking-tight mb-2">
                  {produto.titulo}
                </h3>

                {/* BADGE DE REFERÊNCIA COPIÁVEL */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25292E] border border-[#373E47]">
                    <span className="text-xs font-mono text-theme-body"><EditableText contentKey="modal_ref_label" defaultText="Ref:" as="span" /></span>
                    <span className="text-xs font-mono font-bold text-theme-title">
                      {produto.codigo_referencia}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-[#25292E] hover:bg-[#2D3238] text-theme-body hover:text-theme-title transition-colors border border-[#373E47]"
                    title="Copiar código de referência"
                  >
                    {copied ? <span className="w-3.5 h-3.5 text-emerald-400 font-bold">✓</span> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* DESCRIÇÃO TÉCNICA DETALHADA */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-theme-body">
                  <EditableText contentKey="modal_desc_title" defaultText="Descrição Técnica & Aplicação" as="span" />
                </h4>
                <div className="bg-theme-card/60 rounded-xl border border-[#2D3238]">
                  <p className="text-sm text-[#D1D5DB] leading-relaxed p-4 pr-3 max-h-56 overflow-y-auto custom-scrollbar">
                    {produto.descricao}
                  </p>
                </div>
              </div>

              {/* ESPECIFICAÇÕES METALÚRGICAS (SE PREENCHIDO) */}
              {produto.especificacoes_metalurgicas && (
                <div className="p-3.5 rounded-xl bg-[#25292E]/70 border border-[#373E47] space-y-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-theme-primary" />
                    Especificações Metalúrgicas
                  </span>
                  <p className="text-xs text-[#D1D5DB] leading-relaxed whitespace-pre-line">
                    {produto.especificacoes_metalurgicas}
                  </p>
                </div>
              )}

              {/* CARACTERÍSTICAS TÉCNICAS PADRÃO FARDIN */}
              <div className="space-y-1.5 text-xs text-theme-body">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-theme-primary" />
                  <span><EditableText contentKey="modal_feature_1" defaultText="Tratamento térmico de indução e revenimento" as="span" /></span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-theme-primary" />
                  <span><EditableText contentKey="modal_feature_2" defaultText="Dimensional rigoroso para implementos agrícolas" as="span" /></span>
                </div>
              </div>

              {/* SELETOR DE QUANTIDADE DIRETO NO MODAL */}
              {showB2BQuotes && (
                <div className="p-3.5 rounded-xl bg-[#25292E]/70 border border-[#373E47] flex flex-col gap-2.5">
                  <div>
                    <span className="text-xs font-bold text-white block">Quantidade:</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 bg-[#1D2125] p-1 rounded-xl border border-[#373E47] w-full sm:w-44 sm:max-w-[200px]">
                    <button
                      type="button"
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-[#25292E] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Diminuir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={modalQty}
                      onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center bg-transparent text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setModalQty((q) => q + 1)}
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-[#25292E] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RODAPÉ DO MODAL COM AÇÕES */}
        <div className="p-4 sm:px-8 sm:py-4 bg-theme-card border-t border-[#2D3238] flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
          <button
            onClick={(e) => {
              if (isEditMode) {
                e.preventDefault();
                return;
              }
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-[#D1D5DB] bg-[#25292E] hover:bg-[#2D3238] border border-[#373E47] transition-colors whitespace-nowrap text-center"
          >
            <EditableText contentKey="modal_btn_close" defaultText="Voltar ao Catálogo" as="span" />
          </button>

          {/* BOTÃO DE ADICIONAR À COTAÇÃO / ABRIR CARRINHO */}
          {showB2BQuotes && (
            <button
              id="btn-modal-open-b2b-quote"
              onClick={(e) => {
                if (isEditMode) {
                  e.preventDefault();
                  return;
                }
                addToQuote(produto, modalQty);
                if (onOpenQuote) onOpenQuote();
                else setIsQuoteModalOpen(true);
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border whitespace-nowrap ${
                isInQuote(produto.id)
                  ? 'bg-theme-primary/20 text-theme-primary border-theme-primary/50 hover:bg-theme-primary/30'
                  : 'bg-theme-primary text-white border-theme-primary hover:bg-theme-primary/90 shadow-md shadow-theme-primary/30'
              }`}
            >
              {isInQuote(produto.id) ? (
                <>
                  <Check className="w-4 h-4 text-theme-primary shrink-0" />
                  <span className="whitespace-nowrap">Na Lista ({getItemQuantity(produto.id)} un) +</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Adicionar à Cotação</span>
                </>
              )}
            </button>
          )}

          <button
            id="btn-modal-whatsapp-quote"
            onClick={(e) => {
              if (isEditMode) {
                e.preventDefault();
                return;
              }
              handleWhatsAppQuote();
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
              businessStatus.isOnline
                ? 'bg-theme-primary text-white hover:brightness-110 shadow-md shadow-theme-primary/20'
                : 'bg-[#25292E] text-gray-300 hover:text-white border border-[#3D444D] hover:border-amber-500/50'
            }`}
          >
            {businessStatus.isOnline ? (
              <MessageSquare className="w-4 h-4 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              <EditableText contentKey="modal_btn_whatsapp" defaultText="WhatsApp Direto" as="span" />
            </span>
            {!businessStatus.isOnline && (
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 whitespace-nowrap shrink-0">
                Off
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MODAL DE AVISO FORA DO EXPEDIENTE */}
      <OfflineNoticeModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        whatsappUrl={whatsappUrl}
        whatsappNumber={configuredNumber}
        scheduleSummary={businessStatus.scheduleSummary}
        offlineMessage={businessStatus.offlineMessage}
        currentTimeStr={businessStatus.currentTimeStr}
        currentDayLabel={businessStatus.currentDayLabel}
      />
    </div>
  );
};
