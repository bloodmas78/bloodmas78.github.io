import { useState } from 'react'
import { memberData } from '../data'
import heroImage from '../assets/hero.png'

const MAX_PARTICIPANTS = 9

function Random() {
  const [entries, setEntries] = useState<Array<{ name: string; score: number }>>([])
  const [result, setResult] = useState<null | { a: any[]; b: any[]; sumA: number; sumB: number }>(null)

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
  }

  const winRates = result ? computeWinRates(result.sumA, result.sumB) : null

  return (
    <div className="home-page random-page protoss-theme">
      <section className="home-hero random-hero protoss-hero">
        <div className="home-badge protoss-badge">⚔️ 팀 매칭</div>
        <h1>스타크래프트 팀 매칭</h1>
        <p>오른쪽에서 멤버를 선택하거나 직접 추가해 균형 잡힌 A팀 / B팀을 만들어보세요.</p>

        <div className="protoss-grid">
          <div className="protoss-hero-visual">
            <img src={heroImage} alt="Protoss energy crystal" />
            <div className="protoss-hero-overlay"></div>
          </div>
          <aside className="protoss-panel protoss-sidebar">
            <div className="protoss-panel-header">
              <strong>9샷 멤버 (토글)</strong>
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
              <div className="protoss-section-title">참석자 목록 ({count})</div>
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
                <strong>매칭</strong>
                <div className="protoss-subtext">상=30, 중=25, 하=20 • 홀수면 컴퓨터(10) 자동 추가</div>
              </div>
              <div className="protoss-btn-row">
                <button onClick={() => setEntries([])} className="protoss-btn protoss-btn-ghost">초기화</button>
                <button onClick={matchTeams} className="protoss-btn protoss-btn-primary">팀 짜기</button>
              </div>
            </div>

            <div className="protoss-results">
              {result ? (
                <div className="protoss-team-grid">
                  <section className="protoss-team-card">
                    <div className="protoss-team-card-header">
                      <h3>A팀</h3>
                      <span className="protoss-winrate">승률 {winRates?.a}%</span>
                    </div>
                    <div className="protoss-team-summary">총점: {result.sumA} • 평균: {(result.sumA / result.a.length).toFixed(1)}</div>
                    <div className="protoss-team-list">
                      {result.a.map((p: any, i: number) => (
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
                  <section className="protoss-team-card">
                    <div className="protoss-team-card-header">
                      <h3>B팀</h3>
                      <span className="protoss-winrate">승률 {winRates?.b}%</span>
                    </div>
                    <div className="protoss-team-summary">총점: {result.sumB} • 평균: {(result.sumB / result.b.length).toFixed(1)}</div>
                    <div className="protoss-team-list">
                      {result.b.map((p: any, i: number) => (
                        <div key={i} className="protoss-team-item">
                          <span>{p.name}</span>
                          <span>{p.score === 10 ? '컴퓨터(10)' : p.score}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="protoss-empty-state">아직 결과가 없습니다. 참석자를 추가한 뒤 '팀 짜기' 버튼을 눌러보세요.</div>
              )}
            </div>
          </main>
        </div>
      </section>
    </div>
  )
}

export default Random
