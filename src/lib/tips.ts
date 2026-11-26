// tips.ts: 일정 항목에 맞는 「챙길 것 · 주의할 점」 고르기, 비상 연락처
import tipsJson from '../data/tips.json'
import type { ScheduleItem } from '../types'

export interface TipGroup {
  id: string
  title: string
  when: { kinds?: string[]; places?: string[]; ids?: string[]; days?: number[] }
  bring: string[]
  cautions: string[]
}

export interface EmergencyGroup {
  title: string
  items: { label: string; number: string }[]
  tip?: string
  source: string
  sourceLabel: string
}

export const tipGroups = tipsJson.itemTips as TipGroup[]
export const emergency = tipsJson.emergency as { verifiedAt: string; note: string; groups: EmergencyGroup[] }

/**
 * 이 일정에 해당하는 팁 묶음 (공통 팁은 맨 뒤).
 * 조건(kinds/places/ids/days) 중 하나라도 맞으면 포함. 조건이 비어 있으면 공통.
 */
export function tipsFor(item: ScheduleItem & { day: number }, placeIds: (string | undefined)[]): TipGroup[] {
  const ids = placeIds.filter(Boolean) as string[]
  const matched = tipGroups.filter(({ when: w }) => {
    if (Object.keys(w).length === 0) return false
    return (
      !!w.kinds?.includes(item.kind) ||
      !!w.ids?.includes(item.id) ||
      !!w.days?.includes(item.day) ||
      !!w.places?.some((p) => ids.includes(p))
    )
  })
  const common = tipGroups.filter((g) => Object.keys(g.when).length === 0)
  return [...matched, ...common]
}
