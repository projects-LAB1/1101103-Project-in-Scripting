import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

const ALARMS_KEY = '@alarms';
const JSON_FILE_PATH = `${FileSystem.documentDirectory}alarms.json`;

// โหลดข้อมูลการปลุกจากไฟล์ JSON
export const loadAlarms = async () => {
  try {
    // ลองโหลดจาก AsyncStorage ก่อน
    const storedAlarms = await AsyncStorage.getItem(ALARMS_KEY);
    if (storedAlarms) {
      try {
        const parsedAlarms = JSON.parse(storedAlarms);
        console.log(`โหลดการตั้งปลุกจาก AsyncStorage สำเร็จ: ${parsedAlarms.length} รายการ`);
        return parsedAlarms;
      } catch (parseError) {
        console.error('Error parsing alarms from AsyncStorage:', parseError);
        // ถ้า parse ไม่ได้ ให้ล้างข้อมูลใน AsyncStorage
        await AsyncStorage.removeItem(ALARMS_KEY);
      }
    }

    // ถ้าไม่มีใน AsyncStorage ให้โหลดจากไฟล์
    const fileExists = await FileSystem.getInfoAsync(JSON_FILE_PATH);
    if (fileExists.exists) {
      const jsonContent = await FileSystem.readAsStringAsync(JSON_FILE_PATH);
      try {
        const data = JSON.parse(jsonContent);
        if (data && Array.isArray(data.alarms)) {
          // เก็บลงใน AsyncStorage ด้วย
          await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(data.alarms));
          console.log(`โหลดการตั้งปลุกจากไฟล์ JSON สำเร็จ: ${data.alarms.length} รายการ`);
          return data.alarms;
        } else {
          console.warn('Invalid alarms data structure in file');
          await resetAlarmStorage();
          return [];
        }
      } catch (parseError) {
        console.error('Error parsing alarms from file:', parseError);
        await resetAlarmStorage();
        return [];
      }
    }

    // ถ้าไม่มีทั้งสองที่ ให้สร้างไฟล์ใหม่
    console.log('ไม่พบข้อมูลการตั้งปลุก สร้างไฟล์ใหม่');
    await resetAlarmStorage();
    return [];
  } catch (error) {
    console.error('Error loading alarms:', error);
    // แจ้งเตือนผู้ใช้เพื่อให้ทราบว่ามีปัญหา
    Alert.alert(
      'ข้อผิดพลาด',
      'ไม่สามารถโหลดข้อมูลการตั้งปลุกได้ กรุณาลองใหม่อีกครั้ง',
      [{ text: 'ตกลง' }]
    );
    return [];
  }
};

// รีเซ็ตข้อมูลการตั้งปลุกทั้งหมด
export const resetAlarmStorage = async () => {
  try {
    await AsyncStorage.removeItem(ALARMS_KEY);
    const initialData = { alarms: [] };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(initialData, null, 2));
    return true;
  } catch (error) {
    console.error('Error resetting alarm storage:', error);
    return false;
  }
};

// บันทึกข้อมูลการปลุกลงไฟล์ JSON
export const saveAlarms = async (alarms) => {
  try {
    if (!Array.isArray(alarms)) {
      console.error('Invalid alarms data provided to saveAlarms');
      return false;
    }
    
    // บันทึกลง AsyncStorage
    const alarmsJSON = JSON.stringify(alarms);
    await AsyncStorage.setItem(ALARMS_KEY, alarmsJSON);
    console.log(`บันทึกการตั้งปลุกลง AsyncStorage สำเร็จ: ${alarms.length} รายการ`);

    // บันทึกลงไฟล์ JSON
    const data = { alarms, lastUpdated: new Date().toISOString() };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`บันทึกการตั้งปลุกลงไฟล์ JSON สำเร็จ: ${alarms.length} รายการ`);
    
    return true;
  } catch (error) {
    console.error('Error saving alarms:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการปลุกได้');
    return false;
  }
};

// เพิ่มการปลุกใหม่
export const addAlarm = async (newAlarm) => {
  try {
    if (!newAlarm) {
      throw new Error('Invalid alarm data');
    }
    
    const alarms = await loadAlarms();
    const alarmWithId = { 
      ...newAlarm, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updatedAlarms = [...alarms, alarmWithId];
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to save alarm');
    }
    console.log(`เพิ่มการตั้งปลุกใหม่สำเร็จ ID: ${alarmWithId.id}`);
    return alarmWithId;
  } catch (error) {
    console.error('Error adding alarm:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเพิ่มการตั้งปลุกได้');
    throw error;
  }
};

// อัพเดทการปลุก
export const updateAlarm = async (alarmId, updatedData) => {
  try {
    if (!alarmId || !updatedData) {
      throw new Error('Invalid update parameters');
    }
    
    const alarms = await loadAlarms();
    let found = false;
    
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        found = true;
        return { 
          ...alarm, 
          ...updatedData,
          updatedAt: new Date().toISOString() 
        };
      }
      return alarm;
    });
    
    if (!found) {
      console.warn(`ไม่พบการตั้งปลุก ID: ${alarmId} สำหรับการอัพเดท`);
      return false;
    }
    
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to update alarm');
    }
    console.log(`อัพเดทการตั้งปลุกสำเร็จ ID: ${alarmId}`);
    return true;
  } catch (error) {
    console.error('Error updating alarm:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัพเดทการตั้งปลุกได้');
    throw error;
  }
};

// ลบการปลุก
export const deleteAlarm = async (alarmId) => {
  try {
    if (!alarmId) {
      throw new Error('Invalid alarm ID');
    }
    
    const alarms = await loadAlarms();
    const initialLength = alarms.length;
    const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
    
    if (updatedAlarms.length === initialLength) {
      console.warn(`ไม่พบการตั้งปลุก ID: ${alarmId} สำหรับการลบ`);
      return false;
    }
    
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to delete alarm');
    }
    console.log(`ลบการตั้งปลุกสำเร็จ ID: ${alarmId}`);
    return true;
  } catch (error) {
    console.error('Error deleting alarm:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการตั้งปลุกได้');
    throw error;
  }
};

// เปลี่ยนสถานะการปลุก
export const toggleAlarmStatus = async (alarmId) => {
  try {
    if (!alarmId) {
      throw new Error('Invalid alarm ID');
    }
    
    const alarms = await loadAlarms();
    let found = false;
    let newStatus = false;
    
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        found = true;
        newStatus = !alarm.isActive;
        return { 
          ...alarm, 
          isActive: newStatus,
          updatedAt: new Date().toISOString() 
        };
      }
      return alarm;
    });
    
    if (!found) {
      console.warn(`ไม่พบการตั้งปลุก ID: ${alarmId} สำหรับการเปลี่ยนสถานะ`);
      return false;
    }
    
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to toggle alarm status');
    }
    console.log(`เปลี่ยนสถานะการตั้งปลุกสำเร็จ ID: ${alarmId}, สถานะใหม่: ${newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
    return true;
  } catch (error) {
    console.error('Error toggling alarm status:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะการตั้งปลุกได้');
    throw error;
  }
}; 