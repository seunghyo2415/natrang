import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import type { ComponentProps } from 'react';

import { usePalette } from '@/theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: '홈', icon: 'home' },
  { name: 'map', title: '지도', icon: 'map' },
  { name: 'compare', title: '비교', icon: 'git-compare' },
  { name: 'my-listings', title: '매물함', icon: 'bookmark' },
  { name: 'settings', title: '설정', icon: 'settings' },
];

export default function TabLayout() {
  const c = usePalette();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSub,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarLabelStyle: { fontWeight: '600' },
        headerStyle: { backgroundColor: c.card },
        headerTitleStyle: { color: c.text, fontWeight: '800' },
      }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            headerShown: t.name !== 'map',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={(focused ? t.icon : `${t.icon}-outline`) as IconName} color={color as string} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
