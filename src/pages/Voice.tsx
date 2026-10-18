import React, { useState, useEffect, useRef } from 'react'
import '../styles/voice.css'

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
  const isFirstSpeakRef = useRef<boolean>(true)
  const bestVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // 데스크톱 Chrome(Windows SAPI 버그) 및 모바일 환경 최적 한국어 음성 탐색
  const findBestKoreanVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices || voices.length === 0) return null

    const koVoices = voices.filter((v) => v.lang.toLowerCase().includes('ko'))
    if (koVoices.length === 0) return null

    // 1순위: Windows 데스크톱 크롬에서 첫 글자 씹힘이 전혀 없는 'Google 한국어'
    const googleVoice = koVoices.find(
      (v) => v.name.includes('Google') || v.voiceURI.includes('Google')
    )
    if (googleVoice) return googleVoice

    // 2순위: 엣지(Edge)의 고품질 Natural/Online 음성
    const naturalVoice = koVoices.find(
      (v) => v.name.includes('Natural') || v.name.includes('Online')
    )
    if (naturalVoice) return naturalVoice

    // 3순위: 시스템 기본 한국어 음성
    return koVoices[0]
  }

  // 페이지 마운트 시 TTS 엔진 사전 예열 (Pre-warm) & 설정 로드
  useEffect(() => {
    const updateVoice = () => {
      const best = findBestKoreanVoice()
      if (best) {
        bestVoiceRef.current = best
      }
    }

    // 1. 브라우저/안드로이드 TTS 백엔드 데몬 즉각 사전 연결 및 음성 로드
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      updateVoice()
      window.speechSynthesis.onvoiceschanged = updateVoice
    }

    // 2. 사용자의 최초 화면 터치/클릭 즉시 오디오 채널 선제적 기상
    const warmUpAudio = () => {
      updateVoice()
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          if (ctx.state === 'suspended') {
            ctx.resume()
          }
          // 40Hz 극저주파 미세 펄스로 하드웨어 오디오 스트림 사전 활성화
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.frequency.value = 40
          gain.gain.value = 0.01
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.05)
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener('touchstart', warmUpAudio, { once: true, passive: true })
    window.addEventListener('click', warmUpAudio, { once: true, passive: true })

    // Load saved rate & pitch
    const savedRate = localStorage.getItem('voice_rate')
    if (savedRate) setRate(parseFloat(savedRate))
    const savedPitch = localStorage.getItem('voice_pitch')
    if (savedPitch) setPitch(parseFloat(savedPitch))

    return () => {
      window.removeEventListener('touchstart', warmUpAudio)
      window.removeEventListener('click', warmUpAudio)
    }
  }, [])

  // Save custom words to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voice_custom_words', JSON.stringify(customWords))
    } catch (e) {
      console.error(e)
    }
  }, [customWords])

  const [debugLog, setDebugLog] = useState<string>('')

  // Bulletproof Speech Playback for Android (Fold 5) & iOS
  const speak = (text: string) => {
    if (!text) return

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setDebugLog('❌ 이 브라우저는 음성 합성을 지원하지 않습니다.')
      return
    }

    // 1. Haptic feedback
    if (navigator.vibrate) {
      try {
        navigator.vibrate(25)
      } catch (e) {
        console.warn(e)
      }
    }

    const isAndroid = /Android/i.test(navigator.userAgent)

    // 2. Unpause synthesis
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch (e) {
      console.warn(e)
    }

    // 3. Android Fix: DO NOT call cancel() if idle, as cancel() can crash Android Samsung TTS IPC!
    // Only cancel if actively speaking.
    if (!isAndroid && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.cancel()
      } catch (e) {
        console.warn(e)
      }
    }

    // 1.5. 스마트폰 사운드 앰프 하드웨어 즉시 강제 기상 (Wake-up Audio Pulse)
    // 귀에 들리지 않는 극저주파(40Hz) 미세 펄스를 출력하여 절전 모드의 앰프 회로를 즉각 활성화
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        if (ctx.state === 'suspended') {
          ctx.resume()
        }
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 40
        gain.gain.value = 0.02
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      }
    } catch (e) {
      // ignore
    }

    const executeSpeak = () => {
      try {
        // 문두 무음 쉼표로 자연스러운 호흡 부여
        const spokenText = text.trim().startsWith(',') ? text : `, ${text}`
        const utterance = new SpeechSynthesisUtterance(spokenText)
        utterance.volume = 1.0
        utterance.rate = rate

        // Google 한국어 음성 엔진은 '?' 문장부호 자체로 자연스러운 말끝 상승 억양(의문문)을 자체 처리합니다.
        // 인위적으로 전체 pitch를 대폭 상승(+0.3)시키면 주파수 보코더 왜곡으로 인해 말꼬리가 파르르 떨리는 현상이 발생하므로,
        // 기본 pitch를 온전히 유지하여 깨끗하고 매끄러운 질문 억양을 출력합니다.
        utterance.pitch = pitch

        // 데스크톱 크롬(Windows SAPI 버그) 및 모바일 환경 최적 음성 지정:
        // 'Google 한국어'를 명시적으로 연결하여 윈도우 기본 SAPI(Microsoft Heami)의 첫 음절 잘림 버그를 원천 차단
        const targetVoice = bestVoiceRef.current || findBestKoreanVoice()
        if (targetVoice) {
          utterance.voice = targetVoice
          utterance.lang = targetVoice.lang || 'ko-KR'
        } else {
          utterance.lang = 'ko-KR'
        }

        // Keep strong reference against Chrome GC
        utteranceRef.current = utterance
        ;(window as any).__voiceUtterance = utterance

        utterance.onstart = () => {
          setSpeakingText(text)
          setDebugLog(`🔊 소리 재생 중: "${text}"`)
        }

        utterance.onend = () => {
          setSpeakingText(null)
          setDebugLog(`✅ 재생 완료: "${text}"`)
        }

        utterance.onerror = (event: any) => {
          const errorMsg = event.error || '알 수 없는 오류'
          console.warn('Speech error:', errorMsg)
          setSpeakingText(null)
          setDebugLog(`⚠️ 음성 오류 발생: ${errorMsg} (기기 볼륨 및 TTS 설정 확인)`)
        }

        window.speechSynthesis.speak(utterance)
      } catch (err: any) {
        setDebugLog(`❌ 실행 실패: ${err.message || err}`)
      }
    }

    // 첫 실행(Cold Start) 시에는 앰프 회로가 완전히 깨어날 시간(120ms)을 대기하여 첫 글자 씹힘을 100% 차단
    if (isFirstSpeakRef.current) {
      isFirstSpeakRef.current = false
      setSpeakingText(text)
      setTimeout(executeSpeak, 120)
    } else {
      executeSpeak()
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel()
      } catch (e) {
        console.warn(e)
      }
    }
    setSpeakingText(null)
    setDebugLog('⏹️ 음성 재생을 정지했습니다.')
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
            <button
              type="button"
              className="voice-stop-btn"
              onClick={stopSpeaking}
              title="음성 정지"
            >
              ⏹ 정지
            </button>
          </div>
        )}
        {debugLog && (
          <div className="voice-debug-banner">
            <span>{debugLog}</span>
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
            className="voice-quick-btn voice-quick-add-btn"
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
        <span>💡 <strong>모바일 사운드 가이드</strong>: <br />
        • <strong>갤럭시/폴드</strong>: 측면 볼륨 버튼 누른 뒤 <strong>[⋯]</strong>을 눌러 <strong>미디어 및 시스템/알림 음량</strong>을 켜주세요.<br />
        • <strong>아이폰</strong>: 측면 <strong>무음 스위치(진동 모드)</strong>를 올려 벨소리 모드로 변경해 주세요.</span>
      </footer>
    </div>
  )
}
