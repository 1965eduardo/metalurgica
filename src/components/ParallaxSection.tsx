import React from 'react';
import { Sparkles } from 'lucide-react';
import { useContent } from '../contexts/ContentContext';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';

interface ParallaxSectionProps {
  onExploreCatalog?: () => void;
  onContact?: () => void;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = () => {
  const { content } = useContent();

  const imageUrl = (content['parallax_image_url'] || '').trim();
  const overlayOpacity = content['parallax_overlay'] !== undefined 
    ? Number(content['parallax_overlay']) 
    : 70;
  let parallaxSettings = {
    parallax_image_url: '',
    parallax_overlay: 70,
    parallax_height: 500,
    parallax_height_desktop: 500,
    parallax_height_tablet: 400,
    parallax_height_mobile: 350,
  };
  if (content['parallax_settings']) {
    try {
      const parsed = JSON.parse(content['parallax_settings']);
      parallaxSettings = { ...parallaxSettings, ...parsed };
    } catch (e) {
      // ignore
    }
  }

  const parallaxHeightDesktop = parallaxSettings.parallax_height_desktop ?? parallaxSettings.parallax_height ?? (content['parallax_height'] !== undefined ? Number(content['parallax_height']) : 500);
  const parallaxHeightTablet = parallaxSettings.parallax_height_tablet ?? parallaxSettings.parallax_height ?? 400;
  const parallaxHeightMobile = parallaxSettings.parallax_height_mobile ?? parallaxSettings.parallax_height ?? 350;

  const parallaxBgColor = content['parallax_bg_color'] || content['hero_bg_color'] || '#1A1D20';

  return (
    <section 
      id="destaque-parallax"
      className={`${imageUrl ? 'bg-fixed bg-center bg-cover' : ''} relative flex items-center justify-center overflow-hidden transition-all duration-300 group`}
      style={{ 
        backgroundColor: parallaxBgColor,
        ...(imageUrl ? { backgroundImage: `url(${imageUrl})` } : {})
      }}
    >
      <style>{`
        #destaque-parallax {
          min-height: ${parallaxHeightMobile}px;
        }
        @media (min-width: 768px) {
          #destaque-parallax {
            min-height: ${parallaxHeightTablet}px;
          }
        }
        @media (min-width: 1024px) {
          #destaque-parallax {
            min-height: ${parallaxHeightDesktop}px;
          }
        }
      `}</style>
      {/* CONTROLE DE COR DA SEÇÃO PARALLAX */}
      <SectionColorControl
        contentKey="parallax_bg_color"
        defaultColor="#1A1D20"
        sectionName="Destaque Parallax"
        positionClassName="top-6 right-4 sm:right-8"
      />

      {/* CAMADA DE ESCURECIMENTO (OVERLAY) - APENAS QUANDO HÁ IMAGEM */}
      {imageUrl ? (
        <div 
          className="absolute inset-0 transition-colors duration-300 pointer-events-none"
          style={{ backgroundColor: `rgba(0, 0, 0, ${Math.min(100, Math.max(0, overlayOpacity)) / 100})` }}
        />
      ) : null}

      {/* CONTEÚDO CENTRALIZADO */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 w-full">
        
        {/* BADGE DE IMPACTO */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-white shadow-lg mb-6">
          <Sparkles className="w-3.5 h-3.5 text-theme-primary shrink-0" />
          <EditableText
            contentKey="parallax_badge"
            defaultText="Qualidade & Confiança Fardin"
          />
        </div>

        {/* TÍTULO PRINCIPAL (EDIÇÃO INLINE) */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight leading-tight mb-5">
          <EditableText
            contentKey="parallax_title"
            defaultText="Engenharia e Robustez para o Agronegócio"
          />
        </h2>

        {/* SUBTÍTULO / TEXTO DE APOIO (EDIÇÃO INLINE) */}
        <div className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed font-medium">
          <EditableText
            contentKey="parallax_subtitle"
            defaultText="Desenvolvemos componentes agrícolas de altíssima precisão e durabilidade para maximizar a produtividade e a segurança operacional no campo."
            as="p"
            multiline
          />
        </div>
      </div>
    </section>
  );
};
