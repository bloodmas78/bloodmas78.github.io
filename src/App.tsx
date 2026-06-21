import { useState } from 'react'
import { memberData } from './data'
import type { Member, StatDetail } from './data'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'allTime'>('monthly')
  const [sortBy, setSortBy] = useState<'average' | 'highrun' | 'winRate'>('average')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'hasMonthly' | 'hasAllTime'>('all')

  // Helper to extract active stats safely
  const getActiveStats = (member: Member): StatDetail | null => {
    return activeTab === 'monthly' ? member.monthly : member.allTime
  }

  // Filter and sort members
  const processedMembers = memberData
    .filter((member) => {
      // 1. Search Query filter
      const matchesSearch = member.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchesSearch) return false

      // 2. Filter Mode
      if (filterMode === 'hasMonthly' && !member.monthly) return false
      if (filterMode === 'hasAllTime' && !member.allTime) return false

      return true
    })
    .sort((a, b) => {
      const aStats = getActiveStats(a)
      const bStats = getActiveStats(b)

      // If one of them doesn't have stats for the active tab, push it to the bottom
      if (!aStats && !bStats) return 0
      if (!aStats) return 1
      if (!bStats) return -1

      // Sort descending based on selected metric
      if (sortBy === 'average') {
        return bStats.average - aStats.average
      } else if (sortBy === 'highrun') {
        return bStats.highrun - aStats.highrun
      } else {
        return bStats.winRate - aStats.winRate
      }
    })

  // Calculations for club summary
  const totalGamesCount = memberData.reduce((acc, cur) => {
    const mGames = cur.monthly ? cur.monthly.win + cur.monthly.loss : 0
    const aGames = cur.allTime ? cur.allTime.win + cur.allTime.loss : 0
    return acc + (activeTab === 'monthly' ? mGames : aGames)
  }, 0)

  const highestAverage = Math.max(
    ...memberData.map((m) => {
      const stats = getActiveStats(m)
      return stats ? stats.average : 0
    })
  )

  const highestHighrun = Math.max(
    ...memberData.map((m) => {
      const stats = getActiveStats(m)
      return stats ? stats.highrun : 0
    })
  )

  return (
    <div className="dashboard-container">
      {/* Background Decor */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <header className="dashboard-header animate-fade-in">
        <div className="header-logo">
          <span className="billiard-ball">8</span>
          <div className="logo-text">
            <h1>매니아 당구클럽 <span className="highlight-text">9샷 멤버스</span></h1>
            <p className="subtitle">안양 매니아 당구클럽 동호인 중 '9샷' 멤버들의 실시간 랭킹 & 전적 대시보드</p>
          </div>
        </div>
        
        {/* Quick Stats Panel */}
        <div className="quick-stats">
          <div className="quick-stat-card">
            <span className="label">활성 멤버</span>
            <span className="value">{memberData.length}명</span>
          </div>
          <div className="quick-stat-card">
            <span className="label">기록된 총 경기수</span>
            <span className="value">{totalGamesCount}게임</span>
          </div>
          <div className="quick-stat-card">
            <span className="label">최고 에버리지</span>
            <span className="value highlight">{highestAverage.toFixed(3)}</span>
          </div>
          <div className="quick-stat-card">
            <span className="label">최고 하이런</span>
            <span className="value highlight">{highestHighrun}점</span>
          </div>
        </div>
      </header>

      {/* Control Panel (Filters & Tabs) */}
      <section className="control-panel animate-slide-up">
        {/* View Mode Toggle (Monthly vs All-Time) */}
        <div className="toggle-group">
          <button 
            type="button" 
            className={`toggle-btn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            월간 기록 (6월)
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${activeTab === 'allTime' ? 'active' : ''}`}
            onClick={() => setActiveTab('allTime')}
          >
            누적 전체 기록
          </button>
        </div>

        {/* Filters and Search */}
        <div className="filter-controls">
          <input 
            type="text" 
            className="search-input" 
            placeholder="멤버 닉네임 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select 
            className="filter-select"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'hasMonthly' | 'hasAllTime')}
          >
            <option value="all">모든 멤버 보기</option>
            <option value="hasMonthly">월간 기록 보유자만</option>
            <option value="hasAllTime">누적 기록 보유자만</option>
          </select>

          <div className="sort-by-group">
            <span className="sort-label">정렬 기준:</span>
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

      {/* Main Grid Layout */}
      <main className="members-grid animate-slide-up">
        {processedMembers.map((member) => {
          const stats = getActiveStats(member)
          
          return (
            <article 
              key={member.nickname} 
              className={`member-card ${!stats ? 'no-stats' : ''}`}
              style={{ '--accent-color': member.avatarColor } as React.CSSProperties}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="avatar" style={{ backgroundColor: member.avatarColor }}>
                  {member.nickname.replace('9샷', '').substring(0, 2) || '9'}
                </div>
                <div className="member-name-info">
                  <h3>{member.nickname}</h3>
                  <span className="badge">Club Member</span>
                </div>
                {stats && stats.ranks.average && (
                  <div className="rank-badge">
                    <span className="rank-num">#{stats.ranks.average}</span>
                    <span className="rank-label">에버랭크</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="card-body">
                {stats ? (
                  <>
                    {/* Stat Items Grid */}
                    <div className="stats-row">
                      <div className="stat-box">
                        <span className="stat-label">에버리지</span>
                        <span className="stat-value">{stats.average.toFixed(3)}</span>
                        {stats.ranks.average ? (
                          <span className="stat-rank">{stats.ranks.average}위</span>
                        ) : (
                          <span className="stat-rank">-</span>
                        )}
                      </div>
                      
                      <div className="stat-box">
                        <span className="stat-label">하이런</span>
                        <span className="stat-value">{stats.highrun}점</span>
                        {stats.ranks.highrun ? (
                          <span className="stat-rank">{stats.ranks.highrun}위</span>
                        ) : (
                          <span className="stat-rank">-</span>
                        )}
                      </div>

                      <div className="stat-box">
                        <span className="stat-label">전체 승률</span>
                        <span className="stat-value">{stats.winRate}%</span>
                        {stats.ranks.winRate ? (
                          <span className="stat-rank">{stats.ranks.winRate}위</span>
                        ) : (
                          <span className="stat-rank">-</span>
                        )}
                      </div>
                    </div>

                    {/* Detailed Match Win/Loss Record */}
                    <div className="record-details">
                      <div className="record-text">
                        <span>전적: <strong>{stats.win}승 {stats.draw}무 {stats.loss}패</strong></span>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p>선택한 기간({activeTab === 'monthly' ? '월간' : '전체'})의 공식 기록이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* Card Footer Decoration */}
              <div className="card-decor-bar"></div>
            </article>
          )
        })}

        {processedMembers.length === 0 && (
          <div className="no-results-card">
            <p>검색 조건에 맞는 멤버가 존재하지 않습니다.</p>
          </div>
        )}
      </main>

      <footer className="dashboard-footer-info">
        <p>Copyright © 2026 Billizone Club Sync. All Rights Reserved. Data source parsed from Billizone Public API.</p>
      </footer>
    </div>
  )
}

export default App
