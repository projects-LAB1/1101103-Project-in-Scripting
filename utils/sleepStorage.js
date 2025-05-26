import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

const SLEEP_DATA_KEY = '@sleep_data';
const SLEEP_GOALS_KEY = '@sleep_goals';
const JSON_FILE_PATH = `${FileSystem.documentDirectory}sleep_data.json`;

// โหลดข้อมูลการนอนจากที่เก็บข้อมูล
export const loadSleepData = async () => {
  try {
    // ลองโหลดจาก AsyncStorage ก่อน
    const storedData = await AsyncStorage.getItem(SLEEP_DATA_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log(`โหลดข้อมูลการนอนจาก AsyncStorage สำเร็จ: ${parsedData.length} รายการ`);
        return parsedData;
      } catch (parseError) {
        console.error('Error parsing sleep data from AsyncStorage:', parseError);
        // ถ้า parse ไม่ได้ ให้ล้างข้อมูลใน AsyncStorage
        await AsyncStorage.removeItem(SLEEP_DATA_KEY);
      }
    }

    // ถ้าไม่มีใน AsyncStorage ให้โหลดจากไฟล์
    const fileExists = await FileSystem.getInfoAsync(JSON_FILE_PATH);
    if (fileExists.exists) {
      const jsonContent = await FileSystem.readAsStringAsync(JSON_FILE_PATH);
      try {
        const data = JSON.parse(jsonContent);
        if (data && Array.isArray(data.sleepRecords)) {
          // เก็บลงใน AsyncStorage ด้วย
          await AsyncStorage.setItem(SLEEP_DATA_KEY, JSON.stringify(data.sleepRecords));
          console.log(`โหลดข้อมูลการนอนจากไฟล์ JSON สำเร็จ: ${data.sleepRecords.length} รายการ`);
          return data.sleepRecords;
        } else {
          console.warn('Invalid sleep data structure in file');
          await resetSleepStorage();
          return [];
        }
      } catch (parseError) {
        console.error('Error parsing sleep data from file:', parseError);
        await resetSleepStorage();
        return [];
      }
    }

    // ถ้าไม่มีทั้งสองที่ ให้สร้างไฟล์ใหม่
    console.log('ไม่พบข้อมูลการนอน สร้างไฟล์ใหม่');
    await resetSleepStorage();
    return [];
  } catch (error) {
    console.error('Error loading sleep data:', error);
    // แจ้งเตือนผู้ใช้เพื่อให้ทราบว่ามีปัญหา
    Alert.alert(
      'ข้อผิดพลาด',
      'ไม่สามารถโหลดข้อมูลการนอนได้ กรุณาลองใหม่อีกครั้ง',
      [{ text: 'ตกลง' }]
    );
    return [];
  }
};

// รีเซ็ตข้อมูลการนอนทั้งหมด
export const resetSleepStorage = async () => {
  try {
    await AsyncStorage.removeItem(SLEEP_DATA_KEY);
    const initialData = { sleepRecords: [] };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(initialData, null, 2));
    return true;
  } catch (error) {
    console.error('Error resetting sleep storage:', error);
    return false;
  }
};

// บันทึกข้อมูลการนอนลงไฟล์ JSON
export const saveSleepData = async (sleepRecords) => {
  try {
    if (!Array.isArray(sleepRecords)) {
      console.error('Invalid sleep data provided to saveSleepData');
      return false;
    }
    
    // บันทึกลง AsyncStorage
    const sleepDataJSON = JSON.stringify(sleepRecords);
    await AsyncStorage.setItem(SLEEP_DATA_KEY, sleepDataJSON);
    console.log(`บันทึกข้อมูลการนอนลง AsyncStorage สำเร็จ: ${sleepRecords.length} รายการ`);

    // บันทึกลงไฟล์ JSON
    const data = { sleepRecords, lastUpdated: new Date().toISOString() };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`บันทึกข้อมูลการนอนลงไฟล์ JSON สำเร็จ: ${sleepRecords.length} รายการ`);
    
    return true;
  } catch (error) {
    console.error('Error saving sleep data:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการนอนได้');
    return false;
  }
};

