# 내가 만든 부동산 앱 — 설계서 (v0.2)

> 상태: **설계 확정(2026-11-27)** — 결정 사항은 맨 아래 10장 참고.
> 표시 규칙: ✅ 공식 문서·포털에서 확인함 / 🔶 엔드포인트는 확인했고 **응답 필드명은 4단계에서 실제 응답·활용가이드로 확인 예정** / ❓ 아직 확인 못 함(쓰기 전에 확인)

---

## 0. 한눈에 보기

```
┌──────────── 휴대폰 (Expo 앱) ────────────┐        ┌──────────── Supabase ─────────────┐
│ 지도(WebView+카카오맵 JS) · 상세 · 매물함 │  HTTPS │ Edge Functions (앱 전용 API)       │
│ TanStack Query(서버 데이터) + Zustand(UI) │ ─────▶ │  · share-parse  (공유 링크 OG 분석) │
│ dataSource = mock | supabase  ◀─ 스위치   │        │  · geo          (카카오 로컬 대행)  │
│ 공유 수신(expo-share-intent)              │        │  · community    (네이버/카카오/유튜브)│
└───────────────────────────────────────────┘        │  · nearby / commute / ev            │
                                                     │ PostgreSQL + PostGIS (캐시된 데이터) │
     ┌──── GitHub Actions (예약 실행) ────┐   쓰기   │ Auth(로그인) · Storage(임장 사진)    │
     │ ingest 스크립트(Node/TS)           │ ───────▶ └─────────────────────────────────────┘
     │  매일: 실거래(매매·전월세)          │                    ▲
     │  주1회: 단지목록·상세·건축물대장    │   공공데이터포털·K-apt·환경공단·NEIS 등
     │  월1회: 관리비·학교·POI            │ ◀── API 키는 GitHub Secrets / Supabase Secrets 에만
     └────────────────────────────────────┘
```

**핵심 원칙**
1. **API 키는 앱에 절대 없음.** 앱에 들어가는 건 Supabase 주소·공개용 anon 키, 카카오맵 **JavaScript 키**(도메인 제한이 걸리는 공개용 키)뿐.
2. **공공데이터는 미리 모아 DB에 저장** → 앱은 우리 DB만 읽음 (빠르고, 일일 호출 한도 걱정 없음).
3. **목업 모드 우선.** `EXPO_PUBLIC_DATA_MODE=mock` 이면 키 없이 전 화면이 돌아감. 화면 코드는 `dataSource` 인터페이스만 보고, 구현(mock/supabase)만 바뀜.
4. **모든 수치는 `{값, 출처, 기준일}` 묶음**으로 다룸 → 화면에 항상 출처·기준일 표시.

---

## 1. 기술 스택 (권장안 + 바꾼 부분과 이유)

