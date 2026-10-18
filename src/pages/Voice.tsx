import React, { useState, useEffect, useRef } from 'react'
import '../styles/voice.css'

const MAX_SLOTS = 9

export default function Voice() {
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [speakingText, setSpeakingText] = useState<string | null>(null)
  const [customText, setCustomText] = useState<string>('')
  const [words, setWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voice_custom_words')
      if (saved) {
        const parsed = JSON.parse(saved)
        // 기존 4개/9개 기본 문구 등 레거시 데이터는 0개로 깔끔히 초기화
        const isLegacy =
          Array.isArray(parsed) &&
          ((parsed.length === 4 && parsed.includes('물 주세요')) ||
            (parsed.length === 9 && parsed.includes('맞아')))
        if (isLegacy) return []
        return Array.isArray(parsed) ? parsed.slice(0, MAX_SLOTS) : []
      }
      return []
    } catch {
      return []
    }
  })

  // 단어 목록 변경 시 로컬 스토리지에 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem('voice_custom_words', JSON.stringify(words))
    } catch {
      // ignore
    }
  }, [words])

  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showInfo, setShowInfo] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isFirstSpeakRef = useRef<boolean>(true)
  const bestVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // 텍스트 길이에 따라 1줄, 2줄, 3줄... 최대 5줄까지 자연스럽게 높이 자동 조절 (5줄 이상은 스크롤)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 152)
    el.style.height = `${Math.max(56, newHeight)}px`
  }, [customText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (customText.trim()) {
        speak(customText.trim())
      }
    }
  }

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
          ; (window as any).__voiceUtterance = utterance

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

  const handleAddWord = () => {
    if (!customText.trim()) return
    const trimmed = customText.trim()
    if (words.includes(trimmed)) {
      speak(trimmed)
      setCustomText('')
      return
    }
    if (words.length >= MAX_SLOTS) {
      alert('9개 자리가 모두 채워졌습니다. 기존 단어를 삭제 후 등록해 주세요.')
      return
    }
    setWords([...words, trimmed])
    setCustomText('')
  }

  const handleDeleteWord = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setWords(words.filter((_, idx) => idx !== indexToDelete))
  }

  return (
    <div className="voice-container">
      {/* Ambient background glows */}
      <div className="voice-bg-glow-1" />
      <div className="voice-bg-glow-2" />

      {/* Top Floating App Bar (Ultra Minimal & Modern) */}
      <header className="voice-top-bar">
        <div
          className="voice-brand"
          onClick={() => setShowInfo((prev) => !prev)}
          title="안내 및 로그 토글"
        >
          <span className="voice-brand-sub">Voice Assist</span>
        </div>

        {/* Dynamic Island Voice Status (Only visible while actively speaking) */}
        {speakingText && (
          <div className="voice-island-capsule">
            <span className="voice-soundwave-bars">
              <span className="voice-soundwave-bar" />
              <span className="voice-soundwave-bar" />
              <span className="voice-soundwave-bar" />
            </span>
            <span className="voice-island-text">{speakingText}</span>
            <button
              type="button"
              className="voice-island-stop"
              onClick={stopSpeaking}
              title="음성 정지"
            >
              ⏹
            </button>
          </div>
        )}

        {/* Action icons on top right */}
        <div className="voice-top-actions">
          <button
            type="button"
            className={`voice-icon-btn ${showInfo ? 'is-active' : ''}`}
            onClick={() => setShowInfo((prev) => !prev)}
            title="정보/로그"
            aria-label="정보 토글"
          >
            ⓘ
          </button>
          <button
            type="button"
            className={`voice-icon-btn ${showSettings ? 'is-active' : ''}`}
            onClick={() => setShowSettings((prev) => !prev)}
            title="목소리 설정"
            aria-label="설정 토글"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Info / Log Card (Toggled only) */}
      {showInfo && (
        <section className="voice-info-card">
          <div className="voice-info-card-header">
            <h4>Voice Assist</h4>
            <button
              type="button"
              className="voice-custom-del"
              onClick={() => setShowInfo(false)}
            >
              ✕
            </button>
          </div>
          <p className="voice-info-card-desc">
            버튼을 누르면 상대방에게 선명하고 자연스러운 음성이 스피커로 즉시 재생되는 의사소통 보조 도구입니다.
          </p>
          {debugLog && (
            <div className="voice-info-log">
              <span>{debugLog}</span>
            </div>
          )}
        </section>
      )}

      {/* 9-Slot Unified Neumorphic Grid (0개에서 시작, + 등록 시 1개씩 슬롯에 채워짐) */}
      <section className="voice-grid-section">
        <div className="voice-grid-header">
          <span className="voice-grid-title">자주 쓰는 표현</span>
          <span className="voice-grid-badge">
            {words.length} / {MAX_SLOTS}
          </span>
        </div>

        <div className="voice-drops-grid">
          {Array.from({ length: MAX_SLOTS }).map((_, index) => {
            const word = words[index]
            if (word) {
              const isActive = speakingText === word
              return (
                <div key={index} className="drop-btn-slot">
                  <button
                    type="button"
                    className={`drop-btn ${isActive ? 'is-active-speaker' : ''}`}
                    onClick={() => speak(word)}
                  >
                    <span
                      className="drop-text"
                      style={{
                        fontSize:
                          word.length > 8 ? '13px' : word.length > 5 ? '16px' : '20px',
                      }}
                    >
                      {word}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="drop-btn-del"
                    onClick={(e) => handleDeleteWord(index, e)}
                    title={`"${word}" 삭제`}
                    aria-label={`"${word}" 삭제`}
                  >
                    ✕
                  </button>
                </div>
              )
            }

            const isNext = index === words.length
            return (
              <div
                key={index}
                className={`drop-empty-slot ${isNext ? 'is-next' : ''}`}
                onClick={() => textareaRef.current?.focus()}
                title={isNext ? '아래에서 단어 입력 후 [+ 등록]을 눌러 추가' : '빈 자리'}
              >
                {isNext && <span className="drop-empty-plus">+</span>}
              </div>
            )
          })}
        </div>

        {words.length === 0 && (
          <div className="voice-empty-hint">
            아래 입력창에 자주 쓰는 말을 쓰고 <strong>+ 등록</strong>을 누르면 위의 9개 자리에 순서대로 원형 버튼이 채워집니다.
          </div>
        )}
      </section>

      {/* Quick Input Bar (Auto-expanding Multiline Neumorphic Suite) */}
      <form className="voice-quick-input-card" onSubmit={handleQuickSubmit}>
        <div className="voice-quick-input-wrap">
          <textarea
            ref={textareaRef}
            rows={1}
            className="voice-quick-input"
            placeholder="..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {customText.trim() && (
            <button
              type="button"
              className="voice-quick-clear-btn"
              onClick={() => setCustomText('')}
              title="입력 지우기"
            >
              ✕
            </button>
          )}
        </div>
        <div className="voice-quick-actions">
          <button
            type="submit"
            className="voice-quick-btn voice-quick-speak-btn"
            disabled={!customText.trim()}
          >
            <span className="voice-speak-icon">🔊</span>
            <span className="voice-speak-text">말하기</span>
          </button>
          {customText.trim() && (
            <button
              type="button"
              className="voice-quick-btn voice-quick-add-btn"
              onClick={handleAddWord}
              disabled={words.length >= MAX_SLOTS}
              title={words.length >= MAX_SLOTS ? '9개 자리가 모두 찼습니다' : '9개 자리에 등록'}
            >
              + 등록 {words.length >= MAX_SLOTS ? '(가득참)' : ''}
            </button>
          )}
        </div>
      </form>

      {/* Settings Card (Collapsible) */}
      {showSettings && (
        <section className="voice-settings-card">
          <div className="voice-settings-header">
            <div className="voice-settings-title">
              <span>⚙️ 목소리 속도 및 톤 설정</span>
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
    </div>
  )
}
