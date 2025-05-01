// AddAlarmScreen.js - หน้าเพิ่มและแก้ไขนาฬิกาปลุก
import React, { useState, useEffect } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { addAlarm, updateAlarm, cancelAlarm, deleteAlarm } from '../utils/alarmStorage';
import { scheduleAlarm } from '../utils/alarmNotification';

const AddAlarmScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const editingAlarm = route.params?.alarm;

  const [time, setTime] = useState(editingAlarm ?
    new Date(2000, 1, 1, editingAlarm.hour, editingAlarm.minute) :
    new Date()
  );
  const [repeatDays, setRepeatDays] = useState(editingAlarm?.repeatDays || []);
  const [isActive, setIsActive] = useState(editingAlarm?.isActive ?? true);
  const [label, setLabel] = useState(editingAlarm?.label || "การตั้งปลุก"); // Default label
  const [soundId, setSoundId] = useState(editingAlarm?.soundId || "default-alarm.mp3"); // Default sound ID
  const [soundName, setSoundName] = useState(editingAlarm?.soundName || "Default Alarm"); // Default sound name

  const dayNames = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']; // Short day names

  const handleSave = async () => {
    try {
      const alarmData = {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeatDays,
        isActive,
        userId: user?.id,
        label: label || "การตั้งปลุก", // Ensure label is not empty
        soundId,
        soundName,
        snooze: false, // Snooze removed from UI, set to false
        createdAt: editingAlarm?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let savedAlarm;
      if (editingAlarm) {
        // Cancel previous notification if exists
        if (editingAlarm.notificationId) {
          await cancelAlarm(editingAlarm.notificationId);
        }
        savedAlarm = await updateAlarm(editingAlarm.id, alarmData);
      } else {
        savedAlarm = await addAlarm(alarmData);
      }

      if (!savedAlarm) {
        throw new Error('Failed to save alarm');
      }

      // Schedule new notification if active
      if (isActive) {
        const notificationId = await scheduleAlarm(savedAlarm);
        if (notificationId) {
          // Update alarm with the new notification ID
          await updateAlarm(savedAlarm.id, { ...savedAlarm, notificationId });
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
        borderBottomWidth: 0, // Remove bottom border
        elevation: 0, // Remove shadow on Android
        shadowOpacity: 0, // Remove shadow on iOS
      },
      headerTintColor: '#FF9500',
    });
  }, [navigation, time, repeatDays, isActive, label, soundName]); // Add dependencies

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

  // Callback function for SoundLibraryScreen
  const handleSoundSelected = (selectedSoundId, selectedSoundName) => {
    setSoundId(selectedSoundId);
    setSoundName(selectedSoundName);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.pickerContainer}>
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display="spinner" // Use spinner display like the image
          onChange={(event, selectedTime) => {
            if (selectedTime) {
              setTime(selectedTime);
            }
          }}
          textColor="#FFFFFF" // White text for spinner
          style={styles.picker}
        />
      </View>

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
            trackColor={{ false: '#3e3e3e', true: '#34C759' }} // Green color when active
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 20, // Add some padding at the top
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
  pickerContainer: {
    // Container for the DateTimePicker
    alignItems: 'center',
    marginBottom: 30, // Space below the picker
  },
  picker: {
    width: Platform.OS === 'ios' ? '90%' : 300, // Adjust width as needed
    height: Platform.OS === 'ios' ? 200 : 180, // Adjust height for spinner
  },
  optionsContainer: {
    backgroundColor: '#1C1C1E', // Dark gray background for options
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden', // Clip the border radius
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333', // Separator line color
    minHeight: 50, // Minimum row height
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  optionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1, // Allow text to shrink if needed
  },
  optionValueText: {
    color: '#8E8E93', // Lighter gray for value text
    fontSize: 17,
    marginRight: 5,
    textAlign: 'right',
    maxWidth: '80%', // Limit width to prevent overlap
  },
  labelInput: {
    color: '#8E8E93',
    fontSize: 17,
    textAlign: 'right',
    flex: 1, // Take remaining space
    marginLeft: 10, // Space between label and input
    padding: 0, // Remove default padding
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] // Slightly smaller switch
  },
  deleteButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 30, // Space above delete button
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30', // Red color for delete
    fontSize: 17,
    fontWeight: '600',
  },
});

export default AddAlarmScreen;
