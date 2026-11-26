// trip.tsx: 모든 탭이 함께 쓰는 "공용 상태".
// 비유: 여러 방(탭)에서 같이 보는 거실 화이트보드. 한 탭에서 일정을 미루면 다른 탭에도 바로 반영돼요.
// React에서는 이런 공용 상태를 Context(컨텍스트)라고 불러요.
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import scheduleJson from '../data/schedule.json'
import { buildEditedTimeline, type EditedItem, type Edits, type ItemEdit } from '../lib/edits'
import { useNow } from '../lib/now'
import { useStoredState } from '../lib/storage'
import { getTripStatus, type TripStatus } from '../lib/time'
import type { CustomItem, Schedule } from '../types'

export const schedule = scheduleJson as Schedule

interface TripValue {
  schedule: Schedule
  now: number
  isFakeNow: boolean
  timeline: EditedItem[]
  status: TripStatus & { current: EditedItem | null; next: EditedItem | null }
  edits: Edits
  updateEdit: (id: string, patch: Partial<ItemEdit>) => void
  /** 시간·장소·메모·건너뛰기·미루기를 원래대로 (사용 금액은 남김) */
  resetEdit: (id: string) => void
  /** 사용자가 고른 장소 (예: { "d4-massage": "ocean-spa", "d2-06": "dinos-gelato" }) */
  choices: Record<string, string>
  setChoice: (key: string, placeId: string) => void
  /** 직접 추가한 일정·지출 */
  customItems: CustomItem[]
  saveCustomItem: (item: CustomItem) => void
  deleteCustomItem: (id: string) => void
  /** 체크리스트 체크 상태 */
  checks: Record<string, boolean>
  toggleCheck: (id: string) => void
}

const TripContext = createContext<TripValue | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const { now, isFake } = useNow()
  const [edits, setEdits] = useStoredState<Edits>('edits', {})
  const [choices, setChoices] = useStoredState<Record<string, string>>('choices', {})
  const [customItems, setCustomItems] = useStoredState<CustomItem[]>('customItems', [])
  const [checks, setChecks] = useStoredState<Record<string, boolean>>('checks', {})

  const timeline = useMemo(() => buildEditedTimeline(schedule, edits, customItems), [edits, customItems])
  const status = useMemo(() => {
    // 건너뛴 일정은 "지금 할 일"에서 제외
    const active = timeline.filter((t) => !t.skipped)
    return getTripStatus(now, active) as TripValue['status']
  }, [now, timeline])

  const value: TripValue = {
    schedule,
    now,
    isFakeNow: isFake,
    timeline,
    status,
    edits,
    updateEdit: (id, patch) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })),
    resetEdit: (id) =>
      setEdits((prev) => {
        const next = { ...prev }
        const actual = prev[id]?.actual
        if (actual) next[id] = { actual }
        else delete next[id]
        return next
      }),
    choices,
    setChoice: (key, placeId) => setChoices((prev) => ({ ...prev, [key]: placeId })),
    customItems,
    saveCustomItem: (item) =>
      setCustomItems((prev) => {
        const i = prev.findIndex((c) => c.id === item.id)
        if (i < 0) return [...prev, item]
        const copy = [...prev]
        copy[i] = item
        return copy
      }),
    deleteCustomItem: (id) => {
      setCustomItems((prev) => prev.filter((c) => c.id !== id))
      setEdits((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    checks,
    toggleCheck: (id) => setChecks((prev) => ({ ...prev, [id]: !prev[id] })),
  }

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip(): TripValue {
  const v = useContext(TripContext)
  if (!v) throw new Error('useTrip은 TripProvider 안에서만 쓸 수 있어요')
  return v
}
