// App: 앱 전체 틀 — 위쪽 제목 줄, 가운데 화면, 아래쪽 탭 4개
import { useEffect, useState } from 'react'
import FullSchedule from './pages/FullSchedule'
import Nearby from './pages/Nearby'
import Today from './pages/Today'
import Check from './pages/Check'
import { TripProvider, useTrip } from './state/trip'
import { PwaNotice } from './components/PwaNotice'
import { useOnline } from './lib/online'
import { goTab, initTabHistory, onTabChange, readTab, type TabId } from './lib/nav'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: '오늘', icon: '☀️' },
  { id: 'all', label: '전체', icon: '🗓️' },
  { id: 'nearby', label: '주변', icon: '🧭' },
  { id: 'check', label: '체크', icon: '✅' },
]

/** 지금 탭을 주소 끝(#all 등)에 기억 → 새로고침해도 같은 탭. 뒤로 가기 규칙은 lib/nav.ts */
function useHashTab(): [TabId, (t: TabId) => void] {
  const [tab, setTab] = useState<TabId>(() => {
    initTabHistory()
    return readTab()
  })
  useEffect(() => onTabChange(() => setTab(readTab())), [])
  return [tab, goTab]
}

function Shell() {
  const [tab, go] = useHashTab()
  const { isFakeNow } = useTrip()
  const online = useOnline()

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="flex items-center justify-between gap-2 bg-sky-600 px-4 py-3 text-white dark:bg-sky-900">
        <h1 className="min-w-0 truncate text-xl font-bold">🏝️ 나트랑 여행 도우미</h1>
        <div className="flex shrink-0 gap-1.5 whitespace-nowrap">
          {isFakeNow && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-950">테스트</span>}
          {/* 인터넷이 끊기면 표시: 일정·계산기·체크는 그대로 되고, 지도·그랩만 안 돼요 */}
          {!online && <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-sm font-bold text-white">📴 오프라인</span>}
        </div>
      </header>
      <PwaNotice />

      <main className="flex-1 pb-24">
        {tab === 'today' && <Today />}
        {tab === 'all' && <FullSchedule />}
        {tab === 'nearby' && <Nearby />}
        {tab === 'check' && <Check />}
      </main>

      {/* 하단 탭: 엄지로 누르기 쉽게 크게 */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-sm ${
                tab === t.id ? 'font-bold text-sky-700 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'
              }`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span className="text-2xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <TripProvider>
      <Shell />
    </TripProvider>
  )
}
