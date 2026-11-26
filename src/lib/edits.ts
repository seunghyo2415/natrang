// edits.ts: 현지에서 일정을 바꿨을 때(수정·건너뛰기·미루기·완료·사용 금액) 원래 일정 위에 덧씌우는 로직.
// 원본 schedule.json 은 그대로 두고 "바뀐 부분"만 따로 저장해요 → 언제든 원래대로 되돌릴 수 있어요.
import type { Cost, CustomItem, Schedule } from '../types'
import { buildTimeline, isMarker, toInstant, type TimedItem } from './time'

export interface ItemEdit {
  start?: string
  end?: string
  placeLabel?: string
  note?: string
  /** 건너뛰기 */
  skipped?: boolean
  /** 이 일정부터 뒤로 미룬 시간(분). 같은 날 이후 일정도 같이 밀림 */
  shiftMin?: number
  /** 이 일정을 늘린 시간(분). 끝나는 시간이 늦어지고, 같은 날 이후 일정이 같이 밀림 */
  extendMin?: number
  /** 완료 표시 */
  done?: boolean
  /** 실제로 쓴 금액 */
  actual?: Cost
}

export type Edits = Record<string, ItemEdit>

export interface EditedItem extends TimedItem {
  skipped: boolean
  done: boolean
  /** 미루기로 밀린 총 시간(분) */
  shiftedBy: number
  /** 연장한 시간(분) */
  extendedBy: number
  /** 시간·장소·메모를 직접 고쳤는지 */
  edited: boolean
  /** 실제로 쓴 금액 (입력했을 때만) */
  actual?: Cost
}

/** 미루기를 해도 움직이지 않는 일정 (비행기·공항 수속은 시간이 정해져 있음) */
const FIXED_KINDS = new Set(['flight', 'airport', 'end'])
const MIN = 60_000

/** 직접 추가한 항목이 올바른지 (종료가 시작보다 늦은지) */
export function isValidCustom(c: CustomItem, schedule: Schedule): boolean {
  const day = schedule.days.find((d) => d.day === c.day)
  if (!day || !/^\d{2}:\d{2}$/.test(c.start)) return false
  if (!c.end || isMarker(c)) return true
  return toInstant(day.date, c.end, c.tz) > toInstant(day.date, c.start, c.tz)
}

/** 원래 일정 + 직접 추가한 항목 합치기 */
export function mergeCustom(schedule: Schedule, custom: CustomItem[]): Schedule {
  const ok = custom.filter((c) => isValidCustom(c, schedule))
  return {
    ...schedule,
    days: schedule.days.map((d) => ({
      ...d,
      items: [...d.items, ...ok.filter((c) => c.day === d.day)],
    })),
  }
}

function applyFieldEdits(schedule: Schedule, edits: Edits): Schedule {
  return {
    ...schedule,
    days: schedule.days.map((d) => ({
      ...d,
      items: d.items.map((it) => {
        const e = edits[it.id]
        if (!e) return it
        return {
          ...it,
          start: e.start ?? it.start,
          end: e.end ?? it.end,
          placeLabel: e.placeLabel ?? it.placeLabel,
          note: e.note ?? it.note,
        }
      }),
    })),
  }
}

export function buildEditedTimeline(schedule: Schedule, edits: Edits, custom: CustomItem[] = []): EditedItem[] {
  const merged = mergeCustom(schedule, custom)
  let base: TimedItem[]
  try {
    base = buildTimeline(applyFieldEdits(merged, edits))
  } catch {
    // 잘못된 수정(종료가 시작보다 빠름 등)이 저장돼 있으면 수정 없이
    base = buildTimeline(merged)
  }

  const items: EditedItem[] = base.map((t) => {
    const e = edits[t.id] ?? {}
    return {
      ...t,
      skipped: !!e.skipped,
      done: !!e.done,
      shiftedBy: 0,
      extendedBy: e.extendMin ?? 0,
      edited: e.start != null || e.end != null || e.placeLabel != null || e.note != null,
      actual: e.actual,
    }
  })

  // 같은 날의 이후 일정을 민다 (비행·공항 일정을 만나면 멈춤)
  const pushLater = (i: number, minutes: number) => {
    for (let j = i + 1; j < items.length; j++) {
      const t = items[j]
      if (t.day !== items[i].day || FIXED_KINDS.has(t.kind)) break
      t.startMs += minutes * MIN
      t.endMs += minutes * MIN
      t.shiftedBy += minutes
    }
  }

  items.forEach((origin, i) => {
    const e = edits[origin.id]
    // 미루기: 그 일정의 시작·끝 + 이후 일정
    if (e?.shiftMin) {
      origin.startMs += e.shiftMin * MIN
      origin.endMs += e.shiftMin * MIN
      origin.shiftedBy += e.shiftMin
      pushLater(i, e.shiftMin)
    }
    // 연장: 그 일정의 끝 + 이후 일정
    if (e?.extendMin) {
      origin.endMs += e.extendMin * MIN
      pushLater(i, e.extendMin)
    }
  })

  // "다음 일정 전까지" 항목은 밀린 뒤의 다음 일정 시작에 다시 맞춤
  items.forEach((t, i) => {
    if (!t.openEnded) return
    const nextReal = items.slice(i + 1).find((n) => !isMarker(n))
    if (nextReal) t.endMs = Math.max(t.startMs + MIN, nextReal.startMs)
  })

  return items
}
