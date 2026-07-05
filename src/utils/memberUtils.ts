// ──────────────────────────────────────────
// 멤버 데이터 조회 · 정렬 · 필터 유틸리티
// ──────────────────────────────────────────

import { memberData } from '../data'
import type { Member, MemberWithStats, SortKey, Period, StatDetail } from '../types'

/** 해당 기간의 통계를 반환 */
export function getStats(member: Member, period: Period = 'monthly'): StatDetail | null {
  return period === 'monthly' ? member.monthly : member.allTime
}

/** 닉네임으로 멤버 단건 조회 */
export function getMemberByNickname(nickname: string): Member | undefined {
  return memberData.find((m) => m.nickname === nickname)
}

/** 닉네임 목록만 추출 */
export function getMemberNicknames(): string[] {
  return memberData.map((m) => m.nickname)
}

/** 기록 보유 멤버만 필터링 */
export function getMembersWithStats(period: Period = 'monthly'): MemberWithStats[] {
  return memberData
    .map((member) => ({ member, stats: getStats(member, period) }))
    .filter((item): item is MemberWithStats => item.stats !== null)
}

/** 멤버 목록을 정렬 기준에 따라 정렬 (기록 없는 멤버는 맨 뒤) */
export function sortMembers(
  members: Member[],
  sortKey: SortKey = 'average',
  period: Period = 'monthly',
): Member[] {
  return [...members].sort((a, b) => {
    const aStats = getStats(a, period)
    const bStats = getStats(b, period)

    if (!aStats && !bStats) return 0
    if (!aStats) return 1
    if (!bStats) return -1

    return bStats[sortKey] - aStats[sortKey]
  })
}

/** 특정 기준의 1위 멤버 반환 */
export function getTopMember(
  sortKey: SortKey,
  period: Period = 'monthly',
): MemberWithStats | null {
  const withStats = getMembersWithStats(period)
  if (withStats.length === 0) return null
  return withStats.reduce((best, current) =>
    current.stats[sortKey] > best.stats[sortKey] ? current : best,
  )
}

/** 총 경기 수 합산 */
export function getTotalGames(period: Period = 'monthly'): number {
  return memberData.reduce((acc, cur) => {
    const stats = getStats(cur, period)
    if (!stats) return acc
    return acc + stats.win + stats.draw + stats.loss
  }, 0)
}

/** 기록 보유 멤버 수 */
export function getStatsCount(period: Period = 'monthly'): number {
  return memberData.filter((m) => getStats(m, period) !== null).length
}
