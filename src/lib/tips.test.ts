// tips.test.ts: 일정별 팁 고르기 · 장소 선택 · 비상 연락처 데이터 시험
import { describe, expect, it } from 'vitest'
import scheduleJson from '../data/schedule.json'
import type { Schedule } from '../types'
import { destinationOf, displayPlaceLabel, nextSpotInArea } from './places'
import { buildTimeline } from './time'
import { emergency, tipsFor } from './tips'

const schedule = scheduleJson as Schedule
const item = (id: string) => {
  const d = schedule.days.find((d) => d.items.some((i) => i.id === id))!
  return { ...d.items.find((i) => i.id === id)!, day: d.day }
}

describe('일정별 챙길 것·주의할 점', () => {
  it('해산물 저녁(희망씨푸드)엔 해산물 팁 + 공통 팁', () => {
    const ids = tipsFor(item('d1-16'), ['hope-seafood']).map((g) => g.id)
    expect(ids).toContain('seafood')
    expect(ids[ids.length - 1]).toBe('common')
  })
  it('비행엔 공항 팁, 마사지엔 마사지 팁', () => {
    expect(tipsFor(item('d1-04'), []).map((g) => g.id)).toContain('airport')
    expect(tipsFor(item('d1-14'), ['maul-spa']).map((g) => g.id)).toContain('massage')
  })
  it('4일차 일정엔 마지막 날 팁', () => {
    expect(tipsFor(item('d4-05'), ['emoi']).map((g) => g.id)).toContain('lastday')
  })
})

describe('장소 고르기', () => {
  it('4일차 마사지: 기본은 마울스파, 오션 스파를 고르면 목적지·표시가 바뀐다', () => {
    expect(destinationOf(item('d4-08'), schedule, {})?.id).toBe('maul-spa')
    const choices = { 'd4-massage': 'ocean-spa' }
    expect(destinationOf(item('d4-07'), schedule, choices)?.id).toBe('ocean-spa')
    expect(displayPlaceLabel(item('d4-08'), schedule, choices, false)).toBe('오션 스파')
    expect(displayPlaceLabel(item('d4-10'), schedule, choices, false)).toBe('오션 스파 → 알마 리조트')
  })
  it('고르기 전에는 엑셀에 적힌 글자 그대로', () => {
    expect(displayPlaceLabel(item('d4-08'), schedule, {}, false)).toBe('마울스파 또는 오션 스파')
  })
  it('넓은 지역(시내)으로 가는 일정은 다음 일정 장소를 먼저 추천한다', () => {
    const tl = buildTimeline(schedule)
    expect(nextSpotInArea(item('d2-03'), tl, schedule, {})).toBe('madam-phuong') // 시내 이동 → 점심
    expect(nextSpotInArea(item('d2-03'), tl, schedule, { 'd2-04': 'banhmi-phan2' })).toBe('banhmi-phan2') // 점심을 바꾸면 따라감
    expect(nextSpotInArea(item('d2-05'), tl, schedule, {})).toBe('than-greenery') // 시내 구경 → 카페
    expect(nextSpotInArea(item('d2-07'), tl, schedule, {})).toBe('mam') // 시내 쇼핑 → 저녁
    expect(nextSpotInArea(item('d4-06'), tl, schedule, {})).toBeUndefined() // 다음이 마사지(지역 밖)면 추천 없음
    expect(nextSpotInArea(item('d1-07'), tl, schedule, {})).toBeUndefined() // 지역이 아닌 일정
  })
  it('2일차 점심을 반미판2로 바꾸면 목적지가 바뀐다', () => {
    expect(destinationOf(item('d2-04'), schedule, { 'd2-04': 'banhmi-phan2' })?.id).toBe('banhmi-phan2')
  })
})

describe('비상 연락처 데이터', () => {
  it('모든 번호에 출처(외교부 누리집)가 있다', () => {
    for (const g of emergency.groups) {
      expect(g.source).toMatch(/^https:\/\/(overseas|vn)\.mofa\.go\.kr\//)
      expect(g.items.length).toBeGreaterThan(0)
    }
  })
})
