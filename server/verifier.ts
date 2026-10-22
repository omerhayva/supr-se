import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { getCryptoRates } from './cryptoRates.js';

export type CoinKey = 'USDT_BEP20' | 'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH' | 'SOL';

export interface WalletEntry {
  enabled: boolean;
  symbol: 'USDT' | 'BTC' | 'ETH' | 'SOL';
  network: string;
  address: string;
}

export interface WalletsConfig {
  demoMode: boolean;
  defaultCurrency: CoinKey;
  presets: number[];
  wallets: Record<CoinKey, WalletEntry>;
}

export interface PaymentSession {
  id: string;
  nonce: string;
  coinKey: CoinKey;
  symbol: 'USDT' | 'BTC' | 'ETH' | 'SOL';
  network: string;
  address: string;
  usdAmount: number;
  cryptoAmount: string;
  paymentUri: string;
  qrSvg: string;
  status: 'pending' | 'confirmed';
  baselineBalance?: bigint;
  txHash?: string;
  createdAt: number;
  expiresAt: number;
}

interface SignedSessionPayload {
  n: string;
  c: CoinKey;
  u: number;
  a: string;
  b?: string;
  t: number;
  e: number;
}

const sessions = new Map<string, PaymentSession>();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const primaryDataDir = path.resolve(__dirname, '..', 'data');
const fallbackDataDir = path.join(os.tmpdir(), 'silent-wish-data');
const claimedTxHashes = new Set<string>();

for (const dir of [primaryDataDir, fallbackDataDir]) {
  try {
    const file = path.join(dir, 'claimed-txs.json');
    if (fs.existsSync(file)) {
      const existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (Array.isArray(existing)) {
        for (const h of existing) claimedTxHashes.add(String(h).toLowerCase());
      }
    }
  } catch {
    // Ignore unreadable cache path
  }
}

function isTxClaimed(hash?: string | null): boolean {
  if (!hash) return false;
  return claimedTxHashes.has(hash.trim().toLowerCase());
}

function markTxClaimed(hash: string): void {
  const norm = hash.trim().toLowerCase();
  claimedTxHashes.add(norm);
  const recentList = JSON.stringify(Array.from(claimedTxHashes).slice(-5000), null, 2);
  for (const dir of [primaryDataDir, fallbackDataDir]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'claimed-txs.json'), recentList, 'utf-8');
      return;
    } catch {
      // Try next writable directory (e.g. /tmp on serverless platforms)
    }
  }
}

function deriveSessionKey(config: WalletsConfig): Buffer {
  const secretMaterial =
    process.env.SESSION_SECRET ||
    `silent-wish-sanctuary-v1:${JSON.stringify(config.wallets)}`;
  return crypto.createHash('sha256').update(secretMaterial).digest();
}

function signSessionId(payload: SignedSessionPayload, config: WalletsConfig): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', deriveSessionKey(config))
    .update(body)
    .digest('base64url')
    .slice(0, 32);
  return `${body}.${sig}`;
}

export function pruneExpiredSessions(): void {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < cutoff) {
      sessions.delete(id);
    }
  }
}

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function tronBase58ToHex20(base58Str: string): string {
  const clean = base58Str.trim();
  if (clean.startsWith('0x')) return clean.replace(/^0x/i, '').toLowerCase();
  let num = 0n;
  for (const ch of clean) {
    const idx = B58_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid TRON Base58 char');
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = Buffer.from(hex, 'hex');
  return bytes.subarray(1, 21).toString('hex').toLowerCase();
}

const TRON_RPC_URL = 'https://tron-rpc.publicnode.com/jsonrpc';
const BSC_RPC_URL = 'https://bsc-rpc.publicnode.com';
const ETH_RPC_URL = 'https://ethereum-rpc.publicnode.com';
const SOL_RPC_URL = 'https://solana-rpc.publicnode.com';

const USDT_TRC20_HEX_CONTRACT = '0x' + tronBase58ToHex20('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
const USDT_ERC20_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_BEP20_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const MAX_CLOCK_SKEW_MS = 10 * 60 * 1000;

async function fetchJsonWithTimeout(url: string, init?: RequestInit, ms = 4500): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getTokenBalanceUnits(
  rpcUrl: string,
  contractHex: string,
  holderHex20: string
): Promise<bigint | undefined> {
  const data = '0x70a08231' + holderHex20.replace(/^0x/i, '').toLowerCase().padStart(64, '0');
  const rpc = await fetchJsonWithTimeout(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: contractHex, data }, 'latest'],
    }),
  });
  if (typeof rpc?.result === 'string' && rpc.result.startsWith('0x')) {
    return rpc.result === '0x' ? 0n : BigInt(rpc.result);
  }
  return undefined;
}

