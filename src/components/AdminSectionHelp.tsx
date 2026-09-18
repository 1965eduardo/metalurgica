import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X, Info, CheckCircle2, Sparkles } from 'lucide-react';

export type AdminTabKey = 
  | 'visao_geral'
  | 'produtos'
  | 'categorias'
  | 'usuarios'
  | 'location'
  | 'hero'
  | 'config'
  | 'theme'
  | 'media';

interface SectionHelpData {
  title: string;
  subtitle: string;
  highlights: string[];
  rules: { label: string; detail: string }[];
  recommendation?: string;
}

export const SECTION_HELP_INFO: Record<AdminTabKey, SectionHelpData> = {
  visao_geral: {
    title: 'Visão Geral & Indicadores',
    subtitle: 'Painel central de controle e monitoramento do catálogo industrial.',
    highlights: [
      'Contadores em tempo real do catálogo e banco de dados.',
      'Acesso direto e atalhos rápidos para todas as ferramentas administrativas.',
      'Status de sincronização com o banco de dados Neon PostgreSQL.'
    ],
    rules: [
      { label: 'Status de Conexão', detail: 'O status verde confirma sincronização ativa e permanente com o PostgreSQL em nuvem.' },
      { label: 'Atualização', detail: 'Alterações salvas no painel refletem imediatamente no site público sem necessidade de rebuild.' },
      { label: 'Edição Inline', detail: 'Com o painel ativo, você também pode editar textos e cores clicando diretamente nas seções do site.' },
    ],
    recommendation: 'Utilize os atalhos rápidos da visão geral para cadastrar produtos ou navegar rapidamente entre seções.'
  },
  produtos: {
    title: 'Catálogo de Peças & Implementos',
    subtitle: 'Diretrizes para cadastro, fotos técnicas e especificações de produtos.',
    highlights: [
      'Upload direto de fotos ou seleção pela Biblioteca de Mídia.',
      'Especificações metalúrgicas e propriedades técnicas completas.',
      'Integração direta com o carrinho de cotações B2B.'
    ],
    rules: [
      { label: 'Dimensões de Imagem', detail: 'Recomendado proporção 4:3 ou 1:1, resolução mínima de 800x600px em formato JPG, PNG ou WebP.' },
      { label: 'Especificações Técnicas', detail: 'Preencha dureza (HRC/HB), tipo de aço e aplicação para facilitar a busca do produtor e revenda.' },
      { label: 'Especificações Metalúrgicas', detail: 'Campo de texto livre para tratamento térmico, usinagem, tolerâncias e certificados de qualidade.' },
      { label: 'Status Ativo/Inativo', detail: 'Peças inativas ficam ocultas no site público, permitindo cadastro prévio ou pausa de produção.' },
    ],
    recommendation: 'Mantenha códigos/SKU padronizados para acelerar os pedidos de cotação via WhatsApp.'
  },
  categorias: {
    title: 'Categorias de Produtos',
    subtitle: 'Organização estrutural dos filtros do catálogo público.',
    highlights: [
      'Criação de categorias com ordenação dinâmica.',
      'Geração automática de URLs amigáveis (slugs).',
      'Proteção contra exclusão acidental de categorias com produtos.'
    ],
    rules: [
      { label: 'Nomenclatura', detail: 'Use nomes curtos e objetivos (ex: Ponteiras, Discos, Hastes, Parafusos).' },
      { label: 'Slugs Automáticos', detail: 'O slug é formatado sem acentos ou caracteres especiais para busca otimizada.' },
      { label: 'Integridade', detail: 'Para excluir uma categoria, primeiro reatribua ou remova os produtos vinculados a ela.' },
    ],
    recommendation: 'Mantenha entre 4 a 8 categorias principais para não poluir os filtros no mobile.'
  },
  usuarios: {
    title: 'Gestão de Usuários & Acessos',
    subtitle: 'Controle de operadores autorizados a gerenciar o site.',
    highlights: [
      'Criação de novos operadores e administradores.',
      'Armazenamento criptografado de senhas no PostgreSQL.',
      'Proteção de sessão com token JWT seguro.'
    ],
    rules: [
      { label: 'E-mail Corporativo', detail: 'Utilize e-mails válidos para facilitar a identificação dos operadores.' },
      { label: 'Segurança de Senha', detail: 'Recomendado utilizar senhas fortes com no mínimo 6 caracteres contendo letras e números.' },
      { label: 'Administrador Principal', detail: 'Mantenha sempre pelo menos um usuário de backup com acesso total.' },
    ],
    recommendation: 'Altere as credenciais padrão de teste após a publicação em produção.'
  },
  location: {
    title: 'Endereço & Mapa da Empresa',
    subtitle: 'Configurações de localização física e mapa interativo.',
    highlights: [
      'Endereço completo exibido no rodapé e canais de contato.',
      'Mapa interativo via iframe do Google Maps.',
      'Ajuste personalizado de altura e tema visual do mapa.'
    ],
    rules: [
      { label: 'Campos Obrigatórios', detail: 'Logradouro, Bairro, Cidade/UF e CEP alimentam os dados estruturados do site.' },
      { label: 'URL do Google Maps', detail: 'Insira o link direto de compartilhamento ou URL embed gerada no Google Maps.' },
      { label: 'Altura do Mapa', detail: 'Altura padrão recomendada: 400px (ajustável de 250px a 600px).' },
      { label: 'Tema do Mapa', detail: 'Opções Dark, Padrão ou Tons de Cinza para combinar com a identidade visual.' },
    ],
    recommendation: 'Teste a rota no Google Maps para certificar que os clientes e transportadoras cheguem com precisão à fábrica.'
  },
  hero: {
    title: 'Banner Principal (Hero)',
    subtitle: 'Painel visual de destaque no topo da página inicial.',
    highlights: [
      'Foto de fundo em alta definição da fábrica ou implementos.',
      'Camada de escurecimento (overlay) para garantir leitura perfeita dos textos.',
      'Ajuste de altura responsiva em tempo real.'
    ],
    rules: [
      { label: 'Resolução da Imagem', detail: 'Recomendado 1920x1080px (Full HD) em proporção panorâmica 16:9, formato WebP ou JPG otimizado (<2MB).' },
      { label: 'Overlay de Escurecimento', detail: 'Ajuste de 50% a 85% para manter o fundo visível sem prejudicar o contraste do título.' },
      { label: 'Altura do Banner', detail: 'Defina a porcentagem da altura da tela (vh), com padrão recomendado entre 75% e 90%.' },
    ],
    recommendation: 'Prefira fotografias reais do parque fabril ou peças em operação agrícola para transmitir máxima robustez.'
  },
  config: {
    title: 'Configurações do Sistema & WhatsApp',
    subtitle: 'Regras de atendimento comercial, horários e cotações B2B.',
    highlights: [
      'Número comercial de WhatsApp com DDI e DDD.',
      'Regras de expediente e mensagem automática fora do horário.',
      'Ativação/desativação do carrinho de cotações de peças.'
    ],
    rules: [
      { label: 'Formato do Telefone', detail: 'Preencha no padrão internacional (ex: 5519997428810) sem traços ou parênteses.' },
      { label: 'Expediente Comercial', detail: 'Defina os dias úteis e a faixa de horário (ex: 08:00 às 18:00).' },
      { label: 'Aviso Fora de Horário', detail: 'Quando fora do expediente, o modal de aviso informa o cliente sobre o retorno da equipe.' },
      { label: 'Cotações B2B', detail: 'Quando ativas, adicionam o botão "Solicitar Cotação" em cada peça do catálogo.' },
    ],
    recommendation: 'Configure uma mensagem padrão acolhedora para agilizar o primeiro contato com o comprador da fazenda ou revenda.'
  },
  theme: {
    title: 'Cores do Site & Identidade Visual',
    subtitle: 'Customização cromática global e cores de fundo das seções.',
    highlights: [
      'Cor primária Fardin para destaques, botões e badges.',
      'Cores de fundo individuais para as seções da página inicial.',
      'Restauração instantânea para o padrão industrial seguro.'
    ],
    rules: [
      { label: 'Cor Primária', detail: 'Vermelho Fardin (#B82020) ou variantes corporativas para botões e detalhes ativos.' },
      { label: 'Contraste de Texto', detail: 'Mantenha os textos claros sobre fundos escuros para preservar acessibilidade WCAG.' },
      { label: 'Cores de Seção', detail: 'Você pode definir a cor de cada seção aqui ou diretamente no botão "Cor da Seção" na página.' },
    ],
    recommendation: 'Use o botão "Restaurar Padrão Industrial" caso queira retornar à paleta original calibrada para aço e agronegócio.'
  },
  media: {
    title: 'Biblioteca de Mídia',
    subtitle: 'Repositório central de arquivos e fotos corporativas.',
    highlights: [
      'Upload seguro para o serviço de nuvem Cloudinary.',
      'Visualização em grade ou lista com cópia de URL em um clique.',
      'Reutilização em produtos, banners e seções institucionais.'
    ],
    rules: [
      { label: 'Formatos Aceitos', detail: 'JPG, PNG, WebP e SVG com tamanho máximo de 10MB por arquivo.' },
      { label: 'Otimização Automática', detail: 'As fotos são servidas com compressão moderna para carregamento ultrarrápido.' },
      { label: 'Exclusão', detail: 'Ao excluir uma imagem da biblioteca, certifique-se de que ela não esteja sendo utilizada em produtos ativos.' },
    ],
    recommendation: 'Faça upload de fotos com boa iluminação e fundo neutro para destacar o acabamento metalúrgico das peças.'
  },
};

