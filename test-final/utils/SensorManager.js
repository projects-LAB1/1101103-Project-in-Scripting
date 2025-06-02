import { Accelerometer, LightSensor } from 'expo-sensors';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const MOTION_THRESHOLD = 0.05; // เกณฑ์ความแรงของการเคลื่อนไหว
const SLEEP_DETECTION_INTERVAL = 5000; // ตรวจสอบทุก 5 วินาที
const SLEEP_MOTION_COUNT_THRESHOLD = 3; // จำนวนครั้งที่ไม่มีการเคลื่อนไหวก่อนถือว่านอน
const LIGHT_THRESHOLD_DARK = 5; // ค่าแสงที่ถือว่ามืด (0-1000)
const LIGHT_THRESHOLD_BRIGHT = 100; // ค่าแสงที่ถือว่าสว่าง (0-1000)

// สถานะการตรวจจับ
let isAccelerometerRunning = false;
let isLightSensorRunning = false;
let accelerometerSubscription = null;
let lightSensorSubscription = null;
let sleepDetectionInterval = null;

// ข้อมูลการเคลื่อนไหว
let motionData = {
  count: 0,
  noMotionCount: 0,
  sleepDetected: false,
  lastUpdate: null,
  motionValues: [],
};

// ข้อมูลแสง
let lightData = {
  currentLightLevel: null,
  recommendation: null,
  lastUpdate: null,
};

// Callbacks
let onSleepDetectedCallback = null;
let onWakeDetectedCallback = null;
let onLightLevelChangeCallback = null;

/**
 * เริ่มการตรวจจับการเคลื่อนไหวด้วย Accelerometer
 * @param {number} updateInterval ระยะเวลาในการอัปเดต (ms)
 * @returns {boolean} สถานะการเริ่มต้น
 */
export const startAccelerometerTracking = async (updateInterval = 1000) => {
  try {
    if (isAccelerometerRunning) {
      return true;
    }

    // ตรวจสอบว่าเซนเซอร์พร้อมใช้งานหรือไม่
    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      console.log('Accelerometer is not available on this device');
      return false;
    }

    // กำหนดความถี่ในการอัปเดต
    Accelerometer.setUpdateInterval(updateInterval);

    // เริ่มการสมัครรับข้อมูล
    accelerometerSubscription = Accelerometer.addListener(accelerometerData => {
      processAccelerometerData(accelerometerData);
    });

    // เริ่มตรวจจับการนอน
    startSleepDetection();

    isAccelerometerRunning = true;
    console.log('Accelerometer tracking started');
    return true;
  } catch (error) {
    console.error('Error starting accelerometer tracking:', error);
    return false;
  }
};

/**
 * หยุดการตรวจจับการเคลื่อนไหว
 */
export const stopAccelerometerTracking = () => {
  try {
    if (accelerometerSubscription) {
      accelerometerSubscription.remove();
      accelerometerSubscription = null;
    }

    if (sleepDetectionInterval) {
      clearInterval(sleepDetectionInterval);
      sleepDetectionInterval = null;
    }

    isAccelerometerRunning = false;
    console.log('Accelerometer tracking stopped');
    
    // รีเซ็ตข้อมูล
    motionData = {
      count: 0,
      noMotionCount: 0,
      sleepDetected: false,
      lastUpdate: null,
      motionValues: [],
    };
    
    return true;
  } catch (error) {
    console.error('Error stopping accelerometer tracking:', error);
    return false;
  }
};

/**
 * ประมวลผลข้อมูลจาก Accelerometer
 * @param {object} data ข้อมูลจาก Accelerometer
 */
const processAccelerometerData = (data) => {
  const { x, y, z } = data;
  
  // คำนวณขนาดของการเคลื่อนไหว (magnitude)
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  
  // เก็บค่าล่าสุด
  motionData.lastUpdate = new Date();
  motionData.motionValues.push({
    x, y, z,
    magnitude,
    timestamp: motionData.lastUpdate
  });
  
  // จำกัดขนาดของอาร์เรย์
  if (motionData.motionValues.length > 100) {
    motionData.motionValues.shift();
  }
  
  // ตรวจจับการเคลื่อนไหว
  if (Math.abs(magnitude - 1) > MOTION_THRESHOLD) {
    motionData.count++;
    
    // ถ้าเคยตรวจพบว่านอนแล้วแต่มีการเคลื่อนไหว ให้ถือว่าตื่นแล้ว
    if (motionData.sleepDetected && motionData.count > 5) {
      motionData.sleepDetected = false;
      motionData.noMotionCount = 0;
      
      // เรียก callback ถ้ามี
      if (onWakeDetectedCallback) {
        onWakeDetectedCallback();
      }
    }
  }
};

