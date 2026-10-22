import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckGlyph,
  CopyGlyph,
  DownloadGlyph,
  ResetGlyph,
  ShareGlyph,
  StarSealIcon,
} from './CryptoIcons';
import {
  downloadKeepsakeCard,
  shareKeepsakeCardOrDownload,
} from '../utils/keepsakeCanvas';
import { playSacredChime, playSoftTick } from '../utils/sound';

interface MessageRevealProps {
  message: string;
  numeral: string;
  onReset: () => void;
}

export const MessageReveal: React.FC<MessageRevealProps> = ({ message, numeral, onReset }) => {
  const [unsealed, setUnsealed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUnsealed(true);
      playSacredChime();
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenEarly = () => {
    if (!unsealed) {
      setUnsealed(true);
      playSacredChime();
    }
  };

  const formattedQuote = `“${message}”`;

  const handleCopyQuote = async () => {
    playSoftTick();
    try {
      await navigator.clipboard.writeText(formattedQuote);
    } catch {
      const el = document.createElement('textarea');
      el.value = formattedQuote;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShareWhatsApp = () => {
    playSoftTick();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(formattedQuote)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareX = () => {
    playSoftTick();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedQuote)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareTelegram = () => {
    playSoftTick();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(
        formattedQuote
      )}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareVisualCard = async () => {
    playSoftTick();
    await shareKeepsakeCardOrDownload(message, numeral);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -12 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%',
        maxWidth: 468,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Envelope / Sacred Card Container */}
      <motion.div
        onClick={handleOpenEarly}
        animate={{
          boxShadow: unsealed
            ? '0 32px 80px rgba(0, 0, 0, 0.9), 0 0 65px rgba(223, 192, 136, 0.16)'
            : '0 24px 60px rgba(0, 0, 0, 0.88), 0 0 28px rgba(223, 192, 136, 0.08)',
        }}
        transition={{ duration: 0.9 }}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: unsealed ? 360 : 270,
          borderRadius: 20,
          background: 'linear-gradient(180deg, #131218 0%, #0a0a0e 58%, #060609 100%)',
          border: '1px solid rgba(223, 192, 136, 0.34)',
          padding: '42px 34px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: unsealed ? 'default' : 'pointer',
          transition: 'min-height 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 11,
            borderRadius: 13,
            border: '1px solid rgba(223, 192, 136, 0.13)',
            pointerEvents: 'none',
          }}
        />

        <motion.div
          animate={{ opacity: unsealed ? 1 : 0.25 }}
          transition={{ duration: 1.1 }}
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 22%, rgba(229, 202, 147, 0.12) 0%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        {!unsealed ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.95, 1.04, 1] }}
            transition={{ duration: 0.8 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              height: '100%',
            }}
          >
            <svg
              style={{
                position: 'absolute',
                inset: -42,
                width: 'calc(100% + 84px)',
                height: 'calc(100% + 84px)',
                pointerEvents: 'none',
                opacity: 0.22,
              }}
              viewBox="0 0 400 280"
              preserveAspectRatio="none"
            >
              <path d="M0 0 L200 148 L400 0" stroke="#dfc088" strokeWidth="1" fill="none" />
              <path d="M0 280 L155 128" stroke="#dfc088" strokeWidth="0.7" fill="none" />
              <path d="M400 280 L245 128" stroke="#dfc088" strokeWidth="0.7" fill="none" />
            </svg>

            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(229, 202, 147, 0.25)',
                  '0 0 48px rgba(229, 202, 147, 0.65)',
                ],
              }}
              transition={{ duration: 0.8 }}
              className="seal-medallion"
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1b1409',
              }}
            >
              <StarSealIcon size={24} color="#1b1409" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 22,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                color: '#e5ca93',
              }}
            >
              <StarSealIcon size={18} />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  letterSpacing: '0.24em',
                  color: 'rgba(229, 202, 147, 0.55)',
                }}
              >
                {numeral}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 'clamp(22px, 4.8vw, 27px)',
                lineHeight: 1.62,
                letterSpacing: '0.01em',
                color: '#f6efe3',
                textShadow: '0 2px 18px rgba(0, 0, 0, 0.65)',
              }}
            >
              {message}
            </p>

            <div
              style={{
                width: 44,
                height: 1,
                background:
                  'linear-gradient(90deg, transparent, rgba(229, 202, 147, 0.55), transparent)',
                marginTop: 4,
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Action Row: Share + Save Card + New Wish */}
      {unsealed && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => {
                playSoftTick();
                setShareOpen((prev) => !prev);
              }}
              className="luxury-action-btn"
              style={{
                height: 44,
                padding: '0 22px',
                borderRadius: 12,
                border: 'none',
                color: '#18130a',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <ShareGlyph size={15} />
              <span>Share Message</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSoftTick();
                downloadKeepsakeCard(message, numeral);
              }}
              style={{
                height: 44,
                padding: '0 16px',
                borderRadius: 12,
                border: '1px solid rgba(229, 202, 147, 0.3)',
                background: 'rgba(223, 192, 136, 0.06)',
                color: '#f3ece0',
                fontSize: 12.5,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <DownloadGlyph size={15} />
              <span>Save Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSoftTick();
                onReset();
              }}
              title="New Wish"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: '1px solid rgba(229, 202, 147, 0.28)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: '#e5ca93',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <ResetGlyph size={16} />
            </button>
          </div>

          <AnimatePresence>
            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: 'linear-gradient(180deg, rgba(20, 19, 25, 0.95), rgba(10, 10, 14, 0.96))',
                  border: '1px solid rgba(223, 192, 136, 0.24)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.78)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  style={{
                    padding: '8px 13px',
                    borderRadius: 10,
                    border: copiedText
                      ? '1px solid rgba(229, 202, 147, 0.65)'
                      : '1px solid rgba(223, 192, 136, 0.18)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: copiedText ? '#f5e4bc' : '#f3ece0',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  {copiedText ? <CheckGlyph size={13} /> : <CopyGlyph size={13} />}
                  <span>{copiedText ? 'Copied' : 'Copy Quote'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareX}
                  style={{
                    padding: '8px 13px',
                    borderRadius: 10,
                    border: '1px solid rgba(223, 192, 136, 0.18)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#f3ece0',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  X (Twitter)
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  style={{
                    padding: '8px 13px',
                    borderRadius: 10,
                    border: '1px solid rgba(223, 192, 136, 0.18)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#f3ece0',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleShareTelegram}
                  style={{
                    padding: '8px 13px',
                    borderRadius: 10,
                    border: '1px solid rgba(223, 192, 136, 0.18)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#f3ece0',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Telegram
                </button>

                <button
                  type="button"
                  onClick={handleShareVisualCard}
                  style={{
                    padding: '8px 13px',
                    borderRadius: 10,
                    border: '1px solid rgba(229, 202, 147, 0.35)',
                    background: 'rgba(229, 202, 147, 0.1)',
                    color: '#f5e4bc',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Share Card Image
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};
