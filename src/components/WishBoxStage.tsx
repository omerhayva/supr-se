import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BtcIcon, EthIcon, SolIcon, StarSealIcon, UsdtIcon } from './CryptoIcons';
import { type CoinKey, CryptoVault, type PaymentSessionData } from './CryptoVault';
import { type ConnectedWallet } from '../utils/web3Wallet';
import { playSoftTick } from '../utils/sound';

export interface RatesMap {
  USDT: number;
  BTC: number;
  ETH: number;
  SOL: number;
}

interface WishBoxStageProps {
  stage: 'writing' | 'paying' | 'dropping';
  wishText: string;
  onChangeWish: (val: string) => void;
  usdAmount: number;
  rawCustomInput: string;
  onSelectPreset: (val: number) => void;
  onCustomInputChange: (raw: string) => void;
  presets: number[];
  enabledCoins: CoinKey[];
  selectedCoin: CoinKey;
  connectedWallet: ConnectedWallet | null;
  onOpenWalletModal: () => void;
  onSelectCoin: (coin: CoinKey) => void;
  rates: RatesMap;
  demoMode: boolean;
  session: PaymentSessionData | null;
  loadingSession: boolean;
  onSealAndPay: () => void;
  onBackToEdit: () => void;
  onPaymentConfirmed: () => void;
}

