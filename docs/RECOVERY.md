# Recovery and implementation record

## Source baseline

- Protected source: `wanjarose772-glitch/asili-hawk`, `main`, audited at commit `b13088a4` (2026-10-24).
- Source status at inspection: public repository; its contents and history were readable. It was not modified.
- Recovered into this project: Python API, Pump.fun/DexScreener/GeckoTerminal discovery, optional Helius enrichment, intelligence/scoring modules, SQLite snapshot and journal services, Telegram alert sender, and the source repository's backend test suite.
- Hercules source recovery: unavailable from the connected Hercules MCP tools. The new React/TypeScript frontend is a reconstruction informed by the build brief, not recovered Hercules code.

## Integration boundary

The backend is inherited code with targeted reliability/security changes in this repository. The frontend uses its token feed, Prime feed, health status, and journal API. Provider health means only the status observed by the current backend process. Helius and Telegram are environment-gated and remain unverified until configured and exercised with authorized credentials.

No credentials, deployment environment, wallet, or live trading connection was copied. Database state from any prior hosted deployment is not part of the public source repository and has not been recovered.
