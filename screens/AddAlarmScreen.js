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
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Pressable,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../supabase.config";
import { UserAuth } from "../models/UserAuth";
// ใช้ Icon สำหรับปุ่มเพิ่ม/ลดเวลา
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { scheduleAlarmNotification } from "../models/NotificationManager";
import { Picker } from '@react-native-picker/picker';

const AddAlarmScreen = ({ route, navigation }) => {
  // Get alarm data if editing an existing alarm
  const existingAlarm = route.params?.alarm;
  const isEditing = !!existingAlarm;
  const { user } = UserAuth();

  // State for alarm data
  const [hour, setHour] = useState(
    existingAlarm?.hour || new Date().getHours()
  );
  const [minute, setMinute] = useState(
    existingAlarm?.minute || new Date().getMinutes()
  );
  const [label, setLabel] = useState(existingAlarm?.label || "");
  const [isActive, setIsActive] = useState(existingAlarm?.is_active !== false);
  const [repeatDays, setRepeatDays] = useState(existingAlarm?.repeat_days || []);
  const [taskType, setTaskType] = useState(existingAlarm?.task_type || "normal");
  const [taskDifficulty, setTaskDifficulty] = useState(
    existingAlarm?.task_difficulty || "medium"
  );
  const [soundId, setSoundId] = useState(existingAlarm?.sound_id || "default");
  const [soundName, setSoundName] = useState(
    existingAlarm?.sound_name || "Default Alarm"
  );

  // Handler for incrementing/decrementing time
  const adjustTime = (type, increment) => {
    if (type === 'hour') {
      let newHour = (hour + increment) % 24;
      if (newHour < 0) newHour = 23;
      setHour(newHour);
    } else {
      let newMinute = (minute + increment) % 60;
      if (newMinute < 0) newMinute = 59;
      setMinute(newMinute);
    }
  };

  // Format number to 2 digits
  const formatNumber = (number) => number.toString().padStart(2, '0');

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

  const handleSaveAndBack = async () => {
    if (!user?.id) {
      Alert.alert("ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อนบันทึกนาฬิกาปลุก");
      return;
    }

    // ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
    const networkState = await NetInfo.fetch();
    const isConnected = networkState.isConnected && networkState.isInternetReachable;

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
        is_active: isActive,
        repeat_days: repeatDays,
        task_type: taskType,
        task_difficulty: taskDifficulty,
        sound_id: soundId,
        sound_name: soundName,
        user_id: user.id,
        updated_at: new Date(),
      };

      let alarmId;

      if (isEditing) {
        // Update existing alarm
        const { error: updateError } = await supabase
          .from('alarms')
          .update(alarmData)
          .eq('id', existingAlarm.id);

        if (updateError) throw updateError;
        alarmId = existingAlarm.id;
      } else {
        // Create new alarm
        alarmData.created_at = new Date();
        const { data, error: insertError } = await supabase
          .from('alarms')
          .insert([alarmData])
          .select();

        if (insertError) throw insertError;
        alarmId = data[0].id;
      }

      // Set up notification if alarm is active
      if (isActive) {
        const fullAlarmData = { ...alarmData, id: alarmId };
        const notificationId = await scheduleAlarmNotification(fullAlarmData);

        if (notificationId) {
          await supabase
            .from('alarms')
            .update({ notification_id: notificationId })
            .eq('id', alarmId);
        }
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Alarm" }],
      });

    } catch (error) {
      console.error("Error saving alarm:", error);
      let errorMessage = "ไม่สามารถบันทึกนาฬิกาปลุกได้";

      if (error.message?.includes('offline') || error.message?.includes('network')) {
        errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง";
      }

      Alert.alert("ข้อผิดพลาด", errorMessage);
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButton}>ยกเลิก</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มการตั้งปลุก</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSaveAndBack}
        >
          <Text style={styles.saveButton}>บันทึก</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Time Display Section */}
        <View style={styles.timePickerContainer}>
          <View style={styles.timeSection}>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => adjustTime('hour', 1)}
            >
              <Icon name="chevron-up" size={24} color="#86868B" />
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatNumber(hour)}</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => adjustTime('hour', -1)}
            >
              <Icon name="chevron-down" size={24} color="#86868B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.colonText}>:</Text>

          <View style={styles.timeSection}>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => adjustTime('minute', 1)}
            >
              <Icon name="chevron-up" size={24} color="#86868B" />
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatNumber(minute)}</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => adjustTime('minute', -1)}
            >
              <Icon name="chevron-down" size={24} color="#86868B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Container */}
        <View style={styles.optionsContainer}>
          {/* Repeat Option */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => navigation.navigate("RepeatDaysScreen", {
              repeatDays,
              onSelect: (days) => setRepeatDays(days)
            })}
          >
            <Text style={styles.optionLabel}>ปลุกซ้ำ</Text>
            <View style={styles.optionValue}>
              <Text style={styles.optionValueText}>
                {repeatDays.length === 0 ? "ไม่ปลุกซ้ำ" :
                 repeatDays.length === 7 ? "ทุกวัน" :
                 dayNames.filter((_, i) => repeatDays.includes(i)).join(", ")}
              </Text>
              <Icon name="chevron-right" size={20} color="#86868B" />
            </View>
          </TouchableOpacity>

          {/* Label Option */}
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>ชื่อ</Text>
            <TextInput
              style={styles.textInput}
              value={label}
              onChangeText={setLabel}
              placeholder="การตั้งปลุก"
              placeholderTextColor="#86868B"
              maxLength={30}
            />
          </View>

          {/* Sound Option */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={selectSound}
          >
            <Text style={styles.optionLabel}>เสียง</Text>
            <View style={styles.optionValue}>
              <Text style={styles.optionValueText}>{soundName}</Text>
              <Icon name="chevron-right" size={20} color="#86868B" />
            </View>
          </TouchableOpacity>

          {/* Snooze Option */}
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>เลื่อนปลุก</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: "#3A3A3C", true: "#34C759" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#3A3A3C"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderBottomWidth: 0,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 17,
    color: '#FF9F0A',
    fontWeight: '400',
  },
  saveButton: {
    fontSize: 17,
    color: '#FF9F0A',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  timePickerContainer: {
    backgroundColor: "#1C1C1E",
    paddingVertical: 30,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSection: {
    alignItems: 'center',
    width: 80,
  },
  timeButton: {
    padding: 12,
    borderRadius: 20,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '400',
    marginVertical: 5,
  },
  colonText: {
    color: '#FFFFFF',
    fontSize: 40,
    marginHorizontal: 15,
    fontWeight: '400',
  },
  optionsContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#38383A",
    backgroundColor: "transparent",
  },
  optionLabel: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: '400',
  },
  optionValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionValueText: {
    fontSize: 17,
    color: "#86868B",
    marginRight: 8,
  },
  textInput: {
    fontSize: 17,
    color: "#86868B",
    textAlign: "right",
    paddingVertical: 0,
    minWidth: 120,
  },
});

// ใช้ React.memo เพื่อป้องกัน re-render ที่ไม่จำเป็น
export default React.memo(AddAlarmScreen);
