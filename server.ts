import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import { seedSampleData } from './server/seed.ts';
import { attachAuth } from './server/auth.ts';
import authRoutes from './server/routes/authRoutes.ts';
import jobRoutes from './server/routes/jobRoutes.ts';
import workerRoutes from './server/routes/workerRoutes.ts';
import employerRoutes from './server/routes/employerRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import commonRoutes from './server/routes/commonRoutes.ts';

async function startServer() {
  initDatabase();
  seedSampleData(false);

  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(attachAuth);

  // API routes
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', jobRoutes);
  app.use('/api/worker', workerRoutes);
  app.use('/api/employer', employerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', commonRoutes);

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(500).send('Application build missing. Run npm run build.');
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KaamConnect server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KaamConnect server:', err);
  process.exit(1);
});
