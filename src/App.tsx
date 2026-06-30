import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Settlement from './pages/Settlement'
import Random from './pages/Random'
import './App.css'

function App() {
  const location = useLocation()
  const showHomeLink = location.pathname !== '/'

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/9shot" element={<Ranking />} />
        <Route path="/n1" element={<Settlement />} />
        <Route path="/random" element={<Random />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showHomeLink && (
        <Link className="page-home-link" to="/">
          <span className="page-home-link-icon">⌂</span>
          <span>첫 화면</span>
        </Link>
      )}
    </>
  )
}

export default App
