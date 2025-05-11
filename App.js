import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import { AlarmSoundProvider } from './contexts/AlarmSoundContext';
// Import Firebase configuration
import './firebase/config';
// Import AppStateManager
import { initAppStateMonitoring, setupAppStateNotificationHandlers } from './utils/AppStateManager';

export default function App() {
  const navigationRef = useRef(null);

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
