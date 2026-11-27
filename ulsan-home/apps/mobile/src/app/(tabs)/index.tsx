import { formatManwonShort } from '@ulsan/shared';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, MockBadge, Skeleton, SourceNote } from '@/components/ui';
import { dataSource } from '@/data';
import { radius, space, usePalette } from '@/theme/colors';

export default function HomeScreen() {
  const c = usePalette();
  const regions = useQuery({ queryKey: ['regions'], queryFn: () => dataSource.getRegionSummaries() });

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <MockBadge />

      <Pressable
        onPress={() => router.push('/search')}
        style={[styles.card, { backgroundColor: c.primary }]}
        accessibilityRole="search">
        <Text style={{ color: c.primaryText, fontSize: 18, fontWeight: '800' }}>어느 단지가 궁금하세요?</Text>
        <Text style={{ color: c.primaryText, opacity: 0.9, marginTop: 4, fontSize: 14 }}>단지명 · 주소 · 동 이름으로 검색</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.h2, { color: c.text }]}>울산 구·군별 이번 달 요약</Text>
        {regions.isPending ? (
          <View style={{ gap: space.sm, marginTop: space.md }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={22} />
            ))}
          </View>
        ) : regions.isError ? (
          <EmptyState title="요약을 불러오지 못했어요" action={{ label: '다시 시도', onPress: () => regions.refetch() }} />
        ) : (
          <>
            <View style={[styles.row, { marginTop: space.md }]}>
              <Text style={[styles.th, { color: c.textSub, flex: 1, textAlign: 'left' }]}>지역</Text>
              <Text style={[styles.th, { color: c.textSub, width: 64 }]}>거래량</Text>
              <Text style={[styles.th, { color: c.textSub, width: 96 }]}>평균 평당가</Text>
            </View>
            {regions.data.map((r) => (
              <View key={r.sigunguCode} style={[styles.row, { borderTopColor: c.border }]}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{r.name}</Text>
                <Text style={{ color: c.text, fontSize: 16, width: 64, textAlign: 'right' }}>{r.monthlyTrades}건</Text>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', width: 96, textAlign: 'right' }}>
                  {formatManwonShort(r.avgPricePerPyeong)}
                </Text>
              </View>
            ))}
            <View style={{ marginTop: space.sm }}>
              <SourceNote source={regions.data[0]?.source ?? ''} asOf={regions.data[0]?.asOf ?? ''} />
            </View>
          </>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.h2, { color: c.text }]}>최근 본 단지 · 즐겨찾기</Text>
        <Text style={{ color: c.textSub, marginTop: space.sm, lineHeight: 20 }}>
          단지 상세 화면이 생기는 3단계부터 여기에 모여요.
        </Text>
      </View>

      <Text style={{ color: c.textSub, fontSize: 12, lineHeight: 18 }}>
        본 정보는 참고용이며 실제 거래 시 공식 서류를 확인하세요.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, borderRadius: radius.lg },
  h2: { fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'transparent', gap: space.sm },
  th: { fontSize: 13, textAlign: 'right' },
});
