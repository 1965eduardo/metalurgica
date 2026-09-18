import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

export interface ProdutoRow {
  id: string;
  titulo: string;
  codigo_referencia: string;
  categoria: string;
  descricao: string;
  imagem_url: string;
  especificacoes_metalurgicas?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}

// Exemplos iniciais pré-configurados do catálogo institucional
const INITIAL_PRODUTOS: Omit<ProdutoRow, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    titulo: 'Suporte Reforçado para Roçadeira Agrícola',
    codigo_referencia: 'REF-5012',
    categoria: 'Implementos Agrícolas',
    descricao: 'Fabricado em aço de alta resistência com tratamento térmico especializado. Desenvolvido para absorver impactos severos em operações de roçada pesada. Compatível com diversos modelos de tratores do mercado.',
    imagem_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço Carbono SAE 1045 forjado; Tratamento térmico de têmpera e revenimento (42-46 HRC); Pintura eletrostática a pó com alta resistência anticorrosiva.'
  },
  {
    titulo: 'Lâmina de Corte para Cortadores e Tratores de Jardim',
    codigo_referencia: 'REF-1185',
    categoria: 'Linha Jardim & Campo',
    descricao: 'Lâmina balanceada eletronicamente para corte de alta precisão. Aço temperado de longa durabilidade com proteção anticorrosiva avançada.',
    imagem_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço manganês temperado de alta tenacidade; Dureza superficial 48-52 HRC; Balanceamento dinâmico computadorizado.'
  },
  {
    titulo: 'Bico Subsolador Agrícola de Alta Penetração',
    codigo_referencia: 'REF-1114',
    categoria: 'Linha Agrícola Pesada',
    descricao: 'Projetado para romper compactações profundas do solo com menor consumo de combustível. Ponta reforçada e design hidrodinâmico para melhor fluxo de terra.',
    imagem_url: 'https://images.unsplash.com/photo-1530267981373-f09b55239e99?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço microligado ao Boro 28MnB5 forjado; Camada de revestimento duro contra abrasão em tungstênio; Resistência ao desgaste severo.'
  },
  {
    titulo: 'Disco de Grade Aradora 28" com Tratamento ao Boro',
    codigo_referencia: 'REF-3340',
    categoria: 'Linha Agrícola Pesada',
    descricao: 'Disco de alta tenacidade em liga de aço-boro forjado, desenvolvido para solos abrasivos e preparo pesado de plantio direto.',
    imagem_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço Boro 28MnB5 com têmpera integral (48-52 HRC); Borda afiada de alto rendimento; Conformação a quente.'
  },
  {
    titulo: 'Pino de Engate Rápido Cat 2 Forjado',
    codigo_referencia: 'REF-8092',
    categoria: 'Implementos Agrícolas',
    descricao: 'Pino forjado com acabamento zincado e trava de segurança integrada. Projetado para suportar tração extrema em acoplamentos agrícolas.',
    imagem_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço SAE 4140 beneficiado; Carga de ruptura superior a 15 toneladas; Zincagem eletrolítica trivalente amarela.'
  },
  {
    titulo: 'Navalha de Colheitadeira Temperada de Alto Rendimento',
    codigo_referencia: 'REF-2204',
    categoria: 'Implementos Agrícolas',
    descricao: 'Dentes serrilhados por indução térmica com autoafiação mecânica durante o trabalho de colheita em grãos e forragens.',
    imagem_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
    especificacoes_metalurgicas: 'Aço mola alto carbono SAE 1070; Tratamento térmico de indução nos dentes (55-60 HRC); Corpo resiliente antichoque.'
  }
];

export interface SiteContentRow {
  id: string;
  content: string;
  updated_at: string;
}

// In-Memory Storage como espelho/fallback se DATABASE_URL ainda não estiver preenchido
class MemoryStore {
  adminUsers: AdminUserRow[] = [];
  users: UserRow[] = [];
  produtos: ProdutoRow[] = [];
  siteContent: Map<string, string> = new Map();

