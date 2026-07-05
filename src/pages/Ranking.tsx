import { useState, useEffect } from 'react'
import { memberData, monthlyLabel } from '../data'
import type { SortKey } from '../types'
import { fetchMemberStats, type MemberStat } from '../utils/firebaseUtils'
import {
  sortMembers,
  getTopMember,
  getTotalGames,
  getStatsCount,
  getStats,
} from '../utils'

function Ranking() {
  const [sortBy, setSortBy] = useState<SortKey>('average')
  const [firebaseStats, setFirebaseStats] = useState<Record<string, MemberStat>>({})
  const periodLabel = monthlyLabel

  useEffect(() => {
    fetchMemberStats().then(stats => {
      const statsMap: Record<string, MemberStat> = {}
      stats.forEach(s => statsMap[s.nickname] = s)
      setFirebaseStats(statsMap)
    })
  }, [])

  const processedMembers = sortMembers(memberData, sortBy, 'monthly')
  const membersWithStats = getStatsCount('monthly')
  const totalGamesCount = getTotalGames('monthly')

  const highestAverageMember = getTopMember('average', 'monthly')
  const highestHighrunMember = getTopMember('highrun', 'monthly')
  const highestWinRateMember = getTopMember('winRate', 'monthly')

  return (
    <div className="dashboard-container">
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <header className="dashboard-header animate-fade-in">
        <div className="header-logo">
          <div className="carom-balls">
            <span className="carom-ball red"></span>
            <span className="carom-ball yellow"></span>
            <span className="carom-ball white"></span>
          </div>
          <div className="logo-text">
            <h1>매니아 당구클럽 <span className="highlight-text">9샷 멤버스</span></h1>
            <p className="subtitle">
              안양 매니아 당구클럽 9샷 멤버들의 빌리존 랭킹 대시보드 🔥
            </p>
          </div>
        </div>

        <div className="quick-stats">
          <div className="quick-stat-card">
            <span className="label">전체 멤버</span>
            <span className="value">{memberData.length}명</span>
          </div>
          <div className="quick-stat-card">
            <span className="label">{periodLabel} 기록 보유</span>
            <span className="value">{membersWithStats}명</span>
          </div>
          <div className="quick-stat-card">
            <span className="label">기록된 총 경기</span>
            <span className="value">{totalGamesCount}게임</span>
          </div>
          <div className="quick-stat-card">
            <span className="label">최고 에버리지</span>
            <span className="value highlight">
              {highestAverageMember ? highestAverageMember.stats.average.toFixed(3) : '-'}
            </span>
            {highestAverageMember && <span className="sub-value">{highestAverageMember.member.nickname}</span>}
          </div>
          <div className="quick-stat-card">
            <span className="label">최고 하이런</span>
            <span className="value highlight">
              {highestHighrunMember ? `${highestHighrunMember.stats.highrun}점` : '-'}
            </span>
            {highestHighrunMember && <span className="sub-value">{highestHighrunMember.member.nickname}</span>}
          </div>
          <div className="quick-stat-card">
            <span className="label">최고 승률</span>
            <span className="value highlight">
              {highestWinRateMember ? `${highestWinRateMember.stats.winRate}%` : '-'}
            </span>
            {highestWinRateMember && <span className="sub-value">{highestWinRateMember.member.nickname}</span>}
          </div>
        </div>
      </header>

      <section className="control-panel animate-slide-up">
        <div className="control-panel-top">
          <div className="panel-title-group">
            <span className="panel-title">월간 기록</span>
            <span className="panel-subtitle">{monthlyLabel} 데이터 기준</span>
          </div>

          <div className="sort-by-group">
            <span className="sort-label">정렬</span>
            <button
              type="button"
              className={`sort-btn ${sortBy === 'average' ? 'active' : ''}`}
              onClick={() => setSortBy('average')}
            >
              에버리지
            </button>
            <button
              type="button"
              className={`sort-btn ${sortBy === 'highrun' ? 'active' : ''}`}
              onClick={() => setSortBy('highrun')}
            >
              하이런
            </button>
            <button
              type="button"
              className={`sort-btn ${sortBy === 'winRate' ? 'active' : ''}`}
              onClick={() => setSortBy('winRate')}
            >
              승률
            </button>
          </div>
        </div>
      </section>

      <section className="members-section animate-slide-up">
        <div className="section-header">
          <h2>멤버 랭킹</h2>
          <span className="section-meta">
            {periodLabel} · 기록 {membersWithStats}명 / 전체 {memberData.length}명
          </span>
        </div>

        <main className="members-grid">
          {processedMembers.map((member) => {
            const stats = getStats(member, 'monthly')

            return (
              <article
                key={member.nickname}
                className={`member-card ${!stats ? 'no-stats' : ''}`}
                style={{ '--accent-color': member.avatarColor } as React.CSSProperties}
              >
                <div className="card-header">
                  <div className="member-avatar-ball">
                    <span className="member-ball-number">{stats?.ranks.average ?? '•'}</span>
                  </div>
                  <div className="member-name-info">
                    <h3>{member.nickname}</h3>
                    <span className="badge">
                      {stats ? `${periodLabel} 기록 보유` : '아직 쪼렙.. (기록 없음)'}
                    </span>
                  </div>
                  {stats && stats.ranks.average && (
                    <div className="rank-badge chalk-badge" title="에버 랭크">
                      <span className="rank-num">#{stats.ranks.average}</span>
                      <span className="rank-label">RANK</span>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  {stats ? (
                    <>
                      <div className="stats-row">
                        <div className="stat-box">
                          <span className="stat-label">에버리지</span>
                          <span className="stat-value">{stats.average.toFixed(3)}</span>
                          <span className="stat-rank">
                            {stats.ranks.average ? `${stats.ranks.average}위` : '-'}
                          </span>
                        </div>

                        <div className="stat-box">
                          <span className="stat-label">하이런</span>
                          <span className="stat-value">{stats.highrun}점</span>
                          <span className="stat-rank">
                            {stats.ranks.highrun ? `${stats.ranks.highrun}위` : '-'}
                          </span>
                        </div>

                        <div className="stat-box">
                          <span className="stat-label">승률</span>
                          <span className="stat-value">{stats.winRate}%</span>
                          <span className="stat-rank">
                            {stats.ranks.winRate ? `${stats.ranks.winRate}위` : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="record-details">
                        <div className="record-text">
                          <span>
                            빌리존 전적 <strong>{stats.win}승 {stats.draw}무 {stats.loss}패</strong>
                          </span>
                          <span>총 {stats.win + stats.draw + stats.loss}경기</span>
                        </div>
                        <div className="winrate-bar-container">
                          <div
                            className="winrate-bar-fill"
                            style={{ width: `${stats.winRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {firebaseStats[member.nickname] && (
                        <div className="record-details" style={{ marginTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                          <div className="record-text">
                            <span style={{ color: '#00ffff' }}>
                              팀 매칭 전적 <strong>{firebaseStats[member.nickname].wins}승 {firebaseStats[member.nickname].losses}패</strong>
                            </span>
                            <span style={{ color: '#00ffff' }}>
                              총 {firebaseStats[member.nickname].wins + firebaseStats[member.nickname].losses}경기
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-stats">
                      <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <p className="empty-title">
                        {periodLabel} 공식 기록 없음 😅
                      </p>
                      <p className="empty-desc">
                        빌리존 랭킹은 10경기 이상 치러야 인정해줍니다!
                        {` ${monthlyLabel} 기준 10게임 미만이면 랭킹에 안 떠요 ㅠㅠ 분발하세요!`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="card-decor-bar"></div>
              </article>
            )
          })}

          {processedMembers.length === 0 && (
            <div className="no-results-card">
              <p>조건에 맞는 멤버가 없네요 ㅠㅠ</p>
            </div>
          )}
        </main>
      </section>

      <footer className="dashboard-footer-info">
        <p>
          데이터 출처: Billizone Public API · 매일 자동 동기화 ·
          10경기 미만 회원은 랭킹 미포함
        </p>
        <p className="footer-copy">Copyright © 2026 Billizone Club Sync. All Rights Reserved.</p>
      </footer>
    </div>
  )
}

export default Ranking
