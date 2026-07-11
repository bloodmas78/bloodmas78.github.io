import { useState, useEffect, useRef, useCallback } from 'react'
import { memberData } from '../data'
import { guestMembers } from '../data/guestMembers'
import type { TeamEntry } from '../types'
import { useTeamMatch } from '../hooks/useTeamMatch'
import { createMatch, fetchMemberStats, type MemberStat } from '../utils/firebaseUtils'
import MatchRecords from '../components/MatchRecords'

function Random() {
  const [activeTab, setActiveTab] = useState<'match' | 'records'>('match')
  const [isStarting, setIsStarting] = useState(false)
  const [memberStats, setMemberStats] = useState<Record<string, MemberStat>>({})
  const [draggedMember, setDraggedMember] = useState<string | null>(null)
  const [dragOverTeam, setDragOverTeam] = useState<'a' | 'b' | null>(null)

  useEffect(() => {
    fetchMemberStats().then(stats => {
      const map: Record<string, MemberStat> = {}
      stats.forEach(s => map[s.nickname] = s)
      setMemberStats(map)
    })
  }, [])
  const {
    entries,
    count,
    result,
    isMatching,
    winRates,
    toggleMember: togglePrefill,
    setMemberScore,
    removeEntry,
    resetEntries,
    matchTeams,
    moveMember,
  } = useTeamMatch()

  const resultRef = useRef<HTMLElement>(null)

  const confirmButtonRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      setTimeout(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [])
  const selectableMembers = [...memberData, ...guestMembers.filter(
    (guest) => !memberData.some((member) => member.nickname === guest.nickname),
  )]

  const handleMatchTeams = () => {
    if (entries.length > 0) {
      matchTeams()
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      matchTeams()
    }
  }

  const renderSidebar = (className: string) => {
    if (activeTab !== 'match') return null
    return (
      <aside className={`cc-sidebar ${className}`}>
        <h2 className="cc-sidebar-title">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>groups</span>
          오늘의 참전 용사 선택
        </h2>

        <div className="cc-member-list">
          {selectableMembers.map((m) => {
            const selected = entries.find((e) => e.name === m.nickname)
            return (
              <div key={m.nickname} className={`cc-member-item ${selected ? 'active' : ''}`}>
                <div
                  className="cc-member-item-left"
                  onClick={() => {
                    const stats = memberStats[m.nickname]
                    const winRate = stats && (stats.wins + stats.losses) > 0
                      ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
                      : 0
                    togglePrefill(m.nickname, winRate)
                  }}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <span className="cc-member-dot" style={{ background: m.avatarColor }} />
                  <span className="cc-member-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {m.nickname}
                    {m.grade === 'guest' && (
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
                        }}
                        title="guest"
                      >
                        guest
                      </span>
                    )}
                  </span>
                  {memberStats[m.nickname] && (
                    <span className="cc-member-stats">
                      ({memberStats[m.nickname].wins}승 {memberStats[m.nickname].losses}패)
                    </span>
                  )}
                </div>
                {selected && (
                  <select
                    value={selected.score}
                    onChange={(e) => setMemberScore(m.nickname, Number(e.target.value))}
                    className={`rank-select ${selected.score === 30 ? 'plat' : selected.score === 25 ? 'gold' : 'silver'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={30}>💎 플래 (30)</option>
                    <option value={25}>🥇 골드 (25)</option>
                    <option value={20}>🥈 실버 (20)</option>
                  </select>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Entry List ── */}
        <div className="cc-entries-section">
          <div className="cc-entries-header">
            <span className="cc-entries-label">출전 명단 ({count}명)</span>
            {count > 0 && (
              <button onClick={resetEntries} className="cc-entries-clear">모두 삭제</button>
            )}
          </div>
          <div className="cc-entry-list">
            {entries.map((e, idx) => (
              <div key={idx} className="cc-entry-row">
                <span>{e.name}
                  {e.name !== '컴퓨터' && memberStats[e.name] && (
                    <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '4px' }}>
                      ({memberStats[e.name].wins}승 {memberStats[e.name].losses}패)
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`rank-badge ${e.score === 30 ? 'plat' : e.score === 25 ? 'gold' : e.score === 20 ? 'silver' : ''}`}>
                    {e.score === 30 ? '플래' : e.score === 25 ? '골드' : e.score === 20 ? '실버' : '컴퓨터'}
                  </span>
                  <button onClick={() => removeEntry(idx)} className="cc-entry-remove">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div className="random-page">
      <div className="cc-layout cc-cyber-grid">
        {/* ═══ SIDEBAR (Desktop) ═══ */}
        {activeTab === 'match' && renderSidebar('desktop-sidebar')}

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="cc-main">
          {/* Universal Hero with Tabs */}
          <section className="cc-hero cc-glass cc-brackets animate-tactical-master">
            {/* Background Images */}
            <div className="cc-hero-bg-wrapper">
              <img src="/images/random-hero-bg.jpg" className="cc-hero-bg-base" alt="Command Center" />
              <img src="/images/random-hero-bg.jpg" className="cc-hero-bg-glitch" alt="" />
            </div>

            <div className="cc-scanline" />
            <span className="corner-bracket bracket-tl" />
            <span className="corner-bracket bracket-tr" />
            <span className="corner-bracket bracket-bl" />
            <span className="corner-bracket bracket-br" />
            <div className="cc-hero-content">
              {activeTab === 'match' && (
                <div className="cc-hero-actions animate-tactical-master delay-300">
                  {/* Ancient Rune: Match Button */}
                <div className="cc-rune-btn-wrapper" onClick={handleMatchTeams}>
                  <button className="cc-rune-match-btn">
                    <svg className="cc-rune-match-rings" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" fill="none" r="48" stroke="url(#fireGradient)" strokeDasharray="1, 4" strokeWidth="0.5"></circle>
                      <circle cx="50" cy="50" fill="none" r="42" stroke="url(#fireGradient)" strokeDasharray="10, 5" strokeWidth="1"></circle>
                      <defs>
                        <linearGradient id="fireGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#ff4500', stopOpacity: 1 }}></stop>
                          <stop offset="100%" style={{ stopColor: '#ff8c00', stopOpacity: 1 }}></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                    <svg className="cc-rune-match-core" viewBox="0 0 100 100">
                      <polygon fill="rgba(255, 69, 0, 0.1)" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="#ff4500" strokeWidth="2"></polygon>
                      <polygon fill="none" points="50,15 80,30 80,70 50,85 20,70 20,30" stroke="#ff8c00" strokeWidth="1.5"></polygon>
                      <path className="cc-rune-match-rings" d="M50 20 A30 30 0 1 1 49.9 20" fill="none" stroke="#ffd700" strokeDasharray="2 2" strokeWidth="1" style={{ animationDirection: 'reverse' }}></path>
                    </svg>
                    <svg className="cc-rune-match-icon" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path>
                      <circle cx="12" cy="12" fill="rgba(255,255,255,0.4)" r="3"></circle>
                    </svg>
                  </button>
                  <span className="cc-rune-match-text">팀 배치 시작</span>
                </div>

                {/* Silver Rune: Reset Button */}
                <div className="cc-rune-btn-wrapper" onClick={resetEntries}>
                  <button className="cc-rune-reset-btn">
                    <div className="cc-rune-reset-bg">
                      <div className="cc-rune-reset-texture"></div>
                      <div className="cc-rune-reset-cracks">
                        <svg viewBox="0 0 100 100">
                          <path d="M20 50 L40 50 M60 50 L80 50 M50 20 L50 40 M50 60 L50 80" fill="none" stroke="#00bfff" strokeWidth="0.5"></path>
                          <circle cx="50" cy="50" fill="none" r="45" stroke="#00bfff" strokeDasharray="2 2" strokeWidth="0.2"></circle>
                        </svg>
                      </div>
                    </div>
                    <svg className="cc-rune-reset-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"></path>
                      <circle className="animate-pulse" cx="12" cy="12" fill="currentColor" r="2"></circle>
                    </svg>
                  </button>
                  <span className="cc-rune-reset-text">팀 초기화</span>
                </div>
              </div>
              )}
            </div>

            {/* Bottom Docked Tabs */}
            <div className="cc-hero-tabs-container animate-tactical-master delay-400">
              <nav className="cc-nav">
                <button
                  onClick={() => setActiveTab('match')}
                  className={`cc-nav-link ${activeTab === 'match' ? 'active' : ''}`}
                >
                  팀 매칭
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`cc-nav-link ${activeTab === 'records' ? 'active' : ''}`}
                >
                  전적 보기
                </button>
              </nav>
              <div className="cc-hero-tabs-line" />
            </div>
          </section>

          {/* ═══ SIDEBAR (Mobile) ═══ */}
          {activeTab === 'match' && renderSidebar('mobile-sidebar')}

          {/* Tab Content */}
          {activeTab === 'match' ? (
            <>

              {/* Match Result */}
              <section ref={resultRef} className="cc-result-section">
                {isMatching ? (
                  <div className="cc-warping">
                    <div className="cc-warping-spinner" />
                    <p className="cc-warping-text">[ 뇌 풀가동 밸런스 계산 중... 삐리빅 🤖 ]</p>
                    <p className="cc-warping-sub">누가 누가 한 팀이 될까? 두구두구두구...</p>
                  </div>
                ) : result ? (
                  <div className="cc-glass cc-match-active">
                    <div className="cc-teams-vs">
                      <div 
                        className={`cc-team-block ${dragOverTeam === 'a' ? 'drag-over' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverTeam !== 'a') setDragOverTeam('a');
                        }}
                        onDragLeave={() => {
                          if (dragOverTeam === 'a') setDragOverTeam(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTeam(null);
                          setDraggedMember(null);
                          const name = e.dataTransfer.getData('text/plain');
                          if (name) moveMember(name, 'a');
                        }}
                      >
                        <h4 className="cc-team-label team-a">A팀</h4>
                        <div className="cc-team-score" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--cc-on-surface-variant)', fontWeight: 'normal', fontFamily: 'Noto Sans KR' }}>실력점수</span>
                            <span>{result.sumA}</span>
                          </div>
                          {winRates && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '20px', color: '#4ade80' }}>
                              <span style={{ fontSize: '12px', color: 'var(--cc-on-surface-variant)', fontWeight: 'normal', fontFamily: 'Noto Sans KR' }}>승리확률</span>
                              <span>{winRates.a}%</span>
                            </div>
                          )}
                        </div>
                        <div className="cc-team-members">
                          {result.a
                            .slice()
                            .sort((x: TeamEntry, y: TeamEntry) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                            .map((p: TeamEntry, i: number) => (
                              <div 
                                key={i} 
                                className={`cc-team-member ${draggedMember === p.name ? 'dragging' : ''}`}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', p.name);
                                  setDraggedMember(p.name);
                                }}
                                onDragEnd={() => {
                                  setDraggedMember(null);
                                  setDragOverTeam(null);
                                }}
                                style={{ cursor: draggedMember === p.name ? 'grabbing' : 'grab' }}
                              >
                                {p.name}
                                {p.name !== '컴퓨터' && memberStats[p.name] && (
                                  <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '4px' }}>
                                    ({memberStats[p.name].wins}승 {memberStats[p.name].losses}패)
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="cc-vs-circle">VS</div>

                      <div 
                        className={`cc-team-block ${dragOverTeam === 'b' ? 'drag-over' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverTeam !== 'b') setDragOverTeam('b');
                        }}
                        onDragLeave={() => {
                          if (dragOverTeam === 'b') setDragOverTeam(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTeam(null);
                          setDraggedMember(null);
                          const name = e.dataTransfer.getData('text/plain');
                          if (name) moveMember(name, 'b');
                        }}
                      >
                        <h4 className="cc-team-label team-b">B팀</h4>
                        <div className="cc-team-score" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--cc-on-surface-variant)', fontWeight: 'normal', fontFamily: 'Noto Sans KR' }}>실력점수</span>
                            <span>{result.sumB}</span>
                          </div>
                          {winRates && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '20px', color: '#60a5fa' }}>
                              <span style={{ fontSize: '12px', color: 'var(--cc-on-surface-variant)', fontWeight: 'normal', fontFamily: 'Noto Sans KR' }}>승리확률</span>
                              <span>{winRates.b}%</span>
                            </div>
                          )}
                        </div>
                        <div className="cc-team-members">
                          {result.b
                            .slice()
                            .sort((x: TeamEntry, y: TeamEntry) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                            .map((p: TeamEntry, i: number) => (
                              <div 
                                key={i} 
                                className={`cc-team-member ${draggedMember === p.name ? 'dragging' : ''}`}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', p.name);
                                  setDraggedMember(p.name);
                                }}
                                onDragEnd={() => {
                                  setDraggedMember(null);
                                  setDragOverTeam(null);
                                }}
                                style={{ cursor: draggedMember === p.name ? 'grabbing' : 'grab' }}
                              >
                                {p.name}
                                {p.name !== '컴퓨터' && memberStats[p.name] && (
                                  <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '4px' }}>
                                    ({memberStats[p.name].wins}승 {memberStats[p.name].losses}패)
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                      <button
                        ref={confirmButtonRef}
                        disabled={isStarting}
                        onClick={async () => {
                          setIsStarting(true)
                          const aMembers = result.a.map(m => m.name)
                          const bMembers = result.b.map(m => m.name)
                          const matchId = await createMatch(aMembers, bMembers)
                          if (matchId) {
                            alert('새로운 매치가 등록되었습니다! 매치 기록 탭에서 진행해 주세요.')
                            setActiveTab('records')
                          } else {
                            alert('매치 등록에 실패했습니다.')
                          }
                          setIsStarting(false)
                        }}
                        className="cc-btn cc-btn-success"
                        style={{ fontSize: '16px', padding: '12px 32px' }}
                      >
                        {isStarting ? '등록 중...' : '🚀 이 조합으로 ㄱㄱ!'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cc-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span>같이할 멤버들을 픽한 다음 '팀 배치 시작'을 꾹 눌러주세요! 🎮</span>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>기준 점수: 플래(30점), 골드(25점), 실버(20점) | 홀수 인원일 경우 컴퓨터(10점)가 자동 추가됩니다</span>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div style={{ marginTop: '32px' }}>
              <MatchRecords />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Random
