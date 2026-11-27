# API 키 발급 안내

> 규칙: **앱(.env의 EXPO_PUBLIC_…)에는 "공개용" 키만** 넣습니다. 나머지 키는 4단계부터 서버(Supabase/GitHub Secrets)에만 넣어요.
> 키를 채팅이나 GitHub에 붙여 넣지 마세요. `.env` 파일은 GitHub에 올라가지 않게 설정돼 있어요.

## 1. 카카오 JavaScript 키 (2단계 · 지도 표시용 · 공개용)

1. https://developers.kakao.com 접속 → 카카오 계정으로 로그인
2. 위쪽 **내 애플리케이션** → **애플리케이션 추가하기**
   - 앱 이름: `내가 만든 부동산 앱` / 회사명: 본인 이름 → 저장
3. 만든 앱을 눌러 **앱 키**(또는 "플랫폼 키") 메뉴 → **JavaScript 키** 복사
4. **플랫폼** 메뉴 → **Web 플랫폼 등록** → 사이트 도메인에 아래를 그대로 입력 → 저장
   ```
   http://localhost
   ```
   (앱 안의 지도 페이지가 이 주소로 열리도록 만들어 뒀어요. 이걸 빠뜨리면 지도가 안 떠요.)
5. 메뉴에 **카카오맵** 사용 설정(활성화) 항목이 보이면 **ON**으로 바꾸세요. (최근 만든 앱은 이 설정이 필요할 수 있어요)
6. `apps/mobile/.env` 파일을 열어 붙여넣기
   ```
   EXPO_PUBLIC_KAKAO_JS_KEY=복사한키
   ```
7. 터미널에서 `Ctrl + C`로 멈춘 뒤 `npm start -- --clear` 로 다시 실행

> 카카오 화면 메뉴 이름은 가끔 바뀌어요. 위와 다르면 화면을 캡처해서 보여주세요.

## 앞으로 필요한 키 (해당 단계에서 자세히 안내)

| 단계 | 키 | 어디서 | 어디에 넣나 |
|---|---|---|---|
| 4 | 공공데이터포털 일반 인증키 | data.go.kr → 회원가입 → 각 API "활용신청" | 서버 |
| 4 | 카카오 REST API 키 | 위 1번에서 만든 앱의 "REST API 키" | 서버 |
| 4 | Supabase 프로젝트 URL · anon 키 | supabase.com → New project | 앱(.env) — anon 키는 공개용 |
| 4 | Supabase service_role 키 | 같은 곳 | 서버 전용 ⚠️ 절대 앱에 넣지 않기 |
| 6 | 한국환경공단 전기차 충전소 | data.go.kr (일반 인증키와 별도로 **활용신청** 필요) | 서버 |
| 6 | NEIS 교육정보 키 | open.neis.go.kr | 서버 |
| 7 | 네이버 검색 API | developers.naver.com | 서버 |
| 7 | YouTube Data API | console.cloud.google.com | 서버 |
| 9 | Google Play 개발자 계정 ($25, 1회) | play.google.com/console | — |
