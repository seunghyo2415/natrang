import { describe, expect, it } from 'vitest'
import scheduleJson from '../data/schedule.json'
import type { Schedule } from '../types'
import { buildEditedTimeline } from './edits'
import { wallClock } from './time'

const schedule = scheduleJson as Schedule
const find = (tl: ReturnType<typeof buildEditedTimeline>, id: string) => tl.find((t) => t.id === id)!
const vn = (ms: number) => wallClock(ms, 'Asia/Ho_Chi_Minh').time

describe('일정 수정', () => {
  it('수정이 없으면 원래 일정 그대로', () => {
    const tl = buildEditedTimeline(schedule, {})
    expect(vn(find(tl, 'd2-08').startMs)).toBe('18:00')
  })

  it('+30분 미루기: 같은 날 이후 일정이 같이 밀린다', () => {
    const tl = buildEditedTimeline(schedule, { 'd2-06': { shiftMin: 30 } })
    expect(vn(find(tl, 'd2-05').startMs)).toBe('14:00') // 이전 일정은 그대로
    expect(vn(find(tl, 'd2-06').startMs)).toBe('15:30')
    expect(vn(find(tl, 'd2-08').startMs)).toBe('18:30')
    expect(find(tl, 'd2-08').shiftedBy).toBe(30)
    expect(vn(find(tl, 'd3-01').startMs)).toBe('08:00') // 다음 날은 그대로
  })

  it('미루기는 비행·공항 수속 일정 앞에서 멈춘다 (4일차 저녁)', () => {
    const tl = buildEditedTimeline(schedule, { 'd4-13': { shiftMin: 30 } })
    expect(vn(find(tl, 'd4-14').startMs)).toBe('21:30')
    expect(vn(find(tl, 'd4-15').startMs)).toBe('21:30') // 공항 수속은 고정
  })

  it('+30분 연장: 지금 일정은 그대로 시작하고 끝만 늦어지며, 이후 일정이 밀린다', () => {
    const tl = buildEditedTimeline(schedule, { 'd2-06': { extendMin: 30 } })
    expect(vn(find(tl, 'd2-06').startMs)).toBe('15:00')
    expect(vn(find(tl, 'd2-06').endMs)).toBe('17:00')
    expect(vn(find(tl, 'd2-07').startMs)).toBe('17:00')
    expect(vn(find(tl, 'd2-10').startMs)).toBe('20:30')
  })

  it('시간 직접 수정', () => {
    const tl = buildEditedTimeline(schedule, { 'd2-08': { start: '18:30', end: '19:30' } })
    expect(vn(find(tl, 'd2-08').startMs)).toBe('18:30')
    expect(find(tl, 'd2-08').edited).toBe(true)
  })

  it('잘못된 수정(종료 < 시작)이 저장돼 있어도 앱이 멈추지 않는다', () => {
    const tl = buildEditedTimeline(schedule, { 'd2-08': { start: '19:00', end: '18:00' } })
    expect(vn(find(tl, 'd2-08').startMs)).toBe('18:00')
  })
})
