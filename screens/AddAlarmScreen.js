// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { addAlarm, updateAlarm, cancelAlarm, deleteAlarm } from '../utils/alarmStorage';
import { scheduleAlarm } from '../utils/alarmNotification';

// คำนวณความกว้างของหน้าจอ
const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

const AddAlarmScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const editingAlarm = route.params?.alarm;

  // State สำหรับเวลา
  const [hours, setHours] = useState(editingAlarm ? editingAlarm.hour : new Date().getHours());
  const [minutes, setMinutes] = useState(editingAlarm ? editingAlarm.minute : new Date().getMinutes());
  
  // State อื่นๆ
  const [repeatDays, setRepeatDays] = useState(editingAlarm?.repeatDays || []);
  const [isActive, setIsActive] = useState(editingAlarm?.isActive ?? true);
  const [label, setLabel] = useState(editingAlarm?.label || "การตั้งปลุก");
  const [soundId, setSoundId] = useState(editingAlarm?.soundId || "default-alarm.mp3");
  const [soundName, setSoundName] = useState(editingAlarm?.soundName || "Default Alarm");
  
  // State สำหรับ Modal
  const [pickerVisible, setPickerVisible] = useState(false);
  const [tempHours, setTempHours] = useState(hours);
  const [tempMinutes, setTempMinutes] = useState(minutes);
  
  // Refs สำหรับ ScrollView
  const hoursScrollRef = useRef(null);
  const minutesScrollRef = useRef(null);
  
  // สร้างอาร์เรย์สำหรับชั่วโมงและนาที
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);
  
  const dayNames = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']; // Short day names

  // ฟังก์ชันแสดง TimePicker ในสไตล์ iOS
  const openTimePicker = () => {
    setTempHours(hours);
    setTempMinutes(minutes);
    setPickerVisible(true);
    
    // หน่วงเวลาเล็กน้อยเพื่อให้แน่ใจว่า Modal แสดงผลเรียบร้อยแล้วก่อนเลื่อนไปยังตำแหน่งที่ถูกต้อง
    setTimeout(() => {
      if (hoursScrollRef.current) {
        hoursScrollRef.current.scrollTo({ 
          y: hours * ITEM_HEIGHT,
          animated: false 
        });
      }
      if (minutesScrollRef.current) {
        minutesScrollRef.current.scrollTo({ 
          y: minutes * ITEM_HEIGHT, 
          animated: false 
        });
      }
    }, 200);
  };
  
  // ฟังก์ชันเมื่อกดตกลงใน TimePicker
  const confirmTimePicker = () => {
    setHours(tempHours);
    setMinutes(tempMinutes);
    setPickerVisible(false);
  };
  
  // ฟังก์ชันเมื่อผู้ใช้เลื่อน ScrollView
  const handleHourScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const selectedIndex = Math.round(y / ITEM_HEIGHT);
    if (selectedIndex >= 0 && selectedIndex < hoursArray.length) {
      setTempHours(selectedIndex);
    }
  };
  
  const handleMinuteScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const selectedIndex = Math.round(y / ITEM_HEIGHT);
    if (selectedIndex >= 0 && selectedIndex < minutesArray.length) {
      setTempMinutes(selectedIndex);
    }
  };

  const handleSave = async () => {
    try {
      const alarmData = {
        hour: hours,
        minute: minutes,
        repeatDays,
        isActive,
        userId: user?.id,
        label: label || "การตั้งปลุก",
        soundId,
        soundName,
        snooze: false,
        createdAt: editingAlarm?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
      if (editingAlarm?.notificationId) {
        await cancelAlarm(editingAlarm.notificationId);
      }
      
      let savedAlarm;
      if (editingAlarm) {
        // อัพเดตข้อมูลการปลุก
        await updateAlarm(editingAlarm.id, alarmData);
        savedAlarm = { ...editingAlarm, ...alarmData, id: editingAlarm.id };
      } else {
        // เพิ่มการปลุกใหม่
        savedAlarm = await addAlarm(alarmData);
      }

      if (!savedAlarm || !savedAlarm.id) {
        throw new Error('ไม่สามารถบันทึกข้อมูลการปลุกได้');
      }

      // หากเปิดใช้งานการปลุก จะตั้งการแจ้งเตือน
      if (isActive) {
        try {
          const notificationId = await scheduleAlarm(savedAlarm);
          if (notificationId) {
            // อัพเดต notificationId
            await updateAlarm(savedAlarm.id, { 
              ...savedAlarm, 
              notificationId 
            });
          }
        } catch (notificationError) {
          console.error('Error scheduling notification:', notificationError);
          // แม้การตั้งการแจ้งเตือนจะล้มเหลว แต่ยังคงบันทึกข้อมูลการปลุก
          Alert.alert('ข้อควรระวัง', 'บันทึกการปลุกแล้ว แต่อาจมีปัญหาในการตั้งการแจ้งเตือน');
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งปลุกได้');
    }
  };

  const handleDelete = async () => {
    if (!editingAlarm) return;

    Alert.alert(
      'ลบการปลุก',
      'คุณแน่ใจหรือไม่ที่จะลบการปลุกนี้?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              if (editingAlarm.notificationId) {
                await cancelAlarm(editingAlarm.notificationId);
              }
              await deleteAlarm(editingAlarm.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting alarm:', error);
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการปลุกได้');
            }
          }
        }
      ]
    );
  };

  // Update header buttons dynamically
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>ยกเลิก</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>บันทึก</Text>
        </TouchableOpacity>
      ),
      title: editingAlarm ? 'แก้ไขการปลุก' : 'เพิ่มการตั้งปลุก',
      headerTitleStyle: styles.headerTitle,
      headerStyle: {
        backgroundColor: '#000000',
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#FF9500',
    });
  }, [navigation, hours, minutes, repeatDays, isActive, label, soundName]);

  const getRepeatDaysText = () => {
    if (repeatDays.length === 0) return 'ไม่ปลุกซ้ำ';
    if (repeatDays.length === 7) return 'ทุกวัน';
    if (repeatDays.length === 5 && !repeatDays.includes(5) && !repeatDays.includes(6))
      return 'วันธรรมดา';
    if (repeatDays.length === 2 && repeatDays.includes(5) && repeatDays.includes(6))
      return 'สุดสัปดาห์';
    return repeatDays
      .sort()
      .map(day => dayNames[day])
      .join(' ');
  };

  const handleSoundSelected = (selectedSoundId, selectedSoundName) => {
    setSoundId(selectedSoundId);
    setSoundName(selectedSoundName);
  };

  // ฟังก์ชันฟอร์แมตตัวเลขให้มี 2 หลัก
  const formatNumber = (number) => {
    return number.toString().padStart(2, "0");
  };

  // รายการแสดงเวลา
  const renderTimeItem = (value, selected) => {
    return (
      <View
        style={[
          styles.timeItem,
          selected && styles.selectedTimeItem
        ]}
        key={value}
      >
        <Text style={[styles.timeItemText, selected && styles.selectedTimeItemText]}>
          {formatNumber(value)}
        </Text>
      </View>
    );
  };

  // เรียงรายการเพื่อให้มี paddings ที่เพียงพอสำหรับการเลื่อน
  const renderTimeWheel = (items, selectedValue, renderItem) => {
    // สร้างรายการพร้อม padding ด้านบนและล่าง
    return [
      ...Array(2).fill().map((_, i) => (
        <View key={`top-padding-${i}`} style={styles.timeWheelPadding} />
      )),
      ...items.map((item) => renderItem(item, item === selectedValue)),
      ...Array(2).fill().map((_, i) => (
        <View key={`bottom-padding-${i}`} style={styles.timeWheelPadding} />
      ))
    ];
  };

  // ตัวเลขชั่วโมงและนาทีเพื่อแสดงในหน้าจอ
  const timeString = `${formatNumber(hours)}:${formatNumber(minutes)}`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* แสดงเวลาแบบ iOS Style */}
      <TouchableOpacity 
        style={styles.iosTimePickerDisplay} 
        onPress={openTimePicker}
        activeOpacity={0.7}
      >
        <Text style={styles.iosTimeText}>{timeString}</Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color="#FF9500" />
      </TouchableOpacity>

      <View style={styles.optionsContainer}>
        {/* Repeat Option */}
        <Pressable
          style={styles.optionRow}
          onPress={() => navigation.navigate('RepeatDays', {
            repeatDays,
            onSave: setRepeatDays
          })}
        >
          <Text style={styles.optionLabel}>ปลุกซ้ำ</Text>
          <View style={styles.optionValueContainer}>
            <Text style={styles.optionValueText} numberOfLines={1}>{getRepeatDaysText()}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#666" />
          </View>
        </Pressable>

        {/* Label Option */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>ชื่อ</Text>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={setLabel}
            placeholder="การตั้งปลุก"
            placeholderTextColor="#666"
            maxLength={30}
          />
        </View>

        {/* Sound Option */}
        <Pressable
          style={styles.optionRow}
          onPress={() => navigation.navigate('SoundLibrary', { 
              currentSoundId: soundId, 
              onSoundSelected: handleSoundSelected 
            })}
        >
          <Text style={styles.optionLabel}>เสียง</Text>
          <View style={styles.optionValueContainer}>
            <Text style={styles.optionValueText} numberOfLines={1}>{soundName}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#666" />
          </View>
        </Pressable>

        {/* Active Switch */}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>เปิดใช้งาน</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#3e3e3e', true: '#34C759' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#3e3e3e"
            style={styles.switch}
          />
        </View>
      </View>

      {editingAlarm && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>ลบการปลุก</Text>
        </TouchableOpacity>
      )}

      {/* Modal สำหรับ TimePicker แบบ iOS */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity 
                onPress={() => setPickerVisible(false)}
                style={styles.pickerButton}
              >
                <Text style={[styles.pickerButtonText, { color: '#007AFF' }]}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={confirmTimePicker}
                style={styles.pickerButton}
              >
                <Text style={[styles.pickerButtonText, { color: '#007AFF', fontWeight: '600' }]}>ตกลง</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerBody}>
              {/* ฉากหลังตัวเลขที่เลือก - ปรับปรุงตำแหน่งให้ตรงกับตัวเลข */}
              <View style={styles.pickerSelectionBackground} />
              
              {/* Time Wheels */}
              <View style={styles.timeWheelsContainer}>
                {/* Hours */}
                <ScrollView
                  ref={hoursScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={handleHourScroll}
                  onScrollEndDrag={handleHourScroll}
                  contentContainerStyle={styles.timeWheelContent}
                  decelerationRate="fast"
                >
                  {renderTimeWheel(hoursArray, tempHours, renderTimeItem)}
                </ScrollView>

                <Text style={styles.timeSeparator}>:</Text>

                {/* Minutes */}
                <ScrollView
                  ref={minutesScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={handleMinuteScroll}
                  onScrollEndDrag={handleMinuteScroll}
                  contentContainerStyle={styles.timeWheelContent}
                  decelerationRate="fast"
                >
                  {renderTimeWheel(minutesArray, tempMinutes, renderTimeItem)}
                </ScrollView>
              </View>
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
    backgroundColor: '#000000',
    paddingTop: 20,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#FF9500',
    fontSize: 17,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  iosTimePickerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
    flexDirection: 'row',
  },
  iosTimeText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '300',
    letterSpacing: 2,
    marginRight: 5,
  },
  optionsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
    minHeight: 50,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  optionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  optionValueText: {
    color: '#8E8E93',
    fontSize: 17,
    marginRight: 5,
    textAlign: 'right',
    maxWidth: '80%',
  },
  labelInput: {
    color: '#8E8E93',
    fontSize: 17,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
  },
  deleteButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
  // Modal Styles - ปรับปรุงสีและขนาด
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  pickerButton: {
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 17,
  },
  pickerBody: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
  },
  pickerSelectionBackground: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    zIndex: 0,
  },
  timeWheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  timeWheelContent: {
    paddingHorizontal: 20,
  },
  timeWheelPadding: {
    height: ITEM_HEIGHT,
  },
  timeItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  selectedTimeItem: {
    // สไตล์พิเศษสำหรับตัวเลขที่เลือก
  },
  timeItemText: {
    color: '#8E8E93',
    fontSize: 22,
  },
  selectedTimeItemText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  timeSeparator: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 5,
  },
});

export default AddAlarmScreen;
