// ──────────────────────────────────────────
// 팀 매칭 상태 관리 커스텀 훅
// ──────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { TeamEntry, MatchResult, WinRatePair } from '../types'
import { findBestMatch, computeWinRates } from '../utils'

const MAX_PARTICIPANTS = 8

export function useTeamMatch() {
  const [entries, setEntries] = useState<TeamEntry[]>([])
  const [result, setResult] = useState<MatchResult | null>(null)
  const [isMatching, setIsMatching] = useState(false)

  const count = entries.length

  const toggleMember = useCallback((nickname: string, winRate: number = 0) => {
    const idx = entries.findIndex((e) => e.name === nickname)
    if (idx >= 0) {
      setEntries((prev) => prev.filter((e) => e.name !== nickname))
      return
    }
    if (entries.length >= MAX_PARTICIPANTS) {
      alert(`오늘의 참전 용사는 최대 ${MAX_PARTICIPANTS}명까지만 선택 가능합니다!`)
      return
    }
    setEntries((prev) => [...prev, { name: nickname, score: 25, winRate }])
  }, [entries])

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

  const moveMember = useCallback((memberName: string, targetTeam: 'a' | 'b') => {
    setResult((prev) => {
      if (!prev) return prev;
      
      let a = [...prev.a];
      let b = [...prev.b];
      
      const memberInA = a.find(m => m.name === memberName);
      const memberInB = b.find(m => m.name === memberName);
      const member = memberInA || memberInB;
      
      if (!member) return prev;
      
      // Remove from both lists
      a = a.filter(m => m.name !== memberName);
      b = b.filter(m => m.name !== memberName);
      
      // Add to target team
      if (targetTeam === 'a') {
        a.push(member);
      } else {
        b.push(member);
      }
      
      const sumA = a.reduce((sum, m) => sum + m.score, 0);
      const sumB = b.reduce((sum, m) => sum + m.score, 0);
      
      return {
        a,
        b,
        sumA,
        sumB,
        diff: Math.abs(sumA - sumB)
      };
    });
  }, []);

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
    moveMember,
  }
}