  constructor() {
    this.seed();
  }

  async seed() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('fardin1983', salt);
    this.adminUsers = [
      {
        id: 'c8f49b10-6c92-4f05-89cb-72b15e44a001',
        email: 'admin@metalurgicafardin.com.br',
        password_hash: hash,
        created_at: new Date().toISOString()
      }
    ];

    this.users = [
      {
        id: 'c8f49b10-6c92-4f05-89cb-72b15e44a001',
        name: 'Administrador Fardin',
        email: 'admin@metalurgicafardin.com.br',
        password: hash,
        created_at: new Date().toISOString()
      }
    ];

    this.produtos = INITIAL_PRODUTOS.map((item, idx) => ({
      id: `a1b2c3d4-0000-4000-8000-00000000000${idx + 1}`,
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    this.siteContent.set('about_image_url', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80');
    this.siteContent.set('hero_settings', JSON.stringify({
      hero_bg_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=2000&q=85',
      hero_overlay_opacity: 85,
      banner_height: 80
    }));
    this.siteContent.set('banner_height', '80');
    this.siteContent.set('parallax_image_url', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=85');
    this.siteContent.set('parallax_overlay', '70');
    this.siteContent.set('parallax_height', '500');
    this.siteContent.set('map_height', '400');
    this.siteContent.set('parallax_title', 'Engenharia e Robustez para o Agronegócio');
    this.siteContent.set('parallax_subtitle', 'Desenvolvemos componentes agrícolas de altíssima precisão e durabilidade para maximizar a produtividade no campo.');
    this.siteContent.set('whatsapp_number', '5519997428810');
    this.siteContent.set('whatsapp_default_message', 'Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin.');
    this.siteContent.set('whatsapp_work_days', 'mon,tue,wed,thu,fri');
    this.siteContent.set('whatsapp_start_time', '08:00');
    this.siteContent.set('whatsapp_end_time', '18:00');
    this.siteContent.set('whatsapp_offline_message', 'Nosso atendimento comercial funciona de segunda a sexta-feira, das 08h às 18h. Envie sua mensagem e responderemos assim que retornarmos ao expediente!');
    this.siteContent.set('enable_b2b_quotes', 'true');
  }
}

const memoryStore = new MemoryStore();

let pool: pg.Pool | null = null;
export async function query(sql: string, params?: any[]) {
  if (!pool) throw new Error('Database not connected');
  return pool.query(sql, params);
}
let isConnectedToPostgres = false;
let lastDbError: string | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function isDbConnected(): boolean {
  return isConnectedToPostgres;
}

export function getDbStatus() {
  const dbUrl = getDatabaseUrl();
  return {
    connected: isConnectedToPostgres,
    engine: 'PostgreSQL (Neon Serverless)',
    mode: isConnectedToPostgres ? 'neon_live' : (dbUrl ? 'connecting_or_error' : 'local_replica_ready_for_neon'),
    configured: Boolean(dbUrl && !dbUrl.includes('user:password@host')),
    databaseUrlMasked: dbUrl ? dbUrl.replace(/:([^:@]{3,})@/, ':***@') : null,
    error: lastDbError
  };
}

export async function initDatabase(): Promise<boolean> {
  const connectionString = getDatabaseUrl();

  if (!connectionString || connectionString.includes('user:password@host')) {
    console.log('[DB] DATABASE_URL não configurada ou com placeholder. Utilizando réplica em memória local compatível com PostgreSQL Neon.');
    isConnectedToPostgres = false;
    return false;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 8000,
      max: 10
    });

    // Testar conexão
    const client = await pool.connect();
    console.log('[DB] Conectado com sucesso ao PostgreSQL (Neon Serverless)!');
    isConnectedToPostgres = true;
    lastDbError = null;

    // Criar tabelas se não existirem
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS produtos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo VARCHAR(255) NOT NULL,
        codigo_referencia VARCHAR(100) NOT NULL UNIQUE,
        categoria VARCHAR(150) NOT NULL,
        descricao TEXT,
        imagem_url TEXT,
        especificacoes_metalurgicas TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE produtos ADD COLUMN IF NOT EXISTS especificacoes_metalurgicas TEXT;

      CREATE TABLE IF NOT EXISTS site_content (
        id VARCHAR(255) PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_produtos_codigo_ref ON produtos (codigo_referencia);
      CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);
      CREATE INDEX IF NOT EXISTS idx_produtos_titulo ON produtos (titulo);
    `);

    // Seed categories if empty
    const catCheck = await client.query('SELECT id FROM categories LIMIT 1');
    if (catCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO categories (name, slug) VALUES 
        ('Implementos Agrícolas', 'implementos-agricolas'),
        ('Linha Agrícola Pesada', 'linha-agricola-pesada'),
        ('Linha Jardim & Campo', 'linha-jardim-campo'),
        ('Peças de Reposição', 'pecas-reposicao')
      `);
      console.log('[DB] Categorias padrão inicializadas no Neon.');
    }

    // Verificar se tabela users possui usuários, senão insere o administrador padrão
    const userCheck = await client.query('SELECT id FROM users LIMIT 1');
    if (userCheck.rows.length === 0) {
      const defaultHash = await bcrypt.hash('fardin1983', 10);
      await client.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
        ['Administrador Fardin', 'admin@metalurgicafardin.com.br', defaultHash]
      );
      console.log('[DB] Administrador padrão inicializado na tabela users no Neon.');
    }