| 영역 | 선택 | 이유 / 메모 |
|---|---|---|
| 앱 | **Expo (TypeScript) + Expo Router** | 파일 이름 = 화면 주소. 공유 수신 딥링크 처리도 쉬움 |
| 실행 방식 | **Development Build** (Expo Go ❌) | `expo-share-intent`는 네이티브 설정이 필요해 Expo Go로는 공유 수신 테스트 불가. 2~4단계는 Expo Go로도 가능, 5단계부터 개발용 APK 필요 |
| 지도·로드뷰 | 카카오맵 JS SDK in `react-native-webview` | 로드뷰는 JS SDK에만 있음. 지도 HTML은 앱에 내장하고 `baseUrl`을 카카오 콘솔에 등록한 도메인으로 지정 |
| 단지 마커 묶기 | 카카오 `clusterer` 라이브러리 + **서버 집계** | 구·동 단위는 DB에서 미리 집계한 값(평균가·단지수)을 마커로, 단지 단위만 화면 영역(bbox) 안 것만 불러옴 → 마커 수천 개도 버벅임 없음 |
| 백엔드 | **Supabase** (NestJS ❌) | PostGIS(반경·영역 검색), 로그인, 사진 저장, 행 단위 보안(RLS)이 기본 제공 → 서버 직접 운영 불필요. 무료 요금제로 시작 가능 |
| 배치 수집 | **GitHub Actions 예약 실행 + Node 스크립트** | Edge Function은 실행 시간 제한이 있어 수천 건 수집에 불리. Actions는 무료 분량이 넉넉하고 로그가 남아 초보자도 확인 쉬움 |
| 서버 상태 | TanStack Query | 캐시·재시도·로딩 상태 자동 |
| UI 상태 | Zustand (+ MMKV 저장) | 필터, 최근 검색어, 지도 옵션 |
| 차트 | **react-native-gifted-charts** | victory-native(최신판)는 Skia 등 추가 네이티브 의존성이 커서 초보자 빌드 문제 가능성 ↑ |
| 푸시 | expo-notifications + Expo Push | 서버 배치가 새 실거래 감지 → 푸시 |
| 테스트 | Jest(앱 로직), Vitest(공용 패키지·수집기), Maestro(화면 흐름, 9단계) | |
| 저장소 구조 | npm workspaces 모노레포 | pnpm보다 설치·설명이 단순 |

---

## 2. 폴더 구조

현재 저장소(`natrang`)는 나트랑 여행 앱이라, **새 앱은 `ulsan-home/` 폴더 안에 따로** 둡니다(기존 앱·배포에 영향 없음). 별도 저장소를 원하면 그대로 옮길 수 있게 구성합니다. → 「결정 1」

```
ulsan-home/
├─ apps/
│  └─ mobile/                      # Expo 앱
│     ├─ app/                      # Expo Router 화면 (파일 = 화면)
│     │  ├─ (tabs)/
│     │  │  ├─ index.tsx           # 홈
│     │  │  ├─ map.tsx             # 지도 탐색 (+리스트 전환)
│     │  │  ├─ compare.tsx         # 비교하기
│     │  │  ├─ my-listings.tsx     # 내 매물함
│     │  │  └─ settings.tsx        # 설정
│     │  ├─ complex/[id]/          # 단지 상세 (요약·주차·시세·매물·위치·정보·커뮤니티·계산기)
│     │  ├─ building/[pnu].tsx     # 아파트 외 건물 상세 (건축물대장 기반)
│     │  ├─ share/receive.tsx      # 공유 받은 링크 분석 화면
│     │  ├─ share/pick.tsx         # "어느 건물인가요?" 후보 선택
│     │  ├─ listing/[id].tsx       # 저장 매물 + 임장 체크리스트
│     │  ├─ search.tsx             # 검색 (자동완성·최근 검색어)
│     │  ├─ roadview.tsx           # 로드뷰 전체화면
│     │  └─ calculators/           # 취득세·대출·전세가율
│     ├─ src/
│     │  ├─ data/                  # ★ dataSource 인터페이스
│     │  │  ├─ types.ts
│     │  │  ├─ mock/               # 목업 구현 + 울산 가상 단지 데이터
│     │  │  └─ supabase/           # 실제 구현
│     │  ├─ features/              # 기능별 컴포넌트·훅 (map, complex, parking, trades, share ...)
│     │  ├─ components/ui/         # 공통 UI (스켈레톤, ⓘ툴팁, 출처배지, 숫자표기)
│     │  ├─ map-web/               # WebView 안에서 도는 카카오맵 HTML/JS (+RN↔웹 메시지 규약)
│     │  ├─ stores/                # Zustand
│     │  └─ theme/                 # 라이트/다크 토큰
│     ├─ plugins/                  # Expo config plugin(필요 시)
│     └─ app.config.ts
├─ packages/
│  └─ shared/                      # 앱·서버 공통 (순수 TS, 테스트 쉬움)
│     ├─ format/                   # 억/만원, ㎡↔평, 날짜
│     ├─ parking/                  # 세대당 주차·등급·출처 비교
│     ├─ share-parse/              # 공유 텍스트 → URL/주소/가격/면적 추출
│     ├─ calc/                     # 취득세·대출·전세가율 (규정 값은 인자로 받음)
│     ├─ moderation/               # 금칙어·전화번호 마스킹
│     └─ codes/ulsan.ts            # 울산 시군구·법정동 코드
├─ supabase/
│  ├─ migrations/                  # DB 스키마 SQL
│  ├─ functions/                   # Edge Functions (Deno)
│  └─ seed.sql                     # 개발용 시드
├─ ingest/                         # 공공데이터 수집기 (Node/TS)
│  ├─ sources/                     # API별 클라이언트 (rtms, kapt, bldrgst, ev, neis ...)
│  ├─ match/                       # 단지 매칭 로직
│  └─ jobs/                        # daily-trades, weekly-complex, monthly-fees ...
├─ .github/workflows/ (저장소 루트에 둠) ingest-*.yml
└─ docs/
   ├─ DESIGN.md                    # 이 문서
   ├─ API_KEYS.md                  # 키 발급 안내 (단계별)
   └─ DATA_SOURCES.md              # 확인한 엔드포인트·필드 명세 기록
```

