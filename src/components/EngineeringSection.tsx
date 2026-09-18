import React from 'react';
import { Shield, Flame, Gauge } from 'lucide-react';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';

export const EngineeringSection: React.FC = () => {
  const { content } = useContent();

  return (
    <section 
      id="engenharia-qualidade" 
      className="py-16 sm:py-20 relative overflow-hidden group transition-colors"
      style={{ backgroundColor: content['engineering_bg_color'] || '#121417' }}
    >
      {/* CONTROLE DE COR DA SEÇÃO ENGENHARIA */}
      <SectionColorControl
        contentKey="engineering_bg_color"
        defaultColor="#121417"
        sectionName="Engenharia e Rigor"
        positionClassName="top-6 right-4 sm:right-8"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#25292E] border border-[#373E47] text-xs font-mono uppercase text-theme-primary">
            <EditableText 
              contentKey="engineering_badge" 
              defaultText="Engenharia & Rigor Técnico" 
              as="span" 
            />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-theme-title tracking-tight">
            <EditableText 
              contentKey="engineering_title" 
              defaultText="Diferenciais Técnicos de Fabricação" 
              as="span" 
            />
          </h2>

          <p className="text-sm sm:text-base text-theme-body leading-relaxed max-w-2xl mx-auto">
            <EditableText 
              contentKey="engineering_subtitle" 
              defaultText="Processos industriais certificados e tratamento metalúrgico contínuo para suportar o desgaste extremo das operações agrícolas." 
              as="span" 
            />
          </p>
        </div>

        {/* GRID DE 3 CARDS EM FORMATO ECO-DARK */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* CARD 1 - AÇO / LIGAS */}
          <div className="bg-[#22262B] p-6 sm:p-7 rounded-xl border border-white/5 flex flex-col justify-between hover:border-theme-primary/30 transition-all duration-300 group/card">
            <div>
              <div className="bg-theme-primary/10 text-theme-primary p-3 rounded-lg w-fit mb-5 group-hover/card:bg-theme-primary/20 transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-theme-title mb-2">
                <EditableText 
                  contentKey="eng_card1_title" 
                  defaultText="Ligas de Alta Resistência" 
                  as="span" 
                />
              </h3>
              <p className="text-sm text-theme-body leading-relaxed">
                <EditableText 
                  contentKey="eng_card1_desc" 
                  defaultText="Aço tratado e certificado para suportar máxima abrasão no solo." 
                  as="span" 
                />
              </p>
            </div>
          </div>

          {/* CARD 2 - FOGO / TRATAMENTO TÉRMICO */}
          <div className="bg-[#22262B] p-6 sm:p-7 rounded-xl border border-white/5 flex flex-col justify-between hover:border-theme-primary/30 transition-all duration-300 group/card">
            <div>
              <div className="bg-theme-primary/10 text-theme-primary p-3 rounded-lg w-fit mb-5 group-hover/card:bg-theme-primary/20 transition-colors">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-theme-title mb-2">
                <EditableText 
                  contentKey="eng_card2_title" 
                  defaultText="Tratamento Térmico de Indução" 
                  as="span" 
                />
              </h3>
              <p className="text-sm text-theme-body leading-relaxed">
                <EditableText 
                  contentKey="eng_card2_desc" 
                  defaultText="Dureza elevada no núcleo para evitar quebras e deformações." 
                  as="span" 
                />
              </p>
            </div>
          </div>

          {/* CARD 3 - PRECISÃO / RIGOR OEM */}
          <div className="bg-[#22262B] p-6 sm:p-7 rounded-xl border border-white/5 flex flex-col justify-between hover:border-theme-primary/30 transition-all duration-300 group/card">
            <div>
              <div className="bg-theme-primary/10 text-theme-primary p-3 rounded-lg w-fit mb-5 group-hover/card:bg-theme-primary/20 transition-colors">
                <Gauge className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-theme-title mb-2">
                <EditableText 
                  contentKey="eng_card3_title" 
                  defaultText="Rigor Dimensional OEM" 
                  as="span" 
                />
              </h3>
              <p className="text-sm text-theme-body leading-relaxed">
                <EditableText 
                  contentKey="eng_card3_desc" 
                  defaultText="Encaixes perfeitos para substituição rápida na frota." 
                  as="span" 
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
