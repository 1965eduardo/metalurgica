import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { initDatabase } from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Rotas de API
  app.use('/api', apiRouter);

  // Catch-all para rotas não encontradas na API
  app.use('/api', (req: express.Request, res: express.Response) => {
    res.status(404).json({ success: false, error: 'Endpoint não encontrado na API.' });
  });

  // Error handler da API para garantir JSON (evita fallback HTML do Vite)
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({ success: false, error: err.message || 'Erro Interno do Servidor' });
  });

  // Servir imagens enviadas (Simulação de Storage)
  app.use('/uploads', express.static(path.join('/tmp', 'uploads')));

  // Inicializar banco Neon PostgreSQL em segundo plano sem bloquear a inicialização
  initDatabase().catch(err => {
    console.warn('[DB] Tentativa de inicialização reportou:', err.message);
  });

  // Integração com Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Metalúrgica Fardin Server] Rodando na porta ${PORT} (0.0.0.0)`);
  });
}

startServer();
