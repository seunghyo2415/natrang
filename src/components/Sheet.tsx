// Sheet: 화면 아래에서 올라오는 창 (바텀 시트). 바깥 어두운 곳을 누르거나 ✕로 닫아요.
import { useEffect, type ReactNode } from 'react'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  // 시트가 열려 있는 동안 뒤 화면이 스크롤되지 않게
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-slate-900 shadow-2xl dark:bg-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="닫기" className="-mr-2 -mt-1 h-11 w-11 shrink-0 rounded-full text-2xl">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** 시트 안에서 쓰는 큰 버튼 */
export function BigButton({
  children,
  onClick,
  variant = 'primary',
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}) {
  const style = {
    primary: 'bg-sky-600 text-white disabled:bg-slate-300 dark:disabled:bg-slate-600',
    secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled} className={`w-full rounded-2xl py-3.5 text-lg font-bold ${style}`}>
      {children}
    </button>
  )
}
