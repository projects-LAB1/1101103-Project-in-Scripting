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
      return JSON.parse(storedAlarms);
    }

    // ถ้าไม่มีใน AsyncStorage ให้โหลดจากไฟล์
    const fileExists = await FileSystem.getInfoAsync(JSON_FILE_PATH);
    if (fileExists.exists) {
      const jsonContent = await FileSystem.readAsStringAsync(JSON_FILE_PATH);
      const data = JSON.parse(jsonContent);
      // เก็บลงใน AsyncStorage ด้วย
      await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(data.alarms));
      return data.alarms;
    }

    // ถ้าไม่มีทั้งสองที่ ให้สร้างไฟล์ใหม่
    const initialData = { alarms: [] };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(initialData));
    return [];
  } catch (error) {
    console.error('Error loading alarms:', error);
    return [];
  }
};

// บันทึกข้อมูลการปลุกลงไฟล์ JSON
export const saveAlarms = async (alarms) => {
  try {
    // บันทึกลง AsyncStorage
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));

    // บันทึกลงไฟล์ JSON
    const data = { alarms };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
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
    const alarms = await loadAlarms();
    const alarmWithId = { ...newAlarm, id: Date.now().toString() };
    const updatedAlarms = [...alarms, alarmWithId];
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to save alarm');
    }
    return alarmWithId;
  } catch (error) {
    console.error('Error adding alarm:', error);
    throw error;
  }
};

// อัพเดทการปลุก
export const updateAlarm = async (alarmId, updatedData) => {
  try {
    const alarms = await loadAlarms();
    const updatedAlarms = alarms.map(alarm => 
      alarm.id === alarmId ? { ...alarm, ...updatedData } : alarm
    );
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to update alarm');
    }
    return true;
  } catch (error) {
    console.error('Error updating alarm:', error);
    throw error;
  }
};

// ลบการปลุก
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
    console.error('Error deleting alarm:', error);
    throw error;
  }
};

// เปลี่ยนสถานะการปลุก
export const toggleAlarmStatus = async (alarmId) => {
  try {
    const alarms = await loadAlarms();
    const updatedAlarms = alarms.map(alarm => 
      alarm.id === alarmId ? { ...alarm, isActive: !alarm.isActive } : alarm
    );
    const success = await saveAlarms(updatedAlarms);
    if (!success) {
      throw new Error('Failed to toggle alarm status');
    }
    return true;
  } catch (error) {
    console.error('Error toggling alarm status:', error);
    throw error;
  }
}; 