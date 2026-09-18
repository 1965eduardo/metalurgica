import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import {
  getProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto,
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getDbStatus,
  initDatabase,
  getAllSiteContent,
  setSiteContent,
  restoreBackupData,
  getUsers,
  getAllUsersForBackup,
  createUser,
  updateUser,
  deleteUser,
  query
} from './db';
import { authenticateAdmin, authMiddleware, AuthenticatedRequest, generateToken } from './auth';

export const apiRouter = Router();

// Configuração do Multer (Storage local para simulação do bucket de upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usando /tmp/uploads para garantir permissão de escrita em ambientes Cloud (ex: Cloud Run)
    const uploadDir = path.join('/tmp', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Evitar conflitos de nome
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// ----------------------------------------------------------------------------
// UPLOAD DE IMAGENS
// ----------------------------------------------------------------------------
// Endpoint que simula a integração com um Cloud Storage (ex: Vercel Blob/S3)
apiRouter.post('/upload', authMiddleware, upload.single('imagem'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }
    // Em um ambiente real Cloud Run, esse arquivo seria perdido ao reiniciar o container.
    // Retornamos a URL pública servida pelo Express.
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar upload: ' + err.message });
  }
});

// Configuração opcional se existirem variáveis de ambiente. Se não, geramos erro depois.
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'pn9orwoe',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Extrai o public_id da URL (ex: 'https://res.cloudinary.com/.../v1234/produtos/peca1.jpg' -> 'produtos/peca1')
export function getCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
      }
      return null;
    }
    let pathPart = parts[1];
    const versionMatch = pathPart.match(/(?:.*\/)?v\d+\/(.+)$/);
    if (versionMatch) {
      pathPart = versionMatch[1];
    } else {
      pathPart = pathPart.replace(/^v\d+\//, '');
    }
    const lastDot = pathPart.lastIndexOf('.');
    return lastDot !== -1 ? pathPart.substring(0, lastDot) : pathPart;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// BIBLIOTECA DE MÍDIA (CLOUDINARY)
// ----------------------------------------------------------------------------

apiRouter.get('/media', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
       return res.status(503).json({ error: 'Chaves da API do Cloudinary não configuradas no servidor.' });
    }
    
    // Lista os arquivos mais recentes enviados via API / Cloudinary (limite de 50 para demonstração)
    const result = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
      
    // Busca os produtos e configurações do site no banco de dados para cruzar os dados
    const produtos = await getProdutos();
    const siteContent = await getAllSiteContent();
    let heroBgImage = '';
    let aboutImageUrl = '';
    let parallaxImageUrl = '';
    let siteLogoUrl = '';
    if (siteContent) {
      if (siteContent.hero_settings) {
        try {
          const parsed = JSON.parse(siteContent.hero_settings);
          if (parsed.hero_bg_image) heroBgImage = parsed.hero_bg_image;
        } catch (e) {}
      }
      if (siteContent.about_image_url) {
        aboutImageUrl = siteContent.about_image_url;
      }
      if (siteContent.parallax_image_url) {
        parallaxImageUrl = siteContent.parallax_image_url;
      }
      if (siteContent.site_logo_url) {
        siteLogoUrl = siteContent.site_logo_url;
      }
    }

    const images = result.resources.map((file: any) => {
       const secureUrl = file.secure_url || file.url || '';
       const publicId = file.public_id || '';

       // Localiza produto vinculado por URL exata ou correspondência por public_id
       const matchedProduct = produtos.find(p => {
         if (!p.imagem_url) return false;
         return p.imagem_url === secureUrl ||
                p.imagem_url === file.url ||
                (publicId && p.imagem_url.includes(publicId));
       });

       let productName: string | null = null;
       let contextType: 'product' | 'hero' | 'about' | 'parallax' | 'logo' | 'unlinked' = 'unlinked';
       let productRef: string | null = null;

       if (matchedProduct) {
         productName = matchedProduct.titulo;
         contextType = 'product';
         productRef = matchedProduct.codigo_referencia || null;
       } else if (siteLogoUrl && (siteLogoUrl === secureUrl || (publicId && siteLogoUrl.includes(publicId)))) {
         productName = 'Logotipo Oficial do Site';
         contextType = 'logo';
       } else if (heroBgImage && (heroBgImage === secureUrl || (publicId && heroBgImage.includes(publicId)))) {
         productName = 'Banner Principal da Home';
         contextType = 'hero';
       } else if (aboutImageUrl && (aboutImageUrl === secureUrl || (publicId && aboutImageUrl.includes(publicId)))) {
         productName = 'Instalações da Empresa (Sobre)';
         contextType = 'about';
       } else if (parallaxImageUrl && (parallaxImageUrl === secureUrl || (publicId && parallaxImageUrl.includes(publicId)))) {
         productName = 'Banner Parallax / Destaque';
         contextType = 'parallax';
       }

       return {
         public_id: publicId,
         filename: file.filename || file.original_filename || null,
         original_filename: file.original_filename || file.filename || null,
         url: secureUrl,
         created_at: file.created_at,
         format: file.format,
         width: file.width,
         height: file.height,
         productName,
         contextType,
         productRef
       };
    });
    
    res.json({ success: true, images });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar imagens no Cloudinary: ' + err.message });
  }
});

const deleteMediaHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
       return res.status(503).json({ error: 'Chaves da API do Cloudinary não configuradas no servidor.' });
    }
    
    let { public_id, url } = req.body || {};
    if (!public_id && !url && req.body?.data) {
      public_id = req.body.data.public_id;
      url = req.body.data.url;
    }

    if (!public_id && url) {
      public_id = getCloudinaryPublicId(url);
    }
    
    if (!public_id) {
       return res.status(400).json({ error: 'public_id ou url é obrigatório para exclusão.' });
    }
    
    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result === 'ok' || result.result === 'not found') {
       res.json({ success: true, message: 'Imagem excluída com sucesso.' });
    } else {
       res.status(400).json({ error: 'Não foi possível excluir a imagem: ' + result.result });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir imagem no Cloudinary: ' + err.message });
  }
};

apiRouter.post('/media/delete', authMiddleware, deleteMediaHandler);
apiRouter.delete('/media', authMiddleware, deleteMediaHandler);

// ----------------------------------------------------------------------------
// ROTAS DE BACKUP / EXPORTAÇÃO E RESTAURAÇÃO COMPLETA
// ----------------------------------------------------------------------------
const handleBackup = async (req: Request, res: Response) => {
  try {
    // Busca dados das tabelas do banco
    const products = await getProdutos();
    const categories = await getCategorias();
    const siteContent = await getAllSiteContent();
    const users = await getAllUsersForBackup();

    // Tenta buscar lista de mídias sem travar caso falhe
    let mediaFiles: any[] = [];
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const cloudRes = await cloudinary.api.resources({ max_results: 500 });
        mediaFiles = (cloudRes.resources || []).map((item: any) => ({
          public_id: item.public_id,
          url: item.secure_url || item.url,
          format: item.format,
          bytes: item.bytes,
        }));
      } catch (cloudErr) {
        console.warn('Aviso: Não foi possível carregar a lista de mídias do Cloudinary para o backup:', cloudErr);
      }
    }

    // Monta o arquivo JSON
    const backupData = {
      meta: {
        sistema: 'Metalúrgica Fardin - Portal B2B',
        dataCriacao: new Date().toISOString(),
      },
      bancoDeDados: {
        totalProdutos: products.length,
        totalCategorias: categories.length,
        totalUsuarios: users.length,
        produtos: products,
        categorias: categories,
        usuarios: users,
        conteudoSite: siteContent || {},
      },
      midias: {
        totalArquivos: mediaFiles.length,
        arquivos: mediaFiles,
      },
    };

    const fileName = `backup-fardin-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    console.error('Erro na rota de backup:', error);
    return res.status(500).json({ error: 'Erro ao gerar backup: ' + (error?.message || error) });
  }
};

apiRouter.get('/backup', handleBackup);
apiRouter.get('/admin/backup', handleBackup);

const handleRestore = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const banco = body.bancoDeDados || body.database;

    if (!banco) {
      return res.status(400).json({
        error: 'Arquivo JSON incompatível. Não foi encontrada a chave de dados de produtos/categorias.',
      });
    }

    await restoreBackupData(banco);

    return res.status(200).json({
      success: true,
      message: 'Dados restaurados com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao restaurar backup:', error);
    return res.status(500).json({
      error: 'Falha ao processar a restauração dos dados: ' + (error?.message || error),
    });
  }
};

apiRouter.post('/restore', handleRestore);
apiRouter.post('/admin/restore', handleRestore);

// Status da infraestrutura de banco de dados (Neon PostgreSQL)
apiRouter.get('/db/status', async (req: Request, res: Response) => {
  const status = getDbStatus();
  res.json(status);
});

// Tentar reconectar ao Neon caso o usuário atualize a variável
apiRouter.post('/db/reconnect', async (req: Request, res: Response) => {
  const ok = await initDatabase();
  const status = getDbStatus();
  res.json({ ok, status });
});

// ----------------------------------------------------------------------------
// AUTENTICAÇÃO
// ----------------------------------------------------------------------------
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
    }

    // 2. NORMALIZAÇÃO DE LOGIN:
    // Converte o e-mail para minúsculas e remove espaços extras
    const normalizedEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    console.log('[Login Attempt]', normalizedEmail);

    // Verifica se a tabela users está vazia
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    if (parseInt(countResult.rows[0].count) === 0) {
      // Insere usuário inicial com hash bcrypt
      const defaultHash = await bcrypt.hash('fardin1983', 10);
      await query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
        ['Administrador Fardin', 'admin@metalurgicafardin.com.br', defaultHash]
      );
      console.log('[DB] Usuário administrador padrão criado com hash bcrypt.');
    }

    // Busca usuário pelo e-mail normalizado
    const result = await query(
      'SELECT id, name, email, password, created_at FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [normalizedEmail]
    );

    let user: any = null;
    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      // Fallback para admin_users caso a tabela users não tenha o registro
      const adminResult = await query(
        'SELECT id, email, password_hash as password, created_at FROM admin_users WHERE LOWER(email) = $1 LIMIT 1',
        [normalizedEmail]
      );
      if (adminResult.rows.length > 0) {
        user = {
          id: adminResult.rows[0].id,
          name: 'Administrador Fardin',
          email: adminResult.rows[0].email,
          password: adminResult.rows[0].password,
          created_at: adminResult.rows[0].created_at
        };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const storedPassword = user.password || '';
    let passwordMatches = false;

    // 3. SCRIPT DE AJUSTE DOS USUÁRIOS EXISTENTES:
    // Se a senha salva no banco for texto puro (não começar com '$2a$' ou '$2b$'), permita a comparação direta de fallback ou recriptografe a senha no primeiro login para não bloquear contas já cadastradas.
    const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$') || storedPassword.startsWith('$2$');

    if (isBcrypt) {
      passwordMatches = await bcrypt.compare(cleanPassword, storedPassword);
    } else {
      // Fallback para senha gravada em texto puro
      passwordMatches = (cleanPassword === storedPassword);

      // Se coincidir, recriptografa e atualiza no banco Neon para garantir segurança futura
      if (passwordMatches) {
        try {
          const hashedPassword = await bcrypt.hash(cleanPassword, 10);
          await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
          console.log(`[Auth Migration] Senha em texto puro do usuário ${user.email} atualizada com hash bcrypt.`);
        } catch (migErr) {
          console.error('[Auth Migration Error]', migErr);
        }
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      },
      token
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, error: 'Erro ao validar acesso no banco de dados.' });
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------------------------------
// GESTÃO DE USUÁRIOS (CRUD + TABELA USERS NO NEON)
// ----------------------------------------------------------------------------

apiRouter.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await getUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar usuários: ' + err.message });
  }
});

apiRouter.post('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    // 1. CRIAÇÃO DE USUÁRIOS (Hash de Senha):
    // Garante hash bcrypt e normalização de e-mail/nome
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();
    const cleanPassword = String(password).trim();

    const user = await createUser({
      name: cleanName,
      email: cleanEmail,
      passwordPlain: cleanPassword
    });

    res.status(201).json({ user, message: 'Usuário cadastrado com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Falha ao criar usuário.' });
  }
});

apiRouter.put('/users/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    if (password && password.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
    const cleanName = name ? String(name).trim() : undefined;
    const cleanPassword = password && String(password).trim() !== '' ? String(password).trim() : undefined;

    // Atualização com hash bcrypt automática caso nova senha seja informada
    const user = await updateUser(id, {
      name: cleanName,
      email: cleanEmail,
      passwordPlain: cleanPassword
    });

    res.json({ user, message: 'Usuário atualizado com sucesso.' });
  } catch (err: any) {
    console.error('[Update User Error]', err);
    res.status(400).json({ error: err.message || 'Falha ao atualizar usuário.' });
  }
});

apiRouter.delete('/users/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    res.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Falha ao excluir usuário.' });
  }
});

// ----------------------------------------------------------------------------
// ROTAS DE PRODUTOS E CATÁLOGO (CRUD RELACIONAL + ILIKE SEARCH)
// ----------------------------------------------------------------------------

// Listar produtos com busca avançada (ILIKE) e filtro por categoria
apiRouter.get('/produtos', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined;

    const produtos = await getProdutos(search, categoria);
    res.json({ produtos, total: produtos.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao consultar catálogo: ' + err.message });
  }
});

// Categorias disponíveis
apiRouter.get('/categorias', async (req: Request, res: Response) => {
  try {
    const categorias = await getCategorias();
    res.json({ categorias });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao obter categorias: ' + err.message });
  }
});

// Criar categoria
apiRouter.post('/categorias', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
    const cat = await createCategoria(name, slug);
    res.status(201).json({ success: true, categoria: cat });
  } catch (err: any) {
    if (err.message && err.message.includes('unique constraint')) {
      return res.status(409).json({ error: 'Categoria já existe.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Atualizar categoria
apiRouter.put('/categorias/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug } = req.body;
    const cat = await updateCategoria(req.params.id, name, slug);
    res.json({ success: true, categoria: cat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar categoria
apiRouter.delete('/categorias/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await deleteCategoria(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obter detalhes de um produto
apiRouter.get('/produtos/:id', async (req: Request, res: Response) => {
  try {
    const produto = await getProdutoById(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.json({ produto });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao buscar produto: ' + err.message });
  }
});

// Criar novo produto (Protegido - Requer JWT de Administrador)
apiRouter.post('/produtos', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas } = req.body;

    if (!titulo || !codigo_referencia || !categoria) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios ausentes: Título, Código de Referência e Categoria são necessários.'
      });
    }

    const novoProduto = await createProduto({
      titulo: titulo.trim(),
      codigo_referencia: codigo_referencia.trim().toUpperCase(),
      categoria: categoria.trim(),
      descricao: descricao ? descricao.trim() : '',
      imagem_url: imagem_url && imagem_url.trim() ? imagem_url.trim() : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      especificacoes_metalurgicas: especificacoes_metalurgicas ? especificacoes_metalurgicas.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Produto cadastrado com sucesso!',
      data: novoProduto
    });
  } catch (err: any) {
    if (err.message && err.message.includes('unique constraint')) {
      return res.status(409).json({ success: false, error: 'Já existe um produto cadastrado com este código de referência.' });
    }
    res.status(500).json({ success: false, error: 'Erro ao cadastrar produto: ' + err.message });
  }
});

// Atualizar produto existente (Protegido - Requer JWT de Administrador)
apiRouter.put('/produtos/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { titulo, codigo_referencia, categoria, descricao, imagem_url, especificacoes_metalurgicas } = req.body;

    if (!titulo || !codigo_referencia || !categoria) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios ausentes: Título, Código de Referência e Categoria são necessários.'
      });
    }

    const produtoAtualizado = await updateProduto(req.params.id, {
      titulo: titulo.trim(),
      codigo_referencia: codigo_referencia.trim().toUpperCase(),
      categoria: categoria.trim(),
      descricao: descricao ? descricao.trim() : '',
      imagem_url: imagem_url ? imagem_url.trim() : '',
      especificacoes_metalurgicas: especificacoes_metalurgicas !== undefined ? especificacoes_metalurgicas.trim() : ''
    });

    if (!produtoAtualizado) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado para atualização.' });
    }

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso!',
      data: produtoAtualizado
    });
  } catch (err: any) {
    if (err.message && err.message.includes('unique constraint')) {
      return res.status(409).json({ success: false, error: 'Já existe outro produto com este código de referência.' });
    }
    res.status(500).json({ success: false, error: 'Erro ao atualizar produto: ' + err.message });
  }
});

// Deletar produto (Protegido - Requer JWT de Administrador)
apiRouter.delete('/produtos/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Busca o produto no banco para verificar a imagem associada
    const produto = await getProdutoById(id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado para exclusão.' });
    }

    const imageUrl = produto.imagem_url;

    // 2. Remove o registro do produto
    const deletado = await deleteProduto(id);
    if (!deletado) {
      return res.status(404).json({ error: 'Produto não encontrado para exclusão.' });
    }

    // 3. Se houver imagem associada, verifica se nenhum OUTRO produto está utilizando essa mesma URL
    let mediaDeleted = false;
    if (imageUrl) {
      const outrosProdutos = await getProdutos();
      const imagemEmUsoPorOutro = outrosProdutos.some(p => p.id !== id && p.imagem_url === imageUrl);

      // Também verifica se a imagem não está em uso nos destaques do site (logo, hero, sobre, parallax)
      const siteContent = await getAllSiteContent();
      const emUsoNoSite = siteContent && (
        siteContent.site_logo_url === imageUrl ||
        siteContent.about_image_url === imageUrl ||
        siteContent.parallax_image_url === imageUrl ||
        (siteContent.hero_settings && siteContent.hero_settings.includes(imageUrl))
      );

      if (!imagemEmUsoPorOutro && !emUsoNoSite) {
        const publicId = getCloudinaryPublicId(imageUrl);
        if (publicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          try {
            await cloudinary.uploader.destroy(publicId);
            mediaDeleted = true;
          } catch (cloudErr) {
            console.warn('[Cloudinary] Erro ao deletar imagem associada ao excluir produto:', cloudErr);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Produto e mídia removidos com sucesso.',
      mediaDeleted,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao remover produto: ' + err.message });
  }
});

// Formulário de contato / Solicitação de orçamento
apiRouter.post('/contato', (req: Request, res: Response) => {
  const { nome, empresa, email, telefone, produtoRef, mensagem, recipientEmail } = req.body;
  if (!nome || !email || !mensagem) {
    return res.status(400).json({ error: 'Por favor, preencha nome, e-mail e a mensagem da solicitação.' });
  }

  const targetEmail = (recipientEmail && typeof recipientEmail === 'string' && recipientEmail.trim()) 
    ? recipientEmail.trim() 
    : 'contato@metalurgicafardin.com.br';

  console.log(`[Formulário de Contato] Nova mensagem de ${nome} (${email}) para ${targetEmail}`);

  // Gera texto formatado para link do WhatsApp direto
  const textoZap = encodeURIComponent(
    `*Solicitação de Orçamento - Metalúrgica Fardin*\n` +
    `*Destinatário:* ${targetEmail}\n` +
    `*Nome:* ${nome}\n` +
    `*Empresa:* ${empresa || 'Não informada'}\n` +
    `*Telefone:* ${telefone || 'Não informado'}\n` +
    `*E-mail:* ${email}\n` +
    (produtoRef ? `*Peça/Ref:* ${produtoRef}\n` : '') +
    `*Mensagem:* ${mensagem}`
  );

  res.json({
    success: true,
    message: 'Solicitação recebida com sucesso! Nossa equipe técnica retornará em breve.',
    recipientEmail: targetEmail,
    whatsappUrl: `https://wa.me/5511999999999?text=${textoZap}`
  });
});

// ----------------------------------------------------------------------------
// CMS INLINE
// ----------------------------------------------------------------------------
apiRouter.get('/content', async (req: Request, res: Response) => {
  try {
    const content = await getAllSiteContent();
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar conteúdo do site: ' + err.message });
  }
});

apiRouter.post('/content', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, content } = req.body;
    if (!id || typeof content !== 'string') {
      return res.status(400).json({ error: 'Parâmetros id e content são obrigatórios.' });
    }
    const ok = await setSiteContent(id, content);
    if (!ok) {
      throw new Error('Falha ao salvar no banco de dados.');
    }
    res.json({ success: true, message: 'Conteúdo atualizado.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar conteúdo: ' + err.message });
  }
});