---

## 3. 데이터 흐름

### 3-1. 지도 탐색
1. 지도 이동/확대 → WebView가 `{bbox, zoom}` 메시지를 앱에 보냄
2. 앱: zoom 단계별로 `getMapClusters(bbox, level, filters)` 호출
   - 넓게 보기 → `region_stats`(구) / 중간 → `region_stats`(동) / 가까이 → `complexes` bbox 조회
3. 결과를 WebView에 돌려보내 마커 렌더 (가격 표시 토글은 WebView 내부 상태)
4. 단지 마커 탭 → `complex/[id]` / 빈 곳 탭 → 좌표 → (서버) 카카오 좌표→주소 → PNU → `building/[pnu]` (건축물대장 조회, 없으면 실시간 조회 후 캐시)

### 3-2. 당근마켓 공유 → 분석
```
공유 텍스트 수신
  └▶ packages/shared/share-parse : URL·텍스트 분리, 텍스트에서 주소/단지명/가격/면적/층 정규식 추출
       ├ 주소·단지명 찾음 ─────────────────────────────┐
       └ 못 찾음 → Edge `share-parse`                   │
            · 허용 도메인(daangn.com 등)만, 단건 GET    │
            · <head>의 og:title/og:description/og:image │
              만 읽음 (본문·이미지 저장 안 함)          │
            · 타임아웃 5초, 실패해도 빈 결과 반환        │
            ├ 주소 찾음 ───────────────────────────────┤
            └ 못 찾음 → "어느 건물인가요?" (카카오 키워드 검색 후보)
                                                         ▼
                 Edge `geo`: 주소/키워드 → 좌표·법정동코드·지번
                                                         ▼
                 DB 매칭: PNU 일치 → 반경 150m 안 단지명 유사도 → 후보 목록
                                                         ▼
                 complex/[id] 열기 + "내 매물함 저장" 시트(가격·면적·층 미리 채움)
                 + "최근 실거래 대비 +3.2%" (같은 전용면적 ±3㎡, 최근 6개월 중앙값 기준)
```

### 3-3. 배치 수집 → 매칭
```
RTMS 실거래(시군구×계약월) ─┐
K-apt 단지목록/기본/상세 ────┼─▶ staging 테이블(raw JSON 보관) ─▶ 매칭 ─▶ 정규 테이블
건축물대장 표제부/총괄표제부 ┘                                  └─ 실패 → match_failures
```
**매칭 순서 (점수제)**
1. **PNU(19자리 필지 고유번호) 일치**: 법정동코드10 + 산여부1 + 본번4 + 부번4. 실거래의 법정동·지번, K-apt의 지번주소, 건축물대장의 sigunguCd/bjdongCd/bun/ji 모두 PNU로 환산 가능 → 가장 강력
2. 도로명주소 정규화 일치 (공백·괄호·"번길" 표기 차이 제거)
3. 좌표 반경 200m 이내 + 단지명 유사도(정규화 후 편집거리, "아파트/APT/단지/차" 등 제거) ≥ 0.8
4. 그래도 애매하면 자동 연결하지 않고 `match_failures`에 후보와 점수를 남김 → 관리자가 `complex_aliases`로 수동 연결

