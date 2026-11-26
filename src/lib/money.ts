// money.ts: 원(KRW) ↔ 동(VND) 계산, 예산·실제 사용 합계
import type { Cost } from '../types'

export function krwToVnd(krw: number, rate: number): number {
  return Math.round(krw * rate)
}

export function vndToKrw(vnd: number, rate: number): number {
  return Math.round(vnd / rate)
}

/** 1,234,567 처럼 쉼표 넣기 */
export function comma(n: number): string {
  return n.toLocaleString('ko-KR')
}

export interface Totals {
  krw: number
  vnd: number
}

/** 비용 목록을 원화·동화로 나눠 합산 */
export function sumCosts(costs: (Cost | undefined)[]): Totals {
  let krw = 0
  let vnd = 0
  for (const c of costs) {
    if (!c) continue
    if (c.currency === 'KRW') krw += c.amount
    else vnd += c.amount
  }
  return { krw, vnd }
}

/** 원화로 환산한 합계 */
export const totalInKrw = (t: Totals, rate: number) => t.krw + vndToKrw(t.vnd, rate)

export interface SpendSummary {
  /** 원래 계획한 예산 (건너뛴 일정 제외) */
  budget: Totals
  /** 실제로 쓴 금액 */
  actual: Totals
  /** 최종 예상 = 쓴 항목은 실제 금액, 아직 안 쓴 항목은 예산 */
  forecast: Totals
  /** 금액을 입력한 항목 수 */
  enteredCount: number
}

interface SpendInput {
  cost?: Cost
  actual?: Cost
  skipped: boolean
}

export function summarizeSpending(items: SpendInput[]): SpendSummary {
  const budget: (Cost | undefined)[] = []
  const actual: (Cost | undefined)[] = []
  const forecast: (Cost | undefined)[] = []
  for (const it of items) {
    if (!it.skipped) budget.push(it.cost)
    actual.push(it.actual)
    forecast.push(it.actual ?? (it.skipped ? undefined : it.cost))
  }
  return {
    budget: sumCosts(budget),
    actual: sumCosts(actual),
    forecast: sumCosts(forecast),
    enteredCount: items.filter((i) => i.actual).length,
  }
}
