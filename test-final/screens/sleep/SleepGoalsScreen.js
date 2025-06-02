import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useSleep } from '../../contexts/SleepContext';

const SleepGoalsScreen = ({ navigation }) => {
  const { sleepGoals, updateSleepGoals } = useSleep();
  
  // Default goals in case no existing goals
  const defaultGoals = {
    targetHours: 8,
    bedTimeTarget: '23:00',
    wakeTimeTarget: '07:00',
    weekdayBedTime: '23:00',
    weekdayWakeTime: '07:00',
    weekendBedTime: '23:30',
    weekendWakeTime: '08:00',
    consistency: true,
  };
  
  // State for goals
  const [goals, setGoals] = useState(sleepGoals || defaultGoals);
  
  // State for time pickers
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeField, setCurrentTimeField] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for saving
  const [saving, setSaving] = useState(false);
  
  // Initialize goals when sleepGoals is loaded
  useEffect(() => {
    if (sleepGoals) {
      setGoals(sleepGoals);
    }
  }, [sleepGoals]);
  
  // Set up navigation options with save button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={saveGoals}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0A84FF" />
          ) : (
            <Text style={styles.saveButtonText}>บันทึก</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, goals, saving]);
  
  // Show time picker for the selected field
  const showTimePickerFor = (field) => {
    // Convert time string to Date object
    const timeStr = goals[field];
    const [hours, minutes] = timeStr.split(':').map(n => parseInt(n, 10));
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    setCurrentTime(date);
    setCurrentTimeField(field);
    setShowTimePicker(true);
  };
  
  // Handle time change
  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate && currentTimeField) {
      // Format time as HH:MM
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      // Update the selected field
      setGoals(prev => ({
        ...prev,
        [currentTimeField]: timeStr,
      }));
    }
  };
  
  // Update target hours
  const updateTargetHours = (value) => {
    setGoals(prev => ({
      ...prev,
      targetHours: value,
    }));
  };
  
  // Toggle consistency setting
  const toggleConsistency = () => {
    setGoals(prev => ({
      ...prev,
      consistency: !prev.consistency,
    }));
  };
  
  // Save goals
  const saveGoals = async () => {
    try {
      setSaving(true);
      const success = await updateSleepGoals(goals);
      
      if (success) {
        Alert.alert(
          'บันทึกสำเร็จ',
          'เป้าหมายการนอนของคุณถูกบันทึกเรียบร้อยแล้ว',
          [{ text: 'ตกลง' }]
        );
      } else {
        throw new Error('Failed to save sleep goals');
      }
    } catch (error) {
      console.error('Error saving sleep goals:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        'ไม่สามารถบันทึกเป้าหมายการนอนได้ กรุณาลองใหม่อีกครั้ง',
        [{ text: 'ตกลง' }]
      );
    } finally {
      setSaving(false);
    }
  };
  
  // Format HH:MM time to 12-hour format with AM/PM
  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':').map(n => parseInt(n, 10));
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.scrollView}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={24} color="#FF9500" />
          <Text style={styles.infoText}>
            การตั้งเป้าหมายการนอนช่วยให้คุณติดตามความก้าวหน้าและปรับปรุงสุขภาพการนอนของคุณได้ดีขึ้น
          </Text>
        </View>
        
        {/* Target Sleep Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ระยะเวลาการนอนเป้าหมาย</Text>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{goals.targetHours} ชั่วโมง</Text>
            
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={12}
              step={0.5}
              value={goals.targetHours}
              onValueChange={updateTargetHours}
              minimumTrackTintColor="#FF9500"
              maximumTrackTintColor="#333333"
              thumbTintColor="#FF9500"
            />
            
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>5</Text>
              <Text style={styles.sliderMaxLabel}>12</Text>
            </View>
          </View>
          
          <Text style={styles.helperText}>
            ผู้ใหญ่ส่วนใหญ่ต้องการนอนประมาณ 7-9 ชั่วโมงต่อคืน
          </Text>
        </View>
        
        {/* Target Bed Time and Wake Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เวลาเข้านอนและตื่นนอนเป้าหมาย</Text>
          
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => showTimePickerFor('bedTimeTarget')}
          >
            <View style={styles.timeLabel}>
              <MaterialCommunityIcons name="bed" size={22} color="#FF9500" />
              <Text style={styles.timeLabelText}>เวลาเข้านอน</Text>
            </View>
            
            <View style={styles.timeValue}>
              <Text style={styles.timeValueText}>{formatTime12Hour(goals.bedTimeTarget)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity
            style={styles.timeRow}
            onPress={() => showTimePickerFor('wakeTimeTarget')}
          >
            <View style={styles.timeLabel}>
              <MaterialCommunityIcons name="weather-sunset-up" size={22} color="#FF9500" />
              <Text style={styles.timeLabelText}>เวลาตื่นนอน</Text>
            </View>
            
            <View style={styles.timeValue}>
              <Text style={styles.timeValueText}>{formatTime12Hour(goals.wakeTimeTarget)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Consistency Setting */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleTitle}>ตั้งค่าแยกวันธรรมดา/วันหยุด</Text>
              <Text style={styles.toggleSubtitle}>
                ตั้งค่าเวลานอนและตื่นแยกระหว่างวันธรรมดาและวันหยุดสุดสัปดาห์
              </Text>
            </View>
            
            <Switch
              value={goals.consistency}
              onValueChange={toggleConsistency}
              trackColor={{ false: '#767577', true: '#FF9500' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* Weekday/Weekend Settings (if consistency is enabled) */}
        {goals.consistency && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>วันธรรมดา (จันทร์-ศุกร์)</Text>
              
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => showTimePickerFor('weekdayBedTime')}
              >
                <View style={styles.timeLabel}>
                  <MaterialCommunityIcons name="bed" size={22} color="#FF9500" />
                  <Text style={styles.timeLabelText}>เวลาเข้านอน</Text>
                </View>
                
                <View style={styles.timeValue}>
                  <Text style={styles.timeValueText}>{formatTime12Hour(goals.weekdayBedTime)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => showTimePickerFor('weekdayWakeTime')}
              >
                <View style={styles.timeLabel}>
                  <MaterialCommunityIcons name="weather-sunset-up" size={22} color="#FF9500" />
                  <Text style={styles.timeLabelText}>เวลาตื่นนอน</Text>
                </View>
                
                <View style={styles.timeValue}>
                  <Text style={styles.timeValueText}>{formatTime12Hour(goals.weekdayWakeTime)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>วันหยุด (เสาร์-อาทิตย์)</Text>
              
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => showTimePickerFor('weekendBedTime')}
              >
                <View style={styles.timeLabel}>
                  <MaterialCommunityIcons name="bed" size={22} color="#FF9500" />
                  <Text style={styles.timeLabelText}>เวลาเข้านอน</Text>
                </View>
                
                <View style={styles.timeValue}>
                  <Text style={styles.timeValueText}>{formatTime12Hour(goals.weekendBedTime)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => showTimePickerFor('weekendWakeTime')}
              >
                <View style={styles.timeLabel}>
                  <MaterialCommunityIcons name="weather-sunset-up" size={22} color="#FF9500" />
                  <Text style={styles.timeLabelText}>เวลาตื่นนอน</Text>
                </View>
                
                <View style={styles.timeValue}>
                  <Text style={styles.timeValueText}>{formatTime12Hour(goals.weekendWakeTime)}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* Helpful Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>เคล็ดลับการตั้งเป้าหมายการนอน</Text>
          
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.tipText}>
              พยายามเข้านอนและตื่นนอนในเวลาเดียวกันทุกวัน แม้ในวันหยุดสุดสัปดาห์
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.tipText}>
              วันหยุดสุดสัปดาห์ไม่ควรตื่นช้ากว่าวันธรรมดาเกิน 1-2 ชั่วโมง
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#4CAF50" />
            <Text style={styles.tipText}>
              ตั้งเป้าหมายระยะเวลานอนที่ทำให้คุณรู้สึกกระปรี้กระเปร่าเมื่อตื่นนอน
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={currentTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sliderContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  sliderMinLabel: {
    color: '#999999',
    fontSize: 12,
  },
  sliderMaxLabel: {
    color: '#999999',
    fontSize: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabelText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 16,
    color: '#999999',
    marginRight: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333333',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#999999',
  },
  tipsSection: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#CCCCCC',
    marginLeft: 12,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A84FF',
  },
});

export default SleepGoalsScreen; 