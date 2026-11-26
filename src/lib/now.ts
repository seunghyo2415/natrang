// now.ts: "지금 몇 시인지"를 화면에 알려 주는 훅(hook = 화면 조각이 쓰는 기능 부품).
// 주소에 ?now=2026-12-18T15:20+07:00 이 있으면 그 시각을 "지금"으로 삼아요 (테스트용 타임머신).
import { useEffect, useState } from 'react'
import { parseNowParam } from './time'

export function useNow(intervalMs = 15_000): { now: number; isFake: boolean } {
  const [fakeBase] = useState(() => parseNowParam(window.location.search))
  const [loadedAt] = useState(() => Date.now())
  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    const update = () => setTick(Date.now())
    const id = window.setInterval(update, intervalMs)
    // 폰 화면을 껐다 켜면 바로 시계를 새로 고침
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', update)
    }
  }, [intervalMs])

  // 가짜 시각도 실제 시간이 흐르는 만큼 같이 흘러가게
  return fakeBase != null ? { now: fakeBase + (tick - loadedAt), isFake: true } : { now: tick, isFake: false }
}
