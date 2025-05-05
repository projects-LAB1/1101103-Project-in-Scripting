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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AlarmRingingScreen = ({ route, navigation }) => {
  const { alarm } = route.params;
  const [sound, setSound] = useState(null);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [maxSnooze, setMaxSnooze] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Play alarm sound
  useEffect(() => {
    // เริ่มเฉพาะการสั่น ไม่เปิดเสียง
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

  // Load and play alarm sound
  const loadSound = async () => {
    try {
      // สำหรับการทดสอบ เราจะไม่โหลดไฟล์เสียง
      // แต่จะใช้การสั่นเท่านั้น
      console.log("Skipping sound loading for testing purposes");
      
      // เพิ่มแรงสั่นของอุปกรณ์เพื่อให้รู้สึกถึงการปลุกได้ชัดเจนขึ้น
      startVibration();
    } catch (error) {
      console.error("Error in loadSound function:", error);
    }
  };

  // Start vibration pattern
  const startVibration = () => {
    try {
      // ปรับรูปแบบการสั่นให้ถี่และแรงขึ้น
      // เนื่องจากไม่มีเสียง เราจึงทำให้การสั่นชัดเจนมากขึ้น
      const pattern = [0, 700, 300, 700, 300, 700, 300, 700, 300];
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
        "ไม่สามารถเลื่อนปลุกได้อีก",
        "คุณได้เลื่อนปลุกครบจำนวนครั้งที่กำหนดแล้ว"
      );
      return;
    }

    // Stop vibration temporarily
    Vibration.cancel();

    // Update snooze count in state
    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);

    // สำหรับการทดสอบ เราข้ามการอัปเดต Firestore ไป

    // Navigate back to previous screen
    navigation.goBack();

    // Schedule new alarm in 5 minutes
    // In a real app, you would use a background task or notification
    // to reschedule the alarm
    setTimeout(() => {
      // This is just a simulation - in a real app you would use proper scheduling
      navigation.navigate("AlarmRinging", { alarm });
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Handle dismiss based on task type
  const handleDismiss = () => {
    // สำหรับการทดสอบ เราจะข้ามการทำงานของภารกิจ (task) และแสดงแค่การยืนยันการปิด
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
  };

  // Complete alarm and update statistics
  const completeAlarm = async (status) => {
    // Stop vibration
    Vibration.cancel();

    // Show success message
    if (status === "completed") {
      Alert.alert("สำเร็จ", "ปิดนาฬิกาปลุกเรียบร้อยแล้ว");
    }

    // สำหรับการทดสอบ เราข้ามการอัปเดต Firestore ไป

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
            color="#FF9500"
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
    backgroundColor: "#000000",
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
    color: "#FFFFFF",
  },
  dateText: {
    fontSize: 18,
    color: "#9CA3AF",
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
    color: "#FF9500",
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
    backgroundColor: "#1C1C1E",
  },
  dismissButton: {
    backgroundColor: "#FF9500",
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
