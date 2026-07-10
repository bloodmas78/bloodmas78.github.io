import { useState, useEffect, useRef } from 'react'
import { memberData } from '../data'
import { guestMembers } from '../data/guestMembers'
import type { TeamEntry } from '../types'
import { useTeamMatch } from '../hooks/useTeamMatch'
import heroImage from '../assets/protoss_crystal.png'
import { createMatch, fetchMemberStats, type MemberStat } from '../utils/firebaseUtils'
import MatchRecords from '../components/MatchRecords'

function Random() {
  const [activeTab, setActiveTab] = useState<'match' | 'records'>('match')
  const [isStarting, setIsStarting] = useState(false)
  const [memberStats, setMemberStats] = useState<Record<string, MemberStat>>({})

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
  } = useTeamMatch()

  const actionsRef = useRef<HTMLDivElement>(null)
  const selectableMembers = [...memberData, ...guestMembers.filter(
    (guest) => !memberData.some((member) => member.nickname === guest.nickname),
  )]

  const handleMatchTeams = () => {
    matchTeams()
    setTimeout(() => {
      actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
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
                  onClick={() => togglePrefill(m.nickname)}
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
    <div className="home-page random-page">
      <div className="cc-layout cc-cyber-grid">
        {/* ═══ SIDEBAR (Desktop) ═══ */}
        {renderSidebar('desktop-sidebar')}

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="cc-main">
          {/* Universal Hero with Tabs */}
          <section className="cc-glass cc-brackets cc-hero">
            <div className="cc-scanline" />
            <span className="bracket-bl" />
            <span className="bracket-br" />
            <div className="cc-hero-content">
              <div className="cc-hero-badge">
                <span className="cc-hero-badge-dot" />
                <span className="cc-hero-badge-text">COMMAND CENTER ONLINE</span>
              </div>
              <h2 className="cc-hero-title">
                STARCRAFT <em>전술 지휘소</em>
              </h2>
              <p className="cc-hero-desc" style={{ marginBottom: '24px' }}>
                알파고 뺨치는 밸런스로 A팀/B팀을 찢어드립니다! 🔥
              </p>
              
              <nav className="cc-nav" style={{ justifyContent: 'flex-start' }}>
                <button
                  onClick={() => setActiveTab('match')}
                  className={`cc-nav-link ${activeTab === 'match' ? 'active' : ''}`}
                >
                  TEAM MATCHING
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`cc-nav-link ${activeTab === 'records' ? 'active' : ''}`}
                >
                  HISTORY
                </button>
              </nav>
            </div>
            <div className="cc-hero-image">
              <img src={heroImage} alt="Protoss energy crystal" />
            </div>
          </section>

          {/* ═══ SIDEBAR (Mobile) ═══ */}
          {renderSidebar('mobile-sidebar')}

          {/* Tab Content */}
          {activeTab === 'match' ? (
            <>

            {/* Settings + Power Ratio */}
            <section className="cc-glass cc-settings-panel" ref={actionsRef}>
              <div className="cc-settings-inner">
                <div className="cc-settings-left">
                  <h3 className="cc-section-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>settings_input_component</span>
                    팀 매칭 설정
                  </h3>
                  <p className="cc-settings-desc">
                    기준 점수: <b>플래(30점), 골드(25점), 실버(20점)</b> | 홀수 인원일 경우 <b>컴퓨터(10점)</b>가 자동 추가됩니다.
                  </p>
                  <div className="cc-btn-row">
                    <button onClick={handleMatchTeams} className="cc-btn cc-btn-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
                      자동 팀 매칭 돌리기!
                    </button>
                    <button onClick={resetEntries} className="cc-btn cc-btn-ghost">선택 초기화</button>
                    {result && (
                      <button
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
                      >
                        {isStarting ? '등록 중...' : '🚀 이 조합으로 ㄱㄱ!'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Power Ratio */}
                {result && winRates && (
                  <div className="cc-settings-right">
                    <div className="cc-power-header">
                      <span className="cc-power-label">A팀 전력 {winRates.a}%</span>
                      <span className="cc-power-title">팀 전력 분석 (Power Ratio)</span>
                      <span className="cc-power-label-b">B팀 전력 {winRates.b}%</span>
                    </div>
                    <div className="cc-power-bar">
                      <div className="cc-power-a" style={{ width: `${winRates.a}%` }} />
                      <div className="cc-power-b" style={{ width: `${winRates.b}%` }} />
                    </div>
                    <div className="cc-power-stats">
                      <div>
                        <p className="cc-power-stat-label">총점: {result.sumA}</p>
                        <p className="cc-power-stat-value team-a">평균: {(result.sumA / result.a.length).toFixed(1)}</p>
                      </div>
                      <div className="cc-power-divider" />
                      <div>
                        <p className="cc-power-stat-label">총점: {result.sumB}</p>
                        <p className="cc-power-stat-value team-b">평균: {(result.sumB / result.b.length).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Match Result */}
            <section>
              {isMatching ? (
                <div className="cc-warping">
                  <div className="cc-warping-spinner" />
                  <p className="cc-warping-text">[ 뇌 풀가동 밸런스 계산 중... 삐리빅 🤖 ]</p>
                  <p className="cc-warping-sub">누가 누가 한 팀이 될까? 두구두구두구...</p>
                </div>
              ) : result ? (
                <div className="cc-glass cc-match-active">
                  <div className="cc-teams-vs">
                    <div className="cc-team-block">
                      <h4 className="cc-team-label team-a">A팀</h4>
                      <div className="cc-team-score">{0}</div>
                      <div className="cc-team-members">
                        {result.a
                          .slice()
                          .sort((x: TeamEntry, y: TeamEntry) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                          .map((p: TeamEntry, i: number) => (
                            <div key={i} className="cc-team-member">
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

                    <div className="cc-team-block">
                      <h4 className="cc-team-label team-b">B팀</h4>
                      <div className="cc-team-score">{0}</div>
                      <div className="cc-team-members">
                        {result.b
                          .slice()
                          .sort((x: TeamEntry, y: TeamEntry) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                          .map((p: TeamEntry, i: number) => (
                            <div key={i} className="cc-team-member">
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
                </div>
              ) : (
                <div className="cc-empty">같이할 멤버들을 픽한 다음 '자동 팀 매칭 돌리기'를 꾹 눌러주세요! 🎮</div>
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
