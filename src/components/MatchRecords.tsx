import { useState, useEffect } from 'react'
import { memberData } from '../data'
import { guestMembers } from '../data/guestMembers'
import { fetchMatches, updateMatchSetResult, completeMatch, deleteMatch, deleteCompletedMatch, revertMatchToOngoing, fetchMemberStats, type MatchRecord, type MemberStat } from '../utils/firebaseUtils'

export default function MatchRecords() {
  const [ongoingMatches, setOngoingMatches] = useState<MatchRecord[]>([])
  const [completedMatches, setCompletedMatches] = useState<MatchRecord[]>([])
  const [memberStats, setMemberStats] = useState<Record<string, MemberStat>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCompletedMatchId, setSelectedCompletedMatchId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const memberLookup = new Map(
    [...memberData, ...guestMembers.filter((guest) => !memberData.some((member) => member.nickname === guest.nickname))]
      .map((member) => [member.nickname, member]),
  )

  const totalPages = Math.ceil(completedMatches.length / itemsPerPage)
  const paginatedCompletedMatches = completedMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return <div className="cc-empty">매치 기록을 불러오는 중...</div>
  }

  return (
    <div className="cc-records-layout">
      <div className="cc-records-left">
      {/* ═══ 진행 중 매치 ═══ */}
      <section>
        <div className="cc-section-title">
          <span style={{ color: '#f97316' }}>🔥</span>
          <span>진행 중 매치</span>
          <button onClick={loadData} className="cc-refresh-btn" style={{ marginLeft: 'auto' }}>🔄 새로고침</button>
        </div>

        {ongoingMatches.length === 0 ? (
          <div className="cc-empty">지금은 평화롭네요. 다들 마우스 안 잡고 뭐하시나? 🤔</div>
        ) : (
          <div className="cc-matches-grid">
            {ongoingMatches.map(match => (
              <div key={match.id} className="cc-glass cc-match-active">
                <div className="cc-match-header">
                  <span className="cc-match-date">{new Date(match.createdAt).toLocaleDateString()}</span>
                  <div className="cc-match-actions">
                    <button
                      onClick={() => handleDeleteMatch(match.id!)}
                      className="cc-match-action-btn cc-btn-danger"
                    >
                      빤스런 (매치 취소)
                    </button>
                    <button
                      onClick={() => handleCompleteMatch(match)}
                      className="cc-match-action-btn cc-btn-cyan"
                    >
                      GG 치고 전적 확정
                    </button>
                  </div>
                </div>

                <div className="cc-teams-vs">
                  <div className="cc-team-block">
                    <h4 className="cc-team-label team-a">A팀</h4>
                    <div className="cc-team-score">{match.scoreA}</div>
                    <div className="cc-team-members">
                      {match.teamA.map(memberName => {
                        const member = memberLookup.get(memberName)
                        const stat = memberStats[memberName]
                        return (
                          <div key={memberName} className="cc-team-member" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: 600 }}>{memberName}</span>
                              {member?.grade === 'guest' && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    color: '#fef3c7',
                                    background: 'rgba(251, 191, 36, 0.2)',
                                    border: '1px solid rgba(251, 191, 36, 0.35)',
                                    letterSpacing: '0.02em',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  guest
                                </span>
                              )}
                            </div>
                            {memberName !== '연결' && (
                              <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
                                ({stat?.wins || 0}승 {stat?.losses || 0}패)
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="cc-vs-circle">VS</div>

                  <div className="cc-team-block">
                    <h4 className="cc-team-label team-b">B팀</h4>
                    <div className="cc-team-score">{match.scoreB}</div>
                    <div className="cc-team-members">
                      {match.teamB.map(memberName => {
                        const member = memberLookup.get(memberName)
                        const stat = memberStats[memberName]
                        return (
                          <div key={memberName} className="cc-team-member" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: 600 }}>{memberName}</span>
                              {member?.grade === 'guest' && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    color: '#fef3c7',
                                    background: 'rgba(251, 191, 36, 0.2)',
                                    border: '1px solid rgba(251, 191, 36, 0.35)',
                                    letterSpacing: '0.02em',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  guest
                                </span>
                              )}
                            </div>
                            {memberName !== '연결' && (
                              <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
                                ({stat?.wins || 0}승 {stat?.losses || 0}패)
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* BO5 Set Scores */}
                <div className="cc-bo5">
                  <p className="cc-bo5-title">BO5 세트 스코어 기록</p>
                  {[0, 1, 2, 3, 4].map(idx => {
                    const setResult = (match.setResults || [null, null, null, null, null])[idx]
                    return (
                      <div key={idx} className="cc-bo5-row">
                        <span className="cc-bo5-label">SET {idx + 1}</span>
                        <div className="cc-bo5-btns">
                          <button
                            className={`cc-bo5-btn ${setResult === 'A' ? 'active-a' : ''}`}
                            onClick={() => handleSetResult(match, idx, 'A')}
                          >
                            A 승
                          </button>
                          <button
                            className={`cc-bo5-btn ${setResult === null ? 'active-none' : ''}`}
                            onClick={() => handleSetResult(match, idx, null)}
                          >
                            -
                          </button>
                          <button
                            className={`cc-bo5-btn ${setResult === 'B' ? 'active-b' : ''}`}
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
            ))}
          </div>
        )}
      </section>

      {/* ═══ 종료된 매치 ═══ */}
      <section>
        <div className="cc-section-title">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4ade80' }}>check_circle</span>
          <span>종료된 매치</span>
        </div>

        {completedMatches.length === 0 ? (
          <div className="cc-empty">아직 끝난 매치가 없어요. 언능 한 겜 GOGO!</div>
        ) : (
          <>
            <div className="cc-matches-grid">
              {paginatedCompletedMatches.map(match => (
              <div
                key={match.id}
                className="cc-glass cc-match-completed"
                onClick={() => setSelectedCompletedMatchId(prev => prev === match.id ? null : match.id!)}
                style={{ cursor: 'pointer' }}
              >
                <div className="cc-match-header" style={{ marginBottom: '8px' }}>
                  <span className="cc-match-date" style={{ fontStyle: 'italic' }}>
                    {new Date(match.createdAt).toLocaleDateString()}
                  </span>
                  {selectedCompletedMatchId === match.id && (
                    <div className="cc-match-actions" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditCompletedMatch(match)}
                        className="cc-match-action-btn cc-btn-cyan"
                      >
                        조작(?)하기
                      </button>
                      <button
                        onClick={() => handleDeleteCompletedMatch(match)}
                        className="cc-match-action-btn cc-btn-danger"
                      >
                        역사에서 지우기
                      </button>
                    </div>
                  )}
                </div>
                <div className="cc-completed-compact" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="cc-compact-teams" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '13px', color: '#e2e8f0', wordBreak: 'keep-all', lineHeight: 1.4 }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ color: 'var(--cc-plasma-blue)', fontWeight: 700 }}>A팀</span>
                      <span style={{ opacity: 0.85 }}>({match.teamA.map(m => {
                        const isGuest = memberLookup.get(m)?.grade === 'guest';
                        return isGuest ? `${m}(guest)` : m;
                      }).join(', ')})</span>
                    </div>
                    
                    <div style={{ margin: '0 8px', color: 'var(--cc-laser-border)', fontWeight: 900, fontStyle: 'italic', fontSize: '11px', alignSelf: 'center' }}>vs</div>
                    
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <span style={{ color: 'var(--cc-primary-fixed)', fontWeight: 700 }}>B팀</span>
                      <span style={{ opacity: 0.85 }}>({match.teamB.map(m => {
                        const isGuest = memberLookup.get(m)?.grade === 'guest';
                        return isGuest ? `${m}(guest)` : m;
                      }).join(', ')})</span>
                    </div>
                  </div>

                  <div className="cc-compact-score" style={{ fontFamily: 'var(--cc-font-data)', fontSize: '28px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                    <span style={{ color: match.winner === 'A' ? 'var(--cc-plasma-blue)' : '#fff' }}>
                      {match.winner === 'A' && <span style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '6px' }}>🏆</span>}
                      {match.scoreA}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '22px', position: 'relative', top: '-2px' }}>:</span>
                    <span style={{ color: match.winner === 'B' ? 'var(--cc-primary-fixed)' : '#fff' }}>
                      {match.scoreB}
                      {match.winner === 'B' && <span style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '6px' }}>🏆</span>}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            </div>
            {totalPages > 1 && (
              <div className="cc-pagination">
                <button
                  className="cc-pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <span className="cc-pagination-info">{currentPage} / {totalPages}</span>
                <button
                  className="cc-pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </section>
      </div>

      <div className="cc-records-right">
      {/* ═══ 명예의 전당 ═══ */}
      <section>
        <div className="cc-section-title">
          <span style={{ color: '#eab308' }}>🏆</span>
          <span>명예의 전당 (최다승 랭킹)</span>
        </div>

        {Object.keys(memberStats).length === 0 ? (
          <div className="cc-empty">아직 등록된 전적이 없습니다. 첫 게임을 시작하세요!</div>
        ) : (
          <div className="cc-glass cc-hof-list">
            {(() => {
              const sortedMembers = Object.values(memberStats)
                .filter(m => m.nickname !== '컴퓨터')
                .sort((a, b) => {
                  const totalA = a.wins + a.losses
                  const winRateA = totalA > 0 ? a.wins / totalA : 0
                  const totalB = b.wins + b.losses
                  const winRateB = totalB > 0 ? b.wins / totalB : 0

                  if (winRateB !== winRateA) {
                    return winRateB - winRateA
                  }
                  if (b.wins !== a.wins) {
                    return b.wins - a.wins
                  }
                  return a.losses - b.losses
                });

              let currentRank = 1;

              return sortedMembers.map((member, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (member.wins !== prev.wins || member.losses !== prev.losses) {
                    currentRank = idx + 1;
                  }
                }

                const totalGames = member.wins + member.losses
                const winRate = totalGames > 0 ? Math.round((member.wins / totalGames) * 100) : 0

                return (
                  <div key={member.nickname} className={`cc-hof-item rank-${currentRank}`}>
                    <div className="cc-hof-left">
                      <div className="cc-hof-rank">
                        {currentRank === 1 ? (
                          <>
                            <span className="material-symbols-outlined cc-hof-rank-icon">workspace_premium</span>
                            <span className="cc-hof-rank-label">1위</span>
                          </>
                        ) : (
                          <span className="cc-hof-rank-num">{currentRank}</span>
                        )}
                      </div>
                      <div className="cc-hof-info">
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {member.nickname}
                          {memberLookup.get(member.nickname)?.grade === 'guest' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontWeight: 700,
                                lineHeight: 1,
                                color: '#fef3c7',
                                background: 'rgba(251, 191, 36, 0.2)',
                                border: '1px solid rgba(251, 191, 36, 0.35)',
                                letterSpacing: '0.02em',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              guest
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>
                    <div className="cc-hof-right">
                      <div className="cc-hof-record">
                        <span className="wins">{member.wins}승</span>{' '}
                        <span className="losses">{member.losses}패</span>
                      </div>
                      <div className="cc-hof-winrate">승률 {winRate}% ({totalGames}전)</div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
