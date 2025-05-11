import React, { createContext, useState, useContext, useEffect } from 'react';
import { Audio } from 'expo-av';

const AlarmSoundContext = createContext();

export const useAlarmSound = () => {
  return useContext(AlarmSoundContext);
};

export const AlarmSoundProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alarmData, setAlarmData] = useState(null);

  useEffect(() => {
    // ทำความสะอาดเมื่อ component unmount
    return () => {
      if (sound) {
        stopAndUnloadSound(sound);
      }
    };
  }, []);

  // ฟังก์ชันหยุดและยกเลิกการโหลดเสียง
  const stopAndUnloadSound = async (soundObj) => {
    try {
      if (soundObj) {
        await soundObj.stopAsync().catch(err => console.log('Error stopping sound:', err));
        await soundObj.unloadAsync().catch(err => console.log('Error unloading sound:', err));
      }
    } catch (error) {
      console.error('Error cleaning up sound:', error);
    }
  };

  // เล่นเสียงปลุกใหม่
  const playAlarmSound = async (alarmConfig) => {
    try {
      // หยุดเสียงที่เล่นอยู่ก่อน (ถ้ามี)
      if (sound) {
        await stopAndUnloadSound(sound);
      }

      setAlarmData(alarmConfig);
      
      // เลือกไฟล์เสียงตามการตั้งค่า
      const selectedSoundId = alarmConfig?.soundId || "default";
      
      let soundFile;
      switch (selectedSoundId) {
        case "digital":
          soundFile = require('../assets/sounds/digital-alarm.mp3');
          break;
        case "rooster":
          soundFile = require('../assets/sounds/rooster-alarm.mp3');
          break;
        case "default":
        default:
          soundFile = require('../assets/sounds/default-alarm.mp3');
          break;
      }
      
      console.log(`กำลังเล่นเสียงปลุก: ${selectedSoundId}`);
      
      // สร้างและเล่นเสียง
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      console.log('เล่นเสียงปลุกจากคอนเท็กซ์สำเร็จ');
      
      return newSound;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเล่นเสียงปลุก:', error);
      
      // ลองเล่นเสียงเริ่มต้นถ้าเล่นเสียงที่เลือกไม่ได้
      try {
        const { sound: fallbackSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/default-alarm.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        
        setSound(fallbackSound);
        setIsPlaying(true);
        
        console.log('เล่นเสียงปลุกเริ่มต้นสำรองแทน');
        return fallbackSound;
      } catch (fallbackError) {
        console.error('ไม่สามารถเล่นเสียงปลุกได้เลย:', fallbackError);
        return null;
      }
    }
  };

  // หยุดเสียงปลุก
  const stopAlarmSound = async () => {
    try {
      if (sound) {
        await stopAndUnloadSound(sound);
        setSound(null);
        setIsPlaying(false);
        setAlarmData(null);
        console.log('หยุดเสียงปลุกสำเร็จ');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการหยุดเสียงปลุก:', error);
    }
  };

  // เปลี่ยนระดับเสียง
  const setAlarmVolume = async (volume) => {
    try {
      if (sound) {
        await sound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการปรับระดับเสียง:', error);
    }
  };

  return (
    <AlarmSoundContext.Provider
      value={{
        sound,
        isPlaying,
        alarmData,
        playAlarmSound,
        stopAlarmSound,
        setAlarmVolume
      }}
    >
      {children}
    </AlarmSoundContext.Provider>
  );
}; 