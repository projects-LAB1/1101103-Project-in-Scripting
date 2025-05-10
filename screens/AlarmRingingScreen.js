// AlarmRingingScreen.js - หน้าแสดงเมื่อนาฬิกาปลุกดัง
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const AlarmRingingScreen = ({ route, navigation }) => {
  const { alarm } = route.params;
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [maxSnooze, setMaxSnooze] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  // แสดงข้อมูลการปลุกเพื่อการตรวจสอบ
  useEffect(() => {
    console.log("หน้า AlarmRingingScreen ถูกเรียกใช้งาน");
    console.log("ข้อมูลการปลุก:", JSON.stringify(alarm, null, 2));
    console.log("Mini-game required:", alarm.requireGame ? "YES" : "NO");
    console.log("Game type:", alarm.gameType || "Not specified");
    console.log("Game difficulty:", alarm.gameDifficulty || "Not specified");

    if (alarm.isTest) {
      console.log("นี่เป็นการทดสอบการปลุกเท่านั้น");
    } else {
      console.log("นี่เป็นการปลุกตามเวลาที่ตั้งไว้");
    }
  }, [alarm]);

  // Start vibration pattern immediately
  useEffect(() => {
    startVibration();

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      // Clean up
      Vibration.cancel();
      clearInterval(timeInterval);
    };
  }, []);

  // Start vibration pattern
  const startVibration = () => {
    try {
      // ปรับรูปแบบการสั่นให้ถี่และแรงขึ้น
      // Samsung-style vibration pattern (more intense)
      const pattern = [0, 800, 200, 800, 200, 800, 200, 800, 200];
      Vibration.vibrate(pattern, true);
    } catch (error) {
      console.error("Error starting vibration:", error);
    }
  };

  // Handle snooze
  const handleSnooze = async () => {
    if (snoozeCount >= maxSnooze) {
      // Max snooze reached, force user to complete task
      Alert.alert(
        "Cannot snooze anymore",
        "You've already snoozed the maximum number of times"
      );
      return;
    }

    // Stop vibration temporarily
    Vibration.cancel();

    // Update snooze count in state
    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);

    // Navigate back to previous screen
    navigation.goBack();

    // Schedule new alarm in 5 minutes
    // In a real app, you would use a background task or notification
    // to reschedule the alarm
    setTimeout(() => {
      // This is just a simulation - in a real app you would use proper scheduling
      // ใช้การนำทางแบบซ้อนกันเพื่อให้สอดคล้องกับการนำทางในทั้งระบบ
      navigation.navigate("Alarm", {
        screen: "AlarmRinging",
        params: { alarm },
      });
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Handle dismiss based on task type
  const handleDismiss = () => {
    // Check if alarm requires game to dismiss
    console.log("Dismiss button pressed, requireGame:", alarm.requireGame);
    console.log("ข้อมูลการปลุกทั้งหมด:", JSON.stringify(alarm, null, 2));
    
    if (alarm && alarm.requireGame) {
      console.log("Navigating to GameSelector screen");
      // Navigate to game selector
      navigation.navigate("GameSelector", {
        alarm,
        onComplete: () => completeAlarm("completed"),
      });
    } else {
      // Standard dismiss with confirmation
      Alert.alert("Turn off alarm", "Do you want to turn off this alarm?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Turn off",
          onPress: () => completeAlarm("completed"),
        },
      ]);
    }
  };

  // Complete alarm and update statistics
  const completeAlarm = async (status) => {
    // Stop vibration
    Vibration.cancel();

    // Navigate back to alarm list using nested navigation
    navigation.navigate("Alarm", {
      screen: "AlarmList",
    });
  };

  // Format time as HH:MM
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Format date for Samsung-style display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#121212", "#000000"]} style={styles.gradient}>
        <SafeAreaView style={styles.content}>
          {/* Samsung-style "Alarm" indicator */}
          <View style={styles.alarmIndicator}>
            <View style={styles.alarmIndicatorDot} />
            <Text style={styles.alarmIndicatorText}>ALARM</Text>
          </View>

          {/* Time display */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </View>

          {/* Alarm label */}
          <View style={styles.alarmInfoContainer}>
            <Text style={styles.alarmLabel}>{alarm.label || "Alarm"}</Text>
            {alarm.isTest && (
              <Text style={styles.alarmTestLabel}>
                (นี่เป็นการทดสอบเท่านั้น)
              </Text>
            )}
            {alarm.requireGame && (
              <Text style={styles.alarmGameLabel}>
                (Mini-game required to dismiss)
              </Text>
            )}
          </View>

          {/* Samsung-style button layout */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={handleSnooze}>
              <View style={styles.buttonCircle}>
                <Text style={styles.buttonText}>SNOOZE</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleDismiss}>
              <View style={[styles.buttonCircle, styles.dismissCircle]}>
                <Text style={styles.buttonText}>DISMISS</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Snooze count indicator */}
          <Text style={styles.snoozeCount}>
            Snooze count: {snoozeCount}/{maxSnooze}
          </Text>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    paddingBottom: 50,
  },
  alarmIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  alarmIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A84FF",
    marginRight: 10,
  },
  alarmIndicatorText: {
    color: "#0A84FF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  timeText: {
    fontSize: 76,
    fontWeight: "200",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 20,
    color: "#9CA3AF",
    marginTop: 10,
  },
  alarmInfoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  alarmLabel: {
    fontSize: 28,
    fontWeight: "300",
    color: "#FFFFFF",
  },
  alarmTestLabel: {
    fontSize: 18,
    fontWeight: "300",
    color: "#FF9500",
    marginTop: 10,
  },
  alarmGameLabel: {
    fontSize: 18,
    fontWeight: "300",
    color: "#0A84FF",
    marginTop: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  buttonCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333333",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dismissCircle: {
    backgroundColor: "#0A84FF",
    borderColor: "#0A84FF",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  snoozeCount: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 20,
  },
});

export default AlarmRingingScreen;