// เพิ่มข้อมูลการนอนใหม่
export const addSleepRecord = async (newRecord) => {
  try {
    if (!newRecord) {
      throw new Error('Invalid sleep record data');
    }

    // ตรวจสอบข้อมูลขั้นต้น
    if (!newRecord.bedTime || !newRecord.wakeTime) {
      throw new Error('Bed time and wake time are required');
    }
    
    const sleepRecords = await loadSleepData();
    const recordWithId = { 
      ...newRecord, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    // คำนวณระยะเวลาการนอน (ในนาที)
    const bedTime = new Date(recordWithId.bedTime);
    const wakeTime = new Date(recordWithId.wakeTime);
    const durationMs = wakeTime - bedTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    // เพิ่มข้อมูลการนอนพร้อมระยะเวลา
    const completeRecord = {
      ...recordWithId,
      durationMinutes
    };
    
    const updatedRecords = [...sleepRecords, completeRecord];
    const success = await saveSleepData(updatedRecords);
    
    if (!success) {
      throw new Error('Failed to save sleep record');
    }
    
    console.log(`เพิ่มข้อมูลการนอนใหม่สำเร็จ ID: ${completeRecord.id}`);
    return completeRecord;
  } catch (error) {
    console.error('Error adding sleep record:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเพิ่มข้อมูลการนอนได้');
    throw error;
  }
};

// อัพเดทข้อมูลการนอน
export const updateSleepRecord = async (recordId, updatedData) => {
  try {
    if (!recordId || !updatedData) {
      throw new Error('Invalid update parameters');
    }
    
    const sleepRecords = await loadSleepData();
    let found = false;
    
    const updatedRecords = sleepRecords.map(record => {
      if (record.id === recordId) {
        found = true;
        
        // คำนวณระยะเวลาการนอนใหม่หากมีการเปลี่ยนแปลงเวลา
        let durationMinutes = record.durationMinutes;
        if (updatedData.bedTime || updatedData.wakeTime) {
          const bedTime = new Date(updatedData.bedTime || record.bedTime);
          const wakeTime = new Date(updatedData.wakeTime || record.wakeTime);
          const durationMs = wakeTime - bedTime;
          durationMinutes = Math.floor(durationMs / (1000 * 60));
        }
        
        return { 
          ...record, 
          ...updatedData,
          durationMinutes,
          updatedAt: new Date().toISOString() 
        };
      }
      return record;
    });
    
    if (!found) {
      console.warn(`ไม่พบข้อมูลการนอน ID: ${recordId} สำหรับการอัพเดท`);
      return false;
    }
    
    const success = await saveSleepData(updatedRecords);
    if (!success) {
      throw new Error('Failed to update sleep record');
    }
    
    console.log(`อัพเดทข้อมูลการนอนสำเร็จ ID: ${recordId}`);
    return true;
  } catch (error) {
    console.error('Error updating sleep record:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัพเดทข้อมูลการนอนได้');
    throw error;
  }
};

// ลบข้อมูลการนอน
export const deleteSleepRecord = async (recordId) => {
  try {
    if (!recordId) {
      throw new Error('Invalid sleep record ID');
    }
    
    const sleepRecords = await loadSleepData();
    const initialLength = sleepRecords.length;
    const updatedRecords = sleepRecords.filter(record => record.id !== recordId);
    
    if (updatedRecords.length === initialLength) {
      console.warn(`ไม่พบข้อมูลการนอน ID: ${recordId} สำหรับการลบ`);
      return false;
    }
    
    const success = await saveSleepData(updatedRecords);
    if (!success) {
      throw new Error('Failed to delete sleep record');
    }
    
    console.log(`ลบข้อมูลการนอนสำเร็จ ID: ${recordId}`);
    return true;
  } catch (error) {
    console.error('Error deleting sleep record:', error);
    Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลการนอนได้');
    throw error;
  }
};

// โหลดเป้าหมายการนอน
export const loadSleepGoals = async () => {
  try {
    const storedGoals = await AsyncStorage.getItem(SLEEP_GOALS_KEY);
    if (storedGoals) {
      return JSON.parse(storedGoals);
    }
    
    // ถ้าไม่มีข้อมูล ให้สร้างค่าเริ่มต้น
    const defaultGoals = {
      targetHours: 8,
      bedTimeTarget: '23:00',
      wakeTimeTarget: '07:00',
      weekdayBedTime: '23:00',
      weekdayWakeTime: '07:00',
      weekendBedTime: '23:30',
      weekendWakeTime: '08:00',
      consistency: true
    };
    
    await saveSleepGoals(defaultGoals);
    return defaultGoals;
  } catch (error) {
    console.error('Error loading sleep goals:', error);
    return null;
  }
};

// บันทึกเป้าหมายการนอน
export const saveSleepGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(SLEEP_GOALS_KEY, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error('Error saving sleep goals:', error);
    return false;
  }
};

