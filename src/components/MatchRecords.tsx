import { useState, useEffect } from 'react'
import { memberData } from '../data'
import { guestMembers } from '../data/guestMembers'
import { fetchMatches, updateMatchSetResult, completeMatch, deleteMatch, deleteCompletedMatch, revertMatchToOngoing, fetchMemberStats, type MatchRecord, type MemberStat } from '../utils/firebaseUtils'
import { useAuth } from '../hooks/useAuth'

export default function MatchRecords() {
  const { user, login, logout } = useAuth()
  const [ongoingMatches, setOngoingMatches] = useState<MatchRecord[]>([])
  const [completedMatches, setCompletedMatches] = useState<MatchRecord[]>([])
  const [memberStats, setMemberStats] = useState<Record<string, MemberStat>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCompletedMatchId, setSelectedCompletedMatchId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  // 관리자 권한 확인 (Google 로그인 및 이메일 화이트리스트 체크)
  const requireAdminAuth = async (): Promise<boolean> => {
    let currentUser = user
    if (!currentUser) {
      currentUser = await login()
      if (!currentUser) return false
    }

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS || 'bloodmas78@gmail.com'
    const allowedList = adminEmails.split(',').map((e: string) => e.trim().toLowerCase())
    if (currentUser.email && !allowedList.includes(currentUser.email.toLowerCase())) {
      alert(`Google 계정(${currentUser.email})은 관리자 권한이 없습니다.`)
      return false
    }

    return true
  }

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
    const isAuthed = await requireAdminAuth()
    if (!isAuthed) return

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
    const isAuthed = await requireAdminAuth()
    if (!isAuthed) return

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
      {/* ═══ 관리자 Auth 인증 바 ═══ */}
      <div
        className="cc-auth-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          gridColumn: '1 / -1',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
          <span style={{ fontSize: '16px' }}>🔐</span>
          {user ? (
            <span>
              관리자 인증됨: <strong style={{ color: '#38bdf8' }}>{user.displayName || user.email}</strong>
            </span>
          ) : (
            <span>종료 매치 수정/삭제 시 <strong>Google 로그인</strong> 인증이 필요합니다.</span>
          )}
        </div>
        <div>
          {user ? (
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={login}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(66, 133, 244, 0.2)',
                border: '1px solid rgba(66, 133, 244, 0.4)',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google 로그인
            </button>
          )}
        </div>
      </div>

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
            <div className="cc-matches-grid cc-completed-matches-grid">
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
                      <div style={{ color: 'var(--cc-plasma-blue)', fontWeight: 700, marginBottom: '2px' }}>A팀</div>
                      <div style={{ opacity: 0.85, fontSize: '11.5px', wordBreak: 'keep-all', lineHeight: 1.3 }}>({match.teamA.map(m => {
                        const isGuest = memberLookup.get(m)?.grade === 'guest';
                        return isGuest ? `${m}(guest)` : m;
                      }).join(', ')})</div>
                    </div>
                    
                    <div style={{ margin: '0 8px', color: 'var(--cc-laser-border)', fontWeight: 900, fontStyle: 'italic', fontSize: '11px', alignSelf: 'center' }}>vs</div>
                    
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ color: 'var(--cc-primary-fixed)', fontWeight: 700, marginBottom: '2px' }}>B팀</div>
                      <div style={{ opacity: 0.85, fontSize: '11.5px', wordBreak: 'keep-all', lineHeight: 1.3 }}>({match.teamB.map(m => {
                        const isGuest = memberLookup.get(m)?.grade === 'guest';
                        return isGuest ? `${m}(guest)` : m;
                      }).join(', ')})</div>
                    </div>
                  </div>

                  {(() => {
                    const winner = match.scoreA > match.scoreB ? 'A' : match.scoreB > match.scoreA ? 'B' : null;
                    return (
                      <div className="cc-compact-score" style={{ fontFamily: 'var(--cc-font-data)', fontSize: '28px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                        <span style={{ color: winner === 'A' ? 'var(--cc-plasma-blue)' : '#fff' }}>
                          {winner === 'A' && <span style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '6px' }}>🏆</span>}
                          {match.scoreA}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '22px', position: 'relative', top: '-2px' }}>:</span>
                        <span style={{ color: winner === 'B' ? 'var(--cc-primary-fixed)' : '#fff' }}>
                          {match.scoreB}
                          {winner === 'B' && <span style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '6px' }}>🏆</span>}
                        </span>
                      </div>
                    );
                  })()}
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
