import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Vite 설정 파일: 앱을 만들고(빌드) 미리 실행할 때 쓰는 규칙
// - react(): React 문법을 이해하게 해 줌
// - tailwindcss(): Tailwind 디자인 도구 연결
// - VitePWA(): 오프라인에서도 열리게(미리 저장) + 폰에 앱처럼 설치되게(매니페스트)
export default defineConfig({
  // base: 앱이 올라갈 "폴더 주소". GitHub Pages는 https://아이디.github.io/저장소이름/ 처럼 폴더 안에 올라가요.
  // 자동 배포(GitHub Actions)가 BASE_PATH=/저장소이름/ 을 알려 주고, 내 컴퓨터에서는 그냥 '/'
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': 새 버전이 나오면 바로 바꾸지 않고 「업데이트 있음」 알림을 띄워 내가 누를 때 바꿈
      // (여행 중에 화면이 갑자기 바뀌지 않게)
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      // 매니페스트: 폰에 "이 앱은 이름이 뭐고, 아이콘은 이거고, 주소창 없이 열어 줘"라고 알려 주는 명함
      manifest: {
        name: '나트랑 여행 도우미',
        short_name: '나트랑 여행',
        description: '2026.12.17~21 나트랑 여행 일정·길찾기·비용 도우미 (오프라인 사용 가능)',
        lang: 'ko',
        theme_color: '#0284c7',
        background_color: '#f0f9ff',
        display: 'standalone',
        orientation: 'portrait',
        // '.' = 앱이 올라간 폴더 기준 → GitHub Pages 주소(/저장소이름/)에서도 그대로 동작
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // 미리 저장(프리캐시)할 파일: 화면 코드·디자인·아이콘 전부. 일정 데이터(JSON)는 코드 안에 같이 들어가 있어요
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
