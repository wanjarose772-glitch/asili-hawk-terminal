import asyncio
import time

from app.config import get_settings
from app.discovery import dexscreener


def test_search_matches_survive_slow_optional_boost_enrichment(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "provider_timeout_seconds", 0.1)
    pair = {
        "chainId": "solana",
        "baseToken": {"symbol": "LIVE", "name": "Live Pair", "address": "A" * 40},
        "pairCreatedAt": int(time.time() * 1000),
        "liquidity": {"usd": 5000},
        "volume": {"h1": 2000, "h24": 5000},
        "marketCap": 25000,
        "txns": {"h1": {"buys": 10, "sells": 4}},
    }

    async def search(_client, _query):
        return [pair]

    async def slow_boost(_client):
        await asyncio.sleep(1)
        return []

    monkeypatch.setattr(dexscreener, "_search_pairs", search)
    monkeypatch.setattr(dexscreener, "_boosted_and_profiles", slow_boost)

    results = asyncio.run(dexscreener.discover_new_solana_pairs(limit=10))

    assert len(results) == 1
    assert results[0]["address"] == "A" * 40
    assert results[0]["source"] == "dexscreener"
