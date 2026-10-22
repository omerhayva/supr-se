export interface RatesMap {
  USDT: number;
  BTC: number;
  ETH: number;
  SOL: number;
}

const DEFAULT_RATES: RatesMap = {
  USDT: 1,
  BTC: 96400,
  ETH: 3320,
  SOL: 192,
};

let cachedRates: RatesMap = { ...DEFAULT_RATES };
let lastFetched = 0;

export async function getCryptoRates(): Promise<RatesMap> {
  const now = Date.now();
  if (now - lastFetched < 45_000) {
    return cachedRates;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D',
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as Array<{ symbol: string; price: string }>;
      const next: RatesMap = { ...cachedRates, USDT: 1 };
      for (const item of data) {
        const val = parseFloat(item.price);
        if (!Number.isNaN(val) && val > 0) {
          if (item.symbol === 'BTCUSDT') next.BTC = val;
          if (item.symbol === 'ETHUSDT') next.ETH = val;
          if (item.symbol === 'SOLUSDT') next.SOL = val;
        }
      }
      cachedRates = next;
      lastFetched = now;
      return cachedRates;
    }
  } catch {
    // Fallback gracefully to CoinGecko or cached defaults
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd',
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as Record<string, { usd?: number }>;
      cachedRates = {
        USDT: 1,
        BTC: data.bitcoin?.usd || cachedRates.BTC,
        ETH: data.ethereum?.usd || cachedRates.ETH,
        SOL: data.solana?.usd || cachedRates.SOL,
      };
      lastFetched = now;
    }
  } catch {
    lastFetched = now;
  }

  return cachedRates;
}