async function getEthNativeBalance(address: string): Promise<bigint | undefined> {
  const rpc = await fetchJsonWithTimeout(ETH_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  });
  if (typeof rpc?.result === 'string') {
    return BigInt(rpc.result);
  }
  return undefined;
}

async function getSolNativeBalance(address: string): Promise<bigint | undefined> {
  const rpc = await fetchJsonWithTimeout(SOL_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
  });
  if (typeof rpc?.result?.value === 'number') {
    return BigInt(rpc.result.value);
  }
  return undefined;
}

async function getEvmBlockTimestampMs(rpcUrl: string, blockNumberHex?: string): Promise<number | null> {
  if (!blockNumberHex) return null;
  const blockRpc = await fetchJsonWithTimeout(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 9,
      method: 'eth_getBlockByNumber',
      params: [blockNumberHex, false],
    }),
  });
  if (blockRpc?.result?.timestamp) {
    return Number(BigInt(blockRpc.result.timestamp)) * 1000;
  }
  return null;
}

function buildPaymentUri(coinKey: CoinKey, address: string, amount: string): string {
  switch (coinKey) {
    case 'BTC':
      return `bitcoin:${address}?amount=${amount}`;
    case 'ETH':
      return `ethereum:${address}?value=${BigInt(Math.round(parseFloat(amount) * 1e18)).toString()}`;
    case 'SOL':
      return `solana:${address}?amount=${amount}`;
    case 'USDT_BEP20':
    case 'USDT_ERC20':
    case 'USDT_TRC20':
    default:
      return address;
  }
}

async function readCurrentChainBalanceUnits(
  coinKey: CoinKey,
  address: string
): Promise<bigint | undefined> {
  if (coinKey === 'USDT_TRC20') {
    return getTokenBalanceUnits(TRON_RPC_URL, USDT_TRC20_HEX_CONTRACT, tronBase58ToHex20(address));
  }
  if (coinKey === 'USDT_BEP20') {
    return getTokenBalanceUnits(BSC_RPC_URL, USDT_BEP20_CONTRACT, address);
  }
  if (coinKey === 'USDT_ERC20') {
    return getTokenBalanceUnits(ETH_RPC_URL, USDT_ERC20_CONTRACT, address);
  }
  if (coinKey === 'ETH') {
    return getEthNativeBalance(address);
  }
  if (coinKey === 'SOL') {
    return getSolNativeBalance(address);
  }
  return undefined;
}

export async function createPaymentSession(
  config: WalletsConfig,
  usdAmount: number,
  coinKey: CoinKey
): Promise<PaymentSession> {
  const wallet =
    config.wallets[coinKey] ||
    config.wallets[config.defaultCurrency] ||
    Object.values(config.wallets).find((w) => w.enabled) ||
    config.wallets.USDT_TRC20;

  const rates = await getCryptoRates();
  const rate = rates[wallet.symbol] || 1;

  let formattedAmount: string;
  if (wallet.symbol === 'USDT') {
    const base = Math.max(0.5, usdAmount);
    if (!config.demoMode) {
      const activeAmounts = new Set(
        Array.from(sessions.values())
          .filter((s) => s.status === 'pending' && s.coinKey === coinKey && s.expiresAt > Date.now())
          .map((s) => s.cryptoAmount)
      );
      let candidate = base.toFixed(2);
      let offset = 1;
      while (activeAmounts.has(candidate) && offset < 50) {
        candidate = (base + offset * 0.01).toFixed(2);
        offset++;
      }
      formattedAmount = candidate;
    } else {
      formattedAmount = base.toFixed(2);
    }
  } else if (wallet.symbol === 'BTC') {
    formattedAmount = (usdAmount / rate).toFixed(6);
  } else if (wallet.symbol === 'ETH') {
    formattedAmount = (usdAmount / rate).toFixed(5);
  } else {
    formattedAmount = (usdAmount / rate).toFixed(4);
  }

  const baselineBalance = await readCurrentChainBalanceUnits(coinKey, wallet.address);
  const paymentUri = buildPaymentUri(coinKey, wallet.address, formattedAmount);

  const qrSvg = await QRCode.toString(paymentUri, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#E7CFA0',
      light: '#00000000',
    },
  });

  const now = Date.now();
  const expiresAt = now + 20 * 60 * 1000;
  const nonce = crypto.randomBytes(4).toString('hex');
  const id = signSessionId(
    {
      n: nonce,
      c: coinKey,
      u: usdAmount,
      a: formattedAmount,
      b: baselineBalance !== undefined ? baselineBalance.toString() : undefined,
      t: now,
      e: expiresAt,
    },
    config
  );

  const session: PaymentSession = {
    id,
    nonce,
    coinKey,
    symbol: wallet.symbol,
    network: wallet.network,
    address: wallet.address,
    usdAmount,
    cryptoAmount: formattedAmount,
    paymentUri,
    qrSvg,
    status: 'pending',
    baselineBalance,
    createdAt: now,
    expiresAt,
  };

  sessions.set(session.id, session);
  return session;
}

