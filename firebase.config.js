// Firebase configuration file
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrZWZYg2kId2I7ZRH4m1c_tJCKYSEsImo",
  authDomain: "lesson01-61612.firebaseapp.com",
  projectId: "lesson01-61612",
  storageBucket: "lesson01-61612.appspot.com",
  messagingSenderId: "988759265113",
  appId: "1:988759265113:web:8c2fc5fd14d6e8ee8b0648",
  // เพิ่ม projectId จาก app.json เพื่อให้ตรงกับที่ใช้ในการแจ้งเตือน
  easProjectId: "c3b68283-9f4b-4fa7-9389-d76b1e5dc6e2" // UUID จาก app.json
};

// Initialize Firebase - ตรวจสอบว่ามีการเริ่มต้น Firebase App แล้วหรือไม่
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ใช้ initializeAuth แทน getAuth และตั้งค่า persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ตั้งค่า Firestore ด้วยการกำหนดค่าเพิ่มเติมเพื่อปรับปรุงประสิทธิภาพ
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true, // ช่วยแก้ปัญหาการเชื่อมต่อบนอุปกรณ์บางรุ่น
  // experimentalAutoDetectLongPolling และ experimentalForceLongPolling ไม่สามารถใช้พร้อมกันได้
  // experimentalAutoDetectLongPolling: true,
});

// เปิดใช้งาน offline persistence สำหรับ Firestore
// ตรวจสอบว่าเป็น web หรือไม่ เพราะบางครั้ง IndexedDB อาจมีปัญหาบนอุปกรณ์มือถือ
if (Platform.OS !== 'web') {
  try {
    enableIndexedDbPersistence(db, {
      synchronizeTabs: true // เปิดใช้งานการซิงค์ระหว่างแท็บ
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        // มีแท็บหลายแท็บเปิดอยู่ ไม่สามารถเปิดใช้งาน persistence ได้
        console.warn('Firestore persistence ไม่สามารถเปิดใช้งานได้เนื่องจากมีแท็บหลายแท็บเปิดอยู่');
      } else if (err.code === 'unimplemented') {
        // อุปกรณ์ไม่รองรับ IndexedDB
        console.warn('อุปกรณ์ของคุณไม่รองรับ Firestore persistence');
      } else {
        console.error('Firestore persistence error:', err);
      }
    });
  } catch (error) {
    console.error('Error initializing Firestore persistence:', error);
    // ยังคงใช้งาน Firestore ได้แม้ว่า persistence จะล้มเหลว
  }
}

const storage = getStorage(app);

export { auth, db, storage };
