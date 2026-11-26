// FlightCard: 항공편 정보 카드 (편명·시간·터미널·비행시간·공항 도착 권장 시각·수하물)
import { useState } from 'react'
import { flightTimes } from '../lib/flights'
import { formatDuration, wallClock } from '../lib/time'
import { useTrip } from '../state/trip'
import type { Flight } from '../types'

export function FlightCard({ flight, showBaggage = false }: { flight: Flight; showBaggage?: boolean }) {
  const { schedule, timeline, now } = useTrip()
  const info = schedule.flightInfo
  const t = flightTimes(flight, info.arriveHoursBefore, timeline)
  const [bagOpen, setBagOpen] = useState(showBaggage)

  const dep = wallClock(t.departMs, flight.depart.tz)
  const arr = wallClock(t.arriveMs, flight.arrive.tz)
  const rec = wallClock(t.recommendedArrivalMs, flight.depart.tz)
  const plannedShort = t.plannedArrivalMs != null && t.plannedArrivalMs > t.recommendedArrivalMs
  const planned = t.plannedArrivalMs != null ? wallClock(t.plannedArrivalMs, flight.depart.tz) : null
  const flag = (tz: string) => (tz === 'Asia/Seoul' ? '🇰🇷 한국' : '🇻🇳 현지')
  const md = (d: string, w: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}(${w})`

  let statusText = ''
  if (now < t.departMs) statusText = `출발까지 ${formatDuration(t.departMs - now)}`
  else if (now < t.arriveMs) statusText = `비행 중 · 도착까지 ${formatDuration(t.arriveMs - now)}`

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800">
      <div className="flex items-center justify-between bg-indigo-600 px-5 py-3 text-white dark:bg-indigo-900">
        <span className="font-bold">✈️ {flight.label}</span>
        <span className="text-2xl font-black tracking-wider">{flight.flightNo}</span>
      </div>
      <div className="p-5">
        <div className="text-sm text-slate-500 dark:text-slate-400">{flight.airline}</div>

        {/* 출발 → 도착 */}
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div>
            <div className="text-3xl font-black">{flight.depart.code}</div>
            <div className="text-3xl font-bold tabular-nums">{dep.time}</div>
            <div className="text-sm">{md(dep.date, dep.weekday)} · {flag(flight.depart.tz)}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {flight.depart.airport} {flight.depart.terminal}
            </div>
          </div>
          <div className="text-center text-xs text-slate-500">
            <div className="text-xl">→</div>
            {formatDuration(t.durationMs)}
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">{flight.arrive.code}</div>
            <div className="text-3xl font-bold tabular-nums">{arr.time}</div>
            <div className="text-sm">{md(arr.date, arr.weekday)} · {flag(flight.arrive.tz)}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {flight.arrive.airport} {flight.arrive.terminal}
            </div>
          </div>
        </div>

        {statusText && (
          <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-center font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{statusText}</div>
        )}

        {flight.dateWarning && now < t.departMs && (
          <div className="mt-3 rounded-xl bg-rose-100 px-3 py-2 font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-200">⚠️ {flight.dateWarning}</div>
        )}

        {/* 공항 도착 시간 */}
        {now < t.departMs && (
          <div className={`mt-3 rounded-xl px-3 py-2 ${plannedShort ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-900'}`}>
            <div>
              🛄 항공권 안내: 출발 {info.arriveHoursBefore}시간 전 <b>{md(rec.date, rec.weekday)} {rec.time}</b>까지 공항 도착
            </div>
            {planned && (
              <div className="text-sm">
                일정표상 공항 도착: {planned.time} (출발 {formatDuration(t.departMs - t.plannedArrivalMs!)} 전)
                {plannedShort && ' — 권장보다 늦어요'}
              </div>
            )}
          </div>
        )}

        {/* 수하물 */}
        <button onClick={() => setBagOpen(!bagOpen)} className="mt-3 flex w-full items-center justify-between py-1 font-bold" aria-expanded={bagOpen}>
          <span>🧳 수하물 규정 (1인당)</span>
          <span className={`text-slate-400 transition-transform ${bagOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {bagOpen && (
          <ul className="mt-1 space-y-1 text-sm">
            {info.baggage.map((b) => (
              <li key={b.label} className="flex gap-2">
                <span className="w-20 shrink-0 font-semibold">{b.label}</span>
                <span>{b.text}</span>
              </li>
            ))}
            <li className="pt-1 text-xs text-slate-500">보조배터리는 위탁 수하물에 넣을 수 없어요 (기내에만)</li>
          </ul>
        )}
      </div>
    </section>
  )
}
