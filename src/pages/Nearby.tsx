// 「주변」 탭: 계획대로 안 될 때 — 근처 찾기, 일정 조정, 상황별 대안, 저장해 둔 대안 장소
import { useState } from 'react'
import tipsJson from '../data/tips.json'
import { KIND_STYLE } from '../components/kindStyle'
import { PlaceActions } from '../components/PlaceActions'
import type { EditedItem } from '../lib/edits'
import { useOnline } from '../lib/online'
import { getPlace, places, searchUrl } from '../lib/places'
import { formatDuration, wallClock } from '../lib/time'
import { useTrip } from '../state/trip'

// 검색어는 구글 지도가 현지에서 잘 알아듣는 영어·베트남어로
const SEARCHES = [
  { icon: '☕', label: '근처 카페', query: 'cafe' },
  { icon: '🍽️', label: '근처 식당', query: 'restaurant' },
  { icon: '🍜', label: '근처 쌀국수', query: 'phở' },
  { icon: '💆', label: '근처 마사지', query: 'massage spa' },
  { icon: '🏪', label: '편의점·마트', query: 'convenience store' },
  { icon: '💊', label: '근처 약국', query: 'nhà thuốc pharmacy' },
  { icon: '🏧', label: 'ATM·환전', query: 'ATM' },
]

interface Situation {
  id: string
  icon: string
  title: string
  steps: string[]
  placeIds: string[]
}
const situations = tipsJson.situations as Situation[]

const card = 'rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800'

export default function Nearby() {
  const online = useOnline()
  const [open, setOpen] = useState<string | null>(null)
  const alternatives = places.filter((p) => p.category === 'alternative')

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-2xl font-bold">🧭 계획대로 안 될 때</h2>
        <p className="text-slate-600 dark:text-slate-400">버튼을 누르면 구글 지도 앱에서 지금 위치 주변을 찾아요</p>
      </div>

      {!online && (
        <div className="rounded-2xl bg-amber-100 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <b>📴 지금 오프라인이에요</b>
          <p className="mt-1 text-sm">
            주변 검색·길찾기는 구글 지도 앱이 해요. 출국 전에 구글 지도 <b>오프라인 지도(나트랑·깜란)</b>를 받아 두면 인터넷 없이도 길 안내가 돼요. 아래 상황별 대안은 인터넷 없이 볼 수 있어요.
          </p>
        </div>
      )}

      {/* 근처 찾기 큰 버튼 */}
      <section className="grid grid-cols-2 gap-3">
        {SEARCHES.map((s) => (
          <a
            key={s.label}
            href={searchUrl(s.query)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl bg-white text-lg font-bold shadow-sm active:bg-sky-50 dark:bg-slate-800 dark:active:bg-slate-700"
          >
            <span className="text-3xl">{s.icon}</span>
            {s.label}
          </a>
        ))}
      </section>

      <AdjustSchedule />

      {/* 상황별 대안 (접었다 펴기) */}
      <section className="space-y-2">
        <h2 className="px-1 text-lg font-bold">🆘 상황별 대안</h2>
        {situations.map((s) => {
          const isOpen = open === s.id
          return (
            <div key={s.id} className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800">
              <button
                onClick={() => setOpen(isOpen ? null : s.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-bold"
                aria-expanded={isOpen}
              >
                <span>
                  {s.icon} {s.title}
                </span>
                <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-3 dark:border-slate-700">
                  <ol className="list-decimal space-y-2 pl-5">
                    {s.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {s.placeIds.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-bold text-slate-500">근처 대안 장소</div>
                      {s.placeIds.map((id) => {
                        const p = getPlace(id)
                        if (!p) return null
                        return (
                          <div key={id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                            <div className="font-bold">{p.name}</div>
                            <div className="mb-2 text-sm text-slate-500">{p.memo}</div>
                            <PlaceActions place={p} compact />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* 저장해 둔 대안 장소 */}
      <section className={card}>
        <h2 className="mb-3 text-lg font-bold">⭐ 저장해 둔 추천·대안 장소</h2>
        <ul className="space-y-4">
          {alternatives.map((p) => (
            <li key={p.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-700">
              <div className="font-bold">{p.name}</div>
              <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                {p.memo} · {p.address}
              </div>
              <PlaceActions place={p} compact />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** 지금/다음 일정을 미루거나 건너뛰기 */
function AdjustSchedule() {
  const { status, edits, updateEdit, resetEdit, now, timeline } = useTrip()
  if (status.phase !== 'during') return null
  // 지금·다음 일정 + 오늘 건너뛴 일정(되돌릴 수 있게)
  const skipped = timeline.filter((t) => t.skipped && t.day === status.dayNumber && t.endMs > now)
  const targets = [status.current, status.next, ...skipped].filter(
    (t, i, arr): t is EditedItem => !!t && t.kind !== 'flight' && t.kind !== 'end' && arr.findIndex((x) => x?.id === t.id) === i,
  )
  if (targets.length === 0) return null

  return (
    <section className={card}>
      <h2 className="text-lg font-bold">⏰ 일정 조정</h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">연장·미루기를 하면 그날 이후 일정도 같이 밀려요 (비행기·공항 수속은 그대로)</p>
      <ul className="space-y-3">
        {targets.map((t) => {
          const e = edits[t.id] ?? {}
          const isCurrent = t.id === status.current?.id
          const fixed = t.kind === 'airport'
          return (
            <li key={t.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-sm text-slate-500">
                {t.skipped ? '건너뜀' : isCurrent ? '지금' : `다음 · ${formatDuration(t.startMs - now)} 후`} · {wallClock(t.startMs, t.tz).time}
                {t.shiftedBy > 0 && <span className="ml-1 font-bold text-rose-600">(+{t.shiftedBy}분 밀림)</span>}
                {t.extendedBy > 0 && <span className="ml-1 font-bold text-orange-600">({t.extendedBy}분 연장)</span>}
              </div>
              <div className="text-lg font-bold">
                {KIND_STYLE[t.kind].icon} {t.title}
              </div>
              {fixed ? (
                <p className="mt-1 text-sm text-slate-500">공항 수속 시간은 바꿀 수 없어요</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {!t.skipped && (
                    <button
                      onClick={() =>
                        isCurrent
                          ? updateEdit(t.id, { extendMin: (e.extendMin ?? 0) + 30 })
                          : updateEdit(t.id, { shiftMin: (e.shiftMin ?? 0) + 30 })
                      }
                      className="rounded-xl bg-rose-100 px-4 py-2.5 font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                    >
                      {isCurrent ? '+30분 연장' : '+30분 미루기'}
                    </button>
                  )}
                  <button
                    onClick={() => updateEdit(t.id, { skipped: !e.skipped })}
                    className="rounded-xl bg-slate-200 px-4 py-2.5 font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {e.skipped ? '건너뛰기 취소' : '건너뛰기'}
                  </button>
                  {(e.shiftMin || e.extendMin || e.skipped) && (
                    <button onClick={() => resetEdit(t.id)} className="rounded-xl px-3 py-2.5 font-semibold text-sky-700 dark:text-sky-300">
                      ↩ 원래대로
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
