# 🏠 내가 만든 부동산 앱

울산 전용 부동산 정보 앱 (Android 우선). 주차 정보를 숫자로 정확히 보여주고, 당근마켓 매물을 공유하면 바로 분석하는 게 목표예요.

- 설계서: [docs/DESIGN.md](docs/DESIGN.md)
- API 키 발급 안내: [docs/API_KEYS.md](docs/API_KEYS.md)
- 지금 상태: **2단계 완료** (앱 뼈대 · 목업 지도/목록 · 검색 · 필터)

## 폴더

```
apps/mobile       Expo 앱 (화면은 src/app 아래 파일 하나 = 화면 하나)
packages/shared   앱·서버 공용 계산 (금액·평 표기, 주차 등급, 울산 코드) + 테스트
docs/             설계서, 키 발급 안내
```

## 처음 한 번만 준비

1. **Node.js LTS** 설치: https://nodejs.org → 왼쪽 "LTS" 버튼으로 내려받아 설치
2. 폰에 **Expo Go** 앱 설치 (Play 스토어에서 "Expo Go" 검색)
3. 터미널(윈도우는 "명령 프롬프트" 또는 "PowerShell")에서:

```bash
git clone <저장소 주소>
cd <저장소 폴더>
npm install
```

4. 설정 파일 만들기

```bash
# 맥/리눅스
cp apps/mobile/.env.example apps/mobile/.env
# 윈도우
copy apps\mobile\.env.example apps\mobile\.env
```

키가 없어도 됩니다. 비워 두면 **목업 데이터 + 목록 화면**으로 동작해요.
카카오 지도까지 보려면 [docs/API_KEYS.md](docs/API_KEYS.md) 1번대로 키를 받아 `.env`에 넣으세요.

## 실행

```bash
npm start
```

- 터미널에 QR 코드가 뜨면 → 폰의 **Expo Go** 앱 → "Scan QR code" → 찍기
- 컴퓨터와 폰이 **같은 와이파이**여야 해요. 안 되면 `npm start -- --tunnel`
- 코드를 고치면 폰 화면이 자동으로 바뀌어요. 폰을 흔들면 메뉴(새로고침)가 나와요.

## 확인 명령

```bash
npm test          # 공용 계산 테스트
npm run typecheck # 타입 검사
```
