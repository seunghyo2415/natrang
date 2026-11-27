import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { dataSource } from '@/data';
import { radius, space, usePalette } from '@/theme/colors';

/** 목업 모드일 때만 보이는 배지 — 가짜 숫자를 실제로 오해하지 않게 */
export function MockBadge({ style }: { style?: ViewStyle }) {
  const c = usePalette();
  if (dataSource.mode !== 'mock') return null;
  return (
    <View style={[styles.badge, { backgroundColor: c.mockBadge }, style]} accessibilityLabel="목업 데이터 표시">
      <Text style={[styles.badgeText, { color: c.mockBadgeText }]}>목업 데이터 · 실제 시세 아님</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[
        styles.chip,
        { backgroundColor: active ? c.primary : c.chip, borderColor: active ? c.primary : c.border },
      ]}>
      <Text style={{ color: active ? c.primaryText : c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** 스켈레톤: 회색 상자가 은은하게 깜빡임 */
export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: ViewStyle }) {
  const c = usePalette();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ height, width, borderRadius: radius.sm, backgroundColor: c.skeleton, opacity }, style]} />;
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: { label: string; onPress: () => void } }) {
  const c = usePalette();
  return (
    <View style={styles.empty}>
      <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {message ? <Text style={{ color: c.textSub, fontSize: 15, marginTop: space.sm, textAlign: 'center', lineHeight: 22 }}>{message}</Text> : null}
      {action ? (
        <Pressable onPress={action.onPress} style={[styles.button, { backgroundColor: c.primary }]}>
          <Text style={{ color: c.primaryText, fontWeight: '700', fontSize: 15 }}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loading() {
  const c = usePalette();
  return <ActivityIndicator color={c.primary} style={{ margin: space.xl }} />;
}

/** "출처 · 기준일" 작은 글씨 */
export function SourceNote({ source, asOf }: { source: string; asOf: string }) {
  const c = usePalette();
  return (
    <Text style={{ color: c.textSub, fontSize: 12 }}>
      출처: {source} · 기준일 {asOf}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '700' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  empty: { padding: space.xl, alignItems: 'center' },
  button: { marginTop: space.lg, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
});
