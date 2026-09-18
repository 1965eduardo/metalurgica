import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, ChevronRight, Lock, LogOut, ShoppingCart } from 'lucide-react';
import { DbStatus } from '../types';
import { EditableText } from './EditableText';
import { useContent } from '../contexts/ContentContext';
import { checkWhatsAppBusinessHours } from '../utils/whatsapp';

interface HeaderProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  dbStatus: DbStatus | null;
  onLogout: () => void;
  onOpenQuote?: () => void;
  onNavigateHome?: (sectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAdmin, 
  isAdminLoggedIn, 
  dbStatus, 
  onLogout,
  onOpenQuote,
  onNavigateHome
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { content } = useContent();

  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });
  const isBusinessHours = businessStatus.isOnline;
  const isB2BQuotesEnabled = content['enable_b2b_quotes'] !== 'false';
  const showB2BQuotes = isB2BQuotesEnabled && isBusinessHours;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fechar menu mobile com tecla Escape e controlar overflow do body
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.body.classList.add('overflow-hidden', 'md:overflow-auto');
    } else {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { key: 'nav_item_1', default: 'Home', href: '/#home', sectionId: 'home' },
    { key: 'nav_item_2', default: 'A Empresa', href: '/#empresa', sectionId: 'empresa' },
    { key: 'nav_item_3', default: 'Produtos', href: '/#produtos', sectionId: 'produtos' },
    { key: 'nav_item_4', default: 'Contato', href: '/#contato', sectionId: 'contato' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavigateHome) {
      e.preventDefault();
      onNavigateHome(sectionId);
      return;
    }

    e.preventDefault();
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/#${sectionId}`);
    }
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 text-white ${
        isScrolled
          ? 'bg-[#121417]/80 backdrop-blur-md shadow-lg py-3 border-b border-white/10'
          : 'bg-[#121417]/40 backdrop-blur-md py-5 border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* LOGO DA METALÚRGICA FARDIN */}
        <a 
          href="/#home" 
          onClick={(e) => handleNavClick(e, 'home')} 
          className="flex items-center group py-0.5 cursor-pointer" 
          title="Metalúrgica Fardin - Página Inicial"
        >
          <img
            src={content['site_logo_url']?.trim() || '/Fardin-logo.png'}
            alt="Metalúrgica Fardin"
            className="h-[46px] sm:h-[54px] max-w-[190px] sm:max-w-[220px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </a>

        {/* NAVEGAÇÃO DESKTOP */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.sectionId)}
              className="text-sm font-medium text-gray-200 hover:text-theme-primary transition-colors relative py-1 hover:after:w-full after:w-0 after:h-0.5 after:bg-theme-primary after:absolute after:bottom-0 after:left-0 after:transition-all cursor-pointer"
            >
              <EditableText contentKey={link.key} defaultText={link.default} />
            </a>
          ))}
        </nav>

        {/* AÇÕES (ÁREA ADMINISTRATIVA & COTAÇÃO) */}
        <div className="hidden lg:flex items-center gap-3">
          {showB2BQuotes && onOpenQuote && (
            <button
              type="button"
              onClick={onOpenQuote}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all bg-[#25292E] text-theme-primary border border-theme-primary/30 hover:bg-theme-primary hover:text-white active:scale-95 cursor-pointer"
              title="Abrir Lista de Cotação B2B"
              aria-label="Abrir Lista de Cotação B2B"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cotação B2B</span>
            </button>
          )}

          {/* Botão de Acesso Administrativo */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Painel Admin Ativo</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-gray-300 bg-[#25292E] border border-[#373E47] hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-colors"
                title="Sair do Modo de Edição"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-header-admin-login"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all bg-[#25292E] text-gray-200 border border-[#373E47] hover:bg-[#2D3238] hover:text-white hover:border-theme-primary/50 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-theme-primary shrink-0" />
              <EditableText contentKey="header_btn_admin" defaultText="Área Restrita" as="span" />
            </button>
          )}
        </div>

        {/* BOTÃO MOBILE HAMBURGER & COTAÇÃO */}
        <div className="lg:hidden flex items-center gap-2">
          {showB2BQuotes && onOpenQuote && (
            <button
              type="button"
              onClick={onOpenQuote}
              className="p-2.5 rounded-xl bg-[#25292E] text-theme-primary border border-theme-primary/30 hover:bg-[#2D3238] active:scale-95 transition-all cursor-pointer"
              title="Abrir Cotação B2B"
              aria-label="Abrir Cotação B2B"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}
          <button
            id="btn-mobile-menu"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-[#25292E] text-gray-200 border border-[#373E47] hover:bg-[#2D3238] hover:text-white active:scale-95 transition-all cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fechar Menu de Navegação" : "Abrir Menu de Navegação"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* BACKDROP DO MENU MOBILE */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[65px] sm:top-[77px] bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MENU MOBILE EXPANSÍVEL */}
      {mobileMenuOpen && (
        <div 
          id="mobile-nav-panel"
          className="absolute left-4 right-4 top-[calc(100%+8px)] z-40 lg:hidden bg-[#121417]/98 backdrop-blur-xl border border-[#373E47] p-5 space-y-3 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-100px)] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#25292E] text-xs font-mono uppercase text-theme-muted">
            <span>Navegação</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-[#25292E] border border-[#373E47]"
            >
              Fechar ✕
            </button>
          </div>

          <div className="space-y-1 py-1">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.sectionId)}
                className="flex items-center justify-between min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:text-white hover:bg-white/5 active:bg-theme-primary/20 transition-colors cursor-pointer"
              >
                <EditableText contentKey={link.key} defaultText={link.default} as="span" />
                <ChevronRight className="w-4 h-4 text-[#6B7280]" />
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
