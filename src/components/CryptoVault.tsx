import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BackGlyph,
  BtcIcon,
  CheckGlyph,
  CopyGlyph,
  EthIcon,
  HashGlyph,
  SolIcon,
  StarSealIcon,
  UsdtIcon,
  WalletGlyph,
} from './CryptoIcons';
import {
  type ConnectedWallet,
  isWalletCompatibleWithCoin,
  sendPaymentWithWallet,
} from '../utils/web3Wallet';
import { playSoftTick } from '../utils/sound';

export type CoinKey = 'USDT_BEP20' | 'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH' | 'SOL';

export interface PaymentSessionData {
  id: string;
  coinKey: CoinKey;
  symbol: 'USDT' | 'BTC' | 'ETH' | 'SOL';
  network: string;
  address: string;
  usdAmount: number;
  cryptoAmount: string;
  paymentUri: string;
  qrSvg: string;
  status: 'pending' | 'confirmed';
  expiresAt: number;
}

interface CryptoVaultProps {
  session: PaymentSessionData | null;
  loadingSession: boolean;
  demoMode: boolean;
  enabledCoins: CoinKey[];
  selectedCoin: CoinKey;
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onChangeCoin: (coin: CoinKey) => void;
  onBack: () => void;
  onConfirmed: () => void;
}

const ALL_NETWORK_TABS: Array<{ key: CoinKey; label: string; icon: React.ReactNode }> = [
  { key: 'USDT_TRC20', label: 'TRC20', icon: <UsdtIcon size={13} /> },
  { key: 'USDT_BEP20', label: 'BEP20', icon: <UsdtIcon size={13} /> },
  { key: 'USDT_ERC20', label: 'ERC20', icon: <UsdtIcon size={13} /> },
  { key: 'BTC', label: 'BTC', icon: <BtcIcon size={13} /> },
  { key: 'ETH', label: 'ETH', icon: <EthIcon size={13} /> },
  { key: 'SOL', label: 'SOL', icon: <SolIcon size={12} /> },
];

