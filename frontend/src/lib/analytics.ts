import type { Token } from './types'

export interface Strategy { id: string; name: string; description: string; rule: (token: Token) => boolean; }
export const strategies: Strategy[] = [
  { id: 'early-quality', name: 'Early Quality', description: 'Age under 90m, Hawk score ≥ 65, liquidity score ≥ 45, rug risk ≤ 55.', rule: t => n(t.age_minutes) <= 90 && n(t.hawk_score) >= 65 && n(t.liquidity_score) >= 45 && n(t.rug_risk, 100) <= 55 },
  { id: 'flow-confirmation', name: 'Flow Confirmation', description: 'Momentum ≥ 60 with organicity ≥ 50 and nonzero observed volume.', rule: t => n(t.momentum_score) >= 60 && n(t.organicity_score) >= 50 && n(t.volume) > 0 },
  { id: 'risk-first', name: 'Risk First', description: 'Rug risk ≤ 35, liquidity ≥ 50, and holder concentration available.', rule: t => n(t.rug_risk, 100) <= 35 && n(t.liquidity_score) >= 50 && t.holder_top10_pct != null },
]
const n = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback
export function filterTokens(tokens: Token[], query: string, minScore: number, risk: 'all'|'lower'|'elevated') {
  const q = query.trim().toLowerCase()
  return tokens.filter(t => (!q || `${t.ticker ?? ''} ${t.name ?? ''} ${t.address ?? ''}`.toLowerCase().includes(q)) && n(t.hawk_score) >= minScore && (risk === 'all' || (risk === 'lower' ? n(t.rug_risk, 100) <= 50 : n(t.rug_risk, 0) > 50)))
}
export function strategySignals(tokens: Token[]) { return strategies.map(s => ({ id: s.id, name: s.name, matched: tokens.filter(s.rule) })) }
export function calculateStrategyPerformance(returns: number[]) {
  returns = returns.filter(Number.isFinite)
  if (!returns.length) return { trades: 0, hitRate: null as number|null, compoundedReturn: null as number|null, maxDrawdown: null as number|null }
  let equity = 1, peak = 1, maxDrawdown = 0, wins = 0
  for (const value of returns) { if (!Number.isFinite(value)) continue; equity *= 1 + value; if (value > 0) wins++; peak = Math.max(peak, equity); if (peak > 0) maxDrawdown = Math.max(maxDrawdown, (peak-equity)/peak) }
  return { trades: returns.length, hitRate: wins/returns.length, compoundedReturn: equity-1, maxDrawdown }
}
