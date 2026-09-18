import React, { useState, useEffect, useCallback } from 'react';
import { ReactLenis } from 'lenis/react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ParallaxSection } from './components/ParallaxSection';
import { CatalogSection } from './components/CatalogSection';
import { B2BMetricsSection } from './components/B2BMetricsSection';
import { EngineeringSection } from './components/EngineeringSection';
import { MapSection } from './components/MapSection';
import { ProductPage } from './components/ProductPage';
import { QuoteModal } from './components/QuoteModal';
import { ContactSection } from './components/ContactSection';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { FloatingActionStack } from './components/FloatingActionStack';
import { EMPRESA_DATA } from './data/initialData';
import { Produto, DbStatus, Categoria } from './types';
import { useAuth } from './contexts/AuthContext';
import { slugify } from './utils/slugify';

export default function App() {
  const { authToken, handleLogin, handleLogout } = useAuth();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  });

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Monitorar rotas administrativas (/admin)
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        const isPathAdmin = window.location.pathname.startsWith('/admin');
        if (isPathAdmin) {
          if (isMobileDevice()) {
            alert("Nosso painel está desativado para o modo mobile, acesse por um desktop ou notebook.");
            window.history.replaceState({}, '', '/');
            setIsAdminOpen(false);
            setIsAdminRoute(false);
            return;
          }
          setIsAdminRoute(true);
          setIsAdminOpen(true);
        } else {
          setIsAdminRoute(false);
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleOpenAdmin = useCallback(() => {
    if (isMobileDevice()) {
      alert("Nosso painel está desativado para o modo mobile, acesse por um desktop ou notebook.");
      return;
    }
    setIsAdminOpen(true);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/admin');
      setIsAdminRoute(true);
    }
  }, []);

  const handleCloseAdmin = useCallback(() => {
    setIsAdminOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
      setIsAdminRoute(false);
    }
  }, []);

  // ESTADO QUE CONTROLA A ABERTURA DO MODAL B2B
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [categories, setCategories] = useState<Categoria[]>([]);

  // Carregar status do Banco de Dados Neon
  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.warn('Erro ao consultar status do banco:', e);
    }
  }, []);

  // Carregar Categorias
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias');
      if (res.ok) {
        const data = await res.json();
        if (data.categorias && data.categorias.length > 0) {
          setCategories(data.categorias);
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar categorias:', e);
    }
  }, []);

  // Carregar Catálogo com Busca ILIKE no backend PostgreSQL
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (selectedCategory && selectedCategory !== 'Todas') {
        params.set('categoria', selectedCategory);
      }

      const res = await fetch(`/api/produtos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.produtos)) {
          setProdutos(data.produtos);
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar produtos da API:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProdutos();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProdutos]);

  // Lógica de manipulação de Histórico e Roteamento de Produto (/produto/:slug com fallback para ID)
  const handleSelectProduct = useCallback((p: Produto | null) => {
    setSelectedProduct(p);

    if (typeof window !== 'undefined') {
      if (p) {
        const productSlug = slugify(p.titulo) || p.id.toString();
        const targetUrl = `/produto/${productSlug}`;
        window.history.pushState({ productId: p.id, slug: productSlug }, '', targetUrl);
      } else {
        window.history.pushState({}, '', '/#produtos');
      }
    }
  }, []);

  // Monitorar popstate e sincronizar a rota com o produto selecionado
  useEffect(() => {
    const syncRouteWithProduct = () => {
      if (typeof window === 'undefined') return;

      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const querySlug = searchParams.get('produto');

      // Checar se está em rota /produto/:slug ou /produtos/:slug ou search param ?produto=
      const isProductRoute = pathname.startsWith('/produto/') || pathname.startsWith('/produtos/');
      const rawParam = isProductRoute 
        ? decodeURIComponent(pathname.replace(/^\/(produto|produtos)\//, '').split('/')[0])
        : (querySlug ? decodeURIComponent(querySlug) : '');

      if (rawParam && produtos.length > 0) {
        const normalizedParam = slugify(rawParam) || rawParam.toLowerCase();

        // 1. Busca por slug amigável do título
        let found = produtos.find((p) => slugify(p.titulo) === normalizedParam);

        // 2. Fallback: busca por ID numérico/UUID caso link legado seja acessado
        if (!found) {
          found = produtos.find((p) => p.id.toString() === rawParam || p.id === Number(rawParam));
        }

        // 3. Fallback: busca por código de referência
        if (!found) {
          found = produtos.find((p) => 
            slugify(p.codigo_referencia) === normalizedParam || 
            p.codigo_referencia.toLowerCase() === rawParam.toLowerCase()
          );
        }

        if (found) {
          if (selectedProduct?.id !== found.id) {
            setSelectedProduct(found);
          }
        } else if (!isProductRoute && !querySlug && selectedProduct) {
          setSelectedProduct(null);
        }
      } else if (!isProductRoute && !querySlug && selectedProduct) {
        setSelectedProduct(null);
      }
    };

    syncRouteWithProduct();

    window.addEventListener('popstate', syncRouteWithProduct);
    return () => window.removeEventListener('popstate', syncRouteWithProduct);
  }, [produtos, selectedProduct]);

  useEffect(() => {
    fetchDbStatus();
    fetchCategories();
  }, [fetchDbStatus, fetchCategories]);

  const scrollToSection = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateToSection = useCallback((sectionId: string = 'produtos') => {
    setSelectedProduct(null);
    const cleanId = sectionId ? sectionId.replace(/^#/, '') : 'produtos';
    const hash = cleanId ? `#${cleanId}` : '';
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${hash}`);
      setTimeout(() => {
        if (cleanId === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(cleanId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 60);
    }
  }, []);

  // Rolagem suave para hash quando a home é carregada ou retornada
  useEffect(() => {
    if (!selectedProduct && typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        if (id === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedProduct]);

  const isPublicPage = !isAdminRoute && !isAdminOpen;

  // Garantir que classes do Lenis e overflow: hidden sejam removidos no modo admin
  useEffect(() => {
    if (!isPublicPage) {
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    }
  }, [isPublicPage]);

  const handleProductUpdate = (updatedProd: Produto) => {
    setSelectedProduct(updatedProd);
    setProdutos((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    const newSlug = slugify(updatedProd.titulo) || updatedProd.id.toString();
    window.history.replaceState({ produtoId: updatedProd.id }, '', `/produto/${newSlug}`);
  };

  // Se um produto estiver selecionado/na rota /produto/:id, renderiza a Single Product Page dedicada
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-theme-bg text-theme-title flex flex-col selection:bg-theme-primary selection:text-white">
        {/* PÁGINA DEDICADA DO PRODUTO (SINGLE PRODUCT PAGE) */}
        <ProductPage
          produto={selectedProduct}
          todosProdutos={produtos}
          empresa={EMPRESA_DATA}
          onBack={handleNavigateToSection}
          onSelectProduct={handleSelectProduct}
          onOpenAdmin={handleOpenAdmin}
          dbStatus={dbStatus}
          onLogout={handleLogout}
          onUpdateProduct={handleProductUpdate}
        />

        {/* PAINEL ADMINISTRATIVO */}
        <AdminPanel
          isOpen={isAdminOpen || isAdminRoute}
          onClose={handleCloseAdmin}
          token={authToken}
          onLogin={handleLogin}
          onLogout={handleLogout}
          produtos={produtos}
          onRefreshProdutos={() => {
            fetchProdutos();
            fetchCategories();
          }}
          dbStatus={dbStatus}
          onRefreshDbStatus={fetchDbStatus}
          categorias={categories}
        />
      </div>
    );
  }

  const pageContent = (
    <div className="min-h-screen bg-theme-bg text-theme-title flex flex-col selection:bg-theme-primary selection:text-white">
      {/* HEADER FIXO / STICKY */}
      <Header
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={Boolean(authToken)}
        dbStatus={dbStatus}
        onLogout={handleLogout}
        onOpenQuote={() => setIsQuoteOpen(true)}
      />

      {/* HERO SECTION */}
      <Hero
        onExploreCatalog={() => scrollToSection('produtos')}
        onContactEngineering={() => scrollToSection('contato')}
        onOpenQuote={() => setIsQuoteOpen(true)}
      />

      {/* SEÇÃO A EMPRESA */}
      <AboutSection empresa={EMPRESA_DATA} />

      {/* BANNER PARALLAX */}
      <ParallaxSection
        onExploreCatalog={() => scrollToSection('produtos')}
        onContact={() => scrollToSection('contato')}
      />

      {/* CATÁLOGO DE PRODUTOS */}
      <CatalogSection
        produtos={produtos}
        onSelectProduct={handleSelectProduct}
        loading={loading}
        onRefresh={() => {
          fetchProdutos();
          fetchCategories();
          fetchDbStatus();
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        onOpenQuote={() => setIsQuoteOpen(true)}
      />

      {/* SEÇÃO DE MÉTRICAS B2B (RÉGUA DE NÚMEROS) */}
      <B2BMetricsSection />

      {/* SEÇÃO DE ENGENHARIA E QUALIDADE (DIFERENCIAIS TÉCNICOS) */}
      <EngineeringSection />

      {/* MAPA DINÂMICO */}
      <MapSection />

      {/* SEÇÃO DE CONTATO */}
      <ContactSection empresa={EMPRESA_DATA} />

      {/* RODAPÉ */}
      <Footer empresa={EMPRESA_DATA} onOpenAdmin={handleOpenAdmin} />

      {/* PILHA FLUTUANTE UNIFICADA (BAG, SUBIR A TELA, AVISO DE HORÁRIO E WHATSAPP) */}
      <FloatingActionStack onOpenQuote={() => setIsQuoteOpen(true)} />

      {/* MODAL ESTRUTURADO DE COTAÇÃO / ORÇAMENTO B2B */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />

      {/* PAINEL ADMINISTRATIVO */}
      <AdminPanel
        isOpen={isAdminOpen || isAdminRoute}
        onClose={handleCloseAdmin}
        token={authToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        produtos={produtos}
        onRefreshProdutos={() => {
          fetchProdutos();
          fetchCategories();
        }}
        dbStatus={dbStatus}
        onRefreshDbStatus={fetchDbStatus}
        categorias={categories}
      />
    </div>
  );

  return isPublicPage ? (
    <ReactLenis root>
      {pageContent}
    </ReactLenis>
  ) : (
    pageContent
  );
}