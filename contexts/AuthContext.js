import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  // ตรวจสอบสถานะการล็อกอินเมื่อแอปเริ่มทำงาน
  useEffect(() => {
    console.log("Setting up Firebase auth listener...");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("User is signed in:", firebaseUser.uid);
        setUser(firebaseUser);
      } else {
        console.log("No user is signed in.");
        setUser(null);
      }
      setLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // สมัครผู้ใช้ใหม่ด้วย Firebase
  const handleRegister = async (email, password, displayName = '') => {
    console.log("Attempting to register user with Firebase:", email);
    try {
      setLoading(true);
      // สร้างผู้ใช้ใหม่ใน Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // อัพเดทโปรไฟล์ของผู้ใช้
      if (displayName) {
        await updateProfile(firebaseUser, {
          displayName: displayName
        });
      }

      // สร้างเอกสารผู้ใช้ใน Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || '',
        photoURL: null,
        createdAt: new Date().toISOString()
      });
      
      console.log("Registration successful:", firebaseUser.uid);
      setUser(firebaseUser);
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage;
      
      // แปลข้อความผิดพลาดให้เป็นภาษาไทย
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
          break;
        case 'auth/invalid-email':
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'auth/weak-password':
          errorMessage = 'รหัสผ่านไม่ปลอดภัยเพียงพอ';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการลงทะเบียน โปรดลองอีกครั้ง';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // เข้าสู่ระบบด้วย Firebase
  const handleLogin = async (email, password) => {
    console.log("Attempting to login user with Firebase:", email);
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("Login successful:", firebaseUser.uid);
      
      // ไม่ต้องเรียก setUser เพราะ onAuthStateChanged จะทำให้อัตโนมัติ
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage;
      
      // แปลข้อความผิดพลาดให้เป็นภาษาไทย
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'auth/user-disabled':
          errorMessage = 'บัญชีนี้ถูกระงับการใช้งาน';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // ออกจากระบบด้วย Firebase
  const handleLogout = async () => {
    console.log("Attempting to logout user from Firebase");
    try {
      await signOut(auth);
      console.log("Logout successful");
      // ไม่ต้องเรียก setUser(null) เพราะ onAuthStateChanged จะทำให้อัตโนมัติ
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: 'ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง' };
    }
  };

  // รีเซ็ตรหัสผ่านด้วย Firebase
  const handleResetPassword = async (email) => {
    console.log("Attempting to reset password with Firebase for:", email);
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      console.log("Reset password email sent");
      return { 
        success: true, 
        message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมลและทำตามคำแนะนำ' 
      };
    } catch (error) {
      console.error("Reset password error:", error);
      let errorMessage;
      
      // แปลข้อความผิดพลาดให้เป็นภาษาไทย
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'auth/user-not-found':
          errorMessage = 'ไม่พบบัญชีผู้ใช้ที่ตรงกับอีเมลนี้';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน โปรดลองอีกครั้ง';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    resetPassword: handleResetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 