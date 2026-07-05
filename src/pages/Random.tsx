import { useState } from 'react'
import { memberData } from '../data'

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

  return (
    <div className="home-page random-page">
      <section className="home-hero random-hero">
        <div className="home-badge">⚔️ 팀 매칭</div>
        <h1>스타크래프트 팀 매칭</h1>
        <p>오른쪽에서 멤버를 선택하거나 직접 추가해 균형 잡힌 A팀 / B팀을 만들어보세요.</p>

        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: 18 }}>
          <div style={{ width: 320, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10 }}>
            <strong>9샷 멤버 (토글)</strong>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {memberData.map((m) => {
                const selected = entries.find((e) => e.name === m.nickname)
                return (
                  <div key={m.nickname} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => togglePrefill(m.nickname)}
                      style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: selected ? '#34d399' : 'transparent', color: selected ? '#04201a' : undefined, cursor: 'pointer' }}
                    >
                      <span style={{ width:10,height:10,display:'inline-block',borderRadius:12,background: m.avatarColor, marginRight:8 }} />
                      {m.nickname}
                    </button>
                    {selected && (
                      <select value={selected.score} onChange={(e) => setMemberScore(m.nickname, Number(e.target.value))} style={{ padding:6,borderRadius:8 }}>
                        <option value={30}>상 (30)</option>
                        <option value={25}>중 (25)</option>
                        <option value={20}>하 (20)</option>
                      </select>
                    )}
                  </div>
                )
              })}
            </div>

            

            <div style={{ marginTop: 12 }}>
              <strong>참석자 목록 ({count})</strong>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap:8 }}>
                {entries.map((e, idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:8, borderRadius:8, background:'rgba(255,255,255,0.01)' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ width:10, height:10, borderRadius:12, background: '#94a3b8' }} />
                      <div>{e.name}</div>
                      <div style={{ marginLeft:8, padding:'4px 6px', borderRadius:6, background:'rgba(255,255,255,0.03)', color:'#9aa4b2', fontSize:12 }}>{e.score===30?'상':e.score===25?'중': e.score===20?'하':'?'}</div>
                    </div>
                    <div>
                      <button onClick={() => removeEntry(idx)} style={{ background:'transparent', border:0, color:'#ff6b6b', cursor:'pointer', fontWeight:700 }}>삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex:1, background:'rgba(255,255,255,0.02)', padding:16, borderRadius:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <strong>매칭</strong>
                <div style={{ color:'#9aa4b2', fontSize:13 }}>상=30, 중=25, 하=20 • 홀수면 컴퓨터(10) 자동 추가</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setEntries([])} style={{ padding:'8px 12px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.04)', color:'#9aa4b2' }}>초기화</button>
                <button onClick={matchTeams} style={{ padding:'8px 12px', borderRadius:8, background:'#34d399', border:0, cursor:'pointer' }}>팀 짜기</button>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              {result ? (
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ flex:1, padding:12, borderRadius:8, background:'rgba(255,255,255,0.01)' }}>
                    <h3>A팀</h3>
                    <div style={{ color:'#9aa4b2', fontSize:13 }}>총점: {result.sumA} • 평균: {(result.sumA / result.a.length).toFixed(1)}</div>
                    <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
                      {result.a.map((p:any, i:number) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between' }}><div>{p.name}</div><div style={{ color:'#9aa4b2' }}>{p.score===10? '컴퓨터(10)': p.score}</div></div>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex:1, padding:12, borderRadius:8, background:'rgba(255,255,255,0.01)' }}>
                    <h3>B팀</h3>
                    <div style={{ color:'#9aa4b2', fontSize:13 }}>총점: {result.sumB} • 평균: {(result.sumB / result.b.length).toFixed(1)}</div>
                    <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
                      {result.b.map((p:any, i:number) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between' }}><div>{p.name}</div><div style={{ color:'#9aa4b2' }}>{p.score===10? '컴퓨터(10)': p.score}</div></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color:'#9aa4b2' }}>아직 결과가 없습니다. 참석자를 추가한 뒤 '팀 짜기' 버튼을 눌러보세요.</div>
              )}
            </div>
          </div>
        </div>


      </section>
    </div>
  )
}

export default Random
