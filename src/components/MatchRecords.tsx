import { useState, useEffect } from 'react'
import { fetchMatches, updateMatchSetResult, completeMatch, deleteMatch, deleteCompletedMatch, revertMatchToOngoing, fetchMemberStats, type MatchRecord, type MemberStat } from '../utils/firebaseUtils'

export default function MatchRecords() {
  const [ongoingMatches, setOngoingMatches] = useState<MatchRecord[]>([])
  const [completedMatches, setCompletedMatches] = useState<MatchRecord[]>([])
  const [memberStats, setMemberStats] = useState<Record<string, MemberStat>>({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const ongoing = await fetchMatches('ongoing')
    const completed = await fetchMatches('completed')
    const statsArray = await fetchMemberStats()

    const statsMap: Record<string, MemberStat> = {}
    statsArray.forEach(stat => {
      statsMap[stat.nickname] = stat
    })

    setOngoingMatches(ongoing)
    setCompletedMatches(completed)
    setMemberStats(statsMap)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSetResult = async (match: MatchRecord, setIndex: number, winner: 'A' | 'B' | null) => {
    const newSetResults = [...(match.setResults || [null, null, null, null, null])]
    newSetResults[setIndex] = winner

    const success = await updateMatchSetResult(match.id!, newSetResults)
    if (success) {
      loadData()
    } else {
      alert('스코어 업데이트에 실패했습니다.')
    }
  }

  const handleCompleteMatch = async (match: MatchRecord) => {
    if (match.scoreA === match.scoreB) {
      alert('승부가 나지 않은 동점(무승부) 상태로는 전적을 등록할 수 없습니다.')
      return
    }
    const success = await completeMatch(match.id!, match.scoreA, match.scoreB, match.teamA, match.teamB)
    if (success) {
      alert('매치가 종료되어 개인 전적에 승패가 반영되었습니다!')
      loadData()
    } else {
      alert('매치 종료에 실패했습니다.')
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm('이 매치를 취소하고 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) return;

    const success = await deleteMatch(matchId)
    if (success) {
      alert('매치가 취소되었습니다.')
      loadData()
    } else {
      alert('매치 취소에 실패했습니다.')
    }
  }

  const handleDeleteCompletedMatch = async (match: MatchRecord) => {
    const password = window.prompt('관리자 비밀번호를 입력하세요:')
    if (password === null) return // 취소 버튼 클릭 시
    if (password !== (import.meta.env.VITE_ADMIN_PASSWORD || '1220')) {
      alert('비밀번호가 일치하지 않습니다. 삭제할 수 없습니다.')
      return
    }

    if (!window.confirm('정말 이 종료된 매치를 삭제하시겠습니까?\n해당 매치에 참여했던 멤버들의 전적(승/패)도 함께 복구(차감)됩니다.')) return;

    const success = await deleteCompletedMatch(match)
    if (success) {
      alert('종료된 매치가 성공적으로 삭제되었으며, 멤버들의 전적도 롤백되었습니다.')
      loadData()
    } else {
      alert('종료된 매치 삭제에 실패했습니다.')
    }
  }

  const handleEditCompletedMatch = async (match: MatchRecord) => {
    const password = window.prompt('관리자 비밀번호를 입력하세요:')
    if (password === null) return
    if (password !== (import.meta.env.VITE_ADMIN_PASSWORD || '1220')) {
      alert('비밀번호가 일치하지 않습니다. 수정할 수 없습니다.')
      return
    }

    if (!window.confirm('이 매치를 진행 중 상태로 되돌리시겠습니까?\n해당 매치로 누적되었던 전적은 롤백되며, 스코어 수정 후 다시 종료해야 합니다.')) return;

    const success = await revertMatchToOngoing(match)
    if (success) {
      alert('매치가 진행 중 상태로 성공적으로 복구되었습니다.')
      loadData()
    } else {
      alert('매치 복구에 실패했습니다.')
    }
  }

  const formatMember = (name: string) => {
    if (name === '컴퓨터') return name
    const stat = memberStats[name]
    if (stat) {
      return `${name} (${stat.wins}승 ${stat.losses}패)`
    }
    return `${name} (0승 0패)`
  }

  if (loading) {
    return <div className="protoss-empty-state">매치 기록을 불러오는 중...</div>
  }

  return (
    <div className="match-records-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', color: '#fff' }}>
      <section>
        <h2 style={{ color: '#00ffff', borderBottom: '1px solid rgba(0, 255, 255, 0.2)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span>🔥 진행 중 매치</span>
          <button onClick={loadData} className="protoss-btn protoss-btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>🔄 새로고침</button>
        </h2>
        {ongoingMatches.length === 0 ? (
          <div className="protoss-empty-state" style={{ padding: '32px' }}>지금은 평화롭네요. 다들 큐대 안 잡고 뭐하시나? 🤔</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ongoingMatches.map(match => (
              <div key={match.id} className="match-card-ongoing">
                <div className="match-record-header" style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>{new Date(match.createdAt).toLocaleDateString()}</span>
                  <div className="match-record-actions">
                    <button onClick={() => handleDeleteMatch(match.id!)} className="score-btn loss" style={{ flex: 'none', padding: '6px 16px', fontSize: '0.9rem' }}>
                      빤스런 (매치 취소)
                    </button>
                    <button onClick={() => handleCompleteMatch(match)} className="score-btn win team-a" style={{ flex: 'none', padding: '6px 16px', fontSize: '0.9rem' }}>
                      🛑 GG 치고 전적 확정
                    </button>
                  </div>
                </div>

                <div className="match-record-grid">
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h3 style={{ color: '#60a5fa', margin: '0 0 12px 0' }}>A팀</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', marginBottom: '16px' }}>{match.scoreA}</div>

                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {match.teamA.map(member => (
                        <div key={member}>{formatMember(member)}</div>
                      ))}
                    </div>
                  </div>

                  <div className="match-vs-divider">
                    <span className="match-vs-text">VS</span>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <h3 style={{ color: '#34d399', margin: '0 0 12px 0' }}>B팀</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', marginBottom: '16px' }}>{match.scoreB}</div>

                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {match.teamB.map(member => (
                        <div key={member}>{formatMember(member)}</div>
                      ))}
                    </div>
                  </div>

                  {/* 5-Set Toggle UI */}
                  <div className="set-toggles-container" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                    <h4 style={{ color: '#a6cbd8', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>BO5 세트 스코어 기록</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
                      {[0, 1, 2, 3, 4].map(idx => {
                        const result = (match.setResults || [null, null, null, null, null])[idx]
                        return (
                          <div key={idx} className="set-toggle-row">
                            <span className="set-label">SET {idx + 1}</span>
                            <div className="set-toggle-group">
                              <button 
                                className={`set-toggle-btn ${result === 'A' ? 'active-a' : ''}`}
                                onClick={() => handleSetResult(match, idx, 'A')}
                              >
                                A 승
                              </button>
                              <button 
                                className={`set-toggle-btn ${result === null ? 'active-none' : ''}`}
                                onClick={() => handleSetResult(match, idx, null)}
                              >
                                -
                              </button>
                              <button 
                                className={`set-toggle-btn ${result === 'B' ? 'active-b' : ''}`}
                                onClick={() => handleSetResult(match, idx, 'B')}
                              >
                                B 승
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ color: '#a6cbd8', borderBottom: '1px solid rgba(166, 203, 216, 0.2)', paddingBottom: '8px', marginBottom: '16px' }}>
          ✅ 종료된 매치
        </h2>
        {completedMatches.length === 0 ? (
          <div className="protoss-empty-state" style={{ padding: '32px' }}>아직 끝난 매치가 없어요. 언능 한 겜 치시죠!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {completedMatches.map(match => (
              <div key={match.id} className="match-card-completed">
                <div className="match-record-header" style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{new Date(match.createdAt).toLocaleDateString()}</span>
                  <div className="match-record-actions">
                    <button
                      onClick={() => handleEditCompletedMatch(match)}
                      style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      ✏️ 조작(?)하기
                    </button>
                    <button
                      onClick={() => handleDeleteCompletedMatch(match)}
                      style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      🗑️ 역사에서 지우기
                    </button>
                  </div>
                </div>
                <div className="match-record-flex">
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '8px' }}>A팀</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>{match.scoreA}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {match.teamA.map(member => (
                        <div key={member}>{formatMember(member)}</div>
                      ))}
                    </div>
                  </div>
                  <div className="match-vs-divider">
                    <span className="match-vs-text">VS</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ color: '#34d399', fontWeight: 'bold', marginBottom: '8px' }}>B팀</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>{match.scoreB}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {match.teamB.map(member => (
                        <div key={member}>{formatMember(member)}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '16px' }}>
        <h2 style={{ color: '#ffea00', borderBottom: '1px solid rgba(255, 234, 0, 0.2)', paddingBottom: '8px', marginBottom: '16px' }}>
          🏆 명예의 전당 (최다승 랭킹)
        </h2>
        {Object.keys(memberStats).length === 0 ? (
          <div className="protoss-empty-state">아직 등록된 전적이 없습니다. 첫 게임을 시작하세요!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.values(memberStats)
              .filter(m => m.nickname !== '컴퓨터')
              .sort((a, b) => {
                const totalA = a.wins + a.losses
                const winRateA = totalA > 0 ? a.wins / totalA : 0
                const totalB = b.wins + b.losses
                const winRateB = totalB > 0 ? b.wins / totalB : 0
                
                if (winRateB !== winRateA) {
                  return winRateB - winRateA
                }
                // 승률이 같으면 다승 순으로 정렬
                return b.wins - a.wins
              })
              .map((member, idx) => {
                const totalGames = member.wins + member.losses
                const winRate = totalGames > 0 ? Math.round((member.wins / totalGames) * 100) : 0
                return (
                  <div key={member.nickname} style={{ 
                    display: 'flex', alignItems: 'center', background: 'rgba(4, 10, 30, 0.6)', 
                    padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255, 215, 0, 0.15)',
                    boxShadow: 'inset 0 0 10px rgba(255, 215, 0, 0.05)'
                  }}>
                    <div style={{ 
                      width: '44px', fontSize: '1.4rem', fontWeight: '900', fontStyle: 'italic',
                      color: idx === 0 ? '#ffea00' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#b45309' : '#64748b',
                      textShadow: idx === 0 ? '0 0 10px rgba(255,234,0,0.5)' : 'none'
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#e5efff' }}>
                        {member.nickname}
                      </span>
                      {idx === 0 && <span style={{ fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(255,215,0,0.2)', color: '#ffea00', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.4)' }}>👑 1위</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', color: '#34d399', fontWeight: 'bold' }}>{member.wins}승 <span style={{ color: '#ef4444' }}>{member.losses}패</span></div>
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>승률 {winRate}% ({totalGames}전)</div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </section>
    </div>
  )
}
