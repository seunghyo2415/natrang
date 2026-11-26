// ExpenseSheet: 원래 일정에 "실제로 쓴 금액"을 적는 창
import { useState } from 'react'
import type { EditedItem } from '../lib/edits'
import { useTrip } from '../state/trip'
import type { Cost } from '../types'
import { AmountInput } from './AmountInput'
import { Money } from './Money'
import { BigButton, Sheet } from './Sheet'

export function ExpenseSheet({ item, onClose }: { item: EditedItem; onClose: () => void }) {
  const { schedule, updateEdit } = useTrip()
  const rate = schedule.vndPerKrw
  const [amount, setAmount] = useState<number | null>(item.actual?.amount ?? null)
  const [currency, setCurrency] = useState<Cost['currency']>(item.actual?.currency ?? item.cost?.currency ?? 'VND')

  const save = () => {
    updateEdit(item.id, { actual: amount ? { amount, currency } : undefined })
    onClose()
  }
  const clear = () => {
    updateEdit(item.id, { actual: undefined })
    onClose()
  }

  return (
    <Sheet title={`💳 ${item.title}`} onClose={onClose}>
      <div className="mb-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
        <div className="text-sm text-slate-500 dark:text-slate-400">계획한 예산</div>
        <div className="text-lg">{item.cost ? <Money cost={item.cost} rate={rate} /> : '없음'}</div>
        {item.note && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">💬 {item.note}</div>}
      </div>

      <AmountInput
        label="실제로 쓴 금액 (3명 합계)"
        amount={amount}
        currency={currency}
        rate={rate}
        onChange={(a, c) => {
          setAmount(a)
          setCurrency(c)
        }}
      />

      {item.cost && (
        <button
          onClick={() => {
            setAmount(item.cost!.amount)
            setCurrency(item.cost!.currency)
          }}
          className="mt-3 w-full rounded-xl border-2 border-dashed border-slate-300 py-2 font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
        >
          예산과 똑같이 썼어요
        </button>
      )}

      <div className="mt-5 space-y-2">
        <BigButton onClick={save}>저장</BigButton>
        {item.actual && (
          <BigButton variant="danger" onClick={clear}>
            입력한 금액 지우기
          </BigButton>
        )}
      </div>
    </Sheet>
  )
}
