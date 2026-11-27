import { ULSAN_SIGUNGU, sigunguName } from '@ulsan/shared';

import type {
  BBox,
  ComplexFilters,
  ComplexSummary,
  DataSource,
  MapMarker,
  RegionSummary,
  SearchResult,
} from '../types';
import { MOCK_AS_OF, MOCK_COMPLEXES, MOCK_DONGS, MOCK_SOURCE } from './complexes';

/** 실제 서버처럼 약간 늦게 응답 → 스켈레톤 UI 확인용 */
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export function inBBox(c: { location: { lat: number; lng: number } }, b: BBox) {
  const { lat, lng } = c.location;
  return lat >= b.sw.lat && lat <= b.ne.lat && lng >= b.sw.lng && lng <= b.ne.lng;
}

export function matchesFilters(c: ComplexSummary, f: ComplexFilters): boolean {
  const price = c.recentPrice?.value;
  if (f.priceMin != null && (price == null || price < f.priceMin)) return false;
  if (f.priceMax != null && (price == null || price > f.priceMax)) return false;
  if (f.areaMin != null && c.representativeM2 < f.areaMin) return false;
  if (f.areaMax != null && c.representativeM2 > f.areaMax) return false;
  if (f.builtAfter != null && Number(c.approvedDate.slice(0, 4)) < f.builtAfter) return false;
  if (f.householdsMin != null && c.households < f.householdsMin) return false;
  const p = c.parkingPerHousehold?.value;
  if (f.parkingMin != null && (p == null || p < f.parkingMin)) return false;
  return true;
}

function avg(nums: number[]): number | null {
  const v = nums.filter((n) => Number.isFinite(n));
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

/** 한글 검색: 공백 무시, 초성 검색은 나중에 */
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

export const mockDataSource: DataSource = {
  mode: 'mock',

  async getMapMarkers(bbox, mode, filters) {
    await delay(120);
    const list = MOCK_COMPLEXES.filter((c) => matchesFilters(c, filters));
    if (mode === 'complex') {
      return list
        .filter((c) => inBBox(c, bbox))
        .map<MapMarker>((c) => ({
          kind: 'complex',
          id: c.id,
          name: c.name,
          location: c.location,
          recentPrice: c.recentPrice?.value ?? null,
          pricePerPyeong: c.pricePerPyeong,
        }));
    }
    if (mode === 'dong') {
      return MOCK_DONGS.map<MapMarker>((d) => {
        const items = list.filter((c) => c.dongName === d.dongName);
        return {
          kind: 'region',
          id: `dong:${d.dongName}`,
          name: d.dongName,
          location: { lat: d.lat, lng: d.lng },
          count: items.length,
          avgPricePerPyeong: avg(items.map((c) => c.pricePerPyeong ?? NaN)),
        };
      }).filter((m) => m.kind === 'region' && m.count > 0 && inBBox(m, bbox));
    }
    return ULSAN_SIGUNGU.map<MapMarker>((s) => {
      const items = list.filter((c) => c.sigunguCode === s.code);
      return {
        kind: 'region',
        id: `sgg:${s.code}`,
        name: s.name,
        location: s.center,
        count: items.length,
        avgPricePerPyeong: avg(items.map((c) => c.pricePerPyeong ?? NaN)),
      };
    }).filter((m) => m.kind === 'region' && m.count > 0);
  },

  async listComplexes(bbox, filters) {
    await delay();
    return MOCK_COMPLEXES.filter((c) => matchesFilters(c, filters) && (!bbox || inBBox(c, bbox)));
  },

  async getComplexSummary(id) {
    await delay();
    return MOCK_COMPLEXES.find((c) => c.id === id) ?? null;
  },

  async search(query) {
    await delay(80);
    const q = norm(query);
    if (!q) return [];
    const complexes: SearchResult[] = MOCK_COMPLEXES.filter((c) => norm(c.name).includes(q)).map((c) => ({
      kind: 'complex',
      id: c.id,
      title: c.name,
      subtitle: `${sigunguName(c.sigunguCode)} ${c.dongName} · ${c.households.toLocaleString()}세대`,
      location: c.location,
    }));
    const dongs: SearchResult[] = MOCK_DONGS.filter((d) => norm(d.dongName).includes(q)).map((d) => ({
      kind: 'dong',
      id: d.dongName,
      title: d.dongName,
      subtitle: `울산 ${sigunguName(d.sigunguCode)}`,
      location: { lat: d.lat, lng: d.lng },
    }));
    return [...dongs, ...complexes].slice(0, 20);
  },

  async getRegionSummaries() {
    await delay();
    return ULSAN_SIGUNGU.map<RegionSummary>((s, i) => {
      const items = MOCK_COMPLEXES.filter((c) => c.sigunguCode === s.code);
      return {
        sigunguCode: s.code,
        name: s.name,
        monthlyTrades: 40 + i * 37 + items.length * 9,
        avgPricePerPyeong: avg(items.map((c) => c.pricePerPyeong ?? NaN)) ?? 0,
        asOf: MOCK_AS_OF,
        source: MOCK_SOURCE,
      };
    });
  },
};
