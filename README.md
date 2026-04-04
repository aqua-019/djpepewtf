# DJPEPE.WTF

The canonical archive, meme gallery, and asset market for DJ PEPE -- the first audio NFT in history, minted on Bitcoin via Counterparty (XCP), October 13, 2016.

**Live:** https://djpepe.wtf

## Tech Stack

- **Frontend:** React 19 + Vite 8 (vanilla CSS with custom properties)
- **Backend:** Vercel Serverless Functions
- **Storage:** Vercel Blob (gallery files + submissions)
- **Data:** Counterparty API v2 (live asset data), mempool.space (BTC/USD), CoinGecko (ETH/USD)
- **Notifications:** Telegram Bot API + Resend (email)

## Setup

```bash
git clone https://github.com/aqua-019/djpepewtf.git
cd djpepewtf
npm install
npm run dev
```

Copy `.env.example` and set the required environment variables. See `.env.example` for the full list.

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/gallery` | GET | Public | List gallery files (paginated) |
| `/api/upload` | POST | Public (rate-limited) | Upload file to gallery |
| `/api/market` | GET | Public | Live asset data from Counterparty |
| `/api/submit` | POST | Public | Community meme submission |
| `/api/submissions` | GET | Admin | List pending submissions |
| `/api/approve` | POST | Admin | Move submission to gallery |
| `/api/reject` | POST | Admin | Delete submission |
| `/api/gallery-delete` | POST | Admin | Delete a gallery file |

Admin endpoints require `x-admin-token` header matching the `ADMIN_TOKEN` environment variable.

## Pages

- **Gallery** -- Meme archive with search, category filters, size slider
- **DJPEPE** -- Asset info page with live stats, timeline, traits
- **Market** -- Multi-asset dashboard with price charts, dispensers, sales history

## Deployment

Deployed on Vercel. Push to `main` triggers auto-deploy.

```bash
git push origin main
```

## Architecture

See the full architecture document for detailed design decisions, data models, and implementation notes.
