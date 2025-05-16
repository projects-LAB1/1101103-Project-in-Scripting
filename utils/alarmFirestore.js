import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Alert } from 'react-native';

// ฟังก์ชันช่วยเหลือในการตรวจสอบผู้ใช้ปัจจุบัน
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ');
  }
  return user;
};

// ดึงข้อมูลการตั้งปลุกทั้งหมดของผู้ใช้
export const fetchAlarms = async () => {
  try {
    const user = getCurrentUser();
    
    // สร้าง query เพื่อดึงข้อมูลการตั้งปลุกของผู้ใช้ปัจจุบัน
    const alarmsRef = collection(db, 'users', user.uid, 'alarms');
    const q = query(alarmsRef, orderBy('hour'), orderBy('minute'));
    
    const querySnapshot = await getDocs(q);
    const alarms = [];
    
    querySnapshot.forEach((doc) => {
      alarms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`โหลดข้อมูลการตั้งปลุกจาก Firestore สำเร็จ: ${alarms.length} รายการ`);
    return alarms;
  } catch (error) {
    console.error('Error fetching alarms from Firestore:', error);
    // แจ้งเตือนผู้ใช้เพื่อให้ทราบว่ามีปัญหา (ถ้าไม่ใช่ข้อผิดพลาดว่าไม่ได้ล็อกอิน)
    if (error.message !== 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ') {
      Alert.alert(
        'ข้อผิดพลาด',
        'ไม่สามารถโหลดข้อมูลการตั้งปลุกได้ กรุณาลองใหม่อีกครั้ง',
        [{ text: 'ตกลง' }]
      );
    }
    return [];
  }
};

// เพิ่มการตั้งปลุกใหม่
export const addAlarmToFirestore = async (newAlarm) => {
  try {
    if (!newAlarm) {
      throw new Error('Invalid alarm data');
    }

    // ตรวจสอบข้อมูลขั้นต้น
    if (newAlarm.hour === undefined || newAlarm.minute === undefined) {
      throw new Error('Hour and minute are required');
    }
    
    const user = getCurrentUser();
    
    // เตรียมข้อมูลสำหรับบันทึก
    const alarmData = {
      ...newAlarm,
      userId: user.uid,
      active: newAlarm.active !== undefined ? newAlarm.active : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // เพิ่มข้อมูลใน Firestore
    const alarmsRef = collection(db, 'users', user.uid, 'alarms');
    const docRef = await addDoc(alarmsRef, alarmData);
    
    // ดึงข้อมูลที่เพิ่มเพื่อส่งกลับ
    const addedDoc = await getDoc(docRef);
    const addedAlarm = {
      id: docRef.id,
      ...addedDoc.data(),
      // แปลงค่า Timestamp กลับเป็น ISO string
      createdAt: addedDoc.data().createdAt ? addedDoc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: addedDoc.data().updatedAt ? addedDoc.data().updatedAt.toDate().toISOString() : new Date().toISOString()
    };
    
    console.log(`เพิ่มการตั้งปลุกใหม่สำเร็จ ID: ${docRef.id}`);
    return addedAlarm;
  } catch (error) {
    console.error('Error adding alarm to Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเพิ่มการตั้งปลุกได้');
    throw error;
  }
};

// อัพเดทการตั้งปลุก
export const updateAlarmInFirestore = async (alarmId, updatedData) => {
  try {
    if (!alarmId || !updatedData) {
      throw new Error('Invalid update parameters');
    }
    
    const user = getCurrentUser();
    
    // เตรียมข้อมูลที่จะอัพเดท
    const dataToUpdate = {
      ...updatedData,
      updatedAt: serverTimestamp()
    };
    
    // อัพเดทข้อมูลใน Firestore
    const alarmRef = doc(db, 'users', user.uid, 'alarms', alarmId);
    await updateDoc(alarmRef, dataToUpdate);
    
    console.log(`อัพเดทการตั้งปลุกสำเร็จ ID: ${alarmId}`);
    return true;
  } catch (error) {
    console.error('Error updating alarm in Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัพเดทการตั้งปลุกได้');
    throw error;
  }
};

// ลบการตั้งปลุก
export const deleteAlarmFromFirestore = async (alarmId) => {
  try {
    if (!alarmId) {
      throw new Error('Alarm ID is required');
    }
    
    const user = getCurrentUser();
    
    // ลบข้อมูลจาก Firestore
    const alarmRef = doc(db, 'users', user.uid, 'alarms', alarmId);
    await deleteDoc(alarmRef);
    
    console.log(`ลบการตั้งปลุกสำเร็จ ID: ${alarmId}`);
    return true;
  } catch (error) {
    console.error('Error deleting alarm from Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการตั้งปลุกได้');
    throw error;
  }
};

// ดึงการตั้งค่าเสียงปลุกของผู้ใช้
export const fetchAlarmSounds = async () => {
  try {
    const user = getCurrentUser();
    
    // ดึงข้อมูลการตั้งค่าเสียงปลุกจาก Firestore
    const soundsRef = doc(db, 'users', user.uid, 'settings', 'alarmSounds');
    const soundsSnap = await getDoc(soundsRef);
    
    if (soundsSnap.exists()) {
      return soundsSnap.data();
    } else {
      // สร้างการตั้งค่าเริ่มต้นถ้ายังไม่มี
      const defaultSounds = {
        defaultSound: 'digital_alarm',
        customSounds: [],
        updatedAt: serverTimestamp()
      };
      
      await setDoc(soundsRef, defaultSounds);
      return {
        ...defaultSounds,
        // แปลง timestamp กลับเป็น ISO string
        updatedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error fetching alarm sounds from Firestore:', error);
    // ส่งค่าเริ่มต้นกลับไปถ้าเกิดข้อผิดพลาด
    return {
      defaultSound: 'digital_alarm',
      customSounds: []
    };
  }
};

// บันทึกการตั้งค่าเสียงปลุก
export const saveAlarmSoundsToFirestore = async (soundsData) => {
  try {
    if (!soundsData) {
      throw new Error('Alarm sounds data is required');
    }
    
    const user = getCurrentUser();
    
    // เตรียมข้อมูลสำหรับบันทึก
    const dataToSave = {
      ...soundsData,
      updatedAt: serverTimestamp()
    };
    
    // บันทึกลง Firestore
    const soundsRef = doc(db, 'users', user.uid, 'settings', 'alarmSounds');
    await setDoc(soundsRef, dataToSave);
    
    console.log('บันทึกการตั้งค่าเสียงปลุกสำเร็จ');
    return true;
  } catch (error) {
    console.error('Error saving alarm sounds to Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าเสียงปลุกได้');
    return false;
  }
}; 