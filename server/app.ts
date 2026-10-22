import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { getCryptoRates } from './cryptoRates.js';
import {
  type CoinKey,
  type WalletsConfig,
  confirmDemoSession,
  createPaymentSession,
  getSession,
  pruneExpiredSessions,
  serializeSession,
  verifyOnChain,
} from './verifier.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'config', 'wallets.json');

export function loadWalletsConfig(): WalletsConfig {
  for (const candidate of [configPath, path.resolve(process.cwd(), 'config', 'wallets.json')]) {
    try {
      if (fs.existsSync(candidate)) {
        return JSON.parse(fs.readFileSync(candidate, 'utf-8')) as WalletsConfig;
      }
    } catch {
      // Fall through to bundled config
    }
  }
  return require('../config/wallets.json') as WalletsConfig;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxPerMin: number): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(ip);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= maxPerMin;
}

export function createApiApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  setInterval(() => {
    pruneExpiredSessions();
    const now = Date.now();
    for (const [ip, bucket] of rateBuckets.entries()) {
      if (now > bucket.resetAt) rateBuckets.delete(ip);
    }
  }, 10 * 60_000).unref();

  app.use((_req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  app.get('/api/config', async (_req, res) => {
    try {
      const cfg = loadWalletsConfig();
      const rates = await getCryptoRates();
      res.json({ ...cfg, rates });
    } catch {
      res.status(500).json({ error: 'config_error' });
    }
  });

  app.get('/api/rates', async (_req, res) => {
    const rates = await getCryptoRates();
    res.json({ rates });
  });

  app.post('/api/payment/create', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip, 30)) {
      res.status(429).json({ error: 'rate_limited' });
      return;
    }
    try {
      const cfg = loadWalletsConfig();
      const rawAmount = Number(req.body?.usdAmount);
      const usdAmount =
        Number.isFinite(rawAmount) && rawAmount > 0 ? Math.min(rawAmount, 1_000_000) : 10;
      const requestedCoin = req.body?.coinKey as CoinKey;
      const validCoins: CoinKey[] = [
        'USDT_BEP20',
        'USDT_TRC20',
        'USDT_ERC20',
        'BTC',
        'ETH',
        'SOL',
      ];
      const coinKey: CoinKey = validCoins.includes(requestedCoin)
        ? requestedCoin
        : cfg.defaultCurrency;

      const session = await createPaymentSession(cfg, usdAmount, coinKey);
      res.json({
        session: serializeSession(session),
        demoMode: cfg.demoMode,
      });
    } catch {
      res.status(500).json({ error: 'session_create_failed' });
    }
  });

  app.get('/api/payment/status/:id', async (req, res) => {
    const cfg = loadWalletsConfig();
    const session = getSession(req.params.id, cfg);
    if (!session) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const confirmed = await verifyOnChain(session);
    res.json({
      status: confirmed ? 'confirmed' : session.status,
      txHash: session.txHash || null,
    });
  });

  app.post('/api/payment/verify', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip + ':verify', 25)) {
      res.status(429).json({ error: 'rate_limited' });
      return;
    }
    const cfg = loadWalletsConfig();
    const { sessionId, txHash } = req.body || {};
    const session = getSession(String(sessionId || ''), cfg);
    if (!session) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const confirmed = await verifyOnChain(
      session,
      typeof txHash === 'string' && txHash.trim() ? txHash.trim() : undefined
    );
    res.json({
      status: confirmed ? 'confirmed' : session.status,
      txHash: session.txHash || null,
    });
  });

  app.post('/api/payment/demo-confirm', (req, res) => {
    const cfg = loadWalletsConfig();
    if (!cfg.demoMode) {
      res.status(403).json({ error: 'demo_disabled' });
      return;
    }
    const { sessionId } = req.body || {};
    const updated = confirmDemoSession(String(sessionId || ''), cfg);
    if (!updated) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ status: 'confirmed', txHash: updated.txHash });
  });

  return app;
}
