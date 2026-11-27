import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Chip } from '@/components/ui';
import type { ComplexFilters } from '@/data';
import { radius, space, usePalette } from '@/theme/colors';

type Option<T> = { label: string; value: T };

const PRICE: Option<Pick<ComplexFilters, 'priceMin' | 'priceMax'>>[] = [
  { label: '전체', value: {} },
  { label: '2억 이하', value: { priceMax: 20000 } },
  { label: '2~4억', value: { priceMin: 20000, priceMax: 40000 } },
  { label: '4~6억', value: { priceMin: 40000, priceMax: 60000 } },
  { label: '6억 이상', value: { priceMin: 60000 } },
];
const AREA: Option<Pick<ComplexFilters, 'areaMin' | 'areaMax'>>[] = [
  { label: '전체', value: {} },
  { label: '20평 미만', value: { areaMax: 66 } },
  { label: '20평대', value: { areaMin: 66, areaMax: 99 } },
  { label: '30평 이상', value: { areaMin: 99 } },
];
const BUILT: Option<Pick<ComplexFilters, 'builtAfter'>>[] = [
  { label: '전체', value: {} },
  { label: '5년 이내', value: { builtAfter: 2022 } },
  { label: '10년 이내', value: { builtAfter: 2017 } },
  { label: '20년 이내', value: { builtAfter: 2007 } },
];
const HOUSEHOLDS: Option<Pick<ComplexFilters, 'householdsMin'>>[] = [
  { label: '전체', value: {} },
  { label: '300세대↑', value: { householdsMin: 300 } },
  { label: '500세대↑', value: { householdsMin: 500 } },
  { label: '1000세대↑', value: { householdsMin: 1000 } },
];
const PARKING: Option<Pick<ComplexFilters, 'parkingMin'>>[] = [
  { label: '전체', value: {} },
  { label: '1.0대↑', value: { parkingMin: 1.0 } },
  { label: '1.2대↑', value: { parkingMin: 1.2 } },
  { label: '1.5대↑ (여유)', value: { parkingMin: 1.5 } },
];

const same = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

/** 현재 필터 값이 이 그룹의 어떤 선택지와 같은지 찾는다 (없으면 undefined) */
function pick<T extends object>(filters: ComplexFilters, options: Option<T>[]) {
  const groupKeys = new Set(options.flatMap((x) => Object.keys(x.value) as (keyof ComplexFilters)[]));
  const current: Record<string, unknown> = {};
  groupKeys.forEach((k) => {
    if (filters[k] != null) current[k] = filters[k];
  });
  return options.find((o) => same(current, o.value as Record<string, unknown>));
}

/** 필터 요약 문구 (지도 상단 칩에 표시) */
export function describeFilters(f: ComplexFilters): string[] {
  const out: string[] = [];
  for (const group of [PRICE, AREA, BUILT, HOUSEHOLDS, PARKING] as Option<object>[][]) {
    const o = pick(f, group);
    if (o && o.label !== '전체') out.push(o.label);
    else if (!o) out.push('사용자 지정');
  }
  return out;
}

export function FilterSheet({
  visible,
  value,
  onClose,
  onApply,
}: {
  visible: boolean;
  value: ComplexFilters;
  onClose: () => void;
  onApply: (f: ComplexFilters) => void;
}) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ComplexFilters>(value);

  const section = <T extends object>(title: string, options: Option<T>[], clearKeys: (keyof ComplexFilters)[]) => {
    const selected = pick(draft, options);
    return (
      <View style={{ marginBottom: space.lg }}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        <View style={styles.row}>
          {options.map((o) => (
            <Chip
              key={o.label}
              label={o.label}
              active={selected?.label === o.label}
              onPress={() => {
                const next: ComplexFilters = { ...draft };
                clearKeys.forEach((k) => delete next[k]);
                setDraft({ ...next, ...o.value });
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} onShow={() => setDraft(value)}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="필터 닫기" />
      <View style={[styles.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + space.lg }]}>
        <Text style={[styles.header, { color: c.text }]}>필터</Text>
        <ScrollView style={{ maxHeight: 460 }}>
          {section('매매가 (최근 실거래)', PRICE, ['priceMin', 'priceMax'])}
          {section('평형 (전용면적)', AREA, ['areaMin', 'areaMax'])}
          {section('연식 (입주)', BUILT, ['builtAfter'])}
          {section('세대수', HOUSEHOLDS, ['householdsMin'])}
          {section('세대당 주차대수', PARKING, ['parkingMin'])}
          <Text style={{ color: c.textSub, fontSize: 13, marginBottom: space.md }}>
            거래유형(매매/전세/월세) 필터는 실거래 데이터를 연결하는 4단계에서 추가됩니다.
          </Text>
        </ScrollView>
        {/* 한 손 조작: 주요 버튼은 아래쪽 */}
        <View style={styles.actions}>
          <Pressable onPress={() => setDraft({})} style={[styles.btn, { backgroundColor: c.chip }]}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>초기화</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={[styles.btn, { backgroundColor: c.primary, flex: 2 }]}>
            <Text style={{ color: c.primaryText, fontWeight: '700', fontSize: 16 }}>적용하기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { padding: space.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  header: { fontSize: 20, fontWeight: '800', marginBottom: space.lg },
  title: { fontSize: 15, fontWeight: '700', marginBottom: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.md },
});
