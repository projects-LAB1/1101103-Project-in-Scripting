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
  Animated,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  addDoc,
  updateDoc,
  collection,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const AddAlarmScreen = ({ route, navigation }) => {
  // Get alarm data if editing an existing alarm
  const existingAlarm = route.params?.alarm;
  const isEditing = !!existingAlarm;

  // State for alarm data
  const [hour, setHour] = useState(
    existingAlarm?.hour || new Date().getHours()
  );
  const [minute, setMinute] = useState(
    existingAlarm?.minute || new Date().getMinutes()
  );
  const [label, setLabel] = useState(existingAlarm?.label || "");
  const [isActive, setIsActive] = useState(existingAlarm?.isActive !== false);
  const [repeatDays, setRepeatDays] = useState(existingAlarm?.repeatDays || []);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [taskType, setTaskType] = useState(existingAlarm?.taskType || "normal");
  const [taskDifficulty, setTaskDifficulty] = useState(
    existingAlarm?.taskDifficulty || "medium"
  );
  const [soundId, setSoundId] = useState(existingAlarm?.soundId || "default");
  const [soundName, setSoundName] = useState(
    existingAlarm?.soundName || "Default Alarm"
  );

  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  // Day names for repeat selection
  const dayNames = [
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
    "อาทิตย์",
  ];

  // Handle time change from picker
  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setHour(selectedDate.getHours());
      setMinute(selectedDate.getMinutes());
    }
  };

  // Toggle repeat day selection
  const toggleDay = (dayIndex) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter((day) => day !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  // Import scheduleAlarmNotification
  const {
    scheduleAlarmNotification,
  } = require("../models/NotificationManager");

  // แก้ไขการสร้าง slideAnim
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // ฟังก์ชันสำหรับบันทึกนาฬิกาปลุกและย้อนกลับ
  const handleSaveAndBack = async () => {
    if (!userId) {
      Alert.alert("ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนบันทึกนาฬิกาปลุก");
      return;
    }

    // ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
    const networkState = await NetInfo.fetch();
    const isConnected =
      networkState.isConnected && networkState.isInternetReachable;

    if (!isConnected) {
      Alert.alert(
        "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
        "ไม่สามารถบันทึกนาฬิกาปลุกในขณะนี้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง",
        [{ text: "ตกลง" }]
      );
      return;
    }

    try {
      const alarmData = {
        hour,
        minute,
        label,
        isActive,
        repeatDays,
        taskType,
        taskDifficulty,
        soundId,
        soundName,
        userId,
        updatedAt: new Date(),
      };

      let alarmId;

      if (isEditing) {
        // อัปเดตนาฬิกาปลุกที่มีอยู่
        alarmId = existingAlarm.id;
        const alarmRef = doc(db, "alarms", alarmId);
        await updateDoc(alarmRef, alarmData);
      } else {
        // สร้างนาฬิกาปลุกใหม่
        alarmData.createdAt = new Date();
        const docRef = await addDoc(collection(db, "alarms"), alarmData);
        alarmId = docRef.id;
      }

      // ตั้งค่าการแจ้งเตือนถ้านาฬิกาปลุกเปิดใช้งาน
      if (isActive) {
        const fullAlarmData = { ...alarmData, id: alarmId };
        const notificationId = await scheduleAlarmNotification(fullAlarmData);

        // อัปเดตนาฬิกาปลุกด้วย ID การแจ้งเตือน
        if (notificationId) {
          const alarmRef = doc(db, "alarms", alarmId);
          await updateDoc(alarmRef, { notificationId });
          console.log(
            `Alarm scheduled with notification ID: ${notificationId}`
          );
        }
      }

      // นำทางกลับหน้าแรกทันที โดยใช้ navigation.reset เพื่อให้แน่ใจว่ากลับไปหน้าแรกได้อย่างถูกต้อง
      navigation.reset({
        index: 0,
        routes: [{ name: "Alarm" }],
      });

      // ไม่จำเป็นต้องใช้ animation และ setTimeout เพราะ navigation.reset จะทำงานทันที
    } catch (error) {
      console.error("Error saving alarm:", error);

      // จัดการกับประเภทข้อผิดพลาดต่างๆ
      if (
        error.code === "unavailable" ||
        error.code === "failed-precondition" ||
        error.message.includes("offline") ||
        error.message.includes("network") ||
        error.message.includes("client is offline")
      ) {
        Alert.alert(
          "ข้อผิดพลาดการเชื่อมต่อ",
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง"
        );
      } else {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกนาฬิกาปลุกได้");
      }
    }
  };

  // Select alarm sound
  const selectSound = () => {
    navigation.navigate("SoundLibrary", {
      onSelect: (sound) => {
        setSoundId(sound.id);
        setSoundName(sound.name);
      },
      currentSoundId: soundId,
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Time Picker Section */}
          <View style={styles.timeSection}>
            <TouchableOpacity
              style={styles.timeDisplay}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeText}>
                {`${hour.toString().padStart(2, "0")}:${minute
                  .toString()
                  .padStart(2, "0")}`}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={new Date(new Date().setHours(hour, minute, 0))}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Alarm Details Section */}
          <View style={styles.section}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>ชื่อนาฬิกาปลุก</Text>
              <TextInput
                style={styles.textInput}
                value={label}
                onChangeText={setLabel}
                placeholder="ใส่ชื่อนาฬิกาปลุก"
                maxLength={30}
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>เปิดใช้งาน</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: "#D1D5DB", true: "#4F46E5" }}
              />
            </View>
          </View>

          {/* Repeat Days Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ทำซ้ำ</Text>
            {dayNames.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dayRow}
                onPress={() => toggleDay(index)}
              >
                <Text style={styles.dayText}>{day}</Text>
                <View
                  style={[
                    styles.dayIndicator,
                    repeatDays.includes(index) && styles.daySelected,
                  ]}
                >
                  {repeatDays.includes(index) && (
                    <Icon name="check" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Task Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>วิธีปิดนาฬิกาปลุก</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={taskType}
                onValueChange={(itemValue) => setTaskType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="ปกติ (กดปุ่มปิด)" value="normal" />
                <Picker.Item label="โจทย์คณิตศาสตร์" value="math" />
                <Picker.Item label="ถ่ายรูปตามสีที่กำหนด" value="photo" />
                <Picker.Item label="สุ่มภารกิจ" value="random" />
              </Picker>
            </View>

            {taskType !== "normal" && (
              <>
                <Text style={styles.inputLabel}>ระดับความยาก</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={taskDifficulty}
                    onValueChange={(itemValue) => setTaskDifficulty(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="ง่าย" value="easy" />
                    <Picker.Item label="ปานกลาง" value="medium" />
                    <Picker.Item label="ยาก" value="hard" />
                  </Picker>
                </View>
              </>
            )}
          </View>

          {/* Sound Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>เสียงปลุก</Text>
            <TouchableOpacity
              style={styles.soundSelector}
              onPress={selectSound}
            >
              <View>
                <Text style={styles.soundName}>{soundName}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* แทนที่ปุ่มเดิมด้วยปุ่มใหม่ */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            onPress={handleSaveAndBack}
          >
            <Icon
              name="content-save"
              size={24}
              color="#000000"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveButtonText}>
              {isEditing ? "บันทึกและย้อนกลับ" : "บันทึกนาฬิกาปลุก"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12111D",
    padding: 16,
  },
  timeSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  timeDisplay: {
    backgroundColor: "#1a237e",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    backgroundColor: "#1F1D2B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  inputLabel: {
    fontSize: 16,
    color: "#9fa8da",
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    textAlign: "right",
    color: "#fff",
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dayText: {
    fontSize: 16,
    color: "#9fa8da",
  },
  dayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: {
    backgroundColor: "#1a237e",
    borderColor: "#4F46E5",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#1a237e",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#162447",
  },
  picker: {
    height: 50,
  },
  soundSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  soundName: {
    fontSize: 16,
    color: "#9fa8da",
  },
  saveButton: {
    backgroundColor: "#D8D5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: 20,
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddAlarmScreen;
