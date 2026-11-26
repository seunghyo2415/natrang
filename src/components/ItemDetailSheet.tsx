// ItemDetailSheet: 일정을 누르면 나오는 상세 화면
// 장소 버튼 · 장소 고르기 · 챙길 것/주의할 점 · 예약·연락처 · 일정 조정 · 시간/장소/메모 수정
import { useState } from 'react'
import type { EditedItem } from '../lib/edits'
import { destinationOf, displayPlaceLabel, getPlace, isKnown, nextSpotInArea, placeChoiceOf, resolveRef } from '../lib/places'
import { tipsFor } from '../lib/tips'
import { useTrip } from '../state/trip'
import { ExpenseSheet } from './ExpenseSheet'
import { itemTimeLabel } from './itemTime'
import { KIND_STYLE } from './kindStyle'
import { Money } from './Money'
import { PlaceActions } from './PlaceActions'
import { BigButton, Sheet } from './Sheet'

const FIXED = new Set(['flight', 'end'])

export function ItemDetailSheet({ item, onClose }: { item: EditedItem; onClose: () => void }) {
  const { schedule, choices, setChoice, edits, updateEdit, resetEdit, timeline } = useTrip()
  const [editing, setEditing] = useState(false)
  const [expense, setExpense] = useState(false)
  const e = edits[item.id] ?? {}

  const k = KIND_STYLE[item.kind]
  const t = itemTimeLabel(item)
  const dest = destinationOf(item, schedule, choices)
  const choice = placeChoiceOf(item, schedule)
  const chosen = choice ? (choices[choice.key] ?? (item.placeOptions ? item.place : schedule.choices[choice.key]?.default)) : null
  // 이동이면 도착지만, 아니면 머무는 장소 기준으로 팁 고르기 (공통 팁은 「체크」 탭에)
  const placeIds = [item.to ?? item.place].map((r) => resolveRef(r, item, schedule, choices))
  const tips = tipsFor(item, placeIds).filter((g) => Object.keys(g.when).length > 0)
  const bring = [...new Set(tips.flatMap((g) => g.bring))]
  const cautions = tips.flatMap((g) => g.cautions.map((c) => ({ c, from: g.title })))
  const hasChanges = e.start != null || e.end != null || e.placeLabel != null || e.note != null || !!e.shiftMin || !!e.extendMin || !!e.skipped

  if (expense) return <ExpenseSheet item={item} onClose={() => setExpense(false)} />

  return (
    <Sheet title={`${k.icon} ${item.title}`} onClose={onClose}>
      <div className="-mt-2 mb-4 text-slate-600 dark:text-slate-300">
        <div className="tabular-nums">
          🕐 {t.start}
          {t.end ? ` – ${t.end}` : ' ~'} {item.tz === 'Asia/Ho_Chi_Minh' ? '(현지)' : ''}
        </div>
        {item.placeLabel && <div>📍 {displayPlaceLabel(item, schedule, choices, e.placeLabel != null)}</div>}
        {item.note && <div className="mt-1">💬 {item.note}</div>}
        {item.cost && (
          <div className="mt-1">
            예산 <Money cost={item.cost} rate={schedule.vndPerKrw} />
          </div>
        )}
      </div>

      {/* 장소 고르기 (2일차 카페·점심, 3일차 저녁, 4일차 마사지) */}
      {choice && (
        <section className="mb-4">
          <h3 className="mb-2 font-bold">🔀 {choice.label}</h3>
          <div className="flex flex-wrap gap-2">
            {choice.options.map((id) => (
              <button
                key={id}
                onClick={() => setChoice(choice.key, id)}
                className={`rounded-2xl px-4 py-2.5 font-bold ${chosen === id ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}
              >
                {getPlace(id)?.name ?? id}
              </button>
            ))}
          </div>
          {choice.key === 'd4-massage' && <p className="mt-1 text-sm text-slate-500">고른 곳으로 4일차 이동·마사지·샤워 일정의 길찾기가 바뀌어요</p>}
        </section>
      )}

      {/* 장소 버튼 */}
      {dest && (
        <section className="mb-5">
          <h3 className="mb-2 font-bold">
            🧭 {item.kind === 'move' ? '목적지' : '장소'}: {dest.name}
          </h3>
          <PlaceActions place={dest} suggestId={nextSpotInArea(item, timeline, schedule, choices)} />
        </section>
      )}

      {/* 챙길 것 · 주의할 점 */}
      {bring.length > 0 && (
        <section className="mb-4 rounded-2xl bg-sky-50 p-4 dark:bg-slate-900">
          <h3 className="mb-2 font-bold">🎒 챙길 것</h3>
          <ul className="space-y-1">
            {bring.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </section>
      )}
      {cautions.length > 0 && (
        <section className="mb-4 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/30">
          <h3 className="mb-2 font-bold">⚠️ 주의할 점</h3>
          <ul className="space-y-1.5">
            {cautions.map(({ c, from }) => (
              <li key={from + c}>
                • {c}
                <span className="ml-1 text-xs text-slate-400">{from.split(' ')[0]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="-mt-2 mb-4 text-sm text-slate-500">☀️ 날씨·건강 등 공통 주의사항은 「체크」 탭에 있어요</p>

      {/* 예약·연락처 */}
      {dest && (isKnown(dest.phone) || dest.memo) && (
        <section className="mb-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <h3 className="mb-2 font-bold">📞 예약·연락처</h3>
          <div>{dest.name}</div>
          {isKnown(dest.phone) && (
            <a href={`tel:${(dest.phone as string).replace(/\s/g, '')}`} className="text-lg font-bold text-sky-700 underline dark:text-sky-300">
              {dest.phone}
            </a>
          )}
          {dest.memo && <div className="text-sm text-slate-500">{dest.memo}</div>}
          {!isKnown(dest.phone) && <div className="text-sm text-slate-500">전화번호 미확정</div>}
        </section>
      )}

      {/* 일정 조정 */}
      <section className="mb-4">
        <h3 className="mb-2 font-bold">⏰ 일정 조정</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setExpense(true)} className="rounded-xl bg-sky-100 px-4 py-2.5 font-bold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
            💳 {item.actual ? '쓴 금액 수정' : '쓴 금액'}
          </button>
          <button
            onClick={() => updateEdit(item.id, { done: !item.done })}
            className={`rounded-xl px-4 py-2.5 font-bold ${item.done ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}`}
          >
            {item.done ? '✅ 완료됨' : '☑️ 완료'}
          </button>
          {!FIXED.has(item.kind) && item.kind !== 'airport' && (
            <>
              <button
                onClick={() => updateEdit(item.id, { shiftMin: (e.shiftMin ?? 0) + 30 })}
                className="rounded-xl bg-rose-100 px-4 py-2.5 font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200"
              >
                +30분 미루기
              </button>
              <button
                onClick={() => updateEdit(item.id, { skipped: !e.skipped })}
                className="rounded-xl bg-slate-200 px-4 py-2.5 font-bold dark:bg-slate-700"
              >
                {e.skipped ? '건너뛰기 취소' : '건너뛰기'}
              </button>
            </>
          )}
        </div>
      </section>

      {/* 수정 */}
      {!FIXED.has(item.kind) && !item.custom && (editing ? <EditForm item={item} onDone={() => setEditing(false)} /> : null)}
      <div className="space-y-2">
        {!FIXED.has(item.kind) && !item.custom && !editing && (
          <BigButton variant="secondary" onClick={() => setEditing(true)}>
            ✏️ 시간·장소·메모 수정
          </BigButton>
        )}
        {hasChanges && (
          <BigButton variant="danger" onClick={() => resetEdit(item.id)}>
            ↩ 원래 일정으로 되돌리기
          </BigButton>
        )}
      </div>
      {FIXED.has(item.kind) && <p className="mt-2 text-sm text-slate-500">비행 일정은 항공권 기준이라 수정할 수 없어요.</p>}
    </Sheet>
  )
}

/** 시간·장소·메모 수정 */
function EditForm({ item, onDone }: { item: EditedItem; onDone: () => void }) {
  const { schedule, edits, updateEdit } = useTrip()
  const original = schedule.days.flatMap((d) => d.items).find((i) => i.id === item.id)!
  const e = edits[item.id] ?? {}
  const [start, setStart] = useState(e.start ?? original.start)
  const [end, setEnd] = useState(e.end ?? original.end ?? '')
  const [placeLabel, setPlaceLabel] = useState(e.placeLabel ?? original.placeLabel)
  const [note, setNote] = useState(e.note ?? original.note ?? '')
  // 자정을 넘기는 일정(4일차 탑승)은 종료가 시작보다 작아도 정상
  const crossesMidnight = !!original.endDayOffset
  const invalid = !!end && !crossesMidnight && end <= start

  const save = () => {
    updateEdit(item.id, {
      start: start !== original.start ? start : undefined,
      end: end && end !== original.end ? end : undefined,
      placeLabel: placeLabel !== original.placeLabel ? placeLabel : undefined,
      note: note !== (original.note ?? '') ? note : undefined,
    })
    onDone()
  }

  const input =
    'w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900'
  return (
    <section className="mb-4 space-y-3 rounded-2xl border-2 border-sky-200 p-4 dark:border-sky-800">
      <h3 className="font-bold">✏️ 수정 {item.tz === 'Asia/Seoul' ? '(한국 시간)' : '(현지 시간)'}</h3>
      <div className="flex gap-3">
        <label className="flex-1">
          <div className="mb-1 text-sm font-semibold">시작</div>
          <input type="time" className={input} value={start} onChange={(ev) => setStart(ev.target.value)} />
        </label>
        <label className="flex-1">
          <div className="mb-1 text-sm font-semibold">종료</div>
          <input type="time" className={input} value={end} onChange={(ev) => setEnd(ev.target.value)} />
        </label>
      </div>
      {invalid && <p className="text-sm font-semibold text-rose-600">종료 시간이 시작보다 늦어야 해요</p>}
      <label className="block">
        <div className="mb-1 text-sm font-semibold">장소</div>
        <input className={input} value={placeLabel} onChange={(ev) => setPlaceLabel(ev.target.value)} />
      </label>
      <label className="block">
        <div className="mb-1 text-sm font-semibold">메모</div>
        <input className={input} value={note} onChange={(ev) => setNote(ev.target.value)} />
      </label>
      <div className="flex gap-2">
        <BigButton onClick={save} disabled={invalid}>
          저장
        </BigButton>
        <BigButton variant="secondary" onClick={onDone}>
          취소
        </BigButton>
      </div>
    </section>
  )
}
