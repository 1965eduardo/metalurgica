import React, { useState, useEffect } from 'react';
import { Award, Factory, Cpu, Target, Building2 } from 'lucide-react';
import { EmpresaInfo } from '../types';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';

interface AboutSectionProps {
  empresa: EmpresaInfo;
}

const DEFAULT_ABOUT_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';

export const AboutSection: React.FC<AboutSectionProps> = ({ empresa }) => {
  const { content } = useContent();
  const [imageError, setImageError] = useState(false);

  const rawImageUrl = content['about_image_url'] || DEFAULT_ABOUT_IMAGE;

  useEffect(() => {
    setImageError(false);
  }, [rawImageUrl]);
  return (
    <section 
      id="empresa" 
      className="py-14 sm:py-24 relative overflow-hidden group"
      style={{ backgroundColor: content['about_bg_color'] || 'var(--theme-card)' }}
    >
      {/* CONTROLE DE COR DA SEÇÃO A EMPRESA */}
      <SectionColorControl
        contentKey="about_bg_color"
        defaultColor="#151719"
        sectionName="A Empresa"
        positionClassName="top-6 right-4 sm:right-8"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* LADO ESQUERDO: APRESENTAÇÃO INSTITUCIONAL */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#25292E] border border-[#373E47] text-xs font-mono uppercase text-theme-primary">
              <EditableText contentKey="about_badge" defaultText="Trajetória & Excelência Fabril" as="span" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-theme-title tracking-tight">
              <EditableText contentKey="about_title" defaultText="Pioneirismo em Soluções Agrícolas desde " as="span" /><span className="text-theme-primary"><EditableText contentKey="about_title_year" defaultText={empresa.fundacao} as="span" /></span>
            </h2>

            {/* PROPÓSITO EM DESTAQUE */}
            <div className="p-4 sm:p-5 rounded-xl bg-theme-bg border-l-4 border-theme-primary border-y border-r border-[#2D3238] shadow-sm flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary shrink-0 mt-0.5">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <EditableText
                  contentKey="about_purpose"
                  defaultText={
                    content['about_purpose'] ||
                    (content['about_purpose_title'] && content['about_purpose_desc']
                      ? `${content['about_purpose_title']}: "${content['about_purpose_desc']}"`
                      : `Propósito: ${empresa.proposito}`)
                  }
                  as="div"
                  className="text-lg font-bold text-theme-title italic leading-snug"
                  multiline
                />
              </div>
            </div>

            {/* DESCRIÇÃO INSTITUCIONAL OFICIAL */}
            <div className="text-base text-theme-body leading-relaxed">
              <EditableText contentKey="about_desc" defaultText={empresa.descricao} as="p" multiline />
            </div>

            {/* PILARES DA ESTRUTURA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-theme-bg border border-[#2D3238]">
                <div className="w-8 h-8 rounded-lg bg-[#25292E] text-theme-primary flex items-center justify-center mb-3">
                  <Factory className="w-4 h-4" />
                </div>
                <EditableText contentKey="about_pillar1_title" defaultText="Parque Fabril Moderno" as="h3" className="text-sm font-bold text-theme-title mb-1" />
                <EditableText contentKey="about_pillar1_desc" defaultText="Maquinários de corte a laser CNC, dobra de alta capacidade e linhas automatizadas para tolerâncias precisas." as="p" className="text-xs text-theme-body leading-normal" multiline />
              </div>

              <div className="p-4 rounded-xl bg-theme-bg border border-[#2D3238]">
                <div className="w-8 h-8 rounded-lg bg-[#25292E] text-theme-primary flex items-center justify-center mb-3">
                  <Cpu className="w-4 h-4" />
                </div>
                <EditableText contentKey="about_pillar2_title" defaultText="Metalurgia Avançada" as="h3" className="text-sm font-bold text-theme-title mb-1" />
                <EditableText contentKey="about_pillar2_desc" defaultText="Controle de temperabilidade, alívio de tensões e proteção anticorrosiva para durabilidade extrema sob atrito severo." as="p" className="text-xs text-theme-body leading-normal" multiline />
              </div>
            </div>
          </div>

          {/* LADO DIREITO: FOTOGRAFIA DA ESTRUTURA & SELO INSTITUCIONAL */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#373E47] bg-[#1A1D20] shadow-2xl group min-h-[384px] flex items-center justify-center">
              {!imageError && rawImageUrl ? (
                <img
                  src={rawImageUrl}
                  alt="Instalações Fabris da Metalúrgica Fardin"
                  onError={() => setImageError(true)}
                  className="w-full h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-96 bg-[#151719] flex flex-col items-center justify-center text-center p-6 border border-[#2D3238]">
                  <div className="w-14 h-14 rounded-2xl bg-theme-bg border border-[#2D3238] flex items-center justify-center text-theme-primary mb-3 shadow-inner">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-theme-title">Parque Fabril & Instalações</h4>
                  <p className="text-xs text-theme-muted mt-1 max-w-xs">Metalúrgica Fardin • Desde 1983</p>
                </div>
              )}
              
              {/* CARD FLUTUANTE DE TRADIÇÃO */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-theme-bg/95 backdrop-blur-md border border-[#2D3238] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <EditableText contentKey="about_card_title1" defaultText="Certificação & Rigor" as="div" className="text-xs text-theme-body uppercase font-mono tracking-wider" />
                  <EditableText contentKey="about_card_title2" defaultText="Padrão de Engenharia B2B" as="div" className="text-sm font-bold text-theme-title" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-theme-primary/20 border border-theme-primary/40 text-theme-title text-xs font-bold whitespace-nowrap">
                  <Award className="w-4 h-4 text-theme-primary shrink-0" />
                  <EditableText contentKey="about_card_badge" defaultText={`1983 – ${new Date().getFullYear()}`} as="span" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
