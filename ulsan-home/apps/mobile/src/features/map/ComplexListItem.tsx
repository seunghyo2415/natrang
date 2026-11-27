import { formatArea, formatBuiltYear, formatManwon, formatManwonShort, parkingGrade, PARKING_GRADE_LABEL, sigunguName } from '@ulsan/shared';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ComplexSummary } from '@/data';
import { radius, space, usePalette } from '@/theme/colors';

export function ComplexListItem({ item }: { item: ComplexSummary }) {
  const c = usePalette();
  const p = item.parkingPerHousehold?.value;
  const grade = p != null ? parkingGrade(p) : null;
  const gradeColor = grade === 'plenty' ? c.good : grade === 'normal' ? c.warn : c.bad;
  return (
    <Pressable
      onPress={() => router.push(`/complex/${item.id}`)}
      style={({ pressed }) => [styles.card, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} 상세 보기`}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ color: c.textSub, fontSize: 13, marginTop: 2 }}>
          {sigunguName(item.sigunguCode)} {item.dongName} · {formatBuiltYear(item.approvedDate)} · {item.households.toLocaleString()}세대
        </Text>
        <Text style={{ color: c.textSub, fontSize: 13, marginTop: 2 }}>대표 {formatArea(item.representativeM2)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.price, { color: c.text }]}>
          {item.recentPrice ? formatManwon(item.recentPrice.value) : '거래 없음'}
        </Text>
        {item.pricePerPyeong ? (
          <Text style={{ color: c.textSub, fontSize: 12 }}>평당 {formatManwonShort(item.pricePerPyeong)}</Text>
        ) : null}
        {p != null && grade ? (
          <Text style={{ color: gradeColor, fontSize: 13, fontWeight: '700', marginTop: 4 }}>
            주차 {p.toFixed(2)}대 · {PARKING_GRADE_LABEL[grade]}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  name: { fontSize: 17, fontWeight: '700' },
  price: { fontSize: 18, fontWeight: '800' },
});
