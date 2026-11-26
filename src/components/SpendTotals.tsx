// SpendTotals: 계획 예산 / 실제 사용 / 최종 예상 합계 카드 내용
import type { ReactNode } from 'react'
import { comma, totalInKrw, type SpendSummary, type Totals } from '../lib/money'

const PEOPLE = 3

function Detail({ t }: { t: Totals }) {
  const parts = []
  if (t.krw) parts.push(`${comma(t.krw)}원`)
  if (t.vnd) parts.push(`${comma(t.vnd)}동`)
  return <div className="text-right text-xs text-slate-500 dark:text-slate-400">{parts.join(' + ') || '—'}</div>
}

export function SpendTotals({ s, rate }: { s: SpendSummary; rate: number }) {
  const budget = totalInKrw(s.budget, rate)
  const actual = totalInKrw(s.actual, rate)
  const forecast = totalInKrw(s.forecast, rate)
  const diff = forecast - budget

  return (
    <div className="space-y-3">
      <Row label="📋 계획 예산" value={`≈${comma(budget)}원`}>
        <Detail t={s.budget} />
      </Row>
      <Row label={`💳 실제 사용 (${s.enteredCount}건)`} value={`≈${comma(actual)}원`} strong>
        <Detail t={s.actual} />
      </Row>
      <div className="border-t border-slate-200 pt-3 dark:border-slate-600">
        <Row label="🔮 최종 예상" value={`≈${comma(forecast)}원`} strong>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">쓴 건 실제 금액, 남은 건 예산으로 계산</span>
          </div>
          {diff !== 0 && (
            <div className={`text-right text-sm font-semibold ${diff > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              예산보다 {diff > 0 ? '+' : '−'}
              {comma(Math.abs(diff))}원
            </div>
          )}
        </Row>
      </div>
      <div className="flex justify-between rounded-xl bg-sky-50 px-3 py-2 dark:bg-slate-900">
        <span>👥 1인당 ({PEOPLE}명)</span>
        <span>
          사용 <b>≈{comma(Math.round(actual / PEOPLE))}원</b> · 예상 ≈{comma(Math.round(forecast / PEOPLE))}원
        </span>
      </div>
    </div>
  )
}

function Row({ label, value, strong, children }: { label: string; value: string; strong?: boolean; children?: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span>{label}</span>
        <span className={strong ? 'text-lg font-bold' : ''}>{value}</span>
      </div>
      {children}
    </div>
  )
}