    // Verificar se tabela admin_users possui o administrador padrão
    const adminCheck = await client.query('SELECT id FROM admin_users LIMIT 1');
    if (adminCheck.rows.length === 0) {
      const defaultHash = await bcrypt.hash('fardin1983', 10);
      await client.query(
        'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)',
        ['admin@metalurgicafardin.com.br', defaultHash]
      );
      console.log('[DB] Administrador padrão inicializado no Neon.');
    }

    // 3. SCRIPT DE AJUSTE DOS USUÁRIOS EXISTENTES:
    // Converte automaticamente senhas em texto puro para hash bcrypt para não bloquear contas já existentes
    try {
      const usersToMigrate = await client.query('SELECT id, email, password FROM users');
      for (const u of usersToMigrate.rows) {
        const pass = u.password || '';
        const isBcrypt = pass.startsWith('$2a$') || pass.startsWith('$2b$') || pass.startsWith('$2y$') || pass.startsWith('$2$');
        if (!isBcrypt && pass.length > 0) {
          const hashed = await bcrypt.hash(pass, 10);
          await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, u.id]);
          console.log(`[DB Migration] Senha em texto puro do usuário ${u.email} convertida para hash bcrypt.`);
        }
      }
    } catch (migErr) {
      console.warn('[DB Migration Warning]', migErr);
    }

    // Inicializar site_content padrão se estiver vazio
    await client.query(`
      INSERT INTO site_content (id, content) VALUES
      ('site_logo_url', '/Fardin-logo.png'),
      ('site_theme', '{"primary":"#B82020","text_main":"#F8F9FA","text_muted":"#9BA3AF","bg_main":"#1A1D20","bg_card":"#151719","bg_nav":"rgba(21, 23, 25, 0.95)"}'),
      ('hero_title', 'Soluções Precisas em Peças para o Agronegócio'),
      ('about_purpose', 'Propósito: Inovar e crescer com excelência!'),
      ('footer_purpose', 'Propósito: "Inovar e crescer com excelência!"'),
      ('whatsapp_number', '5519997428810'),
      ('whatsapp_default_message', 'Olá! Gostaria de solicitar uma cotação para produtos da Metalúrgica Fardin.'),
      ('whatsapp_work_days', 'mon,tue,wed,thu,fri'),
      ('whatsapp_start_time', '08:00'),
      ('whatsapp_end_time', '18:00'),
      ('whatsapp_offline_message', 'Nosso atendimento comercial funciona de segunda a sexta-feira, das 08h às 18h. Envie sua mensagem e responderemos assim que retornarmos ao expediente!'),
      ('enable_b2b_quotes', 'true'),
      ('banner_height', '80'),
      ('map_height', '400')
      ON CONFLICT (id) DO NOTHING
    `);

    client.release();
    return true;
  } catch (error: any) {
    console.error('[DB] Erro ao conectar ao PostgreSQL Neon:', error.message || error);
    lastDbError = error.message || String(error);
    isConnectedToPostgres = false;
    return false;
  }
}

