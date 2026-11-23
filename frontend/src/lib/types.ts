export type DataQuality = 'live' | 'cached' | 'demo' | 'unknown'

export interface Token {
  ticker?: string | null
  name?: string | null
  address?: string | null
  source?: string | null
  stage?: string | null
  lifecycle?: string | null
  signal?: string | null
  hawk_score?: number | null
  opportunity_score?: number | null
  confidence?: number | string | null
  momentum_score?: number | null
  organicity_score?: number | null
  liquidity_score?: number | null
  earlyness_score?: number | null
  rug_risk?: number | null
  entry_state?: string | null
  reasons?: string[]
  risk_flags?: string[]
  positive_signals?: string[]
  negative_signals?: string[]
  thesis?: Record<string, unknown>
  market_cap?: number | null
  liquidity?: number | null
  volume?: number | null
  price_usd?: number | null
  curve_progress?: number | null
  age_minutes?: number | null
  reply_count?: number | null
  dex_url?: string | null
  is_live?: boolean | null
  price_change_m5?: number | null
  holder_quality?: number | null
  holder_top1_pct?: number | null
  holder_top10_pct?: number | null
  smart_money?: Record<string, unknown> | null
  creator_intel?: Record<string, unknown> | null
  wash_score?: number | null
  breakout_score?: number | null
  discovery_channel?: string | null
  ladder?: string | null
  display_score?: number | null
  runner_score?: number | null
  [key: string]: unknown
}

export interface Feed<T> { count: number; results: T[]; kind?: string; }
export interface ProviderStatus { ok: boolean | null; code?: number | null; detail?: string; ts?: number | null; }
export interface Health {
  status: string
  name: string
  version: string
  mode?: string
  journal_entries?: number
  providers?: Record<string, ProviderStatus>
  last_discover_n?: number
  last_discover_ts?: number | null
  telegram_configured?: boolean
  helius_configured?: boolean
}
export interface JournalEntry {
  id: string
  address?: string
  ticker?: string
  name?: string
  signal?: string
  action?: string
  outcome?: string | null
  ts?: number
  market_cap?: number | null
  entry_mcap?: number | null
  exit_mcap?: number | null
  created_at?: string
  notes?: string
  source?: string
}
export type Workspace = 'overview'|'radar'|'prime'|'intelligence'|'strategies'|'memory'|'command'
