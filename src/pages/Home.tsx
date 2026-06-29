import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>Welcome to 9shot Members</h1>
        <p>
          This is the gateway page for the Mania Billiard Club dashboard. Choose a
          destination below.
        </p>
        <div className="home-actions">
          <Link className="home-btn primary" to="/9shot">
            9shot Ranking
          </Link>
          <Link className="home-btn secondary" to="/n1">
            N/1
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
