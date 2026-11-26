// flights.ts: 항공편 시간 계산 (출발·도착 절대시각, 비행시간, 공항 도착 권장 시각)
import type { Flight } from '../types'
import type { EditedItem } from './edits'
import { toInstant } from './time'

const HOUR = 3_600_000

export interface FlightTimes {
  departMs: number
  arriveMs: number
  durationMs: number
  /** 항공사 권장: 이 시각까지 공항 도착 */
  recommendedArrivalMs: number
  /** 일정표상 공항 도착 시각 (일정을 미루면 같이 바뀜) */
  plannedArrivalMs: number | null
}

export function flightTimes(f: Flight, hoursBefore: number, timeline: EditedItem[]): FlightTimes {
  const departMs = toInstant(f.depart.date, f.depart.time, f.depart.tz)
  const arriveMs = toInstant(f.arrive.date, f.arrive.time, f.arrive.tz)
  const planned = timeline.find((t) => t.id === f.airportArrivalItemId)
  return {
    departMs,
    arriveMs,
    durationMs: arriveMs - departMs,
    recommendedArrivalMs: departMs - hoursBefore * HOUR,
    plannedArrivalMs: planned ? planned.startMs : null,
  }
}

/** 지금 보여 줄 항공편: 아직 도착 안 한 첫 비행 중, 출발 하루 전부터 */
export function relevantFlight(flights: Flight[], now: number): Flight | null {
  for (const f of flights) {
    const departMs = toInstant(f.depart.date, f.depart.time, f.depart.tz)
    const arriveMs = toInstant(f.arrive.date, f.arrive.time, f.arrive.tz)
    if (now < arriveMs) return now >= departMs - 24 * HOUR ? f : null
  }
  return null
}
