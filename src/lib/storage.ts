// storage.ts: 폰에 값을 저장하는 도구 (localStorage = 브라우저 안의 작은 메모장)
// 앱을 껐다 켜도 체크 상태·수정한 일정이 남아 있게 해 줘요.
import { useEffect, useState } from 'react'

const PREFIX = 'nhatrang:'

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    // 시크릿 모드 등에서는 저장소를 못 쓸 수 있어요 → 기본값으로
    return fallback
  }
}

/** useState와 똑같이 쓰되, 값이 바뀔 때마다 폰에 자동 저장 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      /* 저장 실패해도 앱은 계속 동작 */
    }
  }, [key, value])
  return [value, setValue] as const
}
