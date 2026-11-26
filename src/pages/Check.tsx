// 「체크」 탭: 계산기 · 예약·확인 할 일 · 준비물 · 주의사항 · 비상 연락처
import { useState } from 'react'
import checklists from '../data/checklists.json'
import { Calculator } from '../components/Calculator'
import { Checklist } from '../components/Checklist'
import { FlightCard } from '../components/FlightCard'
import { emergency, tipGroups } from '../lib/tips'
import { useTrip } from '../state/trip'

const card = 'rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-800'

export default function Check() {
  const { schedule } = useTrip()
  const [openTip, setOpenTip] = useState<string | null>(null)

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">✅ 체크</h2>

      <Calculator rate={schedule.vndPerKrw} />

      <Checklist title={`📞 ${checklists.reservations.title}`} items={checklists.reservations.items} />
      <Checklist title={`🎒 ${checklists.packing.title}`} items={checklists.packing.items} />

      {/* 주의사항 (접었다 펴기) */}
      <section className="space-y-2">
        <h2 className="px-1 text-lg font-bold">⚠️ 주의사항·챙길 것</h2>
        {tipGroups.map((g) => {
          const open = openTip === g.id
          return (
            <div key={g.id} className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-slate-800">
              <button
                onClick={() => setOpenTip(open ? null : g.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-lg font-bold"
                aria-expanded={open}
              >
                {g.title}
                <span className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-slate-100 px-5 pb-5 pt-3 dark:border-slate-700">
                  {g.bring.length > 0 && (
                    <div>
                      <div className="mb-1 font-bold">🎒 챙길 것</div>
                      <ul className="space-y-1">
                        {g.bring.map((b) => (
                          <li key={b}>• {b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <div className="mb-1 font-bold">⚠️ 주의할 점</div>
                    <ul className="space-y-1">
                      {g.cautions.map((c) => (
                        <li key={c}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* 항공편 */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-bold">✈️ 항공편</h2>
        {schedule.flightInfo.flights.map((f) => (
          <FlightCard key={f.id} flight={f} />
        ))}
      </section>

      {/* 비상 연락처 */}
      <section className={card}>
        <h2 className="text-lg font-bold">🚨 비상 연락처</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {emergency.note} (확인일 {emergency.verifiedAt})
        </p>
        <div className="space-y-5">
          {emergency.groups.map((g) => (
            <div key={g.title}>
              <h3 className="mb-2 font-bold">{g.title}</h3>
              <ul className="space-y-2">
                {g.items.map((i) => (
                  <li key={i.number}>
                    <a
                      href={`tel:${i.number.replace(/[^\d+]/g, '')}`}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/40"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-600 dark:text-slate-300">{i.label}</span>
                        <span className="text-xl font-bold tabular-nums">{i.number}</span>
                      </span>
                      <span className="shrink-0 text-2xl">📞</span>
                    </a>
                  </li>
                ))}
              </ul>
              {g.tip && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{g.tip}</p>}
              <a href={g.source} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-sky-700 underline dark:text-sky-300">
                출처: {g.sourceLabel}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
