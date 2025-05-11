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
      if (!soundObj) {
        console.log('ไม่มี sound object ที่จะหยุดเสียง');
        return;
      }
      
      // ตรวจสอบสถานะของเสียงก่อนพยายามหยุด
      let isPlayable = false;
      try {
        const status = await soundObj.getStatusAsync().catch(() => null);
        isPlayable = status && (status.isLoaded !== false);
      } catch (statusError) {
        console.log('ไม่สามารถตรวจสอบสถานะของเสียงได้:', statusError);
      }
      
      // หยุดเสียงเฉพาะเมื่อเสียงมีสถานะที่สามารถเล่นได้
      if (isPlayable) {
        try {
          await soundObj.stopAsync().catch(err => {
            console.log('Error stopping sound:', err);
          });
        } catch (stopError) {
          console.log('ไม่สามารถหยุดเสียงได้:', stopError);
        }
      }
      
      // พยายาม unload ไม่ว่าจะตรวจสอบสถานะได้หรือไม่
      try {
        await soundObj.unloadAsync().catch(err => {
          console.log('Error unloading sound:', err);
        });
      } catch (unloadError) {
        console.log('ไม่สามารถนำเสียงออกจากหน่วยความจำได้:', unloadError);
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

      // ตรวจสอบว่า alarmConfig มีค่าหรือไม่
      if (!alarmConfig) {
        console.log('ไม่มีข้อมูล alarmConfig ในการเล่นเสียง');
        setAlarmData(null);
        return null;
      }

      setAlarmData(alarmConfig);
      
      // เลือกไฟล์เสียงตามการตั้งค่า
      const selectedSoundId = alarmConfig?.soundId || "default";
      
      let soundFile;
      try {
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
      } catch (loadError) {
        console.error('ไม่สามารถโหลดไฟล์เสียง:', loadError);
        // ใช้เสียงเริ่มต้นแทน
        try {
          soundFile = require('../assets/sounds/default-alarm.mp3');
        } catch (defaultLoadError) {
          console.error('ไม่สามารถโหลดไฟล์เสียงเริ่มต้น:', defaultLoadError);
          return null;
        }
      }
      
      // ตรวจสอบว่ามีไฟล์เสียงหรือไม่
      if (!soundFile) {
        console.error('ไม่มีไฟล์เสียงสำหรับเล่น');
        return null;
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
        let defaultSoundFile;
        try {
          defaultSoundFile = require('../assets/sounds/default-alarm.mp3');
        } catch (fileError) {
          console.error('ไม่สามารถโหลดไฟล์เสียงเริ่มต้น:', fileError);
          return null;
        }
        
        if (!defaultSoundFile) {
          console.error('ไม่มีไฟล์เสียงเริ่มต้น');
          return null;
        }
        
        const { sound: fallbackSound } = await Audio.Sound.createAsync(
          defaultSoundFile,
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
      if (!sound) {
        console.log('ไม่มีเสียงที่กำลังเล่นอยู่');
        setIsPlaying(false);
        setAlarmData(null);
        return;
      }
      
      try {
        await sound.stopAsync().catch(err => {
          console.log('Error stopping sound:', err);
          // อย่าทำให้โปรแกรมหยุดทำงานที่นี่ - ดำเนินการต่อไป
        });
      } catch (stopError) {
        console.log('ไม่สามารถหยุดเสียงได้:', stopError);
        // ดำเนินการต่อไปแม้ว่าจะมีข้อผิดพลาด
      }
      
      try {
        await sound.unloadAsync().catch(err => {
          console.log('Error unloading sound:', err);
          // อย่าทำให้โปรแกรมหยุดทำงานที่นี่ - ดำเนินการต่อไป
        });
      } catch (unloadError) {
        console.log('ไม่สามารถนำเสียงออกจากหน่วยความจำได้:', unloadError);
        // ดำเนินการต่อไปแม้ว่าจะมีข้อผิดพลาด
      }
      
      // อัพเดตสถานะไม่ว่าการหยุดเสียงจะสำเร็จหรือไม่
      setSound(null);
      setIsPlaying(false);
      setAlarmData(null);
      console.log('หยุดเสียงปลุกสำเร็จ');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการหยุดเสียงปลุก:', error);
      // แม้จะมีข้อผิดพลาด ยังต้องอัพเดตสถานะเพื่อป้องกันการค้างของ UI
      setSound(null);
      setIsPlaying(false);
      setAlarmData(null);
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