> 한 단지가 여러 필지에 걸친 경우가 흔해서 `complex_parcels`(단지↔PNU 다대다) 테이블을 둡니다.

---

## 4. DB 스키마 (PostgreSQL + PostGIS 초안)

> 금액은 **만원 단위 정수**(공공데이터 원본 단위와 동일), 면적은 ㎡ `numeric(7,2)`, 좌표는 `geography(Point,4326)`.
> 모든 "사실" 테이블에 `source`, `as_of`(기준일), `fetched_at` 컬럼.

### 4-1. 지역·단지·건물
```sql
regions(code text pk,            -- 시군구 5자리 또는 법정동 10자리
        level text,              -- 'sigungu' | 'dong'
        name text, parent_code text, center geography(Point))

complexes(id uuid pk,
          kapt_code text unique,          -- K-apt 단지코드 (없을 수 있음: 소규모 단지)
          name text, name_norm text,      -- 검색·매칭용 정규화 이름
          sigungu_code text, bjdong_code text,
          road_address text, jibun_address text,
          location geography(Point),
          approved_date date,             -- 사용승인일 (연식)
          households int, dong_count int, top_floor int,
          builder text, heating text, hall_type text, mgmt_type text,
          far numeric, bcr numeric,       -- 용적률, 건폐율
          house_type text,                -- 'apt' | 'officetel' | 'rowhouse' ...
          updated_at timestamptz)
complex_parcels(complex_id, pnu text, primary key(complex_id, pnu))
complex_aliases(alias_norm text, complex_id, source text)   -- 실거래 단지명 → 단지 수동/자동 연결
complex_area_types(complex_id, exclusive_m2 numeric, supply_m2 numeric, households int)

buildings(pnu text, mgm_bldrgst_pk text pk,  -- 건축물대장 관리번호
          complex_id uuid null,
          name text, dong_name text, main_purpose text, structure text,
          approved_date date, ground_floors int, under_floors int,
          households int, far numeric, bcr numeric,
          is_violation boolean null,          -- 데이터 있을 때만
          raw jsonb, source text, as_of date)
```

### 4-2. 주차 (출처별로 따로 저장 → 화면에서 비교)
```sql
parking_facts(id, complex_id null, building_pk null,
              source text,                  -- 'kapt_detail' | 'bldrgst_title' | 'bldrgst_recap' | 'user'
              ground_total int, under_total int,          -- 지상 / 지하
              indoor_self int, indoor_mech int,           -- 옥내 자주식 / 기계식
              outdoor_self int, outdoor_mech int,         -- 옥외 자주식 / 기계식
              total int generated always as (...) stored,
              elevator_to_underground boolean null,
              as_of date, fetched_at timestamptz)
-- 뷰: complex_parking_summary
--   대표값 선택 규칙: K-apt 상세 > 건축물대장 총괄표제부 > 표제부 합계 (출처 차이 10%↑면 플래그)
--   per_household = round(total / households, 2), 동네 순위(rank() over bjdong)
ev_chargers(stat_id, chger_id, name, location geography, chger_type text, output_kw, as_of)
parking_reviews(id, complex_id, user_id, rush_hour_score smallint check 1..5, comment text, created_at)
```

