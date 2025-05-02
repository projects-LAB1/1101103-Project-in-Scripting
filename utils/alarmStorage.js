import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { cancelAlarmNotification } from '../models/NotificationManager';

// Constants for storage keys
const ALARMS_STORAGE_KEY = '@alarms_data';
const BACKUP_ALARMS_KEY = '@alarms_backup';
const LAST_SAVE_TIME_KEY = '@alarms_last_save';

/**
 * บันทึกข้อมูลลง AsyncStorage
 * @param {string} key - คีย์สำหรับการเก็บข้อมูล
 * @param {any} value - ข้อมูลที่จะบันทึก
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Data saved successfully to ${key}`);
    return true;
  } catch (error) {
    console.error(`Error saving data to ${key}:`, error);
    return false;
  }
};

/**
 * โหลดข้อมูลจาก AsyncStorage
 * @param {string} key - คีย์สำหรับการดึงข้อมูล
 * @returns {Promise<any|null>} - ข้อมูลที่โหลดหรือ null หากเกิดข้อผิดพลาด
 */
const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue !== null) {
      console.log(`Data loaded successfully from ${key}`);
      return JSON.parse(jsonValue);
    }
    console.log(`No data found for ${key}`);
    return null;
  } catch (error) {
    console.error(`Error loading data from ${key}:`, error);
    return null;
  }
};

/**
 * โหลดข้อมูลการปลุกจาก AsyncStorage พร้อมกลไกสำรองข้อมูล
 * @returns {Promise<Array>} - อาร์เรย์ของข้อมูลการปลุก
 */
export const loadAlarms = async () => {
  try {
    console.log('🔄 Loading alarm data...');
    
    // พยายามโหลดจากที่เก็บหลัก
    const alarms = await getData(ALARMS_STORAGE_KEY);
    
    if (alarms) {
      // สำรองข้อมูลเมื่อโหลดสำเร็จ
      storeData(BACKUP_ALARMS_KEY, alarms);
      return alarms;
    }
    
    console.log('⚠️ Primary storage empty, trying backup...');
    
    // พยายามโหลดจากที่เก็บสำรอง
    const backupAlarms = await getData(BACKUP_ALARMS_KEY);
    
    if (backupAlarms) {
      console.log('✅ Restored from backup storage');
      // คืนค่าข้อมูลสำรองและบันทึกลงในที่เก็บหลัก
      storeData(ALARMS_STORAGE_KEY, backupAlarms);
      return backupAlarms;
    }
    
    console.log('➕ No alarms found, creating empty array');
    return [];
  } catch (error) {
    console.error('❌ Error loading alarms:', error);
    throw new Error('ไม่สามารถเชื่อมต่อข้อมูลการปลุกได้');
  }
};

/**
 * บันทึกข้อมูลการปลุก
 * @param {Array} alarms - อาร์เรย์ของข้อมูลการปลุก
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
export const saveAlarms = async (alarms) => {
  try {
    // ตรวจสอบว่าข้อมูลที่จะบันทึกถูกต้อง
    if (!Array.isArray(alarms)) {
      console.error('❌ Invalid alarms data format');
      throw new Error('รูปแบบข้อมูลการปลุกไม่ถูกต้อง');
    }
    
    // บันทึกเวลาล่าสุดที่บันทึกข้อมูล
    const timestamp = Date.now();
    await AsyncStorage.setItem(LAST_SAVE_TIME_KEY, timestamp.toString());
    
    // บันทึกข้อมูลหลัก
    const success = await storeData(ALARMS_STORAGE_KEY, alarms);
    
    if (success) {
      // สำรองข้อมูล
      await storeData(BACKUP_ALARMS_KEY, alarms);
      console.log('✅ Alarms saved successfully with backup');
      return true;
    }
    
    throw new Error('ไม่สามารถบันทึกข้อมูลการปลุกได้');
  } catch (error) {
    console.error('❌ Error saving alarms:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการปลุกได้');
    return false;
  }
};

/**
 * เพิ่มการปลุกใหม่
 * @param {Object} newAlarm - ข้อมูลการปลุกใหม่
 * @returns {Promise<Object>} - ข้อมูลการปลุกที่มีการเพิ่ม ID แล้ว
 */
export const addAlarm = async (newAlarm) => {
  try {
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
    
    return alarmWithId;
  } catch (error) {
    console.error('❌ Error adding alarm:', error);
    throw error;
  }
};

/**
 * อัพเดทข้อมูลการปลุก
 * @param {string} alarmId - ID ของการปลุกที่ต้องการอัพเดท
 * @param {Object} updatedData - ข้อมูลที่ต้องการอัพเดท
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
export const updateAlarm = async (alarmId, updatedData) => {
  try {
    const alarms = await loadAlarms();
    const updatedAlarms = alarms.map(alarm => 
      alarm.id === alarmId ? { 
        ...alarm, 
        ...updatedData, 
        updatedAt: new Date().toISOString() 
      } : alarm
    );
    
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to update alarm');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating alarm:', error);
    throw error;
  }
};

/**
 * ลบข้อมูลการปลุก
 * @param {string} alarmId - ID ของการปลุกที่ต้องการลบ
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
export const deleteAlarm = async (alarmId) => {
  try {
    const alarms = await loadAlarms();
    const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
    
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to delete alarm');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting alarm:', error);
    throw error;
  }
};

/**
 * เปลี่ยนสถานะการเปิด/ปิดการปลุก
 * @param {string} alarmId - ID ของการปลุกที่ต้องการเปลี่ยนสถานะ
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
export const toggleAlarmStatus = async (alarmId) => {
  try {
    const alarms = await loadAlarms();
    const updatedAlarms = alarms.map(alarm => 
      alarm.id === alarmId ? { 
        ...alarm, 
        isActive: !alarm.isActive,
        updatedAt: new Date().toISOString()
      } : alarm
    );
    
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to toggle alarm status');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error toggling alarm status:', error);
    throw error;
  }
};

/**
 * ล้างข้อมูลการปลุกทั้งหมด (สำหรับการแก้ไขปัญหา)
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
export const clearAllAlarms = async () => {
  try {
    await AsyncStorage.removeItem(ALARMS_STORAGE_KEY);
    await AsyncStorage.removeItem(BACKUP_ALARMS_KEY);
    console.log('🗑️ All alarm data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing alarms:', error);
    return false;
  }
};

/**
 * ยกเลิกการแจ้งเตือนการปลุก
 * @param {string} notificationId - ID ของการแจ้งเตือนที่ต้องการยกเลิก
 * @returns {Promise<boolean>} - สถานะความสำเร็จ
 */
export const cancelAlarm = async (notificationId) => {
  try {
    if (!notificationId) {
      console.warn('⚠️ No notification ID provided to cancelAlarm');
      return false;
    }
    
    await cancelAlarmNotification(notificationId);
    console.log(`✅ Successfully cancelled alarm notification: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('❌ Error canceling alarm notification:', error);
    return false;
  }
};