// ──────────────────────────────────────────
// Member & Stats type definitions
// Shared across pages, utils, hooks, and the scraper output
// ──────────────────────────────────────────

/** 개별 기간(월간/누적)의 전적 상세 */
export interface StatDetail {
  average: number
  highrun: number
  win: number
  draw: number
  loss: number
  winRate: number
  ranks: {
    average: number | null
    highrun: number | null
    winRate: number | null
  }
}

/** 9샷 멤버 한 명의 데이터 */
export interface Member {
  nickname: string
  avatarColor: string
  monthly: StatDetail | null
  allTime: StatDetail | null
  grade?: 'guest' | 'member' | 'admin' | null
}

/** 기록 보유가 확인된 멤버 (stats가 non-null) */
export interface MemberWithStats {
  member: Member
  stats: StatDetail
}

/** 정렬 기준 키 */
export type SortKey = 'average' | 'highrun' | 'winRate'

/** 기간 선택 */
export type Period = 'monthly' | 'allTime'

/** 팀 매칭용 엔트리 */
export interface TeamEntry {
  name: string
  score: number
  winRate?: number
}

/** 팀 매칭 결과 */
export interface MatchResult {
  a: TeamEntry[]
  b: TeamEntry[]
  sumA: number
  sumB: number
}

/** 승률 비율 */
export interface WinRatePair {
  a: number
  b: number
}

/** 정산 차수 입력 */
export interface RoundEntry {
  label: string
  place: string
  cost: string
  attendees: string[]
}

/** 정산 차수 요약 (계산 결과) */
export interface RoundSummary {
  key: string
  label: string
  place: string
  cost: number
  participants: number
  perPerson: number
  attendees: string[]
}

/** 멤버별 정산 합계 */
export interface MemberTotal {
  nickname: string
  total: number
  attendance: number
}
