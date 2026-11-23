"""
Unified discovery layer.
Pulls early Pump.fun bonding-curve tokens (primary edge)
and optionally enriches / merges with DexScreener.
"""

from __future__ import annotations

import asyncio
from typing import Any

from app.discovery.pumpfun import fetch_pumpfun_launches
from app.discovery.dexscreener import enrich_token, discover_new_solana_pairs
from app.discovery.geckoterminal import fetch_gecko_new_pools
from app.providers.helius import enrich_holders, enrich_tx_intel
from app.services.live_status import record_source, record_discover_count
from app.config import get_settings


async def discover_opportunities(
    limit: int = 40,
    enrich: bool = True,
) -> list[dict]:
    """
    Main discovery entrypoint.

    Priority:
    1. Pump.fun tokens still on bonding curve (true early edge)
    2. Very recent DexScreener Solana pairs (just listed / graduated)
    """
    pump_task = fetch_pumpfun_launches(limit=limit)
    dex_task = discover_new_solana_pairs(limit=40)
    gecko_task = fetch_gecko_new_pools(limit=25)

    timeout = get_settings().provider_timeout_seconds
    results = await asyncio.gather(
        asyncio.wait_for(pump_task, timeout=timeout),
        asyncio.wait_for(dex_task, timeout=timeout),
        asyncio.wait_for(gecko_task, timeout=timeout),
        return_exceptions=True,
    )

    provider_names = ("pump", "dex", "gecko")
    provider_results: list[list[dict]] = []
    for name, result in zip(provider_names, results):
        if isinstance(result, BaseException):
            detail = "timeout" if isinstance(result, TimeoutError) else "request_failed"
            record_source(name, ok=False, code=None, detail=detail)
            provider_results.append([])
        else:
            record_source(
                name,
                ok=bool(result),
                # An empty normalized result cannot tell us whether the upstream
                # returned an empty payload, blocked the request, or had no matches.
                # Keep the HTTP status unknown instead of inferring a 403/0.
                code=200 if result else None,
                detail="ok" if result else "empty",
            )
            provider_results.append(result)
    pump_tokens, dex_tokens, gecko_tokens = provider_results

    # If Pump is empty (403/block), Dex/Gecko become primary — keep board alive
    merged: list[dict] = []
    seen: set[str] = set()
    primary = pump_tokens if pump_tokens else (list(dex_tokens or []) + list(gecko_tokens or []))
    secondary = (list(dex_tokens or []) + list(gecko_tokens or [])) if pump_tokens else list(pump_tokens or [])

    for t in primary:
        addr = t.get("address") or ""
        if not addr or addr in seen:
            continue
        seen.add(addr)
        merged.append(t)

    for t in secondary:
        addr = t.get("address") or ""
        if not addr or addr in seen:
            continue
        seen.add(addr)
        merged.append(t)

    if enrich and merged:
        # Enrich top candidates with live DexScreener stats (price, vol, liq)
        # Prefer active/graduated names for volume (CLOVER-class)
        ranked = sorted(
            [t for t in merged if t.get("source") in ("pump.fun", "geckoterminal", "dexscreener")],
            key=lambda x: (
                0 if x.get("discovery_channel") == "active" else 1,
                0 if x.get("complete") else 1,
                -(x.get("market_cap") or 0),
            ),
        )
        to_enrich = ranked[:12]
        if to_enrich:
            enrich_results = await asyncio.gather(
                *[enrich_token(t["address"]) for t in to_enrich],
                return_exceptions=True,
            )
            for token, extra in zip(to_enrich, enrich_results):
                if isinstance(extra, dict) and extra:
                    if extra.get("price_usd"):
                        token["price_usd"] = extra["price_usd"]
                    if extra.get("liquidity") and extra["liquidity"] > 0:
                        token["liquidity"] = extra["liquidity"]
                    if extra.get("volume") and extra["volume"] > 0:
                        token["volume"] = extra["volume"]
                    for k in ("volume_h1", "volume_h6", "buys_h1", "sells_h1", "price_change_h1"):
                        if extra.get(k) is not None:
                            token[k] = extra[k]
                    if extra.get("market_cap") and (
                        not token.get("market_cap") or token["market_cap"] == 0
                    ):
                        token["market_cap"] = extra["market_cap"]
                    token["dex_url"] = extra.get("url")
                    token["price_change_m5"] = extra.get("price_change_m5")
                    token["price_change_h1"] = extra.get("price_change_h1")

    # Optional Helius holder concentration (no-op without API key)
    try:
        await enrich_holders(merged, max_tokens=min(12, len(merged)))
    except Exception:
        pass

    try:
        # Tx sample only for top candidates (wash / organicity)
        await enrich_tx_intel(merged, max_tokens=min(8, len(merged)))
    except Exception:
        pass

    # Prefer any non-empty feed when Pump is blocked
    try:
        record_discover_count(len(merged))
    except Exception:
        pass
    return merged[: max(limit, 40)] if merged else []
