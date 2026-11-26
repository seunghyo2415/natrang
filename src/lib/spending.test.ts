// spending.test.ts: 실제 사용 금액 · 직접 추가한 지출/일정 계산 시험
import { describe, expect, it } from 'vitest'
import scheduleJson from '../data/schedule.json'
import type { CustomItem, Schedule } from '../types'
import { buildEditedTimeline } from './edits'
import { summarizeSpending } from './money'
import { getTripStatus } from './time'

const schedule = scheduleJson as Schedule

const grab: CustomItem = {
  id: 'c-grab', day: 2, start: '15:20', tz: 'Asia/Ho_Chi_Minh', title: '그랩', placeLabel: '',
  kind: 'expense', custom: true,
}
const snack: CustomItem = {
  id: 'c-snack', day: 2, start: '21:00', end: '22:00', tz: 'Asia/Ho_Chi_Minh', title: '야식',
  placeLabel: '리조트', kind: 'meal', custom: true, cost: { amount: 300000, currency: 'VND' },
}

describe('실제 사용 금액', () => {
  it('입력 전에는 예산 = 최종 예상, 실제 사용 0', () => {
    const s = summarizeSpending(buildEditedTimeline(schedule, {}))
    expect(s.budget).toEqual({ krw: 1_696_405, vnd: 18_662_000 })
    expect(s.forecast).toEqual(s.budget)
    expect(s.actual).toEqual({ krw: 0, vnd: 0 })
  })

  it('점심을 650,000 대신 720,000동 썼으면 최종 예상이 70,000동 늘어난다', () => {
    const tl = buildEditedTimeline(schedule, { 'd2-04': { actual: { amount: 720000, currency: 'VND' } } })
    const s = summarizeSpending(tl)
    expect(s.actual).toEqual({ krw: 0, vnd: 720_000 })
    expect(s.forecast.vnd).toBe(18_662_000 + 70_000)
    expect(s.budget.vnd).toBe(18_662_000) // 예산은 그대로
  })

  it('예산 없던 이동(그랩)에 금액을 넣으면 실제·최종 예상에 더해진다', () => {
    const tl = buildEditedTimeline(schedule, { 'd2-03': { actual: { amount: 380000, currency: 'VND' } } })
    expect(summarizeSpending(tl).forecast.vnd).toBe(18_662_000 + 380_000)
  })

  it('건너뛴 선택 마사지는 최종 예상에서 빠진다', () => {
    const tl = buildEditedTimeline(schedule, { 'd3-03': { skipped: true } })
    expect(summarizeSpending(tl).forecast.vnd).toBe(18_662_000 - 1_782_000)
  })
})

describe('직접 추가한 지출·일정', () => {
  it('지출 기록은 타임라인에 들어가고 금액이 합계에 더해진다', () => {
    const tl = buildEditedTimeline(schedule, { 'c-grab': { actual: { amount: 120000, currency: 'VND' } } }, [grab])
    expect(tl.some((t) => t.id === 'c-grab')).toBe(true)
    expect(summarizeSpending(tl).actual.vnd).toBe(120_000)
  })

  it('지출 기록은 "지금 할 일"을 가로채지 않는다 (15:25에도 여전히 카페)', () => {
    const tl = buildEditedTimeline(schedule, {}, [grab])
    const s = getTripStatus(Date.parse('2026-12-18T15:25+07:00'), tl)
    expect(s.current?.id).toBe('d2-06')
  })

  it('직접 추가한 일정은 예산에도 들어가고, 앞의 "휴식"은 그 전까지로 줄어든다', () => {
    const tl = buildEditedTimeline(schedule, {}, [snack])
    expect(summarizeSpending(tl).budget.vnd).toBe(18_662_000 + 300_000)
    const s = getTripStatus(Date.parse('2026-12-18T21:30+07:00'), tl)
    expect(s.current?.id).toBe('c-snack')
  })

  it('종료가 시작보다 빠른 잘못된 항목은 무시된다', () => {
    const bad = { ...snack, id: 'c-bad', end: '20:00' }
    expect(buildEditedTimeline(schedule, {}, [bad]).some((t) => t.id === 'c-bad')).toBe(false)
  })
})
