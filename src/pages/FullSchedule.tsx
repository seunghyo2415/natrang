// 「전체」 탭: 1~5일차 일정을 날짜 탭 + 세로 타임라인으로 + 예산/실제 사용 합계
import { useState } from 'react'
import { AddItemSheet } from '../components/AddItemSheet'
import { ExpenseSheet } from '../components/ExpenseSheet'
import { ItemDetailSheet } from '../components/ItemDetailSheet'
import { displayPlaceLabel } from '../lib/places'
import { KIND_STYLE } from '../components/kindStyle'
import { itemTimeLabel } from '../components/itemTime'
import { Money } from '../components/Money'
import { SpendTotals } from '../components/SpendTotals'
import type { EditedItem } from '../lib/edits'
import { summarizeSpending } from '../lib/money'
import { wallClock } from '../lib/time'
import { useTrip } from '../state/trip'
import type { CustomItem } from '../types'

type OpenSheet =
  | { type: 'expense'; item: EditedItem }
  | { type: 'add' }
  | { type: 'editCustom'; item: CustomItem }
  | { type: 'detail'; id: string }
  | null

export default function FullSchedule() {
  const { schedule, timeline, status, now, customItems, choices, edits } = useTrip()
  const [day, setDay] = useState<number>(status.dayNumber ?? 1)
  const [sheet, setSheet] = useState<OpenSheet>(null)
  // 상세 화면은 id로 찾아서, 수정하면 바로 최신 내용이 보이게
  const detailItem = sheet?.type === 'detail' ? timeline.find((t) => t.id === sheet.id) : undefined

  const items = timeline.filter((t) => t.day === day)
  const rate = schedule.vndPerKrw

  const openItem = (it: EditedItem) => {
    const custom = customItems.find((c) => c.id === it.id)
    setSheet(custom ? { type: 'editCustom', item: custom } : { type: 'expense', item: it })
  }

  return (
    <div className="pb-6">
      {/* 날짜 탭 (위에 붙어 있음) */}
      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-sky-50/95 px-4 py-3 backdrop-blur dark:bg-slate-900/95">
        {schedule.days.map((d) => (
          <button
            key={d.day}
            onClick={() => setDay(d.day)}
            className={`shrink-0 rounded-2xl px-4 py-2 text-center leading-tight ${
              d.day === day ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="text-base font-bold">{d.day}일차</div>
            <div className="text-xs opacity-80">
              {d.date.slice(5).replace('-', '/')} {d.weekday}
            </div>
          </button>
        ))}
      </div>

      {/* 타임라인 */}
      <ol className="relative mx-4 mt-2 border-l-2 border-sky-200 dark:border-slate-700">
        {items.map((it) =>
          it.kind === 'expense' ? (
            <ExpenseRow key={it.id} item={it} rate={rate} onOpen={() => openItem(it)} />
          ) : (
            <TimelineRow
              key={it.id}
              item={it}
              rate={rate}
              state={it.id === status.current?.id ? 'current' : now >= it.endMs ? 'past' : 'future'}
              placeText={displayPlaceLabel(it, schedule, choices, edits[it.id]?.placeLabel != null)}
              onOpen={() => openItem(it)}
              onDetail={() => (it.custom ? openItem(it) : setSheet({ type: 'detail', id: it.id }))}
            />
          ),
        )}
      </ol>

      <div className="mx-4 mt-2">
        <button
          onClick={() => setSheet({ type: 'add' })}
          className="w-full rounded-2xl border-2 border-dashed border-sky-400 py-3.5 text-lg font-bold text-sky-700 dark:border-sky-700 dark:text-sky-300"
        >
          ＋ {day}일차에 지출·일정 추가
        </button>
      </div>

      {/* 비용 합계 */}
      <section className="mx-4 mt-6 space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-3 text-lg font-bold">💰 {day}일차 비용</h3>
          <SpendTotals s={summarizeSpending(items)} rate={rate} />
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h3 className="mb-3 text-lg font-bold">🧾 여행 전체 비용</h3>
          <SpendTotals s={summarizeSpending(timeline)} rate={rate} />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">환율 1원 = {rate}동 기준 · 금액은 3명 합계</p>
        </div>
      </section>

      {sheet?.type === 'detail' && detailItem && <ItemDetailSheet item={detailItem} onClose={() => setSheet(null)} />}
      {sheet?.type === 'expense' &&<ExpenseSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.type === 'add' && <AddItemSheet day={day} onClose={() => setSheet(null)} />}
      {sheet?.type === 'editCustom' && <AddItemSheet day={sheet.item.day} editing={sheet.item} onClose={() => setSheet(null)} />}
    </div>
  )
}

function TimelineRow({
  item,
  rate,
  state,
  placeText,
  onOpen,
  onDetail,
}: {
  item: EditedItem
  rate: number
  state: 'past' | 'current' | 'future'
  placeText: string
  onOpen: () => void
  onDetail: () => void
}) {
  const k = KIND_STYLE[item.kind]
  const t = itemTimeLabel(item)
  return (
    <li className={`relative mb-3 pl-6 ${state === 'past' || item.skipped ? 'opacity-60' : ''}`}>
      {/* 선 위의 아이콘 동그라미 */}
      <span
        className={`absolute -left-[17px] top-3 flex h-8 w-8 items-center justify-center rounded-full text-base ring-4 ring-sky-50 dark:ring-slate-900 ${k.dot}`}
        aria-label={k.label}
      >
        {k.icon}
      </span>
      <div
        role="button"
        tabIndex={0}
        onClick={onDetail}
        onKeyDown={(ev) => ev.key === 'Enter' && onDetail()}
        className={`cursor-pointer rounded-2xl p-3 active:brightness-95 ${
          state === 'current' ? 'bg-amber-100 shadow-md ring-2 ring-amber-400 dark:bg-amber-900/40' : 'bg-white shadow-sm dark:bg-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold tabular-nums">
            {t.start}
            {t.end ? ` – ${t.end}` : ' ~'}
          </span>
          {state === 'current' && <span className="rounded-full bg-amber-400 px-2 text-xs font-bold text-amber-950">지금</span>}
          {item.custom && <span className="rounded-full bg-lime-200 px-2 text-xs text-lime-900">직접 추가</span>}
          {item.optional && <span className="rounded-full bg-slate-200 px-2 text-xs dark:bg-slate-700">선택</span>}
          {item.skipped && <span className="rounded-full bg-slate-300 px-2 text-xs dark:bg-slate-600">건너뜀</span>}
          {item.extendedBy > 0 && <span className="rounded-full bg-orange-100 px-2 text-xs text-orange-800">{item.extendedBy}분 연장</span>}
          {item.shiftedBy > 0 &&<span className="rounded-full bg-rose-100 px-2 text-xs text-rose-800">+{item.shiftedBy}분</span>}
          {item.edited && <span className="rounded-full bg-sky-100 px-2 text-xs text-sky-800">수정됨</span>}
          {item.done && <span className="rounded-full bg-emerald-100 px-2 text-xs text-emerald-800">✅ 완료</span>}
        </div>
        <div className={`mt-1 text-lg font-bold ${item.skipped ? 'line-through' : ''}`}>{item.title}</div>
        {placeText && <div className="text-slate-700 dark:text-slate-300">📍 {placeText}</div>}
        {item.note && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">💬 {item.note}</div>}

        {/* 예산 / 실제 사용 */}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0 text-sm">
            {item.cost && (
              <div className={item.actual ? 'text-slate-400 line-through decoration-1' : ''}>
                예산 <Money cost={item.cost} rate={rate} />
              </div>
            )}
            {item.actual && (
              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                사용 <Money cost={item.actual} rate={rate} />
              </div>
            )}
          </div>
          <button
            onClick={(ev) => {
              ev.stopPropagation() // 카드 전체(상세 화면)가 같이 눌리지 않게
              onOpen()
            }}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${
              item.actual ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
            }`}
          >
            {item.custom ? '✏️ 수정' : item.actual ? '💳 수정' : '💳 금액 입력'}
          </button>
        </div>
      </div>
    </li>
  )
}

/** 지출만 기록한 항목: 한 줄로 작게 */
function ExpenseRow({ item, rate, onOpen }: { item: EditedItem; rate: number; onOpen: () => void }) {
  return (
    <li className="relative mb-3 pl-6">
      <span className="absolute -left-[13px] top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-lime-200 text-xs ring-4 ring-sky-50 dark:bg-lime-800 dark:ring-slate-900">
        💸
      </span>
      <button
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-lime-300 bg-lime-50 px-3 py-2 text-left dark:border-lime-800 dark:bg-lime-950/40"
      >
        <span className="min-w-0">
          <span className="mr-2 text-sm tabular-nums text-slate-500">{wallClock(item.startMs, item.tz).time}</span>
          <b>{item.title}</b>
          {item.note && <span className="ml-1 text-sm text-slate-500"> · {item.note}</span>}
        </span>
        <span className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {item.actual ? <Money cost={item.actual} rate={rate} /> : '금액 없음'}
        </span>
      </button>
    </li>
  )
}
