import React from 'react';
import { ArrowRight, Wrench, ShieldCheck, Cog, CheckCircle2 } from 'lucide-react';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';

interface HeroProps {
  onExploreCatalog: () => void;
  onContactEngineering: () => void;
  onOpenQuote?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCatalog, onContactEngineering, onOpenQuote }) => {
  const { content } = useContent();
  const { isEditMode } = useAuth();

  let heroSettings: {
    hero_bg_image: string;
    hero_overlay_opacity: number;
    banner_height: number;
    banner_height_desktop?: number;
    banner_height_tablet?: number;
    banner_height_mobile?: number;
  } = {
    hero_bg_image: '',
    hero_overlay_opacity: 85,
    banner_height: 80
  };

  if (content['hero_settings']) {
    try {
      const parsed = JSON.parse(content['hero_settings']);
      heroSettings = { ...heroSettings, ...parsed };
    } catch (e) {
      console.warn('Erro ao parsear hero_settings:', e);
    }
  }

  // Se hero_bg_image estiver vazio, nulo ou não configurado, o valor padrão DEVE ser estritamente ""
  const heroBgImage = (heroSettings.hero_bg_image || content['hero_bg_image'] || '').trim();

  const bannerHeightDesktop = heroSettings.banner_height_desktop ?? heroSettings.banner_height ?? 80;
  const bannerHeightTablet = heroSettings.banner_height_tablet ?? heroSettings.banner_height ?? 70;
  const bannerHeightMobile = heroSettings.banner_height_mobile ?? heroSettings.banner_height ?? 60;

  // Cor de fundo do Hero vinda da paleta (hero_bg_color)
  const heroBgColor = content['hero_bg_color'] || (content as any).hero_bg_color || '#1A1D20';

  // Opacidade do overlay
  const bgOpacityValue = (heroSettings.hero_overlay_opacity ?? 85) / 100;
  const overlayStyle = {
    backgroundColor: `rgba(26, 29, 32, ${bgOpacityValue})`
  };

  return (
    <section 
      id="home" 
      className="relative flex items-center pt-32 sm:pt-36 pb-12 sm:pb-16 overflow-hidden transition-all duration-300 group"
      style={{ 
        backgroundColor: heroBgColor
      }}
    >
      <style>{`
        #home {
          min-height: ${bannerHeightMobile}vh;
        }
        @media (min-width: 768px) {
          #home {
            min-height: ${bannerHeightTablet}vh;
          }
        }
        @media (min-width: 1024px) {
          #home {
            min-height: ${bannerHeightDesktop}vh;
          }
        }
      `}</style>
      {/* CONTROLE DE COR DA SEÇÃO HERO */}
      <SectionColorControl
        contentKey="hero_bg_color"
        defaultColor="#1A1D20"
        sectionName="Banner Principal"
        positionClassName="top-28 right-4 sm:right-8"
      />

      {/* BACKGROUND COM IMAGEM - RENDERIZAÇÃO CONDICIONAL APENAS SE HOUVER IMAGEM */}
      {heroBgImage ? (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
            style={{ backgroundImage: `url(${heroBgImage})` }}
          />
          
          {/* Camada de Sobreposição ajustável */}
          <div 
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none" 
            style={overlayStyle} 
          />

          {/* Textura sutil geométrica industrial */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#F8F9FA 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>
      ) : null}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          {/* BADGE DE TRADIÇÃO */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25292E]/90 border border-[#373E47] text-xs font-semibold text-[#D1D5DB] mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-theme-primary" />
            <EditableText
              contentKey="hero_badge"
              defaultText="Engenharia & Forjamento Agrícola desde 1983"
            />
          </div>

          {/* TÍTULO PRINCIPAL DE IMPACTO */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-theme-title tracking-tight leading-[1.15] mb-5 sm:mb-6 break-words">
            <EditableText
              contentKey="hero_title"
              defaultText={
                content['hero_title'] ||
                (content['hero_title_part1'] && content['hero_title_highlight']
                  ? `${content['hero_title_part1']}${content['hero_title_highlight']}`
                  : 'Soluções Precisas em Peças para o Agronegócio')
              }
              as="span"
              className="inline-block"
              multiline
            />
          </h1>

          {/* SUBTÍTULO INSTITUCIONAL */}
          <div className="mb-8 sm:mb-10 max-w-2xl text-base sm:text-xl text-theme-body font-normal leading-relaxed">
            <EditableText
              contentKey="hero_subtitle"
              defaultText="Há mais de quatro décadas aliando tecnologia de ponta, ligas metálicas certificadas e rigor dimensional para manter a produtividade máxima de suas operações e implementos no campo."
              as="p"
              multiline
            />
          </div>

          {/* BOTÕES DE AÇÃO (CTAs) - Edição Inline Padrão e Ação Direta */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-10 sm:mb-14">
            <button
              type="button"
              id="btn-hero-catalogo"
              onClick={(e) => {
                if (isEditMode) {
                  return;
                }
                onExploreCatalog();
              }}
              className="px-7 py-4 rounded-xl text-sm font-bold text-white bg-theme-primary hover:brightness-110 shadow-lg shadow-theme-primary/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <EditableText
                contentKey="hero_btn_catalog"
                defaultText="Catálogo de Produtos"
                as="span"
              />
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            <button
              type="button"
              id="btn-hero-engenharia"
              onClick={(e) => {
                if (isEditMode) {
                  return;
                }
                onContactEngineering();
              }}
              className="px-7 py-4 rounded-xl text-sm font-bold text-white bg-[#25292E] hover:bg-[#2D3238] border border-[#373E47] transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-lg"
            >
              <Wrench className="w-4 h-4 text-theme-primary shrink-0" />
              <EditableText
                contentKey="hero_btn_specialist"
                defaultText="Falar com Especialista"
                as="span"
              />
            </button>
          </div>

          {/* MÉTRICAS / PILARES INDUSTRIAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-white/40 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <EditableText contentKey="hero_metric1_title" defaultText="+40 Anos" as="p" className="text-sm font-bold text-theme-title" />
                <EditableText contentKey="hero_metric1_desc" defaultText="Tradição e Solidez" as="p" className="text-xs text-theme-body" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                <Cog className="w-5 h-5" />
              </div>
              <div>
                <EditableText contentKey="hero_metric2_title" defaultText="Aço Certificado" as="p" className="text-sm font-bold text-theme-title" />
                <EditableText contentKey="hero_metric2_desc" defaultText="Tratamento Térmico" as="p" className="text-xs text-theme-body" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <EditableText contentKey="hero_metric3_title" defaultText="Pronta Entrega" as="p" className="text-sm font-bold text-theme-title" />
                <EditableText contentKey="hero_metric3_desc" defaultText="Suporte B2B Nacional" as="p" className="text-xs text-theme-body" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};