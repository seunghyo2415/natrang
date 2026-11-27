import { View } from 'react-native';

import { EmptyState } from '@/components/ui';
import { usePalette } from '@/theme/colors';

export default function Screen() {
  const c = usePalette();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
      <EmptyState title="설정" message="직장 위치 등록, 지도 표시 옵션, 데이터 출처 안내가 들어갈 자리예요." />
    </View>
  );
}
