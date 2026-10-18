import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Settlement from './pages/Settlement'
import Random from './pages/Random'
import Interest from './pages/Interest'
import Voice from './pages/Voice'
import './App.css'

function App() {
  const location = useLocation()
  const showHomeLink = location.pathname !== '/'

  useEffect(() => {
    window.scrollTo(0, 0)
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
      case '/interest':
        document.title = '9샷 | 관심사 레이더'
        break
      case '/voice':
        document.title = '물방울 음성 대화기'
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
        <Route path="/interest" element={<Interest />} />
        <Route path="/voice" element={<Voice />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showHomeLink && (
        <Link className="page-home-link" to="/">
          <span className="page-home-link-icon">⌂</span>
          <span>9샷 홈</span>
        </Link>
      )}
    </>
  )
}

export default App
