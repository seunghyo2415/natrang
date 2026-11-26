// AmountInput: 금액 입력칸 + 동/원 선택 + 자동 환산 표시
// 동화는 0이 많아서 헷갈리기 쉬워요 → 쉼표를 자동으로 넣고, 빠른 입력 버튼(000)을 둬요.
import { comma, krwToVnd, vndToKrw } from '../lib/money'
import type { Cost } from '../types'

interface Props {
  amount: number | null
  currency: Cost['currency']
  rate: number
  onChange: (amount: number | null, currency: Cost['currency']) => void
  label?: string
}

export function AmountInput({ amount, currency, rate, onChange, label }: Props) {
  const setText = (text: string) => {
    const digits = text.replace(/[^\d]/g, '').slice(0, 12)
    onChange(digits ? Number(digits) : null, currency)
  }
  const add000 = () => onChange((amount ?? 0) * 1000 || null, currency)

  return (
    <div>
      {label && <div className="mb-1 font-semibold">{label}</div>}
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          className="min-w-0 flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-right text-2xl font-bold tabular-nums outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900"
          placeholder="0"
          value={amount != null ? comma(amount) : ''}
          onChange={(e) => setText(e.target.value)}
          aria-label={label ?? '금액'}
        />
        <div className="flex overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-600">
          {(['VND', 'KRW'] as const).map((c) => (
            <button
              key={c}
              onClick={() => onChange(amount, c)}
              className={`px-3 text-lg font-bold ${currency === c ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}
            >
              {c === 'VND' ? '동' : '원'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {amount
            ? currency === 'VND'
              ? `≈ ${comma(vndToKrw(amount, rate))}원`
              : `≈ ${comma(krwToVnd(amount, rate))}동`
            : ' '}
        </span>
        {currency === 'VND' && (
          <button onClick={add000} className="rounded-lg bg-slate-100 px-3 py-1 font-semibold dark:bg-slate-700">
            ,000 붙이기
          </button>
        )}
      </div>
    </div>
  )
}
