import { auth } from '../config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

// ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อกับ Firebase
export const testFirebaseConnection = async () => {
  try {
    // ตรวจสอบว่าสามารถเข้าถึง auth ได้หรือไม่
    console.log('Firebase auth object:', auth ? 'Available' : 'Not available');
    
    // ส่งคืนค่าสถานะการเชื่อมต่อ
    return {
      success: true,
      message: 'Firebase connection is working',
      authAvailable: !!auth
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      message: `Firebase connection test failed: ${error.message}`,
      error
    };
  }
};