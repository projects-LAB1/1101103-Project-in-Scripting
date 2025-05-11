import React, { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldRequestBadgePermissions: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Configure background notifications (Android only)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('app-exit-alerts', {
    name: 'App Exit Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    sound: true,
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });
}

// App state tracking - singleton object to maintain state across imports
const appStateTracker = {
  lastAppState: 'active',
  appExitTime: null,
  isMonitoringEnabled: false,
  navigation: null,
  exitCheckTimer: null,
  isExitNotificationActive: false,
};

/**
 * Initialize app state monitoring
 * @param {Object} navigation - The navigation object to use for routing
 */
export const initAppStateMonitoring = (navigation) => {
  if (appStateTracker.isMonitoringEnabled) return;
  
  appStateTracker.isMonitoringEnabled = true;
  appStateTracker.navigation = navigation;
  
  // Start monitoring app state
  const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  
  // Set up periodic checks for app state
  if (!appStateTracker.exitCheckTimer) {
    appStateTracker.exitCheckTimer = setInterval(checkAppVisibility, 5000);
  }
  
  return () => {
    if (appStateSubscription) {
      appStateSubscription.remove();
    }
    if (appStateTracker.exitCheckTimer) {
      clearInterval(appStateTracker.exitCheckTimer);
      appStateTracker.exitCheckTimer = null;
    }
    appStateTracker.isMonitoringEnabled = false;
  };
};

/**
 * Additional check for app visibility using timer
 * This helps catch cases where AppState events might not trigger
 */
