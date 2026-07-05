// ──────────────────────────────────────────
// 팀 매칭 알고리즘 순수 함수
// ──────────────────────────────────────────

import type { TeamEntry, MatchResult, WinRatePair } from '../types'

/** Fisher-Yates 셔플 (원본 불변) */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 브루트포스 조합 생성기 */
export function kCombinations<T>(set: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (k > set.length) return []
  if (k === set.length) return [set.slice()]
  const combos: T[][] = []
  for (let i = 0; i <= set.length - k; i++) {
    const head = set.slice(i, i + 1)
    const tail = kCombinations(set.slice(i + 1), k - 1)
    for (const t of tail) combos.push(head.concat(t))
  }
  return combos
}

/** 양 팀 총점으로 승률 퍼센트 계산 */
export function computeWinRates(sumA: number, sumB: number): WinRatePair {
  const total = sumA + sumB
  if (!total) return { a: 50, b: 50 }
  const aRate = Math.max(1, Math.min(99, Math.round((sumA / total) * 100)))
  return { a: aRate, b: 100 - aRate }
}

/** 최적 밸런스 매칭 탐색 — 점수 차이가 최소인 조합 중 랜덤 선택 */
export function findBestMatch(entries: TeamEntry[]): MatchResult {
  const list = entries.slice()

  // 홀수 인원이면 컴퓨터 추가
  if (list.length % 2 === 1) {
    list.push({ name: '컴퓨터', score: 10 })
  }

  const n = list.length
  const half = n / 2
  const indices = Array.from({ length: n }, (_, i) => i)
  const combos = kCombinations(indices, half)
  const scores = list.map((p) => p.score)

  let bestPairs: MatchResult[] = []
  let bestDiff = Infinity

  for (const combo of combos) {
    const setA = new Set(combo)
    let sumA = 0
    let sumB = 0
    const a: TeamEntry[] = []
    const b: TeamEntry[] = []

    for (let i = 0; i < n; i++) {
      if (setA.has(i)) {
        sumA += scores[i]
        a.push(list[i])
      } else {
        sumB += scores[i]
        b.push(list[i])
      }
    }

    const diff = Math.abs(sumA - sumB)
    if (diff < bestDiff) {
      bestDiff = diff
      bestPairs = [{ a, b, sumA, sumB }]
    } else if (diff === bestDiff) {
      bestPairs.push({ a, b, sumA, sumB })
    }
  }

  const pick = bestPairs[Math.floor(Math.random() * bestPairs.length)]
  return {
    a: shuffleArray(pick.a),
    b: shuffleArray(pick.b),
    sumA: pick.sumA,
    sumB: pick.sumB,
  }
}
