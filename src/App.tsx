import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Ranking from './pages/Ranking'
import Settlement from './pages/Settlement'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/9shot" element={<Ranking />} />
      <Route path="/n1" element={<Settlement />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
