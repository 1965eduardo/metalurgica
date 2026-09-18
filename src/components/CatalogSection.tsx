import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpRight, AlertCircle, RefreshCw, LayoutGrid, List, FileSpreadsheet, Check } from 'lucide-react';
import { Produto, Categoria } from '../types';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';
import { useQuote } from '../contexts/QuoteContext';
import { useAuth } from '../contexts/AuthContext';
import { slugify } from '../utils/slugify';
import { checkWhatsAppBusinessHours } from '../utils/whatsapp';

interface CatalogSectionProps {
  produtos: Produto[];
  onSelectProduct: (produto: Produto) => void;
  loading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: Categoria[];
  onOpenQuote?: () => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  produtos,
  onSelectProduct,
  loading,
  onRefresh,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  onOpenQuote,
}) => {
  const { content } = useContent();
  const { isEditMode, authToken } = useAuth();
  const isEditActive = Boolean(isEditMode || authToken);
  const { addToQuote, isInQuote, getItemQuantity, setIsQuoteModalOpen } = useQuote();
  const isB2BQuotesEnabled = content['enable_b2b_quotes'] !== 'false';
  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });
  const isBusinessHours = businessStatus.isOnline;
  // Rigorosa condição: cotações B2B só aparecem durante o expediente E se o B2B estiver ativo
  const showB2BQuotes = isB2BQuotesEnabled && isBusinessHours;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(4);
  const [visibleCount, setVisibleCount] = useState(12);

  // Reinicia contagem visível ao alterar busca ou categoria
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCategory]);

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 12);
  };

  const visibleProducts = produtos.slice(0, visibleCount);
  const hasMore = visibleCount < produtos.length;

  // Carregamento inicial das preferências salvas no localStorage
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem('fardin_view_mode');
      if (savedViewMode === 'grid' || savedViewMode === 'list') {
        setViewMode(savedViewMode);
      }

      const savedGridCols = localStorage.getItem('fardin_grid_cols');
      if (savedGridCols) {
        const num = parseInt(savedGridCols, 10);
        if (num === 2 || num === 3 || num === 4) {
          setGridCols(num);
        }
      }
    } catch (e) {
      console.warn('Não foi possível ler preferências do localStorage:', e);
    }
  }, []);

  // Funções com gravação automática no localStorage
  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('fardin_view_mode', mode);
    } catch (e) {
      console.warn('Erro ao salvar viewMode no localStorage:', e);
    }
  };

  const handleSetGridCols = (cols: 2 | 3 | 4) => {
    setGridCols(cols);
    try {
      localStorage.setItem('fardin_grid_cols', String(cols));
    } catch (e) {
      console.warn('Erro ao salvar gridCols no localStorage:', e);
    }
  };

  // Determinação das classes de Grid dinâmicas conforme a densidade escolhida
  const getGridColsClass = () => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  return (
    <section 
      id="produtos" 
      className="py-14 sm:py-20 lg:py-24 relative group"
      style={{ backgroundColor: content['catalog_bg_color'] || 'var(--theme-bg)' }}
    >
      {/* CONTROLE DE COR DA SEÇÃO CATÁLOGO */}
      <SectionColorControl
        contentKey="catalog_bg_color"
        defaultColor="#1A1D20"
        sectionName="Catálogo de Peças"
        positionClassName="top-6 right-4 sm:right-8"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CABEÇALHO DA SEÇÃO DE CATÁLOGO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#25292E] border border-[#373E47] text-xs font-mono uppercase text-theme-primary">
              <EditableText contentKey="catalog_badge" defaultText="Catálogo Técnico Industrial" as="span" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-theme-title tracking-tight">
              <EditableText contentKey="catalog_title" defaultText="Linha Completa de Peças & Implementos" as="span" />
            </h2>
            <div className="text-xs sm:text-sm text-theme-body">
              <EditableText contentKey="catalog_desc" defaultText="Consulte nossa grade forjada e temperada com precisão milimétrica. Busque por modelo, código de referência ou aplicação na lavoura." as="p" multiline />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-theme-body font-mono">
              {produtos.length > visibleCount
                ? `Exibindo ${visibleProducts.length} de ${produtos.length} itens`
                : `${produtos.length} ${produtos.length === 1 ? 'item disponível' : 'itens disponíveis'}`}
            </span>
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-[#25292E] hover:bg-[#2D3238] text-theme-body hover:text-theme-title transition-colors border border-[#373E47] cursor-pointer"
              title="Atualizar produtos do banco de dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-theme-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* BARRA DE PESQUISA INSTANTÂNEA E FILTROS */}
        <div className="mb-8 sm:mb-10 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            
            {/* CAMPO DE BUSCA TEXTUAL (TÍTULO OU REF-XXXX) */}
            <div className="md:col-span-8 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-theme-body">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="search-products-input"
                type="text"
                placeholder="Buscar por título ou código de referência (ex: REF-5012, Roçadeira)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-16 py-3 sm:py-3.5 rounded-xl bg-theme-card border border-[#2D3238] text-theme-title placeholder-[#6B7280] text-base sm:text-sm focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-theme-body hover:text-white cursor-pointer"
                >
                  <EditableText contentKey="catalog_btn_clear" defaultText="Limpar" as="span" />
                </button>
              )}
            </div>

            {/* SELETOR RÁPIDO DE CATEGORIAS MOBILE/DESKTOP */}
            <div className="md:col-span-4 flex items-center">
              <div className="w-full relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-theme-body">
                  <Filter className="w-4 h-4" />
                </div>
                <select
                  id="select-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#22262B] text-white border border-white/10 rounded-xl p-3 pl-10 pr-8 text-base sm:text-sm focus:border-theme-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                >
                  <option value="Todas" className="bg-[#22262B] text-white">Todas as Categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name} className="bg-[#22262B] text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-theme-body text-xs">
                  ▼
                </div>
              </div>
            </div>

          </div>

          {/* BARRA SUPERIOR DO GRID: TOTAL DE ITENS E ALTERNADOR GRADE / LISTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-theme-body flex items-center gap-2">
              <span>
                Mostrando <strong className="text-theme-title font-semibold">{produtos.length}</strong> {produtos.length === 1 ? 'peça' : 'peças'}
              </span>
              {selectedCategory !== 'Todas' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#22262B] text-theme-primary border border-white/10 text-xs font-medium">
                  {selectedCategory}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('Todas')}
                    className="hover:text-white transition-colors ml-0.5 text-sm leading-none"
                    title="Remover filtro de categoria"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            {/* GRUPO DE BOTÕES: SELETOR DE COLUNAS (SOMENTE EM MODO GRADE DESKTOP) + ALTERNADOR (GRADE / LISTA) */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              
              {/* SELETOR DE COLUNAS DINÂMICO (EXIBIDO APENAS NO MODO GRADE EM TELAS TABLET/DESKTOP) */}
              {viewMode === 'grid' && (
                <div className="hidden md:flex items-center gap-1 p-1 bg-[#25292E] rounded-xl border border-[#373E47]">
                  <span className="text-[10px] font-mono uppercase text-theme-muted px-1.5">Colunas:</span>
                  {([2, 3] as const).map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      id={`btn-grid-cols-${cols}`}
                      onClick={() => handleSetGridCols(cols)}
                      title={`${cols} colunas na grade`}
                      aria-label={`${cols} colunas na grade`}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        gridCols === cols
                          ? 'bg-gray-800 text-white border border-theme-primary shadow-sm ring-1 ring-theme-primary/50'
                          : 'text-theme-body hover:text-theme-title hover:bg-[#2D3238]'
                      }`}
                    >
                      {cols}
                    </button>
                  ))}
                  <button
                    type="button"
                    id="btn-grid-cols-4"
                    onClick={() => handleSetGridCols(4)}
                    title="4 colunas na grade"
                    aria-label="4 colunas na grade"
                    className={`hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      gridCols === 4
                        ? 'bg-gray-800 text-white border border-theme-primary shadow-sm ring-1 ring-theme-primary/50'
                        : 'text-theme-body hover:text-theme-title hover:bg-[#2D3238]'
                    }`}
                  >
                    4
                  </button>
                </div>
              )}

              {/* ALTERNADOR DE MODO (GRADE / LISTA) */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-[#25292E] rounded-xl border border-[#373E47]">
                <button
                  type="button"
                  id="view-mode-grid"
                  onClick={() => handleSetViewMode('grid')}
                  title="Exibição em Grade"
                  aria-label="Exibição em Grade"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-theme-primary text-white shadow-sm'
                      : 'text-theme-body hover:text-theme-title hover:bg-[#2D3238]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grade</span>
                </button>

                <button
                  type="button"
                  id="view-mode-list"
                  onClick={() => handleSetViewMode('list')}
                  title="Exibição em Lista"
                  aria-label="Exibição em Lista"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-theme-primary text-white shadow-sm'
                      : 'text-theme-body hover:text-theme-title hover:bg-[#2D3238]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE PRODUTOS (GRADE OU LISTA) */}
        {loading && produtos.length === 0 ? (
          <div className="py-16 text-center text-theme-body">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-theme-primary" />
            <p className="text-sm font-medium"><EditableText contentKey="catalog_loading" defaultText="Carregando catálogo da Metalúrgica Fardin..." as="span" /></p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-theme-card border border-[#2D3238] space-y-3">
            <AlertCircle className="w-10 h-10 text-theme-primary mx-auto" />
            <h3 className="text-base font-bold text-theme-title"><EditableText contentKey="catalog_empty_title" defaultText="Nenhum produto localizado" as="span" /></h3>
            <p className="text-xs text-theme-body max-w-md mx-auto">
              <EditableText contentKey="catalog_empty_desc" defaultText="Não encontramos peças com os termos buscados na categoria selecionada. Tente buscar por outros termos ou redefinir os filtros." as="span" />
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todas');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#25292E] text-white hover:bg-[#2D3238] border border-[#373E47]"
            >
              <EditableText contentKey="catalog_btn_reset" defaultText="Redefinir Filtros" as="span" />
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* MODO GRADE (GRID VIEW) */
          <div className={`grid ${getGridColsClass()} gap-4 sm:gap-6`}>
            {visibleProducts.map((produto, index) => {
              const productSlug = slugify(produto.titulo) || produto.id.toString();
              return (
              <div
                key={produto.id}
                id={`card-prod-${produto.id}`}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[data-no-navigate]')) {
                    return;
                  }
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onSelectProduct(produto);
                  }
                }}
                className="group relative bg-theme-card rounded-2xl border border-[#2D3238] hover:border-theme-primary/50 shadow-md hover:shadow-xl hover:shadow-black/40 transition-all duration-300 overflow-hidden flex flex-col w-full cursor-pointer"
              >
                {/* ÁREA DA IMAGEM PRINCIPAL COM EFEITO LIGHTBOX (ALTO CONTRASTE) */}
                <a
                  href={`/produto/${productSlug}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onSelectProduct(produto);
                    }
                  }}
                  className="relative w-full h-48 sm:h-52 bg-gradient-to-b from-slate-200 to-slate-300 rounded-t-xl p-3 sm:p-4 flex items-center justify-center overflow-hidden border-b border-gray-800 block cursor-pointer"
                >
                  <img
                    src={produto.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'}
                    alt={produto.titulo}
                    className="w-full h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80';
                      e.currentTarget.className = "w-full h-full object-cover drop-shadow-xl transition-transform duration-300 group-hover:scale-105 opacity-80";
                    }}
                  />

                  {/* BADGE DA CATEGORIA */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-gray-900/90 text-gray-200 border border-gray-700/80 shadow-md backdrop-blur-xs">
                      {produto.categoria}
                    </span>
                  </div>

                  {/* BADGE DO CÓDIGO DE REFERÊNCIA EM DESTAQUE */}
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-gray-900/90 text-gray-200 text-xs font-mono px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-gray-700/80 shadow-md backdrop-blur-xs">
                    <span className="text-[9px] text-gray-400 mr-1">REF:</span>
                    <span className="font-bold text-white">
                      {produto.codigo_referencia}
                    </span>
                  </div>
                </a>

                {/* CONTEÚDO DO CARD (DARK INDUSTRIAL) */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-theme-card">
                  <div className="space-y-2 mb-4">
                    <a
                      href={`/produto/${productSlug}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                          onSelectProduct(produto);
                        }
                      }}
                      className="no-underline block"
                    >
                      <h3 className="text-base font-bold text-theme-title tracking-tight group-hover:text-white line-clamp-2 transition-colors break-words">
                        {produto.titulo}
                      </h3>
                    </a>
                    <p className="text-xs text-theme-body line-clamp-2 leading-relaxed">
                      {produto.descricao}
                    </p>
                  </div>

                  {/* AÇÕES DO CARD (GRID VIEW) - EMPILHADOS E ALTURA CONFORTÁVEL PARA TOQUE */}
                  <div className="space-y-2 mt-auto pt-2">
                    {showB2BQuotes ? (
                      <div className="flex flex-col gap-2 w-full">
                        <a
                          href={`/produto/${productSlug}`}
                          id={`btn-detalhes-${produto.id}`}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey) {
                              e.preventDefault();
                              onSelectProduct(produto);
                            }
                          }}
                          className="w-full min-h-[44px] h-11 sm:h-10 px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 bg-theme-primary text-white hover:brightness-110 shadow-sm cursor-pointer select-none active:scale-98 no-underline"
                        >
                          {index === 0 ? (
                            <EditableText contentKey="catalog_btn_details" defaultText="Mais Detalhes" as="span" />
                          ) : (
                            <span>{content['catalog_btn_details'] || 'Mais Detalhes'}</span>
                          )}
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        </a>
                        <button
                          type="button"
                          id={`btn-quote-${produto.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditActive) {
                              e.preventDefault();
                              return;
                            }
                            addToQuote(produto, 1);
                            if (onOpenQuote) onOpenQuote();
                            else setIsQuoteModalOpen(true);
                          }}
                          className={`w-full min-h-[44px] h-11 sm:h-10 px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-98 ${
                            isInQuote(produto.id)
                              ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50 hover:bg-theme-primary/30'
                              : 'bg-[#25292E] text-white hover:bg-[#32373E] border border-[#373E47]'
                          }`}
                          title={isInQuote(produto.id) ? `Já na sua cotação (${getItemQuantity(produto.id)} un). Clique para abrir a lista ou adicionar mais.` : 'Adicionar esta peça à sua lista de cotação'}
                        >
                          {isInQuote(produto.id) ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                              <span className="truncate">Na Lista ({getItemQuantity(produto.id)})</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {index === 0 ? (
                                  <EditableText contentKey="catalog_btn_quote" defaultText="Cotar Peça" as="span" />
                                ) : (
                                  <span>{content['catalog_btn_quote'] || 'Cotar Peça'}</span>
                                )}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <a
                        href={`/produto/${productSlug}`}
                        id={`btn-detalhes-${produto.id}`}
                        onClick={(e) => {
                          if (!e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                            onSelectProduct(produto);
                          }
                        }}
                        className="w-full min-h-[44px] h-11 sm:h-10 px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-between transition-all duration-200 bg-theme-primary text-white hover:brightness-110 shadow-sm cursor-pointer select-none active:scale-98 no-underline"
                      >
                        {index === 0 ? (
                          <EditableText contentKey="catalog_btn_details" defaultText="Mais Detalhes" as="span" />
                        ) : (
                          <span>{content['catalog_btn_details'] || 'Mais Detalhes'}</span>
                        )}
                        <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          /* MODO LISTA (LIST VIEW) - TRAVADO EM 1 COLUNA UNIFICADA */
          <div className="grid grid-cols-1 gap-4 w-full">
            {visibleProducts.map((produto) => {
              const productSlug = slugify(produto.titulo) || produto.id.toString();
              return (
              <div
                key={produto.id}
                id={`row-prod-${produto.id}`}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[data-no-navigate]')) {
                    return;
                  }
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onSelectProduct(produto);
                  }
                }}
                className="bg-theme-card rounded-2xl border border-[#2D3238] hover:border-theme-primary/40 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch gap-5 hover:bg-[#25292E]/70 transition-all duration-200 group cursor-pointer shadow-md w-full"
              >
                {/* CONTAINER DA IMAGEM ESTICADO NO MODO LISTA */}
                <a
                  href={`/produto/${productSlug}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onSelectProduct(produto);
                    }
                  }}
                  className="relative h-48 sm:h-auto sm:h-full w-full sm:w-40 md:w-48 flex-shrink-0 bg-gradient-to-b from-slate-200 to-slate-300 rounded-xl p-3 flex items-center justify-center border border-gray-700/50 shadow-sm mx-auto sm:mx-0 overflow-hidden min-h-[140px] block cursor-pointer"
                >
                  <img
                    src={produto.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'}
                    alt={produto.titulo}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80';
                      e.currentTarget.className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 drop-shadow-md opacity-80";
                    }}
                  />
                </a>

                {/* BLOCO DE INFORMAÇÕES QUE OCUPA O RESTANTE DO CARD */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-theme-bg text-[#D1D5DB] border border-[#373E47]">
                        {produto.categoria}
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-btn-dark-bg text-btn-dark-text border border-theme-primary/40">
                        <span className="text-[9px] font-mono text-theme-body">REF:</span>
                        <span className="text-xs font-mono font-bold text-theme-primary">
                          {produto.codigo_referencia}
                        </span>
                      </div>
                    </div>

                    <a
                      href={`/produto/${productSlug}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                          onSelectProduct(produto);
                        }
                      }}
                      className="no-underline block"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-theme-title group-hover:text-white transition-colors mb-2">
                        {produto.titulo}
                      </h3>
                    </a>

                    <p className="text-xs sm:text-sm text-theme-body leading-relaxed line-clamp-3">
                      {produto.descricao}
                    </p>
                  </div>

                  {/* PARTE INFERIOR: BOTÕES DE AÇÃO PADRONIZADOS */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full pt-3 border-t border-[#2D3238]/80">
                    <a
                      href={`/produto/${productSlug}`}
                      id={`btn-list-detalhes-${produto.id}`}
                      onClick={(e) => {
                        if (!e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                          onSelectProduct(produto);
                        }
                      }}
                      className="min-h-[44px] h-11 sm:h-[42px] px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 flex-1 w-full bg-theme-primary text-white hover:brightness-110 shadow-sm cursor-pointer select-none active:scale-98 no-underline"
                    >
                      <span>Mais Detalhes</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>

                    {showB2BQuotes && (
                      <button
                        type="button"
                        id={`btn-list-quote-${produto.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditActive) {
                            e.preventDefault();
                            return;
                          }
                          addToQuote(produto, 1);
                          if (onOpenQuote) onOpenQuote();
                          else setIsQuoteModalOpen(true);
                        }}
                        className={`min-h-[44px] h-11 sm:h-[42px] px-4 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 flex-1 w-full shadow-sm cursor-pointer active:scale-98 ${
                          isInQuote(produto.id)
                            ? 'bg-theme-primary/20 text-theme-primary border border-theme-primary/50 hover:bg-theme-primary/30'
                            : 'bg-[#25292E] text-white hover:bg-[#32373E] border border-[#373E47]'
                        }`}
                      >
                        {isInQuote(produto.id) ? (
                          <>
                            <Check className="w-4 h-4 text-theme-primary" />
                            <span>Na Lista ({getItemQuantity(produto.id)} un)</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Adicionar à Cotação</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* ÁREA DO BOTÃO / FIM DO CATÁLOGO */}
        {produtos.length > 0 && (
          <div className="flex justify-center pt-10 pb-4">
            {hasMore ? (
              <button
                onClick={(e) => {
                  if (isEditMode) {
                    e.preventDefault();
                    return;
                  }
                  handleLoadMore();
                }}
                className="relative overflow-visible bg-theme-primary hover:brightness-110 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <EditableText contentKey="catalog_btn_load_more" defaultText="Carregar mais" as="span" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium py-2 px-4 bg-gray-800/20 rounded-full border border-gray-800">
                <span>✨</span>
                <span>Sem mais produtos</span>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

