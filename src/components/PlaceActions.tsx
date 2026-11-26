// PlaceActions: 장소 하나에 대한 버튼 묶음
// 길찾기 · 장소 정보 · 그랩 · 주소 복사 · 기사님께 보여주기 · 전화
import { useState } from 'react'
import { copyText, grabUrl } from '../lib/device'
import { directionsUrl, getPlace, hasCoords, isKnown } from '../lib/places'
import { Sheet } from './Sheet'
import type { Place } from '../types'
import { DirectionsButton } from './DirectionsButton'

const small =
  'inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-800 active:bg-slate-200 dark:bg-slate-700 dark:text-slate-100'

/** 기사님·그랩에 넣을 주소: 현지 주소 → 현지 이름 → 검색어 → 이름 순서로 */
export function addressFor(p: Place): string {
  if (isKnown(p.address)) return p.address as string
  if (isKnown(p.nameVi)) return p.nameVi as string
  return p.searchQuery ?? p.name
}

/** 잠깐 떴다 사라지는 안내 글 */
function useToast() {
  const [toast, setToast] = useState('')
  const show = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }
  const view = toast ? (
    <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center font-semibold text-white shadow-lg">{toast}</div>
  ) : null
  return { show, view }
}

const copyAddress = async (p: Place, show: (m: string) => void) =>
  show((await copyText(addressFor(p))) ? `📋 ${p.name} 주소를 복사했어요` : '복사에 실패했어요')

/** 그랩 열기: 목적지 칸에 붙여 넣을 수 있게 주소를 먼저 복사하고 그랩 앱을 엶 */
async function openGrab(p: Place, show: (m: string) => void) {
  await copyText(addressFor(p))
  show(`📋 ${p.name} 주소 복사됨 — 그랩 목적지에 붙여 넣으세요`)
  const dest = hasCoords(p) ? { lat: p.lat as number, lng: p.lng as number } : undefined
  window.setTimeout(() => (window.location.href = grabUrl(dest)), 400)
}

export function PlaceActions({ place, compact = false, suggestId }: { place?: Place; compact?: boolean; suggestId?: string }) {
  if (!place) return null
  // 넓은 지역(나트랑 시내 등): 버튼마다 "어디로 갈까요?" 창을 먼저 띄움
  if (place.areaSpots) return <AreaActions area={place} compact={compact} suggestId={suggestId} />
  return <SpotActions place={place} compact={compact} />
}

type AreaAction = 'directions' | 'grab' | 'copy' | 'driver'
const AREA_ACTIONS: { id: AreaAction; label: string; title: string }[] = [
  { id: 'directions', label: '🧭 길찾기', title: '🧭 어디로 길찾기 할까요?' },
  { id: 'grab', label: '🚕 그랩', title: '🚕 그랩으로 어디 갈까요?' },
  { id: 'copy', label: '📋 주소 복사', title: '📋 어느 곳 주소를 복사할까요?' },
  { id: 'driver', label: '🪧 기사님께 보여주기', title: '🪧 기사님께 어디를 보여 줄까요?' },
]

