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
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [label, setLabel] = useState(editingAlarm?.label || "");
  const [taskType, setTaskType] = useState(editingAlarm?.taskType || "normal");
  const [taskDifficulty, setTaskDifficulty] = useState(
    editingAlarm?.taskDifficulty || "medium"
  );
  const [soundId, setSoundId] = useState(editingAlarm?.soundId || "default");
  const [soundName, setSoundName] = useState(editingAlarm?.soundName || "เสียงเริ่มต้น");
  const [snooze, setSnooze] = useState(editingAlarm?.snooze ?? true);

  const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  const handleSave = async () => {
    try {
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
        createdAt: new Date().toISOString(),
      };

      if (editingAlarm) {
        if (editingAlarm.notificationId) {
          await cancelAlarm(editingAlarm.notificationId);
        }
        await updateAlarm(editingAlarm.id, alarmData);
      } else {
        const newAlarm = await addAlarm(alarmData);
        if (!newAlarm) {
          throw new Error('Failed to add alarm');
        }
      }

      if (isActive) {
        const notificationId = await scheduleAlarm(alarmData);
        if (notificationId) {
          await updateAlarm(editingAlarm?.id || Date.now().toString(), {
            ...alarmData,
            notificationId,
          });
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งปลุกได้');
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
        
      Alert.alert('ทดสอบการปลุก', 'กำลังเปิดหน้าจอปลุก');
    } catch (error) {
      console.error('Error testing alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถทดสอบการปลุกได้');
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={handleTestAlarm} style={styles.testButton}>
          <MaterialCommunityIcons name="bell-ring" size={20} color="#FF9500" />
        </TouchableOpacity>
      ),
      title: editingAlarm ? 'แก้ไขการปลุก' : 'เพิ่มการปลุก',
      headerStyle: {
        backgroundColor: '#000000',
      },
      headerTintColor: '#FFFFFF',
    });
  }, [navigation, time, repeatDays, isActive]);

  const getRepeatDaysText = () => {
    if (repeatDays.length === 0) return 'ไม่เลย';
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

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <Pressable 
            style={styles.card}
            onPress={() => setShowTimePicker(true)}
          >
            <View style={styles.cardIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#FF9500" />
            </View>
            <View style={styles.cardMainContent}>
              <Text style={styles.cardLabel}>เวลา</Text>
              <Text style={styles.timeText}>{formatTime(time)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </Pressable>

          <Pressable 
            style={styles.card}
            onPress={() => navigation.navigate('RepeatDays', { 
              repeatDays, 
              onSave: setRepeatDays 
            })}
          >
            <View style={styles.cardIconContainer}>
              <MaterialCommunityIcons name="repeat" size={24} color="#FF9500" />
            </View>
            <View style={styles.cardMainContent}>
              <Text style={styles.cardLabel}>ทำซ้ำ</Text>
              <Text style={styles.cardValue}>{getRepeatDaysText()}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </Pressable>

          <View style={styles.card}>
            <View style={styles.cardIconContainer}>
              <MaterialCommunityIcons name="label-outline" size={24} color="#FF9500" />
            </View>
            <View style={styles.cardMainContent}>
              <Text style={styles.cardLabel}>ชื่อ</Text>
              <TextInput
                style={styles.labelInput}
                value={label}
                onChangeText={setLabel}
                placeholder="เพิ่มชื่อ"
                placeholderTextColor="#666"
                maxLength={30}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIconContainer}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#FF9500" />
            </View>
            <View style={styles.cardMainContent}>
              <Text style={styles.cardLabel}>เลื่อนปลุก</Text>
            </View>
            <Switch
              value={snooze}
              onValueChange={setSnooze}
              trackColor={{ false: '#3e3e3e', true: '#FF9500' }}
              thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : snooze ? '#FFFFFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {editingAlarm && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
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
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>ลบการปลุก</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowTimePicker(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ตั้งเวลา</Text>
              <TouchableOpacity 
                onPress={() => setShowTimePicker(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalSaveText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timePreview}>
              <Text style={styles.timePreviewText}>{formatTime(time)}</Text>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    setTime(selectedTime);
                  }
                }}
                textColor="#FFFFFF"
                style={styles.picker}
              />
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
  cardContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    padding: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeText: {
    color: '#FF9500',
    fontSize: 20,
    fontWeight: '600',
  },
  cardValue: {
    color: '#666',
    fontSize: 14,
  },
  labelInput: {
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
    height: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 28,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    marginRight: 16,
  },
  saveButtonText: {
    color: '#FF9500',
    fontSize: 17,
    fontWeight: '600',
  },
  testButton: {
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    width: '90%',
    maxWidth: 340,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  modalButton: {
    padding: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  modalCancelText: {
    color: '#FF3B30',
    fontSize: 17,
  },
  modalSaveText: {
    color: '#34C759',
    fontSize: 17,
    fontWeight: '600',
  },
  timePreview: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  timePreviewText: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 2,
  },
  pickerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  picker: {
    width: Platform.OS === 'ios' ? '100%' : 280,
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
});

export default AddAlarmScreen;
