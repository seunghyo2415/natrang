// AddItemSheet: 현지에서 지출이나 일정을 직접 추가/수정하는 창
// - 💸 지출만 기록: 그랩비·간식·팁처럼 시간을 차지하지 않는 지출
// - 🗓️ 일정 추가: 새로 생긴 일정 (시작~종료 시간이 있고, "지금 할 일"에도 나옴)
import { useState } from 'react'
import { LOCAL_TZ, wallClock } from '../lib/time'
import { useTrip } from '../state/trip'
import type { Cost, CustomItem, ItemKind } from '../types'
import { AmountInput } from './AmountInput'
import { KIND_STYLE } from './kindStyle'
import { BigButton, Sheet } from './Sheet'

const EXPENSE_CHIPS = ['🚕 그랩', '🥤 음료·간식', '🛒 마트', '🎁 기념품', '💵 팁', '🍜 식사']
const SCHEDULE_KINDS: ItemKind[] = ['meal', 'cafe', 'shopping', 'massage', 'sightseeing', 'move', 'free', 'rest']

interface Props {
  day: number
  /** 수정할 항목 (없으면 새로 추가) */
  editing?: CustomItem
  onClose: () => void
}

export function AddItemSheet({ day, editing, onClose }: Props) {
  const { schedule, now, edits, updateEdit, saveCustomItem, deleteCustomItem } = useTrip()
  const rate = schedule.vndPerKrw
  const dayInfo = schedule.days.find((d) => d.day === day)!

  // 기본 시간: 오늘이 그날이면 현재 현지 시각, 아니면 12:00
  const wall = wallClock(now, LOCAL_TZ)
  const defaultTime = wall.date === dayInfo.date ? wall.time : '12:00'

  const [mode, setMode] = useState<'expense' | 'schedule'>(editing && editing.kind !== 'expense' ? 'schedule' : 'expense')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [start, setStart] = useState(editing?.start ?? defaultTime)
  const [end, setEnd] = useState(editing?.end ?? '')
  const [kind, setKind] = useState<ItemKind>(editing && editing.kind !== 'expense' ? editing.kind : 'meal')
  const [placeLabel, setPlaceLabel] = useState(editing?.placeLabel ?? '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [budget, setBudget] = useState<number | null>(editing?.cost?.amount ?? null)
  const [budgetCur, setBudgetCur] = useState<Cost['currency']>(editing?.cost?.currency ?? 'VND')
  const existingActual = editing ? edits[editing.id]?.actual : undefined
  const [actual, setActual] = useState<number | null>(existingActual?.amount ?? null)
  const [actualCur, setActualCur] = useState<Cost['currency']>(existingActual?.currency ?? 'VND')

  const isExpense = mode === 'expense'
  const endInvalid = !isExpense && !!end && end <= start
  const canSave = title.trim() !== '' && !!start && !endInvalid && (!isExpense || !!actual)

  const save = () => {
    const id = editing?.id ?? `c-${Date.now()}`
    const item: CustomItem = {
      id,
      day,
      custom: true,
      start,
      end: isExpense || !end ? undefined : end,
      tz: LOCAL_TZ,
      title: title.trim(),
      placeLabel: placeLabel.trim(),
      note: note.trim() || undefined,
      kind: isExpense ? 'expense' : kind,
      cost: !isExpense && budget ? { amount: budget, currency: budgetCur } : undefined,
    }
    saveCustomItem(item)
    updateEdit(id, { actual: actual ? { amount: actual, currency: actualCur } : undefined })
    onClose()
  }

  const remove = () => {
    if (editing && window.confirm(`「${editing.title}」을(를) 삭제할까요?`)) {
      deleteCustomItem(editing.id)
      onClose()
    }
  }

  const input =
    'w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900'

  return (
    <Sheet title={`${editing ? '수정' : '추가'} · ${day}일차 (${dayInfo.date.slice(5).replace('-', '/')})`} onClose={onClose}>
      {/* 종류 선택 */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
        {(
          [
            ['expense', '💸 지출만 기록'],
            ['schedule', '🗓️ 일정 추가'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-xl py-2.5 font-bold ${mode === m ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="block">
          <div className="mb-1 font-semibold">무엇에 썼나요 / 무엇을 하나요</div>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isExpense ? '예: 그랩 (리조트 → 시내)' : '예: 해변 산책'} />
        </label>
        {isExpense && (
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CHIPS.map((c) => (
              <button key={c} onClick={() => setTitle(c.slice(c.indexOf(' ') + 1))} className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-700">
                {c}
              </button>
            ))}
          </div>
        )}

        {!isExpense && (
          <div>
            <div className="mb-1 font-semibold">종류</div>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full px-3 py-1.5 ${kind === k ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}
                >
                  {KIND_STYLE[k].icon} {KIND_STYLE[k].label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <label className="flex-1">
            <div className="mb-1 font-semibold">{isExpense ? '시각' : '시작'} <span className="text-sm font-normal text-slate-500">(현지)</span></div>
            <input type="time" className={input} value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          {!isExpense && (
            <label className="flex-1">
              <div className="mb-1 font-semibold">종료 <span className="text-sm font-normal text-slate-500">(선택)</span></div>
              <input type="time" className={input} value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          )}
        </div>
        {endInvalid && <p className="-mt-2 text-sm font-semibold text-rose-600">종료 시간이 시작보다 늦어야 해요</p>}

        <label className="block">
          <div className="mb-1 font-semibold">장소 <span className="text-sm font-normal text-slate-500">(선택)</span></div>
          <input className={input} value={placeLabel} onChange={(e) => setPlaceLabel(e.target.value)} placeholder="예: 나트랑 시내" />
        </label>

        {!isExpense && (
          <AmountInput
            label="예산 (선택)"
            amount={budget}
            currency={budgetCur}
            rate={rate}
            onChange={(a, c) => {
              setBudget(a)
              setBudgetCur(c)
            }}
          />
        )}

        <AmountInput
          label={isExpense ? '쓴 금액 (3명 합계)' : '실제로 쓴 금액 (선택)'}
          amount={actual}
          currency={actualCur}
          rate={rate}
          onChange={(a, c) => {
            setActual(a)
            setActualCur(c)
          }}
        />

        <label className="block">
          <div className="mb-1 font-semibold">메모 <span className="text-sm font-normal text-slate-500">(선택)</span></div>
          <input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 귀국 후 정산" />
        </label>
      </div>

      <div className="mt-6 space-y-2">
        <BigButton onClick={save} disabled={!canSave}>
          {editing ? '저장' : '추가하기'}
        </BigButton>
        {editing && (
          <BigButton variant="danger" onClick={remove}>
            삭제
          </BigButton>
        )}
      </div>
    </Sheet>
  )
}
