import { useState } from 'react'
import { memberData } from '../data'
import heroImage from '../assets/protoss_crystal.png'

const MAX_PARTICIPANTS = 9

function Random() {
  const [entries, setEntries] = useState<Array<{ name: string; score: number }>>([])
  const [result, setResult] = useState<null | { a: any[]; b: any[]; sumA: number; sumB: number }>(null)
  const [isMatching, setIsMatching] = useState(false)

  const count = entries.length



  function removeEntry(idx: number) {
    setEntries((s) => s.filter((_, i) => i !== idx))
  }

  function togglePrefill(nick: string) {
    setEntries((s) => {
      const idx = s.findIndex((e) => e.name === nick)
      if (idx >= 0) {
        const copy = s.slice()
        copy.splice(idx, 1)
        return copy
      }
      if (s.length >= MAX_PARTICIPANTS) { alert('최대 인원입니다'); return s }
      return [...s, { name: nick, score: 25 }]
    })
  }

  function setMemberScore(nick: string, newScore: number) {
    setEntries((s) => s.map((e) => (e.name === nick ? { ...e, score: newScore } : e)))
  }

  function shuffleArray<T>(arr: T[]) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // brute-force combination helper
  function k_combinations<T>(set: T[], k: number): T[][] {
    if (k === 0) return [[]]
    if (k > set.length) return []
    if (k === set.length) return [set.slice()]
    const combos: T[][] = []
    for (let i = 0; i <= set.length - k; i++) {
      const head = set.slice(i, i + 1)
      const tail = k_combinations(set.slice(i + 1), k - 1)
      for (const t of tail) combos.push(head.concat(t))
    }
    return combos
  }

  function computeWinRates(sumA: number, sumB: number) {
    const total = sumA + sumB
    if (!total) return { a: 50, b: 50 }
    const aRate = Math.max(1, Math.min(99, Math.round((sumA / total) * 100)))
    return { a: aRate, b: 100 - aRate }
  }

  function matchTeams() {
    if (entries.length === 0) return alert('참석자를 추가하세요')
    setIsMatching(true)
    setTimeout(() => {
      let list = entries.slice()
      if (list.length % 2 === 1) {
        list.push({ name: '컴퓨터', score: 10 })
      }
      const n = list.length
      const half = n / 2
      // enumerate index combinations
      const indices = Array.from({ length: n }, (_, i) => i)
      const combos = k_combinations(indices, half)
      let bestPairs: Array<any> = []
      let bestDiff = Infinity
      const scores = list.map((p) => p.score)
      for (const combo of combos) {
        const setA = new Set(combo)
        let sumA = 0
        let sumB = 0
        const a: any[] = []
        const b: any[] = []
        for (let i = 0; i < n; i++) {
          if (setA.has(i)) { sumA += scores[i]; a.push(list[i]) }
          else { sumB += scores[i]; b.push(list[i]) }
        }
        const diff = Math.abs(sumA - sumB)
        if (diff < bestDiff) { bestDiff = diff; bestPairs = [{ a, b, sumA, sumB }] }
        else if (diff === bestDiff) bestPairs.push({ a, b, sumA, sumB })
      }
      const pick = bestPairs[Math.floor(Math.random() * bestPairs.length)]
      pick.a = shuffleArray(pick.a)
      pick.b = shuffleArray(pick.b)
      setResult({ a: pick.a, b: pick.b, sumA: pick.sumA, sumB: pick.sumB })
      setIsMatching(false)
    }, 850)
  }

  const winRates = result ? computeWinRates(result.sumA, result.sumB) : null

  return (
    <div className="home-page random-page protoss-theme">
      <div className="protoss-grid">
        <div className="protoss-hero-visual">
          <div className="protoss-visual-content">
            <div className="home-badge protoss-badge">⚔️ 9샷 팀 매칭</div>
            <h1 className="protoss-visual-title">STARCRAFT 팀 매칭</h1>
            <p className="protoss-visual-desc">공평하고 흥미진진한 A팀/B팀을 매칭해 드립니다.</p>
          </div>
          <div className="protoss-visual-img-container">
            <img src={heroImage} alt="Protoss energy crystal" className="protoss-crystal-img" />
          </div>
          <div className="protoss-hero-overlay"></div>
        </div>
        <aside className="protoss-panel protoss-sidebar">
          <div className="protoss-panel-header">
            <strong>참석 멤버 선택</strong>
          </div>
          <div className="protoss-toggle-grid">
            {memberData.map((m) => {
              const selected = entries.find((e) => e.name === m.nickname)
              return (
                <div key={m.nickname} className="protoss-toggle-row">
                  <button
                    onClick={() => togglePrefill(m.nickname)}
                    className={`protoss-chip ${selected ? 'active' : ''}`}
                  >
                    <span className="protoss-chip-dot" style={{ background: m.avatarColor }} />
                    {m.nickname}
                  </button>
                  {selected && (
                    <select
                      value={selected.score}
                      onChange={(e) => setMemberScore(m.nickname, Number(e.target.value))}
                      className="protoss-select"
                    >
                      <option value={30}>상 (30)</option>
                      <option value={25}>중 (25)</option>
                      <option value={20}>하 (20)</option>
                    </select>
                  )}
                </div>
              )
            })}
          </div>

          <div className="protoss-section protoss-entries-section">
            <div className="protoss-section-title">참석 명단 ({count}명)</div>
            <div className="protoss-entry-list">
              {entries.map((e, idx) => (
                <div key={idx} className="protoss-entry-row">
                  <div className="protoss-entry-info">
                    <span className="protoss-entry-dot" />
                    <span>{e.name}</span>
                    <span className="protoss-entry-score">{e.score === 30 ? '상' : e.score === 25 ? '중' : e.score === 20 ? '하' : '?'}</span>
                  </div>
                  <button onClick={() => removeEntry(idx)} className="protoss-text-btn">삭제</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="protoss-panel protoss-main">
          <div className="protoss-actions-row">
            <div>
              <strong>팀 매칭 설정</strong>
              <div className="protoss-subtext">기준 점수: 상(30점), 중(25점), 하(20점) | 홀수 인원일 경우 컴퓨터(10점)가 자동 추가됩니다.</div>
            </div>
            <div className="protoss-btn-row">
              <button onClick={() => setEntries([])} className="protoss-btn protoss-btn-ghost">선택 초기화</button>
              <button onClick={matchTeams} className="protoss-btn protoss-btn-primary">⚡ 팀 매칭 시작</button>
            </div>
          </div>

          <div className="protoss-results">
            {isMatching ? (
              <div className="protoss-warping-state">
                <div className="warping-portal"></div>
                <p className="warping-text">[ 밸런스 매칭 조합 계산 중... ]</p>
                <p className="warping-subtext">최적의 팀 조합을 계산하고 있습니다.</p>
              </div>
            ) : result ? (
              <>
                {/* Psionic Power Balance Meter */}
                <div className="protoss-power-meter-container">
                  <div className="power-meter-header">
                    <span>A팀 전력 {winRates?.a}%</span>
                    <span className="power-meter-title">팀 전력 분석 (Power Ratio)</span>
                    <span>B팀 전력 {winRates?.b}%</span>
                  </div>
                  <div className="power-meter-bar">
                    <div className="power-fill-a" style={{ width: `${winRates?.a}%` }}></div>
                    <div className="power-fill-b" style={{ width: `${winRates?.b}%` }}></div>
                  </div>
                </div>

                <div className="protoss-team-grid">
                  <section className="protoss-team-card templar-card">
                    <div className="protoss-team-card-header">
                      <div className="team-title-wrap">
                        <span className="team-affinity-badge blue">TEMPLAR</span>
                        <h3>A팀</h3>
                      </div>
                      <span className="protoss-winrate">승률 {winRates?.a}%</span>
                    </div>
                    <div className="protoss-team-summary">총점: {result.sumA} • 평균: {(result.sumA / result.a.length).toFixed(1)}</div>
                    <div className="protoss-team-list">
                      {result.a
                        .slice()
                        .sort((x: any, y: any) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                        .map((p: any, i: number) => (
                          <div key={i} className="protoss-team-item">
                            <span>{p.name}</span>
                            <span>{p.score === 10 ? '컴퓨터(10)' : p.score}</span>
                          </div>
                        ))}
                    </div>
                  </section>

                  <div className="protoss-vs-box">
                    <span>VS</span>
                  </div>

                  <section className="protoss-team-card nerazim-card">
                    <div className="protoss-team-card-header">
                      <div className="team-title-wrap">
                        <span className="team-affinity-badge green">NERAZIM</span>
                        <h3>B팀</h3>
                      </div>
                      <span className="protoss-winrate">승률 {winRates?.b}%</span>
                    </div>
                    <div className="protoss-team-summary">총점: {result.sumB} • 평균: {(result.sumB / result.b.length).toFixed(1)}</div>
                    <div className="protoss-team-list">
                      {result.b
                        .slice()
                        .sort((x: any, y: any) => (x.name === '컴퓨터' ? 1 : y.name === '컴퓨터' ? -1 : 0))
                        .map((p: any, i: number) => (
                          <div key={i} className="protoss-team-item">
                            <span>{p.name}</span>
                            <span>{p.score === 10 ? '컴퓨터(10)' : p.score}</span>
                          </div>
                        ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="protoss-empty-state">왼쪽 명단에서 참석할 멤버를 선택한 후 '팀 매칭 시작' 버튼을 눌러보세요!</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Random
