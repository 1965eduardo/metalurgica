import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Layers,
  Settings,
  RefreshCw,
  Package,
  LayoutDashboard,
  XCircle,
  UploadCloud,
  Palette,
  MapPin,
  Image as ImageIcon,
  LayoutTemplate,
  Copy,
  LayoutGrid,
  List,
  Building2,
  Sparkles,
  MessageSquare,
  Phone,
  ExternalLink,
  Check,
  FileSpreadsheet,
  Clock,
  Calendar,
  Download,
  Users,
  Eye,
  EyeOff,
  Sun,
  Moon,
  SunMedium
} from 'lucide-react';
import { Produto, DbStatus, Categoria, User } from '../types';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { AdminSectionHelp } from './AdminSectionHelp';
import {
  cleanWhatsAppNumber,
  formatWhatsAppForDisplay,
  getWhatsAppLink,
  DEFAULT_WHATSAPP_NUMBER,
  DEFAULT_WHATSAPP_MESSAGE,
  DEFAULT_WORK_DAYS,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME,
  DEFAULT_OFFLINE_MESSAGE,
  DAYS_OF_WEEK,
  parseWorkDays,
  checkWhatsAppBusinessHours,
  formatWorkDaysSummary
} from '../utils/whatsapp';
import BackupSection from './BackupSection';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onLogin: (token: string, email: string) => void;
  onLogout: () => void;
  produtos: Produto[];
  onRefreshProdutos: () => void;
  dbStatus: DbStatus | null;
  onRefreshDbStatus: () => void;
  categorias?: Categoria[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  token,
  onLogin,
  onLogout,
  produtos,
  onRefreshProdutos,
  dbStatus,
  onRefreshDbStatus,
  categorias = [],
}) => {
  // Estados de autenticação
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const { adminEmail } = useAuth();

  // Gestão de Usuários
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userDeleteConfirmId, setUserDeleteConfirmId] = useState<string | null>(null);
  const [userDeleteLoading, setUserDeleteLoading] = useState(false);

  // Saudação Dinâmica por Horário (baseada na hora do cliente)
  // Das 05:00 às 11:59: "Bom dia, [Nome]!"
  // Das 12:00 às 17:59: "Boa tarde, [Nome]!"
  // Das 18:00 às 04:59: "Boa noite, [Nome]!"
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Bom dia',
        icon: <Sun className="w-4 h-4 text-amber-400 shrink-0" />,
        iconLarge: <Sun className="w-6 h-6 text-amber-400" />
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: 'Boa tarde',
        icon: <SunMedium className="w-4 h-4 text-orange-400 shrink-0" />,
        iconLarge: <SunMedium className="w-6 h-6 text-orange-400" />
      };
    } else {
      return {
        greeting: 'Boa noite',
        icon: <Moon className="w-4 h-4 text-indigo-400 shrink-0" />,
        iconLarge: <Moon className="w-6 h-6 text-indigo-400" />
      };
    }
  };

  const getAdminDisplayName = () => {
    const currentEmail = (adminEmail || email || '').toLowerCase();
    if (currentEmail && users.length > 0) {
      const matched = users.find(u => u.email.toLowerCase() === currentEmail);
      if (matched && matched.name && matched.name.trim()) {
        return matched.name.trim().split(' ')[0];
      }
    }
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = JSON.parse(
          decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        );
        if (jsonPayload && jsonPayload.name && typeof jsonPayload.name === 'string' && jsonPayload.name.trim()) {
          return jsonPayload.name.trim().split(' ')[0];
        }
      } catch (e) {
        // ignore
      }
    }
    return 'Administrador';
  };

  const greetingInfo = getGreetingData();
  const adminDisplayName = getAdminDisplayName();

  // Estados do CRUD
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'produtos' | 'categorias' | 'usuarios' | 'media' | 'location' | 'hero' | 'config' | 'theme'>('produtos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  
  // Categorias CRUD
  const [catName, setCatName] = useState('');
  const [editingCategoriaId, setEditingCategoriaId] = useState<string | null>(null);
  const [catDeleteConfirmId, setCatDeleteConfirmId] = useState<string | null>(null);

  // Mídia (Cloudinary)
  const [mediaImages, setMediaImages] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaDeleteConfirmId, setMediaDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal MediaPicker
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTitle, setMediaPickerTitle] = useState('Escolher Imagem da Biblioteca');
  const [mediaPickerOnSelect, setMediaPickerOnSelect] = useState<((url: string) => void) | null>(null);

  const openMediaPicker = (onSelect: (url: string) => void, title = 'Escolher Imagem da Biblioteca') => {
    setMediaPickerOnSelect(() => onSelect);
    setMediaPickerTitle(title);
    setMediaPickerOpen(true);
    if (mediaImages.length === 0) {
      fetchMedia();
    }
  };

  // Estados de Tema & Localização
  const { content, updateContent } = useContent();
  const defaultTheme = {
    primary: '#B82020',
    text_main: '#F8F9FA',
    text_muted: '#9BA3AF',
    bg_main: '#1A1D20',
    bg_card: '#151719',
    bg_nav: 'rgba(21, 23, 25, 0.95)',
  };
  const [themeFields, setThemeFields] = useState(defaultTheme);

  const defaultSectionColors = {
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
  const [sectionColors, setSectionColors] = useState(defaultSectionColors);

  const defaultLocation = {
    street: 'Av. Délio Silva Britto, 55',
    neighborhood: 'Nossa Sra. da Penha',
    city_state: 'Vila Velha - ES',
    zip_code: '29110-090',
    google_maps_url: '',
    map_theme: 'dark',
    map_height: 400,
    map_height_desktop: 400,
    map_height_tablet: 350,
    map_height_mobile: 300,
  };
  const [locationFields, setLocationFields] = useState(defaultLocation);
  const [mapHeightDevice, setMapHeightDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const defaultHeroSettings = {
    hero_bg_image: '',
    hero_overlay_opacity: 85,
    banner_height: 80,
    banner_height_desktop: 80,
    banner_height_tablet: 70,
    banner_height_mobile: 60,
  };
  const [heroFields, setHeroFields] = useState(defaultHeroSettings);
  const [heroHeightDevice, setHeroHeightDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const defaultAboutImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80';
  const [aboutImageUrl, setAboutImageUrl] = useState(defaultAboutImage);
  const [isUploadingAbout, setIsUploadingAbout] = useState(false);

  const defaultParallaxSettings = {
    parallax_image_url: '',
    parallax_overlay: 70,
    parallax_height: 500,
    parallax_height_desktop: 500,
    parallax_height_tablet: 400,
    parallax_height_mobile: 350,
  };
  const [parallaxFields, setParallaxFields] = useState(defaultParallaxSettings);
  const [parallaxHeightDevice, setParallaxHeightDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isUploadingParallax, setIsUploadingParallax] = useState(false);

  // Configurações do WhatsApp Comercial & Expediente
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(DEFAULT_WHATSAPP_MESSAGE);
  const [whatsappWorkDays, setWhatsappWorkDays] = useState<string[]>(parseWorkDays(DEFAULT_WORK_DAYS));
  const [whatsappStartTime, setWhatsappStartTime] = useState(DEFAULT_START_TIME);
  const [whatsappEndTime, setWhatsappEndTime] = useState(DEFAULT_END_TIME);
  const [whatsappOfflineMessage, setWhatsappOfflineMessage] = useState(DEFAULT_OFFLINE_MESSAGE);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [copiedWhatsappLink, setCopiedWhatsappLink] = useState(false);

  // Recurso de Cotações B2B
  const [enableB2BQuotes, setEnableB2BQuotes] = useState(true);
  const [togglingB2B, setTogglingB2B] = useState(false);

  // Configurações do Logotipo Oficial do Site
  const [siteLogoUrl, setSiteLogoUrl] = useState('/Fardin-logo.png');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  // Carregar tema, localização, hero, sobre, parallax, whatsapp, logotipo e cotações B2B
  useEffect(() => {
    if (content['site_logo_url'] !== undefined) {
      setSiteLogoUrl(content['site_logo_url'] || '/Fardin-logo.png');
    }
    if (content['enable_b2b_quotes'] !== undefined) {
      setEnableB2BQuotes(content['enable_b2b_quotes'] !== 'false');
    }
    if (content['whatsapp_number']) {
      setWhatsappNumber(content['whatsapp_number']);
    }
    if (content['whatsapp_default_message']) {
      setWhatsappDefaultMessage(content['whatsapp_default_message']);
    }
    if (content['whatsapp_work_days']) {
      setWhatsappWorkDays(parseWorkDays(content['whatsapp_work_days']));
    }
    if (content['whatsapp_start_time']) {
      setWhatsappStartTime(content['whatsapp_start_time']);
    }
    if (content['whatsapp_end_time']) {
      setWhatsappEndTime(content['whatsapp_end_time']);
    }
    if (content['whatsapp_offline_message']) {
      setWhatsappOfflineMessage(content['whatsapp_offline_message']);
    }
    if (content['site_theme']) {
      try {
        const parsed = JSON.parse(content['site_theme']);
        setThemeFields(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Erro ao parsear tema no Admin:', e);
      }
    }
    if (content['company_location']) {
      try {
        const parsed = JSON.parse(content['company_location']);
        setLocationFields(prev => ({ 
          ...prev, 
          ...parsed,
          map_height: content['map_height'] !== undefined ? Number(content['map_height']) : (parsed.map_height !== undefined ? Number(parsed.map_height) : prev.map_height),
          map_height_desktop: parsed.map_height_desktop ?? parsed.map_height ?? prev.map_height_desktop,
          map_height_tablet: parsed.map_height_tablet ?? parsed.map_height ?? prev.map_height_tablet,
          map_height_mobile: parsed.map_height_mobile ?? parsed.map_height ?? prev.map_height_mobile,
        }));
      } catch (e) {
        console.warn('Erro ao parsear localização no Admin:', e);
      }
    } else if (content['map_height'] !== undefined) {
      setLocationFields(prev => ({ 
        ...prev, 
        map_height: Number(content['map_height']),
        map_height_desktop: Number(content['map_height']),
      }));
    }
    if (content['hero_settings']) {
      try {
        const parsed = JSON.parse(content['hero_settings']);
        const { hero_bg_youtube: _unused, ...cleanHero } = parsed;
        setHeroFields(prev => ({ 
          ...prev, 
          ...cleanHero,
          banner_height: content['banner_height'] !== undefined ? Number(content['banner_height']) : (cleanHero.banner_height !== undefined ? Number(cleanHero.banner_height) : prev.banner_height),
          banner_height_desktop: cleanHero.banner_height_desktop ?? cleanHero.banner_height ?? prev.banner_height_desktop,
          banner_height_tablet: cleanHero.banner_height_tablet ?? cleanHero.banner_height ?? prev.banner_height_tablet,
          banner_height_mobile: cleanHero.banner_height_mobile ?? cleanHero.banner_height ?? prev.banner_height_mobile,
        }));
      } catch (e) {
        console.warn('Erro ao parsear hero_settings no Admin:', e);
      }
    } else if (content['banner_height'] !== undefined) {
      setHeroFields(prev => ({ 
        ...prev, 
        banner_height: Number(content['banner_height']),
        banner_height_desktop: Number(content['banner_height']),
      }));
    }
    if (content['about_image_url']) {
      setAboutImageUrl(content['about_image_url']);
    }
    if (content['parallax_settings']) {
      try {
        const parsed = JSON.parse(content['parallax_settings']);
        setParallaxFields(prev => ({
          ...prev,
          ...parsed,
          parallax_height: content['parallax_height'] !== undefined ? Number(content['parallax_height']) : (parsed.parallax_height !== undefined ? Number(parsed.parallax_height) : prev.parallax_height),
          parallax_height_desktop: parsed.parallax_height_desktop ?? parsed.parallax_height ?? prev.parallax_height_desktop,
          parallax_height_tablet: parsed.parallax_height_tablet ?? parsed.parallax_height ?? prev.parallax_height_tablet,
          parallax_height_mobile: parsed.parallax_height_mobile ?? parsed.parallax_height ?? prev.parallax_height_mobile,
        }));
      } catch (e) {
        // ignore
      }
    } else if (content['parallax_image_url'] !== undefined || content['parallax_overlay'] !== undefined || content['parallax_height'] !== undefined) {
      setParallaxFields(prev => ({
        ...prev,
        parallax_image_url: content['parallax_image_url'] !== undefined ? content['parallax_image_url'] : prev.parallax_image_url,
        parallax_overlay: content['parallax_overlay'] !== undefined ? Number(content['parallax_overlay']) : prev.parallax_overlay,
        parallax_height: content['parallax_height'] !== undefined ? Number(content['parallax_height']) : prev.parallax_height,
        parallax_height_desktop: content['parallax_height'] !== undefined ? Number(content['parallax_height']) : prev.parallax_height_desktop,
      }));
    }
    setSectionColors({
      hero_bg_color: content['hero_bg_color'] || defaultSectionColors.hero_bg_color,
      about_bg_color: content['about_bg_color'] || defaultSectionColors.about_bg_color,
      parallax_bg_color: content['parallax_bg_color'] || defaultSectionColors.parallax_bg_color,
      catalog_bg_color: content['catalog_bg_color'] || defaultSectionColors.catalog_bg_color,
      b2b_metrics_bg_color: content['b2b_metrics_bg_color'] || defaultSectionColors.b2b_metrics_bg_color,
      engineering_bg_color: content['engineering_bg_color'] || defaultSectionColors.engineering_bg_color,
      map_bg_color: content['map_bg_color'] || defaultSectionColors.map_bg_color,
      contact_bg_color: content['contact_bg_color'] || defaultSectionColors.contact_bg_color,
      footer_bg_color: content['footer_bg_color'] || defaultSectionColors.footer_bg_color,
    });
  }, [content]);

  const handleSaveTheme = async () => {
    if (!token) return;
    try {
      await Promise.all([
        updateContent('site_theme', JSON.stringify(themeFields)),
        ...Object.entries(sectionColors).map(([key, val]) => updateContent(key, val)),
      ]);
      showToast('Cores do site e das seções atualizadas com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao salvar as cores do site.', 'error');
    }
  };

  const handleResetTheme = async () => {
    if (!token) return;
    try {
      setThemeFields(defaultTheme);
      setSectionColors(defaultSectionColors);
      await Promise.all([
        updateContent('site_theme', JSON.stringify(defaultTheme)),
        ...Object.entries(defaultSectionColors).map(([key, val]) => updateContent(key, val)),
      ]);
      showToast('Padrão industrial e cores das seções restaurados.', 'success');
    } catch (e) {
      showToast('Erro ao restaurar o tema.', 'error');
    }
  };

  const handleSaveLocation = async () => {
    if (!token) return;
    try {
      await Promise.all([
        updateContent('company_location', JSON.stringify(locationFields)),
        updateContent('map_height', String(locationFields.map_height || 400))
      ]);
      showToast('Endereço e mapa atualizados com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao salvar endereço.', 'error');
    }
  };

  const handleSaveHero = async () => {
    if (!token) return;
    try {
      const { hero_bg_youtube: _unused, ...cleanHero } = (heroFields as any);
      await Promise.all([
        updateContent('hero_settings', JSON.stringify(cleanHero)),
        updateContent('banner_height', String(cleanHero.banner_height || 80)),
        ...(content['hero_bg_youtube'] ? [updateContent('hero_bg_youtube', '')] : [])
      ]);
      showToast('Banner Principal atualizado!', 'success');
    } catch (e) {
      showToast('Erro ao salvar o banner.', 'error');
    }
  };

  const handleSaveAboutImage = async () => {
    if (!token) return;
    try {
      await updateContent('about_image_url', aboutImageUrl);
      showToast('Imagem da seção Sobre atualizada com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao salvar imagem da seção Sobre.', 'error');
    }
  };

  const handleSaveParallax = async () => {
    if (!token) return;
    try {
      await Promise.all([
        updateContent('parallax_image_url', parallaxFields.parallax_image_url),
        updateContent('parallax_overlay', String(parallaxFields.parallax_overlay)),
        updateContent('parallax_height', String(parallaxFields.parallax_height || 500))
      ]);
      showToast('Banner Parallax atualizado com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao salvar o banner parallax.', 'error');
    }
  };

  const toggleWorkDay = (dayId: string) => {
    setWhatsappWorkDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSaveWhatsApp = async () => {
    if (!token) return;
    setSavingWhatsapp(true);
    try {
      const cleanNum = cleanWhatsAppNumber(whatsappNumber);
      await Promise.all([
        updateContent('whatsapp_number', cleanNum),
        updateContent('whatsapp_default_message', whatsappDefaultMessage),
        updateContent('whatsapp_work_days', whatsappWorkDays.join(',')),
        updateContent('whatsapp_start_time', whatsappStartTime),
        updateContent('whatsapp_end_time', whatsappEndTime),
        updateContent('whatsapp_offline_message', whatsappOfflineMessage)
      ]);
      setWhatsappNumber(cleanNum);
      showToast('Configurações de WhatsApp e Horário de Atendimento salvas!', 'success');
    } catch (e) {
      showToast('Erro ao salvar configurações do WhatsApp.', 'error');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleToggleB2BQuotes = async (newValue: boolean) => {
    if (!token) return;
    setTogglingB2B(true);
    try {
      await updateContent('enable_b2b_quotes', String(newValue));
      setEnableB2BQuotes(newValue);
      showToast(
        newValue
          ? 'Sistema de Cotações B2B ativado em todo o catálogo!'
          : 'Sistema de Cotações B2B desativado (modo vitrine com WhatsApp direto).',
        'success'
      );
    } catch (e) {
      showToast('Erro ao atualizar status de cotações B2B.', 'error');
    } finally {
      setTogglingB2B(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fardin');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/pn9orwoe/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar imagem.');
      }

      setSiteLogoUrl(data.secure_url);
      showToast('Logotipo carregado na prévia! Clique em "Salvar Logotipo Oficial" para aplicar.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro no upload do logotipo', 'error');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSaveLogo = async () => {
    if (!token) return;
    setSavingLogo(true);
    try {
      await updateContent('site_logo_url', siteLogoUrl.trim());
      showToast('Logotipo oficial atualizado com sucesso no Header e Footer!', 'success');
    } catch (e) {
      showToast('Erro ao salvar o logotipo.', 'error');
    } finally {
      setSavingLogo(false);
    }
  };

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [downloadingBackup, setDownloadingBackup] = useState(false);

  // Campos do formulário
  const [formFields, setFormFields] = useState({
    titulo: '',
    codigo_referencia: '',
    categoria: 'Implementos Agrícolas',
    descricao: '',
    imagem_url: '',
    especificacoes_metalurgicas: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  // Cloudinary upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fardin');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/pn9orwoe/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar imagem para a nuvem.');
      }

      setFormFields(prev => ({ ...prev, imagem_url: data.secure_url }));
      showToast('Imagem carregada com sucesso!', 'success');
    } catch (err: any) {
      setFormError(err.message || 'Falha no upload da imagem.');
      showToast('Erro no upload', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Cloudinary upload handler for Hero
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHero(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fardin'); // Assuming this preset works for general images too

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/pn9orwoe/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar imagem para a nuvem.');
      }

      setHeroFields(prev => ({ ...prev, hero_bg_image: data.secure_url }));
      showToast('Imagem do banner carregada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro no upload da imagem do banner', 'error');
    } finally {
      setIsUploadingHero(false);
    }
  };

  // Cloudinary upload handler for About Section
  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAbout(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fardin');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/pn9orwoe/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar imagem para a nuvem.');
      }

      setAboutImageUrl(data.secure_url);
      showToast('Imagem das instalações carregada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro no upload da imagem das instalações', 'error');
    } finally {
      setIsUploadingAbout(false);
    }
  };

  // Cloudinary upload handler for Parallax Banner
  const handleParallaxImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingParallax(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fardin');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/pn9orwoe/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar imagem para a nuvem.');
      }

      setParallaxFields(prev => ({ ...prev, parallax_image_url: data.secure_url }));
      showToast('Imagem do banner parallax carregada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro no upload da imagem do banner parallax', 'error');
    } finally {
      setIsUploadingParallax(false);
    }
  };

  // ---------------------------------------------------------------------------
  // BIBLIOTECA DE MÍDIA
  // ---------------------------------------------------------------------------
  const fetchMedia = async () => {
    if (!token) return;
    setLoadingMedia(true);
    try {
      const res = await fetch('/api/media', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMediaImages(data.images);
      } else {
        showToast(data.error || 'Erro ao carregar imagens da nuvem.', 'error');
      }
    } catch (err: any) {
      showToast('Erro de comunicação ao carregar mídia.', 'error');
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'media') {
      fetchMedia();
    }
  }, [isOpen, activeTab]);

  const handleDeleteMedia = async () => {
    if (!token || !mediaDeleteConfirmId) return;
    try {
      const res = await fetch('/api/media/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ public_id: mediaDeleteConfirmId })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setMediaImages(prev => prev.filter(img => img.public_id !== mediaDeleteConfirmId));
        showToast('Imagem excluída permanentemente.', 'success');
      } else {
        showToast(data.error || 'Erro ao excluir imagem.', 'error');
      }
    } catch (err) {
      showToast('Erro de comunicação ao excluir imagem.', 'error');
    } finally {
      setMediaDeleteConfirmId(null);
    }
  };

  const getFormattedOrphanName = (img: any) => {
    const original = img.original_filename || img.filename || '';
    const baseName = img.public_id ? img.public_id.split('/').pop() || img.public_id : '';
    
    // Verifica se a string parece um hash de upload (ex: letras/números longos aleatórios)
    const isHash = (str: string) => /^[a-zA-Z0-9]{15,}$/.test(str);
    
    if (original && !isHash(original)) return original;
    if (baseName && !isHash(baseName)) {
       const clean = baseName.replace(/[-_]+/g, ' ').trim();
       if (clean && !isHash(clean.replace(/\s/g, ''))) {
           return clean.charAt(0).toUpperCase() + clean.slice(1);
       }
    }
    
    return 'Imagem não vinculada';
  };

  // Restaurar scroll nativo e garantir que html e body NÃO fiquem com 'overflow: hidden' no painel
  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    };
  }, [isOpen]);

  // Lógica de Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRobotChecked) {
      setLoginError('Por favor, confirme que você não é um robô.');
      return;
    }
    
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      onLogin(data.token, data.user.email);
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao efetuar login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Abrir offcanvas de criação
  const handleOpenCreate = () => {
    setEditingProduto(null);
    setFormFields({
      titulo: '',
      codigo_referencia: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      categoria: categorias.length > 0 ? categorias[0].name : '',
      descricao: '',
      imagem_url: '',
      especificacoes_metalurgicas: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Abrir offcanvas de edição
  const handleOpenEdit = (p: Produto) => {
    setEditingProduto(p);
    setFormFields({
      titulo: p.titulo,
      codigo_referencia: p.codigo_referencia,
      categoria: p.categoria,
      descricao: p.descricao,
      imagem_url: p.imagem_url,
      especificacoes_metalurgicas: p.especificacoes_metalurgicas || '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Salvar Produto (POST /api/produtos ou PUT /api/produtos/:id)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormSubmitting(true);
    setFormError(null);

    try {
      const url = editingProduto ? `/api/produtos/${editingProduto.id}` : '/api/produtos';
      const method = editingProduto ? 'PUT' : 'POST';

      const payload = {
        ...formFields,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar produto.');
      }

      setIsFormOpen(false);
      onRefreshProdutos();
      showToast(editingProduto ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'success');
    } catch (err: any) {
      setFormError(err.message || 'Falha na operação.');
      showToast('Erro ao salvar produto.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Deletar Produto (DELETE /api/produtos/:id)
  const handleDeleteProduct = async (id: string) => {
    if (!token) return;

    // 1. Antes de remover o produto, captura a URL da imagem associada (produto.imagem_url)
    const produto = produtos.find((p) => p.id === id);
    const imageUrl = produto?.imagem_url;

    try {
      // 2. Verifica se nenhum OUTRO produto do catálogo está utilizando essa mesma URL
      const imagemEmUsoPorOutro = Boolean(
        imageUrl && produtos.some((p) => p.id !== id && p.imagem_url === imageUrl)
      );

      // 3. Remove o produto do catálogo via API
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir produto no servidor.');
      }

      // Se a imagem não estiver vinculada a nenhum outro produto, executa a chamada de remoção da mídia/storage
      if (imageUrl && !imagemEmUsoPorOutro) {
        try {
          await fetch('/api/media/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url: imageUrl }),
          });
        } catch (mediaErr) {
          console.warn('[AdminPanel] Aviso ao excluir mídia vinculada:', mediaErr);
        }

        // Atualiza o estado da biblioteca de mídia removendo a foto
        setMediaImages((prev) => prev.filter((m) => m.url !== imageUrl));
      }

      // 4. Mantém as mensagens de confirmação e a atualização de tela funcionais
      setDeleteConfirmId(null);
      onRefreshProdutos();
      if (activeTab === 'media') {
        fetchMedia();
      }
      showToast('Produto e mídia removidos com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao apagar produto e mídia:', err);
      showToast('Erro ao excluir produto.', 'error');
    }
  };

  // Reconectar / Testar conexão com Neon
  const handleReconnectDb = async () => {
    setReconnecting(true);
    try {
      await fetch('/api/db/reconnect', { method: 'POST' });
      onRefreshDbStatus();
      onRefreshProdutos();
    } catch (e) {
      console.error(e);
    } finally {
      setReconnecting(false);
    }
  };

  // Baixar Backup Completo em JSON (GET /api/backup)
  const handleDownloadBackup = async () => {
    if (!token) return;
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar o arquivo de backup no servidor.');
      }

      const data = await res.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `backup-fardin-${today}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Backup JSON baixado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao baixar backup:', err);
      showToast('Erro ao baixar backup: ' + (err.message || 'Tente novamente.'), 'error');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!catName.trim()) {
      showToast('Nome da categoria é obrigatório.', 'error');
      return;
    }

    const slug = catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      const url = editingCategoriaId ? `/api/categorias/${editingCategoriaId}` : '/api/categorias';
      const method = editingCategoriaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: catName, slug }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar categoria.');
      }

      setCatName('');
      setEditingCategoriaId(null);
      onRefreshProdutos(); // Refreshes both products and categories in App
      showToast(editingCategoriaId ? 'Categoria atualizada!' : 'Categoria criada!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar categoria.', 'error');
    }
  };

  const handleDeleteCategoria = async (id: string, name: string) => {
    if (!token) return;
    
    // Check if there are products using this category
    const inUse = produtos.some(p => p.categoria === name);
    if (inUse) {
      showToast('Existem produtos usando esta categoria. Altere-os primeiro.', 'error');
      setCatDeleteConfirmId(null);
      return;
    }

    try {
      const res = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setCatDeleteConfirmId(null);
        onRefreshProdutos();
        showToast('Categoria excluída!', 'success');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir categoria.');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // GESTÃO DE USUÁRIOS
  // --------------------------------------------------------------------------
  const formatUserDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      } else {
        showToast(data.error || 'Erro ao carregar usuários.', 'error');
      }
    } catch (err: any) {
      showToast('Erro de comunicação ao carregar usuários.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchUsers();
    }
  }, [isOpen, token]);

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPassword('');
    setUserFormError(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserFormName(u.name);
    setUserFormEmail(u.email);
    setUserFormPassword('');
    setUserFormError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim()) {
      setUserFormError('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editingUser && !userFormPassword) {
      setUserFormError('A senha é obrigatória para o cadastro de novo usuário.');
      return;
    }
    if (userFormPassword && userFormPassword.length < 6) {
      setUserFormError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setUserFormSubmitting(true);
    setUserFormError(null);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const bodyPayload: any = {
        name: userFormName.trim(),
        email: userFormEmail.trim()
      };
      if (userFormPassword) {
        bodyPayload.password = userFormPassword;
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar usuário.');
      }

      showToast(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!', 'success');
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setUserFormError(err.message || 'Falha ao salvar usuário.');
    } finally {
      setUserFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) {
      showToast('Não é possível excluir o único usuário do sistema.', 'error');
      setUserDeleteConfirmId(null);
      return;
    }

    setUserDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir usuário.');
      }
      showToast('Usuário excluído com sucesso!', 'success');
      setUserDeleteConfirmId(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir usuário.', 'error');
    } finally {
      setUserDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-theme-bg text-theme-title animate-in fade-in"
      data-lenis-prevent
    >
      
      {/* ================================================================ */}
      {/* TELA DE LOGIN (Se não estiver autenticado) */}
      {/* ================================================================ */}
      {!token ? (
        <div className="flex-1 h-screen overflow-y-auto flex flex-col items-center justify-center p-6 relative" data-lenis-prevent>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl text-theme-body hover:text-white bg-[#25292E]/70 hover:bg-[#25292E] border border-[#373E47] text-sm font-medium transition-all shadow-sm cursor-pointer group"
            title="Voltar para o site público da Metalúrgica Fardin"
          >
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            <span>Acessar o site</span>
          </button>

          <div className="w-full max-w-md bg-theme-card border border-[#2D3238] rounded-3xl p-8 shadow-2xl space-y-8 my-auto">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-theme-primary flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-[#B82020]/20">
                F
              </div>
              <h3 className="text-2xl font-bold text-theme-title tracking-tight">Painel Administrativo</h3>
              <p className="text-sm text-theme-body">
                Acesso corporativo seguro (Neon PostgreSQL)
              </p>
            </div>

            {loginError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-sm text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#D1D5DB]">
                  E-mail do Administrador
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-theme-bg border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-shadow"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-sm font-semibold text-[#D1D5DB]">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-theme-bg border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-shadow pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A828A] hover:text-[#D1D5DB] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* reCAPTCHA provisório */}
              <div className="flex items-center gap-3 p-4 border border-[#2D3238] bg-[#1A1D20] rounded-xl cursor-pointer hover:border-[#3D444D] transition-colors" onClick={() => setIsRobotChecked(!isRobotChecked)}>
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isRobotChecked ? 'bg-theme-primary border-theme-primary' : 'bg-[#2D3238] border-[#3D444D]'}`}>
                  {isRobotChecked && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-[#D1D5DB] select-none font-medium">Não sou um robô</span>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider bg-theme-primary text-white hover:bg-[#9E1A1A] shadow-lg shadow-[#B82020]/20 transition-all disabled:opacity-50 mt-2"
              >
                {loginLoading ? 'Validando...' : 'Acessar Sistema'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ================================================================ */
        /* DASHBOARD ADMINISTRATIVO COMPLETO (Sidebar + Main Content) */
        /* ================================================================ */
        <>
          {/* SIDEBAR */}
          <aside className="w-72 bg-theme-card border-r border-[#2D3238] flex flex-col hidden md:flex">
            <div className="h-20 flex items-center px-8 border-b border-[#2D3238]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-primary flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#B82020]/20">
                  F
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-theme-title tracking-wide">FARDIN B2B</span>
                  <span className="text-[10px] text-theme-body uppercase tracking-wider">Engenharia</span>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              <button
                onClick={() => setActiveTab('visao_geral')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'visao_geral'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Visão Geral</span>
              </button>
              <button
                onClick={() => setActiveTab('produtos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'produtos'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Catálogo de Peças</span>
              </button>
              <button
                onClick={() => setActiveTab('categorias')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'categorias'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span>Categorias</span>
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'usuarios'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Usuários</span>
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'config'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Configurações</span>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'media'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span>Biblioteca de Mídia</span>
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'theme'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <Palette className="w-5 h-5" />
                <span>Cores do Site</span>
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'location'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span>Endereço da Empresa</span>
              </button>
              <button
                onClick={() => setActiveTab('hero')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'hero'
                    ? 'bg-theme-primary text-white shadow-md shadow-[#B82020]/10'
                    : 'text-theme-body hover:text-theme-title hover:bg-[#25292E]'
                }`}
              >
                <LayoutTemplate className="w-5 h-5" />
                <span>Banner Principal</span>
              </button>
            </nav>

            <div className="p-4 border-t border-[#2D3238]">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden relative" data-lenis-prevent>
            
            {/* HEADER DO MAIN CONTENT */}
            <header className="h-20 bg-theme-bg border-b border-[#2D3238] flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-theme-title">
                  {activeTab === 'visao_geral' && 'Visão Geral'}
                  {activeTab === 'produtos' && 'Catálogo de Peças'}
                  {activeTab === 'categorias' && 'Categorias'}
                  {activeTab === 'usuarios' && 'Usuários'}
                  {activeTab === 'location' && 'Endereço da Empresa'}
                  {activeTab === 'hero' && 'Banner Principal'}
                  {activeTab === 'config' && 'Configurações'}
                  {activeTab === 'theme' && 'Cores do Site'}
                  {activeTab === 'media' && 'Biblioteca de Mídia'}
                </h2>

                {/* ÍCONE DE AJUDA DISCRETO COM TOOLTIP / MODAL DA SEÇÃO */}
                <AdminSectionHelp activeTab={activeTab} />
              </div>
              
              <div className="flex items-center gap-4">
                {/* SAUDAÇÃO PERSONALIZADA DINÂMICA NO HEADER */}
                <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#25292E] border border-[#373E47] text-xs shadow-sm">
                  {greetingInfo.icon}
                  <span className="text-gray-300 font-medium">
                    {greetingInfo.greeting}, <strong className="text-white">{adminDisplayName}!</strong>
                  </span>
                </div>

                {activeTab === 'produtos' && (
                  <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-theme-primary text-white hover:bg-[#9E1A1A] transition-all shadow-md shadow-[#B82020]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Novo Produto</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25292E] hover:bg-[#323842] text-gray-200 hover:text-white border border-[#373E47] hover:border-[#4B5563] text-sm font-semibold transition-all shadow-sm cursor-pointer group"
                  title="Voltar para a visualização pública da Metalúrgica Fardin"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  <span>Acessar o site</span>
                </button>
              </div>
            </header>

            {/* CONTENT VIEWS */}
            <div className="flex-1 h-screen overflow-y-auto p-8 bg-theme-card custom-scrollbar" data-lenis-prevent>
              
              {/* VISÃO GERAL */}
              {activeTab === 'visao_geral' && (
                <div className="space-y-6">
                  {/* BANNER DE SAUDAÇÃO PERSONALIZADA BASEADA NO HORÁRIO */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-[#22272E] via-[#1C2025] to-[#151719] border border-[#2D3238] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
                        {greetingInfo.iconLarge}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-2xl font-extrabold text-white tracking-tight">
                            {greetingInfo.greeting}, {adminDisplayName}!
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Sessão Ativa
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                          Bem-vindo ao painel administrativo da Metalúrgica Fardin. Seu catálogo industrial, especificações técnicas e regras de cotação estão prontos para gerenciamento.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                      <div className="text-right hidden sm:block">
                        <span className="text-[11px] text-gray-400 block font-medium">Data do Sistema</span>
                        <span className="text-xs text-white font-semibold capitalize">
                          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] flex flex-col gap-2">
                      <span className="text-theme-body font-medium text-sm">Total de Peças Cadastradas</span>
                      <span className="text-4xl font-bold text-theme-title">{produtos.length}</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] flex flex-col gap-2">
                      <span className="text-theme-body font-medium text-sm">Status do Banco (Neon)</span>
                      <span className={`text-xl font-bold ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {dbStatus?.connected ? 'Conectado' : 'Réplica Local'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CATÁLOGO DE PEÇAS (DATA GRID) */}
              {activeTab === 'produtos' && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-theme-body">
                      Gerencie o catálogo técnico de peças e implementos agrícolas.
                    </p>
                    <button
                      onClick={onRefreshProdutos}
                      className="p-2 rounded-lg bg-theme-bg text-theme-body hover:text-white border border-[#2D3238] transition-colors"
                      title="Atualizar dados do servidor"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-theme-bg border border-[#2D3238] rounded-2xl overflow-hidden shadow-lg">
                    <div className="max-h-[600px] overflow-auto custom-scrollbar">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#25292E] text-theme-body font-semibold sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="py-4 px-6 border-b border-[#2D3238]">Produto</th>
                            <th className="py-4 px-6 border-b border-[#2D3238]">Código Ref.</th>
                            <th className="py-4 px-6 border-b border-[#2D3238]">Categoria</th>
                            <th className="py-4 px-6 border-b border-[#2D3238] text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D3238] text-[#D1D5DB]">
                          {produtos.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-theme-body">
                                Nenhum produto cadastrado no banco de dados.
                              </td>
                            </tr>
                          )}
                          {produtos.map((p) => (
                            <tr key={p.id} className="hover:bg-[#25292E]/50 transition-colors group">
                              <td className="py-3 px-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                      src={p.imagem_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&q=80'}
                                      alt={p.titulo}
                                      className="w-full h-full object-contain filter drop-shadow-xs"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&q=80';
                                        e.currentTarget.className = "w-full h-full object-cover filter drop-shadow-xs opacity-80";
                                      }}
                                    />
                                  </div>
                                  <span className="font-bold text-theme-title">{p.titulo}</span>
                                </div>
                              </td>
                              <td className="py-3 px-6">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-theme-card border border-[#373E47] text-theme-primary">
                                  {p.codigo_referencia}
                                </span>
                              </td>
                              <td className="py-3 px-6 text-theme-body">
                                {p.categoria}
                              </td>
                              <td className="py-3 px-6 text-right">
                                <div className="inline-flex items-center justify-end gap-2 w-full">
                                  <button
                                    onClick={() => handleOpenEdit(p)}
                                    className="p-2 rounded-xl bg-theme-card border border-[#2D3238] hover:border-theme-primary text-[#D1D5DB] hover:text-white transition-all shadow-sm"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  {deleteConfirmId === p.id ? (
                                    <div className="inline-flex items-center gap-2 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-700/50">
                                      <span className="text-xs font-medium text-rose-300">Excluir?</span>
                                      <button
                                        onClick={() => handleDeleteProduct(p.id)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-2.5 py-1 rounded-lg bg-theme-card border border-[#373E47] text-white text-xs hover:bg-[#25292E]"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(p.id)}
                                      className="p-2 rounded-xl bg-theme-card border border-[#2D3238] hover:border-rose-500/50 text-theme-body hover:text-rose-400 transition-all shadow-sm"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORIAS */}
              {activeTab === 'categorias' && (
                <div className="max-w-4xl space-y-6">
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
                    <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                      <Layers className="w-5 h-5 text-theme-primary" />
                      Gerenciar Categorias
                    </h4>
                    
                    <form onSubmit={handleSaveCategoria} className="flex gap-4 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="block text-sm font-semibold text-[#D1D5DB]">
                          Nome da Categoria
                        </label>
                        <input
                          type="text"
                          required
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="Ex: Peças de Motor"
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-shadow"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-theme-primary text-white hover:bg-[#9E1A1A] transition-colors whitespace-nowrap"
                      >
                        {editingCategoriaId ? 'Atualizar Categoria' : 'Adicionar Nova Categoria'}
                      </button>
                      {editingCategoriaId && (
                        <button
                          type="button"
                          onClick={() => {
                            setCatName('');
                            setEditingCategoriaId(null);
                          }}
                          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-theme-card text-theme-body border border-[#2D3238] hover:text-white transition-colors whitespace-nowrap"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </form>

                    <div className="mt-8 rounded-xl border border-[#2D3238] bg-theme-card overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#1C1F22] border-b border-[#2D3238] text-theme-title">
                          <tr>
                            <th className="py-4 px-6 font-semibold w-1/2">Nome</th>
                            <th className="py-4 px-6 font-semibold w-1/3">Slug</th>
                            <th className="py-4 px-6 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D3238]">
                          {categorias.map(cat => (
                            <tr key={cat.id} className="hover:bg-[#1F2327] transition-colors">
                              <td className="py-4 px-6 font-medium text-theme-title">{cat.name}</td>
                              <td className="py-4 px-6 text-theme-body font-mono text-xs">{cat.slug}</td>
                              <td className="py-4 px-6 text-right">
                                <div className="inline-flex items-center justify-end gap-2 w-full">
                                  <button
                                    onClick={() => {
                                      setEditingCategoriaId(cat.id);
                                      setCatName(cat.name);
                                    }}
                                    className="p-2 rounded-xl bg-theme-bg border border-[#2D3238] hover:border-theme-primary text-[#D1D5DB] hover:text-white transition-all shadow-sm"
                                    title="Editar Categoria"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  {catDeleteConfirmId === cat.id ? (
                                    <div className="inline-flex items-center gap-2 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-700/50">
                                      <span className="text-xs font-medium text-rose-300">Excluir?</span>
                                      <button
                                        onClick={() => handleDeleteCategoria(cat.id, cat.name)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setCatDeleteConfirmId(null)}
                                        className="px-2.5 py-1 rounded-lg bg-theme-bg border border-[#373E47] text-white text-xs hover:bg-[#25292E]"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setCatDeleteConfirmId(cat.id)}
                                      className="p-2 rounded-xl bg-theme-bg border border-[#2D3238] hover:border-rose-500/50 text-theme-body hover:text-rose-400 transition-all shadow-sm"
                                      title="Excluir Categoria"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {categorias.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-theme-body">
                                Nenhuma categoria cadastrada.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA DE GESTÃO DE USUÁRIOS */}
              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  {/* Card de Informações e Ação */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-bg p-6 rounded-2xl border border-[#2D3238]">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-theme-title flex items-center gap-2">
                        <Users className="w-5 h-5 text-theme-primary" />
                        <span>Gestão de Usuários Administradores</span>
                      </h3>
                      <p className="text-xs text-theme-body">
                        Cadastre e gerencie credenciais de acesso ao Painel Administrativo.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenCreateUser}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-theme-primary text-white hover:bg-[#9E1A1A] transition-all shadow-md shadow-[#B82020]/20 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Usuário</span>
                    </button>
                  </div>

                  {/* Tabela de Usuários */}
                  <div className="bg-theme-bg border border-[#2D3238] rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#25292E] bg-theme-card/50 text-xs font-bold text-theme-body uppercase tracking-wider">
                            <th className="py-4 px-6">Nome</th>
                            <th className="py-4 px-6">E-mail</th>
                            <th className="py-4 px-6">Data de Cadastro</th>
                            <th className="py-4 px-6 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#25292E] text-sm">
                          {loadingUsers ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-theme-body">
                                <div className="inline-flex items-center gap-2">
                                  <RefreshCw className="w-5 h-5 animate-spin text-theme-primary" />
                                  <span>Carregando usuários...</span>
                                </div>
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-theme-body">
                                Nenhum usuário cadastrado.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.id} className="hover:bg-[#25292E]/40 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#25292E] border border-[#373E47] flex items-center justify-center text-sm font-bold text-theme-title">
                                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-theme-title">{u.name}</div>
                                      <div className="text-xs text-theme-body">Administrador</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-theme-title font-mono text-xs">
                                  {u.email}
                                </td>
                                <td className="py-4 px-6 text-theme-body text-xs whitespace-nowrap">
                                  {formatUserDate(u.created_at)}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditUser(u)}
                                      className="p-2 rounded-xl bg-theme-card border border-[#2D3238] hover:border-theme-primary text-[#D1D5DB] hover:text-white transition-all shadow-sm cursor-pointer"
                                      title="Editar Usuário"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>

                                    {userDeleteConfirmId === u.id ? (
                                      <div className="inline-flex items-center gap-2 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-700/50">
                                        <span className="text-xs font-medium text-rose-300">Excluir?</span>
                                        <button
                                          onClick={() => handleDeleteUser(u.id)}
                                          disabled={userDeleteLoading}
                                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
                                        >
                                          {userDeleteLoading ? '...' : 'Sim'}
                                        </button>
                                        <button
                                          onClick={() => setUserDeleteConfirmId(null)}
                                          disabled={userDeleteLoading}
                                          className="px-2.5 py-1 rounded-lg bg-theme-card border border-[#373E47] text-white text-xs hover:bg-[#25292E] cursor-pointer"
                                        >
                                          Não
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (users.length <= 1) {
                                            showToast('Não é possível excluir o único usuário do sistema.', 'error');
                                          } else {
                                            setUserDeleteConfirmId(u.id);
                                          }
                                        }}
                                        disabled={users.length <= 1}
                                        className={`p-2 rounded-xl bg-theme-card border border-[#2D3238] transition-all shadow-sm cursor-pointer ${
                                          users.length <= 1
                                            ? 'opacity-40 cursor-not-allowed text-gray-500'
                                            : 'hover:border-rose-500/50 text-theme-body hover:text-rose-400'
                                        }`}
                                        title={users.length <= 1 ? 'Não é possível excluir o único usuário do sistema' : 'Excluir Usuário'}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {users.length === 1 && (
                      <div className="p-4 bg-[#1E2226] border-t border-[#25292E] text-xs text-amber-300/90 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Existe apenas 1 usuário cadastrado. A exclusão fica bloqueada para garantir a continuidade do acesso ao painel.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CONFIGURAÇÕES GERAIS, LOGOTIPO E WHATSAPP */}
              {activeTab === 'config' && (
                <div className="max-w-2xl space-y-6">
                  {/* CARD DE LOGOTIPO OFICIAL DO SITE */}
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-5">
                    <div className="flex items-start justify-between border-b border-[#25292E] pb-4 gap-4">
                      <div>
                        <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-theme-primary" />
                          Logotipo Oficial do Site (Header & Footer)
                        </h4>
                        <p className="text-xs text-theme-body mt-1">
                          Defina a imagem do logotipo que será exibida no cabeçalho e rodapé em todo o site. Integrado com o Cloudinary e salvo diretamente no banco de dados.
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                          siteLogoUrl?.trim()
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {siteLogoUrl?.trim() ? 'Logo Ativo' : 'Modo Texto Provisório'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Campo de URL */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-theme-title flex items-center justify-between">
                          <span>URL da Imagem da Logo</span>
                          <span className="text-[10px] text-theme-muted font-normal">Recomendado: PNG com fundo transparente (~200×57px)</span>
                        </label>
                        <input
                          id="admin-site-logo-url-input"
                          type="text"
                          value={siteLogoUrl}
                          onChange={(e) => setSiteLogoUrl(e.target.value)}
                          placeholder="https://res.cloudinary.com/.../logo.png"
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-white text-sm focus:outline-none focus:border-theme-primary transition-colors font-mono"
                        />
                      </div>

                      {/* Botões de Ação: Upload Cloudinary & Escolher da Biblioteca & Limpar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Ação 1: Upload Cloudinary */}
                        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center">
                          <input
                            id="admin-logo-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={isUploadingLogo}
                            className="hidden"
                          />
                          {isUploadingLogo ? (
                            <RefreshCw className="w-5 h-5 text-theme-primary animate-spin mb-1.5" />
                          ) : (
                            <UploadCloud className="w-5 h-5 text-theme-body group-hover:text-theme-primary transition-colors mb-1.5" />
                          )}
                          <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                            {isUploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                          </p>
                          <p className="text-[10px] text-theme-muted mt-0.5">Enviar PNG/JPG para Cloudinary</p>
                        </label>

                        {/* Ação 2: Escolher da Biblioteca */}
                        <button
                          type="button"
                          onClick={() => {
                            openMediaPicker((selectedUrl) => {
                              setSiteLogoUrl(selectedUrl);
                              showToast('Logotipo selecionado da biblioteca!', 'success');
                            }, 'Escolher Logotipo do Site');
                          }}
                          className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center"
                        >
                          <ImageIcon className="w-5 h-5 text-theme-body group-hover:text-theme-primary transition-colors mb-1.5" />
                          <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                            Da Biblioteca
                          </p>
                          <p className="text-[10px] text-theme-muted mt-0.5">Selecionar imagem salva</p>
                        </button>

                        {/* Ação 3: Limpar / Restaurar Modo Texto */}
                        <button
                          type="button"
                          onClick={() => {
                            setSiteLogoUrl('');
                            showToast('Logotipo removido na prévia. Clique em Salvar para publicar o texto provisório.', 'info' as any);
                          }}
                          className="flex flex-col items-center justify-center p-3.5 border border-[#2D3238] rounded-xl cursor-pointer hover:border-red-500/50 hover:bg-red-950/20 transition-all group text-center"
                        >
                          <Trash2 className="w-5 h-5 text-theme-body group-hover:text-red-400 transition-colors mb-1.5" />
                          <p className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors">
                            Remover Logo
                          </p>
                          <p className="text-[10px] text-theme-muted mt-0.5">Usar texto provisório</p>
                        </button>
                      </div>

                      {/* Prévia em tempo real sobre fundo escuro simulando o Header */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-theme-title flex items-center justify-between">
                          <span>Prévia no Cabeçalho (Fundo Escuro Real)</span>
                          <span className="text-[10px] font-mono text-gray-400">Padrão: Proporção ~200×54px</span>
                        </label>
                        <div className="p-4 rounded-xl bg-[#121417] border border-[#2D3238] flex items-center justify-between min-h-[70px]">
                          {siteLogoUrl?.trim() ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={siteLogoUrl.trim()}
                                alt="Prévia do Logotipo"
                                className="h-[46px] sm:h-[54px] max-w-[200px] sm:max-w-[220px] w-auto object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-theme-primary flex items-center justify-center shadow-md border border-white/10">
                                <span className="font-extrabold text-white text-xl tracking-tighter">F</span>
                              </div>
                              <div>
                                <span className="text-lg font-bold text-white tracking-tight">
                                  METALÚRGICA <span className="text-theme-primary">FARDIN</span>
                                </span>
                                <span className="block text-[10px] text-gray-400 tracking-wider uppercase">
                                  Implementos & Peças Agrícolas
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="text-right">
                            <span className="text-[11px] text-gray-400 block font-mono">Header Preview</span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                              {siteLogoUrl?.trim() ? 'Logo Carregada' : 'Texto Provisório'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        id="btn-admin-save-logo"
                        onClick={handleSaveLogo}
                        disabled={savingLogo || isUploadingLogo}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-theme-primary text-white hover:bg-[#9E1A1A] transition-all shadow-md shadow-[#B82020]/20 disabled:opacity-50 cursor-pointer"
                      >
                        {savingLogo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{savingLogo ? 'Salvando Logotipo...' : 'Salvar Logotipo Oficial'}</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD DE CONTROLE DO MÓDULO DE COTAÇÕES B2B */}
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-5">
                    <div className="flex items-start justify-between border-b border-[#25292E] pb-4 gap-4">
                      <div>
                        <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-theme-primary" />
                          Módulo de Cotações & Orçamentos B2B
                        </h4>
                        <p className="text-xs text-theme-body mt-1">
                          Ative ou desative o botão e o formulário de solicitação de cotação B2B nos produtos do catálogo em todo o site.
                        </p>
                      </div>

                      {/* SWITCH LIGA/DESLIGA */}
                      <button
                        id="toggle-b2b-quotes"
                        type="button"
                        role="switch"
                        aria-checked={enableB2BQuotes}
                        disabled={togglingB2B}
                        onClick={() => handleToggleB2BQuotes(!enableB2BQuotes)}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-[#14171A] disabled:opacity-50 ${
                          enableB2BQuotes ? 'bg-emerald-600' : 'bg-gray-700'
                        }`}
                      >
                        <span className="sr-only">Ativar Sistema de Cotações/Orçamentos B2B</span>
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            enableB2BQuotes ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-theme-card border border-[#2D3238]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            enableB2BQuotes ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                          }`}
                        />
                        <div>
                          <p className="text-xs font-bold text-theme-title">
                            {enableB2BQuotes
                              ? 'Sistema de Cotações B2B ATIVADO'
                              : 'Sistema de Cotações B2B DESATIVADO'}
                          </p>
                          <p className="text-[11px] text-theme-body mt-0.5">
                            {enableB2BQuotes
                              ? 'Visitantes podem solicitar orçamento de peças pelo formulário B2B e enviar via WhatsApp.'
                              : 'Os botões de cotação estão ocultos no catálogo. O site opera como vitrine técnica com contato direto.'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          enableB2BQuotes
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}
                      >
                        {enableB2BQuotes ? 'Visível no Site' : 'Oculto'}
                      </span>
                    </div>
                  </div>

                  {/* CARD DE ATENDIMENTO E WHATSAPP COMERCIAL */}
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-5">
                    <div className="flex items-center justify-between border-b border-[#25292E] pb-4">
                      <div>
                        <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-theme-primary" />
                          Atendimento & WhatsApp Comercial
                        </h4>
                        <p className="text-xs text-theme-body mt-1">
                          Configure o número e a mensagem padrão para recebimento de orçamentos e contato B2B.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* NÚMERO DO WHATSAPP */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-theme-title flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-theme-primary" />
                            Número com DDI e DDD (Apenas dígitos)
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            {formatWhatsAppForDisplay(whatsappNumber)}
                          </span>
                        </label>
                        <input
                          id="admin-whatsapp-number-input"
                          type="text"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="Ex: 5527999999999 ou 5519997428810"
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-white text-sm focus:outline-none focus:border-theme-primary transition-colors font-mono"
                        />
                        <p className="text-[11px] text-theme-body">
                          Informe o código do país (55 para Brasil) seguido do DDD e o número completo. Ex: <span className="font-mono text-[#D1D5DB]">5527999999999</span>
                        </p>
                      </div>

                      {/* MENSAGEM PADRÃO */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-theme-title flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-theme-primary" />
                          Mensagem Padrão de Cotação / Contato Inicial
                        </label>
                        <textarea
                          id="admin-whatsapp-message-input"
                          value={whatsappDefaultMessage}
                          onChange={(e) => setWhatsappDefaultMessage(e.target.value)}
                          rows={3}
                          placeholder="Ex: Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin."
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-white text-sm focus:outline-none focus:border-theme-primary transition-colors resize-none leading-relaxed"
                        />
                        <p className="text-[11px] text-theme-body">
                          Texto inicial pré-preenchido quando o visitante clica nos botões gerais de WhatsApp ou no botão flutuante.
                        </p>
                      </div>

                      {/* SEÇÃO DE HORÁRIO DE ATENDIMENTO COMERCIAL (EXPEDIENTE) */}
                      <div className="pt-4 border-t border-[#25292E] space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-theme-primary" />
                            <h5 className="text-xs font-bold text-theme-title uppercase tracking-wider">
                              Horário de Atendimento Comercial (Expediente)
                            </h5>
                          </div>
                          {(() => {
                            const status = checkWhatsAppBusinessHours({
                              workDays: whatsappWorkDays,
                              startTime: whatsappStartTime,
                              endTime: whatsappEndTime,
                              offlineMessage: whatsappOfflineMessage,
                            });
                            return (
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                                  status.isOnline
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                    : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    status.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                  }`}
                                />
                                {status.isOnline ? '🟢 Atendimento Aberto Agora' : '🔴 Fora do Expediente Agora'}
                              </span>
                            );
                          })()}
                        </div>

                        {/* SELETOR DE DIAS DA SEMANA */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-theme-title flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-theme-primary" />
                              Dias da Semana Ativos
                            </label>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setWhatsappWorkDays(['mon', 'tue', 'wed', 'thu', 'fri'])}
                                className="px-2 py-0.5 rounded bg-[#25292E] hover:bg-[#2D3238] text-theme-body hover:text-white border border-[#373E47] transition-colors"
                              >
                                Seg a Sex
                              </button>
                              <button
                                type="button"
                                onClick={() => setWhatsappWorkDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'])}
                                className="px-2 py-0.5 rounded bg-[#25292E] hover:bg-[#2D3238] text-theme-body hover:text-white border border-[#373E47] transition-colors"
                              >
                                Seg a Sáb
                              </button>
                              <button
                                type="button"
                                onClick={() => setWhatsappWorkDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])}
                                className="px-2 py-0.5 rounded bg-[#25292E] hover:bg-[#2D3238] text-theme-body hover:text-white border border-[#373E47] transition-colors"
                              >
                                Todos
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {DAYS_OF_WEEK.map((day) => {
                              const isSelected = whatsappWorkDays.includes(day.id);
                              return (
                                <button
                                  key={day.id}
                                  type="button"
                                  id={`btn-day-${day.id}`}
                                  onClick={() => toggleWorkDay(day.id)}
                                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                                    isSelected
                                      ? 'bg-theme-primary text-white border-theme-primary shadow-sm shadow-[#B82020]/20'
                                      : 'bg-theme-card text-theme-body border-[#2D3238] hover:border-gray-500 hover:text-white'
                                  }`}
                                  title={day.full}
                                >
                                  <span>{day.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-theme-body">
                            Resumo dos dias: <strong className="text-white">{formatWorkDaysSummary(whatsappWorkDays)}</strong>
                          </p>
                        </div>

                        {/* HORÁRIOS: INÍCIO E TÉRMINO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-theme-title flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              Hora de Início do Expediente
                            </label>
                            <input
                              id="admin-whatsapp-start-time"
                              type="time"
                              value={whatsappStartTime}
                              onChange={(e) => setWhatsappStartTime(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-white text-sm focus:outline-none focus:border-theme-primary transition-colors font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-theme-title flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Hora de Término do Expediente
                            </label>
                            <input
                              id="admin-whatsapp-end-time"
                              type="time"
                              value={whatsappEndTime}
                              onChange={(e) => setWhatsappEndTime(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-white text-sm focus:outline-none focus:border-theme-primary transition-colors font-mono"
                            />
                          </div>
                        </div>

                        {/* MENSAGEM DE AVISO FORA DO HORÁRIO (OFFLINE) */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-theme-title flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                            Mensagem de Aviso Fora do Horário (Offline)
                          </label>
                          <textarea
                            id="admin-whatsapp-offline-message"
                            value={whatsappOfflineMessage}
                            onChange={(e) => setWhatsappOfflineMessage(e.target.value)}
                            rows={3}
                            placeholder="Ex: Nosso atendimento comercial funciona de segunda a sexta-feira, das 08h às 18h. Envie sua mensagem e responderemos assim que retornarmos ao expediente!"
                            className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-white text-sm focus:outline-none focus:border-theme-primary transition-colors resize-none leading-relaxed"
                          />
                          <p className="text-[11px] text-theme-body">
                            Mensagem exibida no modal de aviso quando o visitante clicar no WhatsApp fora do horário de atendimento.
                          </p>
                        </div>
                      </div>

                      {/* PREVIEW DO LINK DIRETO */}
                      <div className="p-3.5 rounded-xl bg-theme-card border border-[#2D3238] space-y-2">
                        <div className="flex items-center justify-between text-xs text-theme-body">
                          <span className="font-semibold text-theme-title">Link Gerado (wa.me):</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const url = getWhatsAppLink({
                                  number: whatsappNumber,
                                  message: whatsappDefaultMessage
                                });
                                navigator.clipboard.writeText(url);
                                setCopiedWhatsappLink(true);
                                setTimeout(() => setCopiedWhatsappLink(false), 2000);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#25292E] text-theme-body hover:text-white border border-[#373E47] transition-colors"
                            >
                              {copiedWhatsappLink ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar Link</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const url = getWhatsAppLink({
                                  number: whatsappNumber,
                                  message: whatsappDefaultMessage
                                });
                                window.open(url, '_blank');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#25292E] text-emerald-400 hover:text-emerald-300 border border-[#373E47] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Testar no WhatsApp</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-[#A0AAB4] break-all bg-theme-bg p-2.5 rounded-lg border border-[#25292E]">
                          {getWhatsAppLink({ number: whatsappNumber, message: whatsappDefaultMessage })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        id="btn-admin-save-whatsapp"
                        onClick={handleSaveWhatsApp}
                        disabled={savingWhatsapp}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-theme-primary text-white hover:bg-[#9E1A1A] transition-all shadow-md shadow-[#B82020]/20 disabled:opacity-50"
                      >
                        {savingWhatsapp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>{savingWhatsapp ? 'Salvando Configurações...' : 'Salvar WhatsApp Comercial'}</span>
                      </button>
                    </div>
                  </div>

                  {/* STATUS DO BANCO DE DADOS */}
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-4">
                    <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                      <Database className="w-5 h-5 text-theme-primary" />
                      Status da Conexão PostgreSQL (Neon)
                    </h4>
                    
                    <div className="space-y-3">
                       <div className="flex justify-between items-center py-3 border-b border-[#25292E]">
                        <span className="text-sm font-medium text-theme-body">Motor:</span>
                        <span className="text-sm font-bold text-theme-title">{dbStatus?.engine}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-[#25292E]">
                        <span className="text-sm font-medium text-theme-body">Status:</span>
                        <span className={`text-sm font-bold ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {dbStatus?.connected ? 'Conectado à Nuvem' : 'Utilizando Réplica Local'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 py-3 border-b border-[#25292E]">
                        <span className="text-sm font-medium text-theme-body">DATABASE_URL:</span>
                        <span className="text-xs font-mono text-[#D1D5DB] break-all bg-theme-card p-3 rounded-lg border border-[#2D3238]">
                          {dbStatus?.databaseUrlMasked || 'Não informada'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleReconnectDb}
                        disabled={reconnecting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#25292E] text-white hover:bg-[#373E47] transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${reconnecting ? 'animate-spin' : ''}`} />
                        <span>{reconnecting ? 'Testando conexão...' : 'Re-testar Conexão'}</span>
                      </button>
                    </div>
                  </div>

                  {/* COMPONENTE DE BACKUP & RESTAURAÇÃO */}
                  <BackupSection
                    onRestoreSuccess={() => {
                      fetchUsers();
                      onRefreshProdutos();
                      onRefreshDbStatus();
                    }}
                  />
                </div>
              )}

              {/* CORES DO SITE */}
              {activeTab === 'theme' && (
                <div className="max-w-2xl space-y-6">
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                        <Palette className="w-5 h-5 text-theme-primary" />
                        Identidade Visual
                      </h4>
                      <button
                        onClick={handleResetTheme}
                        className="px-4 py-2 text-xs font-bold text-theme-body bg-theme-card border border-[#2D3238] rounded-xl hover:text-white hover:bg-[#25292E] transition-colors"
                      >
                        Restaurar Padrão Industrial
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Destaques */}
                      <div>
                        <h5 className="text-sm font-bold text-theme-title mb-4">Botões e Destaques</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-theme-body">Cor Principal (Primary)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={themeFields.primary}
                                onChange={(e) => setThemeFields(prev => ({ ...prev, primary: e.target.value }))}
                                className="w-12 h-10 rounded cursor-pointer border border-[#2D3238] bg-theme-card"
                              />
                              <input
                                type="text"
                                value={themeFields.primary}
                                onChange={(e) => setThemeFields(prev => ({ ...prev, primary: e.target.value }))}
                                className="flex-1 px-3 py-2 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title uppercase focus:border-theme-primary outline-none transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <hr className="border-[#2D3238]" />

                      {/* Fontes e Textos */}
                      <div>
                        <h5 className="text-sm font-bold text-theme-title mb-4">Fontes e Textos</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-theme-body">Texto Principal</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={themeFields.text_main}
                                onChange={(e) => setThemeFields(prev => ({ ...prev, text_main: e.target.value }))}
                                className="w-12 h-10 rounded cursor-pointer border border-[#2D3238] bg-theme-card"
                              />
                              <input
                                type="text"
                                value={themeFields.text_main}
                                onChange={(e) => setThemeFields(prev => ({ ...prev, text_main: e.target.value }))}
                                className="flex-1 px-3 py-2 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title uppercase focus:border-theme-primary outline-none transition-colors"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-theme-body">Texto Suave</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={themeFields.text_muted}
                                onChange={(e) => setThemeFields(prev => ({ ...prev, text_muted: e.target.value }))}
                                className="w-12 h-10 rounded cursor-pointer border border-[#2D3238] bg-theme-card"
                              />
                              <input
                                type="text"
                                value={themeFields.text_muted}
                                onChange={(e) => setThemeFields(prev => ({ ...prev, text_muted: e.target.value }))}
                                className="flex-1 px-3 py-2 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title uppercase focus:border-theme-primary outline-none transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <hr className="border-[#2D3238]" />

                      {/* Cores de Fundo das Seções da Página */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="text-sm font-bold text-theme-title">Cores de Fundo das Seções</h5>
                            <p className="text-xs text-theme-body">
                              Você também pode alterar a cor de cada seção diretamente na página usando o botão "Cor da Seção".
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { key: 'hero_bg_color', label: '1. Banner Principal (Hero)' },
                            { key: 'about_bg_color', label: '2. A Empresa' },
                            { key: 'parallax_bg_color', label: '3. Destaque Parallax' },
                            { key: 'catalog_bg_color', label: '4. Catálogo de Peças' },
                            { key: 'b2b_metrics_bg_color', label: '5. Métricas B2B' },
                            { key: 'engineering_bg_color', label: '6. Engenharia & Rigor' },
                            { key: 'contact_bg_color', label: '7. Atendimento & Contato' },
                            { key: 'footer_bg_color', label: '8. Rodapé' },
                          ].map((sec) => (
                            <div key={sec.key} className="space-y-1.5 p-3 rounded-xl bg-theme-card border border-[#2D3238]">
                              <label className="block text-xs font-semibold text-theme-title">
                                {sec.label}
                              </label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={(sectionColors as any)[sec.key] || '#1A1D20'}
                                  onChange={(e) => setSectionColors(prev => ({ ...prev, [sec.key]: e.target.value }))}
                                  className="w-9 h-8 rounded-lg cursor-pointer border border-[#2D3238] bg-transparent"
                                />
                                <input
                                  type="text"
                                  value={(sectionColors as any)[sec.key] || ''}
                                  onChange={(e) => setSectionColors(prev => ({ ...prev, [sec.key]: e.target.value }))}
                                  placeholder="#1A1D20"
                                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#16181B] border border-[#2D3238] text-xs text-theme-title font-mono uppercase focus:border-theme-primary outline-none transition-colors"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-[#2D3238]">
                      <button
                        onClick={handleSaveTheme}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-theme-primary text-white shadow-lg hover:brightness-110 transition-all"
                      >
                        Salvar Alterações Visual
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LOCATION */}
              {activeTab === 'location' && (
                <div className="max-w-2xl space-y-6">
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
                    <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-theme-primary" />
                      Endereço da Empresa
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            Rua / Avenida e Número
                          </label>
                          <input
                            type="text"
                            value={locationFields.street}
                            onChange={(e) => setLocationFields({ ...locationFields, street: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={locationFields.neighborhood}
                            onChange={(e) => setLocationFields({ ...locationFields, neighborhood: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            Cidade - UF
                          </label>
                          <input
                            type="text"
                            value={locationFields.city_state}
                            onChange={(e) => setLocationFields({ ...locationFields, city_state: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            CEP
                          </label>
                          <input
                            type="text"
                            value={locationFields.zip_code}
                            onChange={(e) => setLocationFields({ ...locationFields, zip_code: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="block text-sm font-semibold text-theme-body">
                          URL do Mapa (Google Maps Embed)
                        </label>
                        <textarea
                          rows={3}
                          value={locationFields.google_maps_url}
                          onChange={(e) => setLocationFields({ ...locationFields, google_maps_url: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          placeholder="Cole a URL de embed (src do iframe) do Google Maps..."
                        />
                      </div>

                      <div className="space-y-3 pt-4 border-t border-[#2D3238]">
                        <label className="block text-sm font-semibold text-theme-body">
                          Aparência do Mapa
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            onClick={() => setLocationFields({ ...locationFields, map_theme: 'dark' })}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                              locationFields.map_theme === 'dark' || !locationFields.map_theme
                                ? 'bg-theme-primary border-theme-primary text-white shadow-md'
                                : 'bg-theme-card border-[#2D3238] text-theme-body hover:border-[#4A5568]'
                            }`}
                          >
                            Dark Industrial
                          </button>
                          <button
                            onClick={() => setLocationFields({ ...locationFields, map_theme: 'grayscale' })}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                              locationFields.map_theme === 'grayscale'
                                ? 'bg-gray-600 border-gray-600 text-white shadow-md'
                                : 'bg-theme-card border-[#2D3238] text-theme-body hover:border-[#4A5568]'
                            }`}
                          >
                            Monocromático
                          </button>
                          <button
                            onClick={() => setLocationFields({ ...locationFields, map_theme: 'default' })}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                              locationFields.map_theme === 'default'
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-theme-card border-[#2D3238] text-theme-body hover:border-[#4A5568]'
                            }`}
                          >
                            Padrão Google
                          </button>
                        </div>
                      </div>

                      {/* SLIDER DE ALTURA RESPONSIVA DO MAPA */}
                      <div className="space-y-3 pt-4 border-t border-[#2D3238]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            Altura do Mapa por Dispositivo
                          </label>
                          <div className="flex items-center gap-1 bg-theme-card p-1 rounded-lg border border-[#2D3238]">
                            <button
                              type="button"
                              onClick={() => setMapHeightDevice('desktop')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                mapHeightDevice === 'desktop' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Desktop
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapHeightDevice('tablet')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                mapHeightDevice === 'tablet' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Tablet
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapHeightDevice('mobile')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                mapHeightDevice === 'mobile' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Celular
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-theme-muted">
                            Dispositivo: <strong className="text-white uppercase">{mapHeightDevice}</strong>
                          </span>
                          <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-1 rounded">
                            {mapHeightDevice === 'desktop' ? (locationFields.map_height_desktop ?? locationFields.map_height ?? 400) :
                             mapHeightDevice === 'tablet' ? (locationFields.map_height_tablet ?? 350) :
                             (locationFields.map_height_mobile ?? 300)}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="200"
                          max="800"
                          step="10"
                          value={
                            mapHeightDevice === 'desktop' ? (locationFields.map_height_desktop ?? locationFields.map_height ?? 400) :
                            mapHeightDevice === 'tablet' ? (locationFields.map_height_tablet ?? 350) :
                            (locationFields.map_height_mobile ?? 300)
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 400;
                            setLocationFields(prev => ({
                              ...prev,
                              ...(mapHeightDevice === 'desktop' ? { map_height_desktop: val, map_height: val } : {}),
                              ...(mapHeightDevice === 'tablet' ? { map_height_tablet: val } : {}),
                              ...(mapHeightDevice === 'mobile' ? { map_height_mobile: val } : {}),
                            }));
                          }}
                          className="w-full h-2 bg-theme-card rounded-lg appearance-none cursor-pointer accent-theme-primary"
                        />
                        <div className="flex justify-between text-xs text-theme-muted">
                          <span>200px (Compacto)</span>
                          <span>800px (Expandido)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2D3238]">
                      <button
                        onClick={handleSaveLocation}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-theme-primary text-white shadow-lg hover:brightness-110 transition-all"
                      >
                        Salvar Endereço
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HERO BANNER */}
              {activeTab === 'hero' && (
                <div className="max-w-2xl space-y-6">
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
                    <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                      <LayoutTemplate className="w-5 h-5 text-theme-primary" />
                      Aparência do Banner Principal
                    </h4>
                    
                    <div className="space-y-4">
                      {/* PREVIEW EM TEMPO REAL */}
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#2D3238] bg-black group">
                        {heroFields.hero_bg_image ? (
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${heroFields.hero_bg_image})` }}
                          />
                        ) : null}
                        {heroFields.hero_bg_image ? (
                          <div 
                            className="absolute inset-0"
                            style={{ backgroundColor: `rgba(26, 29, 32, ${heroFields.hero_overlay_opacity / 100})` }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                           <div className="text-white text-center">
                              <h5 className="font-bold text-sm">Banner Preview</h5>
                              <p className="text-xs text-white/60">Ajuste a imagem e opacidade</p>
                           </div>
                        </div>
                      </div>

                      {/* UPLOAD IMAGEM / ESCOLHER DA BIBLIOTECA */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-theme-body mb-1">
                            Imagem de Fundo do Banner
                          </label>
                          <p className="text-xs text-theme-muted">
                            Tamanho recomendado: 1920 × 1080px (Proporção 16:9) • Formato JPG, PNG ou WebP
                          </p>
                        </div>

                        {/* Duas ações claras: Upload Direto ou Escolher da Biblioteca */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Ação 1: Fazer Upload de Nova Imagem */}
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center min-h-[105px]">
                            {isUploadingHero ? (
                              <RefreshCw className="w-6 h-6 text-theme-primary animate-spin mb-2" />
                            ) : (
                              <UploadCloud className="w-6 h-6 text-theme-body group-hover:text-theme-primary transition-colors mb-2" />
                            )}
                            <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                              {isUploadingHero ? 'Enviando...' : 'Fazer Upload de Nova Imagem'}
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">Upload direto para Cloudinary</p>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleHeroImageUpload}
                              disabled={isUploadingHero}
                            />
                          </label>

                          {/* Ação 2: Escolher da Biblioteca */}
                          <button
                            type="button"
                            onClick={() => {
                              openMediaPicker((selectedUrl) => {
                                setHeroFields(prev => ({ ...prev, hero_bg_image: selectedUrl }));
                                showToast('Imagem do banner selecionada com sucesso!', 'success');
                              }, 'Escolher Imagem para o Banner');
                            }}
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center min-h-[105px]"
                          >
                            <ImageIcon className="w-6 h-6 text-theme-body group-hover:text-theme-primary transition-colors mb-2" />
                            <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                              Escolher da Biblioteca
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">Selecionar imagem já existente</p>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={heroFields.hero_bg_image}
                          onChange={(e) => setHeroFields({ ...heroFields, hero_bg_image: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-xs font-mono text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          placeholder="URL da Imagem (ou selecione acima)..."
                        />
                      </div>

                      {/* OPACIDADE */}
                      <div className="space-y-3 pt-4 border-t border-[#2D3238]">
                        <div className="flex justify-between items-center">
                           <label className="block text-sm font-semibold text-theme-body">
                             Escurecimento (Overlay)
                           </label>
                           <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-1 rounded">
                             {heroFields.hero_overlay_opacity}%
                           </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={heroFields.hero_overlay_opacity}
                          onChange={(e) => setHeroFields({ ...heroFields, hero_overlay_opacity: parseInt(e.target.value) })}
                          className="w-full h-2 bg-theme-card rounded-lg appearance-none cursor-pointer accent-theme-primary"
                        />
                        <div className="flex justify-between text-xs text-theme-muted">
                           <span>Mais Claro</span>
                           <span>Mais Escuro</span>
                        </div>
                      </div>

                      {/* SLIDER DE ALTURA RESPONSIVA DO BANNER PRINCIPAL */}
                      <div className="space-y-3 pt-4 border-t border-[#2D3238]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            Altura do Banner por Dispositivo
                          </label>
                          <div className="flex items-center gap-1 bg-theme-card p-1 rounded-lg border border-[#2D3238]">
                            <button
                              type="button"
                              onClick={() => setHeroHeightDevice('desktop')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                heroHeightDevice === 'desktop' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Desktop
                            </button>
                            <button
                              type="button"
                              onClick={() => setHeroHeightDevice('tablet')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                heroHeightDevice === 'tablet' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Tablet
                            </button>
                            <button
                              type="button"
                              onClick={() => setHeroHeightDevice('mobile')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                heroHeightDevice === 'mobile' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Celular
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-theme-muted">
                            Dispositivo: <strong className="text-white uppercase">{heroHeightDevice}</strong>
                          </span>
                          <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-1 rounded">
                            {heroHeightDevice === 'desktop' ? (heroFields.banner_height_desktop ?? heroFields.banner_height ?? 80) :
                             heroHeightDevice === 'tablet' ? (heroFields.banner_height_tablet ?? 70) :
                             (heroFields.banner_height_mobile ?? 60)}vh
                          </span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="100"
                          step="1"
                          value={
                            heroHeightDevice === 'desktop' ? (heroFields.banner_height_desktop ?? heroFields.banner_height ?? 80) :
                            heroHeightDevice === 'tablet' ? (heroFields.banner_height_tablet ?? 70) :
                            (heroFields.banner_height_mobile ?? 60)
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 80;
                            setHeroFields(prev => ({
                              ...prev,
                              ...(heroHeightDevice === 'desktop' ? { banner_height_desktop: val, banner_height: val } : {}),
                              ...(heroHeightDevice === 'tablet' ? { banner_height_tablet: val } : {}),
                              ...(heroHeightDevice === 'mobile' ? { banner_height_mobile: val } : {}),
                            }));
                          }}
                          className="w-full h-2 bg-theme-card rounded-lg appearance-none cursor-pointer accent-theme-primary"
                        />
                        <div className="flex justify-between text-xs text-theme-muted">
                          <span>40vh (Mais Baixo)</span>
                          <span>100vh (Tela Cheia)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2D3238]">
                      <button
                        onClick={handleSaveHero}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-theme-primary text-white shadow-lg hover:brightness-110 transition-all"
                      >
                        Salvar Banner
                      </button>
                    </div>
                  </div>

                  {/* IMAGEM DA SEÇÃO SOBRE A EMPRESA (INSTALAÇÕES) */}
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-theme-primary" />
                          Imagem das Instalações (Sobre a Empresa)
                        </h4>
                        <p className="text-xs text-theme-muted mt-0.5">
                          Fotografia oficial das instalações fabris exibida na seção institucional ("Pioneirismo em Soluções Agrícolas").
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* PREVIEW DA IMAGEM SOBRE */}
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#2D3238] bg-[#151719] group flex items-center justify-center">
                        {aboutImageUrl ? (
                          <img 
                            src={aboutImageUrl}
                            alt="Preview Instalações"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center text-theme-muted">
                            <Building2 className="w-8 h-8 text-theme-primary/40 mb-2" />
                            <p className="text-xs">Nenhuma imagem definida</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span className="text-[11px] font-bold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10">
                            Preview: Sobre a Empresa
                          </span>
                          <span className="text-[10px] text-theme-muted font-mono bg-black/60 px-2 py-0.5 rounded">
                            Desde 1983
                          </span>
                        </div>
                      </div>

                      {/* UPLOAD IMAGEM / ESCOLHER DA BIBLIOTECA */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-theme-body mb-1">
                            Foto das Instalações Fabris
                          </label>
                          <p className="text-xs text-theme-muted">
                            Tamanho recomendado: 1200 × 800px (Proporção 3:2 ou 4:3) • Formato JPG, PNG ou WebP
                          </p>
                        </div>

                        {/* Duas ações claras: Upload Direto ou Escolher da Biblioteca */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Ação 1: Fazer Upload de Nova Imagem */}
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center min-h-[105px]">
                            {isUploadingAbout ? (
                              <RefreshCw className="w-6 h-6 text-theme-primary animate-spin mb-2" />
                            ) : (
                              <UploadCloud className="w-6 h-6 text-theme-body group-hover:text-theme-primary transition-colors mb-2" />
                            )}
                            <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                              {isUploadingAbout ? 'Enviando...' : 'Fazer Upload de Nova Imagem'}
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">Upload direto para Cloudinary</p>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleAboutImageUpload}
                              disabled={isUploadingAbout}
                            />
                          </label>

                          {/* Ação 2: Escolher da Biblioteca */}
                          <button
                            type="button"
                            onClick={() => {
                              openMediaPicker((selectedUrl) => {
                                setAboutImageUrl(selectedUrl);
                                showToast('Imagem das instalações selecionada com sucesso!', 'success');
                              }, 'Escolher Imagem das Instalações (Sobre)');
                            }}
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center min-h-[105px]"
                          >
                            <ImageIcon className="w-6 h-6 text-theme-body group-hover:text-theme-primary transition-colors mb-2" />
                            <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                              Escolher da Biblioteca
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">Selecionar imagem já existente</p>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={aboutImageUrl}
                          onChange={(e) => setAboutImageUrl(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-xs font-mono text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          placeholder="URL da Imagem das Instalações..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2D3238]">
                      <button
                        onClick={handleSaveAboutImage}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-theme-primary text-white shadow-lg hover:brightness-110 transition-all"
                      >
                        Salvar Imagem das Instalações
                      </button>
                    </div>
                  </div>

                  {/* BANNER SECUNDÁRIO / PARALLAX */}
                  <div className="p-6 rounded-2xl bg-theme-bg border border-[#2D3238] space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-theme-title flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-theme-primary" />
                          Banner Secundário / Parallax
                        </h4>
                        <p className="text-xs text-theme-muted mt-0.5">
                          Seção de alto impacto visual com efeito parallax posicionada entre "Sobre a Empresa" e o Catálogo.
                        </p>
                      </div>
                    </div>

                    {/* AVISO DE EDIÇÃO INLINE */}
                    <div className="p-3.5 rounded-xl bg-theme-card/60 border border-theme-primary/20 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-theme-primary mt-1.5 shrink-0" />
                      <p className="text-xs text-theme-body leading-relaxed">
                        <strong className="text-theme-title">Edição Direta na Página:</strong> O Título e o Subtítulo deste banner podem ser editados diretamente na Landing Page clicando sobre o texto (quando estiver logado como administrador).
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* PREVIEW EM TEMPO REAL DO PARALLAX */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-theme-body">
                          Pré-visualização em Tempo Real
                        </label>
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[#2D3238] bg-[#151719] flex items-center justify-center text-center p-4">
                          {parallaxFields.parallax_image_url ? (
                            <img 
                              src={parallaxFields.parallax_image_url}
                              alt="Preview Parallax"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[#1A1D20]" />
                          )}
                          
                          {/* OVERLAY DINÂMICO */}
                          <div 
                            className="absolute inset-0 transition-colors pointer-events-none"
                            style={{ backgroundColor: `rgba(0, 0, 0, ${Math.min(100, Math.max(0, parallaxFields.parallax_overlay)) / 100})` }}
                          />

                          {/* CONTEÚDO TEXTUAL DO PREVIEW */}
                          <div className="relative z-10 max-w-md mx-auto space-y-2 pointer-events-none">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white">
                              {content['parallax_badge'] || 'Qualidade & Confiança Fardin'}
                            </span>
                            <h5 className="text-sm sm:text-base font-extrabold text-white drop-shadow-md leading-tight">
                              {content['parallax_title'] || 'Engenharia e Robustez para o Agronegócio'}
                            </h5>
                            <p className="text-[11px] text-white/80 drop-shadow line-clamp-2 leading-relaxed">
                              {content['parallax_subtitle'] || 'Desenvolvemos componentes agrícolas de altíssima precisão e durabilidade para maximizar a produtividade e a segurança operacional no campo.'}
                            </p>
                          </div>

                          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                            <span className="text-[10px] font-mono text-theme-muted bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                              Opacidade: {parallaxFields.parallax_overlay}% • Altura: {parallaxFields.parallax_height || 500}px
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* UPLOAD IMAGEM / ESCOLHER DA BIBLIOTECA */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-sm font-semibold text-theme-body mb-1">
                            Imagem de Fundo (Parallax)
                          </label>
                          <p className="text-xs text-theme-muted">
                            Recomendado: Imagem panorâmica de alta resolução (1920 × 1080px ou superior) • Formato JPG, PNG ou WebP
                          </p>
                        </div>

                        {/* Duas ações: Upload Direto ou Escolher da Biblioteca */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Ação 1: Upload de Nova Imagem */}
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center min-h-[105px]">
                            {isUploadingParallax ? (
                              <RefreshCw className="w-6 h-6 text-theme-primary animate-spin mb-2" />
                            ) : (
                              <UploadCloud className="w-6 h-6 text-theme-body group-hover:text-theme-primary transition-colors mb-2" />
                            )}
                            <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                              {isUploadingParallax ? 'Enviando...' : 'Fazer Upload de Nova Imagem'}
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">Upload direto para Cloudinary</p>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleParallaxImageUpload}
                              disabled={isUploadingParallax}
                            />
                          </label>

                          {/* Ação 2: Escolher da Biblioteca */}
                          <button
                            type="button"
                            onClick={() => {
                              openMediaPicker((selectedUrl) => {
                                setParallaxFields(prev => ({ ...prev, parallax_image_url: selectedUrl }));
                                showToast('Imagem do parallax selecionada com sucesso!', 'success');
                              }, 'Escolher Imagem para o Banner Parallax');
                            }}
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2D3238] rounded-xl cursor-pointer hover:border-theme-primary hover:bg-[#25292E] transition-all group text-center min-h-[105px]"
                          >
                            <ImageIcon className="w-6 h-6 text-theme-body group-hover:text-theme-primary transition-colors mb-2" />
                            <p className="text-xs font-semibold text-white group-hover:text-theme-primary transition-colors">
                              Escolher da Biblioteca
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">Selecionar imagem já existente</p>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={parallaxFields.parallax_image_url}
                          onChange={(e) => setParallaxFields({ ...parallaxFields, parallax_image_url: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-theme-card border border-[#2D3238] text-xs font-mono text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                          placeholder="URL da Imagem do Parallax..."
                        />
                      </div>

                      {/* CONTROLE DESLIZANTE (SLIDER) DE ESCURECIMENTO */}
                      <div className="space-y-3 pt-3 border-t border-[#2D3238]">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-semibold text-theme-body">
                            Escurecimento (Overlay Opacity)
                          </label>
                          <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-1 rounded">
                            {parallaxFields.parallax_overlay}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={parallaxFields.parallax_overlay}
                          onChange={(e) => setParallaxFields({ ...parallaxFields, parallax_overlay: parseInt(e.target.value) || 0 })}
                          className="w-full h-2 bg-theme-card rounded-lg appearance-none cursor-pointer accent-theme-primary"
                        />
                        <div className="flex justify-between text-xs text-theme-muted">
                          <span>0% (Sem escurecimento)</span>
                          <span>100% (Preto total)</span>
                        </div>
                      </div>

                       {/* CONTROLE DESLIZANTE (SLIDER) DE ALTURA RESPONSIVA DO PARALLAX */}
                      <div className="space-y-3 pt-3 border-t border-[#2D3238]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <label className="block text-sm font-semibold text-theme-body">
                            Altura da Seção (Parallax) por Dispositivo
                          </label>
                          <div className="flex items-center gap-1 bg-theme-card p-1 rounded-lg border border-[#2D3238]">
                            <button
                              type="button"
                              onClick={() => setParallaxHeightDevice('desktop')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                parallaxHeightDevice === 'desktop' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Desktop
                            </button>
                            <button
                              type="button"
                              onClick={() => setParallaxHeightDevice('tablet')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                parallaxHeightDevice === 'tablet' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Tablet
                            </button>
                            <button
                              type="button"
                              onClick={() => setParallaxHeightDevice('mobile')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                parallaxHeightDevice === 'mobile' ? 'bg-theme-primary text-white' : 'text-theme-muted hover:text-white'
                              }`}
                            >
                              Celular
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-theme-muted">
                            Dispositivo: <strong className="text-white uppercase">{parallaxHeightDevice}</strong>
                          </span>
                          <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-1 rounded">
                            {parallaxHeightDevice === 'desktop' ? (parallaxFields.parallax_height_desktop ?? parallaxFields.parallax_height ?? 500) :
                             parallaxHeightDevice === 'tablet' ? (parallaxFields.parallax_height_tablet ?? 400) :
                             (parallaxFields.parallax_height_mobile ?? 350)}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="250"
                          max="800"
                          step="10"
                          value={
                            parallaxHeightDevice === 'desktop' ? (parallaxFields.parallax_height_desktop ?? parallaxFields.parallax_height ?? 500) :
                            parallaxHeightDevice === 'tablet' ? (parallaxFields.parallax_height_tablet ?? 400) :
                            (parallaxFields.parallax_height_mobile ?? 350)
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 500;
                            setParallaxFields(prev => ({
                              ...prev,
                              ...(parallaxHeightDevice === 'desktop' ? { parallax_height_desktop: val, parallax_height: val } : {}),
                              ...(parallaxHeightDevice === 'tablet' ? { parallax_height_tablet: val } : {}),
                              ...(parallaxHeightDevice === 'mobile' ? { parallax_height_mobile: val } : {}),
                            }));
                          }}
                          className="w-full h-2 bg-theme-card rounded-lg appearance-none cursor-pointer accent-theme-primary"
                        />
                        <div className="flex justify-between text-xs text-theme-muted">
                          <span>250px (Compacto)</span>
                          <span>800px (Expandido)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2D3238]">
                      <button
                        onClick={handleSaveParallax}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-theme-primary text-white shadow-lg hover:brightness-110 transition-all cursor-pointer"
                      >
                        Salvar Banner Parallax
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MEDIA LIBRARY */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-theme-title">Biblioteca de Mídia</h3>
                    
                    <div className="flex items-center gap-3">
                      {/* View Mode Toggle */}
                      <div className="flex items-center p-1 bg-theme-card border border-[#2D3238] rounded-xl">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            viewMode === 'grid'
                              ? 'bg-theme-primary text-white shadow-sm shadow-[#B82020]/20'
                              : 'text-theme-muted hover:text-theme-title'
                          }`}
                          title="Visualização em Grade"
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span className="hidden sm:inline">Grade</span>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            viewMode === 'list'
                              ? 'bg-theme-primary text-white shadow-sm shadow-[#B82020]/20'
                              : 'text-theme-muted hover:text-theme-title'
                          }`}
                          title="Visualização em Lista"
                        >
                          <List className="w-4 h-4" />
                          <span className="hidden sm:inline">Lista</span>
                        </button>
                      </div>

                      <button
                        onClick={fetchMedia}
                        disabled={loadingMedia}
                        className="p-2 rounded-xl bg-theme-card text-theme-body hover:text-white transition-colors border border-[#2D3238]"
                        title="Atualizar Biblioteca"
                      >
                        <RefreshCw className={`w-5 h-5 ${loadingMedia ? 'animate-spin text-theme-primary' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {loadingMedia && mediaImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-theme-muted">
                      <RefreshCw className="w-8 h-8 animate-spin text-theme-primary mb-4" />
                      <p>Carregando imagens...</p>
                    </div>
                  ) : mediaImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-theme-muted bg-theme-bg border border-[#2D3238] rounded-2xl">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                      <p>Nenhuma imagem encontrada na biblioteca.</p>
                      <p className="text-sm mt-2">Faça o upload nos formulários de produtos ou banner.</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {mediaImages.map((img) => {
                        const produtoCorrespondente = produtos.find(p => p.imagem_url === img.url);
                        const orphanTitle = getFormattedOrphanName(img);
                        const displayName = produtoCorrespondente ? produtoCorrespondente.titulo : orphanTitle;
                        return (
                          <div
                            key={img.public_id}
                            onClick={() => setPreviewImage(img.url)}
                            className="bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 rounded-2xl p-4 aspect-square flex items-center justify-center overflow-hidden group relative hover:border-emerald-500 transition-all shadow-sm cursor-pointer"
                          >
                            <img
                              src={img.url}
                              alt={displayName}
                              title={produtoCorrespondente ? `${produtoCorrespondente.titulo} (${img.public_id})` : `${displayName} • Não em uso (${img.public_id})`}
                              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            
                            {/* OVERLAY ACTIONS */}
                            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(img.url);
                                  showToast('URL copiada para a área de transferência!', 'success');
                                }}
                                className="w-full max-w-[130px] py-1.5 px-2 bg-theme-card border border-[#2D3238] rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="truncate">Copiar URL</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMediaDeleteConfirmId(img.public_id);
                                }}
                                className="w-full max-w-[130px] py-1.5 px-2 bg-theme-card border border-[#2D3238] rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:border-rose-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div className="bg-theme-card border border-[#2D3238] rounded-2xl overflow-hidden divide-y divide-[#2D3238]">
                      {mediaImages.map((img) => {
                        const produtoCorrespondente = produtos.find(p => p.imagem_url === img.url);
                        const orphanTitle = getFormattedOrphanName(img);
                        const displayTitle = produtoCorrespondente ? produtoCorrespondente.titulo : orphanTitle;
                        return (
                          <div
                            key={img.public_id}
                            className="flex items-center justify-between gap-4 p-4 hover:bg-gray-800/50 transition-colors"
                          >
                            {/* MINIATURA E NOME INTELIGENTE */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div
                                onClick={() => setPreviewImage(img.url)}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs cursor-pointer group"
                              >
                                <img
                                  src={img.url}
                                  alt={displayTitle}
                                  className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-110 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                {produtoCorrespondente ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-theme-title truncate" title={produtoCorrespondente.titulo}>
                                      {produtoCorrespondente.titulo}
                                    </p>
                                    {produtoCorrespondente.codigo_referencia && (
                                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                                        REF: {produtoCorrespondente.codigo_referencia}
                                      </span>
                                    )}
                                  </div>
                                ) : img.productName ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-theme-title truncate" title={img.productName}>
                                      {img.productName}
                                    </p>
                                    {img.productRef && (
                                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                                        REF: {img.productRef}
                                      </span>
                                    )}
                                    {img.contextType === 'hero' && (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        Banner
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-theme-title truncate" title={orphanTitle}>
                                      {orphanTitle}
                                    </p>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      Não em uso
                                    </span>
                                  </div>
                                )}

                                {/* PUBLIC_ID E METADADOS */}
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap font-mono">
                                  <span className="truncate max-w-[200px] sm:max-w-xs" title={img.public_id}>
                                    {img.public_id}
                                  </span>
                                  {img.format && (
                                    <span className="uppercase bg-theme-bg px-1.5 py-0.2 rounded border border-[#2D3238] text-[10px]">
                                      {img.format}
                                    </span>
                                  )}
                                  {img.width && img.height && (
                                    <span className="text-theme-muted text-[11px]">{img.width} × {img.height}</span>
                                  )}
                                  {img.created_at && (
                                    <span className="text-theme-muted text-[11px]">{new Date(img.created_at).toLocaleDateString('pt-BR')}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* AÇÕES */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(img.url);
                                  showToast('URL copiada para a área de transferência!', 'success');
                                }}
                                className="px-3.5 py-2 bg-theme-bg border border-[#2D3238] rounded-xl text-xs font-semibold text-theme-title flex items-center gap-1.5 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                                title="Copiar URL"
                              >
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">Copiar URL</span>
                              </button>

                              <button
                                onClick={() => setMediaDeleteConfirmId(img.public_id)}
                                className="p-2 bg-theme-bg border border-[#2D3238] rounded-xl text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 transition-colors"
                                title="Excluir imagem"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </main>

          {/* OFFCANVAS FORM (Adicionar / Editar Produto) */}
          {isFormOpen && (
             <div className="absolute inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all">
                {/* O background clique para fechar */}
                <div className="absolute inset-0 cursor-pointer" onClick={() => setIsFormOpen(false)} />
                
                <div className="relative w-full max-w-lg h-full bg-theme-bg border-l border-[#2D3238] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="h-20 flex items-center justify-between px-8 border-b border-[#2D3238] shrink-0 bg-theme-card">
                    <h3 className="text-lg font-bold text-theme-title">
                      {editingProduto ? 'Editar Peça' : 'Novo Produto'}
                    </h3>
                    <button
                      onClick={() => setIsFormOpen(false)}
                      className="p-2 rounded-xl text-theme-body hover:text-white hover:bg-[#25292E] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" data-lenis-prevent>
                    {formError && (
                      <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-sm text-rose-300">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <form id="product-form" onSubmit={handleSaveProduct} className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#D1D5DB]">
                          Título do Produto <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formFields.titulo}
                          onChange={(e) => setFormFields({ ...formFields, titulo: e.target.value })}
                          placeholder="Ex: Haste Subsoladora Reforçada"
                          className="w-full px-4 py-3 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#D1D5DB]">
                          Código de Referência <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formFields.codigo_referencia}
                          onChange={(e) => setFormFields({ ...formFields, codigo_referencia: e.target.value.toUpperCase() })}
                          placeholder="REF-XXXX"
                          className="w-full px-4 py-3 rounded-xl bg-theme-card border border-[#2D3238] text-sm font-mono text-theme-title focus:outline-none focus:border-theme-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#D1D5DB]">
                          Categoria <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formFields.categoria}
                          onChange={(e) => setFormFields({ ...formFields, categoria: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors appearance-none"
                        >
                          {categorias.length === 0 ? (
                            <option value="">Nenhuma categoria cadastrada</option>
                          ) : (
                            categorias.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#D1D5DB]">
                          Descrição Técnica
                        </label>
                        <textarea
                          rows={4}
                          value={formFields.descricao}
                          onChange={(e) => setFormFields({ ...formFields, descricao: e.target.value })}
                          placeholder="Especificações do material, resistência, aplicação..."
                          className="w-full px-4 py-3 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#D1D5DB]">
                          Especificações Metalúrgicas
                        </label>
                        <textarea
                          rows={4}
                          value={formFields.especificacoes_metalurgicas}
                          onChange={(e) => setFormFields({ ...formFields, especificacoes_metalurgicas: e.target.value })}
                          placeholder="Dureza (HRC), liga metálica (ex: Aço SAE 1045, Boro 28MnB5), tratamento térmico, tolerância..."
                          className="w-full px-4 py-3 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#D1D5DB]">
                          Imagem do Produto
                        </label>
                        
                        {/* URL Field */}
                        <input
                          type="url"
                          value={formFields.imagem_url}
                          onChange={(e) => setFormFields({ ...formFields, imagem_url: e.target.value })}
                          placeholder="Link da imagem (ou faça upload abaixo)"
                          className="w-full px-4 py-3 rounded-xl bg-theme-card border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary transition-colors mb-3"
                        />

                        {/* File Upload / Media Library Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              className="hidden" 
                              id="cloudinary-upload"
                              disabled={isUploading}
                            />
                            <label 
                              htmlFor="cloudinary-upload"
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#373E47] bg-[#1A1D20] text-[#9BA3AF] hover:text-theme-title hover:border-theme-primary transition-colors cursor-pointer text-xs font-semibold ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>{isUploading ? 'Enviando...' : 'Upload Novo'}</span>
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              openMediaPicker((selectedUrl) => {
                                setFormFields(prev => ({ ...prev, imagem_url: selectedUrl }));
                                showToast('Imagem vinculada ao produto!', 'success');
                              }, 'Escolher Imagem para o Produto');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-[#373E47] bg-[#1A1D20] text-[#9BA3AF] hover:text-theme-title hover:border-theme-primary transition-colors cursor-pointer text-xs font-semibold"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Da Biblioteca</span>
                          </button>
                        </div>
                        
                        {/* IMAGE PREVIEW */}
                        {formFields.imagem_url && (
                          <div className="mt-4 relative rounded-2xl overflow-hidden border border-[#2D3238] bg-theme-card aspect-[4/3] flex items-center justify-center">
                            <img 
                              src={formFields.imagem_url} 
                              alt="Preview" 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80';
                                e.currentTarget.className = "w-full h-full object-cover opacity-80";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="p-6 border-t border-[#2D3238] bg-theme-card flex justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-6 py-3 rounded-xl text-sm font-bold text-[#D1D5DB] bg-[#25292E] hover:bg-[#373E47] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      form="product-form"
                      type="submit"
                      disabled={formSubmitting}
                      className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-theme-primary hover:bg-[#9E1A1A] disabled:opacity-50 transition-colors shadow-md shadow-[#B82020]/20"
                    >
                      {formSubmitting ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                  </div>
                </div>
             </div>
          )}

          {/* TOAST NOTIFICATIONS */}
          {toast && (
            <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                toast.type === 'success' 
                  ? 'bg-emerald-950/95 border-emerald-800/60 text-emerald-300 shadow-emerald-950/40' 
                  : 'bg-rose-950/95 border-rose-800/60 text-rose-300 shadow-rose-950/40'
              }`}>
                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                <span className="text-sm font-bold">{toast.message}</span>
              </div>
            </div>
          )}

          {/* MEDIA DELETE CONFIRMATION MODAL */}
          {mediaDeleteConfirmId && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-theme-bg border border-[#2D3238] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-theme-title mb-2">Excluir Imagem Permanentemente</h3>
                <p className="text-theme-body mb-6">
                  Tem certeza que deseja excluir esta imagem da nuvem (Cloudinary)? Essa ação não pode ser desfeita e pode quebrar os locais do site que a utilizam.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setMediaDeleteConfirmId(null)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-theme-card text-theme-body hover:text-white transition-colors border border-[#2D3238]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteMedia}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/50"
                  >
                    Sim, Excluir Imagem
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEDIA PICKER MODAL */}
          {mediaPickerOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[75] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-theme-bg border border-[#2D3238] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3238] bg-theme-card shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-theme-title">{mediaPickerTitle}</h3>
                      <p className="text-xs text-theme-muted">Clique sobre a imagem desejada para selecioná-la</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchMedia}
                      disabled={loadingMedia}
                      className="p-2 rounded-xl bg-theme-bg text-theme-body hover:text-white border border-[#2D3238] transition-colors"
                      title="Atualizar Biblioteca"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingMedia ? 'animate-spin text-theme-primary' : ''}`} />
                    </button>
                    <button
                      onClick={() => setMediaPickerOpen(false)}
                      className="p-2 rounded-xl bg-theme-bg text-theme-body hover:text-white border border-[#2D3238] transition-colors"
                      title="Fechar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" data-lenis-prevent>
                  {loadingMedia && mediaImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-theme-muted">
                      <RefreshCw className="w-8 h-8 animate-spin text-theme-primary mb-3" />
                      <p className="text-sm">Carregando imagens da nuvem...</p>
                    </div>
                  ) : mediaImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-theme-muted bg-theme-card border border-[#2D3238] rounded-2xl">
                      <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
                      <p className="font-semibold text-theme-title">Nenhuma imagem encontrada</p>
                      <p className="text-xs text-theme-muted mt-1">Faça upload de uma nova imagem primeiro.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {mediaImages.map((img) => {
                        const displayName = img.productName || getFormattedOrphanName(img);
                        return (
                          <div
                            key={img.public_id}
                            onClick={() => {
                              if (mediaPickerOnSelect) {
                                mediaPickerOnSelect(img.url);
                              }
                              setMediaPickerOpen(false);
                            }}
                            className="bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 rounded-2xl p-4 aspect-square flex items-center justify-center overflow-hidden group relative hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500 cursor-pointer transition-all shadow-sm"
                            title={`Clique para selecionar: ${displayName}`}
                          >
                            <img
                              src={img.url}
                              alt={displayName}
                              className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />

                            {/* Badge / Overlay de Seleção */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                              <span className="px-2.5 py-1 bg-theme-primary text-white text-xs font-bold rounded-lg shadow-md shadow-[#B82020]/40">
                                Selecionar
                              </span>
                              <span className="text-[10px] text-white/90 font-medium mt-1.5 truncate max-w-full px-1">
                                {displayName}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-[#2D3238] bg-theme-card flex items-center justify-between text-xs text-theme-muted shrink-0">
                  <span>{mediaImages.length} {mediaImages.length === 1 ? 'imagem encontrada' : 'imagens encontradas'}</span>
                  <button
                    onClick={() => setMediaPickerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-theme-bg border border-[#2D3238] text-theme-body hover:text-white transition-colors font-medium text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE CRIAÇÃO / EDIÇÃO DE USUÁRIO */}
          {isUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-md bg-theme-card border border-[#2D3238] rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-[#25292E] pb-4">
                  <h3 className="text-lg font-bold text-theme-title flex items-center gap-2">
                    <Users className="w-5 h-5 text-theme-primary" />
                    <span>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</span>
                  </h3>
                  <button
                    onClick={() => setIsUserModalOpen(false)}
                    className="p-1 rounded-lg text-theme-body hover:text-theme-title hover:bg-[#25292E] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {userFormError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{userFormError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#D1D5DB] uppercase tracking-wider">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={userFormName}
                      onChange={(e) => setUserFormName(e.target.value)}
                      placeholder="Nome do usuário"
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-bg border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#D1D5DB] uppercase tracking-wider">
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      placeholder="usuario@metalurgicafardin.com.br"
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-bg border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#D1D5DB] uppercase tracking-wider">
                        Senha
                      </label>
                      {editingUser && (
                        <span className="text-[11px] text-theme-body">(Opcional ao editar)</span>
                      )}
                    </div>
                    <input
                      type="password"
                      required={!editingUser}
                      value={userFormPassword}
                      onChange={(e) => setUserFormPassword(e.target.value)}
                      placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Mínimo 6 caracteres'}
                      className="w-full px-4 py-2.5 rounded-xl bg-theme-bg border border-[#2D3238] text-sm text-theme-title focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
                    />
                    {editingUser && (
                      <p className="text-[11px] text-theme-body">
                        Preencha este campo apenas se desejar redefinir a senha deste usuário.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#25292E]">
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(false)}
                      disabled={userFormSubmitting}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-theme-body hover:text-theme-title hover:bg-[#25292E] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={userFormSubmitting}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-theme-primary text-white hover:bg-[#9E1A1A] shadow-md shadow-[#B82020]/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {userFormSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <span>{editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
