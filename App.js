import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, LogBox, AppState, View, Text, Alert } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { AlarmSoundProvider } from './contexts/AlarmSoundContext';
import { SleepProvider } from './contexts/SleepContext';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; // Import Constants to check for Expo Go environment
// Import Firebase configuration
import { auth, db } from './firebase/config';
// Import AppStateManager
import { initAppStateMonitoring, setupAppStateNotificationHandlers } from './utils/AppStateManager';

// ตั้งค่าการทำงานและปิดคำเตือนที่ไม่จำเป็น
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer for a long period of time',
  'expo-permissions is now deprecated',
  'interruptionModeIOS', // เพิ่มการ ignore log เกี่ยวกับ interruptionModeIOS
  // เพิ่มการ ignore สำหรับการแจ้งเตือนของ expo-notifications ใน Expo Go
  'Android Push notifications (remote notifications) functionality provided by expo-notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

// แสดงข้อความสำหรับ developer ว่าเราใช้เฉพาะ local notifications
if (__DEV__ && Constants.appOwnership === 'expo') {
  console.log('\n############### NOTIFICATION INFO ###############');
  console.log('This app only uses LOCAL notifications for alarms, which continue to work in Expo Go.');
  console.log('The SDK 53 warning about push notifications can be safely ignored.');
  console.log('For production builds, we recommend creating a development build using:');
  console.log('npx eas build --profile development --platform android');
  console.log('###############################################\n');
}

// ตั้งค่าการแจ้งเตือนตั้งแต่เริ่มแอป
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: 'max',
  }),
});

export default function App() {
  const navigationRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // ตรวจสอบการเชื่อมต่อ Firebase
  useEffect(() => {
    // กำหนดเวลาสูงสุดที่รอ Firebase (5 วินาที)
    const timeoutId = setTimeout(() => {
      console.log("Firebase connection timed out, continuing without Firebase...");
      setFirebaseReady(true); // ให้แอปทำงานต่อไปแม้ Firebase จะไม่พร้อม
    }, 5000);

    // ทดสอบการเชื่อมต่อ Firebase
    const checkFirebaseConnection = async () => {
      try {
        console.log("Testing Firebase connection...");
        
        // ทำการเรียก API ง่ายๆ เพื่อตรวจสอบการเชื่อมต่อ
        if (auth) {
          console.log("Firebase auth instance exists");
          setFirebaseReady(true);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Firebase connection error:", error);
        // ไม่ต้องตั้งค่า firebaseReady ที่นี่ เพราะ timeout จะทำให้แอปทำงานต่อไปได้
      }
    };

    checkFirebaseConnection();

    return () => clearTimeout(timeoutId);
  }, []);

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

  // ปิดการแสดงหน้า AlarmRinging โดยอัตโนมัติเมื่อแอปเริ่มทำงาน
  useEffect(() => {
    const disableAppExitMonitoring = async () => {
      try {
        await AsyncStorage.setItem('@app_exit_monitoring_enabled', 'false');
        console.log('App exit monitoring disabled');
      } catch (error) {
        console.error('Error disabling app exit monitoring:', error);
      }
    };
    
    disableAppExitMonitoring();
  }, []);

  // ตั้งค่าระบบเสียงและการแจ้งเตือนเร็วขึ้น
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // ตั้งค่า audio mode ด้วยฟังก์ชันที่ปลอดภัย
        const success = await setAudioMode(false);
        
        // ตั้งค่าช่องทางการแจ้งเตือนสำหรับ Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('alarms', {
            name: 'Alarms',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 100, 100, 100],
            sound: true,
            enableVibrate: true,
            enableLights: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
          });
        }
        
        setAudioInitialized(success);
      } catch (error) {
        console.error('Error setting up audio:', error);
        
        // Try to recover audio system
        try {
          await Audio.setIsEnabledAsync(false);
          await Audio.setIsEnabledAsync(true);
          setAudioInitialized(true);
        } catch (recoveryError) {
          console.error('Failed to recover audio system:', recoveryError);
        }
      }
    };

    setupAudio();
    
    // Clean up audio on app exit
    return () => {
      const cleanupAudio = async () => {
        try {
          await Audio.setIsEnabledAsync(false);
        } catch (error) {
          // Ignore cleanup errors
        }
      };
      
      cleanupAudio();
    };
  }, []);

  // ติดตามสถานะแอปเพื่อลดการล่าช้า
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // When app comes to foreground from background, reinitialize audio if needed
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const reinitAudio = async () => {
          try {
            await setAudioMode(false);
          } catch (error) {
            console.error('Error reinitializing audio:', error);
          }
        };
        
        reinitAudio();
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize app state monitoring
  useEffect(() => {
    // We'll initialize it once we have navigation available
    const unsubscribeAppState = initAppStateMonitoring(navigationRef.current);
    const unsubscribeNotificationHandlers = setupAppStateNotificationHandlers(navigationRef.current);

    // Clean up listeners on unmount
    return () => {
      if (unsubscribeAppState) unsubscribeAppState();
      if (unsubscribeNotificationHandlers) unsubscribeNotificationHandlers();
    };
  }, []);

  // ถ้ามีปัญหากับ Firebase หรือระบบเสียง ให้สามารถใช้แอปได้อยู่
  // แสดงแอปเสมอ ไม่ว่า Firebase หรือ audio จะพร้อมหรือไม่
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlarmSoundProvider>
          <SleepProvider>
            <RootNavigator ref={navigationRef} />
          </SleepProvider>
        </AlarmSoundProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
