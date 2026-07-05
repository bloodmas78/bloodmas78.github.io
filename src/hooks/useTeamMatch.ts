// ──────────────────────────────────────────
// 팀 매칭 상태 관리 커스텀 훅
// ──────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { TeamEntry, MatchResult, WinRatePair } from '../types'
import { findBestMatch, computeWinRates } from '../utils'

const MAX_PARTICIPANTS = 9

export function useTeamMatch() {
  const [entries, setEntries] = useState<TeamEntry[]>([])
  const [result, setResult] = useState<MatchResult | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  const count = entries.length

  const toggleMember = useCallback((nickname: string) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.name === nickname)
      if (idx >= 0) {
        const copy = prev.slice()
        copy.splice(idx, 1)
        return copy
      }
      if (prev.length >= MAX_PARTICIPANTS) {
        alert('최대 인원입니다')
        return prev
      }
      return [...prev, { name: nickname, score: 25 }]
    })
  }, [])

  const setMemberScore = useCallback((nickname: string, newScore: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.name === nickname ? { ...e, score: newScore } : e)),
    )
  }, [])

  const removeEntry = useCallback((idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const resetEntries = useCallback(() => {
    setEntries([])
  }, [])

  const matchTeams = useCallback(() => {
    if (entries.length === 0) {
      alert('참석자를 추가하세요')
      return
    }
    setIsMatching(true)
    setTimeout(() => {
      const matched = findBestMatch(entries)
      setResult(matched)
      setIsMatching(false)
    }, 850)
  }, [entries])

  const winRates: WinRatePair | null = result
    ? computeWinRates(result.sumA, result.sumB)
    : null

  return {
    entries,
    count,
    result,
    isMatching,
    winRates,
    toggleMember,
    setMemberScore,
    removeEntry,
    resetEntries,
    matchTeams,
  }
}
