import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSleep } from '../../contexts/SleepContext';
// Import our safe wrapper for DateTimePicker
import SafeDateTimePicker from '../../components/SafeDateTimePicker';

const SleepEntryScreen = ({ route, navigation }) => {
  const { addSleep, updateSleep, deleteSleep } = useSleep();
  const editing = route.params?.editing || false;
  const existingRecord = route.params?.record || null;
  // Default to now for wake time and 8 hours ago for bed time
  const now = new Date();
  const defaultBedTime = new Date(now);
  defaultBedTime.setHours(now.getHours() - 8);
  // State for date/time pickers
  const [bedTime, setBedTime] = useState(existingRecord ? new Date(existingRecord.bedTime) : defaultBedTime);
  const [wakeTime, setWakeTime] = useState(existingRecord ? new Date(existingRecord.wakeTime) : now);
  const [currentPicker, setCurrentPicker] = useState(null); // For tracking which time we're editing (bedTime or wakeTime)
  
  // Smart date/time picker state - Different implementations for iOS and Android
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDateTime, setTempDateTime] = useState(new Date());
    // Sleep record details
  const [quality, setQuality] = useState(existingRecord?.quality || 'average');
  const [interruptions, setInterruptions] = useState(existingRecord?.interruptions || 0);
  const [timeToFallAsleep, setTimeToFallAsleep] = useState(
    existingRecord?.timeToFallAsleep?.toString() || '15'
  );
  const [notes, setNotes] = useState(existingRecord?.notes || '');
  const [hasDream, setHasDream] = useState(existingRecord?.hasDream || false);
  const [dreamDetails, setDreamDetails] = useState(existingRecord?.dreamDetails || '');
  
  // Additional explanation about DateTime picker implementation for Android and iOS
  // The DateTimePicker component has different behavior between iOS and Android:
  // - On iOS, it appears as a spinner directly in the UI
  // - On Android, it appears as a modal dialog
  // This implementation handles both platforms appropriately
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Calculate sleep duration
  const calculateDuration = () => {
    const durationMs = wakeTime - bedTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return { hours, minutes, durationMinutes };
  };
  const { hours, minutes, durationMinutes } = calculateDuration();
  
  // Handle date/time selection for bedTime
  const showBedTimePickerHandler = () => {
    setCurrentPicker('bedTime');
    setTempDateTime(new Date(bedTime));
    setShowDatePicker(true);
  };
    // Handle date/time selection for wakeTime
  const showWakeTimePickerHandler = () => {
    setCurrentPicker('wakeTime');
    setTempDateTime(new Date(wakeTime));
    setShowDatePicker(true);
  };
    // Switch from date to time picker - handles platform differences
  const showTimePickerAfterDate = () => {
    setShowDatePicker(false);
    // Adding slightly more delay for Android to avoid UI glitches
    setTimeout(() => setShowTimePicker(true), Platform.OS === 'android' ? 500 : 300);
  };
    // Handle date/time changes with extra error handling
  const handleDateTimeChange = (event, selectedDate) => {
    try {
      // For Android, the event type might be 'dismissed' when the user cancels
      if (event?.type === 'dismissed' || !selectedDate) {
        setShowDatePicker(false);
        setShowTimePicker(false);
        return;
      }
      
      // If the user selected a date
      if (selectedDate) {
        const currentDate = new Date(selectedDate);
        setTempDateTime(currentDate);
        
        // Always hide the picker on Android after selection
        if (Platform.OS === 'android') {
          setShowDatePicker(false);
          setShowTimePicker(false);
          
          // For Android, we need to handle the flow differently
          if (showDatePicker) {
            // After date selection on Android, we'll show the time picker after a small delay
            setTimeout(() => {
              setShowTimePicker(true);
            }, 300);
          } else if (showTimePicker) {
            // Time was selected on Android
            // Create a final dateTime with both date and time components
            const finalDateTime = new Date(tempDateTime);
            finalDateTime.setHours(currentDate.getHours());
            finalDateTime.setMinutes(currentDate.getMinutes());
            
            // Update the appropriate state variable
            if (currentPicker === 'bedTime') {
              setBedTime(finalDateTime);
            } else {
              setWakeTime(finalDateTime);
            }
          }
        } else {
          // iOS flow remains the same
          if (showDatePicker) {
            showTimePickerAfterDate();
          } else if (showTimePicker) {
            // Time was selected, update the final date
            setShowTimePicker(false);
            
            // Create a final dateTime with both date and time components
            const finalDateTime = new Date(tempDateTime);
            finalDateTime.setHours(currentDate.getHours());
            finalDateTime.setMinutes(currentDate.getMinutes());
            
            // Update the appropriate state variable
            if (currentPicker === 'bedTime') {
              setBedTime(finalDateTime);
            } else {
              setWakeTime(finalDateTime);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling date/time change:', error);
      // Reset pickers if there's an error
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  };
    // Format time and date functions
  
  // Format time as HH:MM
  const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Format date as day/month/year
  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('th-TH', options);
  };
  
  // Validate form data
  const validateForm = () => {
    if (wakeTime <= bedTime) {
      Alert.alert(
        'เวลาไม่ถูกต้อง',
        'เวลาตื่นนอนต้องมาหลังเวลาเข้านอน'
      );
      return false;
    }
    
    const durationHours = durationMinutes / 60;
    if (durationHours > 24) {
      Alert.alert(
        'ระยะเวลาการนอนไม่ถูกต้อง',
        'ระยะเวลาการนอนไม่ควรเกิน 24 ชั่วโมง'
      );
      return false;
    }
    
    return true;
  };
  
  // Save sleep record
  const saveSleepRecord = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      const sleepRecord = {
        bedTime: bedTime.toISOString(),
        wakeTime: wakeTime.toISOString(),
        quality,
        interruptions: parseInt(interruptions, 10),
        timeToFallAsleep: parseInt(timeToFallAsleep, 10),
        notes,
        hasDream,
        dreamDetails: hasDream ? dreamDetails : '',
      };
      
      if (editing && existingRecord) {
        // Update existing record
        await updateSleep(existingRecord.id, sleepRecord);
        navigation.goBack();
      } else {
        // Add new record
        await addSleep(sleepRecord);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving sleep record:', error);
      Alert.alert(
        'ข้อผิดพลาด',
        'ไม่สามารถบันทึกข้อมูลการนอนได้'
      );
    } finally {
      setSaving(false);
    }
  };
  
  // Delete sleep record
  const deleteSleepRecord = async () => {
    Alert.alert(
      'ลบข้อมูลการนอน',
      'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการนอนนี้?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ลบ', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteSleep(existingRecord.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting sleep record:', error);
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลการนอนได้');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={saveSleepRecord}
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
  }, [navigation, bedTime, wakeTime, quality, interruptions, timeToFallAsleep, notes, hasDream, dreamDetails, saving]);
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={{ flex: 1 }}>
        {/* Hidden text component to prevent rendering errors */}
        <Text style={{ height: 0, width: 0, opacity: 0 }}>placeholder for text rendering</Text>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hidden text component to prevent rendering errors */}
          <Text style={{ height: 0, width: 0, opacity: 0 }}>placeholder for scroll content</Text>
          
          {/* Sleep Duration Card */}
          <View style={styles.durationCard}>
            <Text style={styles.durationTitle}>ระยะเวลาการนอน</Text>
            <Text style={styles.durationValue}>{hours} ชั่วโมง {minutes} นาที</Text>
          </View>
          
          {/* Date Time Selectors */}
          <View style={styles.sectionCard}>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeLabel}>
                <Text>
                  <MaterialCommunityIcons name="bed" size={22} color="#FF9500" />
                </Text>
                <Text style={styles.labelText}>เข้านอน</Text>
              </View>
              <TouchableOpacity 
                onPress={showBedTimePickerHandler}
                style={styles.dateTimeValue}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(bedTime)} | {formatTime(bedTime)}
                </Text>
                <Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeLabel}>
                <Text>
                  <MaterialCommunityIcons name="weather-sunset-up" size={22} color="#FF9500" />
                </Text>
                <Text style={styles.labelText}>ตื่นนอน</Text>
              </View>
              <TouchableOpacity 
                onPress={showWakeTimePickerHandler}
                style={styles.dateTimeValue}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(wakeTime)} | {formatTime(wakeTime)}
                </Text>
                <Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Sleep Quality */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>คุณภาพการนอน</Text>
            
            <View style={styles.qualitySelector}>
              <TouchableOpacity
                style={[styles.qualityButton, quality === 'bad' && styles.qualityButtonSelected]}
                onPress={() => setQuality('bad')}
              >
                <Text>
                  <MaterialCommunityIcons 
                    name="emoticon-sad-outline" 
                    size={24} 
                    color={quality === 'bad' ? '#FFFFFF' : '#999999'} 
                  />
                </Text>
                <Text style={[styles.qualityText, quality === 'bad' && styles.qualityTextSelected]}>
                  แย่
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.qualityButton, quality === 'poor' && styles.qualityButtonSelected]}
                onPress={() => setQuality('poor')}
              >
                <Text>
                  <MaterialCommunityIcons 
                    name="emoticon-confused-outline" 
                    size={24} 
                    color={quality === 'poor' ? '#FFFFFF' : '#999999'} 
                  />
                </Text>
                <Text style={[styles.qualityText, quality === 'poor' && styles.qualityTextSelected]}>
                  ไม่ดี
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.qualityButton, quality === 'average' && styles.qualityButtonSelected]}
                onPress={() => setQuality('average')}
              >
                <Text>
                  <MaterialCommunityIcons 
                    name="emoticon-neutral-outline" 
                    size={24} 
                    color={quality === 'average' ? '#FFFFFF' : '#999999'} 
                  />
                </Text>
                <Text style={[styles.qualityText, quality === 'average' && styles.qualityTextSelected]}>
                  ปานกลาง
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.qualityButton, quality === 'good' && styles.qualityButtonSelected]}
                onPress={() => setQuality('good')}
              >
                <Text>
                  <MaterialCommunityIcons 
                    name="emoticon-happy-outline" 
                    size={24} 
                    color={quality === 'good' ? '#FFFFFF' : '#999999'} 
                  />
                </Text>
                <Text style={[styles.qualityText, quality === 'good' && styles.qualityTextSelected]}>
                  ดี
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.qualityButton, quality === 'excellent' && styles.qualityButtonSelected]}
                onPress={() => setQuality('excellent')}
              >
                <Text>
                  <MaterialCommunityIcons 
                    name="emoticon-excited-outline" 
                    size={24} 
                    color={quality === 'excellent' ? '#FFFFFF' : '#999999'} 
                  />
                </Text>
                <Text style={[styles.qualityText, quality === 'excellent' && styles.qualityTextSelected]}>
                  ดีเยี่ยม
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Sleep Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>รายละเอียดเพิ่มเติม</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>จำนวนครั้งที่ตื่นระหว่างการนอน</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setInterruptions(Math.max(0, parseInt(interruptions) - 1))}
                >
                  <Text>
                    <MaterialCommunityIcons name="minus" size={18} color="#FFFFFF" />
                  </Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{interruptions}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setInterruptions(parseInt(interruptions) + 1)}
                >
                  <Text>
                    <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>เวลาที่ใช้ในการเข้านอน (นาที)</Text>
              <TextInput
                style={styles.detailInput}
                value={timeToFallAsleep}
                onChangeText={setTimeToFallAsleep}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ฝันหรือไม่</Text>
              <Switch
                value={hasDream}
                onValueChange={setHasDream}
                trackColor={{ false: '#767577', true: '#FF9500' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {hasDream && (
              <>
                <View style={styles.divider} />
                <View style={styles.textAreaContainer}>
                  <Text style={styles.detailLabel}>รายละเอียดความฝัน</Text>
                  <TextInput
                    style={styles.textArea}
                    value={dreamDetails}
                    onChangeText={setDreamDetails}
                    placeholder="เล่าความฝันของคุณ..."
                    placeholderTextColor="#666666"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </>
            )}
          </View>
          
          {/* Notes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>บันทึกเพิ่มเติม</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="บันทึกข้อมูลเพิ่มเติมเกี่ยวกับการนอนของคุณ (ตัวอย่าง: รู้สึกปวดหัว, ทานยาเพิ่ม, ฯลฯ)"
              placeholderTextColor="#666666"
              multiline={true}
              numberOfLines={4}
            />
          </View>
          
          {/* Delete Button (only in edit mode) */}
          {editing && existingRecord && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={deleteSleepRecord}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
                  </Text>
                  <Text style={styles.deleteButtonText}>ลบข้อมูลการนอน</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
      
      {/* Date Picker */}
      {showDatePicker && Platform.OS === 'ios' && (
        <SafeDateTimePicker
          value={tempDateTime}
          mode="date"
          display="spinner"
          onChange={handleDateTimeChange}
          textColor="#FFFFFF"
          themeVariant="dark"
          locale="th-TH"
        />
      )}
      
      {/* Time Picker for iOS */}
      {showTimePicker && Platform.OS === 'ios' && (
        <SafeDateTimePicker
          value={tempDateTime}
          mode="time"
          display="spinner"
          onChange={handleDateTimeChange}
          textColor="#FFFFFF"
          themeVariant="dark"
          locale="th-TH"
          is24Hour={true}
        />
      )}
        {/* Android date picker - rendered as a modal */}
      {(showDatePicker && Platform.OS === 'android') && (
        <SafeDateTimePicker
          testID="androidDatePicker"
          value={tempDateTime}
          mode="date"
          onChange={handleDateTimeChange}
        />
      )}
      
      {/* Android time picker - rendered as a modal */}
      {(showTimePicker && Platform.OS === 'android') && (
        <SafeDateTimePicker
          testID="androidTimePicker"
          value={tempDateTime}
          mode="time"
          is24Hour={true}
          onChange={handleDateTimeChange}
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
  scrollContent: {
    padding: 16,
  },
  durationCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  durationTitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateTimeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 17,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  dateTimeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 17,
    color: '#999999',
    marginRight: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333333',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  qualitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  qualityButtonSelected: {
    backgroundColor: '#FF9500',
  },
  qualityText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  qualityTextSelected: {
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 17,
    color: '#FFFFFF',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  detailInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 17,
    color: '#FFFFFF',
    minWidth: 60,
    textAlign: 'center',
  },
  textAreaContainer: {
    paddingVertical: 12,
  },
  textArea: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#FFFFFF',
    height: 100,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#FFFFFF',
    height: 100,
    textAlignVertical: 'top',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
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

export default SleepEntryScreen;