// ----------------------------------------------------------------------------
// OPERAÇÕES DO CATÁLOGO DE PRODUTOS (SELECT, INSERT, UPDATE, DELETE com ILIKE)
// ----------------------------------------------------------------------------

export async function getProdutos(search?: string, categoria?: string): Promise<ProdutoRow[]> {
  if (isConnectedToPostgres && pool) {
    try {
      let query = 'SELECT * FROM produtos WHERE 1=1';
      const params: any[] = [];

      if (categoria && categoria !== 'Todas') {
        params.push(categoria);
        query += ` AND categoria = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        const pIdx = params.length;
        // Consulta eficiente com ILIKE conforme especificado nos requisitos
        query += ` AND (titulo ILIKE $${pIdx} OR codigo_referencia ILIKE $${pIdx} OR descricao ILIKE $${pIdx})`;
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (err: any) {
      console.error('[DB Query Error]', err.message);
      // Fallback para memória em caso de falha de conexão transitória
    }
  }

  // Fallback em memória
  let items = [...memoryStore.produtos];

  if (categoria && categoria !== 'Todas') {
    items = items.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
  }

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    items = items.filter(
      p => p.titulo.toLowerCase().includes(s) ||
           p.codigo_referencia.toLowerCase().includes(s) ||
           p.descricao.toLowerCase().includes(s)
    );
  }

  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getProdutoById(id: string): Promise<ProdutoRow | null> {
  if (isConnectedToPostgres && pool) {
    try {
      const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('[DB Query Error]', err);
    }
  }
  return memoryStore.produtos.find(p => p.id === id) || null;
}

export async function createProduto(data: {
  titulo: string;
  codigo_referencia: string;
  categoria: string;
  descricao: string;
  imagem_url: string;
  especificacoes_metalurgicas?: string;
}): Promise<ProdutoRow> {
  if (isConnectedToPostgres && pool) {
    const query = `
      INSERT INTO produtos (titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      data.titulo,
      data.codigo_referencia.trim().toUpperCase(),
      data.categoria,
      data.descricao,
      data.imagem_url,
      data.especificacoes_metalurgicas || ''
    ]);
    return result.rows[0];
  }

  // Fallback em memória
  const newProd: ProdutoRow = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    titulo: data.titulo,
    codigo_referencia: data.codigo_referencia.trim().toUpperCase(),
    categoria: data.categoria,
    descricao: data.descricao,
    imagem_url: data.imagem_url,
    especificacoes_metalurgicas: data.especificacoes_metalurgicas || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  memoryStore.produtos.unshift(newProd);
  return newProd;
}

export async function updateProduto(id: string, data: {
  titulo: string;
  codigo_referencia: string;
  categoria: string;
  descricao: string;
  imagem_url: string;
  especificacoes_metalurgicas?: string;
}): Promise<ProdutoRow | null> {
  if (isConnectedToPostgres && pool) {
    const query = `
      UPDATE produtos
      SET titulo = $1, codigo_referencia = $2, categoria = $3, descricao = $4, imagem_url = $5, especificacoes_metalurgicas = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;
    const result = await pool.query(query, [
      data.titulo,
      data.codigo_referencia.trim().toUpperCase(),
      data.categoria,
      data.descricao,
      data.imagem_url,
      data.especificacoes_metalurgicas !== undefined ? data.especificacoes_metalurgicas : '',
      id
    ]);
    return result.rows[0] || null;
  }

  const idx = memoryStore.produtos.findIndex(p => p.id === id);
  if (idx === -1) return null;

  memoryStore.produtos[idx] = {
    ...memoryStore.produtos[idx],
    titulo: data.titulo,
    codigo_referencia: data.codigo_referencia.trim().toUpperCase(),
    categoria: data.categoria,
    descricao: data.descricao,
    imagem_url: data.imagem_url,
    especificacoes_metalurgicas: data.especificacoes_metalurgicas !== undefined ? data.especificacoes_metalurgicas : memoryStore.produtos[idx].especificacoes_metalurgicas,
    updated_at: new Date().toISOString()
  };
  return memoryStore.produtos[idx];
}

export async function deleteProduto(id: string): Promise<boolean> {
  if (isConnectedToPostgres && pool) {
    const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  const prevLen = memoryStore.produtos.length;
  memoryStore.produtos = memoryStore.produtos.filter(p => p.id !== id);
  return memoryStore.produtos.length < prevLen;
}

export async function getCategorias() {
  if (isConnectedToPostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM categories ORDER BY name ASC');
      return res.rows;
    } catch (e) {
      console.error(e);
    }
  }
  return [
    { id: '1', name: 'Implementos Agrícolas', slug: 'implementos-agricolas' },
    { id: '2', name: 'Linha Agrícola Pesada', slug: 'linha-agricola-pesada' },
    { id: '3', name: 'Linha Jardim & Campo', slug: 'linha-jardim-campo' },
    { id: '4', name: 'Peças de Reposição', slug: 'pecas-reposicao' }
  ];
}

export async function createCategoria(name: string, slug: string) {
  if (isConnectedToPostgres && pool) {
    const res = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );
    return res.rows[0];
  }
  return null;
}

export async function updateCategoria(id: string, name: string, slug: string) {
  if (isConnectedToPostgres && pool) {
    const res = await pool.query(
      'UPDATE categories SET name = $1, slug = $2 WHERE id = $3 RETURNING *',
      [name, slug, id]
    );
    return res.rows[0];
  }
  return null;
}

export async function deleteCategoria(id: string) {
  if (isConnectedToPostgres && pool) {
    const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }
  return false;
}

// ----------------------------------------------------------------------------
// CMS INLINE (SITE CONTENT)
// ----------------------------------------------------------------------------

export async function getAllSiteContent(): Promise<Record<string, string>> {
  if (isConnectedToPostgres && pool) {
    try {
      const res = await pool.query('SELECT id, content FROM site_content');
      const contentMap: Record<string, string> = {};
      for (const row of res.rows) {
        contentMap[row.id] = row.content;
      }
      return contentMap;
    } catch (e) {
      console.error('[DB Content Error]', e);
    }
  }
  const contentMap: Record<string, string> = {};
  memoryStore.siteContent.forEach((val, key) => {
    contentMap[key] = val;
  });
  return contentMap;
}

export async function setSiteContent(id: string, content: string): Promise<boolean> {
  if (isConnectedToPostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO site_content (id, content) 
         VALUES ($1, $2) 
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP`,
        [id, content]
      );
      return true;
    } catch (e) {
      console.error('[DB Content Update Error]', e);
      return false;
    }
  }
  memoryStore.siteContent.set(id, content);
  return true;
}
// ----------------------------------------------------------------------------
// AUTENTICAÇÃO E ADMIN USERS (POSTGRESQL + BCRYPT)
// ----------------------------------------------------------------------------

