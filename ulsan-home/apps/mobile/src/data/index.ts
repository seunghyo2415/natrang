import { mockDataSource } from './mock';
import type { DataSource } from './types';

/**
 * 데이터 모드 스위치. .env 의 EXPO_PUBLIC_DATA_MODE 로 바꾼다.
 *   mock     — 키 없이 동작 (기본값)
 *   supabase — 4단계에서 연결
 */
const requested = process.env.EXPO_PUBLIC_DATA_MODE ?? 'mock';

export const dataSource: DataSource = (() => {
  if (requested === 'supabase') {
    console.warn('[data] supabase 모드는 4단계에서 연결됩니다. 지금은 목업으로 동작합니다.');
  }
  return mockDataSource;
})();

export * from './types';
