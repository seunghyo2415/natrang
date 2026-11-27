import { View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { usePalette } from '@/theme/colors';

export default function Screen() {
  const c = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
      <EmptyState title="비교하기" message="최대 3개 단지를 표로 비교하는 화면은 8단계에서 만들어요." />
    </View>
  );
}
