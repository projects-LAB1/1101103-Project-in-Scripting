// AlarmRingingScreen.js - หน้าแสดงเมื่อนาฬิกาปลุกดัง
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Image,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AlarmRingingScreen = ({ route, navigation }) => {
  const { alarm } = route.params;
  const [sound, setSound] = useState(null);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [maxSnooze, setMaxSnooze] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  const db = getFirestore();

  // Play alarm sound
  useEffect(() => {
    loadSound();
    startVibration();

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      // Clean up
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
      Vibration.cancel();
      clearInterval(timeInterval);
    };
  }, []);

  // Load and play alarm sound with enhanced error handling
  const loadSound = async () => {
    try {
      // Select sound file based on alarm.soundId
      let soundSource;
      switch (alarm.soundId) {
        case "bell":
          soundSource = require("../assets/sounds/bell-alarm.mp3");
          break;
        case "digital":
          soundSource = require("../assets/sounds/digital-alarm.mp3");
          break;
        case "rooster":
          soundSource = require("../assets/sounds/rooster-alarm.mp3");
          break;
        default:
          soundSource = require("../assets/sounds/default-alarm.mp3");
      }

      // Set audio mode for alarm
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      // Create and play sound
      const { sound: audioSound } = await Audio.Sound.createAsync(soundSource, {
        isLooping: true,
        volume: alarm.volume / 100 || 1.0,
        shouldPlay: true,
      });

      setSound(audioSound);
      
      // Make sure sound plays at maximum volume
      await audioSound.setVolumeAsync(alarm.volume / 100 || 1.0);
      await audioSound.playAsync();

    } catch (error) {
      console.error("Error loading sound:", error);
      Alert.alert(
        "ข้อผิดพลาด",
        "ไม่สามารถเล่นเสียงปลุกได้ จะใช้การสั่นแทน",
        [{ text: "ตกลง" }]
      );
      startVibration();
    }
  };

  // Enhanced vibration pattern
  const startVibration = () => {
    const pattern = Platform.OS === 'android' 
      ? [0, 500, 200, 500, 200, 500] // Android pattern
      : [0, 500, 500, 500, 500, 500]; // iOS pattern
    Vibration.vibrate(pattern, true);
  };

  // Handle snooze
  const handleSnooze = async () => {
    if (snoozeCount >= maxSnooze) {
      // Max snooze reached, force user to complete task
      Alert.alert(
        "ไม่สามารถเลื่อนปลุกได้อีก",
        "คุณได้เลื่อนปลุกครบจำนวนครั้งที่กำหนดแล้ว"
      );
      return;
    }

    // Stop sound and vibration temporarily
    if (sound) {
      await sound.stopAsync();
    }
    Vibration.cancel();

    // Update snooze count in state and Firestore
    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);

    try {
      // Update alarm statistics in Firestore
      if (alarm.id) {
        const userRef = doc(db, "users", alarm.userId);
        await updateDoc(userRef, {
          "statistics.alarmsSnooze": increment(1),
        });
      }
    } catch (error) {
      console.error("Error updating snooze statistics:", error);
    }

    // Navigate back to previous screen
    navigation.goBack();

    // ตั้งค่าการแจ้งเตือนใหม่ในอีก 5 นาที
    try {
      // สร้างข้อมูลนาฬิกาปลุกใหม่สำหรับการเลื่อนปลุก
      const snoozeAlarm = {
        ...alarm,
        hour: new Date().getHours(),
        minute: new Date().getMinutes() + 5, // เพิ่ม 5 นาที
        isSnooze: true,
        snoozeCount: newSnoozeCount,
        originalAlarmId: alarm.id
      };
      
      // ปรับเวลาให้ถูกต้องหากนาทีเกิน 60
      if (snoozeAlarm.minute >= 60) {
        snoozeAlarm.hour = (snoozeAlarm.hour + 1) % 24;
        snoozeAlarm.minute = snoozeAlarm.minute - 60;
      }
      
      // ตั้งค่าการแจ้งเตือนใหม่
      const notificationId = await import('../models/NotificationManager')
        .then(module => module.scheduleAlarmNotification(snoozeAlarm));
      
      console.log('ตั้งค่าการเลื่อนปลุกสำเร็จ, notificationId:', notificationId);
    } catch (error) {
      console.error('Error scheduling snooze notification:', error);
    }
  };

  // Handle dismiss based on task type
  const handleDismiss = () => {
    // Determine which task screen to navigate to based on alarm settings
    console.log('AlarmRingingScreen - alarm:', alarm);
    console.log('AlarmRingingScreen - taskType:', alarm.taskType);
    console.log('AlarmRingingScreen - taskDifficulty:', alarm.taskDifficulty);
    
    if (alarm.taskType === "math") {
      console.log('Navigating to MathTask with difficulty:', alarm.taskDifficulty || "medium");
      navigation.navigate("MathTask", {
        alarm,
        difficulty: alarm.taskDifficulty || "medium",
        onComplete: completeAlarm,
      });
    } else if (alarm.taskType === "photo") {
      navigation.navigate("PhotoTask", {
        alarm,
        difficulty: alarm.taskDifficulty || "medium",
        onComplete: completeAlarm,
      });
    } else if (alarm.taskType === "random") {
      // Randomly select a task type
      const taskTypes = ["math", "photo"];
      const randomTask =
        taskTypes[Math.floor(Math.random() * taskTypes.length)];

      if (randomTask === "math") {
        navigation.navigate("MathTask", {
          alarm,
          difficulty: alarm.taskDifficulty || "medium",
          onComplete: completeAlarm,
        });
      } else {
        navigation.navigate("PhotoTask", {
          alarm,
          difficulty: alarm.taskDifficulty || "medium",
          onComplete: completeAlarm,
        });
      }
    } else {
      // Normal alarm - just dismiss
      // Show a confirmation message before dismissing
      Alert.alert("ปิดนาฬิกาปลุก", "คุณต้องการปิดนาฬิกาปลุกใช่หรือไม่?", [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ปิดนาฬิกาปลุก",
          onPress: () => completeAlarm("completed"),
        },
      ]);
    }
  };

  // Complete alarm and update statistics
  const completeAlarm = async (status = "completed") => {
    console.log("Completing alarm with status:", status);
    // Stop sound and vibration
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    Vibration.cancel();

    // Show success message
    if (status === "completed") {
      Alert.alert("สำเร็จ", "ปิดนาฬิกาปลุกเรียบร้อยแล้ว");
    }

    try {
      // Update alarm statistics in Firestore
      if (alarm.id && alarm.userId) {
        const userRef = doc(db, "users", alarm.userId);

        if (status === "completed") {
          await updateDoc(userRef, {
            "statistics.alarmsCompleted": increment(1),
            "statistics.totalAlarms": increment(1),
          });

          // Update average wake up time
          // This would be more complex in a real app
          const now = new Date();
          const wakeUpTime = now.getHours() * 60 + now.getMinutes();

          // In a real app, you would calculate a running average
          await updateDoc(userRef, {
            "statistics.avgWakeUpTime": wakeUpTime,
          });
        }
      }
    } catch (error) {
      console.error("Error updating alarm statistics:", error);
    }

    // Navigate back to alarm list
    navigation.navigate("AlarmList");
  };

  // Format time as HH:MM
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.dateText}>
            {currentTime.toLocaleDateString("th-TH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.alarmInfoContainer}>
          <Icon
            name="alarm"
            size={50}
            color="#4F46E5"
            style={styles.alarmIcon}
          />
          <Text style={styles.alarmLabel}>{alarm.label || "นาฬิกาปลุก"}</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.snoozeButton]}
            onPress={handleSnooze}
          >
            <Icon name="alarm-snooze" size={24} color="white" />
            <Text style={styles.buttonText}>เลื่อนปลุก</Text>
            <Text style={styles.snoozeCount}>
              {snoozeCount}/{maxSnooze}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dismissButton]}
            onPress={handleDismiss}
          >
            <Icon name="alarm-off" size={24} color="white" />
            <Text style={styles.buttonText}>
              {alarm.taskType === "normal" ? "ปิดเสียงปลุก" : "ทำภารกิจ"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  timeText: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#111827",
  },
  dateText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 10,
  },
  alarmInfoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  alarmIcon: {
    marginBottom: 15,
  },
  alarmLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: "#4F46E5",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    flex: 1,
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  snoozeButton: {
    backgroundColor: "#6B7280",
  },
  dismissButton: {
    backgroundColor: "#4F46E5",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
  },
  snoozeCount: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
  },
});

export default AlarmRingingScreen;
