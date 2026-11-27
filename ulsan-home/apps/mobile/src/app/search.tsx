import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Loading } from '@/components/ui';
import { dataSource, type SearchResult } from '@/data';
import { useAppStore } from '@/stores/app-store';
import { radius, space, usePalette } from '@/theme/colors';

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const KIND_ICON = { complex: 'business', dong: 'location', address: 'navigate' } as const;

export default function SearchScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const q = useDebounced(text.trim());
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches, focusMap } = useAppStore();

  const results = useQuery({
    queryKey: ['search', q],
    queryFn: () => dataSource.search(q),
    enabled: q.length > 0,
  });

  const choose = (r: SearchResult) => {
    addRecentSearch(r.title);
    if (r.kind === 'complex') {
      router.replace(`/complex/${r.id}`);
    } else {
      focusMap(r.location, 5);
      router.replace('/map');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + space.sm }}>
      <View style={[styles.bar, { backgroundColor: c.card, borderColor: c.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="뒤로">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder="단지명 · 주소 · 동 이름"
          placeholderTextColor={c.textSub}
          style={{ flex: 1, color: c.text, fontSize: 17, paddingVertical: 12 }}
          returnKeyType="search"
          onSubmitEditing={() => results.data?.[0] && choose(results.data[0])}
        />
        {text ? (
          <Pressable onPress={() => setText('')} hitSlop={12} accessibilityLabel="지우기">
            <Ionicons name="close-circle" size={20} color={c.textSub} />
          </Pressable>
        ) : null}
      </View>

      {!q ? (
        <View style={{ padding: space.lg }}>
          <View style={styles.recentHead}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>최근 검색어</Text>
            {recentSearches.length ? (
              <Pressable onPress={clearRecentSearches} hitSlop={8}>
                <Text style={{ color: c.textSub }}>모두 지우기</Text>
              </Pressable>
            ) : null}
          </View>
          {recentSearches.length === 0 ? (
            <Text style={{ color: c.textSub, marginTop: space.sm }}>최근 검색어가 없어요. 예) 삼산, 옥동, 혁신</Text>
          ) : (
            recentSearches.map((r) => (
              <View key={r} style={[styles.recentRow, { borderBottomColor: c.border }]}>
                <Pressable style={{ flex: 1 }} onPress={() => setText(r)}>
                  <Text style={{ color: c.text, fontSize: 16 }}>{r}</Text>
                </Pressable>
                <Pressable onPress={() => removeRecentSearch(r)} hitSlop={8} accessibilityLabel={`${r} 삭제`}>
                  <Ionicons name="close" size={18} color={c.textSub} />
                </Pressable>
              </View>
            ))
          )}
        </View>
      ) : results.isPending ? (
        <Loading />
      ) : (
        <FlatList
          data={results.data ?? []}
          keyExtractor={(r) => `${r.kind}:${r.id}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable onPress={() => choose(item)} style={[styles.result, { borderBottomColor: c.border }]}>
              <Ionicons name={KIND_ICON[item.kind]} size={20} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
                <Text style={{ color: c.textSub, fontSize: 13, marginTop: 2 }}>{item.subtitle}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title={`"${q}" 검색 결과가 없어요`}
              message="단지명 일부나 동 이름으로 다시 검색해 보세요. 도로명·지번 주소 검색은 4단계(카카오 주소 검색 연결)부터 돼요."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  recentHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  result: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
