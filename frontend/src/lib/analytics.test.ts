import { describe, expect, it } from 'vitest'
import { calculateStrategyPerformance, filterTokens, strategySignals } from './analytics'
import type { Token } from './types'

const fixtures: Token[] = [
  { ticker:'OWL', address:'mint-owl', hawk_score:78, rug_risk:22, age_minutes:35, liquidity_score:63, momentum_score:72, organicity_score:67, volume:25000, holder_top10_pct:31 },
  { ticker:'HAWK', address:'mint-hawk', hawk_score:52, rug_risk:71, age_minutes:180, liquidity_score:24, momentum_score:55, organicity_score:43, volume:8000 },
]

describe('token filtering',()=>{
  it('matches searchable identity, score floor and risk selection',()=>{
    expect(filterTokens(fixtures,'owl',60,'lower').map(x=>x.ticker)).toEqual(['OWL'])
    expect(filterTokens(fixtures,'missing',0,'all')).toEqual([])
    expect(filterTokens(fixtures,'',60,'elevated').map(x=>x.ticker)).toEqual([])
  })
})

describe('strategy rules',()=>{
  it('returns only tokens that meet all configured rule conditions',()=>{
    const signals=strategySignals(fixtures)
    expect(signals.find(x=>x.id==='early-quality')?.matched.map(x=>x.ticker)).toEqual(['OWL'])
    expect(signals.find(x=>x.id==='risk-first')?.matched.map(x=>x.ticker)).toEqual(['OWL'])
  })
})

describe('recorded-return calculations',()=>{
  it('compounds sequential returns and tracks hit rate and drawdown',()=>{
    const result=calculateStrategyPerformance([0.5,-0.2])
    expect(result.trades).toBe(2)
    expect(result.hitRate).toBe(0.5)
    expect(result.compoundedReturn).toBeCloseTo(0.2)
    expect(result.maxDrawdown).toBeCloseTo(0.2)
  })
  it('does not invent performance for an empty history',()=>{
    expect(calculateStrategyPerformance([])).toEqual({trades:0,hitRate:null,compoundedReturn:null,maxDrawdown:null})
  })
  it('ignores invalid recorded returns',()=>{
    expect(calculateStrategyPerformance([Number.NaN,0.1]).trades).toBe(1)
  })
})
