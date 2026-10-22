import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AmbientDust } from './components/AmbientDust';
import { WishBoxStage, type RatesMap } from './components/WishBoxStage';
import { type CoinKey, type PaymentSessionData } from './components/CryptoVault';
import { MessageReveal } from './components/MessageReveal';
import { WalletModal } from './components/WalletModal';
import { WalletGlyph } from './components/CryptoIcons';
import { type ConnectedWallet } from './utils/web3Wallet';
import { pickNextSacredMessage } from './data/messages';
import { playSoftTick, playWishDrop } from './utils/sound';

type FlowStage = 'writing' | 'paying' | 'dropping' | 'revealed';

const DEFAULT_PRESETS = [5, 10, 25, 50, 100];
const DEFAULT_COINS: CoinKey[] = [
  'USDT_BEP20',
  'USDT_TRC20',
  'USDT_ERC20',
  'BTC',
  'ETH',
  'SOL',
];

export const App: React.FC = () => {
  const [stage, setStage] = useState<FlowStage>('writing');
  const [wishText, setWishText] = useState('');
  const [presets, setPresets] = useState<number[]>(DEFAULT_PRESETS);
  const [enabledCoins, setEnabledCoins] = useState<CoinKey[]>(DEFAULT_COINS);
  const [usdAmount, setUsdAmount] = useState<number>(10);
  const [rawCustomInput, setRawCustomInput] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<CoinKey>('USDT_BEP20');
  const [rates, setRates] = useState<RatesMap>({
    USDT: 1,
    BTC: 96400,
    ETH: 3320,
    SOL: 192,
  });
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [session, setSession] = useState<PaymentSessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [sacredCard, setSacredCard] = useState<{ message: string; numeral: string }>({
    message: '',
    numeral: 'I',
  });

  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.presets) && data.presets.length === 5) {
          setPresets(data.presets);
        }
        if (typeof data.demoMode === 'boolean') {
          setDemoMode(data.demoMode);
        }
        if (data.wallets && typeof data.wallets === 'object') {
          const active = DEFAULT_COINS.filter(
            (k) => data.wallets[k]?.enabled && data.wallets[k]?.address
          );
          if (active.length > 0) {
            setEnabledCoins(active);
            const def = data.defaultCurrency as CoinKey;
            setSelectedCoin(active.includes(def) ? def : active[0]);
          }
        }
        if (data.rates) {
          setRates(data.rates);
        }
      })
      .catch(() => {});
  }, []);

  const initiatePaymentSession = useCallback(async (coin: CoinKey, amount: number) => {
    setLoadingSession(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usdAmount: amount > 0 ? amount : 10,
          coinKey: coin,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        if (typeof data.demoMode === 'boolean') {
          setDemoMode(data.demoMode);
        }
      }
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const handleSealAndPay = () => {
    const finalAmt = usdAmount > 0 ? usdAmount : 10;
    setStage('paying');
    initiatePaymentSession(selectedCoin, finalAmt);
  };

  const handleChangeCoin = (nextCoin: CoinKey) => {
    setSelectedCoin(nextCoin);
    if (stage === 'paying') {
      initiatePaymentSession(nextCoin, usdAmount > 0 ? usdAmount : 10);
    }
  };

  const handleWalletConnected = (wallet: ConnectedWallet) => {
    setConnectedWallet(wallet);
    let targetCoin: CoinKey | null = null;
    if (wallet.ecosystem === 'TRON' && enabledCoins.includes('USDT_TRC20')) {
      targetCoin = 'USDT_TRC20';
    } else if (wallet.ecosystem === 'SOL' && enabledCoins.includes('SOL')) {
      targetCoin = 'SOL';
    } else if (wallet.ecosystem === 'BTC' && enabledCoins.includes('BTC')) {
      targetCoin = 'BTC';
    } else if (wallet.ecosystem === 'EVM') {
      if (
        selectedCoin !== 'USDT_BEP20' &&
        selectedCoin !== 'USDT_ERC20' &&
        selectedCoin !== 'ETH'
      ) {
        targetCoin = enabledCoins.includes('USDT_BEP20')
          ? 'USDT_BEP20'
          : enabledCoins.includes('USDT_ERC20')
          ? 'USDT_ERC20'
          : enabledCoins.includes('ETH')
          ? 'ETH'
          : null;
      }
    }
    if (targetCoin && targetCoin !== selectedCoin) {
      setSelectedCoin(targetCoin);
      if (stage === 'paying') {
        initiatePaymentSession(targetCoin, usdAmount > 0 ? usdAmount : 10);
      }
    }
  };

  const handlePaymentConfirmed = useCallback(() => {
    if (stage === 'dropping' || stage === 'revealed') return;
    const chosen = pickNextSacredMessage();
    setSacredCard(chosen);
    setStage('dropping');
    playWishDrop();

    setTimeout(() => {
      setWishText('');
      setSession(null);
      setStage('revealed');
    }, 1050);
  }, [stage]);

  const handleSelectPreset = (val: number) => {
    setRawCustomInput('');
    setUsdAmount(val);
  };

  const handleCustomInputChange = (raw: string) => {
    setRawCustomInput(raw);
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setUsdAmount(parsed);
    }
  };

  const handleReset = () => {
    setWishText('');
    setSession(null);
    setStage('writing');
  };

  const ambientIntensity =
    stage === 'revealed'
      ? 0.9
      : stage === 'dropping'
      ? 1
      : Math.min(0.85, wishText.length / 45);

  return (
    <main
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 18px 34px',
        position: 'relative',
      }}
    >
      <AmbientDust intensity={ambientIntensity} />

      {/* Top-Right Sleek Glass Connect Wallet Button */}
      <button
        type="button"
        onClick={() => {
          playSoftTick();
          setWalletModalOpen(true);
        }}
        style={{
          position: 'fixed',
          top: 18,
          right: 20,
          zIndex: 40,
          height: 40,
          padding: '0 16px',
          borderRadius: 12,
          border: connectedWallet
            ? '1px solid rgba(229, 202, 147, 0.55)'
            : '1px solid rgba(223, 192, 136, 0.28)',
          background: 'linear-gradient(180deg, rgba(24, 23, 31, 0.88), rgba(11, 11, 15, 0.92))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#f5efe3',
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: '0.03em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          transition: 'all 0.2s ease',
        }}
      >
        {connectedWallet ? (
          <>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#a3e8bc',
                boxShadow: '0 0 8px rgba(163, 232, 188, 0.8)',
              }}
            />
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5 }}>
              {connectedWallet.address.slice(0, 6)}···{connectedWallet.address.slice(-4)}
            </span>
          </>
        ) : (
          <>
            <span style={{ color: '#e5ca93', display: 'flex' }}>
              <WalletGlyph size={15} />
            </span>
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      <WalletModal
        open={walletModalOpen}
        connectedWallet={connectedWallet}
        preferredCoin={selectedCoin}
        onClose={() => setWalletModalOpen(false)}
        onConnected={handleWalletConnected}
        onDisconnect={() => setConnectedWallet(null)}
      />

      <AnimatePresence mode="wait">
        {stage === 'revealed' ? (
          <MessageReveal
            key="message-reveal"
            message={sacredCard.message}
            numeral={sacredCard.numeral}
            onReset={handleReset}
          />
        ) : (
          <WishBoxStage
            key="wish-box"
            stage={stage}
            wishText={wishText}
            onChangeWish={setWishText}
            usdAmount={usdAmount}
            rawCustomInput={rawCustomInput}
            onSelectPreset={handleSelectPreset}
            onCustomInputChange={handleCustomInputChange}
            presets={presets}
            enabledCoins={enabledCoins}
            selectedCoin={selectedCoin}
            connectedWallet={connectedWallet}
            onOpenWalletModal={() => setWalletModalOpen(true)}
            onSelectCoin={handleChangeCoin}
            rates={rates}
            demoMode={demoMode}
            session={session}
            loadingSession={loadingSession}
            onSealAndPay={handleSealAndPay}
            onBackToEdit={() => setStage('writing')}
            onPaymentConfirmed={handlePaymentConfirmed}
          />
        )}
      </AnimatePresence>
    </main>
  );
};
