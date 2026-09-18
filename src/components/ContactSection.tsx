import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, CheckCircle2, Clock, Moon } from 'lucide-react';
import { EmpresaInfo } from '../types';
import { EditableText } from './EditableText';
import { SectionColorControl } from './SectionColorControl';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import {
  formatWhatsAppForDisplay,
  getWhatsAppLink,
  cleanWhatsAppNumber,
  checkWhatsAppBusinessHours,
  DEFAULT_WHATSAPP_NUMBER,
} from '../utils/whatsapp';
import { OfflineNoticeModal } from './OfflineNoticeModal';

interface ContactSectionProps {
  empresa: EmpresaInfo;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ empresa }) => {
  const { content } = useContent();
  const { isEditMode } = useAuth();
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    mensagem: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const currentWhatsApp = content['whatsapp_number'] || empresa.contato.whatsapp || DEFAULT_WHATSAPP_NUMBER;
  const defaultWhatsAppMsg = content['whatsapp_default_message'] || 'Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin.';
  const companyEmail = empresa.contato?.email || 'contato@metalurgicafardin.com.br';
  
  const businessStatus = checkWhatsAppBusinessHours({
    workDays: content['whatsapp_work_days'],
    startTime: content['whatsapp_start_time'],
    endTime: content['whatsapp_end_time'],
    offlineMessage: content['whatsapp_offline_message'],
  });

  const whatsAppLink = getWhatsAppLink({
    number: currentWhatsApp,
    message: defaultWhatsAppMsg
  });

  const formattedWhatsDisplay = formatWhatsAppForDisplay(currentWhatsApp);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    if (!businessStatus.isOnline) {
      e.preventDefault();
      setIsOfflineModalOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;

    const rawPhone = cleanWhatsAppNumber(currentWhatsApp);
    const messageText = 
      `*Solicitação de Contato / Cotação - Metalúrgica Fardin*\n\n` +
      `👤 *Nome Completo:* ${formData.nome.trim()}\n` +
      `🏢 *Empresa / Fazenda / Revenda:* ${formData.empresa.trim() || 'Não informada'}\n` +
      `✉️ *E-mail:* ${formData.email.trim()}\n` +
      `📱 *Telefone / WhatsApp:* ${formData.telefone.trim() || 'Não informado'}\n\n` +
      `📝 *Mensagem / Detalhes:*\n${formData.mensagem.trim()}`;

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');

    // Limpa os campos do formulário após o disparo
    setFormData({
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      mensagem: '',
    });
    setSubmitted(true);
  };

  return (
    <section 
      id="contato" 
      className="py-24 relative group"
      style={{ backgroundColor: content['contact_bg_color'] || 'var(--theme-card)' }}
    >
      {/* CONTROLE DE COR DA SEÇÃO CONTATO */}
      <SectionColorControl
        contentKey="contact_bg_color"
        defaultColor="#151719"
        sectionName="Atendimento & Contato"
        positionClassName="top-6 right-4 sm:right-8"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CABEÇALHO */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#25292E] border border-[#373E47] text-xs font-mono uppercase text-theme-primary">
            <EditableText contentKey="contact_badge" defaultText="Atendimento B2B Especializado" as="span" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-theme-title tracking-tight">
            <EditableText contentKey="contact_title" defaultText="Fale com a Engenharia & Comercial" as="span" />
          </h2>
          <div className="text-sm text-theme-body">
            <EditableText contentKey="contact_desc" defaultText="Solicite cotações em lote, desenvolvimento de peças sob medida para implementos agrícolas ou consulte prazos de entrega para sua região." as="p" multiline />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* INFORMAÇÕES DE CONTATO E DADOS INSTITUCIONAIS */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-4 sm:p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
              <EditableText contentKey="contact_channels_title" defaultText="Canais Diretos de Fábrica" as="h3" className="text-lg font-bold text-theme-title pb-3 border-b border-[#2D3238]" />

              <div className="space-y-4">
                {/* TELEFONE */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-theme-body font-medium"><EditableText contentKey="contact_label_phone" defaultText="Telefone da Fábrica" as="span" /></div>
                    <a
                      href={`tel:${empresa.contato.telefone}`}
                      className="text-sm font-bold text-theme-title hover:text-theme-primary transition-colors"
                    >
                      <EditableText contentKey="contact_phone_value" defaultText={empresa.contato.telefone} as="span" />
                    </a>
                  </div>
                </div>

                {/* WHATSAPP */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                      businessStatus.isOnline
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                        : 'bg-[#25292E] border-[#373E47] text-amber-400'
                    }`}
                  >
                    {businessStatus.isOnline ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-theme-body font-medium">
                        <EditableText contentKey="contact_label_whatsapp" defaultText="WhatsApp Engenharia / Vendas" as="span" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          businessStatus.isOnline
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            businessStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        {businessStatus.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <a
                      href={whatsAppLink}
                      target={businessStatus.isOnline ? '_blank' : undefined}
                      rel={businessStatus.isOnline ? 'noopener noreferrer' : undefined}
                      onClick={handleWhatsAppClick}
                      className="text-sm font-bold text-theme-title hover:text-theme-primary transition-colors block mt-0.5"
                    >
                      <EditableText contentKey="contact_whatsapp_value" defaultText={formattedWhatsDisplay} as="span" />
                    </a>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-theme-body font-medium"><EditableText contentKey="contact_label_email" defaultText="E-mail Corporativo" as="span" /></div>
                    <a
                      href={`mailto:${companyEmail}`}
                      className="text-sm font-bold text-theme-title hover:text-theme-primary transition-colors"
                    >
                      <EditableText contentKey="contact_email_value" defaultText={companyEmail} as="span" />
                    </a>
                  </div>
                </div>

                {/* ENDEREÇO */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-theme-primary shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-theme-body font-medium"><EditableText contentKey="contact_label_address" defaultText="Unidade Fabril & Logística" as="span" /></div>
                    <div className="text-sm text-theme-title leading-snug">
                      <EditableText contentKey="contact_address_value" defaultText={empresa.contato.endereco} as="p" multiline />
                    </div>
                  </div>
                </div>
              </div>

              {/* HORÁRIO DE ATENDIMENTO */}
              <div className="p-4 rounded-xl bg-theme-card border border-[#2D3238] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-theme-title">
                  <Clock className="w-4 h-4 text-theme-primary shrink-0" />
                  <span>Expediente & Atendimento WhatsApp:</span>
                </div>
                <div className="text-xs text-theme-body pl-6">
                  <p className="font-semibold text-white">
                    {businessStatus.scheduleSummary}
                  </p>
                  <p className="text-[11px] text-[#8C9AA8] mt-0.5">
                    {businessStatus.isOnline
                      ? '🟢 Atendimento comercial online e disponível para cotações imediatas.'
                      : '🌙 Fora do expediente comercial no momento. Mensagens serão respondidas no próximo turno.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO DE ORÇAMENTO */}
          <div className="lg:col-span-7">
            <div className="p-4 sm:p-8 rounded-2xl bg-theme-bg border border-[#2D3238] shadow-xl">
              {submitted ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-theme-title"><EditableText contentKey="contact_success_title" defaultText="Solicitação Enviada com Sucesso!" as="span" /></h3>
                  <div className="text-xs text-theme-body max-w-md mx-auto">
                    <EditableText contentKey="contact_success_desc" defaultText="Recebemos seus dados e a equipe técnica da Metalúrgica Fardin entrará em contato via WhatsApp/E-mail com sua proposta comercial." as="p" multiline />
                  </div>
                  <button
                    onClick={(e) => {
                      if (isEditMode) {
                        e.preventDefault();
                        return;
                      }
                      setSubmitted(false);
                      setFormData({
                        nome: '',
                        empresa: '',
                        email: '',
                        telefone: '',
                        mensagem: '',
                      });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#25292E] text-white hover:bg-[#2D3238] border border-[#373E47]"
                  >
                    <EditableText contentKey="contact_btn_new_msg" defaultText="Enviar Nova Mensagem" as="span" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    if (isEditMode) {
                      e.preventDefault();
                      return;
                    }
                    handleSubmit(e);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                        <EditableText contentKey="contact_form_name" defaultText="Nome Completo *" as="span" />
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Carlos Eduardo"
                        className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                        <EditableText contentKey="contact_form_company" defaultText="Empresa / Fazenda / Revenda" as="span" />
                      </label>
                      <input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        placeholder="Ex: Agropecuária Santa Fé"
                        className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                        <EditableText contentKey="contact_form_email" defaultText="E-mail Corporativo *" as="span" />
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="carlos@empresa.com.br"
                        className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                        <EditableText contentKey="contact_form_phone" defaultText="Telefone / WhatsApp" as="span" />
                      </label>
                      <input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                      <EditableText contentKey="contact_form_msg" defaultText="Mensagem / Detalhes da Demanda *" as="span" />
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.mensagem}
                      onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                      placeholder="Informe a quantidade estimada, especificação ou aplicação desejada..."
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary resize-none"
                    />
                  </div>

                  <button
                    id="btn-submit-contato"
                    type="submit"
                    onClick={(e) => {
                      if (isEditMode) {
                        e.preventDefault();
                        return;
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-theme-primary text-white hover:brightness-110 shadow-lg shadow-theme-primary/25 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <EditableText contentKey="contact_btn_submit" defaultText="Enviar no WhatsApp" as="span" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE AVISO FORA DO EXPEDIENTE */}
      <OfflineNoticeModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        whatsappUrl={whatsAppLink}
        whatsappNumber={currentWhatsApp}
        scheduleSummary={businessStatus.scheduleSummary}
        offlineMessage={businessStatus.offlineMessage}
        currentTimeStr={businessStatus.currentTimeStr}
        currentDayLabel={businessStatus.currentDayLabel}
      />
    </section>
  );
};
