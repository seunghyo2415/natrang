// places.ts: 장소 찾기 + 구글 지도 주소(URL) 만들기
import placesJson from '../data/places.json'
import type { Place, Schedule, ScheduleItem } from '../types'

export const places = placesJson as Place[]
const byId = new Map(places.map((p) => [p.id, p]))

export function getPlace(id: string | undefined): Place | undefined {
  return id ? byId.get(id) : undefined
}

export const hasCoords = (p: Place) => typeof p.lat === 'number' && typeof p.lng === 'number'
export const isKnown = (v: string | number) => v !== 'TODO' && v !== ''

/** 사용자가 고른 장소(choices)를 반영해서 실제 장소 id로 바꿈 */
export function resolveRef(
  ref: string | undefined,
  item: ScheduleItem,
  schedule: Schedule,
  choices: Record<string, string>,
): string | undefined {
  if (!ref) return undefined
  if (ref.startsWith('choice:')) {
    const group = ref.slice('choice:'.length)
    return choices[group] ?? schedule.choices[group]?.default
  }
  if (ref === item.place && item.placeOptions) return choices[item.id] ?? ref
  return ref
}

/** 이 일정에 "고를 수 있는 장소"가 있으면 그 선택지 정보 */
export function placeChoiceOf(item: ScheduleItem, schedule: Schedule): { key: string; label: string; options: string[] } | null {
  if (item.placeOptions) return { key: item.id, label: '장소 바꾸기', options: item.placeOptions }
  const ref = [item.place, item.from, item.to].find((r) => r?.startsWith('choice:'))
  if (ref) {
    const key = ref.slice('choice:'.length)
    const c = schedule.choices[key]
    if (c) return { key, label: c.label, options: c.options }
  }
  return null
}

/** 화면에 보일 장소 글자: 사용자가 장소를 골랐으면 그 이름으로 */
export function displayPlaceLabel(
  item: ScheduleItem,
  schedule: Schedule,
  choices: Record<string, string>,
  labelEdited: boolean,
): string {
  const choice = placeChoiceOf(item, schedule)
  if (labelEdited || !choice || !(choice.key in choices)) return item.placeLabel
  const name = (ref?: string) => getPlace(resolveRef(ref, item, schedule, choices))?.name ?? ''
  if (item.from && item.to) return `${name(item.from)} → ${name(item.to)}`
  return name(item.place) || item.placeLabel
}

/** 일정 항목의 목적지: 이동이면 도착지, 아니면 머무는 장소 */
export function destinationOf(item: ScheduleItem, schedule: Schedule, choices: Record<string, string>) {
  return getPlace(resolveRef(item.to ?? item.place, item, schedule, choices))
}

/** 구글 지도 길찾기 (출발지를 비우면 현재 위치에서 출발) */
export function directionsUrl(p: Place): string {
  const dest = hasCoords(p) ? `${p.lat},${p.lng}` : (p.searchQuery ?? p.name)
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`
}

/** 구글 지도 검색 (현재 보이는 지도/현재 위치 주변) */
export function searchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
