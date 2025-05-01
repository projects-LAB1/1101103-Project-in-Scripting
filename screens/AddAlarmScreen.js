import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, TextInput } from 'react-native-paper';
import { supabase } from '../supabase.config';
import { UserAuth } from '../models/UserAuth';
import * as Notifications from 'expo-notifications';
import uuid from 'react-native-uuid';
import { Picker } from '@react-native-picker/picker';

const AddAlarmScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user } = UserAuth();

  const editingAlarm = route.params?.alarm;
  const isEditing = !!editingAlarm;

  // States for alarm settings
  const [time, setTime] = useState(
    isEditing
      ? new Date(editingAlarm.hour * 3600000 + editingAlarm.minute * 60000)
      : new Date()
  );
  const [hour, setHour] = useState(isEditing ? editingAlarm.hour : time.getHours());
  const [minute, setMinute] = useState(isEditing ? editingAlarm.minute : time.getMinutes());
  const [label, setLabel] = useState(isEditing ? editingAlarm.label || '' : '');
  const [sound, setSound] = useState(isEditing ? editingAlarm.sound || 'default' : 'default');
  const [isActive, setIsActive] = useState(isEditing ? editingAlarm.is_active : true);

  // Generate hour and minute arrays for the wheel picker
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Task related states
  const [taskType, setTaskType] = useState(isEditing ? editingAlarm.task_type || 'none' : 'none');
  const [mathDifficulty, setMathDifficulty] = useState(
    isEditing ? editingAlarm.task_difficulty || 'easy' : 'easy'
  );

  // Repeat related states
  const [repeatDays, setRepeatDays] = useState(
    isEditing && editingAlarm.repeat_days
      ? JSON.parse(editingAlarm.repeat_days)
      : [false, false, false, false, false, false, false]
  );



  const toggleDay = (index) => {
    const newRepeatDays = [...repeatDays];
    newRepeatDays[index] = !newRepeatDays[index];
    setRepeatDays(newRepeatDays);
  };

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const handleSaveAlarm = async () => {
    try {
      if (!user) {
        Alert.alert('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อนสร้างนาฬิกาปลุก');
        return;
      }

      // Use the hour and minute state variables directly

      const alarmData = {
        user_id: user.id,
        hour,
        minute,
        label: label.trim(),
        sound,
        is_active: isActive,
        repeat_days: JSON.stringify(repeatDays),
        task_type: taskType,
        task_difficulty: mathDifficulty,
      };

      if (isEditing) {
        // อัปเดตนาฬิกาปลุกเดิม
        const { error } = await supabase
          .from('alarms')
          .update(alarmData)
          .eq('id', editingAlarm.id);

        if (error) throw error;
        Alert.alert('สำเร็จ', 'อัปเดตนาฬิกาปลุกเรียบร้อยแล้ว');
      } else {
        // สร้างนาฬิกาปลุกใหม่
        const { error } = await supabase
          .from('alarms')
          .insert(alarmData);

        if (error) throw error;
        Alert.alert('สำเร็จ', 'สร้างนาฬิกาปลุกเรียบร้อยแล้ว');
      }

      // กลับไปยังหน้า AlarmList
      navigation.goBack();

    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกนาฬิกาปลุกได้ กรุณาลองอีกครั้ง');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const navigateToSoundLibrary = () => {
    navigation.navigate('SoundLibrary', {
      currentSound: sound,
      onSelectSound: (selectedSound) => {
        setSound(selectedSound);
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'แก้ไขนาฬิกาปลุก' : 'นาฬิกาปลุกใหม่'}
        </Text>
        <TouchableOpacity onPress={handleSaveAlarm} style={styles.headerButton}>
          <Text style={styles.saveText}>บันทึก</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.timeContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Picker
                selectedValue={hour}
                onValueChange={(itemValue) => {
                  setHour(itemValue);
                  const newTime = new Date(time);
                  newTime.setHours(itemValue);
                  setTime(newTime);
                }}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                dropdownIconColor="transparent"
              >
                {hours.map((h) => (
                  <Picker.Item key={h} label={h} value={parseInt(h)} color="#FFFFFF" />
                ))}
              </Picker>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.pickerColumn}>
              <Picker
                selectedValue={minute}
                onValueChange={(itemValue) => {
                  setMinute(itemValue);
                  const newTime = new Date(time);
                  newTime.setMinutes(itemValue);
                  setTime(newTime);
                }}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                dropdownIconColor="transparent"
              >
                {minutes.map((m) => (
                  <Picker.Item key={m} label={m} value={parseInt(m)} color="#FFFFFF" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Icon name="label-outline" size={24} color="#aaa" style={styles.labelIcon} />
            <TextInput
              label="ชื่อนาฬิกาปลุก"
              value={label}
              onChangeText={setLabel}
              style={styles.labelInput}
              mode="outlined"
              outlineColor="#333"
              activeOutlineColor="#6C63FF"
              theme={{ colors: { text: '#fff', placeholder: '#aaa', background: '#12111D' } }}
            />
          </View>

          <View style={styles.repeatSection}>
            <Text style={styles.sectionLabel}>วันที่ปลุกซ้ำ</Text>
            <View style={styles.daysContainer}>
              {dayNames.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    repeatDays[index] && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      repeatDays[index] && styles.dayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={navigateToSoundLibrary}
          >
            <Icon name="music-note" size={24} color="#aaa" />
            <Text style={styles.settingText}>เสียงปลุก</Text>
            <Text style={styles.settingValue}>{sound}</Text>
            <Icon name="chevron-right" size={24} color="#aaa" />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Icon name="alarm-check" size={24} color="#aaa" />
            <Text style={styles.settingText}>เปิดใช้งาน</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#444', true: '#6C63FF' }}
              thumbColor={isActive ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.taskSection}>
            <Text style={styles.sectionLabel}>กิจกรรมเพื่อปิดการปลุก</Text>

            <View style={styles.taskOptions}>
              <TouchableOpacity
                style={[
                  styles.taskOption,
                  taskType === 'none' && styles.taskOptionActive,
                ]}
                onPress={() => setTaskType('none')}
              >
                <Text style={styles.taskOptionText}>ไม่มี</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.taskOption,
                  taskType === 'math' && styles.taskOptionActive,
                ]}
                onPress={() => setTaskType('math')}
              >
                <Text style={styles.taskOptionText}>คณิตศาสตร์</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.taskOption,
                  taskType === 'photo' && styles.taskOptionActive,
                ]}
                onPress={() => setTaskType('photo')}
              >
                <Text style={styles.taskOptionText}>ถ่ายภาพ</Text>
              </TouchableOpacity>
            </View>

            {taskType === 'math' && (
              <View style={styles.difficultySection}>
                <Text style={styles.sectionLabel}>ระดับความยาก</Text>

                <View style={styles.taskOptions}>
                  <TouchableOpacity
                    style={[
                      styles.taskOption,
                      mathDifficulty === 'easy' && styles.taskOptionActive,
                    ]}
                    onPress={() => setMathDifficulty('easy')}
                  >
                    <Text style={styles.taskOptionText}>ง่าย</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.taskOption,
                      mathDifficulty === 'medium' && styles.taskOptionActive,
                    ]}
                    onPress={() => setMathDifficulty('medium')}
                  >
                    <Text style={styles.taskOptionText}>ปานกลาง</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.taskOption,
                      mathDifficulty === 'hard' && styles.taskOptionActive,
                    ]}
                    onPress={() => setMathDifficulty('hard')}
                  >
                    <Text style={styles.taskOptionText}>ยาก</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12111D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  saveText: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pickerColumn: {
    width: 100,
    height: 180,
  },
  picker: {
    width: 100,
    height: 180,
    backgroundColor: '#1A1A2E',
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  labelIcon: {
    marginRight: 10,
  },
  labelInput: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 16,
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  settingValue: {
    marginRight: 8,
    fontSize: 16,
    color: '#aaa',
  },
  repeatSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  dayButtonActive: {
    backgroundColor: '#6C63FF',
  },
  dayText: {
    fontSize: 14,
    color: '#fff',
  },
  dayTextActive: {
    fontWeight: 'bold',
  },
  taskSection: {
    marginTop: 24,
  },
  taskOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  taskOption: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  taskOptionActive: {
    backgroundColor: '#6C63FF',
  },
  taskOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  difficultySection: {
    marginTop: 16,
  },
});

export default AddAlarmScreen;