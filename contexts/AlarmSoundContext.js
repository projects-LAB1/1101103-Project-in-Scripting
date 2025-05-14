import React, { createContext, useState, useContext, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const AlarmSoundContext = createContext();

export const useAlarmSound = () => {
  return useContext(AlarmSoundContext);
};

export const AlarmSoundProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alarmData, setAlarmData] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // ฟังก์ชันตั้งค่า Audio Mode แยกตาม Platform
  const setAudioMode = async (playMode = true) => {
    try {
      await Audio.setIsEnabledAsync(true);
      
      // แยกการตั้งค่าตาม platform เพื่อหลีกเลี่ยงปัญหา invalid value
      if (Platform.OS === 'ios') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: playMode,
          interruptionModeIOS: playMode ? 1 : 0, // 1=DO_NOT_MIX, 0=MIX_WITH_OTHERS
          playsInSilentModeIOS: playMode,
        });
      } else if (Platform.OS === 'android') {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: playMode,
          shouldDuckAndroid: playMode,
          interruptionModeAndroid: 1, // DO_NOT_MIX
          playThroughEarpieceAndroid: false,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting audio mode:', error);
      return false;
    }
  };

  useEffect(() => {
    // Initialize audio system when component mounts
    const initAudio = async () => {
      try {
        // Make sure audio is enabled
        await Audio.setIsEnabledAsync(true);
        
        // Set initial audio mode using our safe function
        const success = await setAudioMode(false);
        setAudioEnabled(success);
      } catch (error) {
        console.error('Error initializing audio system:', error);
        setAudioEnabled(false);
      }
    };

    initAudio();

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
        return;
      }
      
      // Safe stop - don't throw errors
      try {
        const status = await soundObj.getStatusAsync();
        if (status.isLoaded) {
          await soundObj.stopAsync();
        }
      } catch (e) {
        // Ignore errors on stop
      }
      
      // Safe unload - don't throw errors
      try {
        await soundObj.unloadAsync();
      } catch (e) {
        // Ignore errors on unload
      }
    } catch (error) {
      // Just log the error, don't throw
      console.error('Error cleaning up sound:', error);
    }
  };

  // เล่นเสียงปลุกใหม่
  const playAlarmSound = async (alarmConfig) => {
    try {
      // If audio system is not enabled, try to enable it first
      if (!audioEnabled) {
        try {
          await Audio.setIsEnabledAsync(true);
          setAudioEnabled(true);
        } catch (error) {
          console.error('Cannot enable audio system:', error);
          return null;
        }
      }

      // หยุดเสียงที่เล่นอยู่ก่อน (ถ้ามี) - ปรับปรุงให้รอจนหยุดเสียงเดิมเสร็จก่อนเล่นเสียงใหม่
      if (sound) {
        console.log('มีเสียงกำลังเล่นอยู่ กำลังหยุดเสียงเดิมก่อนเล่นเสียงใหม่...');
        await stopAlarmSound(); // เรียกใช้ stopAlarmSound เพื่อหยุดเสียงและทำความสะอาดทรัพยากรให้เรียบร้อย
        
        // รอให้เสียงเดิมหยุดเล่นจริงๆ
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // ตรวจสอบว่า alarmConfig มีค่าหรือไม่
      if (!alarmConfig) {
        setAlarmData(null);
        return null;
      }

      setAlarmData(alarmConfig);
      
      // Reset audio mode to ensure it works properly using our safe function
      await setAudioMode(true);
      
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
      
      // Use different approach for Android vs iOS
      let newSound;
      if (Platform.OS === 'android') {
        // On Android, load first then play separately
        const soundObject = new Audio.Sound();
        await soundObject.loadAsync(soundFile);
        await soundObject.setIsLoopingAsync(true);
        await soundObject.playAsync();
        newSound = soundObject;
      } else {
        // On iOS, use createAsync which is more reliable
        const { sound: createdSound } = await Audio.Sound.createAsync(
          soundFile,
          { 
            shouldPlay: true, 
            isLooping: true, 
            volume: 1.0,
          }
        );
        newSound = createdSound;
      }
      
      setSound(newSound);
      setIsPlaying(true);
      
      return newSound;
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Try to recover audio system
      try {
        await Audio.setIsEnabledAsync(false);
        await Audio.setIsEnabledAsync(true);
      } catch (e) {
        // Ignore recovery errors
      }
      return null;
    }
  };

  // หยุดเสียงปลุก
  const stopAlarmSound = async () => {
    try {
      if (!sound) {
        setIsPlaying(false);
        setAlarmData(null);
        return;
      }
      
      // เพิ่มการตรวจสอบว่าเสียงยังคงเล่นอยู่หรือไม่
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.stopAsync();
        }
      } catch (e) {
        // ถ้าเกิดข้อผิดพลาดในการตรวจสอบสถานะ ลองหยุดเสียงโดยตรง
        try {
          await sound.stopAsync();
        } catch (stopError) {
          // ไม่ต้องทำอะไรถ้าหยุดไม่ได้
        }
      }
      
      await stopAndUnloadSound(sound);
      
      // พยายามยกเลิกทุกเสียงในระบบซ้ำอีกครั้ง
      try {
        await Audio.stopAndUnloadAsync();
      } catch (e) {
        console.log('ไม่สามารถยกเลิกทุกเสียงในระบบได้:', e);
      }
      
      // รีเซ็ตระบบเสียงด้วยการปิดและเปิดใหม่
      try {
        await Audio.setIsEnabledAsync(false);
        await new Promise(resolve => setTimeout(resolve, 300)); 
        await Audio.setIsEnabledAsync(true);
      } catch (e) {
        console.log('ไม่สามารถรีเซ็ตระบบเสียงได้:', e);
      }
      
      // Reset audio mode using our safe function
      await setAudioMode(false);
      
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
      
      // ถ้าเกิดข้อผิดพลาด พยายามรีเซ็ตระบบเสียงทั้งหมด
      try {
        await Audio.setIsEnabledAsync(false);
        await Audio.setIsEnabledAsync(true);
        await Audio.stopAndUnloadAsync();
      } catch (e) {
        // ไม่ต้องทำอะไรถ้าการกู้คืนไม่สำเร็จ
      }
    } finally {
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
      console.error('Error setting volume:', error);
    }
  };

  const value = {
    sound,
    isPlaying,
    alarmData,
    playAlarmSound,
    stopAlarmSound,
    setAlarmVolume,
    audioEnabled
  };

  return (
    <AlarmSoundContext.Provider value={value}>
      {children}
    </AlarmSoundContext.Provider>
  );
};

export default AlarmSoundProvider; 