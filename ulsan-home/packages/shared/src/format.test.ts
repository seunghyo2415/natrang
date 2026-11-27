import { describe, expect, it } from 'vitest';
import { formatArea, formatManwon, formatManwonShort, m2ToPyeong, pricePerPyeong } from './format';

describe('금액 표기', () => {
  it('억/만원으로 나눠 보여준다', () => {
    expect(formatManwon(12345)).toBe('1억 2,345만');
    expect(formatManwon(30000)).toBe('3억');
    expect(formatManwon(5000)).toBe('5,000만');
  });
  it('마커용 짧은 표기', () => {
    expect(formatManwonShort(32500)).toBe('3.3억');
    expect(formatManwonShort(30000)).toBe('3억');
    expect(formatManwonShort(125000)).toBe('13억');
    expect(formatManwonShort(8500)).toBe('8,500만');
  });
});

describe('면적', () => {
  it('㎡와 평을 함께 표기', () => {
    expect(m2ToPyeong(84.97)).toBe(25.7);
    expect(formatArea(84.97)).toBe('84.97㎡ (25.7평)');
    expect(formatArea(59)).toBe('59㎡ (17.8평)');
  });
  it('평당가', () => {
    expect(pricePerPyeong(30000, 84.97)).toBe(1167);
  });
});
