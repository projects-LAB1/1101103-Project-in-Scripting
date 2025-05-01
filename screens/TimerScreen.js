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

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Completed',
        body: 'Your timer has finished!',
        sound: true,
      },
      trigger: {
        seconds: duration,
      },
    });
  };

  const startTimer = async () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds === 0) return;

    if (!isRunning && !isPaused) {
      // New timer
      setRemainingTime(totalSeconds);
      startTimeRef.current = Date.now();
      // Schedule notification
      await scheduleNotification(totalSeconds);
    } else if (isPaused) {
      // Resume timer
      startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
    }

    setIsRunning(true);
    setIsPaused(false);

    // Start countdown
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = totalSeconds - elapsed;
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setIsRunning(false);
        setRemainingTime(0);
        // Play sound and vibrate
        playTimerEndSound();
        Vibration.vibrate([0, 500, 200, 500]);
        return;
      }
      
      setRemainingTime(remaining);
    }, 100);

    // Start progress animation
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