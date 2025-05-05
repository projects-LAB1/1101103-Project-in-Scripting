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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { addAlarm, updateAlarm, cancelAlarm, deleteAlarm } from '../utils/alarmStorage';
import { scheduleAlarm, triggerTestAlarm } from '../utils/alarmNotification';
import { BlurView } from 'expo-blur';

const AddAlarmScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const editingAlarm = route.params?.alarm;
  
  const [time, setTime] = useState(editingAlarm ? 
    new Date(2000, 1, 1, editingAlarm.hour, editingAlarm.minute) : 
    new Date()
  );
  const [repeatDays, setRepeatDays] = useState(editingAlarm?.repeatDays || []);
  const [isActive, setIsActive] = useState(editingAlarm?.isActive ?? true);
  const [label, setLabel] = useState(editingAlarm?.label || "");
  const [soundId, setSoundId] = useState(editingAlarm?.soundId || "default");
  const [soundName, setSoundName] = useState(editingAlarm?.soundName || "Default alarm sound");
  const [snooze, setSnooze] = useState(editingAlarm?.snooze ?? true);
  const [snoozeTime, setSnoozeTime] = useState(editingAlarm?.snoozeTime || 5);
  const [snoozeCount, setSnoozeCount] = useState(editingAlarm?.snoozeCount || 3);
  const [vibrate, setVibrate] = useState(editingAlarm?.vibrate ?? true);
  const [vibrateType, setVibrateType] = useState(editingAlarm?.vibrateType || "Default");
  const [skipHolidays, setSkipHolidays] = useState(editingAlarm?.skipHolidays ?? false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayFullNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSave = async () => {
    try {
      // Validate input before saving
      if (!time) {
        Alert.alert('ข้อผิดพลาด', 'กรุณาตั้งเวลาปลุก');
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
        createdAt: new Date().toISOString(),
      };

      console.log('บันทึกการตั้งปลุก:', alarmData);

      let savedAlarm = null;
      
      // กรณีแก้ไขการตั้งปลุก
      if (editingAlarm) {
        console.log(`กำลังอัพเดทการตั้งปลุกที่มีอยู่แล้ว ID: ${editingAlarm.id}`);
        
        // ยกเลิกการตั้งปลุกเดิมก่อน (ถ้ามี)
        if (editingAlarm.notificationId) {
          console.log(`ยกเลิกการแจ้งเตือนเดิม ID: ${editingAlarm.notificationId}`);
          await cancelAlarm(editingAlarm.notificationId);
        }
        
        // อัพเดทข้อมูลการตั้งปลุก
        const updateSuccess = await updateAlarm(editingAlarm.id, alarmData);
        if (!updateSuccess) {
          throw new Error('ไม่สามารถอัพเดทการตั้งปลุกได้');
        }
        
        savedAlarm = {
          ...alarmData,
          id: editingAlarm.id
        };
        
        console.log(`อัพเดทการตั้งปลุกสำเร็จ ID: ${editingAlarm.id}`);
      }
      // กรณีเพิ่มการตั้งปลุกใหม่
      else {
        console.log('กำลังเพิ่มการตั้งปลุกใหม่');
        savedAlarm = await addAlarm(alarmData);
        if (!savedAlarm) {
          throw new Error('ไม่สามารถเพิ่มการตั้งปลุกได้');
        }
        
        console.log(`เพิ่มการตั้งปลุกใหม่สำเร็จ ID: ${savedAlarm.id}`);
      }

      // ถ้าการตั้งปลุกเปิดใช้งาน ให้ตั้งเวลาการแจ้งเตือน
      if (isActive && savedAlarm) {
        try {
          console.log('กำลังตั้งเวลาการแจ้งเตือน...');
          const notificationId = await scheduleAlarm(savedAlarm);
          
          if (notificationId) {
            console.log(`ตั้งเวลาการแจ้งเตือนสำเร็จ ID: ${notificationId}`);
            
            // อัพเดทการตั้งปลุกด้วย ID การแจ้งเตือน
            await updateAlarm(savedAlarm.id, {
              notificationId,
              updatedAt: new Date().toISOString()
            });
            
            console.log(`บันทึกการตั้งปลุกพร้อม notificationId สำเร็จ`);
          } else {
            console.warn('ไม่ได้รับ notificationId จากการตั้งเวลาการแจ้งเตือน');
            Alert.alert(
              'คำเตือน',
              'การตั้งปลุกถูกบันทึกแล้ว แต่การแจ้งเตือนอาจไม่ทำงาน กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนของอุปกรณ์',
              [{ text: 'ตกลง' }]
            );
          }
        } catch (notificationError) {
          console.error('Error scheduling notification:', notificationError);
          Alert.alert(
            'คำเตือน',
            'การตั้งปลุกถูกบันทึกแล้ว แต่การแจ้งเตือนอาจไม่ทำงาน กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนของอุปกรณ์',
            [{ text: 'ตกลง' }]
          );
        }
      }

      // กลับไปยังหน้าก่อนหน้า
      navigation.goBack();
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        'ไม่สามารถบันทึกการตั้งปลุกได้ กรุณาลองใหม่อีกครั้ง',
        [{ text: 'ตกลง' }]
      );
    }
  };

  const toggleDay = (dayIndex) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter(d => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleTestAlarm = () => {
    try {
      const testAlarmData = {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeatDays,
        isActive: true,
        userId: user?.id,
        label: label || "การทดสอบ",
        soundId,
        soundName,
        snooze,
      };
      
      triggerTestAlarm(testAlarmData)
        .then(alarmData => {
          // นำทางไปยังหน้า AlarmRingingScreen โดยตรง
          navigation.navigate("AlarmRinging", { alarm: alarmData });
        });
    } catch (error) {
      console.error('Error testing alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถทดสอบการปลุกได้');
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>{editingAlarm ? 'Edit alarm' : 'Add alarm'}</Text>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity onPress={handleTestAlarm} style={styles.headerButton}>
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
        backgroundColor: '#000000',
        shadowColor: 'transparent',
        elevation: 0,
      },
      headerTintColor: '#FFFFFF',
    });
  }, [navigation, time, repeatDays, isActive]);

  const getRepeatText = () => {
    if (repeatDays.length === 0) return 'Never';
    if (repeatDays.length === 7) return 'Every day';
    if (repeatDays.length === 5 && !repeatDays.includes(0) && !repeatDays.includes(6)) 
      return 'Weekdays';
    if (repeatDays.length === 2 && repeatDays.includes(0) && repeatDays.includes(6))
      return 'Weekends';
    
    return repeatDays
      .sort()
      .map(day => dayFullNames[day])
      .join(', ');
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
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
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
            {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
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
                  repeatDays.includes(index) ? styles.dayButtonActive : null
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text style={[
                  styles.dayText,
                  repeatDays.includes(index) ? styles.dayTextActive : null
                ]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Do Not Ring on Holidays</Text>
              <Text style={styles.optionSubText}>Alarm won't ring on holidays.</Text>
            </View>
            <Switch
              value={skipHolidays}
              onValueChange={setSkipHolidays}
              trackColor={{ false: '#3e3e3e', true: '#3e3e3e' }}
              thumbColor={skipHolidays ? '#FFFFFF' : '#FFFFFF'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
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
              <Text style={styles.optionText}>Ringtone</Text>
              <Text style={styles.optionSubText}>{soundName}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Vibrate</Text>
              <Text style={styles.optionSubText}>{vibrateType}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Snooze</Text>
              <Text style={styles.optionSubText}>{snoozeTime} minutes, {snoozeCount} times</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {editingAlarm && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Alarm',
                'Are you sure you want to delete this alarm?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
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
                        Alert.alert('Error', 'Could not delete the alarm');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
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
                {tempTime.getHours().toString().padStart(2, '0')}:{tempTime.getMinutes().toString().padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.horizontalPickerContainer}>
              <Text style={styles.pickerLabel}>Hours</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalPickerContent}
                ref={hoursScrollRef => {
                  // Scroll to current hour position when modal opens
                  if (hoursScrollRef && showTimePicker) {
                    setTimeout(() => {
                      hoursScrollRef.scrollTo({
                        x: tempTime.getHours() * 70, 
                        animated: false
                      });
                    }, 100);
                  }
                }}
              >
                <View style={styles.timePickerCenterMarker} pointerEvents="none" />
                {[...Array(24)].map((_, i) => (
                  <TouchableOpacity
                    key={`hour-${i}`}
                    style={[
                      styles.horizontalTimeItem,
                      tempTime.getHours() === i && styles.horizontalTimeItemSelected
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
                        tempTime.getHours() === i && styles.horizontalTimeTextSelected
                      ]}
                    >
                      {i.toString().padStart(2, '0')}
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
                ref={minutesScrollRef => {
                  // Scroll to current minute position when modal opens
                  if (minutesScrollRef && showTimePicker) {
                    setTimeout(() => {
                      minutesScrollRef.scrollTo({
                        x: tempTime.getMinutes() * 70, 
                        animated: false
                      });
                    }, 100);
                  }
                }}
              >
                <View style={styles.timePickerCenterMarker} pointerEvents="none" />
                {[...Array(60)].map((_, i) => (
                  <TouchableOpacity
                    key={`minute-${i}`}
                    style={[
                      styles.horizontalTimeItem,
                      tempTime.getMinutes() === i && styles.horizontalTimeItemSelected
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
                        tempTime.getMinutes() === i && styles.horizontalTimeTextSelected
                      ]}
                    >
                      {i.toString().padStart(2, '0')}
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
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#0A84FF',
    fontSize: 17,
  },
  headerButtonTextDone: {
    color: '#0A84FF',
    fontSize: 17,
    fontWeight: '600',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeTimeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 35,
    paddingVertical: 15,
  },
  largeTimeText: {
    fontSize: 60,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  timeRingIn: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    marginVertical: 25,
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  sectionHeaderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  sectionValueText: {
    color: '#0A84FF',
    fontSize: 17,
    marginTop: 4,
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#0A84FF',
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  optionSubText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  labelInput: {
    color: '#FFFFFF',
    fontSize: 17,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Horizontal Time Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    width: '90%',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  timeDisplayContainer: {
    marginBottom: 30,
  },
  timeDisplayText: {
    fontSize: 50,
    color: '#FFFFFF',
    fontWeight: '200',
  },
  horizontalPickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 10,
    fontWeight: '500',
    marginLeft: 10,
  },
  horizontalPickerContent: {
    paddingHorizontal: 100, // Space for items outside view
    height: 60,
    alignItems: 'center',
  },
  timePickerCenterMarker: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: -1,
  },
  horizontalTimeItem: {
    width: 70,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalTimeItemSelected: {
    // no background change needed due to center marker
  },
  horizontalTimeText: {
    fontSize: 24,
    color: '#999999',
  },
  horizontalTimeTextSelected: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '500',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  timePickerCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
  },
  timePickerConfirmButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0A84FF',
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddAlarmScreen;