// คำนวณคะแนนคุณภาพการนอน (0-100)
export const calculateSleepQualityScore = (record) => {
  if (!record) return 0;
  
  let score = 0;
  const MAX_SCORE = 100;
  
  // 1. พิจารณาระยะเวลาการนอน (40 คะแนน)
  const durationHours = record.durationMinutes / 60;
  if (durationHours >= 7 && durationHours <= 9) {
    score += 40; // ระยะเวลาการนอนที่เหมาะสม
  } else if (durationHours >= 6 && durationHours < 7) {
    score += 30; // นอนน้อยเกินไปเล็กน้อย
  } else if (durationHours > 9 && durationHours <= 10) {
    score += 30; // นอนมากเกินไปเล็กน้อย
  } else if (durationHours >= 5 && durationHours < 6) {
    score += 20; // นอนน้อยเกินไปปานกลาง
  } else if (durationHours > 10) {
    score += 20; // นอนมากเกินไปปานกลาง
  } else {
    score += 10; // นอนน้อยมาก
  }
  
  // 2. พิจารณาจำนวนครั้งที่ตื่นระหว่างการนอน (30 คะแนน)
  const wakeups = record.interruptions || 0;
  if (wakeups === 0) {
    score += 30;
  } else if (wakeups === 1) {
    score += 25;
  } else if (wakeups === 2) {
    score += 20;
  } else if (wakeups === 3) {
    score += 15;
  } else if (wakeups === 4) {
    score += 10;
  } else {
    score += 5;
  }
  
  // 3. พิจารณาความล่าช้าในการนอนหลับ (15 คะแนน)
  const fallAsleepTime = record.timeToFallAsleep || 0; // นาที
  if (fallAsleepTime <= 15) {
    score += 15;
  } else if (fallAsleepTime <= 30) {
    score += 10;
  } else if (fallAsleepTime <= 60) {
    score += 5;
  }
  
  // 4. พิจารณาคุณภาพการนอนตามความรู้สึก (15 คะแนน)
  if (record.quality) {
    if (record.quality === 'excellent') {
      score += 15;
    } else if (record.quality === 'good') {
      score += 12;
    } else if (record.quality === 'average') {
      score += 9;
    } else if (record.quality === 'poor') {
      score += 5;
    } else if (record.quality === 'bad') {
      score += 2;
    }
  }
  
  // ถ้าไม่มีข้อมูลอื่นๆ นอกจากเวลานอนและตื่น ใช้เกณฑ์ง่ายๆ
  if (!record.interruptions && !record.timeToFallAsleep && !record.quality) {
    // ถ้าระยะเวลาการนอนเหมาะสม (7-9 ชั่วโมง) ให้คะแนนสูง
    if (durationHours >= 7 && durationHours <= 9) {
      return 85;
    } else if ((durationHours >= 6 && durationHours < 7) || (durationHours > 9 && durationHours <= 10)) {
      return 70;
    } else {
      return 50;
    }
  }
  
  return Math.min(MAX_SCORE, score);
};

