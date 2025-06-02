// Local Authentication System - No Firebase
// This file provides mock objects for compatibility with the rest of the app
// allowing the app to run without Firebase

// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import environment configuration
// Copy config/environment.example.js to config/environment.js and fill in your values
let ENV_CONFIG;
try {
  ENV_CONFIG = require('../config/environment.js').default;
} catch (error) {
  console.warn('Environment config not found. Using demo configuration.');
  // Demo configuration for development/testing
  ENV_CONFIG = {
    FIREBASE: {
      apiKey: "demo_api_key",
      authDomain: "demo-project.firebaseapp.com",
      databaseURL: "https://demo-project.firebaseio.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:demo",
      measurementId: "G-DEMO"
    }
  };
}

// Your web app's Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: ENV_CONFIG.FIREBASE.apiKey,
  authDomain: ENV_CONFIG.FIREBASE.authDomain,
  databaseURL: ENV_CONFIG.FIREBASE.databaseURL,
  projectId: ENV_CONFIG.FIREBASE.projectId,
  storageBucket: ENV_CONFIG.FIREBASE.storageBucket,
  messagingSenderId: ENV_CONFIG.FIREBASE.messagingSenderId,
  appId: ENV_CONFIG.FIREBASE.appId,
  measurementId: ENV_CONFIG.FIREBASE.measurementId
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