export function serializeSession(session: PaymentSession) {
  const { baselineBalance: _ignored, nonce: _nonce, ...publicFields } = session;
  return publicFields;
}

export function getSession(id: string, config?: WalletsConfig): PaymentSession | undefined {
  const cached = sessions.get(id);
  if (cached) return cached;
  if (!config || !id || !id.includes('.')) return undefined;

  const parts = id.split('.');
  if (parts.length !== 2) return undefined;
  const [body, sig] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', deriveSessionKey(config))
      .update(body)
      .digest('base64url')
      .slice(0, 32);

    const a = Buffer.from(sig, 'utf-8');
    const b = Buffer.from(expectedSig, 'utf-8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return undefined;
    }

    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as SignedSessionPayload;
    const wallet = config.wallets[parsed.c];
    if (!wallet || typeof parsed.a !== 'string' || typeof parsed.t !== 'number') {
      return undefined;
    }
    if (parsed.e < Date.now() - 2 * 60 * 60 * 1000) {
      return undefined;
    }

    const rehydrated: PaymentSession = {
      id,
      nonce: parsed.n || '00000000',
      coinKey: parsed.c,
      symbol: wallet.symbol,
      network: wallet.network,
      address: wallet.address,
      usdAmount: parsed.u,
      cryptoAmount: parsed.a,
      paymentUri: buildPaymentUri(parsed.c, wallet.address, parsed.a),
      qrSvg: '',
      status: 'pending',
      baselineBalance: parsed.b !== undefined ? BigInt(parsed.b) : undefined,
      createdAt: parsed.t,
      expiresAt: parsed.e,
    };

    sessions.set(id, rehydrated);
    return rehydrated;
  } catch {
    return undefined;
  }
}

export function confirmDemoSession(id: string, config?: WalletsConfig): PaymentSession | undefined {
  const session = getSession(id, config);
  if (!session) return undefined;
  session.status = 'confirmed';
  session.txHash = '0x' + crypto.randomBytes(32).toString('hex');
  return session;
}

async function verifyEvmOrTronTokenTransfer(params: {
  rpcUrl: string;
  contractAddress: string;
  decimals: number;
  recipientHex20: string;
  minAccepted: number;
  sessionCreatedAt: number;
  submittedTxHash?: string;
}): Promise<string | null> {
  const {
    rpcUrl,
    contractAddress,
    decimals,
    recipientHex20,
    minAccepted,
    sessionCreatedAt,
    submittedTxHash,
  } = params;
  const paddedTarget = '0x' + recipientHex20.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const scale = 10 ** decimals;

  if (submittedTxHash) {
    const cleanHash = submittedTxHash.startsWith('0x') ? submittedTxHash : '0x' + submittedTxHash;
    if (isTxClaimed(cleanHash)) return null;

    const rpc = await fetchJsonWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [cleanHash],
      }),
    });
    const receipt = rpc?.result;
    if (!receipt || receipt.status !== '0x1') return null;

    const blockTime = await getEvmBlockTimestampMs(rpcUrl, receipt.blockNumber);
    if (blockTime !== null && blockTime < sessionCreatedAt - MAX_CLOCK_SKEW_MS) {
      return null;
    }

    const logs = receipt.logs;
    if (Array.isArray(logs)) {
      for (const log of logs) {
        if (
          log.address?.toLowerCase() === contractAddress.toLowerCase() &&
          log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
          log.topics?.[2]?.toLowerCase() === paddedTarget
        ) {
          const val = Number(BigInt(log.data || '0x0')) / scale;
          if (val >= minAccepted) return cleanHash;
        }
      }
    }
    return null;
  }

  const blockRpc = await fetchJsonWithTimeout(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_blockNumber',
      params: [],
    }),
  });
  const latestHex = blockRpc?.result;
  if (latestHex) {
    const latest = BigInt(latestHex);
    const fromBlock = '0x' + (latest > 80n ? latest - 80n : 0n).toString(16);
    const logsRpc = await fetchJsonWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_getLogs',
        params: [
          {
            fromBlock,
            toBlock: 'latest',
            address: contractAddress,
            topics: [TRANSFER_TOPIC, null, paddedTarget],
          },
        ],
      }),
    });
    const logs = logsRpc?.result;
    if (Array.isArray(logs)) {
      for (const log of logs) {
        const txHash = String(log.transactionHash || '');
        if (!txHash || isTxClaimed(txHash)) continue;
        const val = Number(BigInt(log.data || '0x0')) / scale;
        if (val >= minAccepted) {
          const blockTime = await getEvmBlockTimestampMs(rpcUrl, log.blockNumber);
          if (blockTime === null || blockTime >= sessionCreatedAt - 90_000) {
            return txHash;
          }
        }
      }
    }
  }

  return null;
}

