// itemTime.ts: 일정의 시작·종료 시각을 글자로 (한국 시간이면 "🇰🇷" 표시)
import type { EditedItem } from '../lib/edits'
import { wallClock } from '../lib/time'

export function itemTimeLabel(it: EditedItem): { start: string; end: string | null } {
  const flag = (tz: string) => (tz === 'Asia/Seoul' ? ' 🇰🇷' : '')
  const start = wallClock(it.startMs, it.tz).time + flag(it.tz)
  if (it.openEnded) return { start, end: null }
  const endTz = it.endTz ?? it.tz
  const endWall = wallClock(it.endMs, endTz)
  const startDate = wallClock(it.startMs, it.tz).date
  const nextDay = endWall.date > startDate ? '(+1일)' : ''
  return { start, end: endWall.time + nextDay + flag(endTz) }
}
