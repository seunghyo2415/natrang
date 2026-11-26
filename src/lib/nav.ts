// nav.ts: 탭 이동과 「뒤로 가기」 규칙
// 브라우저는 페이지를 옮길 때마다 "방문 기록"을 한 칸씩 쌓아요. 그대로 두면 뒤로 가기를 누를 때
// 들렀던 탭을 전부 거꾸로 다시 지나가요.
// 그래서 기록을 항상 [오늘] 또는 [오늘, 다른 탭 1개] 로만 유지해요.
//   → 다른 탭에서 뒤로 가기 1번 = 「오늘」, 「오늘」에서 1번 더 = 앱 종료
export const TAB_IDS = ['today', 'all', 'nearby', 'check'] as const
export type TabId = (typeof TAB_IDS)[number]

const TAB_EVENT = 'tabchange'
/** 「오늘」 위에 얹힌 칸이라는 표시 */
const LAYER = { tabLayer: true }

export function readTab(): TabId {
  const h = window.location.hash.slice(1)
  return (TAB_IDS as readonly string[]).includes(h) ? (h as TabId) : 'today'
}

/** ?now= 같은 주소 뒷부분은 그대로 두고 # 부분만 바꾼 주소 */
const urlFor = (t: TabId) => `${window.location.pathname}${window.location.search}#${t}`
const isLayer = () => !!(window.history.state as { tabLayer?: boolean } | null)?.tabLayer

/** 탭 이동 (하단 탭 · 화면 안의 "전체 보기 →" 같은 링크 모두 이걸로) */
export function goTab(t: TabId) {
  const cur = readTab()
  window.scrollTo(0, 0)
  if (t === cur) return
  if (t === 'today') {
    // 「오늘」 위에 얹힌 칸을 걷어내면 「오늘」로 돌아감 (기록이 쌓이지 않음)
    if (isLayer()) return window.history.back()
    window.history.replaceState(null, '', urlFor('today'))
  } else if (cur === 'today') {
    window.history.pushState(LAYER, '', urlFor(t)) // 「오늘」 위에 한 칸 얹기
  } else {
    window.history.replaceState(LAYER, '', urlFor(t)) // 얹힌 칸을 바꿔 끼우기 (칸 수는 그대로)
  }
  window.dispatchEvent(new Event(TAB_EVENT))
}

/** 앱 시작 시: #all 같은 주소로 바로 열렸으면 기록을 [오늘, 그 탭] 으로 맞춰 둠 */
export function initTabHistory() {
  const t = readTab()
  if (t !== 'today' && !isLayer()) {
    window.history.replaceState(null, '', urlFor('today'))
    window.history.pushState(LAYER, '', urlFor(t))
  }
}

/** 탭이 바뀔 때(뒤로 가기 포함) 알려 줌. 반환값은 알림 끄기 함수 */
export function onTabChange(cb: () => void): () => void {
  window.addEventListener('popstate', cb)
  window.addEventListener(TAB_EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(TAB_EVENT, cb)
  }
}
