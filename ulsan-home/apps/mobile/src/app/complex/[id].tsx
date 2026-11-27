import {
  formatArea,
  formatBuiltYear,
  formatManwon,
  formatManwonShort,
  parkingGrade,
  PARKING_GRADE_LABEL,
  sigunguName,
} from '@ulsan/shared';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, MockBadge, Skeleton, SourceNote } from '@/components/ui';
import { dataSource } from '@/data';
import { radius, space, usePalette } from '@/theme/colors';

/** 2단계: 요약만. 3단계에서 주차·실거래 차트 등 전체 상세 화면으로 확장 */
export default function ComplexScreen() {
  const c = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({ queryKey: ['complex', id], queryFn: () => dataSource.getComplexSummary(id) });

  if (q.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: space.lg, gap: space.md }}>
        <Skeleton height={28} width="60%" />
        <Skeleton height={18} width="80%" />
        <Skeleton height={120} />
      </View>
    );
  }
  if (q.isError || !q.data) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
        <EmptyState title="단지 정보를 찾을 수 없어요" message="목록이나 지도에서 다시 선택해 주세요." />
      </View>
    );
  }
  const d = q.data;
  const p = d.parkingPerHousehold;
  const grade = p ? parkingGrade(p.value) : null;
  const gradeColor = grade === 'plenty' ? c.good : grade === 'normal' ? c.warn : c.bad;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <Stack.Screen options={{ title: d.name }} />
      <MockBadge />
      <View>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>{d.name}</Text>
        <Text style={{ color: c.textSub, fontSize: 14, marginTop: 4 }}>
          {sigunguName(d.sigunguCode)} {d.dongName} · {formatBuiltYear(d.approvedDate)} · {d.households.toLocaleString()}세대
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ color: c.textSub, fontSize: 14 }}>최근 실거래가 · 전용 {formatArea(d.representativeM2)}</Text>
        <Text style={{ color: c.text, fontSize: 30, fontWeight: '800', marginTop: 4 }}>
          {d.recentPrice ? formatManwon(d.recentPrice.value) : '거래 없음'}
        </Text>
        {d.pricePerPyeong ? <Text style={{ color: c.textSub, marginTop: 2 }}>평당 {formatManwonShort(d.pricePerPyeong)}</Text> : null}
        {d.recentPrice ? <View style={{ marginTop: space.sm }}><SourceNote {...d.recentPrice} /></View> : null}
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ color: c.textSub, fontSize: 14 }}>세대당 주차대수</Text>
        {p && grade ? (
          <>
            <Text style={{ color: gradeColor, fontSize: 36, fontWeight: '800', marginTop: 4 }}>
              {p.value.toFixed(2)}대 <Text style={{ fontSize: 18 }}>{PARKING_GRADE_LABEL[grade]}</Text>
            </Text>
            <Text style={{ color: c.textSub, fontSize: 13, marginTop: 2 }}>1.5대↑ 여유 · 1.0~1.5대 보통 · 1.0대↓ 부족</Text>
            <View style={{ marginTop: space.sm }}><SourceNote {...p} /></View>
          </>
        ) : (
          <Text style={{ color: c.textSub, marginTop: 4 }}>주차 정보가 없어요</Text>
        )}
      </View>

      <Text style={{ color: c.textSub, fontSize: 13, lineHeight: 19 }}>
        주차 상세(지상/지하·기계식·출처 비교), 실거래 차트, 매물, 로드뷰, 커뮤니티는 다음 단계에서 이 화면에 추가돼요.
        {'\n'}본 정보는 참고용이며 실제 거래 시 공식 서류를 확인하세요.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
});
