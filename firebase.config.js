// Firebase configuration file
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrZWZYg2kId2I7ZRH4m1c_tJCKYSEsImo",
  authDomain: "lesson01-61612.firebaseapp.com",
  projectId: "lesson01-61612",
  storageBucket: "lesson01-61612.appspot.com",
  messagingSenderId: "988759265113",
  appId: "1:988759265113:web:8c2fc5fd14d6e8ee8b0648",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ใช้ initializeAuth แทน getAuth และตั้งค่า persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with proper settings for React Native
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

const storage = getStorage(app);

// Function to check internet connection
const checkConnection = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

// Add alarm-specific cache settings
const ALARM_COLLECTION = "alarms";
const CACHE_EXPIRY = 1000 * 60 * 5; // ลดลงเหลือ 5 นาที สำหรับข้อมูลการปลุก

const getCacheTimestamp = async (collectionName) => {
  try {
    const timestamp = await AsyncStorage.getItem(
      `@${collectionName}_timestamp`
    );
    return timestamp ? parseInt(timestamp) : 0;
  } catch {
    return 0;
  }
};

const isCacheValid = async (collectionName) => {
  const timestamp = await getCacheTimestamp(collectionName);
  return Date.now() - timestamp < CACHE_EXPIRY;
};

// Updated syncDataToLocal function
const syncDataToLocal = async (collectionName) => {
  try {
    const isOnline = await checkConnection();
    if (!isOnline) {
      throw new Error("Offline");
    }

    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = {};
      querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      await AsyncStorage.setItem(`@${collectionName}`, JSON.stringify(data));
      await AsyncStorage.setItem(
        `@${collectionName}_timestamp`,
        Date.now().toString()
      );
      return data;
    };

    return await Promise.race([
      fetchData(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      ),
    ]);
  } catch (error) {
    console.warn(`Sync failed for ${collectionName}:`, error.message);
    return null;
  }
};

// Simplified getData function focused on alarms
const getAlarmData = async () => {
  try {
    const localData = await AsyncStorage.getItem(`@${ALARM_COLLECTION}`);
    const parsedData = localData ? JSON.parse(localData) : null;

    if (parsedData && (await isCacheValid(ALARM_COLLECTION))) {
      return parsedData;
    }

    const syncedData = await syncDataToLocal(ALARM_COLLECTION);
    if (syncedData) {
      return syncedData;
    }

    return parsedData || {};
  } catch (error) {
    console.error("Error getting alarm data:", error);
    return {};
  }
};

// Initialize cache on app start
const initializeAlarmCache = async () => {
  try {
    await getAlarmData();
  } catch (error) {
    console.error("Error initializing alarm cache:", error);
  }
};

export { auth, db, storage, getAlarmData, initializeAlarmCache };
