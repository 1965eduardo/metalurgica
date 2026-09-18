import React from 'react';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';

export const B2BMetricsSection: React.FC = () => {
  const { content } = useContent();

  return (
    <section 
      id="metricas-b2b" 
      className="border-y border-white/5 py-12 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: content['b2b_metrics_bg_color'] || '#1A1D20' }}
    >
      {/* CONTROLE DE COR DA SEÇÃO MÉTRICAS B2B */}
      <SectionColorControl
        contentKey="b2b_metrics_bg_color"
        defaultColor="#1A1D20"
        sectionName="Métricas B2B"
        positionClassName="top-3 right-4 sm:right-8"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8">
          {/* CARD 1 */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-theme-primary tracking-tight">
              <EditableText contentKey="metrics_b2b_num_1" defaultText="+40 Anos" as="span" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-snug">
              <EditableText contentKey="metrics_b2b_desc_1" defaultText="Engenharia e Tradição no Campo" as="span" />
            </p>
          </div>

          {/* CARD 2 */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-theme-primary tracking-tight">
              <EditableText contentKey="metrics_b2b_num_2" defaultText="+500 mil" as="span" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-snug">
              <EditableText contentKey="metrics_b2b_desc_2" defaultText="Componentes Forjados por Ano" as="span" />
            </p>
          </div>

          {/* CARD 3 */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-theme-primary tracking-tight">
              <EditableText contentKey="metrics_b2b_num_3" defaultText="100%" as="span" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-snug">
              <EditableText contentKey="metrics_b2b_desc_3" defaultText="Lotes com Teste de Dureza" as="span" />
            </p>
          </div>

          {/* CARD 4 */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-theme-primary tracking-tight">
              <EditableText contentKey="metrics_b2b_num_4" defaultText="Nacional" as="span" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-snug">
              <EditableText contentKey="metrics_b2b_desc_4" defaultText="Atendimento para Frotas e Revendas" as="span" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