### 4-3. 실거래·관리비·공시가
```sql
trades(id, complex_id null, source_key text unique,  -- 원본 행 해시(중복 방지)
       deal_type text,                 -- 'sale'
       house_type text, sigungu_code, bjdong_code, jibun text, raw_name text,
       exclusive_m2 numeric, floor int, price int,   -- 만원
       deal_date date, is_direct boolean, cancel_date date null,
       fetched_at timestamptz)
rents(... 같은 구조 + deposit int, monthly int, contract_type text, renew_used boolean ...)
-- 머티리얼라이즈드 뷰: complex_price_stats (평형별 최근가·최고가·전세가율·평당가)
-- 머티리얼라이즈드 뷰: region_stats (구/동 월 거래량·평균가 → 지도 클러스터·홈 요약)
maintenance_fees(complex_id, ym text, total_won bigint, per_m2_won int, source, as_of)
official_prices(complex_id, exclusive_m2, year int, price_won bigint, source)  -- 가능하면
```

### 4-4. 사용자·매물·커뮤니티
```sql
profiles(user_id pk → auth.users, nickname, created_at)
workplaces(id, user_id, name, location geography)          -- 직장 (현대차·HD현대중공업 등 프리셋 + 직접 등록)
favorites(user_id, complex_id, notify boolean, created_at)
recent_views(user_id, complex_id, viewed_at)
push_tokens(user_id, token, platform)

saved_listings(id, user_id, complex_id null, building_pnu null,
               source text,                   -- 'daangn' | 'manual'
               original_url text, title text,
               deal_type text, price int, deposit int, monthly int,
               exclusive_m2 numeric, floor int, memo text,
               parse_status text,             -- 'text' | 'og' | 'manual'
               created_at)
inspection_checklists(listing_id, item text, checked boolean, note text)  -- 채광·소음·주차·냄새…
inspection_photos(id, listing_id, storage_path text)                      -- Supabase Storage (비공개)

posts(id, complex_id, user_id, category text,  -- 'review' | 'pros_cons' | 'question'
      body text, body_masked text, resident_verified boolean, hidden boolean, created_at)
comments(id, post_id, user_id, body_masked, created_at)
reports(id, target_type, target_id, reporter_id, reason, created_at)
blocks(blocker_id, blocked_id)
banned_words(word text pk)

external_posts_cache(complex_id, provider text, title, summary text,  -- 짧은 요약만
                     url, published_at, is_ad_guess boolean, fetched_at)
```

### 4-5. 운영·설정
```sql
policy_values(key text, value jsonb, effective_from date, source_url text, note text)
  -- 취득세율, LTV/DSR, 재건축 연한 기준 등 → 하드코딩 금지, 앱은 여기서 읽고 "참고용" 표시
poi(id, kind text, name, location geography, extra jsonb, source, as_of)
  -- school_elem/mid/high, academy, mart, hospital, bank, park, bus_stop, station, industrial_complex
school_districts(school_id, geom geography(MultiPolygon), source, as_of)   -- 학구도(데이터 확보 시)
ingest_runs(id, job text, started_at, finished_at, rows_in int, rows_ok int, error text)
match_failures(id, source text, raw jsonb, candidates jsonb, reason text, resolved boolean, created_at)
```

**보안(RLS)**: 공공데이터 테이블은 누구나 읽기만, 쓰기는 서버 키만. 사용자 테이블은 본인 행만 읽기/쓰기. 게시글은 숨김 처리 안 된 것만 공개, 차단한 사용자 글은 뷰에서 제외.

---

## 5. 외부 API 목록 (확인 상태)

