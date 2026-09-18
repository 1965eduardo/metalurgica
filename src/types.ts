export interface Produto {
  id: string;
  titulo: string;
  codigo_referencia: string;
  categoria: string;
  descricao: string;
  imagem_url: string;
  especificacoes_metalurgicas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Categoria {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface EmpresaContato {
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
}

export interface EmpresaInfo {
  nome: string;
  fundacao: number;
  proposito: string;
  descricao: string;
  contato: EmpresaContato;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface DbStatus {
  connected: boolean;
  engine: string;
  mode: string;
  configured: boolean;
  databaseUrlMasked: string | null;
  error: string | null;
}
