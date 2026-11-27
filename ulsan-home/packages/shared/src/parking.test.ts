import { describe, expect, it } from 'vitest';
import { compareParkingSources, parkingGrade, parkingPerHousehold } from './parking';

describe('세대당 주차', () => {
  it('소수점 둘째 자리', () => {
    expect(parkingPerHousehold(1320, 1000)).toBe(1.32);
    expect(parkingPerHousehold(1000, 3)).toBe(333.33);
    expect(parkingPerHousehold(10, 0)).toBeNaN();
  });
  it('등급 경계값', () => {
    expect(parkingGrade(1.5)).toBe('plenty');
    expect(parkingGrade(1.49)).toBe('normal');
    expect(parkingGrade(1.0)).toBe('normal');
    expect(parkingGrade(0.99)).toBe('short');
    expect(parkingGrade(NaN)).toBeNull();
  });
  it('출처 간 차이 10% 이상이면 경고', () => {
    expect(compareParkingSources(1000, 1090).significant).toBe(false);
    expect(compareParkingSources(1000, 1100).significant).toBe(true);
  });
});
