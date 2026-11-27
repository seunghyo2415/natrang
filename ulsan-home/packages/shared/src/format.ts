/** 숫자 표기 도우미. 금액은 공공데이터 원본과 같은 "만원" 단위 정수로 다룬다. */

export const PYEONG_PER_M2 = 1 / 3.305785;

/** 12345(만원) → "1억 2,345만" / 5000 → "5,000만" / 30000 → "3억" */
export function formatManwon(manwon: number): string {
  if (!Number.isFinite(manwon)) return '-';
  const sign = manwon < 0 ? '-' : '';
  const abs = Math.round(Math.abs(manwon));
  const eok = Math.floor(abs / 10000);
  const man = abs % 10000;
  if (eok === 0) return `${sign}${man.toLocaleString('ko-KR')}만`;
  if (man === 0) return `${sign}${eok}억`;
  return `${sign}${eok}억 ${man.toLocaleString('ko-KR')}만`;
}

/** 지도 마커처럼 좁은 곳에 쓰는 짧은 표기: 32500 → "3.3억", 8500 → "8,500만" */
export function formatManwonShort(manwon: number): string {
  if (!Number.isFinite(manwon)) return '-';
  if (Math.abs(manwon) >= 10000) {
    const eok = manwon / 10000;
    return `${eok >= 10 ? eok.toFixed(0) : eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${Math.round(manwon).toLocaleString('ko-KR')}만`;
}

export function m2ToPyeong(m2: number): number {
  return Math.round(m2 * PYEONG_PER_M2 * 10) / 10;
}

/** 84.97 → "84.97㎡ (25.7평)" */
export function formatArea(m2: number): string {
  return `${m2.toFixed(2).replace(/\.?0+$/, '')}㎡ (${m2ToPyeong(m2)}평)`;
}

/** 평당가(만원). 면적은 전용면적 기준. */
export function pricePerPyeong(priceManwon: number, exclusiveM2: number): number {
  if (exclusiveM2 <= 0) return NaN;
  return Math.round(priceManwon / (exclusiveM2 * PYEONG_PER_M2));
}

/** 사용승인일 → "2015년 (11년차)" */
export function formatBuiltYear(approvedDate: string, today: Date = new Date()): string {
  const year = Number(approvedDate.slice(0, 4));
  if (!year) return '-';
  return `${year}년 (${today.getFullYear() - year + 1}년차)`;
}

export function formatPercent(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return '-';
  return `${(ratio * 100).toFixed(digits)}%`;
}
