// ──────────────────────────────────────────
// 정산 상태 관리 커스텀 훅
// ──────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react'
import { memberData } from '../data'
import type { RoundEntry, RoundSummary, MemberTotal } from '../types'

const INITIAL_ROUNDS: RoundEntry[] = [
  { label: '1차', place: '', cost: '', attendees: [] },
]

export function useSettlement() {
  const [rounds, setRounds] = useState<RoundEntry[]>(INITIAL_ROUNDS)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [accountInfo, setAccountInfoState] = useState(() => {
    try {
      return localStorage.getItem('9shot_account') || ''
    } catch {
      return ''
    }
  })

  const setAccountInfo = useCallback((val: string) => {
    setAccountInfoState(val)
    try {
      localStorage.setItem('9shot_account', val)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const updateRound = useCallback(
    (index: number, field: keyof RoundEntry, value: string) => {
      setRounds((current) =>
        current.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
      )
    },
    [],
  )

  const updateCost = useCallback(
    (index: number, value: string) => {
      const filtered = value.replace(/[^0-9]/g, '')
      updateRound(index, 'cost', filtered)
    },
    [updateRound],
  )

  const toggleAttendee = useCallback((index: number, nickname: string) => {
    setRounds((current) =>
      current.map((r, i) => {
        if (i !== index) return r
        const attendees = r.attendees.includes(nickname)
          ? r.attendees.filter((name) => name !== nickname)
          : [...r.attendees, nickname]
        return { ...r, attendees }
      }),
    )
  }, [])

  const addRound = useCallback(() => {
    setRounds((current) => [
      ...current,
      { label: `${current.length + 1}차`, place: '', cost: '', attendees: [] },
    ])
  }, [])

  const deleteRound = useCallback((index: number) => {
    setRounds((current) => {
      const next = current
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, label: `${i + 1}차` }))
      if (next.length === 0)
        return [{ label: '1차', place: '', cost: '', attendees: [] }]
      return next
    })
  }, [])

  const confirmDeleteRound = useCallback(
    (index: number) => {
      const targetLabel = rounds[index]?.label || '해당 차수'
      if (window.confirm(`${targetLabel}를 삭제하시겠습니까?`)) {
        deleteRound(index)
      }
    },
    [rounds, deleteRound],
  )

  const roundSummaries: RoundSummary[] = useMemo(
    () =>
      rounds.map((round, idx) => {
        const cost = Number(round.cost) || 0
        const participants = round.attendees.length
        const perPerson = participants
          ? Math.ceil(cost / participants / 100) * 100
          : 0
        return {
          key: `round-${idx}`,
          label: round.label,
          place: round.place,
          cost,
          participants,
          perPerson,
          attendees: round.attendees,
        }
      }),
    [rounds],
  )

  const totalCost = useMemo(
    () => roundSummaries.reduce((sum, r) => sum + r.cost, 0),
    [roundSummaries],
  )

  const memberTotals: MemberTotal[] = useMemo(
    () =>
      memberData.map((member) => {
        const total = roundSummaries.reduce((sum, round) => {
          if (
            !round.attendees.includes(member.nickname) ||
            round.participants === 0
          )
            return sum
          return sum + round.perPerson
        }, 0)
        const attendance = roundSummaries.reduce(
          (c, round) =>
            round.attendees.includes(member.nickname) ? c + 1 : c,
          0,
        )
        return { nickname: member.nickname, total, attendance }
      }),
    [roundSummaries],
  )

  const sortedMembers: MemberTotal[] = useMemo(
    () =>
      [...memberTotals].sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        if (b.attendance !== a.attendance) return b.attendance - a.attendance
        return a.nickname.localeCompare(b.nickname, 'ko')
      }),
    [memberTotals],
  )

  const toggleHighlight = useCallback((nickname: string) => {
    setHighlighted((cur) => (cur === nickname ? null : nickname))
  }, [])

  const handleCopy = useCallback(() => {
    const activeRounds = rounds.filter((r) => (Number(r.cost) || 0) > 0)
    if (activeRounds.length === 0) {
      alert('정산할 내역(비용이 입력된 차수)이 없습니다.')
      return
    }

    const lines = [
      '💬 [9샷 모임 정산 요약]',
      `총 정산 금액: ${totalCost.toLocaleString()}원`,
      '',
      '■ 차수별 내역:',
    ]

    roundSummaries.forEach((r) => {
      if (r.cost > 0) {
        lines.push(
          `- ${r.label} ${r.place || '-'}: ${r.cost.toLocaleString()}원 (참석: ${r.attendees.length ? r.attendees.join(', ') : '없음'}) → 1인당 ${r.perPerson.toLocaleString()}원`,
        )
      }
    })

    lines.push('', '■ 멤버별 정산 금액:')
    sortedMembers.forEach((m) => {
      if (m.total > 0) {
        lines.push(
          `- ${m.nickname}: ${m.total.toLocaleString()}원 (참석: ${m.attendance}회)`,
        )
      }
    })

    if (accountInfo.trim()) {
      lines.push('', `💰 송금 계좌: ${accountInfo.trim()}`)
    }

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => {
        alert(
          '정산 내역이 클립보드에 복사되었습니다! 카카오톡에 붙여넣기 하세요.',
        )
      })
      .catch((err) => {
        console.error('Copy failed', err)
        alert('복사에 실패했습니다. 직접 복사해 주세요.')
      })
  }, [rounds, totalCost, roundSummaries, sortedMembers, accountInfo])

  return {
    rounds,
    highlighted,
    accountInfo,
    roundSummaries,
    totalCost,
    sortedMembers,
    setAccountInfo,
    updateRound,
    updateCost,
    toggleAttendee,
    addRound,
    confirmDeleteRound,
    toggleHighlight,
    handleCopy,
  }
}
