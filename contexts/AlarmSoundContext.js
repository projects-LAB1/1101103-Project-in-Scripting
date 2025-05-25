import React, { createContext, useState, useContext, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform, AppState } from 'react-native';

const AlarmSoundContext = createContext();

export const useAlarmSound = () => {
  return useContext(AlarmSoundContext);
};

export const AlarmSoundProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alarmData, setAlarmData] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false); // Start with false to ensure initialization
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  // ฟังก์ชันตั้งค่า Audio Mode แยกตาม Platform
  const setAudioMode = async (playMode = true) => {
    try {
      // Make sure to call setIsEnabledAsync before setting audio mode
      const isEnabled = await Audio.setIsEnabledAsync(true);
      console.log('Audio enabled status:', isEnabled);
      
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

  // ฟังก์ชันสำหรับเริ่มต้นระบบเสียงใหม่
  const initializeAudioSystem = async (retryCount = 0) => {
    try {
      console.log(`Initializing audio system (attempt ${retryCount + 1})...`);
      
      // First ensure audio is disabled, then re-enable it (helps reset the audio system)
      try {
        await Audio.setIsEnabledAsync(false);
        // Small delay to ensure the audio system has time to reset
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log('Reset audio state error (non-critical):', e.message);
      }
      
      // Now enable audio
      const enableResult = await Audio.setIsEnabledAsync(true);
      console.log('Audio enable result:', enableResult);
      
      // Set initial audio mode using our safe function
      const success = await setAudioMode(false);
      setAudioEnabled(success);
      
      console.log('Audio system initialized successfully:', success);
      return success;
    } catch (error) {
      console.error(`Audio initialization error (attempt ${retryCount + 1}):`, error);
      
      // If we haven't exceeded max retries, try again
      if (retryCount < 3) {
        console.log(`Retrying audio initialization in ${(retryCount + 1) * 500}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
        return initializeAudioSystem(retryCount + 1);
      }
      
      setAudioEnabled(false);
      return false;
    }
  };

  // ติดตามสถานะแอปเพื่อรีเซ็ตระบบเสียงเมื่อแอปกลับมาทำงาน
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // เมื่อแอปกลับมาทำงาน ให้รีเซ็ตระบบเสียงอีกครั้ง
        console.log('App is active, reinitializing audio system...');
        initializeAudioSystem();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Initialize audio system when component mounts
    const initAudio = async () => {
      const success = await initializeAudioSystem();
      
      // If initial attempt failed, schedule additional attempts
      if (!success) {
        // Try again after 1 second
        setTimeout(async () => {
          console.log('Scheduled retry of audio initialization...');
          const retrySuccess = await initializeAudioSystem();
          
          if (!retrySuccess) {
            // Final attempt after 3 seconds
            setTimeout(async () => {
              console.log('Final attempt at audio initialization...');
              await initializeAudioSystem();
            }, 3000);
          }
        }, 1000);
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
      console.log('Attempting to play alarm sound, audio enabled:', audioEnabled);
      
      // If audio system is not enabled, try to enable it first
      if (!audioEnabled) {
        console.log('Audio not enabled, attempting to initialize before playing...');
        const initSuccess = await initializeAudioSystem();
        
        if (!initSuccess) {
          console.error('Failed to initialize audio system, cannot play sound');
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
        console.log('No alarm configuration provided');
        setAlarmData(null);
        return null;
      }

      setAlarmData(alarmConfig);
      
      // Reset audio mode to ensure it works properly using our safe function
      const audioModeSuccess = await setAudioMode(true);
      if (!audioModeSuccess) {
        console.error('Failed to set audio mode for playback');
        // Try one more time
        await Audio.setIsEnabledAsync(true);
        await setAudioMode(true);
      }
      
      // เลือกไฟล์เสียงตามการตั้งค่า
      const selectedSoundId = alarmConfig?.soundId || "default";
      console.log('Selected sound ID:', selectedSoundId);
      
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
      
      console.log('Loading sound file...');
      
      // Ensure audio is enabled right before playing
      await Audio.setIsEnabledAsync(true);
      
      // Use different approach for Android vs iOS
      let newSound;
      try {
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
        
        console.log('Sound loaded and playing successfully');
        setSound(newSound);
        setIsPlaying(true);
        
        return newSound;
      } catch (soundError) {
        console.error('Error creating sound object:', soundError);
        
        // Try a different approach as fallback
        try {
          console.log('Trying fallback sound loading method...');
          // Ensure audio is enabled again
          await Audio.setIsEnabledAsync(true);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const fallbackSound = new Audio.Sound();
          await fallbackSound.loadAsync(soundFile);
          await fallbackSound.setIsLoopingAsync(true);
          await fallbackSound.playAsync();
          
          setSound(fallbackSound);
          setIsPlaying(true);
          return fallbackSound;
        } catch (fallbackError) {
          console.error('Fallback sound loading failed:', fallbackError);
          return null;
        }
      }
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      // Try to recover audio system
      try {
        await Audio.setIsEnabledAsync(false);
        await new Promise(resolve => setTimeout(resolve, 300));
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