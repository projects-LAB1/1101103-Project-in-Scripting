// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState, useRef, useMemo } from "react";
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
  FlatList,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../supabase.config";
import { UserAuth } from "../models/UserAuth";
// ใช้ Icon สำหรับปุ่มเพิ่ม/ลดเวลา
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { scheduleAlarmNotification } from "../models/NotificationManager";
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 59;
const VISIBLE_ITEMS = 6;
const PICKER_WIDTH = 90;
const PICKER_GAP = 15;
const REPEAT_COUNT = 10;
const VISIBLE_PADDING = 3;

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
  const [is24Hour, setIs24Hour] = useState(true);
  const [period, setPeriod] = useState(hour >= 12 ? 'PM' : 'AM');
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

  // Quick time presets
  const timePresets = [
    { label: 'เช้า', hour: 6, minute: 30 },
    { label: 'ทำงาน', hour: 8, minute: 0 },
    { label: 'นอน', hour: 22, minute: 0 },
  ];

  // Refs for FlatLists
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);

  // Calculate middle position more accurately
  const getMiddlePosition = (value, totalItems) => {
    return Math.floor(VISIBLE_ITEMS / 2) - VISIBLE_PADDING + value;
  };

  // More accurate scroll handling with explicit position
  const scrollToTime = (type, value, animated = true) => {
    try {
      const listRef = type === 'hour' ? hourListRef : minuteListRef;
      const offset = (VISIBLE_PADDING + value) * ITEM_HEIGHT;
      
      listRef.current?.scrollToOffset({
        offset,
        animated,
      });
    } catch (error) {
      console.log('Scroll error:', error);
    }
  };

  // Handle direct time selection (when a number is pressed)
  const handleTimePress = (type, value) => {
    // Directly set the value and scroll to it
    if (type === 'hour') {
      setHour(value);
    } else {
      setMinute(value);
    }
    scrollToTime(type, value, true);
  };

  // Handle scrolling with more accurate calculation
  const handleScroll = (event, type) => {
    const y = event.nativeEvent.contentOffset.y;
    const rawIndex = y / ITEM_HEIGHT;
    const index = Math.round(rawIndex);
    const adjustedIndex = Math.max(0, index - VISIBLE_PADDING);
    
    const totalItems = type === 'hour' ? 24 : 60;
    const value = Math.min(adjustedIndex, totalItems - 1);
    
    if (type === 'hour' && value !== hour) {
      setHour(value);
    } else if (type === 'minute' && value !== minute) {
      setMinute(value);
    }
  };

  // Handle momentum scrolling end with corrected positioning
  const handleMomentumScrollEnd = (event, type) => {
    const y = event.nativeEvent.contentOffset.y;
    const rawIndex = y / ITEM_HEIGHT;
    const index = Math.round(rawIndex);
    const adjustedIndex = Math.max(0, index - VISIBLE_PADDING);
    
    const totalItems = type === 'hour' ? 24 : 60;
    const value = Math.min(adjustedIndex, totalItems - 1);
    
    // Update time and ensure correct scroll position
    if (type === 'hour') {
      setHour(value);
    } else {
      setMinute(value);
    }
    
    // Ensure alignment with the correct time value
    scrollToTime(type, value, true);
  };

  // Create proper data arrays with padding
  const getTimeData = (totalItems) => {
    const data = Array.from({ length: totalItems }, (_, i) => i);
    const paddingBefore = Array(VISIBLE_PADDING).fill(-1);
    const paddingAfter = Array(VISIBLE_PADDING).fill(-1);
    return [...paddingBefore, ...data, ...paddingAfter];
  };

  // Initialize with properly padded arrays
  const hourData = getTimeData(24);
  const minuteData = getTimeData(60);

  // Convert from 24h to 12h format for display
  const get12HourFormat = (hour24) => {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
  };

  // Get the display hour based on format
  const getDisplayHour = (hr) => {
    return is24Hour ? hr : get12HourFormat(hr);
  };

  // Toggle between 12h and 24h format
  const toggleTimeFormat = () => {
    setIs24Hour(!is24Hour);
  };

  // Handle AM/PM toggle
  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    
    if (!is24Hour) {
      // Adjust the hour value when changing between AM/PM
      if (newPeriod === 'AM' && hour >= 12) {
        setHour(hour - 12);
      } else if (newPeriod === 'PM' && hour < 12) {
        setHour(hour + 12);
      }
    }
  };

  // Handle time preset selection
  const selectTimePreset = (preset) => {
    setHour(preset.hour);
    setMinute(preset.minute);
    setPeriod(preset.hour >= 12 ? 'PM' : 'AM');
    
    scrollToTime('hour', preset.hour, true);
    scrollToTime('minute', preset.minute, true);
  };

  // Adjust the rendering of time items to ensure proper alignment
  const renderTimeItem = ({ item, index, type }) => {
    if (item === -1) {
      return <View style={styles.timeItem} />;
    }
    
    const value = item;
    const displayValue = type === 'hour' ? getDisplayHour(value) : value;
    const selected = value === (type === 'hour' ? hour : minute);
    
    // More subtle opacity transition for a smoother look
    const distanceFromSelected = Math.abs(value - (type === 'hour' ? hour : minute));
    let opacity = 1;
    if (distanceFromSelected > 0) {
      opacity = Math.max(0.3, 1 - (distanceFromSelected * 0.15));
    }
    
    return (
      <TouchableOpacity 
        style={styles.timeItem}
        onPress={() => handleTimePress(type, value)}
      >
        <Text style={[
          styles.timeText,
          { opacity },
          selected && styles.selectedTimeText
        ]}>
          {displayValue.toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    );
  };

  // Initialize scroll to current time with correct padding
  React.useEffect(() => {
    const timer = setTimeout(() => {
      scrollToTime('hour', hour, false);
      scrollToTime('minute', minute, false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Get item layout with precise measurement
  const getItemLayout = (_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

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

  // Calculate where the colon should be positioned
  const colonPosition = useMemo(() => {
    return {
      top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)
    };
  }, []);

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
          <View style={styles.timePickerBackground}>
            <View style={styles.timePickerWrapper}>
              <View style={styles.pickerSection}>
                <View style={styles.pickerLabel}>
                  <Text style={styles.labelText}>ชั่วโมง</Text>
                </View>
                <FlatList
                  ref={hourListRef}
                  data={hourData}
                  renderItem={({ item, index }) => renderTimeItem({ item, index, type: 'hour' })}
                  keyExtractor={(_, index) => `hour-${index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onScroll={(e) => handleScroll(e, 'hour')}
                  onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e, 'hour')}
                  getItemLayout={getItemLayout}
                  style={styles.pickerColumn}
                  contentContainerStyle={styles.pickerContent}
                  scrollEventThrottle={16}
                  removeClippedSubviews={true}
                  initialNumToRender={VISIBLE_ITEMS * 2}
                  maxToRenderPerBatch={VISIBLE_ITEMS * 2}
                />
              </View>

              <View style={styles.pickerSection}>
                <View style={styles.pickerLabel}>
                  <Text style={styles.labelText}>นาที</Text>
                </View>
                <FlatList
                  ref={minuteListRef}
                  data={minuteData}
                  renderItem={({ item, index }) => renderTimeItem({ item, index, type: 'minute' })}
                  keyExtractor={(_, index) => `minute-${index}`}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onScroll={(e) => handleScroll(e, 'minute')}
                  onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e, 'minute')}
                  getItemLayout={getItemLayout}
                  style={styles.pickerColumn}
                  contentContainerStyle={styles.pickerContent}
                  scrollEventThrottle={16}
                  removeClippedSubviews={true}
                  initialNumToRender={VISIBLE_ITEMS * 2}
                  maxToRenderPerBatch={VISIBLE_ITEMS * 2}
                />
              </View>

              {!is24Hour && (
                <View style={styles.periodSelector}>
                  <TouchableOpacity
                    style={[styles.periodButton, period === 'AM' && styles.periodButtonActive]}
                    onPress={() => setPeriod('AM')}
                  >
                    <Text style={[styles.periodText, period === 'AM' && styles.periodTextActive]}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, period === 'PM' && styles.periodButtonActive]}
                    onPress={() => setPeriod('PM')}
                  >
                    <Text style={[styles.periodText, period === 'PM' && styles.periodTextActive]}>PM</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.selectionIndicator} pointerEvents="none" />
            
            {/* Time format toggle */}
            <TouchableOpacity 
              style={styles.formatToggle}
              onPress={toggleTimeFormat}
            >
              <Text style={styles.formatToggleText}>
                {is24Hour ? '24 ชั่วโมง' : '12 ชั่วโมง'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick time presets */}
          <View style={styles.presetContainer}>
            {timePresets.map((preset, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.presetButton}
                onPress={() => selectTimePreset(preset)}
              >
                <Text style={styles.presetButtonText}>{preset.label}</Text>
                <Text style={styles.presetTimeText}>
                  {`${getDisplayHour(preset.hour).toString().padStart(2, '0')}:${preset.minute.toString().padStart(2, '0')} ${!is24Hour ? (preset.hour >= 12 ? 'PM' : 'AM') : ''}`}
                </Text>
              </TouchableOpacity>
            ))}
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

          {/* Snooze Option - Changed to Alarm Active Toggle */}
          <View style={[styles.optionRow, styles.lastOption]}>
            <Text style={styles.optionLabel}>เปิดใช้งาน</Text>
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
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerBackground: {
    backgroundColor: '#222228',
    borderRadius: 16,
    padding: 0,
    paddingTop: 15,
    paddingBottom: 25,
    width: PICKER_WIDTH * 2 + PICKER_GAP + 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    position: 'relative',
  },
  timePickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  pickerSection: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: PICKER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: PICKER_GAP / 2,
  },
  pickerLabel: {
    position: 'absolute',
    top: -30,
    width: '100%',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '400',
  },
  pickerColumn: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: PICKER_WIDTH,
  },
  pickerContent: {
    paddingVertical: ITEM_HEIGHT * VISIBLE_PADDING,
  },
  timeItem: {
    height: ITEM_HEIGHT,
    width: PICKER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 0,
  },
  timeText: {
    fontSize: 30,
    color: '#999999',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'sans-serif',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    height: ITEM_HEIGHT,
    width: '100%',
  },
  selectedTimeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 32,
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    width: '94%',
    height: ITEM_HEIGHT,
    backgroundColor: 'transparent',
    transform: [{ translateY: -ITEM_HEIGHT / 2 }],
    borderRadius: 8,
    opacity: 0.4,
    zIndex: 1,
    borderWidth: 0,
  },
  periodSelector: {
    position: 'absolute',
    right: -70,
    height: 100,
    width: 50,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 10,
  },
  periodButton: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: '#3A3A3E',
  },
  periodText: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  formatToggle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  formatToggleText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    width: '92%',
    maxWidth: 320,
  },
  presetButton: {
    backgroundColor: '#2C2C34',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 95,
    height: 52, // Fixed height for consistency
  },
  presetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  presetTimeText: {
    color: '#999999',
    fontSize: 12,
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

