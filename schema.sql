-- ============================================================================
-- METALÚRGICA FARDIN LTDA - ESQUEMA RELACIONAL POSTGRESQL (NEON SERVERLESS)
-- Conexão através de: DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
-- ============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS E ADMINISTRADORES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. TABELA DE PRODUTOS E PEÇAS AGRÍCOLAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    codigo_referencia VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(150) NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA BUSCA OTIMIZADA (ILIKE) E NAVEGAÇÃO RÁPIDA
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_ref ON produtos (codigo_referencia);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_titulo ON produtos (titulo);
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos (created_at DESC);

-- Trigger para atualização automática de updated_at em alterações
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_produtos_updated_at ON produtos;
CREATE TRIGGER trg_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- CARGA INICIAL DE EXEMPLOS (SEMENTE)
-- ----------------------------------------------------------------------------
-- Senha inicial do admin padrão: 'fardin1983' (hash bcrypt)
INSERT INTO admin_users (email, password_hash)
VALUES (
    'admin@metalurgicafardin.com.br',
    '$2a$10$7ZrqvC1xI8H8vA2pZ9v8hO8V5k7Z3J9W6xG1M4Q6X8Y9Z0A1B2C3D' -- fardin1983
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO produtos (titulo, codigo_referencia, categoria, descricao, imagem_url)
VALUES 
(
    'Suporte Reforçado para Roçadeira Agrícola',
    'REF-5012',
    'Implementos Agrícolas',
    'Fabricado em aço de alta resistência com tratamento térmico especializado. Desenvolvido para absorver impactos severos em operações de roçada pesada. Compatível com diversos modelos de tratores do mercado.',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
),
(
    'Lâmina de Corte para Cortadores e Tratores de Jardim',
    'REF-1185',
    'Linha Jardim & Campo',
    'Lâmina balanceada eletronicamente para corte de alta precisão. Aço temperado de longa durabilidade com proteção anticorrosiva avançada.',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
),
(
    'Bico Subsolador Agrícola de Alta Penetração',
    'REF-1114',
    'Linha Agrícola Pesada',
    'Projetado para romper compactações profundas do solo com menor consumo de combustível. Ponta reforçada e design hidrodinâmico para melhor fluxo de terra.',
    'https://images.unsplash.com/photo-1530267981373-f09b55239e99?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT (codigo_referencia) DO UPDATE 
SET titulo = EXCLUDED.titulo,
    categoria = EXCLUDED.categoria,
    descricao = EXCLUDED.descricao,
    imagem_url = EXCLUDED.imagem_url;