export async function findAdminByEmail(email: string): Promise<AdminUserRow | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (isConnectedToPostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM admin_users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      return res.rows[0] || null;
    } catch (e) {
      console.error('[DB Auth Error]', e);
    }
  }
  return memoryStore.adminUsers.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (isConnectedToPostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      if (res.rows[0]) return res.rows[0];

      // Fallback para admin_users caso a tabela users tenha sido recém-criada
      const adminRes = await pool.query('SELECT id, email, password_hash as password, created_at FROM admin_users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      if (adminRes.rows[0]) {
        return {
          id: adminRes.rows[0].id,
          name: 'Administrador Fardin',
          email: adminRes.rows[0].email,
          password: adminRes.rows[0].password,
          created_at: adminRes.rows[0].created_at
        };
      }
    } catch (e) {
      console.error('[DB findUserByEmail Error]', e);
    }
  }
  return memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
}

export async function getUsers(): Promise<Omit<UserRow, 'password'>[]> {
  if (isConnectedToPostgres && pool) {
    try {
      const res = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at ASC');
      return res.rows;
    } catch (e: any) {
      console.error('[DB getUsers Error]', e.message);
    }
  }
  return memoryStore.users.map(({ password, ...rest }) => rest);
}

export async function createUser(data: { name: string; email: string; passwordPlain: string }): Promise<Omit<UserRow, 'password'>> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
  if (!cleanName || !cleanEmail || !data.passwordPlain) {
    throw new Error('Nome, e-mail e senha são campos obrigatórios.');
  }

  const passwordHash = await bcrypt.hash(data.passwordPlain, 10);

  if (isConnectedToPostgres && pool) {
    const check = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (check.rows.length > 0) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const res = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [cleanName, cleanEmail, passwordHash]
    );
    return res.rows[0];
  }

  if (memoryStore.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('Já existe um usuário cadastrado com este e-mail.');
  }

  const newUser: UserRow = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    password: passwordHash,
    created_at: new Date().toISOString()
  };
  memoryStore.users.push(newUser);
  const { password, ...safeUser } = newUser;
  return safeUser;
}

