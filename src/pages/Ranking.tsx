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

const bgImages = [
  '/images/bg-billiard-1.jpg',
  '/images/bg-billiard-2.jpg',
  '/images/bg-billiard-3.jpg',
  '/images/bg-billiard-4.jpg',
  '/images/bg-billiard-5.jpg'
]

function Ranking() {
  const [sortBy, setSortBy] = useState<SortKey>('average')
  const [firebaseStats, setFirebaseStats] = useState<Record<string, MemberStat>>({})
  const [bgIndex, setBgIndex] = useState(0)
  const periodLabel = monthlyLabel

  useEffect(() => {
    fetchMemberStats().then(stats => {
      const statsMap: Record<string, MemberStat> = {}
      stats.forEach(s => statsMap[s.nickname] = s)
      setFirebaseStats(statsMap)
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const rankingMembers = memberData

  const processedMembers = sortMembers(rankingMembers, sortBy, 'monthly')
  const membersWithStats = getStatsCount('monthly')
  const totalGamesCount = getTotalGames('monthly')

  const highestAverageMember = getTopMember('average', 'monthly')
  const highestHighrunMember = getTopMember('highrun', 'monthly')
  const highestWinRateMember = getTopMember('winRate', 'monthly')

  return (
    <div className="ranking-page">
      {/* Background Image and Overlays */}
      <div className="rank-bg-wrapper">
        <div className="rank-bg-overlay-1"></div>
        <div className="rank-bg-overlay-2"></div>
        {bgImages.map((src, i) => (
          <img
            key={i}
            alt="Billiard player background"
            className="rank-bg-image"
            src={src}
            style={{
              opacity: i === bgIndex ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              position: 'absolute',
              inset: 0,
              zIndex: 0
            }}
          />
        ))}
      </div>

      {/* Atmospheric Glow */}
      <div className="rank-atm-bg">
        <div className="rank-atm-glow-1"></div>
        <div className="rank-atm-glow-2"></div>
      </div>

      <div className="rank-container">
        {/* Hero Section */}
        <section className="rank-header-section animate-fade-in">
          <h1 className="rank-title">
            <span className="title-part1">매니아 당구클럽</span>
            <span className="title-part2 rank-text-glow" style={{ color: 'var(--rank-secondary-container)' }}>9샷 멤버스</span>
          </h1>
          <p className="rank-subtitle">
            안양 매니아 당구클럽 9샷 멤버들의 빌리존 랭킹 대시보드 🔥<br />
            실시간 데이터를 기반으로 멤버들의 퍼포먼스를 추적합니다.
          </p>
        </section>

        {/* Quick Stats Grid */}
        <section className="rank-stats-grid animate-slide-up">
          <div className="rank-glass-card rank-stat-item">
            <span className="rank-stat-label">전체 멤버</span>
            <p className="rank-stat-value">{rankingMembers.length}명</p>
            <div className="cue-tracker-bg">
              <div className="cue-tracker-fill" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="rank-glass-card rank-stat-item">
            <span className="rank-stat-label">{periodLabel} 기록 보유</span>
            <p className="rank-stat-value">{membersWithStats}명</p>
            <div className="cue-tracker-bg">
              <div className="cue-tracker-fill" style={{ width: `${(membersWithStats / memberData.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="rank-glass-card rank-stat-item">
            <span className="rank-stat-label">기록된 총 경기</span>
            <p className="rank-stat-value">{totalGamesCount}게임</p>
            <div className="cue-tracker-bg">
              <div className="cue-tracker-fill" style={{ width: totalGamesCount > 0 ? '100%' : '0%' }}></div>
            </div>
          </div>
          <div className="rank-glass-card rank-stat-item">
            <span className="rank-stat-label">최고 에버리지</span>
            <p className="rank-stat-value highlight">
              {highestAverageMember ? highestAverageMember.stats.average.toFixed(3) : '-'}
            </p>
            {highestAverageMember && <span style={{ fontSize: '12px', color: 'var(--rank-on-surface-variant)' }}>{highestAverageMember.member.nickname}</span>}
          </div>
          <div className="rank-glass-card rank-stat-item">
            <span className="rank-stat-label">최고 하이런</span>
            <p className="rank-stat-value highlight">
              {highestHighrunMember ? `${highestHighrunMember.stats.highrun}점` : '-'}
            </p>
            {highestHighrunMember && <span style={{ fontSize: '12px', color: 'var(--rank-on-surface-variant)' }}>{highestHighrunMember.member.nickname}</span>}
          </div>
          <div className="rank-glass-card rank-stat-item">
            <span className="rank-stat-label">최고 승률</span>
            <p className="rank-stat-value highlight">
              {highestWinRateMember ? `${highestWinRateMember.stats.winRate}%` : '-'}
            </p>
            {highestWinRateMember && <span style={{ fontSize: '12px', color: 'var(--rank-on-surface-variant)' }}>{highestWinRateMember.member.nickname}</span>}
          </div>
        </section>

        {/* Tab Bar / Section Header */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="rank-list-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 className="rank-list-title">멤버 랭킹</h2>
              <p className="rank-list-subtitle">{periodLabel}·기록 {membersWithStats}명 / 전체 {rankingMembers.length}명</p>
            </div>
            <div className="rank-tabs">
              <button
                onClick={() => setSortBy('average')}
                className={`rank-tab-btn ${sortBy === 'average' ? 'active' : ''}`}
              >
                에버리지
              </button>
              <button
                onClick={() => setSortBy('highrun')}
                className={`rank-tab-btn ${sortBy === 'highrun' ? 'active' : ''}`}
              >
                하이런
              </button>
              <button
                onClick={() => setSortBy('winRate')}
                className={`rank-tab-btn ${sortBy === 'winRate' ? 'active' : ''}`}
              >
                승률
              </button>
            </div>
          </div>

          {/* Members Grid */}
          <div className="rank-members-grid">
            {processedMembers.map((member) => {
              const stats = getStats(member, 'monthly')

              return (
                <div key={member.nickname} className="rank-glass-card rank-member-card">
                  <div className="rank-card-glow"></div>

                  <div className="rank-member-header">
                    <div className="rank-member-avatar" style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined icon">person</span>
                      {stats && stats.ranks[sortBy] && (
                        <div style={{ position: 'absolute', bottom: -8, right: -8, background: 'var(--rank-secondary-container)', color: '#002022', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {stats.ranks[sortBy]}
                        </div>
                      )}
                    </div>
                    <div className="rank-member-info">
                      <h3 className="rank-member-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {member.nickname}
                        {stats && stats.ranks[sortBy] === 1 && (
                          <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '20px' }} title="1위">social_leaderboard</span>
                        )}
                      </h3>
                      <p className="rank-member-sub">
                        {stats ? `${periodLabel} 기록 보유 (RANK #${stats.ranks[sortBy] ?? '-'})` : '아직 쪼렙.. (기록 없음)'}
                      </p>
                    </div>
                  </div>

                  {stats ? (
                    <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
                      <div className="rank-stats-row" style={{ marginBottom: '16px' }}>
                        <div className="rank-stat-col">
                          <span className="rank-stat-col-label">에버리지</span>
                          <span className="rank-stat-col-value highlight">{stats.average.toFixed(3)}</span>
                        </div>
                        <div className="rank-stat-col">
                          <span className="rank-stat-col-label">하이런</span>
                          <span className="rank-stat-col-value">{stats.highrun}점</span>
                        </div>
                        <div className="rank-stat-col">
                          <span className="rank-stat-col-label">승률</span>
                          <span className="rank-stat-col-value">{stats.winRate}%</span>
                        </div>
                      </div>

                      {/* Cue Tracker for WinRate */}
                      <div className="cue-tracker-bg" style={{ marginTop: '0', marginBottom: '8px' }}>
                        <div className="cue-tracker-fill" style={{ width: `${stats.winRate}%` }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--rank-on-surface-variant)' }}>
                        <span>빌리존 {stats.win}승 {stats.draw}무 {stats.loss}패</span>
                        <span>총 {stats.win + stats.draw + stats.loss}경기</span>
                      </div>

                      {firebaseStats[member.nickname] && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--rank-secondary-container)' }}>
                          <span>스타 팀매칭 {firebaseStats[member.nickname].wins}승 {firebaseStats[member.nickname].losses}패</span>
                          <span>총 {firebaseStats[member.nickname].wins + firebaseStats[member.nickname].losses}경기</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rank-member-stats-box">
                      <span className="material-symbols-outlined rank-no-data-icon">warning</span>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '18px', color: 'var(--rank-on-surface)', fontWeight: 600, marginBottom: '8px' }}>
                          {periodLabel} 공식 기록 없음 😅
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--rank-on-surface-variant)', lineHeight: 1.5, padding: '0 16px' }}>
                          빌리존 랭킹은 10경기 이상 치러야 인정해 줍니다! {periodLabel} 기준 10게임 미만이면 랭킹에 안 떠요 ㅠㅠ 분발하세요!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>



    </div>
  )
}

export default Ranking
