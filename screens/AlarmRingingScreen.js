// AlarmRingingScreen.js - หน้าแสดงเมื่อนาฬิกาปลุกดัง
import React, { useState, useEffect, useCallback } from "react";
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
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useAlarmSound } from "../contexts/AlarmSoundContext";

const { width, height } = Dimensions.get("window");

const AlarmRingingScreen = ({ route, navigation }) => {
  const { alarm, isAppExitAlert } = route.params || {};
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [maxSnooze, setMaxSnooze] = useState(alarm?.snoozeCount || 3);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ใช้ context แทนการจัดการเสียงในคอมโพเนนท์นี้โดยตรง
  const { playAlarmSound, stopAlarmSound, isPlaying, alarmData } = useAlarmSound();

  // Prevent going back with hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return true; // Return true to disable back button press
      };

      // Add back button handler
      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      // Clean up when component unmounts
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
        // Stop vibration if still happening
        Vibration.cancel();
        // ไม่ต้องหยุดเสียงเมื่อออกจาก screen
      };
    }, [])
  );

  // แสดงข้อมูลการปลุกเพื่อการตรวจสอบ
  useEffect(() => {
    console.log("หน้า AlarmRingingScreen ถูกเรียกใช้งาน");
    console.log("ข้อมูลการปลุก:", JSON.stringify(alarm, null, 2));
    console.log("isAppExitAlert:", isAppExitAlert ? "YES" : "NO");
    
    if (!isAppExitAlert) {
      console.log("Mini-game required:", alarm?.requireGame ? "YES" : "NO");
      console.log("Game type:", alarm?.gameType || "Not specified");
      console.log("Game difficulty:", alarm?.gameDifficulty || "Not specified");
    }

    if (alarm?.isTest) {
      console.log("นี่เป็นการทดสอบการปลุกเท่านั้น");
    } else if (isAppExitAlert) {
      console.log("นี่เป็นการแจ้งเตือนออกจากแอป");
    } else {
      console.log("นี่เป็นการปลุกตามเวลาที่ตั้งไว้");
    }
  }, [alarm, isAppExitAlert]);

  // Setup sound and vibration
  useEffect(() => {
    // Only play sound for regular alarms, not app exit alerts
    if (!isAppExitAlert && !isPlaying) {
      playAlarmSound(alarm);
    }
    
    // Always start vibration
    startVibration();

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      // Clean up
      Vibration.cancel();
      clearInterval(timeInterval);
      // ไม่ต้องหยุดเสียงที่นี่เพื่อให้เสียงเล่นต่อไปได้ในหน้าเลือกเกม
    };
  }, [isAppExitAlert, alarm, isPlaying]);

  // Start vibration pattern
  const startVibration = () => {
    try {
      // ปรับรูปแบบการสั่นให้ถี่และแรงขึ้น (For app exit vs regular alarm)
      const pattern = isAppExitAlert
        ? [0, 300, 100, 300, 100, 300] // More intense pattern for app exit alert
        : [0, 800, 200, 800, 200, 800, 200, 800, 200]; // Longer for regular alarm
      
      Vibration.vibrate(pattern, true);
    } catch (error) {
      console.error("Error starting vibration:", error);
    }
  };

  // Handle snooze
  const handleSnooze = async () => {
    // If this is an app exit alert, we don't allow snoozing
    if (isAppExitAlert) {
      handleDismiss();
      return;
    }

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
    
    // ไม่ต้องหยุดเสียง เพราะจะต้องหยุดเมื่อผู้ใช้ปิดการปลุกหลังเล่นเกมเท่านั้น

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
    // Special handling for app exit alerts
    if (isAppExitAlert) {
      // Stop any vibration
      Vibration.cancel();
      
      // เลือกที่จะหยุดเสียงเมื่อเป็นการแจ้งเตือนออกจากแอป
      stopAlarmSound();
      
      // Simply navigate to the Alarm list
      navigation.navigate("Alarm", {
        screen: "AlarmList",
      });
      return;
    }
    
    // Handle regular alarm dismissal
    if (alarm && alarm.requireGame) {
      console.log("Navigating to GameSelector screen");
      
      // หยุดการสั่นก่อนนำทางไปยังหน้าเกม
      Vibration.cancel();
      
      try {
        // นำทางไปที่หน้าเลือกเกมโดยไม่หยุดเสียงก่อน
        // เพื่อให้ context จัดการเสียงในหน้าเกมแทน
        navigation.navigate("GameSelector", {
          alarm,
          // ไม่ส่งฟังก์ชันโดยตรง แต่ใช้ ID แทน
          completionAction: "completeAlarm", // ใช้ string แทนฟังก์ชัน
          soundAlreadyStopped: false, // เปลี่ยนเป็น false เพื่อให้หน้าเกมจัดการเสียงเอง
        });
      } catch (error) {
        console.error("Navigation error:", error);
        // หากเกิดข้อผิดพลาดในการนำทาง ให้หยุดเสียงและกลับไปที่หน้ารายการนาฬิกาปลุก
        stopAlarmSound();
        navigation.navigate("Alarm", {
          screen: "AlarmList",
        });
      }
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
    
    // Stop sound using context
    stopAlarmSound();

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

  // Get title text based on alert type
  const getAlertTitle = () => {
    if (isAppExitAlert) {
      return "แอปพลิเคชันปิดอยู่!";
    }
    return alarm?.label || "Alarm";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient 
        colors={isAppExitAlert ? ["#1e293b", "#0f172a"] : ["#121212", "#000000"]} 
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          {/* Samsung-style "Alarm" indicator */}
          <View style={styles.alarmIndicator}>
            <View style={[
              styles.alarmIndicatorDot, 
              isAppExitAlert && styles.appExitIndicatorDot
            ]} />
            <Text style={[
              styles.alarmIndicatorText,
              isAppExitAlert && styles.appExitIndicatorText
            ]}>
              {isAppExitAlert ? "แจ้งเตือน" : "ALARM"}
            </Text>
          </View>

          {/* Time display */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </View>

          {/* Alarm label */}
          <View style={styles.alarmInfoContainer}>
            <Text style={[
              styles.alarmLabel,
              isAppExitAlert && styles.appExitLabel
            ]}>
              {getAlertTitle()}
            </Text>
            {isAppExitAlert && (
              <Text style={styles.appExitDescription}>
                คุณได้ออกจากแอปหรือปิดหน้าจอ กรุณากลับเข้าสู่แอป
              </Text>
            )}
            {alarm?.isTest && !isAppExitAlert && (
              <Text style={styles.alarmTestLabel}>
                (นี่เป็นการทดสอบเท่านั้น)
              </Text>
            )}
            {alarm?.requireGame && !isAppExitAlert && (
              <Text style={styles.alarmGameLabel}>
                (Mini-game required to dismiss)
              </Text>
            )}
          </View>

          {/* Samsung-style button layout - Modified for app exit alert */}
          <View style={styles.buttonsContainer}>
            {!isAppExitAlert && (
              <TouchableOpacity style={styles.button} onPress={handleSnooze}>
                <View style={styles.buttonCircle}>
                  <Text style={styles.buttonText}>SNOOZE</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.button, 
                isAppExitAlert && styles.fullWidthButton
              ]} 
              onPress={handleDismiss}
            >
              <View style={[
                styles.buttonCircle, 
                styles.dismissCircle,
                isAppExitAlert && styles.appExitButton
              ]}>
                <Text style={styles.buttonText}>
                  {isAppExitAlert ? "กลับเข้าสู่แอป" : "DISMISS"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Snooze count indicator - only for regular alarms */}
          {!isAppExitAlert && (
            <Text style={styles.snoozeCount}>
              Snooze count: {snoozeCount}/{maxSnooze}
            </Text>
          )}
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
  appExitIndicatorDot: {
    backgroundColor: "#ef4444",
  },
  alarmIndicatorText: {
    color: "#0A84FF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  appExitIndicatorText: {
    color: "#ef4444",
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
    textAlign: "center",
  },
  appExitLabel: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 32,
  },
  appExitDescription: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 15,
    textAlign: "center",
    lineHeight: 24,
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
  fullWidthButton: {
    width: "100%",
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
  appExitButton: {
    backgroundColor: "#ef4444",
    borderColor: "#b91c1c",
    width: 150,
    height: 150,
    borderRadius: 75,
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