export async function updateUser(id: string, data: { name?: string; email?: string; passwordPlain?: string }): Promise<Omit<UserRow, 'password'>> {
  if (isConnectedToPostgres && pool) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined && data.name.trim()) {
      values.push(data.name.trim());
      fields.push(`name = $${values.length}`);
    }
    if (data.email !== undefined && data.email.trim()) {
      const cleanEmail = data.email.trim().toLowerCase();
      const check = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2', [cleanEmail, id]);
      if (check.rows.length > 0) {
        throw new Error('E-mail já utilizado por outro usuário.');
      }
      values.push(cleanEmail);
      fields.push(`email = $${values.length}`);
    }
    if (data.passwordPlain !== undefined && data.passwordPlain.trim()) {
      const hash = await bcrypt.hash(data.passwordPlain.trim(), 10);
      values.push(hash);
      fields.push(`password = $${values.length}`);
    }

    if (fields.length === 0) {
      const current = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
      if (current.rows.length === 0) throw new Error('Usuário não encontrado.');
      return current.rows[0];
    }

    values.push(id);
    const res = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, name, email, created_at`,
      values
    );
    if (res.rows.length === 0) throw new Error('Usuário não encontrado.');
    return res.rows[0];
  }

  const user = memoryStore.users.find(u => u.id === id);
  if (!user) throw new Error('Usuário não encontrado.');

  if (data.name !== undefined && data.name.trim()) user.name = data.name.trim();
  if (data.email !== undefined && data.email.trim()) {
    const cleanEmail = data.email.trim().toLowerCase();
    if (memoryStore.users.some(u => u.id !== id && u.email.toLowerCase() === cleanEmail)) {
      throw new Error('E-mail já utilizado por outro usuário.');
    }
    user.email = cleanEmail;
  }
  if (data.passwordPlain !== undefined && data.passwordPlain.trim()) {
    user.password = await bcrypt.hash(data.passwordPlain.trim(), 10);
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (isConnectedToPostgres && pool) {
    const countRes = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countRes.rows[0].total, 10);
    if (total <= 1) {
      throw new Error('Não é possível excluir o único usuário do sistema. Deve haver ao menos um administrador ativo.');
    }

    const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (res.rowCount === 0) throw new Error('Usuário não encontrado.');
    return true;
  }

  if (memoryStore.users.length <= 1) {
    throw new Error('Não é possível excluir o único usuário do sistema. Deve haver ao menos um administrador ativo.');
  }
  const idx = memoryStore.users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado.');
  memoryStore.users.splice(idx, 1);
  return true;
}

// ----------------------------------------------------------------------------
// RESTAURAÇÃO DE BACKUP (CATEGORIAS E PRODUTOS COM UPSERT / ON CONFLICT)
// ----------------------------------------------------------------------------

function isValidUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export async function upsertCategoryFromBackup(cat: any): Promise<any> {
  const name = String(cat.name || cat.nome || cat.title || '').trim();
  if (!name) return null;
  const slug = String(cat.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  const id = isValidUuid(cat.id) ? cat.id : null;

  if (isConnectedToPostgres && pool) {
    try {
      if (id) {
        const res = await pool.query(
          `INSERT INTO categories (id, name, slug) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug 
           RETURNING *`,
          [id, name, slug]
        );
        return res.rows[0];
      } else {
        const res = await pool.query(
          `INSERT INTO categories (name, slug) 
           VALUES ($1, $2) 
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name 
           RETURNING *`,
          [name, slug]
        );
        return res.rows[0];
      }
    } catch (e: any) {
      console.warn('[DB Category Upsert Warning]', e.message);
    }
  }

  return { id: cat.id || `cat-${Date.now()}`, name, slug };
}

export async function upsertProductFromBackup(prod: any): Promise<any> {
  const titulo = String(prod.titulo || prod.title || prod.name || '').trim();
  const codigo_referencia = String(prod.codigo_referencia || prod.code || prod.reference_code || `REF-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
  const categoria = String(prod.categoria || prod.category || 'Geral').trim();
  const descricao = String(prod.descricao || prod.description || '').trim();
  const imagem_url = String(prod.imagem_url || prod.image_url || prod.url || prod.imagem || '').trim();
  const especificacoes_metalurgicas = String(prod.especificacoes_metalurgicas || prod.especificacoes || '').trim();
  const id = isValidUuid(prod.id) ? prod.id : null;

  if (isConnectedToPostgres && pool) {
    try {
      if (id) {
        const res = await pool.query(
          `INSERT INTO produtos (id, titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             titulo = EXCLUDED.titulo,
             codigo_referencia = EXCLUDED.codigo_referencia,
             categoria = EXCLUDED.categoria,
             descricao = EXCLUDED.descricao,
             imagem_url = EXCLUDED.imagem_url,
             especificacoes_metalurgicas = EXCLUDED.especificacoes_metalurgicas,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [id, titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas]
        );
        return res.rows[0];
      } else {
        const res = await pool.query(
          `INSERT INTO produtos (titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           ON CONFLICT (codigo_referencia) DO UPDATE SET
             titulo = EXCLUDED.titulo,
             categoria = EXCLUDED.categoria,
             descricao = EXCLUDED.descricao,
             imagem_url = EXCLUDED.imagem_url,
             especificacoes_metalurgicas = EXCLUDED.especificacoes_metalurgicas,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas]
        );
        return res.rows[0];
      }
    } catch (e: any) {
      console.warn('[DB Product Upsert Warning]', e.message);
    }
  }

  // Memory fallback
  const existingIdx = memoryStore.produtos.findIndex(
    p => (id && p.id === id) || p.codigo_referencia.toUpperCase() === codigo_referencia.toUpperCase()
  );
  const updatedItem: ProdutoRow = {
    id: (existingIdx !== -1 ? memoryStore.produtos[existingIdx].id : id) || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    titulo,
    codigo_referencia,
    categoria,
    descricao,
    imagem_url,
    especificacoes_metalurgicas,
    created_at: existingIdx !== -1 ? memoryStore.produtos[existingIdx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    memoryStore.produtos[existingIdx] = updatedItem;
  } else {
    memoryStore.produtos.unshift(updatedItem);
  }
  return updatedItem;
}

