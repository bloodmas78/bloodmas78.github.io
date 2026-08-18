import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3xtrXbVzBagN_lOwuMgaO7PkXpAfvl0k",
  authDomain: "bloodmas78-b41d2.firebaseapp.com",
  projectId: "bloodmas78-b41d2",
  storageBucket: "bloodmas78-b41d2.firebasestorage.app",
  messagingSenderId: "997409312280",
  appId: "1:997409312280:web:15c4c2a2b330e9545b3d6d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const membersSnap = await getDocs(collection(db, 'members'));
  console.log(`Members count: ${membersSnap.size}`);
  membersSnap.forEach(d => console.log(d.id, d.data()));

  const matchesSnap = await getDocs(collection(db, 'matches'));
  console.log(`Matches count: ${matchesSnap.size}`);
}

check().catch(console.error);
