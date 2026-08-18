import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth'

// 파이어베이스 프로젝트 설정값
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Google 로그인 헬퍼 함수
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error: any) {
    console.error('Google 로그인 실패:', error)
    if (error.code !== 'auth/popup-closed-by-user') {
      alert(`로그인 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`)
    }
    return null
  }
}

// Google 로그아웃 헬퍼 함수
export async function logoutGoogle(): Promise<boolean> {
  try {
    await signOut(auth)
    return true
  } catch (error) {
    console.error('로그아웃 실패:', error)
    return false
  }
}

