import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@firebaseUser';
const JSON_FILE_PATH = `${FileSystem.documentDirectory}users.json`;

// โหลดข้อมูลผู้ใช้ทั้งหมด
const loadUsers = async () => {
  try {
    const storedUsers = await AsyncStorage.getItem(USERS_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }

    const fileExists = await FileSystem.getInfoAsync(JSON_FILE_PATH);
    if (fileExists.exists) {
      const jsonContent = await FileSystem.readAsStringAsync(JSON_FILE_PATH);
      const data = JSON.parse(jsonContent);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(data.users));
      return data.users;
    }

    const initialData = { users: [] };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(initialData));
    return [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

// บันทึกข้อมูลผู้ใช้
const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const data = { users };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw new Error('ไม่สามารถบันทึกข้อมูลผู้ใช้ได้');
  }
};

// ตรวจสอบว่า Firebase พร้อมใช้งานหรือไม่
const isFirebaseAuthAvailable = () => {
  if (!auth) {
    console.warn('Firebase auth is not initialized');
    return false;
  }
  return true;
};

// ลงทะเบียนผู้ใช้ใหม่ด้วย Firebase
export const register = async (email, password, displayName = '') => {
  try {
    if (!isFirebaseAuthAvailable()) {
      console.log('Using local authentication instead of Firebase...');
      const userData = {
        uid: Date.now().toString(),
        email,
        displayName,
        photoURL: null,
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      return userData;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // เพิ่มชื่อผู้ใช้ (ถ้ามี)
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // เก็บข้อมูลผู้ใช้ใน AsyncStorage
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error registering with Firebase:', error);
    
    // แปลข้อความผิดพลาดให้เป็นภาษาไทย
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('รหัสผ่านไม่ปลอดภัยเพียงพอ');
    }
    
    throw new Error('ไม่สามารถลงทะเบียนได้: ' + error.message);
  }
};

// เข้าสู่ระบบด้วย Firebase
export const login = async (email, password) => {
  try {
    if (!isFirebaseAuthAvailable()) {
      console.log('Using local authentication instead of Firebase...');
      const userData = {
        uid: Date.now().toString(),
        email,
        displayName: 'Guest User',
        photoURL: null,
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      return userData;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // เก็บข้อมูลผู้ใช้ใน AsyncStorage
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
    
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error logging in with Firebase:', error);
    
    // แปลข้อความผิดพลาดให้เป็นภาษาไทย
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งาน');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('มีการพยายามเข้าสู่ระบบมากเกินไป โปรดลองใหม่ภายหลัง');
    }
    
    throw new Error('ไม่สามารถเข้าสู่ระบบได้: ' + error.message);
  }
};

// ออกจากระบบด้วย Firebase
export const logout = async () => {
  try {
    if (isFirebaseAuthAvailable()) {
      await signOut(auth);
    }
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error signing out with Firebase:', error);
    // ถึงแม้จะมีข้อผิดพลาดใน Firebase ให้พยายามลบข้อมูลผู้ใช้ใน AsyncStorage
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return { success: true };
    } catch (asyncError) {
      throw new Error('ไม่สามารถออกจากระบบได้: ' + error.message);
    }
  }
};

// ตรวจสอบสถานะการเข้าสู่ระบบ
export const getCurrentUser = async () => {
  try {
    // ตรวจสอบจาก AsyncStorage ก่อน
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
    
    // ถ้าไม่มีใน AsyncStorage และ Firebase พร้อมใช้งาน ให้ตรวจสอบจาก Firebase
    if (isFirebaseAuthAvailable() && auth.currentUser) {
      const userData = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
      };
      
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// อัพเดทข้อมูลผู้ใช้
export const updateUserProfile = async (displayName, photoURL) => {
  try {
    if (!isFirebaseAuthAvailable()) {
      throw new Error('Firebase ไม่พร้อมใช้งาน');
    }

    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('ไม่พบผู้ใช้ที่เข้าสู่ระบบ');
    }
    
    await updateProfile(user, { displayName, photoURL });
    
    // อัพเดท AsyncStorage
    const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      const updatedUser = {
        ...currentUser,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('ไม่สามารถอัพเดทโปรไฟล์ได้: ' + error.message);
  }
}; 