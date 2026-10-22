import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function startServer() {
  const app = createApiApp();
  const httpServer = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.join(rootDir, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '7d',
        index: false,
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Sanctuary server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