export const CryptoVault: React.FC<CryptoVaultProps> = ({
  session,
  loadingSession,
  demoMode,
  enabledCoins,
  selectedCoin,
  connectedWallet,
  onOpenWalletModal,
  onChangeCoin,
  onBack,
  onConfirmed,
}) => {
  const [copiedField, setCopiedField] = useState<'amount' | 'address' | null>(null);
  const [showTxInput, setShowTxInput] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingWallet, setSendingWallet] = useState(false);
  const [walletNotice, setWalletNotice] = useState<string | null>(null);
  const [pulseError, setPulseError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1200);

  const visibleTabs = ALL_NETWORK_TABS.filter((t) => enabledCoins.includes(t.key));

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const update = () => {
      const rem = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setSecondsLeft(rem);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [session]);

  // Automatic background on-chain polling
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status/${session.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.status === 'confirmed') {
          clearInterval(poll);
          onConfirmed();
        }
      } catch {
        // Keep polling quietly
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [session, onConfirmed]);

  const copyText = async (value: string, field: 'amount' | 'address') => {
    playSoftTick();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField((prev) => (prev === field ? null : prev));
    }, 1800);
  };

  const verifyManualTx = async (hashOverride?: string) => {
    if (!session || verifying) return;
    setVerifying(true);
    playSoftTick();
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          txHash: hashOverride ?? txHash,
        }),
      });
      const data = await res.json();
      if (data.status === 'confirmed') {
        onConfirmed();
        return;
      }
      setPulseError(true);
      setTimeout(() => setPulseError(false), 700);
    } catch {
      setPulseError(true);
      setTimeout(() => setPulseError(false), 700);
    } finally {
      setVerifying(false);
    }
  };

  const compatibleConnected =
    session && isWalletCompatibleWithCoin(connectedWallet, session.coinKey);

  const handleWalletPayButton = async () => {
    playSoftTick();
    setWalletNotice(null);

    if (!session) return;

    if (!connectedWallet || !compatibleConnected) {
      onOpenWalletModal();
      return;
    }

    setSendingWallet(true);
    try {
      const submittedHash = await sendPaymentWithWallet({
        wallet: connectedWallet,
        coinKey: session.coinKey,
        toAddress: session.address,
        cryptoAmount: session.cryptoAmount,
      });
      if (submittedHash) {
        setTxHash(submittedHash);
        await verifyManualTx(submittedHash);
      }
    } catch (err: any) {
      setWalletNotice(err?.message || 'Transfer cancelled or unable to complete.');
    } finally {
      setSendingWallet(false);
    }
  };

  const handleDemoConfirm = async () => {
    if (!session || verifying) return;
    setVerifying(true);
    playSoftTick();
    try {
      const res = await fetch('/api/payment/demo-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (data.status === 'confirmed') {
        onConfirmed();
      }
    } finally {
      setVerifying(false);
    }
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const truncateAddr = (addr: string) =>
    addr.length > 20 ? `${addr.slice(0, 8)}···${addr.slice(-8)}` : addr;

  const symbolIcon =
    session?.symbol === 'USDT' ? (
      <UsdtIcon size={16} />
    ) : session?.symbol === 'BTC' ? (
      <BtcIcon size={16} />
    ) : session?.symbol === 'ETH' ? (
      <EthIcon size={16} />
    ) : (
      <SolIcon size={15} />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: '18px 20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '13px',
      }}
    >
      {/* Top minimal utility header: Back + Live Radar + Timer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={() => {
            playSoftTick();
            onBack();
          }}
          aria-label="Back"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid rgba(223, 192, 136, 0.18)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: 'rgba(229, 202, 147, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <BackGlyph size={15} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'rgba(229, 202, 147, 0.72)',
          }}
        >
          <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-flex' }}>
            <span
              className="radar-ring"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: '#e5ca93',
              }}
            />
            <span
              style={{
                position: 'relative',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#e5ca93',
              }}
            />
          </span>
          <span>
            {mins}:{secs}
          </span>
        </div>
      </div>

      {/* Network Switcher Strip */}
      {visibleTabs.length > 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)`,
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(223, 192, 136, 0.12)',
          }}
        >
          {visibleTabs.map((item) => {
            const active = selectedCoin === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (!active) {
                    playSoftTick();
                    onChangeCoin(item.key);
                  }
                }}
                style={{
                  padding: '7px 2px',
                  borderRadius: 8,
                  border: active
                    ? '1px solid rgba(229, 202, 147, 0.42)'
                    : '1px solid transparent',
                  background: active
                    ? 'linear-gradient(180deg, rgba(223, 192, 136, 0.18), rgba(223, 192, 136, 0.06))'
                    : 'transparent',
                  color: active ? '#f5e4bc' : 'rgba(243, 236, 224, 0.45)',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Precision SVG QR Frame */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '2px 0',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 162,
            height: 162,
            padding: 13,
            borderRadius: 18,
            background: 'radial-gradient(circle at 50% 50%, #111015 0%, #07070a 100%)',
            border: '1px solid rgba(223, 192, 136, 0.28)',
            boxShadow: 'inset 0 0 24px rgba(0, 0, 0, 0.85), 0 8px 24px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loadingSession || !session ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
              style={{ color: 'rgba(229, 202, 147, 0.65)' }}
            >
              <StarSealIcon size={24} />
            </motion.div>
          ) : (
            <>
              <div
                className="qr-container"
                style={{ width: '100%', height: '100%' }}
                dangerouslySetInnerHTML={{ __html: session.qrSvg }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: '#09090d',
                  border: '1px solid rgba(229, 202, 147, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f5e4bc',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.8)',
                }}
              >
                <StarSealIcon size={13} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Copyable Exact Amount & Wallet Address Rows */}
      {session && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => copyText(session.cryptoAmount, 'amount')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 11,
              border:
                copiedField === 'amount'
                  ? '1px solid rgba(229, 202, 147, 0.6)'
                  : '1px solid rgba(223, 192, 136, 0.16)',
              background: 'rgba(255, 255, 255, 0.025)',
              color: '#f5e4bc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.03em',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'rgba(229, 202, 147, 0.85)', display: 'inline-flex' }}>
                {symbolIcon}
              </span>
              <span>{session.cryptoAmount}</span>
              <span
                style={{
                  fontSize: 10.5,
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'rgba(223, 192, 136, 0.12)',
                  color: 'rgba(229, 202, 147, 0.8)',
                  fontWeight: 500,
                }}
              >
                {session.symbol} · {session.network}
              </span>
            </span>
            <span style={{ color: 'rgba(229, 202, 147, 0.75)', display: 'flex' }}>
              {copiedField === 'amount' ? <CheckGlyph size={15} /> : <CopyGlyph size={14} />}
            </span>
          </button>

          <button
            type="button"
            onClick={() => copyText(session.address, 'address')}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 11,
              border:
                copiedField === 'address'
                  ? '1px solid rgba(229, 202, 147, 0.6)'
                  : '1px solid rgba(223, 192, 136, 0.16)',
              background: 'rgba(255, 255, 255, 0.025)',
              color: 'rgba(243, 236, 224, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12.5,
              letterSpacing: '0.02em',
              transition: 'all 0.18s ease',
            }}
          >
            <span>{truncateAddr(session.address)}</span>
            <span style={{ color: 'rgba(229, 202, 147, 0.75)', display: 'flex' }}>
              {copiedField === 'address' ? <CheckGlyph size={15} /> : <CopyGlyph size={14} />}
            </span>
          </button>
        </div>
      )}

      {/* Optional TxHash Manual Check Bar */}
      <AnimatePresence>
        {showTxInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              x: pulseError ? [0, -5, 5, -3, 3, 0] : 0,
            }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', gap: 6, paddingTop: 2 }}>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste TxHash (0x...)"
                spellCheck={false}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 9,
                  border: pulseError
                    ? '1px solid rgba(235, 110, 95, 0.65)'
                    : '1px solid rgba(223, 192, 136, 0.24)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: '#f5e4bc',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => verifyManualTx()}
                disabled={verifying}
                style={{
                  width: 38,
                  borderRadius: 9,
                  border: '1px solid rgba(229, 202, 147, 0.4)',
                  background: 'rgba(223, 192, 136, 0.16)',
                  color: '#f5e4bc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <CheckGlyph size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {walletNotice && (
        <div
          style={{
            fontSize: 11.5,
            color: 'rgba(245, 228, 188, 0.8)',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {walletNotice}
        </div>
      )}

      {/* Primary Web3 Wallet Connect & Pay Bar + TxHash + Optional Demo Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: 2,
        }}
      >
        <button
          type="button"
          onClick={handleWalletPayButton}
          disabled={sendingWallet}
          className="luxury-action-btn"
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: 'none',
            color: '#18130a',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <WalletGlyph size={16} />
          <span>
            {sendingWallet
              ? 'Awaiting Wallet...'
              : compatibleConnected
              ? `Pay with ${connectedWallet?.providerName}`
              : 'Connect & Pay'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playSoftTick();
            setShowTxInput((v) => !v);
          }}
          title="Verify TxHash"
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            border: showTxInput
              ? '1px solid rgba(229, 202, 147, 0.55)'
              : '1px solid rgba(223, 192, 136, 0.24)',
            background: showTxInput
              ? 'rgba(223, 192, 136, 0.14)'
              : 'rgba(255, 255, 255, 0.03)',
            color: '#e5ca93',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <HashGlyph size={16} />
        </button>

        {demoMode && (
          <button
            type="button"
            onClick={handleDemoConfirm}
            disabled={verifying}
            title="Simulate Confirmation"
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: '1px solid rgba(229, 202, 147, 0.42)',
              background: 'rgba(229, 202, 147, 0.12)',
              color: '#f5e4bc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <CheckGlyph size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
