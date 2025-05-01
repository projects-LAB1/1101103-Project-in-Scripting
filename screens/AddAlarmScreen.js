// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState, useRef } from "react";
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
  Animated,
  PanResponder,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../supabase.config";
import { UserAuth } from "../models/UserAuth";
// ใช้ Icon สำหรับปุ่มเพิ่ม/ลดเวลา
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { scheduleAlarmNotification } from "../models/NotificationManager";
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

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

  // Animation values for time wheel effect
  const hourScrollY = useRef(new Animated.Value(0)).current;
  const minuteScrollY = useRef(new Animated.Value(0)).current;

  // Create PanResponder for hour wheel
  const hourPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        hourScrollY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const direction = gestureState.dy > 0 ? -1 : 1;
        // Only adjust time if the gesture is significant enough
        if (Math.abs(gestureState.dy) > 10) {
          adjustTime('hour', direction);
          Animated.spring(hourScrollY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10
          }).start();
        } else {
          Animated.spring(hourScrollY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;

  // Create PanResponder for minute wheel
  const minutePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        minuteScrollY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const direction = gestureState.dy > 0 ? -1 : 1;
        // Only adjust time if the gesture is significant enough
        if (Math.abs(gestureState.dy) > 10) {
          adjustTime('minute', direction);
          Animated.spring(minuteScrollY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10
          }).start();
        } else {
          Animated.spring(minuteScrollY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;

  // Handler for incrementing/decrementing time
  const adjustTime = (type, increment) => {
    if (type === 'hour') {
      let newHour = (hour + increment) % 24;
      if (newHour < 0) newHour = 23;
      
      // Add haptic feedback if available
      if (Platform.OS === 'ios' && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'haptic', style: 'selection' }));
      }
      
      setHour(newHour);
    } else {
      let newMinute = (minute + increment) % 60;
      if (newMinute < 0) newMinute = 59;
      
      // Add haptic feedback if available
      if (Platform.OS === 'ios' && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'haptic', style: 'selection' }));
      }
      
      setMinute(newMinute);
    }
  };

  // Format number to 2 digits
  const formatNumber = (number) => number.toString().padStart(2, '0');

  // Generate surrounding hours for wheel effect
  const generateHourNumbers = () => {
    const prevHour = (hour - 1 + 24) % 24;
    const nextHour = (hour + 1) % 24;
    return [prevHour, hour, nextHour];
  };

  // Generate surrounding minutes for wheel effect
  const generateMinuteNumbers = () => {
    const prevMinute = (minute - 1 + 60) % 60;
    const nextMinute = (minute + 1) % 60;
    return [prevMinute, minute, nextMinute];
  };

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
        <View style={styles.timePickerWrapper}>
          <View style={styles.timePickerContainer}>
            {/* Hour Selector */}
            <View style={styles.wheelContainer}>
              <TouchableOpacity 
                style={styles.timeArrowButton}
                onPress={() => adjustTime('hour', 1)}
              >
                <Icon name="chevron-up" size={24} color="#86868B" />
              </TouchableOpacity>
              
              <View style={styles.timeWheelContainer} {...hourPanResponder.panHandlers}>
                <View style={styles.timeWheelGradient} />
                <View style={styles.timeNumberContainer}>
                  {generateHourNumbers().map((num, index) => (
                    <Animated.Text
                      key={index}
                      style={[
                        styles.timeNumber,
                        index === 1 && styles.currentTimeNumber,
                        index === 1 ? null : styles.dimmedTimeNumber,
                        {
                          transform: [
                            {
                              translateY: hourScrollY.interpolate({
                                inputRange: [-100, 100],
                                outputRange: [20, -20],
                                extrapolate: 'clamp'
                              })
                            }
                          ]
                        }
                      ]}
                    >
                      {formatNumber(num)}
                    </Animated.Text>
                  ))}
                </View>
                <View style={styles.timeWheelGradient} />
              </View>
              
              <TouchableOpacity 
                style={styles.timeArrowButton}
                onPress={() => adjustTime('hour', -1)}
              >
                <Icon name="chevron-down" size={24} color="#86868B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.colonText}>:</Text>

            {/* Minute Selector */}
            <View style={styles.wheelContainer}>
              <TouchableOpacity 
                style={styles.timeArrowButton}
                onPress={() => adjustTime('minute', 1)}
              >
                <Icon name="chevron-up" size={24} color="#86868B" />
              </TouchableOpacity>
              
              <View style={styles.timeWheelContainer} {...minutePanResponder.panHandlers}>
                <View style={styles.timeWheelGradient} />
                <View style={styles.timeNumberContainer}>
                  {generateMinuteNumbers().map((num, index) => (
                    <Animated.Text
                      key={index}
                      style={[
                        styles.timeNumber,
                        index === 1 && styles.currentTimeNumber,
                        index === 1 ? null : styles.dimmedTimeNumber,
                        {
                          transform: [
                            {
                              translateY: minuteScrollY.interpolate({
                                inputRange: [-100, 100],
                                outputRange: [20, -20],
                                extrapolate: 'clamp'
                              })
                            }
                          ]
                        }
                      ]}
                    >
                      {formatNumber(num)}
                    </Animated.Text>
                  ))}
                </View>
                <View style={styles.timeWheelGradient} />
              </View>
              
              <TouchableOpacity 
                style={styles.timeArrowButton}
                onPress={() => adjustTime('minute', -1)}
              >
                <Icon name="chevron-down" size={24} color="#86868B" />
              </TouchableOpacity>
            </View>
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
          <View style={[styles.optionRow, styles.lastOption]}>
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
  timePickerWrapper: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  wheelContainer: {
    alignItems: 'center',
    width: 100,
  },
  timeArrowButton: {
    padding: 8,
    borderRadius: 20,
    marginVertical: 8,
  },
  timeWheelContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  timeWheelGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
    zIndex: 1,
  },
  timeNumberContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 140,
  },
  timeNumber: {
    fontSize: 50,
    fontWeight: '400',
    color: '#FFFFFF',
    marginVertical: 4,
    textAlign: 'center',
  },
  currentTimeNumber: {
    fontSize: 64,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dimmedTimeNumber: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  colonText: {
    color: '#FFFFFF',
    fontSize: 50,
    fontWeight: '300',
    marginHorizontal: 10,
  },
  optionsContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#38383A",
    backgroundColor: "transparent",
  },
  lastOption: {
    borderBottomWidth: 0,
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
