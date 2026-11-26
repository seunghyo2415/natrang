// Checklist: 체크 상태가 폰에 저장되는 체크리스트
import { useTrip } from '../state/trip'

interface Props {
  title: string
  items: { id: string; text: string }[]
}

export function Checklist({ title, items }: Props) {
  const { checks, toggleCheck } = useTrip()
  const done = items.filter((i) => checks[i.id]).length
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${done === items.length ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
          {done}/{items.length}
        </span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {items.map((i) => (
          <li key={i.id}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={!!checks[i.id]}
                onChange={() => toggleCheck(i.id)}
                className="h-6 w-6 shrink-0 accent-emerald-600"
              />
              <span className={checks[i.id] ? 'text-slate-400 line-through' : ''}>{i.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
