// time.ts: 앱의 "시계 두뇌".
//
// 핵심 아이디어: 모든 일정 시각을 "UTC 기준 밀리초(절대시각)"라는 하나의 숫자로 바꿔서 비교해요.
// - 서울 07:35 와 베트남 10:35 는 겉보기엔 숫자가 다르지만, 절대시각으로 바꾸면 크기를 바로 비교할 수 있어요.
// - 폰의 시간대 설정(new Date()의 지역 시간)은 일부러 쓰지 않아요. 폰이 한국 시간으로 돼 있든
//   베트남 시간으로 돼 있든 결과가 똑같이 나오게 하기 위해서예요.
//
// 한국(UTC+9)과 베트남(UTC+7)은 서머타임이 없어서 시차가 1년 내내 고정이에요.
// 그래서 복잡한 시간대 라이브러리 없이 고정된 차이(분)만으로 정확하게 계산할 수 있어요.

import type { Schedule, ScheduleDay, ScheduleItem, TimeZone } from '../types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** 각 시간대가 UTC보다 몇 분 빠른지 */
export const TZ_OFFSET_MIN: Record<TimeZone, number> = {
  'Asia/Seoul': 9 * 60,
  'Asia/Ho_Chi_Minh': 7 * 60,
}

export const LOCAL_TZ: TimeZone = 'Asia/Ho_Chi_Minh'
export const HOME_TZ: TimeZone = 'Asia/Seoul'

/** "2026-12-17" + "04:30" + 서울 → 절대시각(ms) */
export function toInstant(date: string, time: string, tz: TimeZone, dayOffset = 0): number {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return Date.UTC(y, m - 1, d + dayOffset, hh, mm) - TZ_OFFSET_MIN[tz] * MINUTE
}

export interface WallClock {
  date: string // "2026-12-17"
  time: string // "04:30"
  weekday: string // "수"
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')

/** 절대시각 → 특정 시간대의 벽시계 시각 */
export function wallClock(ms: number, tz: TimeZone): WallClock {
  const d = new Date(ms + TZ_OFFSET_MIN[tz] * MINUTE)
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    weekday: WEEKDAYS[d.getUTCDay()],
  }
}

/** 타임라인 항목 = 원래 일정 + 계산된 절대시각 */
export interface TimedItem extends ScheduleItem {
  day: number
  date: string
  startMs: number
  endMs: number
  /** 종료 시간이 원래 비어 있어서 "다음 일정 전까지"로 채운 경우 true */
  openEnded: boolean
}

/** 시간을 차지하지 않는 "지출 기록" 항목인지 */
export const isMarker = (item: Pick<ScheduleItem, 'kind'>) => item.kind === 'expense'

/** 일정 전체를 시간 순서대로 한 줄로 펼치고, 각 항목의 시작·종료 절대시각을 계산 */
export function buildTimeline(schedule: Pick<Schedule, 'days'>): TimedItem[] {
  const flat: { day: ScheduleDay; item: ScheduleItem; startMs: number }[] = []
  for (const day of schedule.days) {
    for (const item of day.items) {
      flat.push({ day, item, startMs: toInstant(day.date, item.start, item.tz) })
    }
  }
  flat.sort((a, b) => a.startMs - b.startMs)

  return flat.map(({ day, item, startMs }, i) => {
    let endMs: number
    let openEnded = false
    // 다음 "진짜 일정" (지출 기록은 시간을 차지하지 않으니 건너뜀)
    const nextReal = flat.slice(i + 1).find((f) => !isMarker(f.item))
    if (isMarker(item)) {
      // 지출만 기록한 항목: 시작 = 끝 (한 순간)
      return { ...item, day: day.day, date: day.date, startMs, endMs: startMs, openEnded: false }
    } else if (item.end) {
      endMs = toInstant(day.date, item.end, item.endTz ?? item.tz, item.endDayOffset ?? 0)
    } else if (nextReal) {
      // 종료시간 없음 → 다음 일정 시작까지
      endMs = nextReal.startMs
      openEnded = true
    } else {
      // 마지막 항목(여행 종료) → 그날 자정까지
      endMs = toInstant(day.date, '00:00', item.tz, 1)
      openEnded = true
    }
    if (endMs <= startMs) {
      throw new Error(`일정 ${item.id}: 종료(${item.end})가 시작(${item.start})보다 빠릅니다`)
    }
    return { ...item, day: day.day, date: day.date, startMs, endMs, openEnded }
  })
}

export type TripPhase = 'before' | 'during' | 'after'

export interface TripStatus {
  phase: TripPhase
  /** 지금 진행 중인 일정 (없을 수 있음) */
  current: TimedItem | null
  /** 다음 일정 */
  next: TimedItem | null
  /** 오늘이 며칠차인지 (여행 중일 때) */
  dayNumber: number | null
}

/** "지금" 시각을 받아서 여행 상태를 판정 */
export function getTripStatus(now: number, allItems: TimedItem[]): TripStatus {
  // 지출 기록은 "지금 할 일" 판정에서 제외
  const timeline = allItems.filter((t) => !isMarker(t))
  const first = timeline[0]
  const last = timeline[timeline.length - 1]
  if (now < first.startMs) {
    return { phase: 'before', current: null, next: first, dayNumber: null }
  }
  if (now >= last.endMs) {
    return { phase: 'after', current: null, next: null, dayNumber: null }
  }
  // 진행 중인 일정: 이미 시작했고 아직 안 끝난 것 중 가장 늦게 시작한 것
  let current: TimedItem | null = null
  for (const it of timeline) {
    if (it.startMs <= now && now < it.endMs) current = it
  }
  const next = timeline.find((it) => it.startMs > now) ?? null
  const dayNumber = current?.day ?? next?.day ?? null
  return { phase: 'during', current, next, dayNumber }
}

/** 출발일까지 남은 날짜 (한국 달력 기준). 출발 당일 = 0 */
export function daysUntil(now: number, targetDate: string, tz: TimeZone = HOME_TZ): number {
  const today = wallClock(now, tz).date
  return Math.round((toInstant(targetDate, '00:00', tz) - toInstant(today, '00:00', tz)) / DAY)
}

/** 남은 시간을 "1시간 5분" 같은 한국어로 */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / MINUTE))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  // 이틀 이상 남았으면 "20일 13시간"처럼
  if (h >= 48) return `${Math.floor(h / 24)}일 ${h % 24}시간`
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

/**
 * 테스트용 "가짜 현재 시각" 읽기. 예: ?now=2026-12-18T15:20+07:00
 * 주의: 인터넷 주소에서 '+'는 공백으로 바뀌어 들어오기 때문에 다시 '+'로 되돌려요.
 */
export function parseNowParam(search: string): number | null {
  const raw = new URLSearchParams(search).get('now')
  if (!raw) return null
  const ms = Date.parse(raw.replace(' ', '+'))
  return Number.isNaN(ms) ? null : ms
}
