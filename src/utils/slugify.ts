/**
 * Converte qualquer texto em uma URL amigável (slug).
 * Exemplo: "FACA AÇO 2098" -> "faca-aco-2098"
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD') // Separa caracteres de seus acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/&/g, '-e-') // Substitui & por 'e'
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais inválidos
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Substitui múltiplos hífens por um único
    .replace(/^-+|-+$/g, ''); // Remove hífens do início e do fim
}
