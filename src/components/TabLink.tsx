// TabLink: 화면 안에서 다른 탭으로 가는 링크 (뒤로 가기 규칙을 지키도록 goTab 사용)
import type { ReactNode } from 'react'
import { goTab, type TabId } from '../lib/nav'

export function TabLink({ to, className, children }: { to: TabId; className?: string; children: ReactNode }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        goTab(to)
      }}
    >
      {children}
    </a>
  )
}
