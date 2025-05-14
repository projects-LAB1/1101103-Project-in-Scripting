// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { addAlarm, updateAlarm, deleteAlarm } from "../utils/alarmStorage";
import { cancelAlarm, triggerTestAlarm } from "../utils/alarmNotification";
import { scheduleAlarmNotification as scheduleAlarm } from "../models/NotificationManager";
import { BlurView } from "expo-blur";

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

  // Add mini-game options
  const [requireGame, setRequireGame] = useState(editingAlarm?.requireGame ?? false);
  const [gameType, setGameType] = useState(editingAlarm?.gameType || "math");
  const [gameDifficulty, setGameDifficulty] = useState(editingAlarm?.gameDifficulty || "medium");

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const dayFullNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleSave = async () => {
    try {
      // Validate input before saving
      if (!time) {
        Alert.alert("ข้อผิดพลาด", "กรุณาตั้งเวลาปลุก");
        return;
      }

      // แสดงการโหลดหรือตัวบ่งชี้ว่ากำลังบันทึก
      // This would be implemented with a state variable and UI component in a real app

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
        // Add mini-game options
        requireGame,
        gameType,
        gameDifficulty,
        createdAt: new Date().toISOString(),
      };

      console.log("บันทึกการตั้งปลุก:", alarmData);
      console.log("บันทึกการตั้งค่าเกม - ต้องเล่นเกม:", requireGame ? "ใช่" : "ไม่");
      console.log("บันทึกการตั้งค่าเกม - ประเภทเกม:", gameType);
      console.log("บันทึกการตั้งค่าเกม - ระดับความยาก:", gameDifficulty);

      let savedAlarm = null;

      // กรณีแก้ไขการตั้งปลุก
      if (editingAlarm) {
        console.log(
          `กำลังอัพเดทการตั้งปลุกที่มีอยู่แล้ว ID: ${editingAlarm.id}`
        );

        // ยกเลิกการตั้งปลุกเดิมก่อน (ถ้ามี)
        if (editingAlarm.notificationId) {
          console.log(
            `ยกเลิกการแจ้งเตือนเดิม ID: ${editingAlarm.notificationId}`
          );
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

        console.log(`อัพเดทการตั้งปลุกสำเร็จ ID: ${editingAlarm.id}`);
      }
      // กรณีเพิ่มการตั้งปลุกใหม่
      else {
        console.log("กำลังเพิ่มการตั้งปลุกใหม่");
        savedAlarm = await addAlarm(alarmData);
        if (!savedAlarm) {
          throw new Error("ไม่สามารถเพิ่มการตั้งปลุกได้");
        }

        console.log(`เพิ่มการตั้งปลุกใหม่สำเร็จ ID: ${savedAlarm.id}`);
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

          console.log("กำลังตั้งเวลาการแจ้งเตือนด้วยระบบ Notification...");

          // เปลี่ยนจาก isTestOnly เป็น false เพื่อให้ไม่ปลุกทันที
          const isTestOnly = false; // กำหนดให้เป็น false เพื่อให้ปลุกตามเวลาที่ตั้งไว้

          // ตรวจสอบว่าควรตั้งการแจ้งเตือนหรือไม่
          // จะตั้งเมื่อเวลาปลุกยังไม่ผ่านไป หรือมีการตั้งซ้ำ
          const now = new Date();
          const alarmDate = new Date();
          alarmDate.setHours(savedAlarm.hour);
          alarmDate.setMinutes(savedAlarm.minute);
          alarmDate.setSeconds(0);

          // ตรวจสอบว่าเวลาปลุกผ่านไปแล้วหรือไม่
          const isPastAlarm =
            alarmDate < now && savedAlarm.repeatDays.length === 0;

          // ตั้งการแจ้งเตือนเฉพาะเมื่อ:
          // 1. ไม่ใช่การทดสอบ AND
          // 2. (เวลาปลุกยังมาไม่ถึง OR มีการตั้งปลุกซ้ำ)
          if (
            !isTestOnly &&
            (!isPastAlarm || savedAlarm.repeatDays.length > 0)
          ) {
            const notificationId = await scheduleAlarm(savedAlarm);

            if (notificationId) {
              console.log(`ตั้งเวลาการแจ้งเตือนสำเร็จ ID: ${notificationId}`);

              // อัพเดทการตั้งปลุกด้วย ID การแจ้งเตือน
              await updateAlarm(savedAlarm.id, {
                notificationId,
                updatedAt: new Date().toISOString(),
              });

              console.log(`บันทึกการตั้งปลุกพร้อม notificationId สำเร็จ`);
            } else {
              console.warn(
                "ไม่ได้รับ notificationId จากการตั้งเวลาการแจ้งเตือน"
              );
              Alert.alert(
                "คำเตือน",
                "การตั้งปลุกถูกบันทึกแล้ว แต่การแจ้งเตือนอาจไม่ทำงาน กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนของอุปกรณ์",
                [{ text: "ตกลง" }]
              );
            }
          } else if (isPastAlarm) {
            console.log(
              "ไม่มีการตั้งการแจ้งเตือน เนื่องจากเวลาปลุกผ่านไปแล้ว และไม่มีการตั้งซ้ำ"
            );
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
    navigation.navigate("SoundPicker", {
      selectedSoundId: soundId,
      onSelectSound: (selectedSound) => {
        console.log("เลือกเสียง:", selectedSound);
        setSoundId(selectedSound.id);
        setSoundName(selectedSound.name);
      }
    });
  };

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
        <TouchableOpacity
          style={styles.largeTimeDisplay}
          onPress={openTimePicker}
          activeOpacity={0.7}
        >
          <Text style={styles.largeTimeText}>
            {time.getHours().toString().padStart(2, "0")}:
            {time.getMinutes().toString().padStart(2, "0")}
          </Text>
        </TouchableOpacity>

        <Text style={styles.timeRingIn}>{getTimeUntilAlarm()}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Repeat</Text>
            <Text style={styles.sectionValueText}>{getRepeatText()}</Text>
          </View>

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

          <View style={styles.optionContainer}>
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>ข้ามวันหยุด</Text>
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

          {/* Mini Game Option */}
          <View style={styles.optionContainer}>
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>ต้องเล่นเกมเพื่อปิดปลุก</Text>
              <Switch
                value={requireGame}
                onValueChange={setRequireGame}
                trackColor={{ false: "#767577", true: "#0A84FF50" }}
                thumbColor={requireGame ? "#0A84FF" : "#f4f3f4"}
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
                      size={24}
                      color={gameType === "math" ? "#0A84FF" : "#777"}
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
                      size={24}
                      color={gameType === "memory" ? "#0A84FF" : "#777"}
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
                      size={24}
                      color={gameType === "photo" ? "#0A84FF" : "#777"}
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
                      gameDifficulty === "easy" && styles.easyButton,
                    ]}
                    onPress={() => setGameDifficulty("easy")}
                  >
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
                      gameDifficulty === "medium" && styles.mediumButton,
                    ]}
                    onPress={() => setGameDifficulty("medium")}
                  >
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
                      gameDifficulty === "hard" && styles.hardButton,
                    ]}
                    onPress={() => setGameDifficulty("hard")}
                  >
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

        {/* Sound Selection Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={goToSoundPicker}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>เสียงปลุก</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{soundName}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666666" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm name"
            placeholderTextColor="#777"
          />

          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Vibrate</Text>
              <Text style={styles.optionSubText}>{vibrateType}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Snooze</Text>
              <Text style={styles.optionSubText}>
                {snoozeTime} minutes, {snoozeCount} times
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#666"
            />
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

      {/* Horizontal time picker modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTimePicker}
        onRequestClose={cancelTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timeDisplayContainer}>
              <Text style={styles.timeDisplayText}>
                {tempTime.getHours().toString().padStart(2, "0")}:
                {tempTime.getMinutes().toString().padStart(2, "0")}
              </Text>
            </View>

            <View style={styles.horizontalPickerContainer}>
              <Text style={styles.pickerLabel}>Hours</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalPickerContent}
                ref={(hoursScrollRef) => {
                  // Scroll to current hour position when modal opens
                  if (hoursScrollRef && showTimePicker) {
                    setTimeout(() => {
                      hoursScrollRef.scrollTo({
                        x: tempTime.getHours() * 70,
                        animated: false,
                      });
                    }, 100);
                  }
                }}
              >
                <View
                  style={styles.timePickerCenterMarker}
                  pointerEvents="none"
                />
                {[...Array(24)].map((_, i) => (
                  <TouchableOpacity
                    key={`hour-${i}`}
                    style={[
                      styles.horizontalTimeItem,
                      tempTime.getHours() === i &&
                        styles.horizontalTimeItemSelected,
                    ]}
                    onPress={() => {
                      const newTime = new Date(tempTime);
                      newTime.setHours(i);
                      setTempTime(newTime);
                    }}
                  >
                    <Text
                      style={[
                        styles.horizontalTimeText,
                        tempTime.getHours() === i &&
                          styles.horizontalTimeTextSelected,
                      ]}
                    >
                      {i.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.horizontalPickerContainer}>
              <Text style={styles.pickerLabel}>Minutes</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalPickerContent}
                ref={(minutesScrollRef) => {
                  // Scroll to current minute position when modal opens
                  if (minutesScrollRef && showTimePicker) {
                    setTimeout(() => {
                      minutesScrollRef.scrollTo({
                        x: tempTime.getMinutes() * 70,
                        animated: false,
                      });
                    }, 100);
                  }
                }}
              >
                <View
                  style={styles.timePickerCenterMarker}
                  pointerEvents="none"
                />
                {[...Array(60)].map((_, i) => (
                  <TouchableOpacity
                    key={`minute-${i}`}
                    style={[
                      styles.horizontalTimeItem,
                      tempTime.getMinutes() === i &&
                        styles.horizontalTimeItemSelected,
                    ]}
                    onPress={() => {
                      const newTime = new Date(tempTime);
                      newTime.setMinutes(i);
                      setTempTime(newTime);
                    }}
                  >
                    <Text
                      style={[
                        styles.horizontalTimeText,
                        tempTime.getMinutes() === i &&
                          styles.horizontalTimeTextSelected,
                      ]}
                    >
                      {i.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={styles.timePickerCancelButton}
                onPress={cancelTimePicker}
              >
                <Text style={styles.timePickerButtonText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timePickerConfirmButton}
                onPress={confirmTimePicker}
              >
                <Text style={styles.timePickerButtonText}>OK</Text>
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
  largeTimeDisplay: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 35,
    paddingVertical: 15,
  },
  largeTimeText: {
    fontSize: 60,
    fontWeight: "300",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  timeRingIn: {
    color: "#8E8E93",
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
    marginVertical: 25,
  },
  section: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  sectionHeaderText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  sectionValueText: {
    color: "#0A84FF",
    fontSize: 17,
    marginTop: 4,
  },
  weekdayContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: "#0A84FF",
  },
  dayText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  dayTextActive: {
    color: "#FFFFFF",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 17,
  },
  optionSubText: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 2,
  },
  labelInput: {
    color: "#FFFFFF",
    fontSize: 17,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerModal: {
    width: "90%",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  timeDisplayContainer: {
    marginBottom: 30,
  },
  timeDisplayText: {
    fontSize: 50,
    color: "#FFFFFF",
    fontWeight: "200",
  },
  horizontalPickerContainer: {
    width: "100%",
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#BBBBBB",
    marginBottom: 10,
    fontWeight: "500",
    marginLeft: 10,
  },
  horizontalPickerContent: {
    paddingHorizontal: 100, // Space for items outside view
    height: 60,
    alignItems: "center",
  },
  timePickerCenterMarker: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -35,
    width: 70,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    zIndex: -1,
  },
  horizontalTimeItem: {
    width: 70,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalTimeItemSelected: {
    // no background change needed due to center marker
  },
  horizontalTimeText: {
    fontSize: 24,
    color: "#999999",
  },
  horizontalTimeTextSelected: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "500",
  },
  timePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  timePickerCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2C2C2E",
  },
  timePickerConfirmButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0A84FF",
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  optionContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  gameOptionsContainer: {
    padding: 16,
  },
  gameTypeContainer: {
    marginBottom: 20,
  },
  gameTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  gameTypeButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  gameTypeButtonActive: {
    backgroundColor: "#0A84FF",
  },
  gameTypeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  gameTypeTextActive: {
    color: "#FFFFFF",
  },
  difficultyContainer: {
    marginBottom: 20,
  },
  difficultyButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  difficultyButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  difficultyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  difficultyTextActive: {
    color: "#FFFFFF",
  },
  easyButton: {
    backgroundColor: "#007AFF",
  },
  mediumButton: {
    backgroundColor: "#FF9500",
  },
  hardButton: {
    backgroundColor: "#FF3B30",
  },
  gameOptionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  settingItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333333",
  },
  settingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    color: "#FFFFFF",
    fontSize: 17,
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValueText: {
    color: "#FFFFFF",
    fontSize: 17,
    marginRight: 8,
  },
});

export default AddAlarmScreen;
