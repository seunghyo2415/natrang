// device.ts: 폰 기능 도우미 (복사하기, 그랩 앱 열기)

/** 글자를 클립보드에 복사. 성공하면 true */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 오래된 브라우저용 예비 방법
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export const isAndroid = () => /Android/i.test(navigator.userAgent)

/**
 * 그랩 앱 열기 주소.
 * 안드로이드: "intent" 주소로 설치된 그랩 앱의 **차량 호출 화면**을 열고, 앱이 없으면 그랩 홈페이지로.
 * - com.grabtaxi.passenger = 플레이 스토어의 그랩 앱 이름표
 * - grab://open?screenType=BOOKING = 그랩 앱 안의 "호출 화면"으로 가는 길 (공식 문서는 없고 사용 예시로 확인)
 * - 예전엔 화면 지정 없이 앱만 불렀더니, 그랩이 "어느 화면?"을 몰라 켜졌다가 바로 꺼졌어요
 * - 좌표를 아는 장소면 도착지 좌표도 같이 넘겨요 (안 먹히면 복사해 둔 주소를 붙여 넣으면 돼요)
 */
export function grabUrl(dest?: { lat: number; lng: number }, android = isAndroid()): string {
  const web = 'https://www.grab.com/vn/en/'
  if (!android) return web
  const q = new URLSearchParams({ screenType: 'BOOKING' })
  if (dest) {
    q.set('dropOffLatitude', String(dest.lat))
    q.set('dropOffLongitude', String(dest.lng))
  }
  return `intent://open?${q}#Intent;scheme=grab;package=com.grabtaxi.passenger;S.browser_fallback_url=${encodeURIComponent(web)};end`
}
