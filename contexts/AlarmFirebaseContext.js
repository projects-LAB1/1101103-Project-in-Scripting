import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  fetchAlarms, 
  addAlarmToFirestore, 
  updateAlarmInFirestore, 
  deleteAlarmFromFirestore,
  fetchAlarmSounds,
  saveAlarmSoundsToFirestore
} from '../utils/alarmFirestore';
import { syncAlarmsWithFirestore } from '../utils/alarmStorage';
import { auth } from '../firebase/config';

// Create the context
const AlarmContext = createContext();

// Custom hook to use the alarm context
export const useAlarms = () => useContext(AlarmContext);

// Provider component
export const AlarmProvider = ({ children }) => {
  const [alarms, setAlarms] = useState([]);
  const [alarmSounds, setAlarmSounds] = useState({
    defaultSound: 'digital_alarm',
    customSounds: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      if (user) {
        loadAlarmsFromFirestore();
        // เพิ่มการซิงค์ข้อมูลระหว่าง AsyncStorage และ Firestore
        syncAlarmsWithFirebase();
      } else {
        // รีเซ็ตข้อมูลเมื่อออกจากระบบ
        setAlarms([]);
        setAlarmSounds({
          defaultSound: 'digital_alarm',
          customSounds: []
        });
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // ซิงค์ข้อมูลระหว่าง AsyncStorage และ Firestore
  const syncAlarmsWithFirebase = async () => {
    try {
      const syncedAlarms = await syncAlarmsWithFirestore();
      console.log(`ซิงค์ข้อมูลการตั้งปลุกระหว่าง AsyncStorage และ Firestore สำเร็จ: ${syncedAlarms.length} รายการ`);
    } catch (error) {
      console.error('Error syncing alarms:', error);
    }
  };

  // โหลดข้อมูลการตั้งปลุกจาก Firestore
  const loadAlarmsFromFirestore = async () => {
    try {
      setLoading(true);
      
      // โหลดข้อมูลการตั้งปลุก
      const alarmsData = await fetchAlarms();
      setAlarms(alarmsData);
      
      // โหลดข้อมูลการตั้งค่าเสียงปลุก
      const soundsData = await fetchAlarmSounds();
      setAlarmSounds(soundsData);
      
    } catch (error) {
      console.error('Error loading alarms from Firestore:', error);
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
    await loadAlarmsFromFirestore();
  };

  // เพิ่มการตั้งปลุกใหม่
  const addAlarm = async (alarmData) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนตั้งปลุก');
      }
      
      const newAlarm = await addAlarmToFirestore(alarmData);
      setAlarms(prev => [...prev, newAlarm]);
      return newAlarm;
    } catch (error) {
      console.error('Error adding alarm in context:', error);
      throw error;
    }
  };

  // อัพเดทการตั้งปลุก
  const updateAlarm = async (id, data) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนอัพเดทการตั้งปลุก');
      }
      
      const success = await updateAlarmInFirestore(id, data);
      if (success) {
        // อัพเดทข้อมูลใน state
        const updatedAlarms = alarms.map(alarm => 
          alarm.id === id ? { ...alarm, ...data } : alarm
        );
        setAlarms(updatedAlarms);
      }
      return success;
    } catch (error) {
      console.error('Error updating alarm in context:', error);
      throw error;
    }
  };

  // ลบการตั้งปลุก
  const deleteAlarm = async (id) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนลบการตั้งปลุก');
      }
      
      const success = await deleteAlarmFromFirestore(id);
      if (success) {
        // ลบข้อมูลออกจาก state
        const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
        setAlarms(updatedAlarms);
      }
      return success;
    } catch (error) {
      console.error('Error deleting alarm in context:', error);
      throw error;
    }
  };

  // บันทึกการตั้งค่าเสียงปลุก
  const updateAlarmSounds = async (soundsData) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนตั้งค่าเสียงปลุก');
      }
      
      const success = await saveAlarmSoundsToFirestore(soundsData);
      if (success) {
        setAlarmSounds(soundsData);
      }
      return success;
    } catch (error) {
      console.error('Error updating alarm sounds in context:', error);
      throw error;
    }
  };

  // สลับการเปิด/ปิดการตั้งปลุก
  const toggleAlarmActive = async (id) => {
    try {
      if (!isLoggedIn) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนเปิด/ปิดการตั้งปลุก');
      }
      
      // หาการตั้งปลุกที่ต้องการและสลับสถานะ
      const alarm = alarms.find(a => a.id === id);
      if (!alarm) {
        throw new Error('ไม่พบการตั้งปลุกที่ต้องการ');
      }
      
      const success = await updateAlarmInFirestore(id, { active: !alarm.active });
      if (success) {
        // อัพเดทข้อมูลใน state
        const updatedAlarms = alarms.map(a => 
          a.id === id ? { ...a, active: !a.active } : a
        );
        setAlarms(updatedAlarms);
      }
      return success;
    } catch (error) {
      console.error('Error toggling alarm active state:', error);
      throw error;
    }
  };

  // เรียงลำดับการตั้งปลุกตามเวลา
  const getSortedAlarms = () => {
    return [...alarms].sort((a, b) => {
      if (a.hour !== b.hour) {
        return a.hour - b.hour;
      }
      return a.minute - b.minute;
    });
  };

  // Provide the context value
  const value = {
    alarms,
    alarmSounds,
    loading,
    refreshing,
    refresh,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    updateAlarmSounds,
    toggleAlarmActive,
    getSortedAlarms,
    isLoggedIn
  };

  return (
    <AlarmContext.Provider value={value}>
      {children}
    </AlarmContext.Provider>
  );
}; 