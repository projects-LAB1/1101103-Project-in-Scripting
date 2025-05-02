import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import * as NotificationManager from './models/NotificationManager';

export default function App() {
  // เริ่มต้นระบบการแจ้งเตือนเมื่อแอพเริ่มทำงาน
  useEffect(() => {
    const initApp = async () => {
      try {
        // ขอสิทธิ์การแจ้งเตือนและตั้งค่าระบบการแจ้งเตือน
        await NotificationManager.initializeNotifications();
        console.log('เริ่มต้นระบบการแจ้งเตือนสำเร็จ');
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเริ่มต้นระบบการแจ้งเตือน:', error);
      }
    };

    initApp();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
