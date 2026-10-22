import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export type WalletEcosystem = 'EVM' | 'TRON' | 'SOL' | 'BTC';

export type CoinKeyType =
  | 'USDT_BEP20'
  | 'USDT_TRC20'
  | 'USDT_ERC20'
  | 'BTC'
  | 'ETH'
  | 'SOL';

export type WalletProviderId =
  | 'trust'
  | 'metamask'
  | 'okx'
  | 'tronlink'
  | 'phantom'
  | 'unisat';

export interface ConnectedWallet {
  providerId: WalletProviderId;
  providerName: string;
  ecosystem: WalletEcosystem;
  address: string;
}

const USDT_ERC20_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_BEP20_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const SOLANA_RPC_ENDPOINTS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];

const win = () => window as Record<string, any>;

export function detectInstalledWallets(): Record<WalletProviderId, boolean> {
  if (typeof window === 'undefined') {
    return {
      trust: false,
      metamask: false,
      okx: false,
      tronlink: false,
      phantom: false,
      unisat: false,
    };
  }
  const w = win();
  return {
    trust: Boolean(w.trustwallet || w.ethereum?.isTrust),
    metamask: Boolean(w.ethereum?.isMetaMask || w.ethereum),
    okx: Boolean(w.okxwallet),
    tronlink: Boolean(w.tronLink || w.tronWeb || w.trustwallet?.tronLink),
    phantom: Boolean(w.phantom?.solana || w.solana?.isPhantom || w.solana || w.trustwallet?.solana),
    unisat: Boolean(w.unisat),
  };
}

