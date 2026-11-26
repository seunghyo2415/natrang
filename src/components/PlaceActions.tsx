// PlaceActions: 장소 하나에 대한 버튼 묶음
// 길찾기 · 장소 정보 · 그랩 · 주소 복사 · 기사님께 보여주기 · 전화
import { useState } from 'react'
import { copyText, grabUrl } from '../lib/device'
import { hasCoords, isKnown } from '../lib/places'
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

export function PlaceActions({ place, compact = false }: { place?: Place; compact?: boolean }) {
  const [toast, setToast] = useState('')
  const [driver, setDriver] = useState(false)
  if (!place) return null
  // 넓은 지역은 길찾기(대표 지점 선택)만
  if (place.areaSpots) return <DirectionsButton place={place} className={compact ? '!py-2.5 !text-sm' : 'w-full'} />

  const show = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }
  const copy = async () => show((await copyText(addressFor(place))) ? '📋 주소를 복사했어요' : '복사에 실패했어요')
  const openGrab = async () => {
    // 그랩 목적지 칸에 붙여 넣을 수 있게 주소를 먼저 복사
    await copyText(addressFor(place))
    show('📋 주소 복사됨 — 그랩 목적지에 붙여 넣으세요')
    const dest = hasCoords(place) ? { lat: place.lat as number, lng: place.lng as number } : undefined
    window.setTimeout(() => (window.location.href = grabUrl(dest)), 400)
  }

  return (
    <div className="relative">
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-1'}`}>
        <DirectionsButton place={place} className={compact ? '!px-3 !py-2.5 !text-sm' : ''} />
        {isKnown(place.googleMapsUrl) && (
          <a href={place.googleMapsUrl as string} target="_blank" rel="noopener noreferrer" className={small}>
            ℹ️ 장소 정보
          </a>
        )}
        <button onClick={openGrab} className={small}>
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
      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-sm rounded-2xl bg-slate-900 px-4 py-3 text-center font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
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
