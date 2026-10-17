import React, { useState, useEffect, useRef } from 'react'
import '../styles/voice.css'

interface VoiceOption {
  voice: SpeechSynthesisVoice
  name: string
  lang: string
}

interface WordItem {
  id: string
  text: string
  sub?: string
  color: 'cyan' | 'emerald' | 'rose' | 'indigo' | 'amber'
}

const DEFAULT_WORDS: WordItem[] = [
  { id: '1', text: '맞아', sub: '동의', color: 'cyan' },
  { id: '2', text: '좋아', sub: '찬성', color: 'emerald' },
  { id: '3', text: '그래', sub: '긍정', color: 'cyan' },
  { id: '4', text: '알았어', sub: '이해', color: 'cyan' },
  { id: '5', text: '나이스', sub: '칭찬', color: 'emerald' },
  { id: '6', text: '나도', sub: '공감', color: 'indigo' },
  { id: '7', text: '싫어', sub: '거절', color: 'rose' },
  { id: '8', text: '안돼', sub: '부정', color: 'rose' },
  { id: '9', text: '뭐래', sub: '장난/의아', color: 'amber' },
]

export default function Voice() {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('')
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [speakingText, setSpeakingText] = useState<string | null>(null)
  const [customText, setCustomText] = useState<string>('')
  const [customWords, setCustomWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voice_custom_words')
      return saved ? JSON.parse(saved) : ['물 주세요', '잠깐만요', '고마워요', '배고파요']
    } catch {
      return ['물 주세요', '잠깐만요', '고마워요', '배고파요']
    }
  })

  const [showSettings, setShowSettings] = useState<boolean>(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load available voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return

      const allVoices = window.speechSynthesis.getVoices()
      if (!allVoices || allVoices.length === 0) return

      // Sort: Korean voices first, then others
      const formatted = allVoices.map((v) => ({
        voice: v,
        name: `${v.name} (${v.lang})`,
        lang: v.lang,
      }))

      formatted.sort((a, b) => {
        const aIsKo = a.lang.toLowerCase().includes('ko')
        const bIsKo = b.lang.toLowerCase().includes('ko')
        if (aIsKo && !bIsKo) return -1
        if (!aIsKo && bIsKo) return 1
        return a.name.localeCompare(b.name)
      })

      setVoices(formatted)

      // Auto-select preferred voice (saved or first Korean voice)
      const savedURI = localStorage.getItem('voice_selected_uri')
      if (savedURI && formatted.some((v) => v.voice.voiceURI === savedURI)) {
        setSelectedVoiceURI(savedURI)
      } else {
        const firstKo = formatted.find((v) => v.lang.toLowerCase().includes('ko'))
        if (firstKo) {
          setSelectedVoiceURI(firstKo.voice.voiceURI)
        } else if (formatted.length > 0) {
          setSelectedVoiceURI(formatted[0].voice.voiceURI)
        }
      }
    }

    updateVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    // Load saved rate & pitch
    const savedRate = localStorage.getItem('voice_rate')
    if (savedRate) setRate(parseFloat(savedRate))
    const savedPitch = localStorage.getItem('voice_pitch')
    if (savedPitch) setPitch(parseFloat(savedPitch))
  }, [])

  // Save custom words to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voice_custom_words', JSON.stringify(customWords))
    } catch (e) {
      console.error(e)
    }
  }, [customWords])

  // Play Speech
  const speak = (text: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return

    // Haptic feedback if supported on mobile
    if (navigator.vibrate) {
      try {
        navigator.vibrate(25)
      } catch (e) {
        console.warn(e)
      }
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Unpause if stuck
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }

    const createAndSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.volume = 1.0
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.lang = 'ko-KR'

      // Check if chosen voice actually exists on this device
      if (selectedVoiceURI) {
        const target = voices.find((v) => v.voice.voiceURI === selectedVoiceURI)
        if (target && target.voice) {
          utterance.voice = target.voice
          utterance.lang = target.voice.lang || 'ko-KR'
        }
      }

      // GC Protection
      utteranceRef.current = utterance
      ;(window as any).__voiceUtterance = utterance

      utterance.onstart = () => {
        setSpeakingText(text)
      }

      utterance.onend = () => {
        setSpeakingText(null)
      }

      utterance.onerror = (err) => {
        console.warn('TTS playback note:', err)
        setSpeakingText(null)
      }

      window.speechSynthesis.speak(utterance)
    }

    if (isMobile) {
      // Mobile Safari / Chrome REQUIRE synchronous speak() directly within the touch event stack!
      // Any setTimeout will lose the user gesture token and block playback.
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      createAndSpeak()
    } else {
      // Desktop Chrome fix: cancel followed by short microtask
      window.speechSynthesis.cancel()
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
        createAndSpeak()
      }, 50)
    }
  }

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedVoiceURI(val)
    localStorage.setItem('voice_selected_uri', val)
  }

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setRate(val)
    localStorage.setItem('voice_rate', val.toString())
  }

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setPitch(val)
    localStorage.setItem('voice_pitch', val.toString())
  }

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customText.trim()) return
    speak(customText.trim())
  }

  const handleAddCustomWord = () => {
    if (!customText.trim()) return
    const trimmed = customText.trim()
    if (!customWords.includes(trimmed)) {
      setCustomWords([...customWords, trimmed])
    }
    setCustomText('')
  }

  const handleDeleteCustomWord = (wordToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomWords(customWords.filter((w) => w !== wordToDelete))
  }

  return (
    <div className="voice-container">
      {/* Ambient background glows */}
      <div className="voice-bg-glow-1" />
      <div className="voice-bg-glow-2" />

      {/* Header */}
      <header className="voice-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
          <div className="voice-badge" style={{ margin: 0 }}>
            <span className="voice-badge-dot" />
            <span>Voice Communicator</span>
          </div>
          <button
            type="button"
            className="voice-setting-toggle-btn"
            onClick={() => setShowSettings((prev) => !prev)}
            aria-label="설정 토글"
          >
            ⚙️ 목소리 설정 {showSettings ? '닫기 ▲' : '열기 ▼'}
          </button>
        </div>
        <h1 className="voice-title">물방울 음성 대화기</h1>
        <p className="voice-subtitle">
          버튼을 누르면 스피커로 즉시 음성이 나옵니다
        </p>
        {speakingText && (
          <div className="voice-speaking-banner">
            <span className="voice-soundwave-bars">
              <span className="voice-soundwave-bar" />
              <span className="voice-soundwave-bar" />
              <span className="voice-soundwave-bar" />
            </span>
            <span>재생 중: "{speakingText}"</span>
          </div>
        )}
      </header>

      {/* Main 9 Water Drop Buttons */}
      <section className="voice-grid-section">
        <div className="voice-section-title">핵심 표현 (9 Drops)</div>
        <div className="voice-drops-grid">
          {DEFAULT_WORDS.map((item) => {
            const isActive = speakingText === item.text
            return (
              <button
                key={item.id}
                type="button"
                className={`drop-btn drop-${item.color} ${isActive ? 'is-active-speaker' : ''}`}
                onClick={() => speak(item.text)}
              >
                <span className="drop-text">{item.text}</span>
                {item.sub && <span className="drop-sub">{item.sub}</span>}
              </button>
            )
          })}
        </div>
      </section>

      {/* Quick Input Bar */}
      <form className="voice-quick-input-card" onSubmit={handleQuickSubmit}>
        <input
          type="text"
          className="voice-quick-input"
          placeholder="직접 입력하여 말하기 (예: 물 좀 주세요)"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
        />
        <button type="submit" className="voice-quick-btn">
          🔊 말하기
        </button>
        {customText.trim() && (
          <button
            type="button"
            className="voice-quick-btn"
            style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={handleAddCustomWord}
            title="자주 쓰는 말로 등록"
          >
            + 등록
          </button>
        )}
      </form>

      {/* Custom Registered Phrases */}
      {customWords.length > 0 && (
        <section className="voice-custom-section">
          <div className="voice-section-title">등록된 빠른 문장들 (탭하여 즉시 말하기)</div>
          <div className="voice-custom-tags">
            {customWords.map((word) => (
              <div
                key={word}
                className="voice-custom-pill"
                onClick={() => speak(word)}
              >
                <span>💬 {word}</span>
                <span
                  className="voice-custom-del"
                  onClick={(e) => handleDeleteCustomWord(word, e)}
                  title="삭제"
                >
                  ✕
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Settings Card (Collapsible) */}
      {showSettings && (
        <section className="voice-settings-card" style={{ marginTop: '24px' }}>
          <div className="voice-settings-header">
            <div className="voice-settings-title">
              <span>⚙️ 목소리 및 사운드 설정</span>
            </div>
            <button
              type="button"
              className="voice-custom-del"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
          </div>

          <div className="voice-controls-grid">
            <div className="voice-control-group">
              <label className="voice-control-label">
                <span>목소리 종류 선택</span>
                <span>{voices.filter((v) => v.lang.includes('ko')).length}개 한국어 음성</span>
              </label>
              <select
                className="voice-select"
                value={selectedVoiceURI}
                onChange={handleVoiceChange}
              >
                <option value="">기본 한국어 음성 (시스템 권장)</option>
                {voices.map((v) => (
                  <option key={v.voice.voiceURI} value={v.voice.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="voice-sliders">
              <div className="voice-control-group">
                <label className="voice-control-label">
                  <span>말하기 속도</span>
                  <span>{rate.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  className="voice-slider"
                  min="0.6"
                  max="1.5"
                  step="0.1"
                  value={rate}
                  onChange={handleRateChange}
                />
              </div>

              <div className="voice-control-group">
                <label className="voice-control-label">
                  <span>음높이 (톤 / 성별 느낌)</span>
                  <span>{pitch < 1 ? '남성/낮은톤' : pitch === 1 ? '보통' : '여성/높은톤'} ({pitch.toFixed(1)})</span>
                </label>
                <input
                  type="range"
                  className="voice-slider"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={handlePitchChange}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mobile Audio Tip */}
      <footer className="voice-mobile-tip">
        <span>💡 <strong>모바일 사운드 팁</strong>: 아이폰은 측면 <strong>무음 스위치(진동 모드)</strong>가 켜져 있으면 웹 오디오가 무음 처리됩니다. 무음 모드를 해제하고 미디어 볼륨을 확인해 주세요.</span>
      </footer>
    </div>
  )
}