interface AdminSectionHelpProps {
  activeTab: string;
}

export const AdminSectionHelp: React.FC<AdminSectionHelpProps> = ({ activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const helpData = SECTION_HELP_INFO[activeTab as AdminTabKey] || SECTION_HELP_INFO.visao_geral;

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 360;
    const popoverHeight = 440;

    let top = rect.bottom + 8;
    if (top + popoverHeight > window.innerHeight && rect.top > popoverHeight) {
      top = Math.max(12, rect.top - popoverHeight - 8);
    }

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth) {
      left = Math.max(12, window.innerWidth - popoverWidth - 16);
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Botão de Ajuda Discreto (?) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#25292E] text-gray-400 hover:text-amber-300 hover:bg-[#2D3238] border border-[#373E47] hover:border-amber-400/50 transition-all cursor-pointer shadow-sm active:scale-95 group"
        title="Ajuda e orientações desta seção"
        aria-label="Ajuda e orientações desta seção"
      >
        <span className="text-xs font-bold font-mono group-hover:scale-110 transition-transform">?</span>
      </button>

      {/* Popover de Ajuda via Portal */}
      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="w-[360px] max-w-[calc(100vw-32px)] max-h-[85vh] overflow-y-auto p-5 rounded-2xl bg-[#1C1F24] border border-[#373E47] shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white text-xs space-y-4 z-[10001] pointer-events-auto animate-in fade-in zoom-in-95 duration-150 custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#2D3238]">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white leading-tight">
                  {helpData.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {helpData.subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#25292E] transition-colors cursor-pointer shrink-0"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Destaques Rápidos */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
              Recursos Principais
            </span>
            <ul className="space-y-1 text-gray-300">
              {helpData.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Regras e Especificações Recomendadas */}
          <div className="space-y-2 pt-1 border-t border-[#2D3238]">
            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider block">
              Regras & Boas Práticas
            </span>
            <div className="space-y-2">
              {helpData.rules.map((rule, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#151719] border border-[#2D3238] space-y-0.5">
                  <span className="font-semibold text-white block text-[11px]">
                    {rule.label}
                  </span>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {rule.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendação Especial */}
          {helpData.recommendation && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Dica:</strong> {helpData.recommendation}
              </p>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