export async function getAllUsersForBackup(): Promise<UserRow[]> {
  if (isConnectedToPostgres && pool) {
    try {
      const res = await pool.query('SELECT id, name, email, password, created_at FROM users ORDER BY created_at ASC');
      return res.rows;
    } catch (e: any) {
      console.error('[DB getAllUsersForBackup Error]', e.message);
    }
  }
  return memoryStore.users;
}

export async function upsertUserFromBackup(user: any): Promise<void> {
  const cleanEmail = String(user.email || '').trim().toLowerCase();
  const cleanName = String(user.name || 'Usuário').trim();
  if (!cleanEmail) return;

  const id = isValidUuid(user.id) ? user.id : undefined;
  const createdAt = user.created_at || new Date().toISOString();
  let password = user.password || user.password_hash || '';

  if (!password) {
    password = await bcrypt.hash('fardin1983', 10);
  }

  if (isConnectedToPostgres && pool) {
    try {
      if (id) {
        await pool.query(
          `INSERT INTO users (id, name, email, password, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE 
           SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password`,
          [id, cleanName, cleanEmail, password, createdAt]
        );
      } else {
        const check = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        if (check.rows.length > 0) {
          await pool.query(
            'UPDATE users SET name = $1, password = $2 WHERE id = $3',
            [cleanName, password, check.rows[0].id]
          );
        } else {
          await pool.query(
            'INSERT INTO users (name, email, password, created_at) VALUES ($1, $2, $3, $4)',
            [cleanName, cleanEmail, password, createdAt]
          );
        }
      }
    } catch (e) {
      console.error('[DB upsertUserFromBackup Error]', e);
    }
  }

  // Atualizar memoryStore
  const existingIdx = memoryStore.users.findIndex(
    u => (id && u.id === id) || u.email.toLowerCase() === cleanEmail
  );
  const userObj: UserRow = {
    id: id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    password,
    created_at: createdAt
  };

  if (existingIdx >= 0) {
    memoryStore.users[existingIdx] = userObj;
  } else {
    memoryStore.users.push(userObj);
  }
}

