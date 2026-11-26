// kindStyle.ts: 일정 종류별 아이콘·색상
// (Tailwind는 코드에 "그대로 적힌" 클래스 이름만 찾아서 디자인을 만들기 때문에 이름을 통째로 적어 둬요)
import type { ItemKind } from '../types'

interface KindStyle {
  icon: string
  label: string
  /** 아이콘 동그라미 배경 */
  dot: string
}

export const KIND_STYLE: Record<ItemKind, KindStyle> = {
  move: { icon: '🚗', label: '이동', dot: 'bg-slate-200 dark:bg-slate-600' },
  flight: { icon: '✈️', label: '비행', dot: 'bg-indigo-200 dark:bg-indigo-800' },
  airport: { icon: '🛂', label: '공항', dot: 'bg-indigo-100 dark:bg-indigo-900' },
  meal: { icon: '🍽️', label: '식사', dot: 'bg-orange-200 dark:bg-orange-800' },
  cafe: { icon: '☕', label: '카페', dot: 'bg-amber-200 dark:bg-amber-800' },
  shopping: { icon: '🛍️', label: '쇼핑', dot: 'bg-pink-200 dark:bg-pink-800' },
  massage: { icon: '💆', label: '마사지', dot: 'bg-purple-200 dark:bg-purple-800' },
  sightseeing: { icon: '📸', label: '구경', dot: 'bg-teal-200 dark:bg-teal-800' },
  checkin: { icon: '🏨', label: '숙소', dot: 'bg-sky-200 dark:bg-sky-800' },
  free: { icon: '🏖️', label: '자유시간', dot: 'bg-emerald-200 dark:bg-emerald-800' },
  rest: { icon: '😴', label: '휴식', dot: 'bg-emerald-100 dark:bg-emerald-900' },
  prep: { icon: '🧳', label: '준비', dot: 'bg-slate-200 dark:bg-slate-600' },
  end: { icon: '🏠', label: '도착', dot: 'bg-sky-200 dark:bg-sky-800' },
  expense: { icon: '💸', label: '지출', dot: 'bg-lime-200 dark:bg-lime-800' },
}
