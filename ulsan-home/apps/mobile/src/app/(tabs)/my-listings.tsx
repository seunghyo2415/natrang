import { View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { usePalette } from '@/theme/colors';

export default function Screen() {
  const c = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
      <EmptyState title="내 매물함" message="당근마켓에서 공유한 매물이 여기 저장돼요. (5단계)" />
    </View>
  );
}
