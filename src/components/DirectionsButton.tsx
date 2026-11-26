// DirectionsButton: 구글 지도 길찾기 버튼
// - 좌표가 있으면 좌표로, 없으면 이름으로 검색해서 길찾기
// - 「나트랑 시내」처럼 넓은 곳은 대표 지점을 고르는 창을 먼저 띄움
// - 안드로이드에서 google.com/maps 링크를 누르면 구글 지도 앱이 바로 열려요
import { useState } from 'react'
import { directionsUrl, getPlace, hasCoords } from '../lib/places'
import type { Place } from '../types'
import { Sheet } from './Sheet'

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-2xl bg-sky-600 px-4 py-3 text-base font-bold text-white shadow active:bg-sky-700'

export function DirectionsButton({ place, label = '길찾기', className = '' }: { place?: Place; label?: string; className?: string }) {
  const [pickArea, setPickArea] = useState(false)
  if (!place) return null
  // 집(밀양)처럼 길찾기 대상이 아닌 곳
  if (place.category === 'home' && !place.searchQuery) return null

  if (place.areaSpots) {
    return (
      <>
        <button onClick={() => setPickArea(true)} className={`${btn} ${className}`}>
          🧭 {label}
        </button>
        {pickArea && <AreaSheet area={place} onClose={() => setPickArea(false)} />}
      </>
    )
  }

  return (
    <a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer" className={`${btn} ${className}`}>
      🧭 {label}
      {!hasCoords(place) && <span className="rounded bg-amber-300 px-1.5 text-xs text-amber-950">위치 미확정</span>}
    </a>
  )
}

/** 넓은 지역 → 대표 지점 고르기 */
function AreaSheet({ area, onClose }: { area: Place; onClose: () => void }) {
  const spots = (area.areaSpots ?? []).map(getPlace).filter((p): p is Place => !!p)
  return (
    <Sheet title={`${area.name} — 어디로 갈까요?`} onClose={onClose}>
      <ul className="space-y-2">
        {spots.map((p) => (
          <li key={p.id}>
            <a
              href={directionsUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900"
            >
              <span>
                <b>{p.name}</b>
                <span className="block text-sm text-slate-500 dark:text-slate-400">{p.memo}</span>
              </span>
              <span className="text-xl">🧭</span>
            </a>
          </li>
        ))}
        <li>
          <a
            href={directionsUrl(area)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border-2 border-dashed border-slate-300 px-4 py-3 text-center font-semibold dark:border-slate-600"
          >
            {area.name} 중심으로 길찾기
          </a>
        </li>
      </ul>
    </Sheet>
  )
}
