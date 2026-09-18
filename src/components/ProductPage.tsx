import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Check, 
  Copy, 
  FileSpreadsheet, 
  ShieldCheck, 
  Layers, 
  Wrench, 
  Truck, 
  ChevronRight, 
  Plus, 
  Minus, 
  Moon, 
  ArrowUpRight,
  Maximize2,
  Sparkles,
  PhoneCall,
  Share2,
  Heart
} from 'lucide-react';
import { Produto, EmpresaInfo, DbStatus } from '../types';
import { Header } from './Header';
import { Footer } from './Footer';
import { EditableText } from './EditableText';
import { useContent } from '../contexts/ContentContext';
import { useQuote } from '../contexts/QuoteContext';
import { useAuth } from '../contexts/AuthContext';
import { slugify } from '../utils/slugify';
import { 
  getWhatsAppLink, 
  checkWhatsAppBusinessHours, 
  DEFAULT_WHATSAPP_NUMBER 
} from '../utils/whatsapp';
import { OfflineNoticeModal } from './OfflineNoticeModal';
import { QuoteModal } from './QuoteModal';
import { FloatingActionStack } from './FloatingActionStack';

interface ProductPageProps {
  produto: Produto;
  todosProdutos: Produto[];
  empresa: EmpresaInfo;
  onBack: (sectionId?: string) => void;
  onSelectProduct: (produto: Produto) => void;
  onOpenAdmin: () => void;
  dbStatus: DbStatus | null;
  onLogout: () => void;
  onUpdateProduct?: (updated: Produto) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  produto: initialProduto,
  todosProdutos,
  empresa,
  onBack,
  onSelectProduct,
  onOpenAdmin,
  dbStatus,
  onLogout,
  onUpdateProduct,
}) => {
  const { content } = useContent();
  const { isEditMode, authToken } = useAuth();
  const { addToQuote, isInQuote, getItemQuantity } = useQuote();

  const [produto, setProduto] = useState<Produto>(initialProduto);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
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

  useEffect(() => {
    setProduto(initialProduto);
  }, [initialProduto]);

  const handleProductUpdate = (updated: Produto) => {
    setProduto(updated);
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
  };

  const isB2BQuotesEnabled = content['enable_b2b_quotes'] !== 'false';
  const currentWhatsApp = content['whatsapp_number'] || empresa.contato.whatsapp || DEFAULT_WHATSAPP_NUMBER;

  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });
  const isBusinessHours = businessStatus.isOnline;
  // Rigorosa condição: botões B2B e favoritos só aparecem no expediente E com B2B ativado
  const showB2BQuotes = isB2BQuotesEnabled && isBusinessHours;

  // Rolar para o topo ao carregar a página ou mudar de produto
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
  }, [produto.id]);

  // Gestão de Metadados e SEO para a Single Product Page
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${produto.titulo} | Metalúrgica Fardin`;

    const productSlug = slugify(produto.titulo) || produto.id.toString();
    const canonicalUrl = `${window.location.origin}/produto/${productSlug}`;

    // Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription ? metaDescription.getAttribute('content') : '';
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', `${produto.titulo} - ${produto.descricao.slice(0, 150)}... Fabricação e fornecimento por Metalúrgica Fardin.`);

    // OpenGraph
    const setMetaTag = (property: string, contentVal: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', contentVal);
    };

    setMetaTag('og:title', `${produto.titulo} | Metalúrgica Fardin`);
    setMetaTag('og:description', produto.descricao);
    setMetaTag('og:image', produto.imagem_url || '');
    setMetaTag('og:url', canonicalUrl);
    setMetaTag('og:type', 'product');

    // Schema.org Structured Data (Product JSON-LD)
    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": produto.titulo,
      "image": produto.imagem_url,
      "description": produto.descricao,
      "sku": produto.codigo_referencia,
      "category": produto.categoria,
      "brand": {
        "@type": "Brand",
        "name": empresa.nome
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "BRL",
        "url": canonicalUrl
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'single-product-ld-json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      document.title = originalTitle;
      if (metaDescription && originalDescription) {
        metaDescription.setAttribute('content', originalDescription);
      }
      const existingScript = document.getElementById('single-product-ld-json');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [produto, empresa.nome]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(produto.codigo_referencia);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: produto.titulo,
        text: `Confira ${produto.titulo} (${produto.codigo_referencia}) da Metalúrgica Fardin:`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const whatsappUrl = getWhatsAppLink({
    number: currentWhatsApp,
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

  // Produtos relacionados (estritamente da mesma categoria, excluindo o produto atual)
  const produtosRelacionados = todosProdutos
    .filter(
      (p) => 
        p.id !== produto.id && 
        p.categoria?.trim().toLowerCase() === produto.categoria?.trim().toLowerCase()
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-title flex flex-col selection:bg-theme-primary selection:text-white">
      {/* NAVBAR / HEADER PRINCIPAL */}
      <Header
        onOpenAdmin={onOpenAdmin}
        isAdminLoggedIn={Boolean(authToken)}
        dbStatus={dbStatus}
        onLogout={onLogout}
        onOpenQuote={() => setIsQuoteOpen(true)}
        onNavigateHome={onBack}
      />

      <main className="flex-1 pt-24 sm:pt-32 pb-8 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* BARRA DE BREADCRUMB E BOTÃO VOLTAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-[#2D3238]">
            <nav className="flex items-center gap-2 text-xs text-theme-body font-medium flex-wrap">
              <a
                href="/#home"
                onClick={(e) => {
                  e.preventDefault();
                  onBack('home');
                }}
                className="hover:text-theme-primary transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Home</span>
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              <a
                href="/#produtos"
                onClick={(e) => {
                  e.preventDefault();
                  onBack('produtos');
                }}
                className="hover:text-theme-primary transition-colors cursor-pointer"
              >
                <span>Catálogo de Produtos</span>
              </a>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-400 font-mono px-2 py-0.5 rounded bg-[#25292E] border border-[#373E47]">
                {produto.categoria}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-theme-title font-semibold truncate max-w-[160px] sm:max-w-md">
                {produto.titulo}
              </span>
            </nav>

            <div className="flex items-center gap-2 flex-wrap">
              {/* BOTÃO FAVORITO LIMPO E PADRONIZADO (SOMENTE NO EXPEDIENTE COM B2B ATIVO) */}
              {showB2BQuotes && (
                <button
                  type="button"
                  id="btn-favorite-topbar"
                  onClick={() => toggleFavorite(produto.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isFavorited(produto.id)
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                      : 'bg-[#25292E] text-theme-body hover:text-white hover:bg-[#2D3238] border-[#373E47]'
                  }`}
                  title={isFavorited(produto.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                  aria-label="Favoritar peça"
                >
                  <Heart
                    className={`w-3.5 h-3.5 shrink-0 transition-transform active:scale-125 ${
                      isFavorited(produto.id) ? 'fill-amber-400 text-amber-400' : 'text-theme-body'
                    }`}
                  />
                  <span className="hidden xs:inline">
                    {isFavorited(produto.id) ? 'Favorito' : 'Favoritar'}
                  </span>
                </button>
              )}

              <button
                onClick={handleShareLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#25292E] text-theme-body hover:text-white hover:bg-[#2D3238] border border-[#373E47] transition-all cursor-pointer"
                title="Compartilhar Link do Produto"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
              </button>

              <a
                href="/#produtos"
                onClick={(e) => {
                  e.preventDefault();
                  onBack('produtos');
                }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#25292E] text-theme-title hover:bg-theme-primary hover:text-white border border-[#373E47] hover:border-theme-primary transition-all cursor-pointer shadow-sm no-underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voltar ao Catálogo</span>
                <span className="sm:hidden">Voltar</span>
              </a>
            </div>
          </div>

          {/* SEÇÃO PRINCIPAL DO PRODUTO (LAYOUT COMPACTO E FLUIDO NO MOBILE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start mb-6 sm:mb-12 lg:mb-20">
            
            {/* COLUNA ESQUERDA: GALERIA / IMAGEM PRINCIPAL */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative w-full h-[340px] sm:h-[460px] md:h-[500px] bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 rounded-3xl p-6 sm:p-8 flex items-center justify-center overflow-hidden border border-gray-700/60 shadow-2xl group">
                {/* BADGE DA CATEGORIA FLUTUANTE */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-xl bg-gray-900/90 text-white border border-gray-700/80 shadow-lg backdrop-blur-md">
                    {produto.categoria}
                  </span>
                </div>

                {/* AÇÕES FLUTUANTES DA IMAGEM: FAVORITO + EXPANDIR ZOOM (ÍCONES PADRÃO E SEM DISTORÇÃO) */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  {showB2BQuotes && (
                    <button
                      type="button"
                      id="btn-favorite-main-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(produto.id);
                      }}
                      className={`w-10 h-10 shrink-0 aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
                        isFavorited(produto.id)
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-gray-900/85 hover:bg-neutral-800 text-gray-300 hover:text-amber-400 border-gray-700/80'
                      }`}
                      title={isFavorited(produto.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      aria-label={isFavorited(produto.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Heart
                        className={`w-5 h-5 shrink-0 transition-transform active:scale-125 ${
                          isFavorited(produto.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  )}

                  <button
                    type="button"
                    id="btn-zoom-main-image"
                    onClick={() => setIsImageZoomed(true)}
                    className="w-10 h-10 shrink-0 aspect-square rounded-xl bg-gray-900/85 hover:bg-theme-primary text-gray-200 hover:text-white border border-gray-700/80 shadow-lg backdrop-blur-md transition-all cursor-pointer flex items-center justify-center"
                    title="Expandir Imagem"
                    aria-label="Expandir Imagem"
                  >
                    <Maximize2 className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                {/* IMAGEM PRINCIPAL EM DESTAQUE */}
                <img
                  src={produto.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'}
                  alt={produto.titulo}
                  className="w-full h-full object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80';
                    e.currentTarget.className = "w-full h-full object-cover drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 opacity-80";
                  }}
                />

                {/* SELO DE QUALIDADE FARDIN */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <EditableText contentKey="diff_seal_text" defaultText="Padrão Técnico Fardin" as="span" />
                </div>
              </div>

              {/* DIFERENCIAIS DE FABRICAÇÃO E LOGÍSTICA (GLOBAIS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="w-full p-3 rounded-2xl bg-theme-card border border-[#2D3238] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <EditableText contentKey="diff_card1_title" defaultText="Aço Nobre" as="span" className="text-[11px] font-bold text-theme-title block" />
                    <EditableText contentKey="diff_card1_desc" defaultText="Alta Resistência" as="span" className="text-[10px] text-theme-body block" />
                  </div>
                </div>

                <div className="w-full p-3 rounded-2xl bg-theme-card border border-[#2D3238] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <EditableText contentKey="diff_card2_title" defaultText="Indução & Têmpera" as="span" className="text-[11px] font-bold text-theme-title block" />
                    <EditableText contentKey="diff_card2_desc" defaultText="Tratamento Térmico" as="span" className="text-[10px] text-theme-body block" />
                  </div>
                </div>

                <div className="w-full p-3 rounded-2xl bg-theme-card border border-[#2D3238] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <EditableText contentKey="diff_card3_title" defaultText="Logística B2B" as="span" className="text-[11px] font-bold text-theme-title block" />
                    <EditableText contentKey="diff_card3_desc" defaultText="Envio para todo Brasil" as="span" className="text-[10px] text-theme-body block" />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: INFORMAÇÕES TÉCNICAS E AÇÕES DE COTAÇÃO */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* CABEÇALHO DO PRODUTO (EDITÁVEL) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-theme-primary font-bold">
                    <EditableText contentKey="single_prod_badge" defaultText="Ficha Técnica & Engenharia" as="span" />
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs font-medium text-theme-body">
                    {produto.categoria}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-theme-title tracking-tight block">
                  {produto.titulo}
                </h1>

                {/* BLOCO DE CÓDIGO DE REFERÊNCIA */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#25292E] border border-[#373E47]">
                    <span className="text-xs font-mono text-theme-body">
                      <EditableText contentKey="single_prod_ref_label" defaultText="CÓDIGO REF:" as="span" />
                    </span>
                    <span className="text-sm font-mono font-bold text-theme-primary">
                      {produto.codigo_referencia}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-[#25292E] hover:bg-[#2D3238] text-theme-body hover:text-white transition-colors border border-[#373E47] cursor-pointer"
                    title="Copiar código de referência"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400 font-bold" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* DESCRIÇÃO COMPLETA */}
              <div className="p-5 rounded-2xl bg-theme-card border border-[#2D3238] space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-theme-title flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
                  <EditableText contentKey="single_prod_desc_heading" defaultText="Descrição do Produto & Aplicação" as="span" />
                </h2>
                <div className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </div>
              </div>

              {/* BLOCO DE ESPECIFICAÇÕES METALÚRGICAS (EXIBIDO ESTRITAMENTE APENAS SE HOUVER CONTEÚDO CADASTRADO NO PRODUTO) */}
              {Boolean(produto.especificacoes_metalurgicas && produto.especificacoes_metalurgicas.trim().length > 0) && (
                <div className="p-5 rounded-2xl bg-theme-card border border-[#2D3238] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-title flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-theme-primary" />
                    <span>Especificações Metalúrgicas</span>
                  </h3>
                  <div className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-line">
                    {produto.especificacoes_metalurgicas}
                  </div>
                </div>
              )}

              {/* SELETOR DE QUANTIDADE B2B */}
              {showB2BQuotes && (
                <div className="p-4 rounded-2xl bg-[#25292E] border border-[#373E47] flex flex-col gap-3">
                  <div>
                    <EditableText contentKey="single_prod_quantity_heading" defaultText="Quantidade:" as="span" className="text-xs font-bold text-white block" />
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-[#1D2125] p-1.5 rounded-xl border border-[#373E47] w-full sm:w-48 sm:max-w-[220px]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#25292E] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Diminuir"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#25292E] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Aumentar"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* BOTÕES DE AÇÃO (CTAS DE ALTA CONVERSÃO) */}
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                
                {/* BOTÃO WHATSAPP DIRETO */}
                <button
                  id="btn-single-prod-whatsapp"
                  onClick={(e) => {
                    if (isEditMode) {
                      e.preventDefault();
                      return;
                    }
                    handleWhatsAppQuote();
                  }}
                  className={`w-full flex items-center justify-center text-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl active:scale-98 cursor-pointer ${
                    businessStatus.isOnline
                      ? 'bg-theme-primary text-white hover:brightness-110 shadow-theme-primary/25'
                      : 'bg-[#25292E] text-gray-200 hover:text-white border border-[#373E47] hover:border-amber-500/50'
                  }`}
                >
                  {businessStatus.isOnline ? (
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  )}
                  <span>
                    <EditableText contentKey="single_prod_btn_whatsapp" defaultText="Solicitar Cotação via WhatsApp" as="span" />
                  </span>
                  {!businessStatus.isOnline && (
                    <span className="text-[10px] sm:text-[11px] text-amber-400 font-mono bg-amber-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-amber-800/60 ml-1 shrink-0">
                      Fora do Horário
                    </span>
                  )}
                </button>

                {/* BOTÃO ADICIONAR À COTAÇÃO MULTI-ITEM */}
                {showB2BQuotes && (
                  <button
                    id="btn-single-prod-quote"
                    onClick={(e) => {
                      if (isEditMode) {
                        e.preventDefault();
                        return;
                      }
                      addToQuote(produto, quantity);
                      setIsQuoteOpen(true);
                    }}
                    className={`w-full flex items-center justify-center text-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer border leading-snug ${
                      isInQuote(produto.id)
                        ? 'bg-theme-primary/20 text-theme-primary border-theme-primary/50 hover:bg-theme-primary/30'
                        : 'bg-[#25292E] text-white hover:bg-[#2D3238] border-[#373E47]'
                    }`}
                  >
                    {isInQuote(produto.id) ? (
                      <>
                        <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-theme-primary shrink-0" />
                        <span className="text-center">
                          Adicionado à Lista de Cotação ({getItemQuantity(produto.id)} un) – Ver Lista
                        </span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-theme-primary shrink-0" />
                        <span className="text-center">
                          Adicionar {quantity > 1 ? `${quantity} unidades` : 'Peça'} à Lista de Cotação
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* GARANTIA E ATENDIMENTO TÉCNICO */}
              <div className="pt-3 sm:pt-4 border-t border-[#2D3238] flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 text-xs text-theme-body">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-theme-primary shrink-0" />
                  <EditableText contentKey="single_prod_direct_support" defaultText="Atendimento Direto com Engenharia" as="span" />
                </div>
                <a
                  href="/#produtos"
                  onClick={(e) => {
                    e.preventDefault();
                    onBack('produtos');
                  }}
                  className="text-theme-primary hover:underline font-semibold cursor-pointer"
                >
                  <EditableText contentKey="single_prod_more_catalog_link" defaultText="Ver outras peças do catálogo →" as="span" />
                </a>
              </div>

            </div>

          </div>

          {/* SEÇÃO DE PRODUTOS RELACIONADOS / COMPLEMENTARES */}
          {produtosRelacionados.length > 0 && (
            <div className="pt-6 sm:pt-10 lg:pt-16 pb-4 sm:pb-8 border-t border-[#2D3238]">
              <div className="flex items-center justify-between mb-4 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-theme-title tracking-tight">
                    <EditableText contentKey="single_prod_related_title" defaultText="Peças Relacionadas & Complementares" as="span" />
                  </h2>
                  <p className="text-xs text-theme-body mt-1">
                    <EditableText contentKey="single_prod_related_desc" defaultText="Outros componentes da mesma categoria recomendados para reposição e montagem." as="span" />
                  </p>
                </div>

                <a
                  href="/#produtos"
                  onClick={(e) => {
                    e.preventDefault();
                    onBack('produtos');
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-theme-primary hover:underline cursor-pointer"
                >
                  <span>Ver todo o catálogo</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {produtosRelacionados.map((item) => {
                  const itemSlug = slugify(item.titulo) || item.id.toString();
                  return (
                    <a
                      key={item.id}
                      href={`/produto/${itemSlug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectProduct(item);
                      }}
                      className="bg-theme-card rounded-2xl border border-[#2D3238] hover:border-theme-primary/50 overflow-hidden flex flex-col justify-between hover:bg-[#25292E]/60 transition-all duration-200 group cursor-pointer shadow-lg no-underline"
                    >
                      <div className="relative h-48 bg-gradient-to-b from-slate-200 to-slate-300 p-4 flex items-center justify-center border-b border-gray-700/40 overflow-hidden">
                        <img
                          src={item.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'}
                          alt={item.titulo}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80';
                            e.currentTarget.className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 drop-shadow-md opacity-80";
                          }}
                        />
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-900/90 text-white border border-gray-700/80">
                          {item.categoria}
                        </span>

                        {/* BOTÃO DE FAVORITO PADRÃO E LIMPO (SOMENTE NO EXPEDIENTE COM B2B ATIVO) */}
                        {showB2BQuotes && (
                          <button
                            type="button"
                            id={`btn-fav-related-${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 shrink-0 aspect-square rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-md border ${
                              isFavorited(item.id)
                                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30'
                                : 'bg-gray-900/85 hover:bg-neutral-800 text-gray-300 hover:text-amber-400 border-gray-700/80'
                            }`}
                            title={isFavorited(item.id) ? 'Remover dos favoritos' : 'Favoritar peça'}
                            aria-label="Favoritar peça"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 shrink-0 transition-transform active:scale-125 ${
                                isFavorited(item.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#25292E] text-theme-primary border border-[#373E47] text-[10px] font-mono font-bold mb-1.5">
                            <span>{item.codigo_referencia}</span>
                          </div>
                          <h3 className="text-sm font-bold text-theme-title group-hover:text-white transition-colors line-clamp-1">
                            {item.titulo}
                          </h3>
                          <p className="text-xs text-theme-body line-clamp-2 mt-1">
                            {item.descricao}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#2D3238] flex items-center justify-between text-xs font-semibold text-theme-primary">
                          <span>Ver Ficha Técnica</span>
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL DE ZOOM DE IMAGEM (LIGHTBOX) */}
      {isImageZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-200 rounded-3xl p-6 sm:p-12 overflow-hidden shadow-2xl">
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              ✕
            </button>
            <img
              src={produto.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'}
              alt={produto.titulo}
              className="w-full max-h-[75vh] object-contain drop-shadow-2xl"
            />
            <div className="mt-4 text-center">
              <span className="text-sm font-bold text-gray-900 bg-white/80 px-4 py-1.5 rounded-full border border-gray-400">
                {produto.titulo} ({produto.codigo_referencia})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COTAÇÃO B2B */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />

      {/* MODAL DE FORA DO EXPEDIENTE */}
      <OfflineNoticeModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        whatsappUrl={whatsappUrl}
        whatsappNumber={currentWhatsApp}
        scheduleSummary={businessStatus.scheduleSummary}
        offlineMessage={businessStatus.offlineMessage}
        currentTimeStr={businessStatus.currentTimeStr}
        currentDayLabel={businessStatus.currentDayLabel}
      />

      {/* PILHA FLUTUANTE UNIFICADA (BAG, SUBIR A TELA, AVISO DE HORÁRIO E WHATSAPP) */}
      <FloatingActionStack onOpenQuote={() => setIsQuoteOpen(true)} />

      {/* FOOTER */}
      <Footer empresa={empresa} onOpenAdmin={onOpenAdmin} onNavigateHome={onBack} />
    </div>
  );
};