function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openMobileDeepLink(providerId: WalletProviderId, preferredCoin?: string): void {
  const href = window.location.href;
  const cleanHostPath = href.replace(/^https?:\/\//, '');
  const encoded = encodeURIComponent(href);

  switch (providerId) {
    case 'trust': {
      // 20000714 = BNB Smart Chain, 195 = TRON, 501 = Solana, 60 = Ethereum
      const coinId =
        preferredCoin === 'USDT_BEP20'
          ? 20000714
          : preferredCoin === 'USDT_TRC20'
          ? 195
          : preferredCoin === 'SOL'
          ? 501
          : 60;
      window.open(
        `https://link.trustwallet.com/open_url?coin_id=${coinId}&url=${encoded}`,
        '_blank',
        'noopener'
      );
      break;
    }
    case 'metamask':
      window.open(`https://metamask.app.link/dapp/${cleanHostPath}`, '_blank', 'noopener');
      break;
    case 'okx':
      window.open(
        `https://www.okx.com/download?deeplink=${encodeURIComponent(
          'okx://wallet/dapp/details?dappUrl=' + encoded
        )}`,
        '_blank',
        'noopener'
      );
      break;
    case 'phantom':
      window.open(`https://phantom.app/ul/browse/${encoded}?ref=${encoded}`, '_blank', 'noopener');
      break;
    case 'tronlink':
      window.open('https://www.tronlink.org/', '_blank', 'noopener');
      break;
    case 'unisat':
      window.open('https://unisat.io/', '_blank', 'noopener');
      break;
  }
}

function getEvmProvider(providerId: WalletProviderId): any {
  const w = win();
  if (providerId === 'trust' && w.trustwallet) return w.trustwallet;
  if (providerId === 'okx' && w.okxwallet) return w.okxwallet;
  if (w.ethereum?.providers && Array.isArray(w.ethereum.providers)) {
    if (providerId === 'trust') {
      const tw = w.ethereum.providers.find((p: any) => p.isTrust);
      if (tw) return tw;
    }
    if (providerId === 'metamask') {
      const mm = w.ethereum.providers.find((p: any) => p.isMetaMask);
      if (mm) return mm;
    }
  }
  return w.trustwallet || w.ethereum || w.okxwallet || null;
}

export async function connectWalletById(
  providerId: WalletProviderId,
  preferredCoin?: string
): Promise<ConnectedWallet> {
  const w = win();

  // 1. TRON (TronLink / Trust Wallet TRON / OKX TRON)
  if (
    providerId === 'tronlink' ||
    (providerId === 'trust' && preferredCoin === 'USDT_TRC20' && w.trustwallet?.tronLink) ||
    (providerId === 'okx' && preferredCoin === 'USDT_TRC20' && w.okxwallet?.tronLink)
  ) {
    const tron =
      providerId === 'okx'
        ? w.okxwallet?.tronLink
        : providerId === 'trust' && w.trustwallet?.tronLink
        ? w.trustwallet.tronLink
        : w.tronLink;
    const tronWeb = tron?.tronWeb || w.tronWeb;

    if (!tron && !tronWeb) {
      if (isMobileBrowser()) openMobileDeepLink(providerId, preferredCoin);
      throw new Error('TRON extension not detected. Scan QR or open inside Trust Wallet / TronLink app.');
    }

    if (tron?.request) {
      await tron.request({ method: 'tron_requestAccounts' });
    }
    const addr =
      tron?.tronWeb?.defaultAddress?.base58 ||
      tronWeb?.defaultAddress?.base58 ||
      w.tronWeb?.defaultAddress?.base58;
    if (!addr) {
      throw new Error('Please unlock your wallet and try again.');
    }
    return {
      providerId,
      providerName:
        providerId === 'trust'
          ? 'Trust Wallet (TRON)'
          : providerId === 'okx'
          ? 'OKX Wallet (TRON)'
          : 'TronLink',
      ecosystem: 'TRON',
      address: String(addr),
    };
  }

  // 2. SOLANA (Phantom / Trust Solana / OKX Solana)
  if (
    providerId === 'phantom' ||
    (providerId === 'trust' && preferredCoin === 'SOL' && w.trustwallet?.solana) ||
    (providerId === 'okx' && preferredCoin === 'SOL' && w.okxwallet?.solana)
  ) {
    const sol =
      providerId === 'okx'
        ? w.okxwallet?.solana
        : providerId === 'trust' && w.trustwallet?.solana
        ? w.trustwallet.solana
        : w.phantom?.solana || w.solana;
    if (!sol) {
      if (isMobileBrowser()) openMobileDeepLink(providerId, preferredCoin);
      throw new Error('Solana wallet extension not detected. Scan QR or open in Trust / Phantom app.');
    }
    const resp = await sol.connect();
    const pubKey = resp?.publicKey?.toString?.() || sol.publicKey?.toString?.();
    if (!pubKey) throw new Error('Wallet connection declined.');
    return {
      providerId,
      providerName:
        providerId === 'trust'
          ? 'Trust Wallet (SOL)'
          : providerId === 'okx'
          ? 'OKX Wallet (SOL)'
          : 'Phantom',
      ecosystem: 'SOL',
      address: pubKey,
    };
  }

  // 3. BITCOIN (UniSat / OKX BTC)
  if (
    providerId === 'unisat' ||
    (providerId === 'okx' && preferredCoin === 'BTC' && w.okxwallet?.bitcoin)
  ) {
    if (providerId === 'okx' && w.okxwallet?.bitcoin) {
      const res = await w.okxwallet.bitcoin.connect();
      if (!res?.address) throw new Error('Unable to read BTC address.');
      return {
        providerId: 'okx',
        providerName: 'OKX Wallet (BTC)',
        ecosystem: 'BTC',
        address: String(res.address),
      };
    }
    if (!w.unisat) {
      if (isMobileBrowser()) openMobileDeepLink('unisat', preferredCoin);
      throw new Error('Bitcoin browser extension not detected. Scan QR directly from Trust Wallet.');
    }
    const accounts = await w.unisat.requestAccounts();
    if (!accounts?.[0]) throw new Error('Wallet connection declined.');
    return {
      providerId: 'unisat',
      providerName: 'UniSat Wallet',
      ecosystem: 'BTC',
      address: String(accounts[0]),
    };
  }

  // 4. EVM (Trust Wallet / MetaMask / OKX EVM)
  const evm = getEvmProvider(providerId);
  if (!evm) {
    openMobileDeepLink(providerId, preferredCoin);
    throw new Error(
      providerId === 'trust'
        ? 'Opening Trust Wallet link — or install Trust Wallet browser extension / scan QR.'
        : 'Web3 wallet extension not detected in browser.'
    );
  }

  const accounts = await evm.request({ method: 'eth_requestAccounts' });
  if (!accounts?.[0]) {
    throw new Error('Wallet authorization declined.');
  }

  const names: Record<string, string> = {
    trust: 'Trust Wallet',
    metamask: 'MetaMask',
    okx: 'OKX Wallet',
  };

  return {
    providerId,
    providerName: names[providerId] || 'Web3 Wallet',
    ecosystem: 'EVM',
    address: String(accounts[0]),
  };
}

function decimalToUnitsBigInt(amountStr: string, decimals: number): bigint {
  const [whole = '0', frac = ''] = amountStr.trim().split('.');
  const paddedFrac = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFrac || '0');
}

async function ensureEvmChain(evm: any, chainHex: '0x1' | '0x38'): Promise<void> {
  try {
    await evm.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainHex }],
    });
  } catch (err: any) {
    if (chainHex === '0x38' && (err?.code === 4902 || String(err?.message).includes('Unrecognized'))) {
      await evm.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/'],
          },
        ],
      });
    }
  }
}

