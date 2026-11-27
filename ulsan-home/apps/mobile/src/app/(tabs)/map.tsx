import { Ionicons } from '@expo/vector-icons';
import { ULSAN_CENTER } from '@ulsan/shared';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, EmptyState, MockBadge, Skeleton } from '@/components/ui';
import { dataSource, type BBox, type LatLng } from '@/data';
import { ComplexListItem } from '@/features/map/ComplexListItem';
import { FilterSheet, describeFilters } from '@/features/map/FilterSheet';
import { KAKAO_JS_KEY, KakaoMap } from '@/features/map/KakaoMap';
import { levelToMode } from '@/map-web/kakao-map-html';
import { useAppStore } from '@/stores/app-store';
import { radius, space, usePalette } from '@/theme/colors';

const INITIAL_LEVEL = 9;
const PRICE_LABEL_TEXT = { price: '가격', pyeong: '평당가', none: '이름만' } as const;

export default function MapScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const {
    filters,
    setFilters,
    priceLabel,
    cyclePriceLabel,
    viewMode,
    setViewMode,
    pendingFocus,
    consumeFocus,
    focusMap,
  } = useAppStore();

  const [view, setView] = useState<{ bbox: BBox; level: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(KAKAO_JS_KEY ? null : 'no-key');
  const [filterOpen, setFilterOpen] = useState(false);
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [tapped, setTapped] = useState<LatLng | null>(null);
  const [focus, setFocus] = useState<{ location: LatLng; level: number } | null>(null);

  const mapUsable = !mapError;
  const showMap = mapUsable && viewMode === 'map';

  // 검색 화면에서 넘어온 "여기로 이동" 요청 처리
  useEffect(() => {
    if (pendingFocus) {
      setFocus(pendingFocus);
      consumeFocus();
    }
  }, [pendingFocus, consumeFocus]);

  const mode = view ? levelToMode(view.level) : 'sigungu';
  const markers = useQuery({
    queryKey: ['markers', view, mode, filters],
    queryFn: () => dataSource.getMapMarkers(view!.bbox, mode, filters),
    enabled: showMap && !!view,
    placeholderData: (prev) => prev,
  });

  const list = useQuery({
    queryKey: ['list', viewMode === 'list' && mapUsable ? view?.bbox : null, filters],
    queryFn: () => dataSource.listComplexes(viewMode === 'list' && mapUsable ? view?.bbox ?? null : null, filters),
    enabled: !showMap,
  });

  const onIdle = useCallback((bbox: BBox, level: number) => setView({ bbox, level }), []);

  const goToMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setMyLocation(loc);
    setFocus({ location: loc, level: 5 });
  };

  const filterLabels = describeFilters(filters);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {showMap ? (
        <KakaoMap
          initialCenter={ULSAN_CENTER}
          initialLevel={INITIAL_LEVEL}
          markers={markers.data ?? []}
          priceLabel={priceLabel}
          focus={focus}
          myLocation={myLocation}
          onIdle={onIdle}
          onMarkerPress={(m) => {
            setTapped(null);
            if (m.kind === 'complex') router.push(`/complex/${m.id}`);
            else focusMap(m.location, m.id.startsWith('sgg:') ? 7 : 5);
          }}
          onMapPress={(p) => setTapped(p)}
          onError={(msg) => setMapError(msg)}
        />
      ) : null}

      {/* 상단: 검색 + 필터 */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push('/search')}
          style={[styles.search, { backgroundColor: c.card, borderColor: c.border }]}
          accessibilityRole="search"
          accessibilityLabel="단지명, 주소, 동 이름 검색">
          <Ionicons name="search" size={20} color={c.textSub} />
          <Text style={{ color: c.textSub, fontSize: 16 }}>단지명 · 주소 · 동 이름 검색</Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={filterLabels.length ? `필터 ${filterLabels.length}` : '필터'} active={filterLabels.length > 0} onPress={() => setFilterOpen(true)} />
          {filterLabels.map((l) => (
            <Chip key={l} label={l} active onPress={() => setFilterOpen(true)} />
          ))}
          {filterLabels.length ? <Chip label="초기화" onPress={() => setFilters({})} /> : null}
        </ScrollView>
        <MockBadge style={{ marginTop: space.xs }} />
      </View>

      {/* 리스트 보기 (또는 지도를 쓸 수 없을 때) */}
      {!showMap ? (
        <View style={{ flex: 1, paddingTop: insets.top + 132 }}>
          {mapError ? (
            <View style={[styles.notice, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>
                {mapError === 'no-key' ? '지도 키가 아직 없어요 — 리스트로 보여드릴게요' : '지도를 불러오지 못했어요'}
              </Text>
              <Text style={{ color: c.textSub, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                {mapError === 'no-key'
                  ? '.env 파일에 EXPO_PUBLIC_KAKAO_JS_KEY 를 넣으면 지도가 켜집니다. (발급 방법: docs/API_KEYS.md)'
                  : mapError}
              </Text>
              {mapError !== 'no-key' ? (
                <Pressable onPress={() => setMapError(null)} style={{ marginTop: space.sm }}>
                  <Text style={{ color: c.primary, fontWeight: '700' }}>다시 시도</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {list.isPending ? (
            <View style={{ padding: space.lg, gap: space.sm }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={84} />
              ))}
            </View>
          ) : list.isError ? (
            <EmptyState title="목록을 불러오지 못했어요" message="잠시 후 다시 시도해 주세요." action={{ label: '다시 시도', onPress: () => list.refetch() }} />
          ) : (
            <FlatList
              data={list.data}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => <ComplexListItem item={item} />}
              contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }}
              ListHeaderComponent={
                <Text style={{ color: c.textSub, marginBottom: space.sm }}>
                  {viewMode === 'list' && mapUsable ? '지도 화면 안의 ' : '울산 전체 '}단지 {list.data?.length ?? 0}곳
                </Text>
              }
              ListEmptyComponent={
                <EmptyState
                  title="조건에 맞는 단지가 없어요"
                  message="필터를 조금 넓혀 보세요."
                  action={{ label: '필터 초기화', onPress: () => setFilters({}) }}
                />
              }
            />
          )}
        </View>
      ) : null}

      {/* 지도 빈 곳을 눌렀을 때: 그 위치 건물 정보 (4단계에서 건축물대장 연결) */}
      {showMap && tapped ? (
        <View style={[styles.tapCard, { backgroundColor: c.card, borderColor: c.border, bottom: 84 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>이 위치의 건물 정보</Text>
            <Text style={{ color: c.textSub, fontSize: 13, marginTop: 2 }}>
              {tapped.lat.toFixed(5)}, {tapped.lng.toFixed(5)} · 건축물대장 조회는 4단계에서 연결돼요
            </Text>
          </View>
          <Pressable onPress={() => setTapped(null)} accessibilityLabel="닫기" hitSlop={12}>
            <Ionicons name="close" size={22} color={c.textSub} />
          </Pressable>
        </View>
      ) : null}

      {/* 하단 버튼 (한 손 조작) */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        {mapUsable ? (
          <Pressable
            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            style={[styles.pill, { backgroundColor: c.text }]}
            accessibilityRole="button">
            <Ionicons name={viewMode === 'map' ? 'list' : 'map'} size={18} color={c.bg} />
            <Text style={{ color: c.bg, fontWeight: '700', fontSize: 15 }}>{viewMode === 'map' ? '목록 보기' : '지도 보기'}</Text>
          </Pressable>
        ) : null}
      </View>
      {showMap ? (
        <View style={styles.fabs}>
          <Pressable
            onPress={cyclePriceLabel}
            style={[styles.fab, { backgroundColor: c.card, borderColor: c.border }]}
            accessibilityLabel={`마커 표시: ${PRICE_LABEL_TEXT[priceLabel]}`}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 12 }}>{PRICE_LABEL_TEXT[priceLabel]}</Text>
          </Pressable>
          <Pressable
            onPress={goToMyLocation}
            style={[styles.fab, { backgroundColor: c.card, borderColor: c.border }]}
            accessibilityLabel="현재 위치로 이동">
            <Ionicons name="locate" size={22} color={c.primary} />
          </Pressable>
        </View>
      ) : null}

      <FilterSheet visible={filterOpen} value={filters} onClose={() => setFilterOpen(false)} onApply={setFilters} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: space.lg, zIndex: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    height: 50,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chips: { gap: space.sm, paddingVertical: space.sm },
  notice: { marginHorizontal: space.lg, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  tapCard: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
  },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: space.lg, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill, elevation: 4 },
  fabs: { position: 'absolute', right: space.lg, bottom: 84, gap: space.sm },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, elevation: 3 },
});
