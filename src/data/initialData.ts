import { EmpresaInfo, Produto } from '../types';

export const EMPRESA_DATA: EmpresaInfo = {
  nome: 'Metalúrgica Fardin Ltda',
  fundacao: 1983,
  proposito: 'Inovar e crescer com excelência!',
  descricao:
    'Consolidada no mercado desde 1983 por sua determinação e vocação inovadora, oferecendo uma linha especial de produtos e serviços com máxima qualidade. Hoje, através de uma moderna estrutura, transformamos tecnologia em soluções precisas para nossos clientes, gerando caminhos de progresso e desenvolvimento no agronegócio.',
  contato: {
    telefone: '+55 (19) 3844-5200',
    whatsapp: '+55 (19) 99742-8810',
    email: 'contato@metalurgicafardin.com.br',
    endereco: 'Estrada Rural, Km 42 - Polo Industrial do Agronegócio, SP / RS'
  }
};

export const DEFAULT_SITE_THEME = {
  primary: '#B82020',
  text_main: '#F8F9FA',
  text_muted: '#9BA3AF',
  bg_main: '#1A1D20',
  bg_card: '#151719',
  bg_nav: 'rgba(21, 23, 25, 0.95)',
};

export const DEFAULT_SITE_CONTENT: Record<string, string> = {
  site_logo_url: '/Fardin-logo.png',
  site_theme: JSON.stringify(DEFAULT_SITE_THEME),
  hero_title: 'Soluções Precisas em Peças para o Agronegócio',
  hero_btn_catalog: 'Ver Catálogo de Produtos',
  hero_btn_catalog_link: '#produtos',
  hero_btn_catalog_target: '_self',
  hero_btn_specialist: 'Falar com Especialista',
  hero_btn_specialist_link: '#contato',
  hero_btn_specialist_target: '_self',
  about_purpose: 'Propósito: Inovar e crescer com excelência!',
  footer_purpose: 'Propósito: "Inovar e crescer com excelência!"',
  whatsapp_number: '5519997428810',
  whatsapp_default_message: 'Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin.',
  whatsapp_work_days: 'mon,tue,wed,thu,fri',
  whatsapp_start_time: '08:00',
  whatsapp_end_time: '18:00',
  whatsapp_offline_message: 'Nosso atendimento comercial funciona de segunda a sexta-feira, das 08h às 18h. Envie sua mensagem e responderemos assim que retornarmos ao expediente!',
  enable_b2b_quotes: 'true',
  banner_height: '80',
  map_height: '400',
  hero_bg_color: '#1A1D20',
  about_bg_color: '#151719',
  parallax_bg_color: '#1A1D20',
  catalog_bg_color: '#1A1D20',
  b2b_metrics_bg_color: '#1A1D20',
  engineering_bg_color: '#121417',
  map_bg_color: '#151719',
  contact_bg_color: '#151719',
  footer_bg_color: '#111315',
};

export const PRODUTOS_FALLBACK: Produto[] = [
  {
    id: '1',
    titulo: 'Suporte Reforçado para Roçadeira Agrícola',
    codigo_referencia: 'REF-5012',
    categoria: 'Implementos Agrícolas',
    descricao:
      'Fabricado em aço de alta resistência com tratamento térmico especializado. Desenvolvido para absorver impactos severos em operações de roçada pesada. Compatível com diversos modelos de tratores do mercado.',
    imagem_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço Carbono SAE 1045 forjado; Tratamento térmico de têmpera e revenimento (42-46 HRC); Pintura eletrostática a pó com alta resistência anticorrosiva.'
  },
  {
    id: '2',
    titulo: 'Lâmina de Corte para Cortadores e Tratores de Jardim',
    codigo_referencia: 'REF-1185',
    categoria: 'Linha Jardim & Campo',
    descricao:
      'Lâmina balanceada eletronicamente para corte de alta precisão. Aço temperado de longa durabilidade com proteção anticorrosiva avançada.',
    imagem_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço manganês temperado de alta tenacidade; Dureza superficial 48-52 HRC; Balanceamento dinâmico computadorizado.'
  },
  {
    id: '3',
    titulo: 'Bico Subsolador Agrícola de Alta Penetração',
    codigo_referencia: 'REF-1114',
    categoria: 'Linha Agrícola Pesada',
    descricao:
      'Projetado para romper compactações profundas do solo com menor consumo de combustível. Ponta reforçada e design hidrodinâmico para melhor fluxo de terra.',
    imagem_url: 'https://images.unsplash.com/photo-1530267981373-f09b55239e99?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço microligado ao Boro 28MnB5 forjado; Camada de revestimento duro contra abrasão em tungstênio; Resistência ao desgaste severo.'
  }
];


