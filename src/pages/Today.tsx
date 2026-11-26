// 「오늘」 탭 (앱 첫 화면): 지금 할 일 · 다음 일정 · 오늘 요약 · 추천
// 여행 전에는 D-day와 준비물, 여행 후에는 여행 요약을 보여 줘요.
import { useState } from 'react'
import checklists from '../data/checklists.json'
import { Checklist } from '../components/Checklist'
import { FlightCard } from '../components/FlightCard'
import { relevantFlight } from '../lib/flights'
import { DirectionsButton } from '../components/DirectionsButton'
import { ExpenseSheet } from '../components/ExpenseSheet'
import { itemTimeLabel } from '../components/itemTime'
import { KIND_STYLE } from '../components/kindStyle'
import { PlaceActions } from '../components/PlaceActions'
import { SpendTotals } from '../components/SpendTotals'
import type { EditedItem } from '../lib/edits'
import { comma, summarizeSpending, totalInKrw } from '../lib/money'
import { destinationOf, displayPlaceLabel, getPlace, resolveRef } from '../lib/places'
import { pickRecommendations } from '../lib/recommend'
import { daysUntil, formatDuration, HOME_TZ, isMarker, LOCAL_TZ, wallClock } from '../lib/time'
import { useTrip } from '../state/trip'

const card = 'rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800'

export default function Today() {
  const { status } = useTrip()
  return (
    <div className="space-y-4 p-4">
      <Clocks />
      {status.phase === 'before' && <BeforeTrip />}
      {status.phase === 'during' && <DuringTrip />}
      {status.phase === 'after' && <AfterTrip />}
    </div>
  )
}

/** 맨 위: 현지 시각 + 한국 시각 + 며칠차 */
function Clocks() {
  const { now, status, schedule } = useTrip()
  const local = wallClock(now, LOCAL_TZ)
  const home = wallClock(now, HOME_TZ)
  const day = schedule.days.find((d) => d.day === status.dayNumber)
  return (
    <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-teal-500 p-5 text-white shadow-md dark:from-sky-800 dark:to-teal-800">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm opacity-90">🇻🇳 현지 시각</div>
          <div className="text-5xl font-bold tabular-nums leading-none">{local.time}</div>
          <div className="mt-1 text-sm opacity-90">
            {local.date.slice(5).replace('-', '/')} ({local.weekday})
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-90">🇰🇷 한국</div>
          <div className="text-2xl font-semibold tabular-nums">{home.time}</div>
          <div className="text-xs opacity-80">현지 +2시간</div>
        </div>
      </div>
      {day && (
        <div className="mt-3 inline-block rounded-full bg-white/25 px-3 py-1 font-bold">
          {day.day}일차 / {schedule.days.length}일 · {day.date.slice(5).replace('-', '/')} {day.weekday}
        </div>
      )}
    </div>
  )
}

// ───────── 여행 중 ─────────

