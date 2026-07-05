import { Link } from 'react-router-dom'
import { memberData, monthlyLabel } from '../data'

function Home() {
  return (
    <div className="home-page">
      {/* Dynamic Ambient Background Blobs */}
      <div className="home-bg-blobs" aria-hidden="true">
        <div className="home-blob blob-1"></div>
        <div className="home-blob blob-2"></div>
        <div className="home-blob blob-3"></div>
      </div>

      <section className="home-hero">
        <header className="home-header">
          <div className="home-badge">
            <span className="home-badge-dot"></span>
            <span>9shot Members Portal</span>
          </div>
          <h1>
            오늘도 신나는 <span className="highlight-gradient">9샷 멤버스</span>
          </h1>
          <p>
            안양 매니아 당구클럽 동호인들의 전용 쉼터입니다.<br />
            실시간 랭킹 확인, 스타크래프트 대전, 투명한 모임비 정산까지 한눈에 즐겨보세요!
          </p>
        </header>

        {/* Quick Stats Dashboard Banner */}
        <div className="home-quick-stats-bar">
          <div className="home-quick-stat">
            <span className="stat-icon">👥</span>
            <div className="stat-info">
              <span className="stat-label">등록 멤버</span>
              <span className="stat-value">{memberData.length}명</span>
            </div>
          </div>
          <div className="home-quick-stat">
            <span className="stat-icon">📅</span>
            <div className="stat-info">
              <span className="stat-label">활성 시즌</span>
              <span className="stat-value">{monthlyLabel}</span>
            </div>
          </div>
          <div className="home-quick-stat">
            <span className="stat-icon">🎱</span>
            <div className="stat-info">
              <span className="stat-label">당구클럽</span>
              <span className="stat-value">매니아</span>
            </div>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="home-card-row">
          <article className="home-card ranking-card">
            <div className="card-badge">BILLIARD</div>
            <div className="card-icon-wrapper">🎱</div>
            <div className="card-content">
              <h2>🏓 9샷 랭킹</h2>
              <p>이번 달 에버리지, 하이런, 승률 랭킹과 개인 전적 대시보드를 확인하세요.</p>
            </div>
            <Link className="home-card-link ranking-btn" to="/9shot">
              <span>랭킹 페이지 이동</span>
              <span className="arrow-icon">→</span>
            </Link>
          </article>

          <article className="home-card matching-card">
            <div className="card-badge">STARCRAFT</div>
            <div className="card-icon-wrapper">⚔️</div>
            <div className="card-content">
              <h2>🎮 Starcraft 팀 매칭</h2>
              <p>실력(상/중/하)을 기준으로 균형 잡힌 팀 매칭을 지원합니다.</p>
            </div>
            <Link className="home-card-link matching-btn" to="/random">
              <span>팀 짜러 가기</span>
              <span className="arrow-icon">→</span>
            </Link>
          </article>

          <article className="home-card settlement-card">
            <div className="card-badge">FINANCE</div>
            <div className="card-icon-wrapper">💸</div>
            <div className="card-content">
              <h2>💸 모임비 정산</h2>
              <p>모임 1차/2차 회비를 N분의 1로 정산합니다.</p>
            </div>
            <Link className="home-card-link settlement-btn" to="/n1">
              <span>정산기 실행</span>
              <span className="arrow-icon">→</span>
            </Link>
          </article>

        </div>
      </section>
    </div>
  )
}

export default Home