/**
 * เริ่มการตรวจจับการนอน
 */
const startSleepDetection = () => {
  if (sleepDetectionInterval) {
    clearInterval(sleepDetectionInterval);
  }
  
  sleepDetectionInterval = setInterval(() => {
    // ตรวจสอบข้อมูลเซนเซอร์ล่าสุด
    if (!motionData.lastUpdate || !motionData.motionValues.length) {
      return;
    }
    
    // ตรวจสอบว่ามีการเคลื่อนไหวในช่วงเวลาที่กำหนดหรือไม่
    const recentValues = motionData.motionValues.slice(-5);
    const isMoving = recentValues.some(v => Math.abs(v.magnitude - 1) > MOTION_THRESHOLD);
    
    if (!isMoving) {
      motionData.noMotionCount++;
      
      // ถ้าไม่มีการเคลื่อนไหวเป็นเวลานานพอ ให้ถือว่านอนหลับ
      if (motionData.noMotionCount >= SLEEP_MOTION_COUNT_THRESHOLD && !motionData.sleepDetected) {
        motionData.sleepDetected = true;
        
        // เรียก callback ถ้ามี
        if (onSleepDetectedCallback) {
          onSleepDetectedCallback({
            timestamp: new Date(),
            noMotionDuration: motionData.noMotionCount * (SLEEP_DETECTION_INTERVAL / 1000)
          });
        }
      }
    } else {
      // รีเซ็ตเมื่อมีการเคลื่อนไหว
      if (motionData.noMotionCount > 0) {
        motionData.noMotionCount = 0;
      }
    }
  }, SLEEP_DETECTION_INTERVAL);
};

/**
 * เริ่มการตรวจจับแสงด้วย Light Sensor
 * @param {number} updateInterval ระยะเวลาในการอัปเดต (ms)
 * @returns {boolean} สถานะการเริ่มต้น
 */
export const startLightSensorTracking = async (updateInterval = 1000) => {
  try {
    if (isLightSensorRunning) {
      return true;
    }

    // ตรวจสอบว่าเซนเซอร์พร้อมใช้งานหรือไม่ (แจ้งเตือนเฉพาะ Android เพราะ iOS ไม่มี Light Sensor)
    const isAvailable = await LightSensor.isAvailableAsync();
    if (!isAvailable) {
      if (Platform.OS === 'android') {
        console.log('Light sensor is not available on this device');
      }
      return false;
    }

    // กำหนดความถี่ในการอัปเดต
    LightSensor.setUpdateInterval(updateInterval);

    // เริ่มการสมัครรับข้อมูล
    lightSensorSubscription = LightSensor.addListener(lightData => {
      processLightSensorData(lightData);
    });

    isLightSensorRunning = true;
    console.log('Light sensor tracking started');
    return true;
  } catch (error) {
    console.error('Error starting light sensor tracking:', error);
    return false;
  }
};

/**
 * หยุดการตรวจจับแสง
 */
export const stopLightSensorTracking = () => {
  try {
    if (lightSensorSubscription) {
      lightSensorSubscription.remove();
      lightSensorSubscription = null;
    }

    isLightSensorRunning = false;
    console.log('Light sensor tracking stopped');
    
    // รีเซ็ตข้อมูล
    lightData = {
      currentLightLevel: null,
      recommendation: null,
      lastUpdate: null,
    };
    
    return true;
  } catch (error) {
    console.error('Error stopping light sensor tracking:', error);
    return false;
  }
};

/**
 * ประมวลผลข้อมูลจาก Light Sensor
 * @param {object} data ข้อมูลจาก Light Sensor
 */
