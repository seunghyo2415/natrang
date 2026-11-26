// time.test.ts: 시간 판정 두뇌가 맞게 동작하는지 자동으로 확인하는 "시험지".
// `npm test` 를 실행하면 아래 문제들을 컴퓨터가 차례로 풀어 보고 맞았는지 알려 줘요.
import { describe, expect, it } from 'vitest'
import scheduleJson from '../data/schedule.json'
import type { Schedule } from '../types'
import { sumCosts } from './money'
import { buildTimeline, daysUntil, formatDuration, getTripStatus, parseNowParam, toInstant, wallClock } from './time'

const schedule = scheduleJson as Schedule
const timeline = buildTimeline(schedule)
/** 테스트 편의: "2026-12-18T15:20+07:00" → 절대시각 */
const at = (iso: string) => Date.parse(iso)
const statusAt = (iso: string) => getTripStatus(at(iso), timeline)

describe('시간대 변환', () => {
  it('서울 07:35 = 베트남 05:35 (2시간 차이)', () => {
    const ms = toInstant('2026-12-17', '07:35', 'Asia/Seoul')
    expect(wallClock(ms, 'Asia/Ho_Chi_Minh').time).toBe('05:35')
    expect(wallClock(ms, 'Asia/Seoul').time).toBe('07:35')
  })

  it('요일도 올바르게 나온다 (2026-12-17은 목요일)', () => {
    expect(wallClock(at('2026-12-17T12:00+07:00'), 'Asia/Ho_Chi_Minh').weekday).toBe('목')
  })

  it('일정 데이터에 적힌 요일이 실제 달력과 같다', () => {
    for (const d of schedule.days) {
      expect(wallClock(toInstant(d.date, '12:00', 'Asia/Seoul'), 'Asia/Seoul').weekday, `${d.day}일차`).toBe(d.weekday)
    }
  })
})

describe('타임라인 만들기', () => {
  it('일정이 하나도 빠지지 않고 시간 순서대로 정렬된다', () => {
    const count = schedule.days.reduce((n, d) => n + d.items.length, 0)
    expect(timeline).toHaveLength(count)
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].startMs).toBeGreaterThanOrEqual(timeline[i - 1].startMs)
    }
  })

  it('가는 비행기: 서울 07:35 출발 → 베트남 10:35 도착 = 5시간', () => {
    const f = timeline.find((t) => t.id === 'd1-04')!
    expect(f.endMs - f.startMs).toBe(5 * 3600_000)
  })

  it('오는 비행기: 베트남 00:05 출발 → 서울 06:30 도착 = 4시간 25분', () => {
    const f = timeline.find((t) => t.id === 'd5-01')!
    expect(formatDuration(f.endMs - f.startMs)).toBe('4시간 25분')
  })

  it('자정 넘는 일정: 4일차 23:30 → 다음날 00:05 (35분)', () => {
    const t = timeline.find((x) => x.id === 'd4-16')!
    expect(t.endMs - t.startMs).toBe(35 * 60_000)
  })

  it('종료시간 없는 항목은 다음 일정 시작까지 이어진다 (1일차 휴식 → 2일차 조식)', () => {
    const rest = timeline.find((t) => t.id === 'd1-18')!
    expect(rest.openEnded).toBe(true)
    expect(rest.endMs).toBe(at('2026-12-18T07:30+07:00'))
  })
})

describe('지금 무엇을 할 차례인지 판정', () => {
  it('여행 전: 다음 일정은 밀양 출발', () => {
    const s = statusAt('2026-12-10T12:00+09:00')
    expect(s.phase).toBe('before')
    expect(s.next?.id).toBe('d1-01')
  })

  it('1일차 한국 시간 구간: 한국 05:00 → 김해공항 이동 중', () => {
    const s = statusAt('2026-12-17T05:00+09:00')
    expect(s.phase).toBe('during')
    expect(s.current?.id).toBe('d1-01')
    expect(s.dayNumber).toBe(1)
  })

  it('비행 중: 베트남 09:00 (= 한국 11:00) → 비행기 안', () => {
    const s = statusAt('2026-12-17T09:00+07:00')
    expect(s.current?.id).toBe('d1-04')
    expect(s.next?.id).toBe('d1-05')
  })

  it('2일차 15:20 → 카페 방문 중, 종료까지 70분', () => {
    const s = statusAt('2026-12-18T15:20+07:00')
    expect(s.current?.id).toBe('d2-06')
    expect(formatDuration(s.current!.endMs - at('2026-12-18T15:20+07:00'))).toBe('1시간 10분')
  })

  it('종료시간 없는 항목: 1일차 밤 23:00 → 리조트 휴식, 다음은 2일차 조식', () => {
    const s = statusAt('2026-12-17T23:00+07:00')
    expect(s.current?.id).toBe('d1-18')
    expect(s.next?.id).toBe('d2-01')
    expect(s.dayNumber).toBe(1)
  })

  it('자정 넘는 4→5일차: 베트남 00:00 → 아직 탑승 중(4일차)', () => {
    const s = statusAt('2026-12-21T00:00+07:00')
    expect(s.current?.id).toBe('d4-16')
    expect(s.dayNumber).toBe(4)
  })

  it('귀국 비행 중: 베트남 02:00 → 5일차 비행', () => {
    const s = statusAt('2026-12-21T02:00+07:00')
    expect(s.current?.id).toBe('d5-01')
    expect(s.dayNumber).toBe(5)
  })

  it('김해 도착 후 그날까지는 "여행 종료" 일정', () => {
    expect(statusAt('2026-12-21T09:00+09:00').current?.id).toBe('d5-02')
  })

  it('여행 후: 12월 22일', () => {
    expect(statusAt('2026-12-22T09:00+09:00').phase).toBe('after')
  })
})

describe('항공편 정보', () => {
  it('항공권의 출발·도착 시각이 일정표의 비행 일정과 정확히 같다', () => {
    for (const f of schedule.flightInfo.flights) {
      const item = timeline.find((t) => t.id === f.scheduleItemId)!
      expect(item.startMs, `${f.flightNo} 출발`).toBe(toInstant(f.depart.date, f.depart.time, f.depart.tz))
      expect(item.endMs, `${f.flightNo} 도착`).toBe(toInstant(f.arrive.date, f.arrive.time, f.arrive.tz))
    }
  })
})

describe('기타', () => {
  it('D-day: 11월 25일 → 출발까지 22일, 출발 당일은 0', () => {
    expect(daysUntil(at('2026-11-25T20:00+09:00'), '2026-12-17')).toBe(22)
    expect(daysUntil(at('2026-12-17T03:00+09:00'), '2026-12-17')).toBe(0)
  })

  it('주소의 ?now= 에서 +가 공백으로 바뀌어도 올바르게 읽는다', () => {
    // 브라우저 주소창에 ?now=2026-12-18T15:20+07:00 을 치면 + 가 공백으로 들어와요
    expect(parseNowParam('?now=2026-12-18T15:20+07:00')).toBe(at('2026-12-18T15:20+07:00'))
    expect(parseNowParam('?now=엉터리')).toBeNull()
    expect(parseNowParam('')).toBeNull()
  })

  it('비용 합계: 원화 1,696,405원 / 동화 18,662,000동', () => {
    const all = schedule.days.flatMap((d) => d.items.map((i) => i.cost))
    expect(sumCosts(all)).toEqual({ krw: 1_696_405, vnd: 18_662_000 })
  })
})