| # | 용도 | 제공 | 엔드포인트 | 상태 |
|---|---|---|---|---|
| 1 | 아파트 매매 실거래 상세 | 국토부 / data.go.kr | `apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev` (LAWD_CD 5자리, DEAL_YMD yyyymm) | 🔶 |
| 2 | 아파트 전월세 | 국토부 | `RTMSDataSvcAptRent/getRTMSDataSvcAptRent` (같은 파라미터 체계) | ❓ 4단계 전에 포털 상세에서 확인 |
| 3 | 연립다세대·오피스텔·단독 매매/전월세 | 국토부 | RTMS 계열 각 서비스 | ❓ |
| 4 | 공동주택 단지 목록 | 국토부 K-apt | 공동주택 단지 목록제공 서비스 (시군구/법정동별) | ❓ 오퍼레이션 이름·버전 확인 필요 |
| 5 | 공동주택 기본·상세정보 (주차대수 포함) | 국토부 K-apt | `1613000/AptBasisInfoServiceV4/getAphusDtlInfoV4` — **V5가 있다는 자료도 있음** | 🔶 버전·주차 필드명 확인 필요 |
| 6 | 건축물대장 (표제부·총괄표제부·층별) | 국토부 건축HUB (data.go.kr 15134735) | `1613000/BldRgstHubService/getBrTitleInfo`, `getBrRecapTitleInfo`, `getBrFlrOulnInfo` (sigunguCd, bjdongCd, platGbCd, bun, ji) | 🔶 옥내/옥외·자주/기계식 주차 필드명은 활용가이드 첨부에서 확인 |
| 7 | 관리비 | K-apt 관리비 공개 | ❓ |
| 8 | 공동주택 공시가격 | 국토부/부동산원 | ❓ (가능하면) |
| 9 | 지도·로드뷰 | 카카오 Maps JS SDK | `dapi.kakao.com/v2/maps/sdk.js?appkey=…&libraries=services,clusterer` | ✅ |
| 10 | 주소·키워드 검색, 좌표↔주소, 카테고리 검색 | 카카오 로컬 REST | `dapi.kakao.com/v2/local/search/address.json`, `search/keyword.json`, `search/category.json`, `geo/coord2address.json` | ✅ (서버에서만 호출) |
| 11 | 전기차 충전소 | 한국환경공단 (data.go.kr 15076352) | `apis.data.go.kr/B552584/EvCharger/getChargerInfo` (zcode=31 울산) | 🔶 **별도 활용신청 필요** |
| 12 | 학교 기본정보 | 교육부 NEIS 오픈API | `open.neis.go.kr/hub/schoolInfo` (울산교육청 코드) | ❓ |
| 13 | 학구도 | 학구도안내서비스 / 공공데이터 파일 | 파일 데이터일 가능성 높음 | ❓ |
| 14 | 버스정류장 | 국토부 TAGO / 울산 BIS | ❓ |
| 15 | 블로그·카페 검색 | 네이버 검색 API | `openapi.naver.com/v1/search/blog.json`, `cafearticle.json` | ✅ |
| 16 | 블로그·카페·웹문서 | 카카오(다음) 검색 | `dapi.kakao.com/v2/search/blog`, `cafe`, `web` | ✅ |
| 17 | 임장·리뷰 영상 | YouTube Data API v3 | `www.googleapis.com/youtube/v3/search` | ✅ |
| 18 | 길찾기 소요시간 (자동차) | 카카오모빌리티 길찾기 | `apis-navi.kakaomobility.com/v1/directions` | 🔶 (대중교통 시간은 만들지 않기로 결정) |
| 19 | 현대자동차 울산공장 통근버스 | 사용자 제공 엑셀(본공장 1·2조 출근 노선) | 공개 자료 없음 → 엑셀 파싱 + 정류장 이름을 카카오 키워드 검색으로 좌표화 | 🔶 정류장 좌표는 6단계에서 확인·수동 보정 |

**울산 시군구 코드(LAWD_CD)**: 중구 31110 · 남구 31140 · 동구 31170 · 북구 31200 · 울주군 31710 — 일반적으로 알려진 값이며, 2단계에서 **행정표준코드관리시스템(code.go.kr) 법정동코드 전체자료**를 내려받아 `packages/shared/codes/ulsan.ts`로 생성하면서 대조합니다.

