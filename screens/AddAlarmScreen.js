// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* ส่วนหัวของหน้าจอที่มีปุ่มยกเลิกและบันทึก */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>เพิ่มการตั้งปลุก</Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSaveAndBack}
        >
          <Text style={styles.saveText}>บันทึก</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker แบบแสดงตัวเลือกแนวนอน */}
      <View style={styles.timePickerContainer}>
        <DateTimePicker
          value={new Date(new Date().setHours(hour, minute, 0))}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? "spinner" : "default"}
          onChange={onTimeChange}
          textColor="#FFFFFF"
          style={styles.timePicker}
        />
      </View>

      {/* ส่วนของตัวเลือกการทำซ้ำ */}
      <View style={styles.optionSection}>
        <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate("RepeatOptions", { repeatDays, setRepeatDays })}>
          <Text style={styles.optionLabel}>ปลุกซ้ำ</Text>
          <View style={styles.optionValue}>
            <Text style={styles.optionValueText}>
              {repeatDays.length === 0 ? "ไม่ปลุกซ้ำ" : 
               repeatDays.length === 7 ? "ทุกวัน" :
               dayNames.filter((_, i) => repeatDays.includes(i)).join(', ')}
            </Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.separator} />
        
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>ชื่อ</Text>
          <TextInput
            style={styles.inputField}
            value={label}
            onChangeText={setLabel}
            placeholder="การตั้งปลุก"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        
        <View style={styles.separator} />
        
        <TouchableOpacity style={styles.optionRow} onPress={selectSound}>
          <Text style={styles.optionLabel}>เสียง</Text>
          <View style={styles.optionValue}>
            <Text style={styles.optionValueText}>{soundName || "ค่าเริ่มต้น"}</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.separator} />
        
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>เลื่อนปลุก</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={isActive ? "#FFFFFF" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
    backgroundColor: '#1C1C1E',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    fontSize: 17,
    color: '#FF9500',
    fontWeight: '400',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF9500',
  },
  timePickerContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  timePicker: {
    width: '100%',
    backgroundColor: '#1C1C1E',
  },
  optionSection: {
    marginTop: 20,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#333333',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  optionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValueText: {
    fontSize: 17,
    color: '#9CA3AF',
    marginRight: 8,
  },
  inputField: {
    fontSize: 17,
    color: '#9CA3AF',
    textAlign: 'right',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#333333',
    marginLeft: 16,
    marginRight: 16,
  }
});

export default AddAlarmScreen;