export const WishBoxStage: React.FC<WishBoxStageProps> = ({
  stage,
  wishText,
  onChangeWish,
  usdAmount,
  rawCustomInput,
  onSelectPreset,
  onCustomInputChange,
  presets,
  enabledCoins,
  selectedCoin,
  connectedWallet,
  onOpenWalletModal,
  onSelectCoin,
  rates,
  demoMode,
  session,
  loadingSession,
  onSealAndPay,
  onBackToEdit,
  onPaymentConfirmed,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);

  const handleTriggerSeal = () => {
    if (!wishText.trim()) {
      playSoftTick();
      setNudgeCount((c) => c + 1);
      textareaRef.current?.focus();
      return;
    }
    playSoftTick();
    onSealAndPay();
  };

  const paperY = stage === 'writing' ? 0 : stage === 'paying' ? 148 : 245;

  const previewCryptoNumber = (() => {
    const amt = usdAmount > 0 ? usdAmount : 0;
    if (selectedCoin === 'BTC') {
      return (amt / (rates.BTC || 96400)).toFixed(6);
    }
    if (selectedCoin === 'ETH') {
      return (amt / (rates.ETH || 3320)).toFixed(5);
    }
    if (selectedCoin === 'SOL') {
      return (amt / (rates.SOL || 192)).toFixed(4);
    }
    return amt.toFixed(2);
  })();

  const activeCoinGlyph =
    selectedCoin === 'BTC' ? (
      <BtcIcon size={14} />
    ) : selectedCoin === 'ETH' ? (
      <EthIcon size={14} />
    ) : selectedCoin === 'SOL' ? (
      <SolIcon size={13} />
    ) : (
      <UsdtIcon size={14} />
    );

  const defaultUsdtKey: CoinKey = enabledCoins.includes('USDT_BEP20')
    ? 'USDT_BEP20'
    : enabledCoins.includes('USDT_TRC20')
    ? 'USDT_TRC20'
    : 'USDT_ERC20';

  const coinGroups = (
    [
      {
        group: 'USDT' as const,
        defaultKey: defaultUsdtKey,
        visible:
          enabledCoins.includes('USDT_BEP20') ||
          enabledCoins.includes('USDT_TRC20') ||
          enabledCoins.includes('USDT_ERC20'),
        icon: <UsdtIcon size={16} />,
      },
      {
        group: 'BTC' as const,
        defaultKey: 'BTC' as CoinKey,
        visible: enabledCoins.includes('BTC'),
        icon: <BtcIcon size={16} />,
      },
      {
        group: 'ETH' as const,
        defaultKey: 'ETH' as CoinKey,
        visible: enabledCoins.includes('ETH'),
        icon: <EthIcon size={16} />,
      },
      {
        group: 'SOL' as const,
        defaultKey: 'SOL' as CoinKey,
        visible: enabledCoins.includes('SOL'),
        icon: <SolIcon size={15} />,
      },
    ] as const
  ).filter((g) => g.visible);

  const isGroupCoinActive = (group: 'USDT' | 'BTC' | 'ETH' | 'SOL') => {
    if (group === 'USDT') {
      return (
        selectedCoin === 'USDT_BEP20' ||
        selectedCoin === 'USDT_TRC20' ||
        selectedCoin === 'USDT_ERC20'
      );
    }
    return selectedCoin === group;
  };

  const wishEnergy = Math.min(1, wishText.trim().length / 40);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.45 } }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%',
        maxWidth: 432,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* =================================================================== */}
      {/* 0. POETIC INTERNATIONAL ENGLISH NARRATIVE                            */}
      {/* =================================================================== */}
      <div
        style={{
          marginBottom: 22,
          textAlign: 'center',
          minHeight: 56,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
        }}
      >
        <AnimatePresence mode="wait">
          {stage === 'writing' ? (
            <motion.div
              key="narrative-writing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 500,
                  fontSize: 'clamp(25px, 5vw, 31px)',
                  letterSpacing: '0.02em',
                  color: '#f6efe3',
                  textShadow: '0 2px 20px rgba(229, 202, 147, 0.14)',
                }}
              >
                Hold your wish deeply in mind.
              </h1>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                  letterSpacing: '0.015em',
                  color: 'rgba(229, 202, 147, 0.64)',
                }}
              >
                Leave what lives in your heart upon the page; once sealed, a message meant only for
                you will unfold.
              </p>
            </motion.div>
          ) : stage === 'paying' ? (
            <motion.div
              key="narrative-paying"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 500,
                  fontSize: 'clamp(23px, 4.6vw, 27px)',
                  letterSpacing: '0.02em',
                  color: '#f6efe3',
                }}
              >
                Your intention awaits its seal.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 15.5,
                  color: 'rgba(229, 202, 147, 0.62)',
                }}
              >
                Once your transfer settles on-chain, the note descends and your message unlocks.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="narrative-dropping"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 19,
                  letterSpacing: '0.04em',
                  color: '#e5ca93',
                }}
              >
                Released into silence...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =================================================================== */}
      {/* 1. WISH PAPER SLIP CLIPPED EXACTLY AT THE GOLDEN SLOT CENTERLINE     */}
      {/* =================================================================== */}
      <motion.div
        animate={{
          marginTop: stage === 'paying' ? -138 : stage === 'dropping' ? -155 : 0,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '84%',
          padding: '10px 8px 0',
          marginBottom: -22,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 6,
          pointerEvents: stage === 'writing' ? 'auto' : 'none',
        }}
      >
        <motion.div
          key={`slip-${nudgeCount}`}
          animate={{
            y: paperY,
            x: nudgeCount > 0 && !wishText.trim() ? [0, -5, 5, -3, 3, 0] : 0,
          }}
          transition={
            stage === 'dropping'
              ? { y: { duration: 0.88, ease: [0.32, 0, 0.25, 1] } }
              : {
                  y: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                  x: { duration: 0.38 },
                }
          }
          onClick={() => {
            if (stage === 'writing') textareaRef.current?.focus();
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: 192,
            borderRadius: '12px 12px 2px 2px',
            background:
              'linear-gradient(180deg, var(--vellum-top) 0%, var(--vellum-mid) 78%, var(--vellum-edge) 100%)',
            boxShadow:
              nudgeCount > 0 && !wishText.trim()
                ? '0 -4px 28px rgba(229, 202, 147, 0.45), inset 0 -22px 24px -10px rgba(28, 19, 8, 0.32)'
                : '0 -6px 26px rgba(0, 0, 0, 0.65), inset 0 -22px 24px -10px rgba(28, 19, 8, 0.3)',
            border: '1px solid rgba(190, 152, 88, 0.45)',
            borderBottom: 'none',
            padding: '15px 22px 26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'text',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '7px 7px 0 7px',
              borderRadius: '8px 8px 0 0',
              border: '1px solid rgba(168, 130, 68, 0.22)',
              borderBottom: 'none',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              color: '#9e783a',
              opacity: 0.85,
              marginBottom: 4,
              flexShrink: 0,
            }}
          >
            <StarSealIcon size={13} />
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!focused && wishText.length === 0 && stage === 'writing' && (
              <div
                className="idle-caret"
                style={{
                  position: 'absolute',
                  width: 1.8,
                  height: 26,
                  borderRadius: 2,
                  background: '#9e783a',
                  pointerEvents: 'none',
                }}
              />
            )}

            <textarea
              ref={textareaRef}
              className="wish-textarea"
              value={wishText}
              onChange={(e) => onChangeWish(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              readOnly={stage !== 'writing'}
              maxLength={320}
              spellCheck={false}
              aria-label="Your Wish"
              style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--ink-primary)',
                caretColor: '#8d672b',
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1.48,
                textAlign: 'center',
                padding: '10px 6px 4px',
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* =================================================================== */}
      {/* 2. SCULPTURAL OBSIDIAN & BRUSHED GOLD WISH BOX                       */}
      {/* =================================================================== */}
      <div
        style={{
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '96%',
            height: 40,
            borderRadius: '14px 14px 0 0',
            background: 'linear-gradient(180deg, #212029 0%, #141319 65%, #0d0d11 100%)',
            borderTop: '1px solid rgba(245, 228, 188, 0.24)',
            borderLeft: '1px solid rgba(223, 192, 136, 0.16)',
            borderRight: '1px solid rgba(223, 192, 136, 0.16)',
            position: 'relative',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <motion.div
            animate={{
              boxShadow:
                stage === 'dropping'
                  ? '0 -8px 42px rgba(245, 222, 166, 0.85), 0 0 22px rgba(229, 202, 147, 0.65)'
                  : `0 -4px ${16 + wishEnergy * 18}px rgba(229, 202, 147, ${(
                      0.18 +
                      wishEnergy * 0.25
                    ).toFixed(2)})`,
            }}
            transition={{ duration: 0.4 }}
            style={{
              width: '88%',
              height: 14,
              borderRadius: 999,
              padding: 2,
              background:
                'linear-gradient(90deg, #6b4e24 0%, #dfc088 24%, #faecc8 50%, #c9a15e 76%, #6b4e24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 999,
                background: '#030305',
                boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.95)',
              }}
            />
          </motion.div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 23,
            width: '84.5%',
            height: 3.5,
            borderRadius: '0 0 999px 999px',
            background:
              'linear-gradient(90deg, #6b4e24 0%, #e5c68e 28%, #fff1d0 50%, #c9a15e 74%, #6b4e24 100%)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.85)',
            zIndex: 8,
            pointerEvents: 'none',
          }}
        />

        <motion.div
          layout
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%',
            position: 'relative',
            zIndex: 7,
            marginTop: -6,
            borderRadius: '10px 10px 18px 18px',
            background:
              'linear-gradient(180deg, var(--obsidian-top) 0%, var(--obsidian-mid) 52%, var(--obsidian-deep) 100%)',
            border: '1px solid rgba(223, 192, 136, 0.25)',
            boxShadow:
              '0 32px 72px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 245, 224, 0.14)',
            overflow: 'hidden',
          }}
        >
          {[
            { top: 10, left: 10 },
            { top: 10, right: 10 },
            { bottom: 10, left: 10 },
            { bottom: 10, right: 10 },
          ].map((pos, idx) => (
            <span
              key={idx}
              style={{
                position: 'absolute',
                ...pos,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #f5e4bc 0%, #8f6b34 100%)',
                opacity: 0.55,
                pointerEvents: 'none',
              }}
            />
          ))}

          <AnimatePresence mode="wait">
            {stage === 'paying' ? (
              <CryptoVault
                key="vault"
                session={session}
                loadingSession={loadingSession}
                demoMode={demoMode}
                enabledCoins={enabledCoins}
                selectedCoin={selectedCoin}
                connectedWallet={connectedWallet}
                onOpenWalletModal={onOpenWalletModal}
                onChangeCoin={onSelectCoin}
                onBack={onBackToEdit}
                onConfirmed={onPaymentConfirmed}
              />
            ) : (
              <motion.div
                key="box-front"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  height: 104,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '14px 20px',
                    borderRadius: 10,
                    border: '1px solid rgba(223, 192, 136, 0.09)',
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(229, 202, 147, 0.04) 0%, transparent 72%)',
                    pointerEvents: 'none',
                  }}
                />

                <motion.div
                  animate={{
                    boxShadow:
                      stage === 'dropping'
                        ? '0 0 38px rgba(245, 224, 175, 0.65)'
                        : `0 0 ${14 + wishEnergy * 20}px rgba(223, 192, 136, ${(
                            0.12 +
                            wishEnergy * 0.24
                          ).toFixed(2)})`,
                  }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '1px solid rgba(229, 202, 147, 0.38)',
                    background:
                      'radial-gradient(circle at 35% 30%, #1d1b22 0%, #09090d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dfc088',
                  }}
                >
                  <StarSealIcon size={16} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* =================================================================== */}
      {/* 3. AMOUNT SELECTOR & SLEEK ARCHITECTURAL SEAL BUTTON                 */}
      {/* =================================================================== */}
      <AnimatePresence>
        {stage === 'writing' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.22 } }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%',
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Obsidian Amount Tray */}
            <div
              style={{
                width: '100%',
                padding: '15px 16px',
                borderRadius: 16,
                background:
                  'linear-gradient(180deg, rgba(20, 19, 25, 0.92) 0%, rgba(10, 10, 14, 0.95) 100%)',
                border: '1px solid rgba(223, 192, 136, 0.18)',
                boxShadow: '0 18px 42px rgba(0, 0, 0, 0.72)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Top Row: Crypto Coin Icons + Live Crypto Equivalent Readout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {coinGroups.map((c) => {
                    const active = isGroupCoinActive(c.group);
                    return (
                      <button
                        key={c.group}
                        type="button"
                        onClick={() => {
                          playSoftTick();
                          onSelectCoin(c.defaultKey);
                        }}
                        aria-label={c.group}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          border: active
                            ? '1px solid rgba(229, 202, 147, 0.6)'
                            : '1px solid rgba(223, 192, 136, 0.12)',
                          background: active
                            ? 'radial-gradient(circle, rgba(229, 202, 147, 0.24) 0%, rgba(229, 202, 147, 0.05) 100%)'
                            : 'rgba(255, 255, 255, 0.02)',
                          color: active ? '#f5e4bc' : 'rgba(243, 236, 224, 0.42)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {c.icon}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#e5ca93',
                    letterSpacing: '0.03em',
                    padding: '5px 11px',
                    borderRadius: 8,
                    background: 'rgba(223, 192, 136, 0.08)',
                    border: '1px solid rgba(223, 192, 136, 0.18)',
                  }}
                >
                  <span style={{ display: 'inline-flex', opacity: 0.9 }}>{activeCoinGlyph}</span>
                  <span>{previewCryptoNumber}</span>
                </div>
              </div>

              {/* Bottom Row: Numeric Presets + Editable Custom Input */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr) 1.35fr',
                  gap: 6,
                }}
              >
                {presets.map((val) => {
                  const selected = usdAmount === val && rawCustomInput === '';
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        playSoftTick();
                        onSelectPreset(val);
                      }}
                      style={{
                        height: 40,
                        borderRadius: 10,
                        border: selected
                          ? '1px solid rgba(229, 202, 147, 0.65)'
                          : '1px solid rgba(223, 192, 136, 0.12)',
                        background: selected
                          ? 'linear-gradient(180deg, rgba(229, 202, 147, 0.24) 0%, rgba(229, 202, 147, 0.08) 100%)'
                          : 'rgba(255, 255, 255, 0.025)',
                        color: selected ? '#faecc8' : 'rgba(243, 236, 224, 0.65)',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 13.5,
                        fontWeight: selected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      ${val}
                    </button>
                  );
                })}

                <div
                  style={{
                    height: 40,
                    borderRadius: 10,
                    border:
                      rawCustomInput !== ''
                        ? '1px solid rgba(229, 202, 147, 0.65)'
                        : '1px solid rgba(223, 192, 136, 0.16)',
                    background: 'rgba(0, 0, 0, 0.42)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 9px',
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12.5,
                      color: 'rgba(229, 202, 147, 0.55)',
                      userSelect: 'none',
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={rawCustomInput}
                    placeholder="···"
                    onChange={(e) => onCustomInputChange(e.target.value)}
                    aria-label="Custom Amount"
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#faecc8',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13.5,
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Redesigned Full-Width Architectural Brushed-Gold Action Button */}
            <button
              type="button"
              onClick={handleTriggerSeal}
              className="luxury-action-btn"
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 22px',
                cursor: 'pointer',
                color: '#18130a',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                <StarSealIcon size={14} color="#18130a" />
                <span>Seal My Wish</span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#18130a',
                  background: 'rgba(24, 19, 10, 0.09)',
                  padding: '5px 11px',
                  borderRadius: 8,
                }}
              >
                <span>${usdAmount > 0 ? usdAmount : 10}</span>
                <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
