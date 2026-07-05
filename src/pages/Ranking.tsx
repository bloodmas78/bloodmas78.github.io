import { useState } from 'react'
import { memberData, monthlyLabel } from '../data'
import type { Member, StatDetail } from '../data'
import '../App.css'

function Ranking() {
  const [sortBy, setSortBy] = useState<'average' | 'highrun' | 'winRate'>('average')

  const getActiveStats = (member: Member): StatDetail | null => {
    return member.monthly
  }

  const periodLabel = monthlyLabel

  const processedMembers = [...memberData].sort((a, b) => {
    const aStats = getActiveStats(a)
    const bStats = getActiveStats(b)

    if (!aStats && !bStats) return 0
    if (!aStats) return 1
    if (!bStats) return -1

    if (sortBy === 'average') {
      return bStats.average - aStats.average
    } else if (sortBy === 'highrun') {
      return bStats.highrun - aStats.highrun
    }
    return bStats.winRate - aStats.winRate
  })

  const membersWithStats = memberData.filter((member) => getActiveStats(member)).length
  const totalGamesCount = memberData.reduce((acc, cur) => {
    const stats = getActiveStats(cur)
    if (!stats) return acc
    return acc + stats.win + stats.draw + stats.loss
  }, 0)

  const membersWithStatsList = memberData
    .map((member) => ({ member, stats: getActiveStats(member) }))
    .filter((item): item is { member: Member; stats: StatDetail } => item.stats !== null)

  const highestAverageMember = membersWithStatsList.length
    ? membersWithStatsList.reduce((best, current) =>
        current.stats.average > best.stats.average ? current : best,
      )
    : null

  const highestHighrunMember = membersWithStatsList.length
    ? membersWithStatsList.reduce((best, current) =>
        current.stats.highrun > best.stats.highrun ? current : best,
      )
    : null

  const highestWinRateMember = membersWithStatsList.length
    ? membersWithStatsList.reduce((best, current) =>
        current.stats.winRate > best.stats.winRate ? current : best,
      )
    : null

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
              안양 매니아 당구클럽 동호인 중 9샷 멤버들의 Billizone 랭킹 · 전적 대시보드
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
            const stats = getActiveStats(member)

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
                      {stats ? `${periodLabel} 기록 보유` : '기록 미집계'}
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
                            전적 <strong>{stats.win}승 {stats.draw}무 {stats.loss}패</strong>
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
                        {periodLabel} 공식 기록 없음
                      </p>
                      <p className="empty-desc">
                        Billizone 랭킹은 10경기 이상 치른 회원만 집계됩니다.
                        {` ${monthlyLabel} 기준 10게임 미만이면 월간 기록이 표시되지 않습니다.`}
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
              <p>검색 조건에 맞는 멤버이 없습니다.</p>
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
