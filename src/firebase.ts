import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// 파이어베이스 프로젝트 설정값 (여기에 콘솔에서 복사한 값을 덮어쓰세요)
const firebaseConfig = {
  apiKey: "AIzaSyAkZMMXZrsQmh_UCBpjxnaH6G8toUGELnk",
  authDomain: "bloodmas78-b41d2.firebaseapp.com",
  projectId: "bloodmas78-b41d2",
  storageBucket: "bloodmas78-b41d2.firebasestorage.app",
  messagingSenderId: "997409312280",
  appId: "1:997409312280:web:15c4c2a2b330e9545b3d6d",
  measurementId: "G-7ZMGYQTXNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
