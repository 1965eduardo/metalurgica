import express, { Request, Response } from 'express';
import path from 'path';
import { apiRouter } from '../server/routes';
import { initDatabase } from '../server/db';

const app = express();

app.use(express.json());

// Inicia a conexão com o banco Neon em background
initDatabase().catch(err => {
  console.warn('[DB] Inicialização do banco Neon:', err?.message || err);
});

// Middleware de CORS e Headers para compatibilidade máxima
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Suportar imagens em /uploads
app.use('/uploads', express.static(path.join('/tmp', 'uploads')));

// Montar as rotas da API tanto sob /api quanto na raiz caso o rewrite corte o prefixo
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback para rotas não encontradas na API
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint não encontrado na API.' });
});

export default app;
