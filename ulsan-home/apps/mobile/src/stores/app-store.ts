import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ComplexFilters, LatLng } from '@/data';

type PriceLabel = 'price' | 'pyeong' | 'none';

type AppState = {
  filters: ComplexFilters;
  setFilters: (f: ComplexFilters) => void;
  resetFilters: () => void;

  priceLabel: PriceLabel;
  cyclePriceLabel: () => void;

  viewMode: 'map' | 'list';
  setViewMode: (m: 'map' | 'list') => void;

  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  removeRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;

  /** 검색 결과 등으로 지도를 옮겨 달라는 요청 (지도 화면이 읽고 비움) */
  pendingFocus: { location: LatLng; level: number } | null;
  focusMap: (location: LatLng, level: number) => void;
  consumeFocus: () => void;
};

const NEXT_LABEL: Record<PriceLabel, PriceLabel> = { price: 'pyeong', pyeong: 'none', none: 'price' };

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      filters: {},
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: {} }),

      priceLabel: 'price',
      cyclePriceLabel: () => set((s) => ({ priceLabel: NEXT_LABEL[s.priceLabel] })),

      viewMode: 'map',
      setViewMode: (viewMode) => set({ viewMode }),

      recentSearches: [],
      addRecentSearch: (q) =>
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 10),
        })),
      removeRecentSearch: (q) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) })),
      clearRecentSearches: () => set({ recentSearches: [] }),

      pendingFocus: null,
      focusMap: (location, level) => set({ pendingFocus: { location, level }, viewMode: 'map' }),
      consumeFocus: () => set({ pendingFocus: null }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      // 지도 이동 요청은 저장하지 않음
      partialize: ({ filters, priceLabel, viewMode, recentSearches }) => ({
        filters,
        priceLabel,
        viewMode,
        recentSearches,
      }),
    },
  ),
);

export type { PriceLabel };
