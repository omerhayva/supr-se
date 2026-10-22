import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type ConnectedWallet,
  type WalletProviderId,
  connectWalletById,
  detectInstalledWallets,
} from '../utils/web3Wallet';
import { StarSealIcon, WalletGlyph } from './CryptoIcons';
import { playSoftTick } from '../utils/sound';

interface WalletModalProps {
  open: boolean;
  connectedWallet: ConnectedWallet | null;
  preferredCoin?: string;
  onClose: () => void;
  onConnected: (wallet: ConnectedWallet) => void;
  onDisconnect: () => void;
}

interface WalletOption {
  id: WalletProviderId;
  name: string;
  chains: string;
  accent: string;
  icon: React.ReactNode;
}

const TrustShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.5L4.5 5.8V11.6C4.5 16.55 7.7 20.95 12 22.2C16.3 20.95 19.5 16.55 19.5 11.6V5.8L12 2.5Z"
      stroke="#3396FF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M12 2.5V22.2C16.3 20.95 19.5 16.55 19.5 11.6V5.8L12 2.5Z"
      fill="#3396FF"
      fillOpacity="0.28"
    />
  </svg>
);

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'trust',
    name: 'Trust Wallet',
    chains: 'BEP20 · ERC20 · TRC20 · Multi-Chain',
    accent: '#3396FF',
    icon: <TrustShieldIcon />,
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    chains: 'BEP20 · ERC20 · ETH',
    accent: '#F6851B',
    icon: <span style={{ fontWeight: 700, fontSize: 13 }}>M</span>,
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    chains: 'BEP20 · TRC20 · ERC20 · BTC · SOL',
    accent: '#E5CA93',
    icon: <span style={{ fontWeight: 700, fontSize: 10.5 }}>OKX</span>,
  },
  {
    id: 'tronlink',
    name: 'TronLink',
    chains: 'TRON · USDT (TRC20)',
    accent: '#EB0029',
    icon: <span style={{ fontWeight: 700, fontSize: 13 }}>T</span>,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    chains: 'Solana (SOL)',
    accent: '#AB9FF2',
    icon: <span style={{ fontWeight: 700, fontSize: 13 }}>P</span>,
  },
  {
    id: 'unisat',
    name: 'UniSat',
    chains: 'Bitcoin (BTC)',
    accent: '#F7931A',
    icon: <span style={{ fontWeight: 700, fontSize: 13 }}>₿</span>,
  },
];

export const WalletModal: React.FC<WalletModalProps> = ({
  open,
  connectedWallet,
  preferredCoin,
  onClose,
  onConnected,
  onDisconnect,
}) => {
  const [connectingId, setConnectingId] = useState<WalletProviderId | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const detected = useMemo(() => detectInstalledWallets(), [open]);

  const handleSelect = async (id: WalletProviderId) => {
    playSoftTick();
    setErrorMsg(null);
    setConnectingId(id);
    try {
      const connected = await connectWalletById(id, preferredCoin);
      onConnected(connected);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to connect wallet.');
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(3, 3, 5, 0.84)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 405,
              borderRadius: 20,
              background: 'linear-gradient(180deg, #15141b 0%, #0b0b0f 100%)',
              border: '1px solid rgba(223, 192, 136, 0.32)',
              boxShadow: '0 30px 75px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255,245,224,0.1)',
              padding: '22px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ color: '#e5ca93', display: 'flex' }}>
                  <WalletGlyph size={17} />
                </span>
                <span
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: 21,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: '#f5efe3',
                  }}
                >
                  Connect Wallet
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px solid rgba(223, 192, 136, 0.16)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'rgba(243, 236, 224, 0.65)',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Active Connected Banner */}
            {connectedWallet && (
              <div
                style={{
                  padding: '11px 13px',
                  borderRadius: 12,
                  background: 'rgba(229, 202, 147, 0.08)',
                  border: '1px solid rgba(229, 202, 147, 0.32)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 12, color: '#f5e4bc', fontWeight: 600 }}>
                    {connectedWallet.providerName}
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11.5,
                      color: 'rgba(243, 236, 224, 0.72)',
                    }}
                  >
                    {connectedWallet.address.slice(0, 8)}···{connectedWallet.address.slice(-6)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSoftTick();
                    onDisconnect();
                  }}
                  style={{
                    padding: '6px 11px',
                    borderRadius: 8,
                    border: '1px solid rgba(235, 125, 110, 0.35)',
                    background: 'rgba(235, 125, 110, 0.09)',
                    color: '#f2b8b0',
                    fontSize: 11.5,
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}

            {/* Wallet Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WALLET_OPTIONS.map((w, idx) => {
                const isInstalled = detected[w.id];
                const isBusy = connectingId === w.id;
                const isFeatured = idx === 0;
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={connectingId !== null}
                    onClick={() => handleSelect(w.id)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: isFeatured
                        ? '1px solid rgba(51, 150, 255, 0.38)'
                        : '1px solid rgba(223, 192, 136, 0.15)',
                      background: isFeatured
                        ? 'linear-gradient(90deg, rgba(51, 150, 255, 0.09), rgba(255, 255, 255, 0.02))'
                        : 'rgba(255, 255, 255, 0.025)',
                      color: '#f3ece0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${w.accent}55`,
                          color: w.accent,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11.5,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isBusy ? <StarSealIcon size={14} /> : w.icon}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#f6efe3' }}>
                          {w.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: 'rgba(229, 202, 147, 0.58)',
                            fontFamily: '"JetBrains Mono", monospace',
                          }}
                        >
                          {w.chains}
                        </div>
                      </div>
                    </div>

                    {isInstalled ? (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: 'rgba(134, 219, 165, 0.12)',
                          border: '1px solid rgba(134, 219, 165, 0.3)',
                          color: '#a3e8bc',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        Ready
                      </span>
                    ) : isFeatured ? (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: 'rgba(51, 150, 255, 0.12)',
                          border: '1px solid rgba(51, 150, 255, 0.3)',
                          color: '#8cc4ff',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        Recommended
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'rgba(229, 202, 147, 0.07)',
                  border: '1px solid rgba(229, 202, 147, 0.24)',
                  color: 'rgba(245, 228, 188, 0.88)',
                  fontSize: 12,
                  lineHeight: 1.45,
                  textAlign: 'center',
                }}
              >
                {errorMsg}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
