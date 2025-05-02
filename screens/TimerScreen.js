import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications with more precise settings
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Check notification type
    const isTimerNotification = notification.request.content.data?.type?.includes('timer');
    
    // Log for debugging
    console.log(`Handling notification: ${notification.request.identifier}`);
    console.log(`Notification type: ${notification.request.content.data?.type || 'unknown'}`);
    
    // Use highest priority for timer notifications
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: isTimerNotification 
        ? Notifications.AndroidNotificationPriority.MAX 
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

const TimerScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);

  useEffect(() => {
    // Load and configure sound
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/digital-alarm.mp3')
      );
      soundRef.current = sound;
    };

    loadSound();

    // Request notification permissions
    Notifications.requestPermissionsAsync();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatTime = useCallback((totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const playTimerEndSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const scheduleNotification = async (duration) => {
    try {
      // Cancel any existing timer notifications first
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const timerNotifications = existingNotifications.filter(
        notification => notification.content?.data?.type?.includes('timer')
      );
      
      console.log(`Canceling ${timerNotifications.length} existing timer notifications`);
      for (const notification of timerNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      // Calculate exact time when the timer should end
      const now = new Date();
      const exactTriggerTime = new Date(now.getTime() + (duration * 1000));
      
      console.log(`Scheduling notification to trigger at exactly: ${exactTriggerTime.toLocaleString()}`);
      console.log(`Current time is: ${now.toLocaleString()}`);
      console.log(`Duration in seconds: ${duration}`);
      
      // Multiple scheduling approach for important timers:
      // 1. Schedule with exact date for accuracy
      // 2. Schedule with seconds as backup
  
      // APPROACH 1: Schedule with exact date
      const primaryNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Timer Completed',
          body: 'Your timer has finished!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { 
            type: 'timer_primary', 
            createdAt: now.toISOString(),
            expectedTriggerTime: exactTriggerTime.toISOString(),
            durationSeconds: duration,
            method: 'date-based'
          },
          vibrate: [0, 250, 250, 250],
          sound: Platform.OS === 'android' ? true : 'default',
        },
        trigger: {
          date: exactTriggerTime,
          channelId: 'alarm-channel', // Use the high-priority alarm channel
        },
      });
      
      console.log(`Primary timer notification scheduled with ID: ${primaryNotificationId}`);
      
      // APPROACH 2: Schedule with seconds
      const secondaryNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Timer Completed',
          body: 'Your timer has finished!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { 
            type: 'timer_secondary', 
            createdAt: now.toISOString(),
            expectedTriggerTime: exactTriggerTime.toISOString(),
            durationSeconds: duration,
            method: 'seconds-based'
          },
          vibrate: [0, 250, 250, 250],
          sound: Platform.OS === 'android' ? true : 'default',
        },
        trigger: {
          seconds: duration,
          channelId: 'alarm-channel',
        },
      });
      
      console.log(`Secondary timer notification scheduled with ID: ${secondaryNotificationId}`);
      
      // APPROACH 3: For longer timers (over 5 minutes), add critical alarm just before expected time
      let criticalNotificationId = null;
      if (duration > 300) { // 5 minutes
        const criticalTriggerTime = new Date(exactTriggerTime.getTime() - 5000); // 5 seconds before
        
        criticalNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Timer Almost Complete',
            body: 'Your timer is about to finish!',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { 
              type: 'timer_critical', 
              createdAt: now.toISOString(),
              expectedTriggerTime: exactTriggerTime.toISOString(),
              durationSeconds: duration,
              method: 'critical-buffer'
            },
            vibrate: [0, 250, 50, 250],
            sound: Platform.OS === 'android' ? true : 'default',
          },
          trigger: {
            date: criticalTriggerTime,
            channelId: 'critical_alarms',
          },
        });
        
        console.log(`Critical buffer notification scheduled with ID: ${criticalNotificationId}`);
      }
      
      // APPROACH 4: Set up a local timer to cover any edge cases with Android doze mode
      // This uses setTimeout directly within the app when it's still running
      const timeoutId = setTimeout(() => {
        // Only trigger if the app is still running when the timer finishes
        console.log('Local JS timer completed, triggering notification immediately');
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Timer Completed',
            body: 'Your timer has finished! (App-triggered)',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { 
              type: 'timer_local', 
              createdAt: now.toISOString(),
              triggerTime: new Date().toISOString(),
              method: 'local-js-timer' 
            },
          },
          trigger: null, // trigger immediately
        });
        
        // Play sound immediately if app is in foreground
        playTimerEndSound();
        Vibration.vibrate([0, 500, 200, 500]);
      }, duration * 1000 + 100); // Add 100ms buffer
      
      // Save notification information to AsyncStorage for debugging
      await AsyncStorage.setItem('@last_scheduled_timer', JSON.stringify({
        scheduledAt: now.toISOString(),
        expectedTriggerTime: exactTriggerTime.toISOString(),
        durationSeconds: duration,
        notificationIds: {
          primary: primaryNotificationId,
          secondary: secondaryNotificationId,
          critical: criticalNotificationId,
          timeoutId: String(timeoutId)
        }
      }));
      
      // Return the primary notification ID
      return primaryNotificationId;
    } catch (error) {
      console.error('Error scheduling timer notification:', error);
      
      // Ultimate fallback - use only seconds trigger if all else fails
      try {
        console.log('Attempting ultimate fallback notification');
        const now = new Date();
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Timer Completed (Emergency)',
            body: 'Your timer has finished!',
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { 
              type: 'timer_emergency', 
              createdAt: now.toISOString(),
              durationSeconds: duration,
              method: 'emergency-fallback'
            },
            sound: true
          },
          trigger: {
            seconds: duration,
          },
        });
        
        console.log(`Emergency fallback timer notification scheduled with ID: ${notificationId}`);
        
        // Also set a JavaScript timeout as a last resort
        setTimeout(() => {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Timer Completed',
              body: 'Your timer has finished! (Emergency)',
              sound: true,
            },
            trigger: null, // trigger immediately
          });
          
          // Play sound immediately
          playTimerEndSound();
          Vibration.vibrate([0, 500, 200, 500]);
        }, duration * 1000 + 500); // Add 500ms buffer
        
        return notificationId;
      } catch (fallbackError) {
        console.error('All notification approaches failed:', fallbackError);
        
        // Last resort - just set a JavaScript timeout and resolve without notification ID
        setTimeout(() => {
          // Try to play sound and vibrate when time is up
          playTimerEndSound();
          Vibration.vibrate([0, 500, 200, 500]);
          
          // Show alert if possible
          Alert.alert('Timer Completed', 'Your timer has finished!');
        }, duration * 1000);
        
        return 'js-timeout-only';
      }
    }
  };

  const startTimer = async () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds === 0) return;

    // Calculate the exact end time for this timer
    const now = new Date();
    const endTime = new Date(now.getTime() + (totalSeconds * 1000));
    
    console.log(`Starting timer at: ${now.toISOString()}`);
    console.log(`Timer should end at: ${endTime.toISOString()}`);
    console.log(`Total duration: ${totalSeconds} seconds`);
  
    if (!isRunning && !isPaused) {
      // New timer
      setRemainingTime(totalSeconds);
      startTimeRef.current = Date.now();
      
      // Schedule notification - must be called before setting any state
      // to ensure notification is scheduled exactly as calculated
      const notificationId = await scheduleNotification(totalSeconds);
      console.log(`Notification scheduled with ID: ${notificationId}`);
      
      // Store timer data for debugging
      await AsyncStorage.setItem('@current_timer', JSON.stringify({
        startTime: now.toISOString(),
        expectedEndTime: endTime.toISOString(),
        durationSeconds: totalSeconds,
        notificationId
      }));
    } else if (isPaused) {
      // Resume timer - recalculate exact end time based on remaining time
      const resumeEndTime = new Date(Date.now() + (pausedTimeRef.current * 1000));
      console.log(`Resuming timer. Will end at: ${resumeEndTime.toISOString()}`);
      startTimeRef.current = Date.now() - ((totalSeconds - pausedTimeRef.current) * 1000);
      
      // Re-schedule notification with remaining time
      const notificationId = await scheduleNotification(pausedTimeRef.current);
      console.log(`Notification re-scheduled with ID: ${notificationId} for remaining ${pausedTimeRef.current} seconds`);
    }
  
    setIsRunning(true);
    setIsPaused(false);
  
    // Use a more precise interval timing approach
    timerRef.current = setInterval(() => {
      // Calculate remaining time based on the original end time
      const currentTime = Date.now();
      const elapsedMilliseconds = currentTime - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setIsRunning(false);
        setRemainingTime(0);
        // Play sound and vibrate
        playTimerEndSound();
        Vibration.vibrate([0, 500, 200, 500]);
        
        // Log completion time for debugging
        const actualEndTime = new Date();
        console.log(`Timer completed at: ${actualEndTime.toISOString()}`);
        AsyncStorage.setItem('@last_completed_timer', JSON.stringify({
          completed: actualEndTime.toISOString(),
          expectedEnd: endTime.toISOString(),
          difference: actualEndTime.getTime() - endTime.getTime()
        }));
        
        return;
      }
      
      setRemainingTime(remaining);
    }, 100); // Update frequently for smooth countdown
  
    // Start progress animation with precise timing
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: totalSeconds * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const pauseTimer = async () => {
    clearInterval(timerRef.current);
    setIsPaused(true);
    setIsRunning(false);
    pausedTimeRef.current = remainingTime;
    progressAnim.stopAnimation();
    // Cancel scheduled notification when paused
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const cancelTimer = async () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setRemainingTime(0);
    progressAnim.setValue(1);
    // Cancel scheduled notification when cancelled
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const renderPickerItems = (max, type) => {
    const items = [];
    for (let i = 0; i <= max; i++) {
      items.push(
        <Picker.Item
          key={i}
          label={i.toString().padStart(2, '0')}
          value={i}
          color="#FFFFFF"
        />
      );
    }
    return items;
  };

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตั้งเวลา</Text>
      </View>

      <View style={styles.timerContainer}>
        {isRunning || isPaused ? (
          <>
            <Animated.View
              style={[
                styles.progressContainer,
                {
                  transform: [{ rotate: progress }],
                },
              ]}
            >
              <View style={styles.progressIndicator} />
            </Animated.View>
            <Text style={styles.timerText}>{formatTime(remainingTime)}</Text>
          </>
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              style={styles.picker}
              itemStyle={styles.pickerItem}
              selectedValue={hours}
              onValueChange={setHours}
            >
              {renderPickerItems(23, 'hours')}
            </Picker>
            <Text style={styles.pickerSeparator}>:</Text>
            <Picker
              style={styles.picker}
              itemStyle={styles.pickerItem}
              selectedValue={minutes}
              onValueChange={setMinutes}
            >
              {renderPickerItems(59, 'minutes')}
            </Picker>
            <Text style={styles.pickerSeparator}>:</Text>
            <Picker
              style={styles.picker}
              itemStyle={styles.pickerItem}
              selectedValue={seconds}
              onValueChange={setSeconds}
            >
              {renderPickerItems(59, 'seconds')}
            </Picker>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={cancelTimer}
          disabled={!isRunning && !isPaused}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText, (!isRunning && !isPaused) && styles.buttonDisabled]}>
            ยกเลิก
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.mainButton,
            isRunning ? styles.pauseButton : styles.startButton,
          ]}
          onPress={isRunning ? pauseTimer : startTimer}
        >
          <Text style={[styles.buttonText, styles.mainButtonText]}>
            {isRunning ? 'หยุด' : isPaused ? 'ทำต่อ' : 'เริ่ม'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    height: 300,
  },
  progressContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#FF9500',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  progressIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9500',
    marginTop: -3,
  },
  timerText: {
    fontSize: 70,
    fontVariant: ['tabular-nums'],
    color: '#FFFFFF',
    fontWeight: '200',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
  },
  picker: {
    width: 80,
    height: 200,
  },
  pickerItem: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  pickerSeparator: {
    fontSize: 24,
    color: '#FFFFFF',
    marginHorizontal: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  startButton: {
    backgroundColor: '#1C3C1E',
  },
  pauseButton: {
    backgroundColor: '#3C1C1E',
  },
  cancelButton: {
    backgroundColor: '#1C1C1E',
  },
  buttonText: {
    fontSize: 17,
  },
  mainButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#FF9500',
  },
  buttonDisabled: {
    color: '#666666',
  },
});

export default TimerScreen; 