/** 넓은 지역: 길찾기·그랩·주소 복사·기사님께 버튼 → 누르면 갈 곳 고르기 */
function AreaActions({ area, compact, suggestId }: { area: Place; compact: boolean; suggestId?: string }) {
  const [action, setAction] = useState<AreaAction | null>(null)
  const [driver, setDriver] = useState<Place | null>(null)
  const { show, view } = useToast()
  const spots = (area.areaSpots ?? []).map(getPlace).filter((p): p is Place => !!p)
  // 다음 일정 장소를 맨 위로
  spots.sort((a, b) => Number(b.id === suggestId) - Number(a.id === suggestId))
  const current = AREA_ACTIONS.find((a) => a.id === action)

  const pick = (p: Place) => {
    setAction(null)
    if (action === 'grab') void openGrab(p, show)
    else if (action === 'copy') void copyAddress(p, show)
    else if (action === 'driver') setDriver(p)
  }

  const row = 'flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left dark:bg-slate-900'
  const spotText = (p: Place) => (
    <span className="min-w-0">
      <b>{p.name}</b>
      {p.id === suggestId && <span className="ml-1.5 rounded-full bg-amber-200 px-2 text-xs font-bold text-amber-900">다음 일정</span>}
      {p.memo && <span className="block text-sm text-slate-500 dark:text-slate-400">{p.memo}</span>}
    </span>
  )

  return (
    <div className="relative">
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-1'}`}>
        {AREA_ACTIONS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setAction(a.id)}
            className={
              i === 0
                ? `inline-flex items-center justify-center gap-1.5 rounded-2xl bg-sky-600 font-bold text-white shadow active:bg-sky-700 ${compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-base'}`
                : small
            }
          >
            {a.label}
          </button>
        ))}
      </div>
      {current && (
        <Sheet title={current.title} onClose={() => setAction(null)}>
          <p className="-mt-2 mb-3 text-sm text-slate-500 dark:text-slate-400">{area.name} 안의 장소예요</p>
          <ul className="space-y-2">
            {spots.map((p) => (
              <li key={p.id}>
                {action === 'directions' ? (
                  // 길찾기는 링크로 열어야 폰에서 구글 지도 앱이 바로 열려요
                  <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className={row} onClick={() => setAction(null)}>
                    {spotText(p)}
                    <span className="text-xl">🧭</span>
                  </a>
                ) : (
                  <button onClick={() => pick(p)} className={row}>
                    {spotText(p)}
                    <span className="text-xl">{current.label.split(' ')[0]}</span>
                  </button>
                )}
              </li>
            ))}
            {action === 'directions' && (
              <li>
                <a
                  href={directionsUrl(area)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAction(null)}
                  className="block rounded-2xl border-2 border-dashed border-slate-300 px-4 py-3 text-center font-semibold dark:border-slate-600"
                >
                  🧭 {area.name} 중심으로 길찾기
                </a>
              </li>
            )}
          </ul>
        </Sheet>
      )}
      {view}
      {driver && <DriverCard place={driver} onClose={() => setDriver(null)} />}
    </div>
  )
}

/** 장소 하나의 버튼 묶음 */
function SpotActions({ place, compact }: { place: Place; compact: boolean }) {
  const [driver, setDriver] = useState(false)
  const { show, view } = useToast()
  const copy = () => copyAddress(place, show)

  return (
    <div className="relative">
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-1'}`}>
        <DirectionsButton place={place} className={compact ? '!px-3 !py-2.5 !text-sm' : ''} />
        {isKnown(place.googleMapsUrl) && (
          <a href={place.googleMapsUrl as string} target="_blank" rel="noopener noreferrer" className={small}>
            ℹ️ 장소 정보
          </a>
        )}
        <button onClick={() => openGrab(place, show)} className={small}>
          🚕 그랩
        </button>
        <button onClick={copy} className={small}>
          📋 주소 복사
        </button>
        <button onClick={() => setDriver(true)} className={small}>
          🪧 기사님께 보여주기
        </button>
        {isKnown(place.phone) && (
          <a href={`tel:${(place.phone as string).replace(/\s/g, '')}`} className={small}>
            📞 전화
          </a>
        )}
      </div>
      {view}
      {driver && <DriverCard place={place} onClose={() => setDriver(false)} />}
    </div>
  )
}

/** 기사님께 보여주기: 화면 가득 현지어 주소를 큰 글씨로 */
function DriverCard({ place, onClose }: { place: Place; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white p-6 text-slate-950" onClick={onClose}>
      <div className="text-lg text-slate-500">Xin vui lòng đưa tôi đến địa chỉ này.</div>
      <div className="text-sm text-slate-400">(이 주소로 데려다 주세요)</div>
      <div className="mt-6 flex-1 space-y-5 overflow-y-auto">
        {isKnown(place.nameVi) && <div className="text-4xl font-black leading-tight">{place.nameVi}</div>}
        <div className="text-3xl font-bold leading-snug">{addressFor(place)}</div>
        {isKnown(place.phone) && <div className="text-2xl tabular-nums">☎ {place.phone}</div>}
        {!isKnown(place.address) && (
          <div className="rounded-xl bg-amber-100 p-3 text-base text-amber-900">⚠️ 정확한 주소가 아직 없어요 (위치 미확정). 구글 지도 화면을 함께 보여 주세요.</div>
        )}
      </div>
      <button className="mt-4 rounded-2xl bg-slate-900 py-4 text-xl font-bold text-white">닫기 (화면 아무 곳이나 눌러도 돼요)</button>
    </div>
  )
}
