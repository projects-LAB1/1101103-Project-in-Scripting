// นำเข้า Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// ข้อมูลการกำหนดค่า Firebase project ของคุณ
// ค่าเหล่านี้คัดลอกมาจาก Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCrZWZYg2kId2I7ZRH4m1c_tJCKYSEsImo",
  authDomain: "lesson01-61612.firebaseapp.com",
  databaseURL: "https://lesson01-61612-default-rtdb.firebaseio.com",
  projectId: "lesson01-61612",
  storageBucket: "lesson01-61612.firebasestorage.app",
  messagingSenderId: "988759265113",
  appId: "1:988759265113:web:8c2fc5fd14d6e8ee8b0648",
  measurementId: "G-K7W8TCSBDG"
};

// เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);

// สร้างและส่งออก services ที่ต้องการใช้
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);
export let analytics = null;

// เริ่มต้น analytics เฉพาะเมื่อรันบนเว็บ (ไม่รองรับใน Expo Go)
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.log("Analytics not available in this environment");
}

// Google OAuth configuration
export const GOOGLE_CONFIG = {
  webClientId: "988759265113-snvrtdb4r7najg6j0c24f2fd8tk0d97.apps.googleusercontent.com",
  androidClientId: "988759265113-snvrtdb4r7najg6j0c24f2fd8tk0d97.apps.googleusercontent.com",
  iosClientId: "988759265113-snvrtdb4r7najg6j0c24f2fd8tk0d97.apps.googleusercontent.com",
};

export default app;