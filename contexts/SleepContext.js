import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  fetchSleepData, 
  addSleepRecordToFirestore, 
  updateSleepRecordInFirestore, 
  deleteSleepRecordFromFirestore,
  fetchSleepGoals,
  saveSleepGoalsToFirestore
} from '../utils/firebaseStorage';

// ยังคงใช้ฟังก์ชันวิเคราะห์ข้อมูลจาก sleepStorage
import { analyzeSleepPatterns } from '../utils/sleepStorage';
import { auth } from '../firebase/config';

// Create the context
const SleepContext = createContext();

// Custom hook to use the sleep context
export const useSleep = () => useContext(SleepContext);

// Provider component
export const SleepProvider = ({ children }) => {
  const [sleepRecords, setSleepRecords] = useState([]);
  const [sleepGoals, setSleepGoals] = useState(null);
  const [sleepAnalytics, setSleepAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      if (user) {
        loadSleepDataFromFirestore();
      } else {
        // รีเซ็ตข้อมูลเมื่อออกจากระบบ
        setSleepRecords([]);
        setSleepGoals(null);
        setSleepAnalytics(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // โหลดข้อมูลจาก Firestore
  const loadSleepDataFromFirestore = async () => {
    try {
      setLoading(true);
      
      // โหลดข้อมูลการนอน
      const records = await fetchSleepData();
      setSleepRecords(records);
      
      // โหลดเป้าหมายการนอน
      const goals = await fetchSleepGoals();
      setSleepGoals(goals);
      
      // วิเคราะห์ข้อมูลถ้ามีข้อมูลเพียงพอ
      if (records && records.length > 0) {
        try {
          const analytics = analyzeSleepPatterns(records);
          if (analytics) {
            setSleepAnalytics(analytics);
          }
        } catch (analyticsError) {
          console.error('Error analyzing sleep patterns:', analyticsError);
          // ถ้าวิเคราะห์ไม่สำเร็จ ให้สร้างข้อมูลเริ่มต้น
          setSleepAnalytics({
            avgDurationHours: '0.0',
            avgBedTime: '00:00',
            consistencyScore: 0,
            daysAnalyzed: 0,
            message: 'ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์',
            stats: {
              averageDurationHours: '0.0',
              consistencyScore: 0,
              daysAnalyzed: 0
            }
          });
        }
      } else {
        // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลเริ่มต้น
        setSleepAnalytics({
          avgDurationHours: '0.0',
          avgBedTime: '00:00',
          consistencyScore: 0,
          daysAnalyzed: 0,
          message: 'ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์',
          stats: {
            averageDurationHours: '0.0',
            consistencyScore: 0,
            daysAnalyzed: 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading sleep data from Firestore:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // รีเฟรชข้อมูล
  const refresh = async () => {
    if (!isLoggedIn) {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    try {
      // โหลดข้อมูลการนอน
      const records = await fetchSleepData();
      setSleepRecords(records);
      
      // โหลดเป้าหมายการนอน
      const goals = await fetchSleepGoals();
      setSleepGoals(goals);
      
      // วิเคราะห์ข้อมูลถ้ามีข้อมูลเพียงพอ
      if (records && records.length > 0) {
        try {
          const analytics = analyzeSleepPatterns(records);
          if (analytics) {
            setSleepAnalytics(analytics);
          }
        } catch (analyticsError) {
          console.error('Error analyzing sleep patterns:', analyticsError);
          // ถ้าวิเคราะห์ไม่สำเร็จ ให้สร้างข้อมูลเริ่มต้น
          setSleepAnalytics({
            avgDurationHours: '0.0',
            avgBedTime: '00:00',
            consistencyScore: 0,
            daysAnalyzed: 0,
            message: 'ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์',
            stats: {
              averageDurationHours: '0.0',
              consistencyScore: 0,
              daysAnalyzed: 0
            }
          });
        }
      } else {
        // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลเริ่มต้น
        setSleepAnalytics({
          avgDurationHours: '0.0',
          avgBedTime: '00:00',
          consistencyScore: 0,
          daysAnalyzed: 0,
          message: 'ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์',
          stats: {
            averageDurationHours: '0.0',
            consistencyScore: 0,
            daysAnalyzed: 0
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing sleep data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // เพิ่มข้อมูลการนอนใหม่
  const addSleep = async (sleepRecord) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล');
      }
      
      console.log('กำลังบันทึกข้อมูลการนอน:', sleepRecord);
      const newRecord = await addSleepRecordToFirestore(sleepRecord);
      console.log('บันทึกสำเร็จ, ข้อมูลใหม่:', newRecord);
      
      // อัพเดทข้อมูลใน state ทันที
      const updatedRecords = [...sleepRecords, newRecord];
      setSleepRecords(updatedRecords);
      
      // อัพเดทการวิเคราะห์ด้วยข้อมูลใหม่
      try {
        const analytics = analyzeSleepPatterns(updatedRecords);
        setSleepAnalytics(analytics);
      } catch (analyticsError) {
        console.error('Error analyzing sleep patterns:', analyticsError);
      }
      
      console.log('อัพเดท state สำเร็จ, จำนวนข้อมูลทั้งหมด:', updatedRecords.length);
      return newRecord;
    } catch (error) {
      console.error('Error adding sleep record in context:', error);
      throw error;
    }
  };

  // อัพเดทข้อมูลการนอน
  const updateSleep = async (id, data) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนอัพเดทข้อมูล');
      }
      
      const success = await updateSleepRecordInFirestore(id, data);
      if (success) {
        // อัพเดทข้อมูลใน state
        const updatedRecords = sleepRecords.map(record => 
          record.id === id ? { ...record, ...data } : record
        );
        setSleepRecords(updatedRecords);
        
        // อัพเดทการวิเคราะห์
        const analytics = analyzeSleepPatterns(updatedRecords);
        setSleepAnalytics(analytics);
      }
      return success;
    } catch (error) {
      console.error('Error updating sleep record in context:', error);
      throw error;
    }
  };

  // ลบข้อมูลการนอน
  const deleteSleep = async (id) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนลบข้อมูล');
      }
      
      const success = await deleteSleepRecordFromFirestore(id);
      if (success) {
        // ลบข้อมูลออกจาก state
        const updatedRecords = sleepRecords.filter(record => record.id !== id);
        setSleepRecords(updatedRecords);
        
        // อัพเดทการวิเคราะห์
        const analytics = analyzeSleepPatterns(updatedRecords);
        setSleepAnalytics(analytics);
      }
      return success;
    } catch (error) {
      console.error('Error deleting sleep record in context:', error);
      throw error;
    }
  };

  // อัพเดทเป้าหมายการนอน
  const updateSleepGoals = async (goals) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนตั้งค่าเป้าหมาย');
      }
      
      const success = await saveSleepGoalsToFirestore(goals);
      if (success) {
        setSleepGoals(goals);
      }
      return success;
    } catch (error) {
      console.error('Error updating sleep goals in context:', error);
      throw error;
    }
  };

  // คำนวณสรุปสถิติสำหรับช่วง 7 วันที่ผ่านมา
  const getWeeklySummary = () => {
    if (sleepRecords.length === 0) {
      return null;
    }
    
    // ดึงข้อมูลย้อนหลัง 7 วัน
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekRecords = sleepRecords.filter(record => 
      new Date(record.bedTime) >= oneWeekAgo
    );
    
    if (weekRecords.length === 0) {
      return null;
    }
    
    // คำนวณระยะเวลาเฉลี่ย
    const totalDuration = weekRecords.reduce((sum, record) => sum + record.durationMinutes, 0);
    const avgDuration = totalDuration / weekRecords.length;
    
    // หาวันที่นอนมากที่สุดและน้อยที่สุด
    weekRecords.sort((a, b) => b.durationMinutes - a.durationMinutes);
    const bestSleep = weekRecords[0];
    const worstSleep = weekRecords[weekRecords.length - 1];
    
    return {
      recordsCount: weekRecords.length,
      avgDurationHours: (avgDuration / 60).toFixed(1),
      avgDurationMinutes: Math.round(avgDuration),
      bestSleep,
      worstSleep,
    };
  };

  // Provide the context value
  const value = {
    sleepRecords,
    sleepGoals,
    sleepAnalytics,
    loading,
    refreshing,
    refresh,
    addSleep,
    updateSleep,
    deleteSleep,
    updateSleepGoals,
    getWeeklySummary,
    isLoggedIn
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
}; 