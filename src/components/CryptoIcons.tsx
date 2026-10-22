import React from 'react';

export const StarSealIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = 'currentColor',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 1.5C12.35 8.1 15.9 11.65 22.5 12C15.9 12.35 12.35 15.9 12 22.5C11.65 15.9 8.1 12.35 1.5 12C8.1 11.65 11.65 8.1 12 1.5Z"
      fill={color}
    />
  </svg>
);

export const UsdtIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12.95 10.62V8.42H18.1V6.1H5.9V8.42H11.05V10.62C6.88 10.81 3.75 11.63 3.75 12.62C3.75 13.61 6.88 14.43 11.05 14.62V19.6H12.95V14.62C17.12 14.43 20.25 13.61 20.25 12.62C20.25 11.63 17.12 10.81 12.95 10.62ZM12 13.9C8.55 13.9 5.75 13.3 5.75 12.56C5.75 11.93 7.82 11.4 10.8 11.25V13.21C11.19 13.23 11.59 13.24 12 13.24C12.41 13.24 12.81 13.23 13.2 13.21V11.25C16.18 11.4 18.25 11.93 18.25 12.56C18.25 13.3 15.45 13.9 12 13.9Z"
      fill="currentColor"
    />
  </svg>
);

export const BtcIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M16.52 10.58C16.75 9.1 15.61 8.31 14.07 7.78L14.57 5.78L13.35 5.48L12.87 7.42C12.55 7.34 12.22 7.26 11.89 7.19L12.38 5.24L11.16 4.94L10.66 6.94C10.39 6.88 10.13 6.82 9.88 6.76L8.2 6.34L7.87 7.64C7.87 7.64 8.77 7.85 8.75 7.86C9.24 7.98 9.33 8.31 9.31 8.57L8.75 10.82C8.78 10.83 8.83 10.84 8.88 10.86L8.75 10.83L7.96 14C7.9 14.15 7.75 14.37 7.4 14.29C7.41 14.31 6.52 14.07 6.52 14.07L5.91 15.47L7.5 15.87C7.79 15.94 8.08 16.02 8.36 16.09L7.85 18.12L9.07 18.42L9.57 16.41C9.9 16.5 10.23 16.58 10.54 16.66L10.05 18.65L11.27 18.95L11.78 16.92C13.86 17.31 15.42 17.15 16.08 15.27C16.61 13.76 15.82 12.88 14.96 12.31C15.76 12.13 16.36 11.6 16.52 10.58ZM13.73 14.5C13.35 16.02 10.78 15.2 9.95 15L10.62 12.3C11.45 12.51 14.13 12.92 13.73 14.5ZM14.11 10.5C13.76 11.88 11.63 11.18 10.94 11.01L11.55 8.56C12.24 8.73 14.47 9.06 14.11 10.5Z"
      fill="currentColor"
    />
  </svg>
);

export const EthIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3L6.5 12.15L12 15.4L17.5 12.15L12 3Z" fill="currentColor" fillOpacity="0.9" />
    <path d="M12 16.65L6.5 13.4L12 21L17.5 13.4L12 16.65Z" fill="currentColor" />
  </svg>
);

export const SolIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M6.4 16.2C6.58 16.02 6.83 15.92 7.1 15.92H19.4C19.84 15.92 20.06 16.45 19.75 16.76L17.6 18.92C17.42 19.1 17.17 19.2 16.9 19.2H4.6C4.16 19.2 3.94 18.67 4.25 18.36L6.4 16.2Z"
      fill="currentColor"
    />
    <path
      d="M6.4 5.08C6.58 4.9 6.83 4.8 7.1 4.8H19.4C19.84 4.8 20.06 5.33 19.75 5.64L17.6 7.8C17.42 7.98 17.17 8.08 16.9 8.08H4.6C4.16 8.08 3.94 7.55 4.25 7.24L6.4 5.08Z"
      fill="currentColor"
    />
    <path
      d="M17.6 10.6C17.42 10.42 17.17 10.32 16.9 10.32H4.6C4.16 10.32 3.94 10.85 4.25 11.16L6.4 13.32C6.58 13.5 6.83 13.6 7.1 13.6H19.4C19.84 13.6 20.06 13.07 19.75 12.76L17.6 10.6Z"
      fill="currentColor"
    />
  </svg>
);

export const CopyGlyph: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const CheckGlyph: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e5ca93" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const WalletGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </svg>
);

export const BackGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

export const HashGlyph: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

export const DownloadGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13" />
    <path d="M7 11l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

export const ResetGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const ShareGlyph: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