const checkAppVisibility = async () => {
  try {
    // Only proceed if monitoring is enabled and we're not already showing a notification
    if (!appStateTracker.isMonitoringEnabled || appStateTracker.isExitNotificationActive) {
      return;
    }
    
    const currentAppState = AppState.currentState;
    
    // If app is not active, show notification
    if (currentAppState !== 'active') {
      const timeSinceLastActive = appStateTracker.appExitTime 
        ? Date.now() - appStateTracker.appExitTime 
        : 0;
      
      // If app has been inactive for more than 2 seconds and monitoring is enabled
      if (timeSinceLastActive > 2000 || !appStateTracker.appExitTime) {
        const isMonitoringEnabled = await AsyncStorage.getItem('@app_exit_monitoring_enabled');
        if (isMonitoringEnabled !== 'false') {
          // Only show notification if one isn't already active
          if (!appStateTracker.isExitNotificationActive) {
            showAppExitNotification();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in checkAppVisibility:', error);
  }
};

/**
 * Handle app state changes
 * @param {string} nextAppState - The new app state
 */
const handleAppStateChange = async (nextAppState) => {
  const previousAppState = appStateTracker.lastAppState;
  
  // Detect app exit or background
  if (
    (previousAppState === 'active' && nextAppState.match(/inactive|background/)) || 
    (previousAppState === 'active' && nextAppState === 'unknown')
  ) {
    console.log('App has gone to background or exited');
    appStateTracker.appExitTime = Date.now();
    
    // Check if monitoring is enabled in settings
    const isMonitoringEnabled = await AsyncStorage.getItem('@app_exit_monitoring_enabled');
    if (isMonitoringEnabled !== 'false') {
      showAppExitNotification();
    }
  } 
  // Detect app returning to foreground
  else if (
    previousAppState.match(/inactive|background|unknown/) &&
    nextAppState === 'active' &&
    appStateTracker.appExitTime
  ) {
    const timeAway = Date.now() - appStateTracker.appExitTime;
    console.log(`App returned to foreground after ${timeAway}ms away`);
    
    // If the app was away for more than 2 seconds, dismiss exit notification
    if (timeAway > 2000) {
      // Cancel any exit notifications
      await Notifications.dismissAllNotificationsAsync();
      appStateTracker.isExitNotificationActive = false;
    }
    
    appStateTracker.appExitTime = null;
  }
  
  appStateTracker.lastAppState = nextAppState;
};

/**
 * Display a notification when the app exits or goes to background
 */
const showAppExitNotification = async () => {
  try {
    // Set flag to indicate notification is active
    appStateTracker.isExitNotificationActive = true;
    
    // Cancel any existing notifications
    await Notifications.dismissAllNotificationsAsync();
    
    // For Android, ensure we have the notification channel set up properly for full-screen intent
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('app-exit-alerts', {
        name: 'App Exit Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        sound: true,
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }
    
    // Instead of just showing a notification, use navigation to show the full-screen alert
    if (appStateTracker.navigation) {
      try {
        // Navigate to the AlarmRinging screen with special parameters
        appStateTracker.navigation.reset({
          index: 0,
          routes: [
            {
              name: "Alarm",
              params: {
                screen: "AlarmRinging",
                params: {
                  alarm: {
                    id: "app-exit-alert",
                    hour: new Date().getHours(),
                    minute: new Date().getMinutes(),
                    label: "แอปพลิเคชันปิดอยู่!",
                    requireGame: false,
                    isActive: true,
                    snooze: false,
                    vibrate: true,
                    soundId: "default",
                    soundName: "Default",
                  },
                  isFullscreen: true,
                  isAppExitAlert: true,
                },
              },
            },
          ],
        });
        console.log('Navigated to full-screen app exit alert');
        return; // If navigation works, don't show regular notification
      } catch (navError) {
        console.error('Error navigating to full-screen alert:', navError);
        // Fall back to notification if navigation fails
      }
    }
    
    // ตรวจสอบว่า Notifications.AndroidAction.DEFAULT มีค่าหรือไม่
    const defaultAction = Notifications.AndroidAction && Notifications.AndroidAction.DEFAULT 
      ? Notifications.AndroidAction.DEFAULT 
      : 'default';
    
    // Fallback: Schedule an immediate notification with full-screen intent
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ แอปพลิเคชันปิดอยู่! ⚠️',
        body: 'คลิกที่นี่เพื่อกลับเข้าสู่แอปพลิเคชัน',
        subtitle: 'การเตือน: แอปไม่ได้ทำงานในพื้นหลัง',
        data: { 
          isAppExitAlert: true,
          timestamp: Date.now(),
          fullscreenIntent: true,
        },
        sound: true,
        priority: 'max',
        vibrate: [0, 250, 250, 250],
        sticky: true, // Make notification persistent
        ...(Platform.OS === 'android' && { 
          channelId: 'app-exit-alerts',
          color: '#FF0000',
          autoCancel: false,
          // Android specific options for full-screen intent
          android: {
            priority: 'max',
            importance: 'max',
            sticky: true,
            autoCancel: false,
            color: '#FF0000',
            vibrationPattern: [0, 250, 250, 250],
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
            // Enable full-screen intent
            fullScreenIntent: true,
            shortcutId: 'app-exit-shortcut',
            categoryIdentifier: 'alarm',
            actions: [
              {
                title: 'กลับเข้าสู่แอป',
                icon: 'ic_launcher',
                buttonAction: defaultAction,
                id: 'open',
              }
            ],
          }
        }),
        ...(Platform.OS === 'ios' && {
          // iOS specific options
          sound: 'default',
          interruptionLevel: Notifications.IOSInterruptionLevel.CRITICAL,
          attachments: null,
          // iOS Critical alerts need permission
          critical: true,
        }),
      },
      trigger: null, // Show immediately
    });
    
    console.log('App exit notification displayed as fallback');
  } catch (error) {
    console.error('Error showing app exit notification:', error);
    appStateTracker.isExitNotificationActive = false;
  }
};

/**
 * Setup notification response handler
 */
export const setupAppStateNotificationHandlers = (navigation) => {
  // Handle notification when user taps it
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      try {
        const data = response.notification.request.content.data;
        
        // Check if this is an app-exit notification
        if (data?.isAppExitAlert) {
          console.log('User tapped on app exit notification');
          
          // If we have navigation available, route to a specific screen
          if (navigation) {
            navigation.navigate('Home');
          }
        }
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    }
  );
  
  return () => {
    if (responseSubscription) {
      responseSubscription.remove();
    }
  };
};

/**
 * Enable or disable app exit monitoring
 * @param {boolean} enabled - Whether monitoring should be enabled
 */
export const setAppExitMonitoring = async (enabled) => {
  try {
    await AsyncStorage.setItem('@app_exit_monitoring_enabled', enabled ? 'true' : 'false');
    console.log(`App exit monitoring ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error setting app exit monitoring:', error);
  }
};

/**
 * Check if app exit monitoring is enabled
 * @returns {Promise<boolean>} Whether monitoring is enabled
 */
export const isAppExitMonitoringEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem('@app_exit_monitoring_enabled');
    return value !== 'false'; // Default to true if not set
  } catch (error) {
    console.error('Error checking if app exit monitoring is enabled:', error);
    return true; // Default to true on error
  }
}; 