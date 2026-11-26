// Calculator: 원 ↔ 동 계산기 (한쪽에 입력하면 다른 쪽이 바로 계산)
import { useState } from 'react'
import { comma, krwToVnd, vndToKrw } from '../lib/money'

const BILLS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000]

export function Calculator({ rate }: { rate: number }) {
  const [vnd, setVnd] = useState<number | null>(null)
  const [krw, setKrw] = useState<number | null>(null)

  const parse = (s: string) => {
    const d = s.replace(/[^\d]/g, '').slice(0, 12)
    return d ? Number(d) : null
  }
  const onVnd = (s: string) => {
    const v = parse(s)
    setVnd(v)
    setKrw(v == null ? null : vndToKrw(v, rate))
  }
  const onKrw = (s: string) => {
    const k = parse(s)
    setKrw(k)
    setVnd(k == null ? null : krwToVnd(k, rate))
  }

  const box =
    'w-full rounded-2xl border-2 border-slate-200 bg-white py-3 pl-4 pr-12 text-right text-2xl font-bold tabular-nums outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <h2 className="mb-3 text-lg font-bold">🧮 원 ↔ 동 계산기</h2>
      <label className="relative block">
        <input inputMode="numeric" className={box} placeholder="0" value={vnd != null ? comma(vnd) : ''} onChange={(e) => onVnd(e.target.value)} aria-label="동" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">동</span>
      </label>
      <div className="my-1 text-center text-xl text-slate-400">⇅</div>
      <label className="relative block">
        <input inputMode="numeric" className={box} placeholder="0" value={krw != null ? comma(krw) : ''} onChange={(e) => onKrw(e.target.value)} aria-label="원" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">원</span>
      </label>
      <div className="mt-2 flex justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>환율 1원 = {rate}동</span>
        <button onClick={() => (setVnd(null), setKrw(null))} className="font-semibold text-sky-700 dark:text-sky-300">
          지우기
        </button>
      </div>

      <h3 className="mb-2 mt-4 font-bold">💵 지폐별 원화</h3>
      <div className="grid grid-cols-2 gap-2">
        {BILLS.map((b) => (
          <button key={b} onClick={() => onVnd(String(b))} className="rounded-xl bg-slate-50 px-3 py-2 text-left dark:bg-slate-900">
            <div className="font-bold tabular-nums">{comma(b)}동</div>
            <div className="text-sm text-slate-500">≈ {comma(vndToKrw(b, rate))}원</div>
          </button>
        ))}
      </div>
      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
        💡 어림셈: <b>동에서 0 하나 빼고 반으로</b> 나누면 대략 원이에요. (100,000동 → 10,000 → 약 5,000원)
      </p>
    </div>
  )
}
