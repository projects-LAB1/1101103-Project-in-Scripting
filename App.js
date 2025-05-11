import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, LogBox, AppState } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { AlarmSoundProvider } from './contexts/AlarmSoundContext';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
// Import Firebase configuration
import './firebase/config';
// Import AppStateManager
import { initAppStateMonitoring, setupAppStateNotificationHandlers } from './utils/AppStateManager';

// ตั้งค่าการทำงานและปิดคำเตือนที่ไม่จำเป็น
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer for a long period of time',
  'expo-permissions is now deprecated',
]);

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

  // ตั้งค่าระบบเสียงและการแจ้งเตือนเร็วขึ้น
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // เตรียมระบบเสียงให้พร้อมใช้งาน
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
        }).catch(() => {});

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
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
  }, []);

  // ติดตามสถานะแอปเพื่อลดการล่าช้า
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
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

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlarmSoundProvider>
          <RootNavigator ref={navigationRef} />
        </AlarmSoundProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
