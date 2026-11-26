// types.ts: 데이터의 "모양"을 정해 두는 파일.
// 예) 일정 하나에는 반드시 시작 시간(start)과 활동 이름(title)이 있어야 한다 — 이런 규칙을 적어 두면
//     실수로 빠뜨렸을 때 TypeScript가 미리 알려 줘요.

/** 앱에서 쓰는 시간대 두 가지 */
export type TimeZone = 'Asia/Seoul' | 'Asia/Ho_Chi_Minh'

/** 'TODO' = 아직 확인 안 된 값 (추측해서 채우지 않음) */
export type Todo = 'TODO'

/** 일정 종류 → 아이콘·색상을 정할 때 사용 */
export type ItemKind =
  | 'move' // 이동
  | 'flight' // 비행
  | 'airport' // 공항 수속
  | 'meal' // 식사
  | 'cafe' // 카페
  | 'shopping' // 쇼핑
  | 'massage' // 마사지
  | 'sightseeing' // 구경
  | 'checkin' // 체크인/체크아웃
  | 'free' // 자유시간
  | 'rest' // 휴식
  | 'prep' // 준비·정리
  | 'end' // 여행 종료
  | 'expense' // 지출만 기록 (시간을 차지하지 않는 표시)

export interface Cost {
  amount: number
  currency: 'KRW' | 'VND'
}

/**
 * 장소 참조. 보통은 places.json의 id (예: "alma").
 * "choice:d4-massage"처럼 쓰면 "사용자가 고른 장소"를 뜻해요 (4일차 마사지).
 */
export type PlaceRef = string

export interface ScheduleItem {
  id: string
  /** 시작 시각 "HH:MM" (tz 기준) */
  start: string
  /** 종료 시각 "HH:MM". 없으면 다음 일정 시작까지 이어짐 */
  end?: string
  /** 시작 시각의 시간대 */
  tz: TimeZone
  /** 종료 시각의 시간대 (비행처럼 시작과 다를 때만) */
  endTz?: TimeZone
  /** 종료가 다음 날이면 1 (예: 23:30 → 00:05) */
  endDayOffset?: number
  title: string
  /** 엑셀에 적힌 장소 글자 그대로 */
  placeLabel: string
  /** 머무는 장소 */
  place?: PlaceRef
  /** 이동 항목: 출발지/도착지 */
  from?: PlaceRef
  to?: PlaceRef
  /** 바꿔 갈 수 있는 후보 장소 (첫 번째가 기본) */
  placeOptions?: string[]
  cost?: Cost
  note?: string
  kind: ItemKind
  /** 해도 되고 안 해도 되는 일정 */
  optional?: boolean
  /** 현지에서 내가 직접 추가한 항목 */
  custom?: boolean
}

/** 내가 직접 추가한 일정/지출 (몇 일차에 넣을지 포함) */
export interface CustomItem extends ScheduleItem {
  day: number
  custom: true
}

export interface ScheduleDay {
  day: number
  /** 그날의 날짜 "YYYY-MM-DD" */
  date: string
  weekday: string
  items: ScheduleItem[]
}

export interface Choice {
  label: string
  options: string[]
  default: string
}

export interface FlightEnd {
  airport: string
  code: string
  terminal: string
  date: string
  time: string
  tz: TimeZone
}

/** 항공편 (이름·예약번호 같은 개인정보는 넣지 않음) */
export interface Flight {
  id: string
  label: string
  flightNo: string
  airline: string
  depart: FlightEnd
  arrive: FlightEnd
  /** 이 비행에 해당하는 일정 id */
  scheduleItemId: string
  /** 공항에 도착하는 일정 id (권장 도착 시간과 비교용) */
  airportArrivalItemId: string
  /** 날짜 착각 주의 문구 */
  dateWarning?: string
}

export interface FlightInfo {
  /** 출발 몇 시간 전 공항 도착 권장 */
  arriveHoursBefore: number
  baggage: { label: string; text: string }[]
  source: string
  flights: Flight[]
}

export interface Schedule {
  tripName: string
  flightInfo: FlightInfo
  /** 1원 = 몇 동 */
  vndPerKrw: number
  choices: Record<string, Choice>
  days: ScheduleDay[]
}

export interface Place {
  id: string
  name: string
  /** 현지(베트남어/영어) 표기 — 기사님께 보여주기용 */
  nameVi: string | Todo
  address: string | Todo
  lat: number | Todo
  lng: number | Todo
  googleMapsUrl: string | Todo
  phone: string | Todo
  /** 좌표가 없을 때 구글 지도에서 검색할 이름 */
  searchQuery?: string
  /** 넓은 지역이면 대표 지점 후보 목록 */
  areaSpots?: string[]
  /** schedule: 일정에 쓰는 곳 / alternative: 추천·대안 / area: 넓은 지역 */
  category: 'schedule' | 'alternative' | 'area' | 'home'
  memo?: string
}