> 🔶·❓ 항목은 4단계 시작 시 data.go.kr 상세 페이지의 「활용가이드(첨부)」와 **실제 호출 응답 샘플**로 필드명을 확정해 `docs/DATA_SOURCES.md`에 기록한 뒤에만 코드에 씁니다. (실제 응답을 보려면 키가 필요 → 그때 키 발급 안내)

---

## 6. 앱 ↔ 서버 API (Edge Functions + DB 조회)

| 이름 | 입력 | 출력 | 비고 |
|---|---|---|---|
| `getMapClusters` (DB RPC) | bbox, zoom, filters | 구/동 집계 또는 단지 목록 | PostGIS `ST_Intersects` |
| `searchAll` (DB RPC + geo) | 검색어 | 단지·주소·동 후보 | 단지는 `pg_trgm` 유사도, 주소는 카카오 |
| `getComplex(id)` | id | 요약·주차·가격 통계 | 하나의 RPC로 묶어 첫 화면 1회 호출 |
| `getTrades(id, area, period)` | | 거래 목록·차트 데이터 | |
| `getBuildingAt(lat,lng)` | 좌표 | 건축물대장 요약 | 미캐시면 실시간 조회 후 저장 |
| `share-parse` | 공유 텍스트 | {url, address?, name?, price?, area?, floor?, imageUrl?} | 허용 도메인·단건·OG만 |
| `geo` | 주소/키워드/좌표 | 좌표·법정동코드·지번·후보 | 카카오 키 보호 |
| `nearby(id)` | | 시설별 최단 거리·도보 시간 | 미리 계산해 캐시 |
| `commute(id, workplaceId)` | | 자동차/대중교통 분 | 결과 7일 캐시 |
| `community(id, provider, sort)` | | 제목·요약·날짜·링크 | 24시간 캐시, 본문 저장 금지 |
| `ev(id)` | | 반경 500m 충전기 수 | 주 1회 갱신 데이터 |
| `externalLinks(id)` | | 네이버부동산·호갱노노·직방·다방·당근 검색 링크 | **링크만**, 크롤링 없음 |

---

## 7. 목업 모드

- `apps/mobile/src/data/mock/` 에 **가상의 울산 단지 30~40개**(5개 구·군에 분포, 실제 지명은 쓰되 단지명·수치는 가상임을 표시) + 5년치 가상 실거래 + 주차·POI.
- 화면 상단에 작은 「목업 데이터」 배지 표시 → 실제 데이터와 헷갈리지 않게.
- 공유 분석도 목업에서 동작: 미리 준비한 당근 공유 텍스트 예시 3종(주소 있음 / 단지명만 / 링크만)으로 흐름 테스트 버튼 제공.
- 카카오맵 JS 키가 없으면 지도 자리에 "지도 키 없음 — 리스트로 보기" 안내 + 리스트 모드로 동작.

---

## 8. 단계별 계획 (요청하신 9단계 그대로)

| 단계 | 결과물 | 필요한 키 |
|---|---|---|
| 1 | 이 설계서 | 없음 |
| 2 | Expo 앱 뼈대, 탭, 목업 단지 지도·리스트·검색 | (선택) 카카오 JavaScript 키 |
| 3 | 단지 상세: 요약·주차·실거래 차트 (목업) | 없음 |
| 4 | Supabase 스키마, 수집기, 매칭, 앱 실데이터 연결 | data.go.kr 인증키, 카카오 REST 키, Supabase 프로젝트 |
| 5 | 공유 수신(Android 먼저) → 분석 → 매물함 | 개발용 APK(EAS 무료) |
| 6 | 로드뷰·주변시설·학교·직장 거리·충전기 | NEIS 키, 카카오모빌리티 |
| 7 | 외부 글 모아보기·외부 링크·자체 게시판·신고/차단/마스킹 | 네이버·YouTube 키 |
| 8 | 비교·계산기·푸시 알림·임장 체크리스트 | 없음 |
| 9 | 성능·오류·테스트·EAS 빌드·스토어 준비 | Google Play 개발자 계정($25) |

