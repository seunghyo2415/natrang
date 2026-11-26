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
 * 그랩 앱 열기.
 * 안드로이드: "intent" 주소로 설치된 그랩 앱을 바로 열고, 앱이 없으면 그랩 홈페이지로.
 * (com.grabtaxi.passenger = 플레이 스토어의 그랩 앱 이름표)
 */
export function grabUrl(): string {
  const fallback = encodeURIComponent('https://www.grab.com/vn/en/')
  return isAndroid()
    ? `intent://#Intent;package=com.grabtaxi.passenger;S.browser_fallback_url=${fallback};end`
    : 'https://www.grab.com/vn/en/'
}
