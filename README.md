# ASILI HAWK Terminal

Independent reconstruction project. The protected `wanjarose772-glitch/asili-hawk` repository remains unchanged.

## Architecture

- `frontend/`: React 19 + TypeScript terminal, Vite build, shared typed provider contract, and seven workspaces.
- `backend/app/`: recovered FastAPI intelligence API and Python modules for Pump.fun, DexScreener, GeckoTerminal, optional Helius enrichment, explainable scoring, SQLite snapshots, paper journal, and configured Telegram alerts.
- `backend/data/`: local SQLite store (ignored by Git).

The recovered Python source was copied from the legacy repository and adapted in this project. The Hercules React/TanStack/Convex source was not available through the connected Hercules tools, so the frontend is a new implementation rather than a claimed recovery.

## Local development

1. Create a Python environment and install the backend dependencies:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   cd ..
   ```

2. Copy `.env.example` to the project-root `.env` and add provider credentials only when available. Never place secrets in frontend variables. `HAWK_CONTROL_TOKEN` protects journal mutation and auto-tick endpoints; those endpoints return 503 while it is unset.

3. Start the API and terminal in separate shells:

   ```powershell
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

   ```powershell
   npm install
   npm run dev
   ```

The Vite frontend proxies no requests: set `VITE_API_BASE_URL=http://127.0.0.1:8000` in the project-root `.env` when using the separate dev servers. A built frontend is served by FastAPI from `frontend/dist`.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

Backend tests:

```powershell
cd backend
pip install -r requirements-dev.txt
pytest
```

## Data integrity

The UI does not populate fake token data. Current provider results, cached results, and unknown status remain distinct. A responding `/api/health` endpoint means the API process responded; it does not mean a market-data provider succeeded. Provider timestamps/status are shown after discovery probes. Helius holder and transaction enrichment requires a valid `HELIUS_API_KEY`. Telegram alerts require both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; delivery has not been verified until the configured service sends successfully.

Strategies show rule matches against the current feed. Their historical performance stays blank until recorded outcomes exist. Memory calculations use only persisted journal records with both entry and exit market-cap values. Watchlists and manually entered paper position references are stored in browser local storage; they do not execute trades or connect a wallet.

## Deployment

Build and run the included Dockerfile for a single-container deployment. Configure a persistent writable volume for SQLite before relying on historical records. Supply provider keys and the control token as server environment variables. Set `CORS_ORIGINS` to exact trusted origins. No production deployment or publishing has been performed.

## Provider notes

- Pump.fun public endpoints, DexScreener, and GeckoTerminal are implemented in the recovered discovery providers. Availability and rate limits depend on those services.
- Helius is optional and not considered connected solely because the integration exists.
- Birdeye is documented as a future optional source; no Birdeye provider was found in the recovered code.
- PostgreSQL, wallet authentication, live trading, and signing are not implemented.
