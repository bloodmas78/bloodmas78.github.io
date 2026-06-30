import { useState } from 'react'
import { memberData } from '../data'
import '../App.css'

type RoundEntry = {
  label: string
  place: string
  cost: string
  attendees: string[]
}

const initialRounds: RoundEntry[] = [
  { label: '1차', place: '', cost: '', attendees: [] },
]

function Settlement() {
  const [rounds, setRounds] = useState<RoundEntry[]>(initialRounds)
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const updateRound = (index: number, field: keyof RoundEntry, value: string) => {
    setRounds((current) => current.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const updateCost = (index: number, value: string) => {
    const filtered = value.replace(/[^0-9]/g, '')
    updateRound(index, 'cost', filtered)
  }

  const toggleAttendee = (index: number, nickname: string) => {
    setRounds((current) =>
      current.map((r, i) => {
        if (i !== index) return r
        const attendees = r.attendees
        const selected = attendees.includes(nickname) ? attendees.filter((name) => name !== nickname) : [...attendees, nickname]
        return { ...r, attendees: selected }
      }),
    )
  }

  const addRound = () => {
    setRounds((current) => [...current, { label: `${current.length + 1}차`, place: '', cost: '', attendees: [] }])
  }

  const deleteRound = (index: number) => {
    setRounds((current) => {
      const next = current.filter((_, i) => i !== index).map((r, i) => ({ ...r, label: `${i + 1}차` }))
      if (next.length === 0) return [{ label: '1차', place: '', cost: '', attendees: [] }]
      return next
    })
  }

  const confirmDeleteRound = (index: number) => {
    const targetLabel = rounds[index]?.label || '해당 차수'
    if (typeof window !== 'undefined' && window.confirm(`${targetLabel}를 삭제하시겠습니까?`)) {
      deleteRound(index)
    }
  }

  const roundSummaries = rounds.map((round, idx) => {
    const cost = Number(round.cost) || 0
    const participants = round.attendees.length
    const perPersonRounded = participants ? Math.ceil((cost / participants) / 100) * 100 : 0
    return {
      key: `round-${idx}`,
      label: round.label,
      place: round.place,
      cost,
      participants,
      perPerson: perPersonRounded,
      attendees: round.attendees,
    }
  })

  const totalCost = roundSummaries.reduce((sum, round) => sum + round.cost, 0)

  const memberTotals = memberData.map((member) => {
    const total = roundSummaries.reduce((sum, round) => {
      if (!round.attendees.includes(member.nickname) || round.participants === 0) {
        return sum
      }
      return sum + round.perPerson
    }, 0)

    const attendance = roundSummaries.reduce((c, round) => (round.attendees.includes(member.nickname) ? c + 1 : c), 0)

    return {
      nickname: member.nickname,
      total,
      attendance,
    }
  })

  const sortedMembers = [...memberTotals].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.attendance !== a.attendance) return b.attendance - a.attendance
    return a.nickname.localeCompare(b.nickname, 'ko')
  })

  const toggleHighlight = (nickname: string) => {
    setHighlighted((cur) => (cur === nickname ? null : nickname))
  }

  return (
    <div className="settlement-page">
      <section className="settlement-hero settlement-top-card">
        <h1>모임비 정산</h1>
        <p>
          장소와 비용을 입력하고 참석 멤버를 선택하면 전체 합계와
          멤버별 정산 금액을 자동 계산합니다.
        </p>
      </section>

      <main className="settlement-container">
        <div className="settlement-grid">
          <section className="summary-bottom">
            <div className="summary-card summary-horizontal">
              <div className="summary-left">
                <div className="kakao-badge" aria-hidden="true">
                  = 정산 =
                </div>
                <div className="summary-row total-sum">
                  <strong className="total-amount">{totalCost.toLocaleString()}원</strong>
                </div>
                <div className="places-list">
                  {rounds.map((r, i) => {
                    const cost = Number(r.cost) || 0
                    return (
                      <div key={`place-${i}`} className="place-item">
                        <strong className="place-name">{`${r.label} ${r.place ? r.place : '-'}`} 
                          &nbsp; &nbsp; &nbsp;
                          {cost > 0 ? `${cost.toLocaleString()}원` : '비용 -'}</strong>
                          <span>
                            {r.attendees.length ? ` ${r.attendees.join(', ')}` : '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="summary-right">
                <h3>멤버별 정산</h3>
                <div className="balance-list">
                  {sortedMembers.map((member) => (
                    <div
                      key={member.nickname}
                      className={`balance-item ${highlighted === member.nickname ? 'highlighted' : ''}`}
                      onClick={() => toggleHighlight(member.nickname)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleHighlight(member.nickname)}
                    >
                      <span>{member.nickname}</span>
                      <strong>{member.total > 0 ? `${member.total.toLocaleString()}원` : '0원'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="add-round-row">
            <button type="button" className="add-round-btn" onClick={addRound}>
              <span className="add-round-icon">＋</span>
              <span>차수 추가</span>
            </button>
          </div>
          {rounds.map((round, idx) => {
            const summary = roundSummaries[idx]
            return (
              <section key={summary.key} className="round-card">
                <div className="round-card-header">
                  <h2>{round.label}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="round-meta">
                      비용 {summary.cost ? `${summary.cost.toLocaleString()}원` : '0원'} · 참석 {summary.participants}명 · 1인 {summary.participants ? `${summary.perPerson.toLocaleString()}원` : '0원'}
                    </span>
                    {idx > 0 && (
                      <button type="button" className="home-btn small" onClick={() => confirmDeleteRound(idx)}>
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                <div className="field-group">
                  <label>
                    장소
                    <input
                      type="text"
                      value={round.place}
                      onChange={(event) => updateRound(idx, 'place', event.target.value)}
                      placeholder="예: 감자탕집"
                    />
                  </label>
                </div>

                <div className="field-group">
                  <label>
                    비용
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={round.cost}
                      onChange={(event) => updateCost(idx, event.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>

                <div className="field-group">
                  <span className="field-label">참석 멤버</span>
                  <div className="attendance-grid">
                    {memberData.map((member) => (
                      <button
                        key={member.nickname}
                        type="button"
                        className={`attendance-chip ${round.attendees.includes(member.nickname) ? 'selected' : ''}`}
                        onClick={() => toggleAttendee(idx, member.nickname)}
                      >
                        {member.nickname}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default Settlement
