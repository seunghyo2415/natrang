// 아이콘 자동 생성 설정: public/icon.svg 한 장으로 폰·브라우저용 PNG 여러 크기를 만들어 줌
// 다시 만들기: npx pwa-assets-generator
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // 안드로이드는 아이콘을 동그랗게 잘라요 → 흰 테두리 없이 그림을 꽉 채움 (그림은 이미 가운데 80% 안에 있음)
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
})
