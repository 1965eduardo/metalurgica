export const DEFAULT_WHATSAPP_NUMBER = '5519997428810';
export const DEFAULT_WHATSAPP_MESSAGE = 'Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin.';
export const DEFAULT_WORK_DAYS = 'mon,tue,wed,thu,fri';
export const DEFAULT_START_TIME = '08:00';
export const DEFAULT_END_TIME = '18:00';
export const DEFAULT_OFFLINE_MESSAGE = 'Nosso atendimento comercial funciona de segunda a sexta-feira, das 08h às 18h. Envie sua mensagem e responderemos assim que retornarmos ao expediente!';

export interface WorkDayInfo {
  id: string;
  label: string;
  full: string;
  dayIndex: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
}

export const DAYS_OF_WEEK: WorkDayInfo[] = [
  { id: 'mon', label: 'Seg', full: 'Segunda-feira', dayIndex: 1 },
  { id: 'tue', label: 'Ter', full: 'Terça-feira', dayIndex: 2 },
  { id: 'wed', label: 'Qua', full: 'Quarta-feira', dayIndex: 3 },
  { id: 'thu', label: 'Qui', full: 'Quinta-feira', dayIndex: 4 },
  { id: 'fri', label: 'Sex', full: 'Sexta-feira', dayIndex: 5 },
  { id: 'sat', label: 'Sáb', full: 'Sábado', dayIndex: 6 },
  { id: 'sun', label: 'Dom', full: 'Domingo', dayIndex: 0 },
];

/**
 * Limpa e padroniza o número do WhatsApp contendo apenas dígitos (com DDI e DDD).
 * Ex: "(19) 99742-8810" -> "5519997428810"
 */
export function cleanWhatsAppNumber(input?: string | null): string {
  if (!input) return DEFAULT_WHATSAPP_NUMBER;
  const digits = input.replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP_NUMBER;
  
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  return digits;
}

/**
 * Formata um número numérico para exibição amigável ao usuário.
 * Ex: "5519997428810" -> "+55 (19) 99742-8810"
 */
export function formatWhatsAppForDisplay(input?: string | null): string {
  const clean = cleanWhatsAppNumber(input);
  
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    const ddi = clean.substring(0, 2);
    const ddd = clean.substring(2, 4);
    const rest = clean.substring(4);
    if (rest.length === 9) {
      return `+${ddi} (${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else if (rest.length === 8) {
      return `+${ddi} (${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }
  
  return clean.length > 0 ? `+${clean}` : '+55 (19) 99742-8810';
}

/**
 * Gera o link direto wa.me com número e mensagem pré-definida codificada.
 */
export function getWhatsAppLink({
  number,
  message,
  product
}: {
  number?: string | null;
  message?: string | null;
  product?: { name: string; ref: string } | null;
}): string {
  const cleanNumber = cleanWhatsAppNumber(number);
  
  let textToSend = message || DEFAULT_WHATSAPP_MESSAGE;
  
  if (product) {
    textToSend = `Olá! Gostaria de um orçamento para a peça: ${product.name} (REF: ${product.ref})`;
  }
  
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(textToSend)}`;
}

/**
 * Converte string ou array em lista padronizada de IDs dos dias de trabalho.
 */
export function parseWorkDays(raw?: string | string[] | null): string[] {
  if (!raw) return DEFAULT_WORK_DAYS.split(',');
  if (Array.isArray(raw)) return raw;
  
  try {
    if (raw.startsWith('[') && raw.endsWith(']')) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Continua para split normal
  }
  
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Formata os dias úteis selecionados em texto legível.
 * Ex: ["mon","tue","wed","thu","fri"] -> "Segunda a Sexta"
 */
export function formatWorkDaysSummary(days: string[]): string {
  if (!days || days.length === 0) return 'Atendimento sob consulta';
  if (days.length === 7) return 'Segunda a Domingo';
  
  const standardMonFri = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const isMonFri =
    days.length === 5 && standardMonFri.every((d) => days.includes(d));
  if (isMonFri) return 'Segunda a Sexta';

  const standardMonSat = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const isMonSat =
    days.length === 6 && standardMonSat.every((d) => days.includes(d));
  if (isMonSat) return 'Segunda a Sábado';

  // Mapear labels
  const orderedLabels = DAYS_OF_WEEK.filter((d) => days.includes(d.id)).map(
    (d) => d.label
  );
  return orderedLabels.join(', ');
}

export interface BusinessHoursStatus {
  isOnline: boolean;
  currentDayId: string;
  currentDayLabel: string;
  currentTimeStr: string;
  scheduleSummary: string;
  offlineMessage: string;
  startTime: string;
  endTime: string;
  workDays: string[];
}

/**
 * Valida se o momento atual está dentro do horário de expediente configurado.
 */
export function checkWhatsAppBusinessHours(config: {
  workDays?: string | string[] | null;
  startTime?: string | null;
  endTime?: string | null;
  offlineMessage?: string | null;
  now?: Date;
}): BusinessHoursStatus {
  const date = config.now || new Date();
  
  const workDays = parseWorkDays(config.workDays);
  const startTime = (config.startTime || DEFAULT_START_TIME).trim();
  const endTime = (config.endTime || DEFAULT_END_TIME).trim();
  const offlineMessage = config.offlineMessage || DEFAULT_OFFLINE_MESSAGE;

  // Obter dia da semana atual (0=Dom, 1=Seg, ..., 6=Sáb)
  const currentDayIndex = date.getDay();
  const currentDayObj = DAYS_OF_WEEK.find((d) => d.dayIndex === currentDayIndex) || DAYS_OF_WEEK[0];
  const currentDayId = currentDayObj.id;
  const currentDayLabel = currentDayObj.full;

  // Formatar hora atual
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const currentMinutesFromMidnight = hours * 60 + minutes;

  // Converter start e end time para minutos
  const [sHours, sMinutes] = startTime.split(':').map((v) => parseInt(v, 10) || 0);
  const [eHours, eMinutes] = endTime.split(':').map((v) => parseInt(v, 10) || 0);

  const startMinutesFromMidnight = sHours * 60 + sMinutes;
  const endMinutesFromMidnight = eHours * 60 + eMinutes;

  const isDayAllowed = workDays.includes(currentDayId);
  const isTimeAllowed =
    currentMinutesFromMidnight >= startMinutesFromMidnight &&
    currentMinutesFromMidnight < endMinutesFromMidnight;

  const isOnline = isDayAllowed && isTimeAllowed;
  const daysText = formatWorkDaysSummary(workDays);
  const scheduleSummary = `${daysText}, das ${startTime}h às ${endTime}h`;

  return {
    isOnline,
    currentDayId,
    currentDayLabel,
    currentTimeStr,
    scheduleSummary,
    offlineMessage,
    startTime,
    endTime,
    workDays,
  };
}
