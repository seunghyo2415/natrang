import { useColorScheme } from 'react-native';

const light = {
  bg: '#F6F7F9',
  card: '#FFFFFF',
  text: '#15171A',
  textSub: '#5B616B',
  border: '#E3E6EA',
  primary: '#1F6FEB',
  primaryText: '#FFFFFF',
  chip: '#EEF1F5',
  good: '#1A9E5C',
  warn: '#C98A00',
  bad: '#D14343',
  mockBadge: '#FFF1C2',
  mockBadgeText: '#7A5B00',
  skeleton: '#E6E9EE',
};

const dark: typeof light = {
  bg: '#0E1013',
  card: '#181B20',
  text: '#F1F3F5',
  textSub: '#A3A9B3',
  border: '#2A2F36',
  primary: '#5B9BFF',
  primaryText: '#0E1013',
  chip: '#23272E',
  good: '#43C987',
  warn: '#F0B429',
  bad: '#FF6B6B',
  mockBadge: '#3D3215',
  mockBadgeText: '#F5D77A',
  skeleton: '#262A31',
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
