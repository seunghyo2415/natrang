/**
 * 울산광역시 시군구 코드(법정동코드 앞 5자리, 실거래가 API의 LAWD_CD).
 * ⚠️ 출처 확인 필요: 행정표준코드관리시스템(code.go.kr) 법정동코드 전체자료와 4단계에서 대조한다.
 * center 는 지도 표시용 대략 좌표.
 */
export const ULSAN_SIGUNGU = [
  { code: '31110', name: '중구', center: { lat: 35.5694, lng: 129.3328 } },
  { code: '31140', name: '남구', center: { lat: 35.5384, lng: 129.3301 } },
  { code: '31170', name: '동구', center: { lat: 35.5050, lng: 129.4166 } },
  { code: '31200', name: '북구', center: { lat: 35.6013, lng: 129.3650 } },
  { code: '31710', name: '울주군', center: { lat: 35.5223, lng: 129.2423 } },
] as const;

export type UlsanSigunguCode = (typeof ULSAN_SIGUNGU)[number]['code'];

export const ULSAN_CENTER = { lat: 35.5384, lng: 129.3114 };

export function sigunguName(code: string): string {
  return ULSAN_SIGUNGU.find((s) => s.code === code.slice(0, 5))?.name ?? '';
}
