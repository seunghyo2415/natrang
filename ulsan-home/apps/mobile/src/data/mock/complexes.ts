/**
 * ⚠️ 목업 데이터 — 단지명·가격·세대수·주차는 모두 지어낸 값입니다.
 * 동 이름과 대략적인 위치만 실제 울산 지명을 따랐습니다.
 */
import { parkingPerHousehold, pricePerPyeong } from '@ulsan/shared';

import type { ComplexSummary } from '../types';
import { seeded } from './seed';

type DongSeed = {
  sigunguCode: string;
  dongName: string;
  lat: number;
  lng: number;
  /** 평당가 기준값(만원) — 동네 시세 차이를 흉내 냄 */
  basePyeong: number;
  names: string[];
};

export const MOCK_DONGS: DongSeed[] = [
  { sigunguCode: '31140', dongName: '삼산동', lat: 35.5405, lng: 129.3365, basePyeong: 1250, names: ['삼산 한빛타운', '삼산 하늘채움', '삼산 중앙파크'] },
  { sigunguCode: '31140', dongName: '신정동', lat: 35.5352, lng: 129.3125, basePyeong: 1350, names: ['신정 문수뜰', '신정 푸른숲', '신정 해오름'] },
  { sigunguCode: '31140', dongName: '옥동', lat: 35.5332, lng: 129.2965, basePyeong: 1550, names: ['옥동 학마을', '옥동 숲속정원', '옥동 대공원뷰'] },
  { sigunguCode: '31140', dongName: '무거동', lat: 35.5478, lng: 129.2645, basePyeong: 1150, names: ['무거 강변마을', '무거 새터'] },
  { sigunguCode: '31140', dongName: '야음동', lat: 35.5225, lng: 129.3335, basePyeong: 1050, names: ['야음 장미마을', '야음 새솔'] },
  { sigunguCode: '31140', dongName: '달동', lat: 35.5312, lng: 129.3272, basePyeong: 1200, names: ['달동 보름달', '달동 중앙하이츠'] },
  { sigunguCode: '31110', dongName: '우정동', lat: 35.5555, lng: 129.3118, basePyeong: 1300, names: ['혁신 이음마을', '우정 동산'] },
  { sigunguCode: '31110', dongName: '태화동', lat: 35.5532, lng: 129.2998, basePyeong: 1400, names: ['태화 리버뜰', '태화 국가정원뷰'] },
  { sigunguCode: '31110', dongName: '성안동', lat: 35.5745, lng: 129.3165, basePyeong: 900, names: ['성안 솔바람'] },
  { sigunguCode: '31110', dongName: '복산동', lat: 35.5628, lng: 129.3262, basePyeong: 950, names: ['복산 새뜰', '복산 해마루'] },
  { sigunguCode: '31170', dongName: '전하동', lat: 35.5122, lng: 129.4248, basePyeong: 1000, names: ['전하 바다뜰', '전하 일산뷰'] },
  { sigunguCode: '31170', dongName: '화정동', lat: 35.4975, lng: 129.4175, basePyeong: 850, names: ['화정 대왕마을'] },
  { sigunguCode: '31170', dongName: '서부동', lat: 35.5268, lng: 129.4302, basePyeong: 800, names: ['서부 동백'] },
  { sigunguCode: '31200', dongName: '송정동', lat: 35.5968, lng: 129.3602, basePyeong: 1150, names: ['송정 새봄', '송정 박상진숲'] },
  { sigunguCode: '31200', dongName: '매곡동', lat: 35.6332, lng: 129.3538, basePyeong: 950, names: ['매곡 들꽃마을', '매곡 산업로뷰'] },
  { sigunguCode: '31200', dongName: '천곡동', lat: 35.6168, lng: 129.3492, basePyeong: 900, names: ['천곡 냇가마을', '천곡 달빛'] },
  { sigunguCode: '31200', dongName: '산하동', lat: 35.6185, lng: 129.4532, basePyeong: 1050, names: ['강동 파도소리', '강동 몽돌'] },
  { sigunguCode: '31710', dongName: '범서읍', lat: 35.5672, lng: 129.2482, basePyeong: 1000, names: ['구영 강마을', '천상 산들', '굴화 맑은샘'] },
  { sigunguCode: '31710', dongName: '언양읍', lat: 35.5652, lng: 129.1242, basePyeong: 750, names: ['언양 알프스', '언양 반구대'] },
  { sigunguCode: '31710', dongName: '온양읍', lat: 35.4205, lng: 129.2872, basePyeong: 700, names: ['남창 옹기마을'] },
];

const AREAS = [59.98, 74.95, 84.97, 101.88, 114.7];
const MOCK_AS_OF = '2026-11-20';
export const MOCK_SOURCE = '목업 데이터';

function build(): ComplexSummary[] {
  const rand = seeded(20261127);
  const list: ComplexSummary[] = [];
  MOCK_DONGS.forEach((d, di) => {
    d.names.forEach((name, ni) => {
      const id = `mock-${String(di).padStart(2, '0')}${ni}`;
      const year = 1993 + Math.floor(rand() * 32);
      const age = 2026 - year;
      const households = 150 + Math.floor(rand() * 18) * 60;
      const representativeM2 = AREAS[Math.floor(rand() * AREAS.length)];
      // 신축일수록, 주차 여유가 많을수록 비싸게
      const agePenalty = Math.max(0.55, 1 - age * 0.015);
      const pyeongPrice = Math.round(d.basePyeong * agePenalty * (0.85 + rand() * 0.35));
      const price = Math.round((pyeongPrice * representativeM2 * 0.3025) / 100) * 100;
      const parkingRatio = year >= 2010 ? 1.2 + rand() * 0.7 : year >= 2000 ? 0.9 + rand() * 0.5 : 0.5 + rand() * 0.55;
      const totalSpaces = Math.round(households * parkingRatio);
      list.push({
        id,
        name,
        sigunguCode: d.sigunguCode,
        dongName: d.dongName,
        roadAddress: `울산 ${d.dongName} (목업 주소 ${ni + 1})`,
        location: {
          lat: d.lat + (rand() - 0.5) * 0.012,
          lng: d.lng + (rand() - 0.5) * 0.014,
        },
        houseType: 'apt',
        approvedDate: `${year}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-15`,
        households,
        representativeM2,
        recentPrice: { value: price, source: MOCK_SOURCE, asOf: MOCK_AS_OF },
        pricePerPyeong: pricePerPyeong(price, representativeM2),
        parkingPerHousehold: {
          value: parkingPerHousehold(totalSpaces, households),
          source: MOCK_SOURCE,
          asOf: MOCK_AS_OF,
        },
      });
    });
  });
  return list;
}

export const MOCK_COMPLEXES: ComplexSummary[] = build();
export { MOCK_AS_OF };
