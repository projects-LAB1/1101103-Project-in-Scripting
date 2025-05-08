import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  BackHandler,
  Vibration,
  Dimensions,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenOrientation from "expo-screen-orientation";

const AlarmRinging = ({ route, navigation }) => {
  const { alarm, isFullscreen, actionId } = route.params || {};

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(true);
  const [remainingSnoozes, setRemainingSnoozes] = useState(
    alarm?.snoozeCount || 3
  );
  const [sound, setSound] = useState();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Prevent going back with hardware back button
  useFocusEffect(
    React.useCallback(() => {
      // Lock screen orientation to portrait
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );

      // Disable hardware back button
      const onBackPress = () => {
        return true; // Return true to disable back button press
      };

      // Add back button handler
      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      // When the screen blurs or component unmounts
      return () => {
        // Re-enable orientation changes
        ScreenOrientation.unlockAsync();
        // Remove back button handler
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
        // Stop vibration if still happening
        Vibration.cancel();
      };
    }, [])
  );

  // Set up animation
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isPlaying) {
          startPulseAnimation();
        }
      });
    };

    startPulseAnimation();

    // Start a timer to update the current time
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [isPlaying, pulseAnim]);

  // Start playing sound when component mounts
  useEffect(() => {
    const playSound = async () => {
      try {
        // Load sound
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/alarm-sound.mp3"), // Add your alarm sound file
          {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
          }
        );

        setSound(sound);

        // Set audio mode for alarm
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
        });

        // Start vibration pattern
        if (alarm?.vibrate) {
          const pattern = [0, 1000, 500, 1000, 500, 1000];
          Vibration.vibrate(pattern, true);
        }

        // Play sound
        await sound.playAsync();
      } catch (error) {
        console.error("Error playing alarm sound:", error);
      }
    };

    // ถ้ามีการเลือก STOP_ALARM จากการแจ้งเตือน ปิดเสียงทันที
    if (actionId === "STOP_ALARM") {
      // ถ้าผู้ใช้เลือกหยุดการปลุกจากการแจ้งเตือน
      handleStopAlarm();
    } else if (actionId === "SNOOZE_ALARM") {
      // ถ้าผู้ใช้เลือกเลื่อนปลุกจากการแจ้งเตือน
      handleSnooze();
    } else {
      // Start playing normally
      playSound();
    }

    // Clean up
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      Vibration.cancel();
    };
  }, [alarm]);

  // Handle stopping the alarm
  const handleStopAlarm = async () => {
    try {
      // Stop sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Stop vibration
      Vibration.cancel();

      setIsPlaying(false);

      // Navigate back after a brief delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "AlarmList" }],
        });
      }, 500);
    } catch (error) {
      console.error("Error stopping alarm:", error);
    }
  };

  // Handle snoozing the alarm
  const handleSnooze = async () => {
    try {
      // Stop current alarm sound and vibration
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      Vibration.cancel();
      setIsPlaying(false);

      if (remainingSnoozes > 0) {
        // Calculate snooze time
        const snoozeMinutes = alarm?.snoozeTime || 5;
        const snoozeTimeMs = snoozeMinutes * 60 * 1000;
        const snoozeUntil = new Date(Date.now() + snoozeTimeMs);

        // Save snooze info to AsyncStorage
        await AsyncStorage.setItem(
          "@last_snooze",
          JSON.stringify({
            alarmId: alarm.id,
            snoozeUntil: snoozeUntil.toISOString(),
            remainingSnoozes: remainingSnoozes - 1,
          })
        );

        // Schedule a new notification for snooze
        // This would use the scheduleAlarmNotification with modified time

        // Navigate back
        navigation.reset({
          index: 0,
          routes: [{ name: "AlarmList" }],
        });
      } else {
        // No more snoozes left
        handleStopAlarm();
      }
    } catch (error) {
      console.error("Error snoozing alarm:", error);
    }
  };

  // Format date and time for display
  const formatTime = () => {
    return currentTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString("th-TH", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={isFullscreen} />
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={styles.container}
      >
        {/* Current Time */}
        <View style={styles.timeContainer}>
          <Animated.Text
            style={[styles.timeText, { transform: [{ scale: pulseAnim }] }]}
          >
            {formatTime()}
          </Animated.Text>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>

        {/* Alarm label */}
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons name="alarm-bell" size={40} color="#ffffff" />
          <Text style={styles.labelText}>
            {alarm?.label || "เวลาตื่นแล้ว!"}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={handleSnooze}>
            <View style={styles.buttonContent}>
              <Ionicons name="md-bed" size={30} color="#ffffff" />
              <Text style={styles.buttonText}>เลื่อนปลุก</Text>
              <Text style={styles.buttonSubText}>
                {alarm?.snoozeTime || 5} นาที ({remainingSnoozes} ครั้ง)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={handleStopAlarm}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="alarm-off"
                size={30}
                color="#ffffff"
              />
              <Text style={styles.buttonText}>ปิดเสียงปลุก</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 20,
  },
  timeContainer: {
    alignItems: "center",
  },
  timeText: {
    fontSize: 72,
    fontWeight: "200",
    color: "#ffffff",
    marginBottom: 10,
    fontVariant: ["tabular-nums"],
  },
  dateText: {
    fontSize: 18,
    color: "#ffffff",
    opacity: 0.8,
  },
  labelContainer: {
    alignItems: "center",
    padding: 20,
  },
  labelText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 20,
    textAlign: "center",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    padding: 20,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    backgroundColor: "#E94560",
  },
  buttonContent: {
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  buttonSubText: {
    color: "#ffffff",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 5,
  },
});

export default AlarmRinging;
