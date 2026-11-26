// Money: 금액을 원·동 둘 다 보여 주는 화면 조각
import { comma, krwToVnd, vndToKrw } from '../lib/money'
import type { Cost } from '../types'

export function Money({ cost, rate }: { cost: Cost; rate: number }) {
  if (cost.currency === 'KRW') {
    return (
      <span>
        <b>{comma(cost.amount)}원</b>{' '}
        <span className="text-slate-500 dark:text-slate-400">(≈{comma(krwToVnd(cost.amount, rate))}동)</span>
      </span>
    )
  }
  return (
    <span>
      <b>{comma(cost.amount)}동</b>{' '}
      <span className="text-slate-500 dark:text-slate-400">(≈{comma(vndToKrw(cost.amount, rate))}원)</span>
    </span>
  )
}

/** 합계 표시: 원화 결제분 + 동화 결제분 + 총합(원) */
export function MoneyTotal({ krw, vnd, rate }: { krw: number; vnd: number; rate: number }) {
  return (
    <div className="space-y-1">
      {krw > 0 && (
        <div className="flex justify-between">
          <span>원화 결제</span>
          <b>{comma(krw)}원</b>
        </div>
      )}
      {vnd > 0 && (
        <div className="flex justify-between">
          <span>현지(동) 결제</span>
          <span>
            <b>{comma(vnd)}동</b> <span className="text-slate-500 dark:text-slate-400">≈{comma(vndToKrw(vnd, rate))}원</span>
          </span>
        </div>
      )}
      <div className="flex justify-between border-t border-slate-300 pt-1 text-lg dark:border-slate-600">
        <span>예상 합계</span>
        <b>≈{comma(krw + vndToKrw(vnd, rate))}원</b>
      </div>
    </div>
  )
}
