// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Pressable,
  StatusBar,
  Modal,
  FlatList,
  Vibration,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { addAlarm, updateAlarm, deleteAlarm } from "../utils/alarmStorage";
import { cancelAlarm, triggerTestAlarm } from "../utils/alarmNotification";
import { scheduleAlarmNotification as scheduleAlarm } from "../models/NotificationManager";
import { BlurView } from "expo-blur";
import { useSoundSelection } from '../contexts/SoundSelectionContext';

const AddAlarmScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const editingAlarm = route.params?.alarm;

  const [time, setTime] = useState(
    editingAlarm
      ? new Date(2000, 1, 1, editingAlarm.hour, editingAlarm.minute)
      : new Date()
  );
  const [repeatDays, setRepeatDays] = useState(editingAlarm?.repeatDays || []);
  const [isActive, setIsActive] = useState(editingAlarm?.isActive ?? true);
  const [label, setLabel] = useState(editingAlarm?.label || "");
  const [soundId, setSoundId] = useState(editingAlarm?.soundId || "default");
  const [soundName, setSoundName] = useState(
    editingAlarm?.soundName || "Default alarm sound"
  );
  const [snooze, setSnooze] = useState(editingAlarm?.snooze ?? true);
  const [snoozeTime, setSnoozeTime] = useState(editingAlarm?.snoozeTime || 5);
  const [snoozeCount, setSnoozeCount] = useState(
    editingAlarm?.snoozeCount || 3
  );
  const [vibrate, setVibrate] = useState(editingAlarm?.vibrate ?? true);
  const [vibrateType, setVibrateType] = useState(
    editingAlarm?.vibrateType || "Default"
  );
  const [skipHolidays, setSkipHolidays] = useState(
    editingAlarm?.skipHolidays ?? false
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  // Add mini-game options - แก้ไขการตั้งค่าเริ่มต้นของ requireGame เพื่อให้เก็บค่าถูกต้อง
  const [requireGame, setRequireGame] = useState(() => {
    return editingAlarm?.requireGame === true;
  });
  const [gameType, setGameType] = useState(editingAlarm?.gameType || "math");
  const [gameDifficulty, setGameDifficulty] = useState(editingAlarm?.gameDifficulty || "medium");

  const { selectedSound, setSelectedSound } = useSoundSelection();

  // ตรวจสอบค่า requireGame จาก editingAlarm
  useEffect(() => {
    if (editingAlarm) {
      if (editingAlarm.requireGame === true && !requireGame) {
        setRequireGame(true);
      }
    }
  }, [editingAlarm, requireGame]);

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const dayFullNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleSave = async () => {
    try {
      // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
      if (!user) {
        Alert.alert(
          "กรุณาเข้าสู่ระบบ",
          "คุณจำเป็นต้องเข้าสู่ระบบก่อนจึงจะสามารถตั้งนาฬิกาปลุกได้",
          [
            {
              text: "เข้าสู่ระบบ",
              onPress: () => navigation.navigate("Auth", { screen: "Login" })
            },
            {
              text: "ยกเลิก",
              style: "cancel"
            }
          ]
        );
        return;
      }

      // Validate input before saving
      if (!time) {
        Alert.alert("ข้อผิดพลาด", "กรุณาตั้งเวลาปลุก");
        return;
      }

      const alarmData = {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeatDays,
        isActive,
        userId: user?.id,
        label,
        soundId,
        soundName,
        snooze,
        snoozeTime,
        snoozeCount,
        vibrate,
        vibrateType,
        skipHolidays,
        requireGame: requireGame === true,
        gameType,
        gameDifficulty,
        createdAt: new Date().toISOString(),
      };

      let savedAlarm = null;

      // กรณีแก้ไขการตั้งปลุก
      if (editingAlarm) {
        // ยกเลิกการตั้งปลุกเดิมก่อน (ถ้ามี)
        if (editingAlarm.notificationId) {
          await cancelAlarm(editingAlarm.notificationId);
        }

        // อัพเดทข้อมูลการตั้งปลุก
        const updateSuccess = await updateAlarm(editingAlarm.id, alarmData);
        if (!updateSuccess) {
          throw new Error("ไม่สามารถอัพเดทการตั้งปลุกได้");
        }

        savedAlarm = {
          ...alarmData,
          id: editingAlarm.id,
        };
      }
      // กรณีเพิ่มการตั้งปลุกใหม่
      else {
        savedAlarm = await addAlarm(alarmData);
        if (!savedAlarm) {
          throw new Error("ไม่สามารถเพิ่มการตั้งปลุกได้");
        }
      }

      // ถ้าการตั้งปลุกเปิดใช้งาน ให้ตั้งเวลาการแจ้งเตือน
      if (isActive && savedAlarm) {
        try {
          Alert.alert(
            "กำลังตั้งนาฬิกาปลุก",
            `เวลา ${savedAlarm.hour}:${savedAlarm.minute
              .toString()
              .padStart(2, "0")}`,
            [{ text: "ตกลง" }]
          );

          const isTestOnly = false;

          // ตรวจสอบว่าควรตั้งการแจ้งเตือนหรือไม่
          const now = new Date();
          const alarmDate = new Date();
          alarmDate.setHours(savedAlarm.hour);
          alarmDate.setMinutes(savedAlarm.minute);
          alarmDate.setSeconds(0);

          const isPastAlarm =
            alarmDate < now && savedAlarm.repeatDays.length === 0;

          if (
            !isTestOnly &&
            (!isPastAlarm || savedAlarm.repeatDays.length > 0)
          ) {
            const notificationId = await scheduleAlarm(savedAlarm);

            if (notificationId) {
              await updateAlarm(savedAlarm.id, {
                notificationId,
                updatedAt: new Date().toISOString(),
              });
            } else {
              Alert.alert(
                "คำเตือน",
                "การตั้งปลุกถูกบันทึกแล้ว แต่การแจ้งเตือนอาจไม่ทำงาน กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนของอุปกรณ์",
                [{ text: "ตกลง" }]
              );
            }
          } else if (isPastAlarm) {
            Alert.alert(
              "ข้อความ",
              "เวลาปลุกผ่านไปแล้ว การตั้งปลุกจะมีผลในวันพรุ่งนี้",
              [{ text: "ตกลง" }]
            );
          }
        } catch (notificationError) {
          console.error("Error scheduling notification:", notificationError);
          Alert.alert(
            "คำเตือน",
            "การตั้งปลุกถูกบันทึกแล้ว แต่การแจ้งเตือนอาจไม่ทำงาน กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนของอุปกรณ์",
            [{ text: "ตกลง" }]
          );
        }
      }

      // กลับไปยังหน้าก่อนหน้า
      navigation.goBack();
    } catch (error) {
      console.error("Error saving alarm:", error);
      Alert.alert(
        "ข้อผิดพลาด",
        "ไม่สามารถบันทึกการตั้งปลุกได้ กรุณาลองใหม่อีกครั้ง",
        [{ text: "ตกลง" }]
      );
    }
  };

  const toggleDay = (dayIndex) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // ฟังก์ชันทดสอบการปลุกทันที - จะแสดงการแจ้งเตือนและหน้าปลุกทันที
  const handleTestAlarm = () => {
    try {
      // เพิ่มตัวแปรเพื่อป้องกันการกดทดสอบหลายครั้งซ้อนกัน
      if (window.isTestingAlarm) {
        Alert.alert(
          "กำลังทดสอบ",
          "กรุณารอสักครู่ ระบบกำลังทดสอบเสียงปลุกอยู่"
        );
        return;
      }
      
      // ตั้งค่าตัวแปรเพื่อป้องกันการกดซ้ำ
      window.isTestingAlarm = true;
      
      // แสดงข้อความกำลังทดสอบ
      Alert.alert(
        "ทดสอบเสียงปลุก",
        "กำลังทดสอบเสียงปลุก โปรดรอสักครู่...",
        [{ text: "รอสักครู่..." }]
      );
      
      // สร้างข้อมูลสำหรับการทดสอบโดยเฉพาะ
      const testAlarmData = {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeatDays,
        isActive: true,
        userId: user?.id,
        label: label || "การทดสอบ (จะปลุกทันที)",
        soundId,
        soundName,
        snooze,
        isTest: true, // เพิ่มตัวบ่งชี้ว่าเป็นการทดสอบ
      };

      // ใช้ triggerTestAlarm เพื่อทดสอบการปลุกทันที
      triggerTestAlarm(testAlarmData).then((alarmData) => {
        // แสดงคำเตือนเพื่อให้ผู้ใช้ทราบว่านี่เป็นการทดสอบ
        console.log(
          "กำลังนำทางไปยังหน้า AlarmRinging สำหรับการทดสอบเท่านั้น",
          alarmData
        );
        navigation.navigate("Alarm", {
          screen: "AlarmRinging",
          params: { alarm: alarmData },
        });
        
        // รีเซ็ตตัวแปรหลังจากนำทางไปยังหน้าปลุกแล้ว
        setTimeout(() => {
          window.isTestingAlarm = false;
        }, 1000);
      });
    } catch (error) {
      console.error("Error testing alarm:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถทดสอบการปลุกได้");
      
      // รีเซ็ตตัวแปรในกรณีที่เกิดข้อผิดพลาด
      window.isTestingAlarm = false;
    }
  };

  // เพิ่มฟังก์ชันสำหรับไปยังหน้าเลือกเสียง
  const goToSoundPicker = () => {
    // Set current sound selection in context before navigating
    setSelectedSound({
      id: soundId,
      name: soundName
    });
    
    navigation.navigate("SoundPicker");
  };

  // Listen for sound selection changes from context
  React.useEffect(() => {
    if (selectedSound && selectedSound.id !== soundId) {
      setSoundId(selectedSound.id);
      setSoundName(selectedSound.name);
    }
  }, [selectedSound]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          {editingAlarm ? "Edit alarm" : "Add alarm"}
        </Text>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "ทดสอบการปลุกทันที",
                "ฟังก์ชันนี้จะปลุกทันที เพื่อทดสอบเท่านั้น ไม่เกี่ยวกับเวลาที่ตั้งไว้",
                [
                  { text: "ยกเลิก", style: "cancel" },
                  { text: "ทดสอบเลย", onPress: handleTestAlarm },
                ]
              );
            }}
            style={styles.headerButton}
          >
            <Ionicons name="alarm-outline" size={22} color="#0A84FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.headerButtonTextDone}>Save</Text>
          </TouchableOpacity>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: "#000000",
        shadowColor: "transparent",
        elevation: 0,
      },
      headerTintColor: "#FFFFFF",
    });
  }, [navigation, time, repeatDays, isActive]);

  const getRepeatText = () => {
    if (repeatDays.length === 0) return "Never";
    if (repeatDays.length === 7) return "Every day";
    if (
      repeatDays.length === 5 &&
      !repeatDays.includes(0) &&
      !repeatDays.includes(6)
    )
      return "Weekdays";
    if (
      repeatDays.length === 2 &&
      repeatDays.includes(0) &&
      repeatDays.includes(6)
    )
      return "Weekends";

    return repeatDays
      .sort()
      .map((day) => dayFullNames[day])
      .join(", ");
  };

  const getTimeUntilAlarm = () => {
    const now = new Date();
    const alarmTime = new Date(now);
    alarmTime.setHours(time.getHours());
    alarmTime.setMinutes(time.getMinutes());
    alarmTime.setSeconds(0);

    // ถ้าเวลาปลุกผ่านไปแล้ว ให้เพิ่มอีก 1 วัน
    if (alarmTime < now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    // คำนวณความแตกต่าง
    const diffMs = alarmTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `Ring in ${diffHrs} hours ${diffMins} minutes`;
  };

  // Quick access time adjustment functions
  const addMinutes = (mins) => {
    const newTime = new Date(time);
    newTime.setMinutes(newTime.getMinutes() + mins);
    setTime(newTime);
  };

  const setSpecificTime = (hours, minutes) => {
    const newTime = new Date(time);
    newTime.setHours(hours);
    newTime.setMinutes(minutes);
    setTime(newTime);
  };

  const openTimePicker = () => {
    setTempTime(new Date(time));
    setShowTimePicker(true);
  };

  const cancelTimePicker = () => {
    setShowTimePicker(false);
  };

  const confirmTimePicker = () => {
    setTime(tempTime);
    setShowTimePicker(false);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setTempTime(selectedTime);
      // เพิ่ม vibration feedback เบา ๆ
      Vibration.vibrate(50);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["right", "left", "bottom"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Samsung-style large time display */}
        <View style={styles.timeSection}>
          <TouchableOpacity
            style={styles.largeTimeDisplay}
            onPress={openTimePicker}
            activeOpacity={0.7}
          >
            <Text style={styles.largeTimeText}>
              {time.getHours().toString().padStart(2, "0")}:
              {time.getMinutes().toString().padStart(2, "0")}
            </Text>
            <View style={styles.editTimeIndicator}>
              <MaterialCommunityIcons name="pencil" size={16} color="#0A84FF" />
              <Text style={styles.editTimeText}>แตะเพื่อแก้ไขเวลา</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.timeRingIn}>{getTimeUntilAlarm()}</Text>
        </View>

        {/* Repeat Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderImproved}>
            <MaterialCommunityIcons name="repeat" size={20} color="#0A84FF" />
            <Text style={styles.sectionTitle}>การทำซ้ำ</Text>
          </View>
          
          <Text style={styles.currentRepeatText}>{getRepeatText()}</Text>

          <View style={styles.weekdayContainer}>
            {dayNames.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  repeatDays.includes(index) ? styles.dayButtonActive : null,
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    repeatDays.includes(index) ? styles.dayTextActive : null,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.quickRepeatOptions}>
            <TouchableOpacity 
              style={styles.quickOption}
              onPress={() => setRepeatDays([])}
            >
              <Text style={styles.quickOptionText}>ไม่ทำซ้ำ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickOption}
              onPress={() => setRepeatDays([1,2,3,4,5])}
            >
              <Text style={styles.quickOptionText}>วันธรรมดา</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickOption}
              onPress={() => setRepeatDays([0,1,2,3,4,5,6])}
            >
              <Text style={styles.quickOptionText}>ทุกวัน</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionRow}>
              <View style={styles.optionWithIcon}>
                <MaterialCommunityIcons name="calendar-remove" size={20} color="#FF9500" />
                <Text style={styles.optionText}>ข้ามวันหยุด</Text>
              </View>
              <Switch
                value={skipHolidays}
                onValueChange={setSkipHolidays}
                trackColor={{ false: "#767577", true: "#0A84FF50" }}
                thumbColor={skipHolidays ? "#0A84FF" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
            <Text style={styles.optionSubText}>
              ไม่ปลุกในวันหยุดนักขัตฤกษ์
            </Text>
          </View>
        </View>

        {/* Game Challenge Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderImproved}>
            <MaterialCommunityIcons name="gamepad-variant" size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>ความท้าทาย</Text>
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionRow}>
              <View style={styles.optionWithIcon}>
                <MaterialCommunityIcons name="puzzle" size={20} color="#FF3B30" />
                <Text style={styles.optionText}>ต้องเล่นเกมเพื่อปิดปลุก</Text>
              </View>
              <Switch
                value={requireGame}
                onValueChange={(value) => {
                  console.log("เปลี่ยนค่า requireGame เป็น:", value);
                  setRequireGame(value);
                }}
                trackColor={{ false: "#767577", true: "#FF950050" }}
                thumbColor={requireGame ? "#FF9500" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
            <Text style={styles.optionSubText}>
              จำเป็นต้องเล่นเกมให้ผ่านเพื่อปิดการปลุก
            </Text>
          </View>

          {requireGame && (
            <View style={styles.gameOptionsContainer}>
              <View style={styles.gameTypeContainer}>
                <Text style={styles.gameOptionTitle}>ประเภทเกม</Text>
                <View style={styles.gameTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.gameTypeButton,
                      gameType === "math" && styles.gameTypeButtonActive,
                    ]}
                    onPress={() => setGameType("math")}
                  >
                    <MaterialCommunityIcons
                      name="calculator"
                      size={28}
                      color={gameType === "math" ? "#FFFFFF" : "#0A84FF"}
                    />
                    <Text
                      style={[
                        styles.gameTypeText,
                        gameType === "math" && styles.gameTypeTextActive,
                      ]}
                    >
                      คณิตศาสตร์
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.gameTypeButton,
                      gameType === "memory" && styles.gameTypeButtonActive,
                    ]}
                    onPress={() => setGameType("memory")}
                  >
                    <MaterialCommunityIcons
                      name="cards"
                      size={28}
                      color={gameType === "memory" ? "#FFFFFF" : "#0A84FF"}
                    />
                    <Text
                      style={[
                        styles.gameTypeText,
                        gameType === "memory" && styles.gameTypeTextActive,
                      ]}
                    >
                      จับคู่ภาพ
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.gameTypeButton,
                      gameType === "photo" && styles.gameTypeButtonActive,
                    ]}
                    onPress={() => setGameType("photo")}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={28}
                      color={gameType === "photo" ? "#FFFFFF" : "#0A84FF"}
                    />
                    <Text
                      style={[
                        styles.gameTypeText,
                        gameType === "photo" && styles.gameTypeTextActive,
                      ]}
                    >
                      ถ่ายรูป
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.difficultyContainer}>
                <Text style={styles.gameOptionTitle}>ระดับความยาก</Text>
                <View style={styles.difficultyButtons}>
                  <TouchableOpacity
                    style={[
                      styles.difficultyButton,
                      gameDifficulty === "easy" && styles.easyButtonActive,
                    ]}
                    onPress={() => setGameDifficulty("easy")}
                  >
                    <MaterialCommunityIcons
                      name="emoticon-happy"
                      size={24}
                      color={gameDifficulty === "easy" ? "#FFFFFF" : "#34C759"}
                    />
                    <Text
                      style={[
                        styles.difficultyText,
                        gameDifficulty === "easy" && styles.difficultyTextActive,
                      ]}
                    >
                      ง่าย
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.difficultyButton,
                      gameDifficulty === "medium" && styles.mediumButtonActive,
                    ]}
                    onPress={() => setGameDifficulty("medium")}
                  >
                    <MaterialCommunityIcons
                      name="emoticon-neutral"
                      size={24}
                      color={gameDifficulty === "medium" ? "#FFFFFF" : "#FF9500"}
                    />
                    <Text
                      style={[
                        styles.difficultyText,
                        gameDifficulty === "medium" && styles.difficultyTextActive,
                      ]}
                    >
                      ปานกลาง
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.difficultyButton,
                      gameDifficulty === "hard" && styles.hardButtonActive,
                    ]}
                    onPress={() => setGameDifficulty("hard")}
                  >
                    <MaterialCommunityIcons
                      name="emoticon-angry"
                      size={24}
                      color={gameDifficulty === "hard" ? "#FFFFFF" : "#FF3B30"}
                    />
                    <Text
                      style={[
                        styles.difficultyText,
                        gameDifficulty === "hard" && styles.difficultyTextActive,
                      ]}
                    >
                      ยาก
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Sound and Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderImproved}>
            <MaterialCommunityIcons name="volume-high" size={20} color="#34C759" />
            <Text style={styles.sectionTitle}>เสียงและการตั้งค่า</Text>
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={goToSoundPicker}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="music-note" size={20} color="#0A84FF" />
                <Text style={styles.settingLabel}>เสียงปลุก</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{soundName}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.labelContainer}>
            <View style={styles.labelHeader}>
              <MaterialCommunityIcons name="label" size={20} color="#0A84FF" />
              <Text style={styles.labelTitle}>ชื่อการปลุก</Text>
            </View>
            <TextInput
              style={styles.labelInput}
              value={label}
              onChangeText={setLabel}
              placeholder="ใส่ชื่อการปลุก (ไม่บังคับ)"
              placeholderTextColor="#777"
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="vibrate" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>การสั่น</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{vibrateType}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="sleep" size={20} color="#8E8E93" />
                <Text style={styles.settingLabel}>งีบ</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>
                  {snoozeTime} นาที, {snoozeCount} ครั้ง
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {editingAlarm && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Delete Alarm",
                "Are you sure you want to delete this alarm?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        if (editingAlarm.notificationId) {
                          await cancelAlarm(editingAlarm.notificationId);
                        }
                        await deleteAlarm(editingAlarm.id);
                        navigation.goBack();
                      } catch (error) {
                        console.error("Error deleting alarm:", error);
                        Alert.alert("Error", "Could not delete the alarm");
                      }
                    },
                  },
                ]
              );
            }}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={24}
              color="#FF3B30"
            />
            <Text style={styles.deleteButtonText}>Delete Alarm</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Wheel time picker modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimePicker}
        onRequestClose={cancelTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกเวลา</Text>
            </View>

            {/* Wheel Pickers */}
            <View style={styles.wheelPickersContainer}>
              {/* Hour Wheel */}
              <View style={styles.wheelSection}>
                <ScrollView
                  style={styles.wheelScrollView}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                  bounces={false}
                  onScroll={(event) => {
                    const hour = Math.max(0, Math.min(23, Math.round(event.nativeEvent.contentOffset.y / 40)));
                    if (hour !== tempTime.getHours()) {
                      const newTime = new Date(tempTime);
                      newTime.setHours(hour);
                      setTempTime(newTime);
                    }
                  }}
                  onMomentumScrollEnd={(event) => {
                    const hour = Math.max(0, Math.min(23, Math.round(event.nativeEvent.contentOffset.y / 40)));
                    if (hour !== tempTime.getHours()) {
                      const newTime = new Date(tempTime);
                      newTime.setHours(hour);
                      setTempTime(newTime);
                      Vibration.vibrate(50);
                    }
                  }}
                  scrollEventThrottle={16}
                  ref={(hourScrollRef) => {
                    if (hourScrollRef && showTimePicker) {
                      setTimeout(() => {
                        hourScrollRef.scrollTo({
                          y: tempTime.getHours() * 40,
                          animated: false,
                        });
                      }, 100);
                    }
                  }}
                >
                  {[...Array(24)].map((_, i) => {
                    const isSelected = tempTime.getHours() === i;
                    return (
                      <View key={`hour-${i}`} style={styles.wheelItem}>
                        <Text style={[
                          styles.wheelText,
                          isSelected && styles.wheelTextSelected,
                        ]}>
                          {i.toString().padStart(2, "0")}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Separator */}
              <View style={styles.wheelSeparator}>
                <Text style={styles.separatorText}>:</Text>
              </View>

              {/* Minute Wheel */}
              <View style={styles.wheelSection}>
                <ScrollView
                  style={styles.wheelScrollView}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                  bounces={false}
                  onScroll={(event) => {
                    const minute = Math.max(0, Math.min(59, Math.round(event.nativeEvent.contentOffset.y / 40)));
                    if (minute !== tempTime.getMinutes()) {
                      const newTime = new Date(tempTime);
                      newTime.setMinutes(minute);
                      setTempTime(newTime);
                    }
                  }}
                  onMomentumScrollEnd={(event) => {
                    const minute = Math.max(0, Math.min(59, Math.round(event.nativeEvent.contentOffset.y / 40)));
                    if (minute !== tempTime.getMinutes()) {
                      const newTime = new Date(tempTime);
                      newTime.setMinutes(minute);
                      setTempTime(newTime);
                      Vibration.vibrate(50);
                    }
                  }}
                  scrollEventThrottle={16}
                  ref={(minuteScrollRef) => {
                    if (minuteScrollRef && showTimePicker) {
                      setTimeout(() => {
                        minuteScrollRef.scrollTo({
                          y: tempTime.getMinutes() * 40,
                          animated: false,
                        });
                      }, 100);
                    }
                  }}
                >
                  {[...Array(60)].map((_, i) => {
                    const isSelected = tempTime.getMinutes() === i;
                    return (
                      <View key={`minute-${i}`} style={styles.wheelItem}>
                        <Text style={[
                          styles.wheelText,
                          isSelected && styles.wheelTextSelected,
                        ]}>
                          {i.toString().padStart(2, "0")}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={styles.timePickerCancelButton}
                onPress={cancelTimePicker}
              >
                <Text style={styles.timePickerButtonText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timePickerConfirmButton}
                onPress={confirmTimePicker}
              >
                <Text style={styles.timePickerButtonText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: "#0A84FF",
    fontSize: 17,
  },
  headerButtonTextDone: {
    color: "#0A84FF",
    fontSize: 17,
    fontWeight: "600",
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeSection: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  largeTimeDisplay: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  largeTimeText: {
    fontSize: 72,
    fontWeight: "200",
    color: "#FFFFFF",
    letterSpacing: 4,
    textShadowColor: "rgba(10, 132, 255, 0.5)",
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  editTimeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(10, 132, 255, 0.2)",
    borderRadius: 15,
  },
  editTimeText: {
    color: "#0A84FF",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  timeRingIn: {
    color: "#34C759",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "rgba(52, 199, 89, 0.1)",
    borderRadius: 15,
    overflow: "hidden",
  },
  section: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionHeaderImproved: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  currentRepeatText: {
    color: "#0A84FF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(10, 132, 255, 0.1)",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  weekdayContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444444",
  },
  dayButtonActive: {
    backgroundColor: "#0A84FF",
    borderColor: "#0A84FF",
    shadowColor: "#0A84FF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  dayText: {
    color: "#8E8E93",
    fontSize: 16,
    fontWeight: "600",
  },
  dayTextActive: {
    color: "#FFFFFF",
  },
  quickRepeatOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#444444",
  },
  quickOptionText: {
    color: "#0A84FF",
    fontSize: 12,
    fontWeight: "500",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500",
  },
  optionSubText: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontStyle: "italic",
  },
  optionContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  gameOptionsContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 149, 0, 0.05)",
  },
  gameTypeContainer: {
    marginBottom: 24,
  },
  gameTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  gameTypeButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444444",
  },
  gameTypeButtonActive: {
    backgroundColor: "#0A84FF",
    borderColor: "#0A84FF",
    shadowColor: "#0A84FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  gameTypeText: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  gameTypeTextActive: {
    color: "#FFFFFF",
  },
  difficultyContainer: {
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  difficultyButton: {
    width: 90,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444444",
  },
  easyButtonActive: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
    shadowColor: "#34C759",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  mediumButtonActive: {
    backgroundColor: "#FF9500",
    borderColor: "#FF9500",
    shadowColor: "#FF9500",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  hardButtonActive: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
    shadowColor: "#FF3B30",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  difficultyText: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  difficultyTextActive: {
    color: "#FFFFFF",
  },
  gameOptionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  settingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500",
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValueText: {
    color: "#8E8E93",
    fontSize: 15,
    marginRight: 8,
  },
  labelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  labelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "500",
  },
  labelInput: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444444",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Horizontal Time Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerModal: {
    width: "85%",
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  wheelPickersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    height: 180,
    backgroundColor: "#2C2C2E",
  },
  wheelSection: {
    width: 90,
    height: 200,
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
  },
  wheelScrollView: {
    flex: 1,
    backgroundColor: "#2C2C2E",
  },
  wheelContent: {
    paddingVertical: 80, // เพื่อให้มีพื้นที่เลือกตรงกลาง
    backgroundColor: "#2C2C2E",
  },
  wheelItem: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
  },
  wheelText: {
    color: "#666666",
    fontSize: 32,
    fontWeight: "300",
    textAlign: "center",
  },
  wheelTextSelected: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "200",
  },
  wheelSeparator: {
    width: 40,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
  },
  separatorText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "200",
  },
  timePickerActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
    width: "100%",
    marginTop: 16,
  },
  timePickerCancelButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2C2C2E",
    borderWidth: 1,
    borderColor: "#444444",
    minWidth: 80,
  },
  timePickerConfirmButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0A84FF",
    shadowColor: "#0A84FF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 80,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default AddAlarmScreen;
