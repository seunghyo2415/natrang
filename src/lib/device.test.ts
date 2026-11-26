// device.test.ts: 그랩 앱 여는 주소 모양 시험
import { describe, expect, it } from 'vitest'
import { grabUrl } from './device'

describe('그랩 열기 주소', () => {
  it('안드로이드: 그랩 앱의 호출 화면(screenType=BOOKING)을 지정한다', () => {
    const u = grabUrl(undefined, true)
    expect(u).toMatch(/^intent:\/\/open\?screenType=BOOKING#Intent;/)
    expect(u).toContain(';scheme=grab;')
    expect(u).toContain(';package=com.grabtaxi.passenger;')
    expect(u).toContain('S.browser_fallback_url=https%3A%2F%2Fwww.grab.com')
    expect(u.endsWith(';end')).toBe(true)
  })
  it('좌표를 알면 도착지 좌표를 같이 넘긴다', () => {
    const u = grabUrl({ lat: 12.0759988, lng: 109.168 }, true)
    expect(u).toContain('dropOffLatitude=12.0759988&dropOffLongitude=109.168')
  })
  it('안드로이드가 아니면 그랩 홈페이지', () => {
    expect(grabUrl(undefined, false)).toBe('https://www.grab.com/vn/en/')
  })
})
