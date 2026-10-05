import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import counselHandler from './api/chat/counsel.ts';
import recommendHandler from './api/date-course/recommend.ts';
import healthHandler from './api/health.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;

// Delegate to the exact same Vercel Serverless Function handlers
app.all('/api/chat/counsel', (req: Request, res: Response) => counselHandler(req, res));
app.all('/api/date-course/recommend', (req: Request, res: Response) => recommendHandler(req, res));
app.all('/api/health', (req: Request, res: Response) => healthHandler(req, res));

// Attach Vite middleware in development, or serve build output in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
