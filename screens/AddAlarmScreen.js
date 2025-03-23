// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, Switch, Alert, Platform 
} from 'react-native';
import Slider from '@react-native-community/slider';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { scheduleAlarmNotification } from '../models/NotificationManager';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AddAlarmScreen = ({ route, navigation }) => {
  // Get alarm data if editing an existing alarm
  const existingAlarm = route.params?.alarm;
  const isEditing = !!existingAlarm;
  
  // State for alarm data
  const [hour, setHour] = useState(existingAlarm?.hour || new Date().getHours());
  const [minute, setMinute] = useState(existingAlarm?.minute || new Date().getMinutes());
  const [label, setLabel] = useState(existingAlarm?.label || '');
  const [isActive, setIsActive] = useState(existingAlarm?.isActive !== false);
  const [repeatDays, setRepeatDays] = useState(existingAlarm?.repeatDays || []);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [taskType, setTaskType] = useState(existingAlarm?.taskType || 'normal');
  const [taskDifficulty, setTaskDifficulty] = useState(existingAlarm?.taskDifficulty || 'medium');
  const [soundId, setSoundId] = useState(existingAlarm?.soundId || 'default');
  const [soundName, setSoundName] = useState(existingAlarm?.soundName || 'Default Alarm');
  const [volume, setVolume] = useState(existingAlarm?.volume || 80);
  
  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;
  
  // Day names for repeat selection
  const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  
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
      setRepeatDays(repeatDays.filter(day => day !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };
  
  // Save alarm to Firestore
  const saveAlarm = async () => {
    if (!userId) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อนบันทึกนาฬิกาปลุก');
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
        volume,
        userId,
        updatedAt: new Date()
      };
      
      if (isEditing) {
        // Update existing alarm
        const alarmRef = doc(db, 'alarms', existingAlarm.id);
        await updateDoc(alarmRef, alarmData);
        Alert.alert('สำเร็จ', 'อัปเดตนาฬิกาปลุกเรียบร้อยแล้ว');
      } else {
        // Create new alarm
        alarmData.createdAt = new Date();
        await addDoc(collection(db, 'alarms'), alarmData);
        Alert.alert('สำเร็จ', 'เพิ่มนาฬิกาปลุกเรียบร้อยแล้ว');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกนาฬิกาปลุกได้');
    }
  };
  
  // Select alarm sound
  const selectSound = () => {
    navigation.navigate('SoundLibrary', {
      onSelect: (sound) => {
        setSoundId(sound.id);
        setSoundName(sound.name);
      },
      currentSoundId: soundId
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Time Picker Section */}
      <View style={styles.timeSection}>
        <TouchableOpacity 
          style={styles.timeDisplay}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timeText}>
            {`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
          </Text>
        </TouchableOpacity>
        
        {showTimePicker && (
          <DateTimePicker
            value={(() => {
              const date = new Date();
              date.setHours(hour, minute, 0);
              return date;
            })()}
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
            trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
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
            <View style={[styles.dayIndicator, repeatDays.includes(index) && styles.daySelected]}>
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
        
        {taskType !== 'normal' && (
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
        // Sound Section - continued
        <TouchableOpacity 
          style={styles.soundSelector}
          onPress={selectSound}
        >
          <View>
            <Text style={styles.soundName}>{soundName}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <View style={styles.volumeContainer}>
          <Text style={styles.volumeLabel}>ระดับเสียง: {volume}%</Text>
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor="#4F46E5"
            maximumTrackTintColor="#D1D5DB"
            thumbTintColor="#4F46E5"
          />
          <View style={styles.volumeIconContainer}>
            <Icon name="volume-low" size={18} color="#6B7280" />
            <Icon name="volume-high" size={18} color="#6B7280" />
          </View>
        </View>
      </View>
      
      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={saveAlarm}
      >
        <Text style={styles.saveButtonText}>
          {isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มนาฬิกาปลุก'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  timeSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timeDisplay: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inputLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    textAlign: 'right',
    color: '#1F2937',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayText: {
    fontSize: 16,
    color: '#4B5563',
  },
  dayIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 50,
  },
  soundSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  soundName: {
    fontSize: 16,
    color: '#4B5563',
  },
  volumeContainer: {
    marginTop: 15,
    paddingHorizontal: 5,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  volumeSlider: {
    height: 40,
  },
  volumeIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddAlarmScreen;