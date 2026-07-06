import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  increment,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  deleteDoc
} from 'firebase/firestore'

// 멤버 전적 타입
export interface MemberStat {
  nickname: string
  wins: number
  losses: number
}

// 1. 모든 멤버의 전적 가져오기
export async function fetchMemberStats(): Promise<MemberStat[]> {
  try {
    const membersCol = collection(db, 'members')
    const snapshot = await getDocs(membersCol)
    
    const stats: MemberStat[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      stats.push({
        nickname: docSnap.id,
        wins: data.wins || 0,
        losses: data.losses || 0,
      })
    })
    
    return stats
  } catch (error) {
    console.error('Error fetching member stats:', error)
    return []
  }
}

// 2. 게임 결과 업데이트 (Batch 처리)
export async function updateGameResult(winners: string[], losers: string[]): Promise<boolean> {
  try {
    const batch = writeBatch(db)

    // 승리 멤버 업데이트
    for (const winner of winners) {
      if (winner === '컴퓨터') continue // 컴퓨터 전적 제외
      const ref = doc(db, 'members', winner)
      // 문서가 없을 수도 있으므로 setDoc merge 모드로 초기화 후 increment 처리하는 것이 안전하지만,
      // Firestore에서 increment는 필드가 없으면 자동으로 1이 됨. 단, 문서 자체가 없으면 에러가 날 수 있음.
      // 따라서 문서가 존재하는지 확인하거나 set을 사용해야 함.
      
      const snap = await getDoc(ref)
      if (snap.exists()) {
        batch.update(ref, { wins: increment(1) })
      } else {
        batch.set(ref, { wins: 1, losses: 0 })
      }
    }

    // 패배 멤버 업데이트
    for (const loser of losers) {
      if (loser === '컴퓨터') continue
      const ref = doc(db, 'members', loser)
      
      const snap = await getDoc(ref)
      if (snap.exists()) {
        batch.update(ref, { losses: increment(1) })
      } else {
        batch.set(ref, { wins: 0, losses: 1 })
      }
    }

    await batch.commit()
    return true
  } catch (error) {
    console.error('Error updating game result:', error)
    return false
  }
}

// 3. 상세 스코어 기반 게임 결과 업데이트
export async function updateGameResultDetailed(teamA: string[], teamB: string[], aWins: number, aLosses: number, bWins: number, bLosses: number): Promise<boolean> {
  try {
    const batch = writeBatch(db)

    for (const member of teamA) {
      if (member === '컴퓨터') continue
      const ref = doc(db, 'members', member)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        batch.update(ref, { wins: increment(aWins), losses: increment(aLosses) })
      } else {
        batch.set(ref, { wins: aWins, losses: aLosses })
      }
    }

    for (const member of teamB) {
      if (member === '컴퓨터') continue
      const ref = doc(db, 'members', member)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        batch.update(ref, { wins: increment(bWins), losses: increment(bLosses) })
      } else {
        batch.set(ref, { wins: bWins, losses: bLosses })
      }
    }

    await batch.commit()
    return true
  } catch (error) {
    console.error('Error updating detailed game result:', error)
    return false
  }
}

export interface MatchRecord {
  id?: string
  teamA: string[]
  teamB: string[]
  scoreA: number
  scoreB: number
  setResults?: ('A' | 'B' | null)[]
  status: 'ongoing' | 'completed'
  createdAt: number
}

// 4. 새 매치 생성
export async function createMatch(teamA: string[], teamB: string[]): Promise<string | null> {
  try {
    const matchesCol = collection(db, 'matches')
    const docRef = await addDoc(matchesCol, {
      teamA,
      teamB,
      scoreA: 0,
      scoreB: 0,
      setResults: [null, null, null, null, null],
      status: 'ongoing',
      createdAt: Date.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating match:', error)
    return null
  }
}

// 5. 상태별 매치 가져오기 (ongoing / completed)
export async function fetchMatches(status: 'ongoing' | 'completed'): Promise<MatchRecord[]> {
  try {
    const matchesCol = collection(db, 'matches')
    // 복합 인덱스 에러 방지를 위해 orderBy를 빼고 클라이언트에서 정렬합니다.
    const q = query(matchesCol, where('status', '==', status))
    const snapshot = await getDocs(q)
    
    const matches: MatchRecord[] = []
    snapshot.forEach((docSnap) => {
      matches.push({ id: docSnap.id, ...docSnap.data() } as MatchRecord)
    })
    
    // createdAt 기준 내림차순 정렬
    return matches.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error(`Error fetching ${status} matches:`, error)
    return []
  }
}

// 6. 진행 중인 매치 스코어 세트 업데이트
export async function updateMatchSetResult(matchId: string, setResults: ('A' | 'B' | null)[]): Promise<boolean> {
  try {
    const scoreA = setResults.filter(r => r === 'A').length
    const scoreB = setResults.filter(r => r === 'B').length
    const matchRef = doc(db, 'matches', matchId)
    await updateDoc(matchRef, { scoreA, scoreB, setResults })
    return true
  } catch (error) {
    console.error('Error updating match set result:', error)
    return false
  }
}

// 7. 매치 종료 처리 (스코어를 개인 전적에 반영)
export async function completeMatch(matchId: string, scoreA: number, scoreB: number, teamA: string[], teamB: string[]): Promise<boolean> {
  try {
    const matchRef = doc(db, 'matches', matchId)
    await updateDoc(matchRef, { scoreA, scoreB, status: 'completed' })
    // 전적 누적 (스코어 그대로 승패로 반영. 예: A팀 3, B팀 2 라면, A팀 3승2패, B팀 2승3패)
    await updateGameResultDetailed(teamA, teamB, scoreA, scoreB, scoreB, scoreA)
    return true
  } catch (error) {
    console.error('Error completing match:', error)
    return false
  }
}

// 8. 매치 취소 (삭제)
export async function deleteMatch(matchId: string): Promise<boolean> {
  try {
    const matchRef = doc(db, 'matches', matchId)
    await deleteDoc(matchRef)
    return true
  } catch (error) {
    console.error('Error deleting match:', error)
    return false
  }
}

// 9. 종료된 매치 삭제 및 전적 롤백 (어드민 전용)
export async function deleteCompletedMatch(match: MatchRecord): Promise<boolean> {
  try {
    // 1. 해당 매치의 스코어만큼 전적에서 빼기 (음수를 넣으면 increment가 감소함)
    await updateGameResultDetailed(
      match.teamA, 
      match.teamB, 
      -match.scoreA, // A팀 승리 취소
      -match.scoreB, // A팀 패배(B팀 승리) 취소
      -match.scoreB, // B팀 승리 취소
      -match.scoreA  // B팀 패배(A팀 승리) 취소
    )
    // 2. 문서 삭제
    const matchRef = doc(db, 'matches', match.id!)
    await deleteDoc(matchRef)
    return true
  } catch (error) {
    console.error('Error deleting completed match:', error)
    return false
  }
}

// 10. 종료된 매치 수정 (상태를 ongoing으로 되돌리고 전적 롤백)
export async function revertMatchToOngoing(match: MatchRecord): Promise<boolean> {
  try {
    // 1. 해당 매치의 스코어만큼 전적에서 빼기 (롤백)
    await updateGameResultDetailed(
      match.teamA, 
      match.teamB, 
      -match.scoreA,
      -match.scoreB,
      -match.scoreB,
      -match.scoreA
    )
    // 2. 문서 상태를 ongoing으로 변경
    const matchRef = doc(db, 'matches', match.id!)
    await updateDoc(matchRef, { status: 'ongoing' })
    return true
  } catch (error) {
    console.error('Error reverting match to ongoing:', error)
    return false
  }
}
