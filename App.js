import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { AuthProvider } from './contexts/AuthContext';
import * as NotificationManager from './models/NotificationManager';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a background task for precise notification delivery
const EXACT_ALARM_TASK = 'EXACT_ALARM_TASK';

// Register task before app component loads
TaskManager.defineTask(EXACT_ALARM_TASK, async ({ data, error }) => {
  try {
    if (error) {
      console.error('Error in background exact alarm task:', error);
      return;
    }

    console.log('Exact alarm background task executed at:', new Date().toISOString());
    
    // Process the alarm data if provided
    if (data && data.alarmData) {
      console.log('Processing alarm data in background:', data.alarmData);
      
      // Trigger an immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.alarmData.title || 'Timer Complete',
          body: data.alarmData.body || 'Your timer has finished!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          data: {
            ...data.alarmData,
            triggeredByBackgroundTask: true,
            triggerTime: new Date().toISOString()
          }
        },
        trigger: null // null trigger means show immediately
      });
      
      // Log this event for debugging
      await AsyncStorage.setItem('@last_background_alarm', JSON.stringify({
        triggerTime: new Date().toISOString(),
        data: data.alarmData
      }));
    }
  } catch (taskError) {
    console.error('Error executing background alarm task:', taskError);
  }
});

export default function App() {
  // References to notification handlers
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);
  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize notification system when app starts
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('App initializing at:', new Date().toISOString());
        
        // Request notification permissions for exact alarms on Android
        if (Platform.OS === 'android') {
          await NotificationManager.registerForPushNotificationsAsync();
        }
        
        // Initialize the notification system
        const result = await NotificationManager.initializeNotifications();
        console.log('Notification system initialized with result:', result);
        
        // Check for any currently scheduled notifications
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`Found ${scheduledNotifications.length} scheduled notifications`);
        
        // Log notification details for debugging
        if (scheduledNotifications.length > 0) {
          scheduledNotifications.forEach((notification, index) => {
            const triggerDate = notification.trigger.date 
              ? new Date(notification.trigger.date).toLocaleString()
              : 'No date trigger';
            
            console.log(`[${index + 1}] "${notification.content.title}" - Trigger: ${triggerDate}`);
          });
        }
        
        // Set the app as ready
        setAppIsReady(true);
      } catch (error) {
        console.error('Error during app initialization:', error);
        Alert.alert(
          'Initialization Error',
          'There was a problem setting up notifications. Some features may not work correctly.'
        );
      }
    };

    // Start initialization
    initApp();

    // Set up notification listeners
    setupNotificationListeners();
    
    // Set up app state change listener to detect when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App state changed from', appState.current, 'to', nextAppState);
      
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        // Verify scheduled notifications when app comes to foreground
        checkNotificationsOnForeground();
      }
      
      appState.current = nextAppState;
    });

    // Clean up function
    return () => {
      // Clean up notification listeners
      cleanupNotificationListeners();
      // Remove app state subscription
      subscription.remove();
    };
  }, []);

  // Function to check notifications when app comes to foreground
  const checkNotificationsOnForeground = async () => {
    try {
      console.log('Checking notifications on app foreground at:', new Date().toISOString());
      
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Found ${scheduledNotifications.length} scheduled notifications`);
      
      // Check for any upcoming timers in the next minute that might have been delayed
      const timerNotifications = scheduledNotifications.filter(
        n => n.content.data?.type?.includes('timer')
      );
      
      // Save info for debugging
      await AsyncStorage.setItem('@foreground_notification_check', JSON.stringify({
        time: new Date().toISOString(),
        scheduledCount: scheduledNotifications.length,
        timerCount: timerNotifications.length
      }));
      
      // Check each timer notification
      for (const notification of timerNotifications) {
        if (notification.trigger.date) {
          const triggerDate = new Date(notification.trigger.date);
          const now = new Date();
          
          // If trigger date is in the past but within the last minute
          if (triggerDate < now && (now - triggerDate < 60000)) {
            console.log('Found a potentially missed notification:', notification.content.title);
            
            // Trigger it immediately
            await Notifications.scheduleNotificationAsync({
              content: {
                ...notification.content,
                title: `${notification.content.title} (Delayed)`,
                body: `${notification.content.body} (Triggered on app foreground)`,
                data: {
                  ...notification.content.data,
                  recoveredOnForeground: true
                }
              },
              trigger: null // Show immediately
            });
            
            // Cancel the original notification
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    } catch (error) {
      console.error('Error checking notifications on foreground:', error);
    }
  };

  // Set up notification listeners
  const setupNotificationListeners = () => {
    // This listener is called when a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground at:', new Date().toISOString());
      console.log('Notification data:', notification.request.content.data);
      
      // Save this event for debugging
      AsyncStorage.setItem('@last_foreground_notification', JSON.stringify({
        time: new Date().toISOString(),
        notification: {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data
        }
      }));
    });

    // This listener is called when a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User responded to notification at:', new Date().toISOString());
      
      // Extract notification data
      const { notification } = response;
      const data = notification.request.content.data;
      
      // Save the user interaction for debugging
      AsyncStorage.setItem('@last_notification_response', JSON.stringify({
        time: new Date().toISOString(),
        notificationId: notification.request.identifier,
        data: data
      }));
    });
  };

  // Clean up notification listeners
  const cleanupNotificationListeners = () => {
    if (notificationListener.current) {
      Notifications.removeNotificationSubscription(notificationListener.current);
    }
    
    if (responseListener.current) {
      Notifications.removeNotificationSubscription(responseListener.current);
    }
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