const processLightSensorData = (data) => {
  // Light Sensor ส่งค่าแสงมาเป็น illuminance (ความสว่าง) หน่วยเป็น lux
  const lightLevel = data.illuminance;
  
  // เก็บค่าล่าสุด
  lightData.currentLightLevel = lightLevel;
  lightData.lastUpdate = new Date();
  
  // วิเคราะห์และให้คำแนะนำ
  let recommendation = '';
  
  if (lightLevel <= LIGHT_THRESHOLD_DARK) {
    recommendation = 'ความสว่างของห้องเหมาะสมกับการนอนหลับแล้ว';
  } else if (lightLevel <= LIGHT_THRESHOLD_BRIGHT) {
    recommendation = 'ความสว่างของห้องพอใช้ แต่ควรลดแสงลงอีกเพื่อการนอนที่ดีขึ้น';
  } else {
    recommendation = 'ห้องสว่างเกินไป ควรลดแสงลงเพื่อการนอนหลับที่มีคุณภาพ';
  }
  
  lightData.recommendation = recommendation;
  
  // เรียก callback ถ้ามี
  if (onLightLevelChangeCallback) {
    onLightLevelChangeCallback({
      lightLevel,
      recommendation,
      timestamp: lightData.lastUpdate
    });
  }
};

/**
 * ตั้งค่าฟังก์ชันที่จะเรียกเมื่อตรวจพบการนอน
 * @param {Function} callback ฟังก์ชันที่จะเรียก
 */
export const setOnSleepDetectedCallback = (callback) => {
  onSleepDetectedCallback = callback;
};

/**
 * ตั้งค่าฟังก์ชันที่จะเรียกเมื่อตรวจพบการตื่น
 * @param {Function} callback ฟังก์ชันที่จะเรียก
 */
export const setOnWakeDetectedCallback = (callback) => {
  onWakeDetectedCallback = callback;
};

/**
 * ตั้งค่าฟังก์ชันที่จะเรียกเมื่อระดับแสงเปลี่ยน
 * @param {Function} callback ฟังก์ชันที่จะเรียก
 */
export const setOnLightLevelChangeCallback = (callback) => {
  onLightLevelChangeCallback = callback;
};

/**
 * รับข้อมูลการเคลื่อนไหวล่าสุด
 * @returns {object} ข้อมูลการเคลื่อนไหว
 */
export const getMotionData = () => {
  return { ...motionData };
};

/**
 * รับข้อมูลแสงล่าสุด
 * @returns {object} ข้อมูลแสง
 */
export const getLightData = () => {
  return { ...lightData };
};

/**
 * บันทึกข้อมูลการตรวจจับการนอนอัตโนมัติ
 * @param {object} sleepData ข้อมูลการนอน
 */
export const saveSleepDetectionData = async (sleepData) => {
  try {
    const savedData = await AsyncStorage.getItem('@sleep_detection_data');
    let sleepDetectionHistory = [];
    
    if (savedData) {
      sleepDetectionHistory = JSON.parse(savedData);
    }
    
    sleepDetectionHistory.push({
      ...sleepData,
      id: Date.now().toString(),
    });
    
    // จำกัดจำนวนประวัติที่เก็บ (เก็บแค่ 30 รายการล่าสุด)
    if (sleepDetectionHistory.length > 30) {
      sleepDetectionHistory = sleepDetectionHistory.slice(-30);
    }
    
    await AsyncStorage.setItem('@sleep_detection_data', JSON.stringify(sleepDetectionHistory));
    return true;
  } catch (error) {
    console.error('Error saving sleep detection data:', error);
    return false;
  }
};

/**
 * ดึงข้อมูลประวัติการตรวจจับการนอนอัตโนมัติ
 * @returns {Array} ประวัติการตรวจจับการนอน
 */
export const getSleepDetectionHistory = async () => {
  try {
    const savedData = await AsyncStorage.getItem('@sleep_detection_data');
    
    if (savedData) {
      return JSON.parse(savedData);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting sleep detection history:', error);
    return [];
  }
};

/**
 * ลบข้อมูลประวัติการตรวจจับการนอนอัตโนมัติ
 * @returns {boolean} สถานะการลบ
 */
export const clearSleepDetectionHistory = async () => {
  try {
    await AsyncStorage.removeItem('@sleep_detection_data');
    return true;
  } catch (error) {
    console.error('Error clearing sleep detection history:', error);
    return false;
  }
}; 