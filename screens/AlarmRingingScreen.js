// AlarmRingingScreen.js - หน้าแสดงเมื่อนาฬิกาปลุกดัง
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  BackHandler,
  AppState,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from '../supabase.config';
import { UserAuth } from '../models/UserAuth';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AlarmRingingScreen = ({ route, navigation }) => {
  const { alarm } = route.params;
  const [sound, setSound] = useState(null);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [maxSnooze, setMaxSnooze] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = UserAuth();
  const [isActive, setIsActive] = useState(true);
  const alarmRef = useRef(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ใช้ useFocusEffect เพื่อให้แน่ใจว่าหน้าจอจะยังคงแสดงอยู่
  useFocusEffect(
    React.useCallback(() => {
      console.log("หน้าจอได้รับโฟกัส");
      setIsActive(true);

      // เก็บข้อมูล alarm ไว้ใน ref เพื่อให้สามารถเข้าถึงได้ในทุกที่
      alarmRef.current = alarm;

      // เริ่มการสั่นใหม่เมื่อหน้าจอได้รับโฟกัส
      startVibration();

      return () => {
        console.log("หน้าจอเสียโฟกัส");
        // ไม่ต้องทำอะไร เพราะเราไม่ต้องการให้หน้าจอหายไป
      };
    }, [])
  );

  // Start animations
  useEffect(() => {
    // Pulse animation for the alarm icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in animation for the entire screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // ป้องกันการกดปุ่มย้อนกลับ
  useEffect(() => {
    // ป้องกันการกดปุ่มย้อนกลับบนแอนดรอยด์
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log("ผู้ใช้พยายามกดปุ่มย้อนกลับ - ป้องกันไว้");
      // ป้องกันไม่ให้ย้อนกลับได้
      return true;
    });

    // ติดตามสถานะของแอป
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      console.log('สถานะแอปเปลี่ยนเป็น:', nextAppState);
      if (nextAppState === 'active') {
        // เมื่อแอปกลับมาทำงานอีกครั้ง ให้เริ่มการสั่นใหม่
        startVibration();
      }
    });

    // ล็อคหน้าจอให้อยู่ในแนวตั้ง
    async function lockOrientation() {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (error) {
        console.error("ไม่สามารถล็อคการหมุนหน้าจอได้:", error);
      }
    }
    lockOrientation();

    // Load sound and start vibration
    loadSound();
    const vibrationInterval = startVibration();

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Keep the screen awake - this is important to prevent the screen from turning off
    // We'll implement this with a periodic UI refresh
    const keepAwakeInterval = setInterval(() => {
      // Force a small UI update to keep the screen active
      setCurrentTime(new Date());
      console.log("รักษาหน้าจอให้ทำงานต่อเนื่อง");

      // Restart vibration if needed
      Vibration.cancel();
      const pattern = [0, 1500, 500, 1500, 500, 1500, 500, 1500, 500];
      Vibration.vibrate(pattern, true);
    }, 5000); // ทุก 5 วินาที (เร็วขึ้นกว่าเดิม)

    // ตั้งเวลาเพื่อตรวจสอบว่าหน้าจอยังแสดงอยู่หรือไม่
    const checkScreenInterval = setInterval(() => {
      console.log("ตรวจสอบว่าหน้าจอยังแสดงอยู่หรือไม่");
      // ไม่ต้องทำอะไร แค่ให้มีการทำงานเป็นระยะๆ
    }, 2000); // ทุก 2 วินาที

    // Clean up function
    return () => {
      // Clean up all intervals and stop sound/vibration
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
      Vibration.cancel();
      clearInterval(timeInterval);
      clearInterval(vibrationInterval);
      clearInterval(keepAwakeInterval);
      clearInterval(checkScreenInterval);
      backHandler.remove();
      appStateSubscription.remove();
      // คืนค่าการหมุนหน้าจอเป็นค่าเริ่มต้น
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Load and play alarm sound
  const loadSound = async () => {
    try {
      console.log("กำลังโหลดเสียงปลุก...");

      // ปิดการใช้งานเสียงชั่วคราวและใช้การสั่นแทน
      console.log("ใช้การสั่นแทนเสียงปลุก");

      // ไม่แสดง Alert เพื่อให้หน้าจอแสดงแบบเต็มหน้าจอ
      // setTimeout(() => {
      //   Alert.alert(
      //     "ข้อมูลแจ้ง",
      //     "ไม่สามารถเล่นเสียงปลุกได้ ใช้การสั่นแทน"
      //   );
      // }, 500);

      // เพิ่มความเข้มของการสั่นเพื่อทดแทนเสียง
      const pattern = [0, 1000, 500, 1000, 500, 1000, 500];
      Vibration.vibrate(pattern, true);

      // สร้าง dummy sound object เพื่อให้ส่วนอื่นของแอปทำงานได้
      const dummySound = {
        async playAsync() {
          console.log("Dummy sound play");
          return { isPlaying: true };
        },
        async stopAsync() {
          console.log("Dummy sound stop");
          return { isPlaying: false };
        },
        async unloadAsync() {
          console.log("Dummy sound unload");
          return { isLoaded: false };
        },
        async getStatusAsync() {
          return { isLoaded: true, isPlaying: true };
        },
        async setVolumeAsync() {
          return { volume: 1.0 };
        }
      };

      setSound(dummySound);
      console.log("ตั้งค่าการสั่นแทนเสียงปลุกสำเร็จ");

      /* ปิดการทำงานของโค้ดเดิมที่มีปัญหา
      // Set audio mode to play even when device is silent
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // ใช้เสียงเริ่มต้นเพียงเสียงเดียวเพื่อลดความซับซ้อน
      const soundSource = require("../assets/sounds/default-alarm.mp3");

      // สร้างและเล่นเสียงด้วยระดับเสียงสูงสุด
      const { sound: audioSound } = await Audio.Sound.createAsync(
        soundSource,
        {
          isLooping: true,
          volume: 1.0,
          shouldPlay: true, // เริ่มเล่นทันที
        },
        (status) => {
          console.log('Sound status update:', status);
          if (status.error) {
            console.error('Sound playback error:', status.error);
          }
        }
      );

      setSound(audioSound);

      // ตรวจสอบว่าเสียงเล่นได้หรือไม่
      const playbackStatus = await audioSound.getStatusAsync();
      console.log('Playback status:', playbackStatus);

      if (!playbackStatus.isLoaded) {
        throw new Error('Sound could not be loaded');
      }

      if (!playbackStatus.isPlaying) {
        await audioSound.playAsync();
      }
      */
    } catch (error) {
      console.error("Error in loadSound:", error);
      // ไม่แสดง Alert เพื่อให้หน้าจอแสดงแบบเต็มหน้าจอ
      // Alert.alert("ข้อมูลแจ้ง", "ไม่สามารถเล่นเสียงปลุกได้ ใช้การสั่นแทน");
    }
  };

  // Start vibration pattern
  const startVibration = () => {
    // Vibration pattern: stronger and more persistent pattern
    // เพิ่มความเข้มของการสั่นเพื่อทดแทนเสียงและให้รู้สึกถึงการแจ้งเตือน
    const pattern = [0, 1500, 500, 1500, 500, 1500, 500, 1500, 500, 1500, 500, 1500, 500];
    Vibration.vibrate(pattern, true); // true means repeat indefinitely

    console.log("เริ่มการสั่นแทนเสียงปลุกด้วยรูปแบบที่เข้มข้นขึ้น");

    // Set up a repeating interval to ensure vibration continues
    const vibrationInterval = setInterval(() => {
      // Check if vibration is still active, if not restart it
      Vibration.cancel();
      Vibration.vibrate(pattern, true);
      console.log("รีสตาร์ทการสั่น");
    }, 30000); // Check every 30 seconds

    // Store the interval ID in a ref so we can clear it later
    return vibrationInterval;
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

    // Stop sound temporarily
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error("Error stopping sound:", error);
      }
    }

    // Stop vibration
    Vibration.cancel();

    // Update snooze count
    const newSnoozeCount = snoozeCount + 1;
    setSnoozeCount(newSnoozeCount);

    // Show confirmation to user
    Alert.alert(
      "เลื่อนปลุก",
      `นาฬิกาปลุกจะดังอีกครั้งใน 5 นาที (ครั้งที่ ${newSnoozeCount}/${maxSnooze})`,
      [
        {
          text: "ตกลง",
          onPress: () => {
            // Schedule new alarm in 5 minutes
            // In a real app, you would use a background task or notification
            // to reschedule the alarm
            setTimeout(() => {
              // This is just a simulation - in a real app you would use proper scheduling
              // navigation.navigate("AlarmRinging", { alarm });
              Alert.alert("ปลุกซ้ำ", "ถึงเวลาปลุกอีกครั้งแล้ว!");
            }, 5 * 60 * 1000); // 5 minutes

            // ไม่ต้อง goBack() ให้ผู้ใช้กดเอง
          }
        }
      ]
    );
  };

  // Handle dismiss based on task type
  const handleDismiss = () => {
    // Determine which task screen to navigate to based on alarm settings
    if (alarm.task_type === "math") {
      navigation.navigate("MathTask", {
        alarm,
        difficulty: alarm.task_difficulty || "medium",
        onComplete: completeAlarm,
      });
    } else if (alarm.task_type === "photo") {
      navigation.navigate("PhotoTask", {
        alarm,
        difficulty: alarm.task_difficulty || "medium",
        onComplete: completeAlarm,
      });
    } else if (alarm.task_type === "random") {
      // Randomly select a task type
      const taskTypes = ["math", "photo"];
      const randomTask =
        taskTypes[Math.floor(Math.random() * taskTypes.length)];

      if (randomTask === "math") {
        navigation.navigate("MathTask", {
          alarm,
          difficulty: alarm.task_difficulty || "medium",
          onComplete: completeAlarm,
        });
      } else {
        navigation.navigate("PhotoTask", {
          alarm,
          difficulty: alarm.task_difficulty || "medium",
          onComplete: completeAlarm,
        });
      }
    } else {
      // Normal alarm - show confirmation Alert before dismissing
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
  const completeAlarm = async (status) => {
    // Stop sound and vibration
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error stopping sound:", error);
      }
    }

    // Make sure to cancel all vibrations
    Vibration.cancel();

    // Clear any running intervals that might be restarting vibrations
    // This is handled by the useEffect cleanup function

    // Show success message
    if (status === "completed") {
      Alert.alert(
        "สำเร็จ",
        "ปิดนาฬิกาปลุกเรียบร้อยแล้ว",
        [
          {
            text: "ตกลง",
            onPress: () => {
              // Navigate back to alarm list after user acknowledges
              setTimeout(() => {
                navigation.navigate("AlarmList");
              }, 500);
            }
          }
        ]
      );
    }

    try {
      // Update alarm statistics in Supabase
      if (alarm.id && user?.id) {
        const now = new Date();
        const wakeUpTime = now.getHours() * 60 + now.getMinutes();

        const { error } = await supabase
          .from('profiles')
          .update({
            statistics: {
              alarmsCompleted: increment('statistics.alarmsCompleted', 1),
              totalAlarms: increment('statistics.totalAlarms', 1),
              avgWakeUpTime: wakeUpTime, // In a real app, you would calculate a running average
            }
          })
          .eq('id', user.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating alarm statistics:", error);
    }

    // Note: We don't navigate here directly anymore - we navigate after the user acknowledges the alert
    // This ensures the screen stays visible until the user explicitly dismisses it
  };

  // Helper function to increment a numeric field
  const increment = (field, amount) => ({
    [field]: supabase.rpc('increment', { field_name: field, inc_amount: amount })
  });

  // Format time as HH:MM
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Format date with custom Thai format
  const formatThaiDate = (date) => {
    try {
      return date.toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <Animated.View 
        style={[
          styles.overlay, 
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.content}>
          {/* Current Time Display */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateText}>{formatThaiDate(currentTime)}</Text>
          </View>
          
          {/* Alarm Icon and Info */}
          <View style={styles.alarmInfoContainer}>
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View style={styles.iconCircle}>
                <Icon
                  name="alarm"
                  size={60}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>
            <Text style={styles.alarmLabel}>{alarm.label || "นาฬิกาปลุก"}</Text>
            <Text style={styles.alarmMessage}>นาฬิกาปลุกกำลังทำงาน กรุณาปิดการแจ้งเตือน</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.snoozeButton}
              onPress={handleSnooze}
            >
              <Icon name="alarm-snooze" size={24} color="white" />
              <Text style={styles.buttonText}>เลื่อนปลุก</Text>
              <View style={styles.snoozeCountContainer}>
                <Text style={styles.snoozeCount}>
                  {snoozeCount}/{maxSnooze}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Icon name="alarm-off" size={24} color="white" />
              <Text style={styles.buttonText}>
                {alarm.task_type === "normal" ? "ปิดเสียงปลุก" : "ทำภารกิจ"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom Tab Bar */}
          <View style={styles.tabBar}>
            <Icon name="alarm" size={26} color="#FFFFFF" />
            <Text style={styles.tabText}>ปลุก</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#000000",
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 0,
  },
  timeContainer: {
    alignItems: "center",
    marginTop: height * 0.08,
    width: "100%",
  },
  timeText: {
    fontSize: 64,
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 16,
    color: "#A0A0A0",
    marginTop: 8,
  },
  alarmInfoContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: height * 0.05,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#5046e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  alarmLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  alarmMessage: {
    fontSize: 15,
    color: "#A0A0A0",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  snoozeButton: {
    width: "48%",
    height: 72,
    backgroundColor: "#6B7280",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dismissButton: {
    width: "48%",
    height: 72,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
  },
  snoozeCountContainer: {
    marginTop: 2,
  },
  snoozeCount: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  tabBar: {
    width: "100%",
    height: 56,
    backgroundColor: "#1C1C1E",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  tabText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  }
});

export default AlarmRingingScreen;
