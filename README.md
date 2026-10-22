# ✦ Silent Wish (`supr-se`)

A minimal dark-luxury Web3 sanctuary where visitors seal a silent wish, complete an instant non-custodial crypto contribution (`USDT TRC20`, `USDT BEP20`, `USDT ERC20`, `BTC`, `ETH`, `SOL`), and unseal a curated keepsake message card.

## One-Click Cloud Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fomerhayva%2Fsupr-se)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fomerhayva%2Fsupr-se)

## Supported Wallets & Networks

- **Wallets:** Trust Wallet (Priority `#1` desktop extension + mobile deep-link), MetaMask, OKX Wallet, TronLink, Phantom, UniSat + Universal QR Code Checkout
- **Networks:**
  - `USDT (TRC20)` — TRON Mainnet
  - `USDT (BEP20)` — BNB Smart Chain
  - `USDT (ERC20)` — Ethereum Mainnet
  - `BTC` — Native SegWit
  - `ETH` — Ethereum Mainnet
  - `SOL` — Solana Mainnet

## Run Locally or on Any VPS

```bash
npm install
npm run build
npm start
```

- Health check endpoint: `GET /healthz`
- Wallet configuration: `config/wallets.json`