export async function sendPaymentWithWallet(params: {
  wallet: ConnectedWallet;
  coinKey: CoinKeyType;
  toAddress: string;
  cryptoAmount: string;
}): Promise<string> {
  const { wallet, coinKey, toAddress, cryptoAmount } = params;
  const w = win();

  // EVM: USDT_BEP20, USDT_ERC20, or ETH
  if (coinKey === 'USDT_BEP20' || coinKey === 'USDT_ERC20' || coinKey === 'ETH') {
    const evm = getEvmProvider(wallet.providerId);
    if (!evm) throw new Error('EVM wallet provider not found.');

    await ensureEvmChain(evm, coinKey === 'USDT_BEP20' ? '0x38' : '0x1');

    const accounts = await evm.request({ method: 'eth_requestAccounts' });
    const from = accounts?.[0] || wallet.address;

    if (coinKey === 'ETH') {
      const wei = decimalToUnitsBigInt(cryptoAmount, 18);
      const txHash = await evm.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from,
            to: toAddress,
            value: '0x' + wei.toString(16),
          },
        ],
      });
      return String(txHash);
    }

    const isBsc = coinKey === 'USDT_BEP20';
    const units = decimalToUnitsBigInt(cryptoAmount, isBsc ? 18 : 6);
    const cleanRecipient = toAddress.replace(/^0x/i, '').toLowerCase().padStart(64, '0');
    const hexAmount = units.toString(16).padStart(64, '0');
    const data = `0xa9059cbb${cleanRecipient}${hexAmount}`;
    const txHash = await evm.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from,
          to: isBsc ? USDT_BEP20_CONTRACT : USDT_ERC20_CONTRACT,
          data,
        },
      ],
    });
    return String(txHash);
  }

  // TRON: USDT_TRC20
  if (coinKey === 'USDT_TRC20') {
    const tronWeb =
      wallet.providerId === 'okx'
        ? w.okxwallet?.tronLink?.tronWeb
        : wallet.providerId === 'trust' && w.trustwallet?.tronLink?.tronWeb
        ? w.trustwallet.tronLink.tronWeb
        : w.tronLink?.tronWeb || w.tronWeb;
    if (!tronWeb) {
      throw new Error('Connect TronLink / Trust TRON extension, or scan QR code.');
    }
    const sunUnits = decimalToUnitsBigInt(cryptoAmount, 6).toString();
    const contract = await tronWeb.contract().at(USDT_TRC20_CONTRACT);
    const txId = await contract.transfer(toAddress, sunUnits).send();
    return String(txId);
  }

  // SOLANA: SOL
  if (coinKey === 'SOL') {
    const sol =
      wallet.providerId === 'okx'
        ? w.okxwallet?.solana
        : wallet.providerId === 'trust' && w.trustwallet?.solana
        ? w.trustwallet.solana
        : w.phantom?.solana || w.solana;
    if (!sol) throw new Error('Solana wallet not found.');
    if (!sol.publicKey) {
      await sol.connect();
    }

    let blockhash = '';
    for (const rpc of SOLANA_RPC_ENDPOINTS) {
      try {
        const conn = new Connection(rpc, 'confirmed');
        const latest = await conn.getLatestBlockhash('confirmed');
        blockhash = latest.blockhash;
        if (blockhash) break;
      } catch {
        // Fallback RPC
      }
    }
    if (!blockhash) {
      throw new Error('Unable to reach Solana RPC; please transfer via QR code.');
    }

    const lamports = Number(
      (decimalToUnitsBigInt(cryptoAmount, 9) * BigInt(LAMPORTS_PER_SOL)) / 1_000_000_000n
    );
    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: new PublicKey(sol.publicKey.toString()),
    }).add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(sol.publicKey.toString()),
        toPubkey: new PublicKey(toAddress),
        lamports,
      })
    );

    const signed = await sol.signAndSendTransaction(tx);
    return String(signed?.signature || signed);
  }

  // BITCOIN: BTC
  if (coinKey === 'BTC') {
    const sats = Number(decimalToUnitsBigInt(cryptoAmount, 8));
    if (wallet.providerId === 'okx' && w.okxwallet?.bitcoin) {
      const txid = await w.okxwallet.bitcoin.sendBitcoin(toAddress, sats);
      return String(txid);
    }
    if (w.unisat) {
      const txid = await w.unisat.sendBitcoin(toAddress, sats);
      return String(txid);
    }
    throw new Error('Bitcoin extension not found; please scan QR code.');
  }

  throw new Error('Unsupported network.');
}

export function isWalletCompatibleWithCoin(
  wallet: ConnectedWallet | null,
  coinKey: CoinKeyType
): boolean {
  if (!wallet) return false;
  if (coinKey === 'USDT_BEP20' || coinKey === 'USDT_ERC20' || coinKey === 'ETH') {
    return wallet.ecosystem === 'EVM';
  }
  if (coinKey === 'USDT_TRC20') return wallet.ecosystem === 'TRON';
  if (coinKey === 'SOL') return wallet.ecosystem === 'SOL';
  if (coinKey === 'BTC') return wallet.ecosystem === 'BTC';
  return false;
}
