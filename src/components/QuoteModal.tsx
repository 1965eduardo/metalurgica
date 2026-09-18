'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Send,
  Building2,
  User,
  Phone,
  Layers,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';
import { useQuote } from '../contexts/QuoteContext';
import { getWhatsAppLink, DEFAULT_WHATSAPP_NUMBER } from '../utils/whatsapp';

export interface CartItem {
  id: string | number;
  name: string;
  reference?: string;
  category?: string;
  quantity: number;
  image?: string;
}

export interface QuoteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: CartItem[];
  onUpdateQuantity?: (id: string | number, delta: number) => void;
  onRemoveItem?: (id: string | number) => void;
  onClearCart?: () => void;
  b2bEnabled?: boolean;
}

export const QuoteModal: React.FC<QuoteModalProps> = (props) => {
  const { content } = useContent();
  const quoteContext = useQuote();

  const {
    quoteItems: contextItems = [],
    removeFromQuote,
    updateQuantity,
    clearQuote,
    totalItemsCount: contextTotalCount = 0,
    isQuoteModalOpen,
    setIsQuoteModalOpen,
    closeQuoteModal,
  } = quoteContext;

  // Determina se o modal está aberto por props ou contexto
  const isOpen =
    props.isOpen !== undefined
      ? props.isOpen
      : Boolean(isQuoteModalOpen);

  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    }
    if (setIsQuoteModalOpen) {
      setIsQuoteModalOpen(false);
    }
    if (closeQuoteModal) {
      closeQuoteModal();
    }
  };

  // Normalização de itens (se passado via props ou vindo do QuoteContext)
  const normalizedItems: CartItem[] = props.items && props.items.length > 0
    ? props.items
    : contextItems.map((item: any) => ({
        id: item.product?.id || item.product?.codigo_referencia || String(Math.random()),
        name: item.product?.titulo || item.product?.nome || 'Produto',
        reference: item.product?.codigo_referencia || '',
        category: item.product?.categoria || '',
        quantity: item.quantity,
        image: item.product?.imagem_url || item.product?.imagem || '',
      }));

  const totalItemsCount = props.items
    ? normalizedItems.reduce((acc, item) => acc + item.quantity, 0)
    : contextTotalCount || normalizedItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleUpdateQuantity = (id: string | number, delta: number) => {
    if (props.onUpdateQuantity) {
      props.onUpdateQuantity(id, delta);
      return;
    }
    const targetItem = normalizedItems.find((i) => i.id === id);
    if (targetItem && updateQuantity) {
      const newQty = Math.max(1, targetItem.quantity + delta);
      updateQuantity(id, newQty);
    }
  };

  const handleRemoveItem = (id: string | number) => {
    if (props.onRemoveItem) {
      props.onRemoveItem(id);
      return;
    }
    if (removeFromQuote) {
      removeFromQuote(id);
    }
  };

  const handleClear = () => {
    if (props.onClearCart) {
      props.onClearCart();
    }
    if (clearQuote) {
      clearQuote();
    }
  };

  // Formulário
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    contactName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Travamento de scroll da página de fundo (body scroll lock)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Isolar eventos de scroll/wheel/touch para não serem capturados por listeners da página (como Lenis)
  useEffect(() => {
    if (!isOpen) return;

    const modalContainer = document.getElementById('quote-modal-container');
    if (!modalContainer) return;

    const handleStopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    modalContainer.addEventListener('wheel', handleStopPropagation, { passive: true });
    modalContainer.addEventListener('touchmove', handleStopPropagation, { passive: true });

    return () => {
      modalContainer.removeEventListener('wheel', handleStopPropagation);
      modalContainer.removeEventListener('touchmove', handleStopPropagation);
    };
  }, [isOpen]);

  // Fechar no Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.contactName.trim() || !formData.phone.trim()) {
      return;
    }
    if (normalizedItems.length === 0) return;

    setSubmitting(true);

    const itemsText = normalizedItems
      .map((item, index) => {
        const refStr = item.reference ? ` (REF: ${item.reference})` : '';
        const catStr = item.category ? ` [${item.category}]` : '';
        return `${index + 1}. *${item.name}*${refStr}${catStr}\n   ▫️ Quantidade: *${item.quantity} un.*`;
      })
      .join('\n\n');

    const formattedMessage =
      `*📋 SOLICITAÇÃO CONSOLIDADA DE COTAÇÃO B2B*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🏢 *DADOS DA EMPRESA / COMPRADOR*\n` +
      `• *Razão Social / Empresa:* ${formData.companyName.trim()}\n` +
      (formData.cnpj.trim() ? `• *CNPJ / CPF:* ${formData.cnpj.trim()}\n` : '') +
      `• *Responsável Compras:* ${formData.contactName.trim()}\n` +
      (formData.email.trim() ? `• *E-mail:* ${formData.email.trim()}\n` : '') +
      `• *Telefone / WhatsApp:* ${formData.phone.trim()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *ITENS DA COTAÇÃO (${normalizedItems.length} itens | Total: ${totalItemsCount} peças)*\n\n` +
      `${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      (formData.notes.trim() ? `📝 *Observações / Condições:* ${formData.notes.trim()}\n\n` : '') +
      `_Enviado através do sistema de cotação B2B do catálogo Metalúrgica Fardin._`;

    const whatsappNumber = content['whatsapp_number'] || DEFAULT_WHATSAPP_NUMBER;
    const whatsappUrl = getWhatsAppLink({
      number: whatsappNumber,
      message: formattedMessage,
    });

    // Disparar abertura do WhatsApp
    window.open(whatsappUrl, '_blank');
    setSubmitting(false);
    setSubmitted(false);

    // Limpeza imediata da lista de cotação e redefinição dos estados dos produtos
    handleClear();

    // Fechamento automático do modal para retorno direto à interface
    handleClose();
  };

  const handleFinish = () => {
    setSubmitted(false);
    handleClear();
    handleClose();
  };

  return (
    <div
      id="quote-modal-overlay"
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Container Principal do Modal com altura máxima controlada e overflow seguro */}
      <div
        id="quote-modal-container"
        data-lenis-prevent
        className="relative bg-[#1A1D20] border border-[#373E47] rounded-2xl w-full max-w-2xl sm:max-w-3xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabeçalho Fixo do Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#2D3238] bg-[#1E2227] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-600/15 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                  B2B
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {normalizedItems.length} {normalizedItems.length === 1 ? 'item' : 'itens'} ({totalItemsCount} un)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                Lista de Cotação
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-[#25292E] hover:bg-[#2D3238] px-3 py-2 rounded-xl transition-colors border border-[#373E47] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continuar Cotando</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-white bg-[#25292E] hover:bg-[#2D3238] rounded-xl transition-colors border border-[#373E47] cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulário integrado ao corpo rolável e ao rodapé */}
        {submitted ? (
          <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              Cotação Encaminhada com Sucesso!
            </h3>
            <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
              Sua lista com <strong className="text-white">{normalizedItems.length} itens</strong> foi formatada e aberta no WhatsApp da Metalúrgica Fardin.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                Concluir e Limpar Lista
              </button>
            </div>
          </div>
        ) : normalizedItems.length === 0 ? (
          <div data-lenis-prevent className="flex-1 overflow-y-auto p-8 sm:p-12 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-[#25292E] text-neutral-500 rounded-2xl border border-[#373E47] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">
              Sua lista de cotação está vazia
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
              Navegue pelo catálogo e clique em <strong>"Cotar Peça"</strong> para adicionar itens à sua cotação B2B.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao catálogo</span>
              </button>
            </div>
          </div>
        ) : (
          <form
            id="quote-form"
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* Div que engloba a lista de itens e o formulário */}
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-8"
            >
              {/* Seção 1: Peças Selecionadas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-orange-500 uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Peças Selecionadas ({normalizedItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Lista</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {normalizedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#202428] border border-[#2D3238] p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#373E47] transition-colors"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                        <div className="w-12 h-12 bg-[#25292E] rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-[#373E47]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-5 h-5 text-neutral-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-semibold text-sm truncate">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {item.reference && (
                              <span className="text-[10px] bg-[#181A1D] text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                                REF: {item.reference}
                              </span>
                            )}
                            {item.category && (
                              <span className="text-[10px] text-neutral-400">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2D3238]">
                        <div className="flex items-center bg-[#181A1D] rounded-xl border border-[#373E47] p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-[#25292E]"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-white font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-[#25292E]"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-red-500/10"
                          title="Remover item"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 2: Dados da Empresa */}
              <div className="space-y-4 pt-4 border-t border-[#2D3238]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-bold tracking-wider text-orange-500 uppercase">
                    Dados da Empresa Solicitante
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Razão Social / Nome da Empresa <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Ex: Agropecuária Exemplo LTDA"
                        className="w-full bg-[#202428] border border-[#373E47] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        CNPJ / CPF
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          placeholder="00.000.000/0000-00"
                          className="w-full bg-[#202428] border border-[#373E47] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Responsável / Comprador <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          placeholder="Nome do contato"
                          className="w-full bg-[#202428] border border-[#373E47] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Telefone / WhatsApp <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                          className="w-full bg-[#202428] border border-[#373E47] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        E-mail Institucional
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contato@empresa.com.br"
                          className="w-full bg-[#202428] border border-[#373E47] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Observações Adicionais (opcional)
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-neutral-500">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Condições especiais de pagamento, prazos de entrega ou especificações..."
                        className="w-full bg-[#202428] border border-[#373E47] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé Fixo do Modal com os Botões de Ação */}
            <div className="px-5 sm:px-6 py-4 border-t border-[#2D3238] bg-[#1E2227] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white bg-[#25292E] hover:bg-[#2D3238] rounded-xl transition-colors border border-[#373E47] flex items-center justify-center gap-2 cursor-pointer order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continuar Cotando</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {submitting ? (
                  <span className="animate-pulse">Enviando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Orçamento via WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuoteModal;