function DuringTrip() {
  const { status, timeline, now, schedule, choices } = useTrip()
  const { current, next } = status
  const [expenseFor, setExpenseFor] = useState<EditedItem | null>(null)

  const day = status.dayNumber!
  const todayItems = timeline.filter((t) => t.day === day)
  const local = wallClock(now, LOCAL_TZ).time
  const flight = relevantFlight(schedule.flightInfo.flights, now)

  // 추천: 자유시간·휴식·시내 구경일 때
  const base = current ?? next
  const recs = base
    ? pickRecommendations({
        placeId: resolveRef(base.place, base, schedule, choices),
        kind: current ? current.kind : 'free',
        day,
        localTime: local,
      })
    : []

  return (
    <>
      <NowCard item={current} nextItem={next} onExpense={setExpenseFor} />
      {next && <NextCard item={next} current={current} />}
      {flight && <FlightCard flight={flight} />}

      {recs.length > 0 && (
        <section className={card}>
          <h2 className="mb-3 text-lg font-bold">💡 이럴 때 추천</h2>
          <ul className="space-y-3">
            {recs.map((r) => (
              <li key={r.id} className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="font-bold">
                  {r.icon} {r.title}
                </div>
                <p className="mt-0.5 text-slate-700 dark:text-slate-300">{r.text}</p>
                {r.placeId && <DirectionsButton place={getPlace(r.placeId)} label="가는 길" className="mt-2 !px-3 !py-2 !text-sm" />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <TodaySummary items={todayItems} />

      {expenseFor && <ExpenseSheet item={expenseFor} onClose={() => setExpenseFor(null)} />}
    </>
  )
}

/** 지금 할 일 카드 */
function NowCard({ item, nextItem, onExpense }: { item: EditedItem | null; nextItem: EditedItem | null; onExpense: (i: EditedItem) => void }) {
  const { updateEdit, now, schedule, choices } = useTrip()
  if (!item) {
    return (
      <section className={card}>
        <div className="text-sm font-bold text-slate-500">지금 할 일</div>
        <div className="mt-1 text-xl font-bold">☕ 지금은 빈 시간이에요</div>
        {nextItem && <p className="mt-1 text-slate-600 dark:text-slate-300">다음 일정까지 {formatDuration(nextItem.startMs - now)}</p>}
      </section>
    )
  }
  const k = KIND_STYLE[item.kind]
  const total = item.endMs - item.startMs
  const progress = Math.min(1, Math.max(0, (now - item.startMs) / total))
  const t = itemTimeLabel(item)
  const remain = formatDuration(item.endMs - now)
  const remainText = item.openEnded
    ? nextItem
      ? `다음 일정까지 ${remain}`
      : ''
    : item.kind === 'flight'
      ? `도착까지 ${remain}`
      : `${item.title} 종료까지 ${remain}`
  const dest = destinationOf(item, schedule, choices)

  return (
    <section className="rounded-3xl bg-amber-100 p-5 shadow-md ring-2 ring-amber-400 dark:bg-amber-900/40">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-amber-800 dark:text-amber-300">🔔 지금 할 일</span>
        <span className="text-sm tabular-nums text-slate-600 dark:text-slate-300">
          {t.start}
          {t.end ? ` – ${t.end}` : ' ~'}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-4xl">{k.icon}</span>
        <div className="min-w-0">
          <div className="text-2xl font-bold leading-tight">{item.title}</div>
          {item.placeLabel && <div className="text-slate-700 dark:text-slate-300">📍 {displayPlaceLabel(item, schedule, choices, false)}</div>}
        </div>
      </div>
      {remainText && <div className="mt-3 text-xl font-bold text-amber-900 dark:text-amber-200">⏳ {remainText}</div>}
      {!item.openEnded && (
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70 dark:bg-slate-700">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {item.note && <p className="mt-3 text-slate-700 dark:text-slate-300">💬 {item.note}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.kind === 'move' && <DirectionsButton place={dest} />}
        <button
          onClick={() => onExpense(item)}
          className="rounded-2xl bg-white px-4 py-3 font-bold text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100"
        >
          💳 {item.actual ? `${comma(item.actual.amount)}${item.actual.currency === 'VND' ? '동' : '원'}` : '쓴 금액'}
        </button>
        <button
          onClick={() => updateEdit(item.id, { done: !item.done })}
          className={`rounded-2xl px-4 py-3 font-bold shadow-sm ${item.done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 dark:bg-slate-700 dark:text-slate-100'}`}
        >
          {item.done ? '✅ 완료됨' : '☑️ 완료'}
        </button>
      </div>
    </section>
  )
}

/** 다음 일정 카드 */
function NextCard({ item, current }: { item: EditedItem; current: EditedItem | null }) {
  const { now, schedule, choices } = useTrip()
  const k = KIND_STYLE[item.kind]
  const until = item.startMs - now
  const t = itemTimeLabel(item)
  const dest = destinationOf(item, schedule, choices)
  const currentDest = current ? destinationOf(current, schedule, choices) : undefined
  const isMove = item.kind === 'move'
  const leaveSoon = isMove && until <= 15 * 60_000
  // 이동 일정이거나, 지금 있는 곳과 다른 곳이면 길찾기 버튼
  const showDirections = isMove || (dest && dest.id !== currentDest?.id && item.kind !== 'flight' && item.kind !== 'end')

  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">⏭️ 다음 일정</span>
        <span className="rounded-full bg-sky-100 px-3 py-0.5 font-bold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
          {formatDuration(until)} 후
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-3xl">{k.icon}</span>
        <div className="min-w-0">
          <div className="text-sm tabular-nums text-slate-500">
            {t.start}
            {t.end ? ` – ${t.end}` : ''}
          </div>
          <div className="text-xl font-bold leading-tight">{item.title}</div>
          {item.placeLabel && <div className="text-slate-700 dark:text-slate-300">📍 {displayPlaceLabel(item, schedule, choices, false)}</div>}
        </div>
      </div>
      {item.note && <p className="mt-2 text-slate-600 dark:text-slate-400">💬 {item.note}</p>}
      {isMove && (
        <div
          className={`mt-3 rounded-2xl px-4 py-3 font-bold ${
            leaveSoon ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          {leaveSoon ? '🚗 지금 출발하면 좋아요!' : `🚗 ${t.start}에 출발 — 미리 준비해 두세요`}
        </div>
      )}
      {showDirections && (
          <div className="mt-3">
            <PlaceActions place={dest} />
          </div>
        )}
    </section>
  )
}

/** 오늘 요약: 남은 주요 일정 몇 줄 + 오늘 비용 */
function TodaySummary({ items }: { items: EditedItem[] }) {
  const { now, schedule, status } = useTrip()
  const main = items.filter((t) => !isMarker(t) && t.kind !== 'move')
  // 지금부터 이어지는 일정 5개 (다 지났으면 마지막 5개)
  const startIdx = Math.max(0, main.findIndex((t) => t.endMs > now))
  const shown = main.slice(startIdx, startIdx + 5)
  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">📋 오늘 요약</h2>
        <a href="#all" className="text-sm font-semibold text-sky-700 dark:text-sky-300">
          전체 보기 →
        </a>
      </div>
      <ul className="space-y-1.5">
        {shown.map((t) => (
          <li
            key={t.id}
            className={`flex gap-3 ${t.id === status.current?.id ? 'font-bold' : ''} ${now >= t.endMs || t.skipped ? 'text-slate-400 line-through' : ''}`}
          >
            <span className="w-12 shrink-0 tabular-nums text-slate-500">{wallClock(t.startMs, t.tz).time}</span>
            <span className="min-w-0 truncate">
              {KIND_STYLE[t.kind].icon} {t.title}
              {t.placeLabel && <span className="font-normal text-slate-500"> · {t.placeLabel}</span>}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
        <h3 className="mb-2 font-bold">💰 오늘 비용</h3>
        <SpendTotals s={summarizeSpending(items)} rate={schedule.vndPerKrw} />
      </div>
    </section>
  )
}

// ───────── 여행 전 ─────────

function BeforeTrip() {
  const { now, schedule, status, checks } = useTrip()
  const first = schedule.days[0]
  const d = daysUntil(now, first.date)
  const firstItem = status.next!
  const resv = checklists.reservations.items
  const resvDone = resv.filter((i) => checks[i.id]).length

  return (
    <>
      <section className={`${card} text-center`}>
        <div className="text-slate-500">나트랑 출발까지</div>
        <div className="my-1 text-6xl font-black text-sky-600 dark:text-sky-400">{d === 0 ? 'D-DAY' : `D-${d}`}</div>
        <div className="text-slate-600 dark:text-slate-300">
          {first.date.replaceAll('-', '.')} ({first.weekday}) · 3박 5일
        </div>
        <div className="mt-3 rounded-2xl bg-sky-50 px-4 py-2 dark:bg-slate-900">
          첫 일정: <b>{wallClock(firstItem.startMs, firstItem.tz).time} 🇰🇷 {firstItem.title}</b>
          {d === 0 && <div className="text-sm">출발까지 {formatDuration(firstItem.startMs - now)}</div>}
        </div>
      </section>

      {schedule.flightInfo.flights.map((f) => (
        <FlightCard key={f.id} flight={f} />
      ))}

      <a href="#check" className={`${card} flex items-center justify-between`}>
        <span>
          <b>📞 예약·확인 할 일</b>
          <span className="block text-sm text-slate-500">마사지샵·샌딩 확인 등</span>
        </span>
        <span className={`rounded-full px-3 py-1 font-bold ${resvDone === resv.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {resvDone}/{resv.length} →
        </span>
      </a>

      <Checklist title={`🎒 ${checklists.packing.title}`} items={checklists.packing.items} />
    </>
  )
}

// ───────── 여행 후 ─────────

function AfterTrip() {
  const { timeline, schedule } = useTrip()
  const rate = schedule.vndPerKrw
  const s = summarizeSpending(timeline)
  const doneCount = timeline.filter((t) => t.done).length
  const added = timeline.filter((t) => t.custom).length
  return (
    <>
      <section className={`${card} text-center`}>
        <div className="text-5xl">🏠</div>
        <h2 className="mt-2 text-2xl font-bold">여행이 끝났어요. 수고하셨어요!</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {schedule.days[0].date.replaceAll('-', '.')} ~ {schedule.days[schedule.days.length - 1].date.slice(5).replace('-', '.')} · 나트랑 3박 5일
        </p>
      </section>
      <section className={card}>
        <h2 className="mb-3 text-lg font-bold">🧾 여행 결산</h2>
        <SpendTotals s={s} rate={rate} />
        <ul className="mt-4 space-y-1 text-slate-600 dark:text-slate-300">
          <li>✅ 완료 표시한 일정 {doneCount}개</li>
          <li>➕ 직접 추가한 지출·일정 {added}개</li>
          <li>💳 실제 사용 총액 ≈{comma(totalInKrw(s.actual, rate))}원</li>
        </ul>
        <a href="#all" className="mt-4 block rounded-2xl bg-sky-600 py-3 text-center font-bold text-white">
          날짜별 지출 다시 보기
        </a>
      </section>
    </>
  )
}
