// Firebase configuration file
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrZWZYg2kId2I7ZRH4m1c_tJCKYSEsImo",
  authDomain: "lesson01-61612.firebaseapp.com",
  projectId: "lesson01-61612",
  storageBucket: "lesson01-61612.appspot.com",
  messagingSenderId: "988759265113",
  appId: "1:988759265113:web:8c2fc5fd14d6e8ee8b0648"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ใช้ initializeAuth แทน getAuth และตั้งค่า persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
