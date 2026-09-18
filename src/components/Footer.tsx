import React from 'react';
import { EmpresaInfo } from '../types';
import { ShieldCheck } from 'lucide-react';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';

interface FooterProps {
  empresa: EmpresaInfo;
  onOpenAdmin: () => void;
  onNavigateHome?: (sectionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ empresa, onOpenAdmin, onNavigateHome }) => {
  const { content } = useContent();
  const { isEditMode } = useAuth();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
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
    <footer 
      className="text-theme-body border-t border-[#25292E] pt-14 pb-28 sm:pb-20 relative group"
      style={{ backgroundColor: content['footer_bg_color'] || '#111315' }}
    >
      {/* CONTROLE DE COR DA SEÇÃO RODAPÉ */}
      <SectionColorControl
        contentKey="footer_bg_color"
        defaultColor="#111315"
        sectionName="Rodapé"
        positionClassName="top-4 right-4 sm:right-8"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-[#25292E]">
          
          {/* IDENTIDADE */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center">
              <a 
                href="/#home" 
                onClick={(e) => handleNavClick(e, 'home')} 
                className="inline-block group py-1 cursor-pointer" 
                title="Metalúrgica Fardin - Página Inicial"
              >
                <img
                  src={content['site_logo_url']?.trim() || '/Fardin-logo.png'}
                  alt="Metalúrgica Fardin"
                  className="h-[42px] sm:h-[48px] max-w-[180px] sm:max-w-[210px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </a>
            </div>
            <div className="text-xs text-theme-body leading-relaxed max-w-sm">
              <EditableText contentKey="footer_desc" defaultText={`Tradição no setor de implementos e peças agrícolas desde ${empresa.fundacao}. Soluções de alta precisão forjadas para máxima tenacidade e durabilidade em campo.`} as="p" multiline />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-theme-primary shrink-0" />
              <EditableText 
                contentKey="footer_purpose" 
                defaultText={content['footer_purpose'] || `Propósito: "${empresa.proposito}"`} 
                as="span" 
              />
            </div>
          </div>

          {/* LINKS RÁPIDOS / MAPA DO SITE */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-title">
              <EditableText contentKey="footer_nav_title" defaultText="Navegação" as="span" />
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="/#home" 
                  onClick={(e) => handleNavClick(e, 'home')}
                  className="hover:text-white transition-colors cursor-pointer block py-0.5"
                >
                  <EditableText contentKey="footer_nav_1" defaultText="Página Inicial" as="span" />
                </a>
              </li>
              <li>
                <a 
                  href="/#empresa" 
                  onClick={(e) => handleNavClick(e, 'empresa')}
                  className="hover:text-white transition-colors cursor-pointer block py-0.5"
                >
                  <EditableText contentKey="footer_nav_2" defaultText="A Empresa & Trajetória" as="span" />
                </a>
              </li>
              <li>
                <a 
                  href="/#produtos" 
                  onClick={(e) => handleNavClick(e, 'produtos')}
                  className="hover:text-white transition-colors cursor-pointer block py-0.5"
                >
                  <EditableText contentKey="footer_nav_3" defaultText="Catálogo Técnico de Peças" as="span" />
                </a>
              </li>
              <li>
                <a 
                  href="/#contato" 
                  onClick={(e) => handleNavClick(e, 'contato')}
                  className="hover:text-white transition-colors cursor-pointer block py-0.5"
                >
                  <EditableText contentKey="footer_nav_4" defaultText="Orçamento & Atendimento" as="span" />
                </a>
              </li>
            </ul>
          </div>

          {/* ADMIN & CONTATO */}
          <div className="hidden lg:block lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-title">
              <EditableText contentKey="footer_admin_title" defaultText="Acesso Corporativo" as="span" />
            </h4>
            <div className="text-xs text-theme-body">
              <EditableText contentKey="footer_admin_desc" defaultText="Gestão interna do catálogo de produtos e parâmetros de engenharia." as="p" multiline />
            </div>
            <div>
              <button
                onClick={(e) => {
                  if (isEditMode) {
                    e.preventDefault();
                    return;
                  }
                  onOpenAdmin();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-theme-bg text-[#D1D5DB] hover:text-white hover:bg-[#25292E] border border-[#2D3238] transition-colors cursor-pointer min-h-[44px] w-full sm:w-auto active:scale-98"
              >
                <EditableText contentKey="footer_btn_admin" defaultText="Acessar Painel Administrativo" as="span" />
              </button>
            </div>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="pt-8 flex items-center justify-center sm:justify-start text-xs text-center sm:text-left">
          <EditableText contentKey="footer_copyright" defaultText={`© ${new Date().getFullYear()} ${empresa.nome}. Todos os direitos reservados. Fundada em ${empresa.fundacao}.`} as="span" multiline />
        </div>

      </div>
    </footer>
  );
};
