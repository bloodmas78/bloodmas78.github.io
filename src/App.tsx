import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Settlement from './pages/Settlement'
import Random from './pages/Random'
import './App.css'

function App() {
  const location = useLocation()
  const showHomeLink = location.pathname !== '/'

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        document.title = '9샷 놀이터'
        break
      case '/9shot':
        document.title = '9샷 | 당구 랭킹'
        break
      case '/n1':
        document.title = '9샷 | N빵 정산'
        break
      case '/random':
        document.title = '9샷 | 스타 매칭'
        break
      default:
        document.title = '9샷 놀이터'
    }
  }, [location.pathname])

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
