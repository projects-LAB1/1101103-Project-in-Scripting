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
      // หยุดเสียงที่เล่นอยู่ก่อน (ถ้ามี) แบบเร็ว
      if (sound) {
        try {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
          setSound(null);
        } catch (error) {
          // ไม่แสดงข้อผิดพลาดเพื่อเพิ่มความเร็ว
        }
      }

      // ตรวจสอบว่า alarmConfig มีค่าหรือไม่
      if (!alarmConfig) {
        console.log('ไม่มีข้อมูล alarmConfig ในการเล่นเสียง');
        setAlarmData(null);
        return null;
      }

      setAlarmData(alarmConfig);
      
      // เลือกไฟล์เสียงตามการตั้งค่า - ทำให้เร็วขึ้นโดยกำหนดค่าเริ่มต้น
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
        // กรณีเกิดข้อผิดพลาด ใช้เสียงเริ่มต้นทันที
        soundFile = require('../assets/sounds/default-alarm.mp3');
      }
      
      // สร้างและเล่นเสียงแบบเร็ว
      try {
        // ตั้งค่า Audio ล่วงหน้าเพื่อให้เล่นได้รวดเร็ว
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        }).catch(() => {});
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundFile,
          { 
            shouldPlay: true, 
            isLooping: true, 
            volume: 1.0,
            progressUpdateIntervalMillis: 1000, // ลดการอัพเดทสถานะ
          },
          // ไม่ใช้ callback เพื่อเพิ่มความเร็ว
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        return newSound;
      } catch (playError) {
        // กรณีเกิดข้อผิดพลาด ใช้วิธีเล่นแบบสำรอง
        try {
          const fallbackSound = new Audio.Sound();
          await fallbackSound.loadAsync(soundFile);
          await fallbackSound.setIsLoopingAsync(true);
          await fallbackSound.setVolumeAsync(1.0);
          await fallbackSound.playAsync();
          
          setSound(fallbackSound);
          setIsPlaying(true);
          
          return fallbackSound;
        } catch (fallbackError) {
          console.error('ไม่สามารถเล่นเสียงได้เลย:', fallbackError);
          return null;
        }
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเล่นเสียงปลุก:', error);
      return null;
    }
  };

  // หยุดเสียงปลุก
  const stopAlarmSound = async () => {
    console.log('===== เริ่มหยุดเสียงปลุก =====');
    try {
      if (!sound) {
        console.log('ไม่มีเสียงที่กำลังเล่นอยู่ - สำเร็จแล้ว');
        setIsPlaying(false);
        setAlarmData(null);
        setSound(null);
        return;
      }
      
      // ตรวจสอบสถานะเสียงก่อนเพื่อดูว่ายังเล่นอยู่หรือไม่
      let isPlayable = false;
      let isCurrentlyPlaying = false;
      
      try {
        const status = await sound.getStatusAsync().catch(err => {
          console.log('เกิดข้อผิดพลาดในการเรียกดูสถานะเสียง:', err);
          return null;
        });
        
        isPlayable = status && status.isLoaded !== false;
        isCurrentlyPlaying = isPlayable && status.isPlaying;
        
        console.log(`สถานะเสียง: isLoaded=${status?.isLoaded}, isPlaying=${status?.isPlaying}`);
      } catch (statusError) {
        console.log('ไม่สามารถตรวจสอบสถานะเสียงได้:', statusError);
      }
      
      // หยุดเสียงถ้ายังเล่นอยู่
      if (isPlayable) {
        try {
          console.log('กำลังพยายามหยุดเสียง...');
          await sound.stopAsync().catch(err => {
            console.log('Error stopping sound:', err);
          });
          console.log('หยุดเสียงสำเร็จ');
        } catch (stopError) {
          console.log('ไม่สามารถหยุดเสียงได้:', stopError);
        }
      } else {
        console.log('ไม่จำเป็นต้องหยุดเสียงเพราะไม่ได้อยู่ในสถานะที่เล่นได้');
      }
      
      // Unload เสียงไม่ว่าจะอยู่ในสถานะใด
      try {
        console.log('กำลังพยายาม unload เสียง...');
        await sound.unloadAsync().catch(err => {
          console.log('Error unloading sound:', err);
        });
        console.log('Unload เสียงสำเร็จ');
      } catch (unloadError) {
        console.log('ไม่สามารถ unload เสียงได้:', unloadError);
        // แม้จะมีข้อผิดพลาด ให้ดำเนินการต่อไป
      }
      
      // อีกทางเลือกหนึ่งคือใช้ Audio API โดยตรงเพื่อหยุดเสียงทั้งหมด
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        }).catch(err => {
          console.log('Error setting audio mode:', err);
        });
      } catch (audioModeError) {
        console.log('ไม่สามารถตั้งค่าโหมดเสียงได้:', audioModeError);
      }
      
      // คืนค่าทรัพยากรที่เสียงใช้
      try {
        await Audio.setIsEnabledAsync(false).catch(() => {});
        await Audio.setIsEnabledAsync(true).catch(() => {});
      } catch (audioResetError) {
        console.log('ไม่สามารถรีเซ็ต audio system ได้:', audioResetError);
      }
      
      // อัพเดตสถานะไม่ว่าการหยุดเสียงจะสำเร็จหรือไม่
      setSound(null);
      setIsPlaying(false);
      setAlarmData(null);
      console.log('การหยุดเสียงเสร็จสมบูรณ์');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการหยุดเสียงปลุก:', error);
      // แม้จะมีข้อผิดพลาด ยังต้องอัพเดตสถานะเพื่อป้องกันการค้างของ UI
      setSound(null);
      setIsPlaying(false);
      setAlarmData(null);
    }
    console.log('===== จบการหยุดเสียงปลุก =====');
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