---

## 9. 알려진 한계·위험

1. **주차대수 정확도**: K-apt와 건축물대장은 기준(법정 대수 vs 실제 면 수), 갱신 시점이 다를 수 있음 → 둘 다 보여주고 차이 표시하는 설계로 대응. 지하주차장 엘리베이터 연결 여부는 공공데이터에 없을 가능성 높음 → 사용자 제보 항목으로.
2. **당근 공유 링크**: 공식 API 없음. OG 태그에 주소가 없거나, 로그인·봇 차단으로 읽히지 않을 수 있음 → 3단계 fallback으로 "어느 건물인가요?"가 항상 마지막 안전망. 사용자가 공유한 단건만, 저장은 사용자가 입력/확인한 값과 링크만.
3. **대중교통 소요시간**: 무료 공식 API가 마땅치 않을 수 있음 → 초기엔 자동차 시간만 + "카카오맵에서 대중교통 보기" 링크.
4. **학구도**: API가 아닌 파일 데이터일 가능성이 높아, 수동 적재가 필요할 수 있음.
5. **지도 마커 수**: 울산 아파트 단지는 수천 개 수준 → 서버 집계 + 화면 영역만 조회로 해결 가능한 규모.
6. **커뮤니티 운영 책임**: 자체 게시판은 신고 처리 담당자가 필요(앱 스토어 심사 요건이기도 함).

---

## 10. 확정된 결정 (2026-11-27)

1. **저장소**: 새 GitHub 저장소로 옮긴다 (사용자가 만든 뒤 이전). 그 전까지는 `natrang` 저장소의 `ulsan-home/` 폴더에서 작업.
2. **백엔드**: Supabase.
3. **테스트 기기**: 안드로이드 폰 있음 → 2~4단계 Expo Go, 5단계부터 개발용 APK.
4. **출퇴근**: 대중교통 소요시간은 만들지 않는다. 대신 **현대자동차 통근버스**:
   - 1순위: 노선을 지도에 선으로 표시 (정류장 순서대로 연결)
   - 최소: 단지에서 **가장 가까운 통근버스 정류장 + 도보 시간**
   - 데이터: 사용자가 준 엑셀(노선 66개 · 출발편 107개 · 정류장 이름 208곳, 지역 21곳). 정류장이 "○○아파트 정문", "○○약국" 같은 이름뿐이라 좌표 변환 후 사람이 확인하는 과정 필요.
   - ⚠️ 회사 내부 자료일 수 있어 **공개 저장소에는 올리지 않는다.** 비공개 저장소 또는 Supabase DB에만 저장.
   - DB: `commute_bus_routes(id, company, region, shift, depart_times jsonb)`, `commute_bus_stops(id, name, location geography, verified boolean)`, `commute_bus_route_stops(route_id, seq, stop_id)`
5. **앱 이름**: 「내가 만든 부동산 앱」 (slug `my-realestate-app`, Android 패키지 `com.myrealestate.ulsan` — 스토어에 처음 올리기 전까지 바꿀 수 있고, 올린 뒤에는 못 바꿈)

## 11. 2단계 구현 메모

- Expo SDK 58 / Expo Router (`apps/mobile/src/app`), npm workspaces 모노레포.
- 지도 마커 묶음: 카카오 레벨 8 이상 → 구·군, 6~7 → 동, 5 이하 → 단지 (화면 영역 안만). 카카오 `clusterer` 라이브러리는 쓰지 않고 서버(지금은 목업) 집계로 처리.
- 앱↔지도 메시지 규약: `src/map-web/kakao-map-html.ts` 맨 위 주석.
- `react-native-webview` 타입 선언이 최신 TypeScript와 안 맞아 `KakaoMap.tsx`에서 타입만 바로잡음.
