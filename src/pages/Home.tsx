import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-badge">💬 9shot Members • Club Dashboard</div>
        <h1>오늘도 함께 치는 분위기,</h1>
        <p>
          9shot 멤버들을 위한 랭킹과 정산을 한눈에 확인할 수 있는
          카카오톡 같은 첫 화면으로 바꿨습니다.
        </p>

        <div className="home-card-row">
          <article className="home-card">
            <h2>🏓 랭킹</h2>
            <p>최근 경기 결과와 순위를 바로 확인해 보세요.</p>
            <Link className="home-card-link" to="/9shot">
              랭킹 보기
            </Link>
          </article>

          <article className="home-card secondary">
            <h2>💸 정산</h2>
            <p>참석자별 정산 현황을 깔끔하게 정리해 드립니다.</p>
            <Link className="home-card-link secondary" to="/n1">
              정산 보기
            </Link>
          </article>
        </div>
      </section>
    </div>
  )
}

export default Home