// วิเคราะห์รูปแบบการนอน
export const analyzeSleepPatterns = (sleepRecords, days = 30) => {
  if (!sleepRecords || sleepRecords.length === 0) {
    return null;
  }
  
  // กรองเฉพาะข้อมูลช่วงเวลาที่ต้องการวิเคราะห์
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentRecords = sleepRecords
    .filter(record => new Date(record.createdAt) >= cutoffDate)
    .sort((a, b) => new Date(a.bedTime) - new Date(b.bedTime));
  
  if (recentRecords.length === 0) {
    return null;
  }
  
  // คำนวณค่าเฉลี่ยต่างๆ
  const totalDuration = recentRecords.reduce((sum, record) => sum + record.durationMinutes, 0);
  const avgDurationMinutes = totalDuration / recentRecords.length;
  
  // คำนวณความสม่ำเสมอของเวลานอน (พิจารณาจากความเบี่ยงเบนมาตรฐานของเวลานอน)
  const bedTimes = recentRecords.map(record => {
    const date = new Date(record.bedTime);
    return date.getHours() * 60 + date.getMinutes(); // แปลงเป็นนาทีตั้งแต่เที่ยงคืน
  });
  
  const avgBedTime = bedTimes.reduce((sum, time) => sum + time, 0) / bedTimes.length;
  const bedTimeVariance = bedTimes.reduce((sum, time) => sum + Math.pow(time - avgBedTime, 2), 0) / bedTimes.length;
  const bedTimeStdDev = Math.sqrt(bedTimeVariance);
  
  // ระดับความสม่ำเสมอ (ยิ่งน้อยยิ่งดี)
  let consistencyLevel = 'excellent';
  if (bedTimeStdDev > 90) { // เบี่ยงเบนมากกว่า 1.5 ชั่วโมง
    consistencyLevel = 'poor';
  } else if (bedTimeStdDev > 60) { // เบี่ยงเบนมากกว่า 1 ชั่วโมง
    consistencyLevel = 'fair';
  } else if (bedTimeStdDev > 30) { // เบี่ยงเบนมากกว่า 30 นาที
    consistencyLevel = 'good';
  }
  
  // แปลงเวลาเฉลี่ยกลับเป็นรูปแบบ HH:MM
  const avgBedTimeHours = Math.floor(avgBedTime / 60);
  const avgBedTimeMinutes = Math.floor(avgBedTime % 60);
  
  // ป้องกันค่า NaN
  const formattedAvgBedTime = !isNaN(avgBedTimeHours) && !isNaN(avgBedTimeMinutes) 
    ? `${avgBedTimeHours.toString().padStart(2, '0')}:${avgBedTimeMinutes.toString().padStart(2, '0')}`
    : '00:00';
  
  // คำนวณคุณภาพการนอนเฉลี่ย
  const qualityScores = recentRecords.map(record => calculateSleepQualityScore(record));
  const avgQualityScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  
  // ระดับคุณภาพการนอนเฉลี่ย
  let qualityLevel = 'average';
  if (avgQualityScore >= 90) {
    qualityLevel = 'excellent';
  } else if (avgQualityScore >= 80) {
    qualityLevel = 'very good';
  } else if (avgQualityScore >= 70) {
    qualityLevel = 'good';
  } else if (avgQualityScore >= 60) {
    qualityLevel = 'fair';
  } else if (avgQualityScore >= 50) {
    qualityLevel = 'poor';
  } else {
    qualityLevel = 'very poor';
  }
  
  return {
    daysAnalyzed: recentRecords.length,
    avgDurationHours: (avgDurationMinutes / 60).toFixed(1),
    avgDurationMinutes: Math.round(avgDurationMinutes),
    avgBedTime: formattedAvgBedTime,
    consistency: consistencyLevel,
    consistencyScore: 100 - Math.min(100, Math.round(bedTimeStdDev)),
    avgQualityScore: Math.round(avgQualityScore),
    qualityLevel,
    recentTrend: avgQualityScore > 70 ? 'positive' : avgQualityScore > 50 ? 'neutral' : 'negative',
  };
}; 