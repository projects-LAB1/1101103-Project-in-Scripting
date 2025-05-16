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
  limit,
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

// ดึงข้อมูลการนอนของผู้ใช้ทั้งหมด
export const fetchSleepData = async () => {
  try {
    const user = getCurrentUser();
    
    // สร้าง query เพื่อดึงข้อมูลการนอนของผู้ใช้ปัจจุบัน
    const sleepRef = collection(db, 'users', user.uid, 'sleepData');
    const q = query(sleepRef, orderBy('bedTime', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const sleepRecords = [];
    
    querySnapshot.forEach((doc) => {
      sleepRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`โหลดข้อมูลการนอนจาก Firestore สำเร็จ: ${sleepRecords.length} รายการ`);
    return sleepRecords;
  } catch (error) {
    console.error('Error fetching sleep data from Firestore:', error);
    // แจ้งเตือนผู้ใช้เพื่อให้ทราบว่ามีปัญหา (ถ้าไม่ใช่ข้อผิดพลาดว่าไม่ได้ล็อกอิน)
    if (error.message !== 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบ') {
      Alert.alert(
        'ข้อผิดพลาด',
        'ไม่สามารถโหลดข้อมูลการนอนได้ กรุณาลองใหม่อีกครั้ง',
        [{ text: 'ตกลง' }]
      );
    }
    return [];
  }
};

// เพิ่มข้อมูลการนอนใหม่
export const addSleepRecordToFirestore = async (newRecord) => {
  try {
    if (!newRecord) {
      throw new Error('Invalid sleep record data');
    }

    // ตรวจสอบข้อมูลขั้นต้น
    if (!newRecord.bedTime || !newRecord.wakeTime) {
      throw new Error('Bed time and wake time are required');
    }
    
    const user = getCurrentUser();
    
    // คำนวณระยะเวลาการนอน (ในนาที)
    const bedTime = new Date(newRecord.bedTime);
    const wakeTime = new Date(newRecord.wakeTime);
    const durationMs = wakeTime - bedTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    // เตรียมข้อมูลสำหรับบันทึก
    const recordData = {
      ...newRecord,
      userId: user.uid,
      durationMinutes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // เพิ่มข้อมูลใน Firestore
    const sleepRef = collection(db, 'users', user.uid, 'sleepData');
    const docRef = await addDoc(sleepRef, recordData);
    
    // ดึงข้อมูลที่เพิ่มเพื่อส่งกลับ
    const addedDoc = await getDoc(docRef);
    const addedRecord = {
      id: docRef.id,
      ...addedDoc.data(),
      // แปลงค่า Timestamp กลับเป็น ISO string
      createdAt: addedDoc.data().createdAt ? addedDoc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: addedDoc.data().updatedAt ? addedDoc.data().updatedAt.toDate().toISOString() : new Date().toISOString()
    };
    
    console.log(`เพิ่มข้อมูลการนอนใหม่สำเร็จ ID: ${docRef.id}`);
    return addedRecord;
  } catch (error) {
    console.error('Error adding sleep record to Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเพิ่มข้อมูลการนอนได้');
    throw error;
  }
};

// อัพเดทข้อมูลการนอน
export const updateSleepRecordInFirestore = async (recordId, updatedData) => {
  try {
    if (!recordId || !updatedData) {
      throw new Error('Invalid update parameters');
    }
    
    const user = getCurrentUser();
    
    // ดึงข้อมูลเดิมก่อน
    const recordRef = doc(db, 'users', user.uid, 'sleepData', recordId);
    const recordSnap = await getDoc(recordRef);
    
    if (!recordSnap.exists()) {
      console.warn(`ไม่พบข้อมูลการนอน ID: ${recordId} สำหรับการอัพเดท`);
      return false;
    }
    
    const currentData = recordSnap.data();
    
    // คำนวณระยะเวลาการนอนใหม่หากมีการเปลี่ยนแปลงเวลา
    let durationMinutes = currentData.durationMinutes;
    if (updatedData.bedTime || updatedData.wakeTime) {
      const bedTime = new Date(updatedData.bedTime || currentData.bedTime);
      const wakeTime = new Date(updatedData.wakeTime || currentData.wakeTime);
      const durationMs = wakeTime - bedTime;
      durationMinutes = Math.floor(durationMs / (1000 * 60));
    }
    
    // เตรียมข้อมูลที่จะอัพเดท
    const dataToUpdate = {
      ...updatedData,
      durationMinutes,
      updatedAt: serverTimestamp()
    };
    
    // อัพเดทข้อมูลใน Firestore
    await updateDoc(recordRef, dataToUpdate);
    
    console.log(`อัพเดทข้อมูลการนอนสำเร็จ ID: ${recordId}`);
    return true;
  } catch (error) {
    console.error('Error updating sleep record in Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัพเดทข้อมูลการนอนได้');
    throw error;
  }
};

// ลบข้อมูลการนอน
export const deleteSleepRecordFromFirestore = async (recordId) => {
  try {
    if (!recordId) {
      throw new Error('Record ID is required');
    }
    
    const user = getCurrentUser();
    
    // ลบข้อมูลจาก Firestore
    const recordRef = doc(db, 'users', user.uid, 'sleepData', recordId);
    await deleteDoc(recordRef);
    
    console.log(`ลบข้อมูลการนอนสำเร็จ ID: ${recordId}`);
    return true;
  } catch (error) {
    console.error('Error deleting sleep record from Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลการนอนได้');
    throw error;
  }
};

// ดึงเป้าหมายการนอนของผู้ใช้
export const fetchSleepGoals = async () => {
  try {
    const user = getCurrentUser();
    
    // ดึงข้อมูลเป้าหมายการนอนจาก Firestore
    const goalsRef = doc(db, 'users', user.uid, 'settings', 'sleepGoals');
    const goalsSnap = await getDoc(goalsRef);
    
    if (goalsSnap.exists()) {
      return goalsSnap.data();
    } else {
      // สร้างเป้าหมายเริ่มต้นถ้ายังไม่มี
      const defaultGoals = {
        targetSleepHours: 8,
        targetBedTime: '23:00',
        targetWakeTime: '07:00',
        weekdayBedTime: '23:00',
        weekdayWakeTime: '07:00',
        weekendBedTime: '00:00',
        weekendWakeTime: '08:00',
        updatedAt: serverTimestamp()
      };
      
      await setDoc(goalsRef, defaultGoals);
      return {
        ...defaultGoals,
        // แปลง timestamp กลับเป็น ISO string
        updatedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error fetching sleep goals from Firestore:', error);
    // ส่งค่าเริ่มต้นกลับไปถ้าเกิดข้อผิดพลาด
    return {
      targetSleepHours: 8,
      targetBedTime: '23:00',
      targetWakeTime: '07:00',
      weekdayBedTime: '23:00',
      weekdayWakeTime: '07:00',
      weekendBedTime: '00:00',
      weekendWakeTime: '08:00'
    };
  }
};

// บันทึกเป้าหมายการนอนของผู้ใช้
export const saveSleepGoalsToFirestore = async (goals) => {
  try {
    if (!goals) {
      throw new Error('Sleep goals data is required');
    }
    
    const user = getCurrentUser();
    
    // เตรียมข้อมูลสำหรับบันทึก
    const goalsData = {
      ...goals,
      updatedAt: serverTimestamp()
    };
    
    // บันทึกลง Firestore
    const goalsRef = doc(db, 'users', user.uid, 'settings', 'sleepGoals');
    await setDoc(goalsRef, goalsData);
    
    console.log('บันทึกเป้าหมายการนอนสำเร็จ');
    return true;
  } catch (error) {
    console.error('Error saving sleep goals to Firestore:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกเป้าหมายการนอนได้');
    return false;
  }
}; 