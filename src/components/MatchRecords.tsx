import { useState, useEffect } from 'react'
import { fetchMatches, updateMatchScore, completeMatch, deleteMatch, deleteCompletedMatch, revertMatchToOngoing, fetchMemberStats, type MatchRecord, type MemberStat } from '../utils/firebaseUtils'

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

  const handleScoreUpdate = async (matchId: string, isTeamA: boolean, currentScoreA: number, currentScoreB: number, change: number) => {
    let newScoreA = currentScoreA
    let newScoreB = currentScoreB
    
    if (isTeamA) {
      newScoreA = Math.max(0, currentScoreA + change)
    } else {
      newScoreB = Math.max(0, currentScoreB + change)
    }

    const success = await updateMatchScore(matchId, newScoreA, newScoreB)
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
          <span>🔥 진행 중인 매치</span>
          <button onClick={loadData} className="protoss-btn protoss-btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>🔄 새로고침</button>
        </h2>
        {ongoingMatches.length === 0 ? (
          <div className="protoss-empty-state" style={{ padding: '32px' }}>현재 진행 중인 매치가 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ongoingMatches.map(match => (
              <div key={match.id} style={{ background: 'rgba(10, 15, 30, 0.8)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>{new Date(match.createdAt).toLocaleDateString()}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleDeleteMatch(match.id!)} className="protoss-btn" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', fontSize: '0.9rem' }}>
                      매치 취소
                    </button>
                    <button onClick={() => handleCompleteMatch(match)} className="protoss-btn" style={{ background: '#ef4444', color: '#fff', padding: '6px 12px', fontSize: '0.9rem' }}>
                      🛑 매치 종료 및 전적 확정
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h3 style={{ color: '#60a5fa', margin: '0 0 12px 0' }}>A팀</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', marginBottom: '16px' }}>{match.scoreA}</div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button onClick={() => handleScoreUpdate(match.id!, true, match.scoreA, match.scoreB, -1)} className="protoss-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem' }}>
                        -1
                      </button>
                      <button onClick={() => handleScoreUpdate(match.id!, true, match.scoreA, match.scoreB, 1)} className="protoss-btn" style={{ flex: 3, background: '#3b82f6', color: '#fff', fontSize: '1rem' }}>
                        +1
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {match.teamA.map(member => (
                        <div key={member}>{formatMember(member)}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4b5563' }}>VS</div>
                  
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <h3 style={{ color: '#34d399', margin: '0 0 12px 0' }}>B팀</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1', marginBottom: '16px' }}>{match.scoreB}</div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button onClick={() => handleScoreUpdate(match.id!, false, match.scoreA, match.scoreB, -1)} className="protoss-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem' }}>
                        -1
                      </button>
                      <button onClick={() => handleScoreUpdate(match.id!, false, match.scoreA, match.scoreB, 1)} className="protoss-btn" style={{ flex: 3, background: '#10b981', color: '#fff', fontSize: '1rem' }}>
                        +1
                      </button>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

      <section>
        <h2 style={{ color: '#a6cbd8', borderBottom: '1px solid rgba(166, 203, 216, 0.2)', paddingBottom: '8px', marginBottom: '16px' }}>
          ✅ 종료된 매치 기록
        </h2>
        {completedMatches.length === 0 ? (
          <div className="protoss-empty-state" style={{ padding: '32px' }}>종료된 매치 기록이 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {completedMatches.map(match => (
              <div key={match.id} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '16px', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEditCompletedMatch(match)}
                    style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px' }}
                  >
                    ✏️ 수정
                  </button>
                  <button 
                    onClick={() => handleDeleteCompletedMatch(match)}
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px' }}
                  >
                    🗑️ 삭제
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', paddingRight: '100px' }}>
                  {new Date(match.createdAt).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '8px' }}>A팀</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>{match.scoreA}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {match.teamA.map(member => (
                        <div key={member}>{formatMember(member)}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '0 16px', color: '#6b7280', fontSize: '1.2rem', fontWeight: 'bold' }}>VS</div>
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
    </div>
  )
}
