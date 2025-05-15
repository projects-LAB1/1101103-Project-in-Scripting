// Import the functions from the Firebase SDK
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIza9yCrzWZYgcLj2i17GH4am1c_t3cKySEJLho",
  authDomain: "lesson01-61612.firebaseapp.com",
  projectId: "lesson01-61612",
  storageBucket: "lesson01-61612.firebasestorage.app",
  messagingSenderId: "988759262513",
  appId: "1:988759262513:web:8c2fc6df14d6e8ee8b0648",
  measurementId: "G-WANCSBGD"
};

// Initialize Firebase with error handling
let app;
let db;
let storage;
let auth;

try {
  console.log("Initializing Firebase...");
  app = initializeApp(firebaseConfig);
  
  // Initialize services
  try {
    db = getFirestore(app);
    console.log("Firestore initialized successfully");
  } catch (firestoreError) {
    console.error("Error initializing Firestore:", firestoreError);
    db = null;
  }
  
  try {
    storage = getStorage(app);
    console.log("Storage initialized successfully");
  } catch (storageError) {
    console.error("Error initializing Storage:", storageError);
    storage = null;
  }
  
  try {
    auth = getAuth(app);
    console.log("Auth initialized successfully");
  } catch (authError) {
    console.error("Error initializing Auth:", authError);
    auth = null;
  }
  
  console.log("Firebase initialization completed");
} catch (error) {
  console.error("Critical error initializing Firebase:", error);
  // Create empty placeholders so the app doesn't crash when these variables are used
  app = null;
  db = null;
  storage = null;
  auth = null;
}

// Export the Firebase services
export { db, storage, auth };
export default app; 