export async function verifyOnChain(
  session: PaymentSession,
  submittedTxHash?: string
): Promise<boolean> {
  if (session.status === 'confirmed') return true;
  if (submittedTxHash && isTxClaimed(submittedTxHash)) return false;

  const expected = parseFloat(session.cryptoAmount);
  const minAccepted = expected * 0.985;

  try {
    if (session.coinKey === 'USDT_TRC20') {
      const matchHash = await verifyEvmOrTronTokenTransfer({
        rpcUrl: TRON_RPC_URL,
        contractAddress: USDT_TRC20_HEX_CONTRACT,
        decimals: 6,
        recipientHex20: tronBase58ToHex20(session.address),
        minAccepted,
        sessionCreatedAt: session.createdAt,
        submittedTxHash,
      });
      if (matchHash) {
        markTxClaimed(matchHash);
        session.status = 'confirmed';
        session.txHash = matchHash;
        return true;
      }

      if (!submittedTxHash && session.baselineBalance !== undefined) {
        const current = await readCurrentChainBalanceUnits('USDT_TRC20', session.address);
        const minUnits = BigInt(Math.floor(minAccepted * 1e6));
        if (current !== undefined && current - session.baselineBalance >= minUnits) {
          session.status = 'confirmed';
          session.txHash = `trc20-bal-${session.nonce}`;
          return true;
        }
      }
    } else if (session.coinKey === 'USDT_BEP20') {
      const matchHash = await verifyEvmOrTronTokenTransfer({
        rpcUrl: BSC_RPC_URL,
        contractAddress: USDT_BEP20_CONTRACT,
        decimals: 18,
        recipientHex20: session.address,
        minAccepted,
        sessionCreatedAt: session.createdAt,
        submittedTxHash,
      });
      if (matchHash) {
        markTxClaimed(matchHash);
        session.status = 'confirmed';
        session.txHash = matchHash;
        return true;
      }

      if (!submittedTxHash && session.baselineBalance !== undefined) {
        const current = await readCurrentChainBalanceUnits('USDT_BEP20', session.address);
        const minUnits = BigInt(Math.floor(minAccepted * 1e6)) * 10n ** 12n;
        if (current !== undefined && current - session.baselineBalance >= minUnits) {
          session.status = 'confirmed';
          session.txHash = `bep20-bal-${session.nonce}`;
          return true;
        }
      }
    } else if (session.coinKey === 'USDT_ERC20') {
      const matchHash = await verifyEvmOrTronTokenTransfer({
        rpcUrl: ETH_RPC_URL,
        contractAddress: USDT_ERC20_CONTRACT,
        decimals: 6,
        recipientHex20: session.address,
        minAccepted,
        sessionCreatedAt: session.createdAt,
        submittedTxHash,
      });
      if (matchHash) {
        markTxClaimed(matchHash);
        session.status = 'confirmed';
        session.txHash = matchHash;
        return true;
      }

      if (!submittedTxHash && session.baselineBalance !== undefined) {
        const current = await readCurrentChainBalanceUnits('USDT_ERC20', session.address);
        const minUnits = BigInt(Math.floor(minAccepted * 1e6));
        if (current !== undefined && current - session.baselineBalance >= minUnits) {
          session.status = 'confirmed';
          session.txHash = `erc20-bal-${session.nonce}`;
          return true;
        }
      }
    } else if (session.coinKey === 'BTC') {
      const txs =
        (await fetchJsonWithTimeout(`https://mempool.space/api/address/${session.address}/txs`)) ||
        (await fetchJsonWithTimeout(`https://blockstream.info/api/address/${session.address}/txs`));
      if (Array.isArray(txs)) {
        for (const tx of txs.slice(0, 10)) {
          const txid = String(tx.txid || '');
          if (!txid || isTxClaimed(txid)) continue;
          const isUnconfirmedMempool = tx.status?.confirmed === false;
          const blockTime = tx.status?.block_time ? tx.status.block_time * 1000 : Date.now();
          if (isUnconfirmedMempool || blockTime >= session.createdAt - MAX_CLOCK_SKEW_MS) {
            let receivedBtc = 0;
            for (const out of tx.vout || []) {
              if (out.scriptpubkey_address === session.address) {
                receivedBtc += Number(out.value || 0) / 1e8;
              }
            }
            if (receivedBtc >= minAccepted) {
              markTxClaimed(txid);
              session.status = 'confirmed';
              session.txHash = txid;
              return true;
            }
          }
        }
      }
    } else if (session.coinKey === 'ETH') {
      if (submittedTxHash && !isTxClaimed(submittedTxHash)) {
        const [txRpc, receiptRpc] = await Promise.all([
          fetchJsonWithTimeout(ETH_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionByHash',
              params: [submittedTxHash],
            }),
          }),
          fetchJsonWithTimeout(ETH_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'eth_getTransactionReceipt',
              params: [submittedTxHash],
            }),
          }),
        ]);
        const tx = txRpc?.result;
        const receipt = receiptRpc?.result;
        if (
          tx &&
          receipt?.status === '0x1' &&
          tx.to?.toLowerCase() === session.address.toLowerCase()
        ) {
          const blockTime = await getEvmBlockTimestampMs(ETH_RPC_URL, receipt.blockNumber);
          const ethVal = Number(BigInt(tx.value || '0x0')) / 1e18;
          if (
            ethVal >= minAccepted &&
            (blockTime === null || blockTime >= session.createdAt - MAX_CLOCK_SKEW_MS)
          ) {
            markTxClaimed(submittedTxHash);
            session.status = 'confirmed';
            session.txHash = submittedTxHash;
            return true;
          }
        }
      }

      if (!submittedTxHash && session.baselineBalance !== undefined) {
        const current = await getEthNativeBalance(session.address);
        const minWei = BigInt(Math.floor(minAccepted * 1e18));
        if (current !== undefined && current - session.baselineBalance >= minWei) {
          session.status = 'confirmed';
          session.txHash = `eth-bal-${session.nonce}`;
          return true;
        }
      }
    } else if (session.coinKey === 'SOL') {
      if (submittedTxHash && !isTxClaimed(submittedTxHash)) {
        const txRpc = await fetchJsonWithTimeout(SOL_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [submittedTxHash, { encoding: 'json', maxSupportedTransactionVersion: 0 }],
          }),
        });
        const res = txRpc?.result;
        if (res && !res.meta?.err) {
          const blockTimeMs = res.blockTime ? res.blockTime * 1000 : Date.now();
          const rawKeys: any[] = res.transaction?.message?.accountKeys || [];
          const keys = rawKeys.map((k) => (typeof k === 'string' ? k : k?.pubkey || ''));
          const targetIdx = keys.findIndex((k) => k === session.address);
          if (targetIdx >= 0 && blockTimeMs >= session.createdAt - MAX_CLOCK_SKEW_MS) {
            const pre = Number(res.meta?.preBalances?.[targetIdx] || 0);
            const post = Number(res.meta?.postBalances?.[targetIdx] || 0);
            const receivedSol = (post - pre) / 1e9;
            if (receivedSol >= minAccepted) {
              markTxClaimed(submittedTxHash);
              session.status = 'confirmed';
              session.txHash = submittedTxHash;
              return true;
            }
          }
        }
      }

      if (!submittedTxHash && session.baselineBalance !== undefined) {
        const current = await getSolNativeBalance(session.address);
        const minLamports = BigInt(Math.floor(minAccepted * 1e9));
        if (current !== undefined && current - session.baselineBalance >= minLamports) {
          session.status = 'confirmed';
          session.txHash = `sol-bal-${session.nonce}`;
          return true;
        }
      }
    }
  } catch {
    return false;
  }

  return false;
}
