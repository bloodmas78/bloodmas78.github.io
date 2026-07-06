import { useState, useEffect, useRef } from 'react'
import { memberData } from '../data'
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

  const handleMatchTeams = () => {
    matchTeams()
    setTimeout(() => {
      actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="home-page random-page protoss-theme">
      <div className="protoss-grid">
        <div className="protoss-hero-visual">
          <div className="protoss-visual-content">
            <div className="home-badge protoss-badge">⚔️ 9샷 팀 매칭</div>
            <h1 className="protoss-visual-title">STARCRAFT 팀 매칭</h1>
            <p className="protoss-visual-desc">알파고 뺨치는 밸런스로 A팀/B팀을 찢어드립니다! 🔥</p>
          </div>
          <div className="protoss-visual-img-container">
            <img src={heroImage} alt="Protoss energy crystal" className="protoss-crystal-img" />
          </div>
          <div className="protoss-hero-overlay"></div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '16px 0', borderBottom: '1px solid rgba(0, 255, 255, 0.2)', paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('match')}
            className="protoss-btn"
            style={{
              background: activeTab === 'match' ? 'rgba(0, 255, 255, 0.15)' : 'transparent',
              color: activeTab === 'match' ? '#00ffff' : '#9ca3af',
              border: activeTab === 'match' ? '1px solid #00ffff' : '1px solid rgba(255,255,255,0.1)',
              flex: 1
            }}
          >
            ⚔️ 팀 짜기
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className="protoss-btn"
            style={{
              background: activeTab === 'records' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'records' ? '#60a5fa' : '#9ca3af',
              border: activeTab === 'records' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              flex: 1
            }}
          >
            📊 매치 현황보기
          </button>
        </div>

        {activeTab === 'match' ? (
          <>
            <aside className="protoss-panel protoss-sidebar">
              <div className="protoss-panel-header">
                <strong>오늘의 참전 용사 선택</strong>
              </div>
              <div className="protoss-toggle-grid">
                {memberData.map((m) => {
                  const selected = entries.find((e) => e.name === m.nickname)
                  return (
                    <div key={m.nickname} className="protoss-toggle-row">
                      <button
                        onClick={() => togglePrefill(m.nickname)}
                        className={`protoss-chip ${selected ? 'active' : ''}`}
                      >
                        <span className="protoss-chip-dot" style={{ background: m.avatarColor }} />
                        {m.nickname} {memberStats[m.nickname] ? <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>({memberStats[m.nickname].wins}승 {memberStats[m.nickname].losses}패)</span> : ''}
                      </button>
                      {selected && (
                        <select
                          value={selected.score}
                          onChange={(e) => setMemberScore(m.nickname, Number(e.target.value))}
                          className={`protoss-select rank-select ${selected.score === 30 ? 'plat' : selected.score === 25 ? 'gold' : 'silver'}`}
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

              <div className="protoss-section protoss-entries-section">
                <div className="protoss-section-title">출전 명단 ({count}명)</div>
                <div className="protoss-entry-list">
                  {entries.map((e, idx) => (
                    <div key={idx} className="protoss-entry-row">
                      <div className="protoss-entry-info">
                        <span className="protoss-entry-dot" />
                        <span>
                          {e.name}
                          {e.name !== '컴퓨터' && memberStats[e.name] ? <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>({memberStats[e.name].wins}승 {memberStats[e.name].losses}패)</span> : ''}
                        </span>
                        <span className={`protoss-entry-score rank-badge ${e.score === 30 ? 'plat' : e.score === 25 ? 'gold' : e.score === 20 ? 'silver' : ''}`}>
                          {e.score === 30 ? '💎 플래' : e.score === 25 ? '🥇 골드' : e.score === 20 ? '🥈 실버' : '💻 컴퓨터'}
                        </span>
                      </div>
                      <button onClick={() => removeEntry(idx)} className="protoss-text-btn">삭제</button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <main className="protoss-panel protoss-main">
              <div className="protoss-actions-row" ref={actionsRef}>
                <div>
                  <strong>팀 매칭 설정</strong>
                  <div className="protoss-subtext">기준 점수: 플래(30점), 골드(25점), 실버(20점) | 홀수 인원일 경우 컴퓨터(10점)가 자동 추가됩니다.</div>
                </div>
                <div className="protoss-btn-row">
                  <button onClick={resetEntries} className="protoss-btn protoss-btn-ghost">선택 초기화</button>
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
                      className="protoss-btn"
                      style={{ backgroundColor: '#10b981', color: '#fff', borderColor: '#10b981' }}
                    >
                      {isStarting ? '등록 중...' : '🚀 이 조합으로 ㄱㄱ!'}
                    </button>
                  )}
                  <button onClick={handleMatchTeams} className="protoss-btn protoss-btn-primary">⚡ 자동 팀 매칭 돌리기!</button>
                </div>
              </div>

              <div className="protoss-results">
                {isMatching ? (
                  <div className="protoss-warping-state">
                    <div className="warping-portal"></div>
                    <p className="warping-text">[ 뇌 풀가동 밸런스 계산 중... 삐리빅 🤖 ]</p>
                    <p className="warping-subtext">누가 누가 한 팀이 될까? 두구두구두구...</p>
                  </div>
                ) : result ? (
                  <>
                    {/* Psionic Power Balance Meter */}
                    <div className="protoss-power-meter-container">
                      <div className="power-meter-header">
                        <span>A팀 전력 {winRates?.a}%</span>
                        <span className="power-meter-title">팀 전력 분석 (Power Ratio)</span>
                        <span>B팀 전력 {winRates?.b}%</span>
                      </div>
                      <div className="power-meter-bar">
                        <div className="power-fill-a" style={{ width: `${winRates?.a}%` }}></div>
                        <div className="power-fill-b" style={{ width: `${winRates?.b}%` }}></div>
                      </div>
                    </div>

                    <div className="protoss-team-grid">
                      <section className="protoss-team-card templar-card">
                        <div className="protoss-team-card-header">
                          <div className="team-title-wrap">
                            <span className="team-affinity-badge blue">TEMPLAR</span>
                            <h3>A팀</h3>
                          </div>
                          <span className="protoss-winrate">승률 {winRates?.a}%</span>
                        </div>
                        <div className="protoss-team-summary">총점: {result.sumA} • 평균: {(result.sumA / result.a.length).toFixed(1)}</div>
                        <div className="protoss-team-list">
                          {result.a
                            .slice()
                            .sort((x: TeamEntry, y: TeamEntry) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                            .map((p: TeamEntry, i: number) => (
                              <div key={i} className="protoss-team-item">
                                <span>
                                  {p.name}
                                  {p.name !== '컴퓨터' && memberStats[p.name] ? <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>({memberStats[p.name].wins}승 {memberStats[p.name].losses}패)</span> : ''}
                                </span>
                                <span>{p.score === 10 ? '컴퓨터(10)' : p.score}</span>
                              </div>
                            ))}
                        </div>
                      </section>

                      <div className="protoss-vs-box">
                        <span>VS</span>
                      </div>

                      <section className="protoss-team-card nerazim-card">
                        <div className="protoss-team-card-header">
                          <div className="team-title-wrap">
                            <span className="team-affinity-badge green">NERAZIM</span>
                            <h3>B팀</h3>
                          </div>
                          <span className="protoss-winrate">승률 {winRates?.b}%</span>
                        </div>
                        <div className="protoss-team-summary">총점: {result.sumB} • 평균: {(result.sumB / result.b.length).toFixed(1)}</div>
                        <div className="protoss-team-list">
                          {result.b
                            .slice()
                            .sort((x: TeamEntry, y: TeamEntry) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                            .map((p: TeamEntry, i: number) => (
                              <div key={i} className="protoss-team-item">
                                <span>
                                  {p.name}
                                  {p.name !== '컴퓨터' && memberStats[p.name] ? <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px' }}>({memberStats[p.name].wins}승 {memberStats[p.name].losses}패)</span> : ''}
                                </span>
                                <span>{p.score === 10 ? '컴퓨터(10)' : p.score}</span>
                              </div>
                            ))}
                        </div>
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="protoss-empty-state">같이할 멤버들을 픽한 다음 '자동 팀 매칭 돌리기'를 꾹 눌러주세요! 🎮</div>
                )}
              </div>
            </main>
          </>
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <MatchRecords />
          </div>
        )}
      </div>
    </div>
  )
}

export default Random