export async function restoreBackupData(banco: any) {
  const listCategorias = banco.categorias || banco.categories || [];
  const listProdutos = banco.produtos || banco.products || [];
  const listUsuarios = banco.usuarios || banco.users || [];
  const conteudoSite = banco.conteudoSite || banco.siteContent || null;

  if (Array.isArray(listCategorias) && listCategorias.length > 0) {
    for (const cat of listCategorias) {
      await upsertCategoryFromBackup(cat);
    }
  }

  if (Array.isArray(listProdutos) && listProdutos.length > 0) {
    for (const prod of listProdutos) {
      await upsertProductFromBackup(prod);
    }
  }

  if (Array.isArray(listUsuarios) && listUsuarios.length > 0) {
    for (const user of listUsuarios) {
      await upsertUserFromBackup(user);
    }
  }

  if (conteudoSite && typeof conteudoSite === 'object') {
    for (const [key, value] of Object.entries(conteudoSite)) {
      if (typeof value === 'string') {
        await setSiteContent(key, value);
      } else if (value !== null && value !== undefined) {
        await setSiteContent(key, JSON.stringify(value));
      }
    }
  }

  return {
    restoredCategories: Array.isArray(listCategorias) ? listCategorias.length : 0,
    restoredProducts: Array.isArray(listProdutos) ? listProdutos.length : 0,
    restoredUsers: Array.isArray(listUsuarios) ? listUsuarios.length : 0,
  };
}
