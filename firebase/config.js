// Local Authentication System - No Firebase
// This file provides mock objects for compatibility with the rest of the app
// allowing the app to run without Firebase

// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Replace these values with your actual Firebase project configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the initialized services
export { auth, db, storage };
export default app; 