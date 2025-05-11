import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSleep } from '../../contexts/SleepContext';

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
  const [showBedTimePicker, setShowBedTimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  const [currentPicker, setCurrentPicker] = useState(null);
  
  // Sleep record details
  const [quality, setQuality] = useState(existingRecord?.quality || 'average');
  const [interruptions, setInterruptions] = useState(existingRecord?.interruptions || 0);
  const [timeToFallAsleep, setTimeToFallAsleep] = useState(
    existingRecord?.timeToFallAsleep?.toString() || '15'
  );
  const [notes, setNotes] = useState(existingRecord?.notes || '');
  const [hasDream, setHasDream] = useState(existingRecord?.hasDream || false);
  const [dreamDetails, setDreamDetails] = useState(existingRecord?.dreamDetails || '');
  
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
  
  // Handle date picker change
  const onDateTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowBedTimePicker(false);
      setShowWakeTimePicker(false);
    }
    
    if (selectedDate) {
      if (currentPicker === 'bedTime') {
        if (pickerMode === 'date') {
          // Preserve the time part
          const newDate = new Date(selectedDate);
          newDate.setHours(bedTime.getHours(), bedTime.getMinutes());
          setBedTime(newDate);
          
          // On Android, we need to show the time picker separately
          if (Platform.OS === 'android') {
            setPickerMode('time');
            setShowBedTimePicker(true);
          }
        } else {
          // Update just the time part
          const newDate = new Date(bedTime);
          newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
          setBedTime(newDate);
        }
      } else if (currentPicker === 'wakeTime') {
        if (pickerMode === 'date') {
          // Preserve the time part
          const newDate = new Date(selectedDate);
          newDate.setHours(wakeTime.getHours(), wakeTime.getMinutes());
          setWakeTime(newDate);
          
          // On Android, we need to show the time picker separately
          if (Platform.OS === 'android') {
            setPickerMode('time');
            setShowWakeTimePicker(true);
          }
        } else {
          // Update just the time part
          const newDate = new Date(wakeTime);
          newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
          setWakeTime(newDate);
        }
      }
    }
    
    // If iOS or done with time picker on Android
    if (Platform.OS === 'ios' || (Platform.OS === 'android' && pickerMode === 'time')) {
      setShowBedTimePicker(false);
      setShowWakeTimePicker(false);
      setPickerMode('date');
    }
  };
  
  // Show bed time picker
  const showBedTimePickerHandler = () => {
    setCurrentPicker('bedTime');
    setPickerMode('date');
    setShowBedTimePicker(true);
  };
  
  // Show wake time picker
  const showWakeTimePickerHandler = () => {
    setCurrentPicker('wakeTime');
    setPickerMode('date');
    setShowWakeTimePicker(true);
  };
  
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sleep Duration Card */}
        <View style={styles.durationCard}>
          <Text style={styles.durationTitle}>ระยะเวลาการนอน</Text>
          <Text style={styles.durationValue}>{hours} ชั่วโมง {minutes} นาที</Text>
        </View>
        
        {/* Date Time Selectors */}
        <View style={styles.sectionCard}>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeLabel}>
              <MaterialCommunityIcons name="bed" size={22} color="#FF9500" />
              <Text style={styles.labelText}>เข้านอน</Text>
            </View>
            <TouchableOpacity 
              onPress={showBedTimePickerHandler}
              style={styles.dateTimeValue}
            >
              <Text style={styles.dateTimeText}>
                {formatDate(bedTime)} | {formatTime(bedTime)}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeLabel}>
              <MaterialCommunityIcons name="weather-sunset-up" size={22} color="#FF9500" />
              <Text style={styles.labelText}>ตื่นนอน</Text>
            </View>
            <TouchableOpacity 
              onPress={showWakeTimePickerHandler}
              style={styles.dateTimeValue}
            >
              <Text style={styles.dateTimeText}>
                {formatDate(wakeTime)} | {formatTime(wakeTime)}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666666" />
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
              <MaterialCommunityIcons 
                name="emoticon-sad-outline" 
                size={24} 
                color={quality === 'bad' ? '#FFFFFF' : '#999999'} 
              />
              <Text style={[styles.qualityText, quality === 'bad' && styles.qualityTextSelected]}>
                แย่
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.qualityButton, quality === 'poor' && styles.qualityButtonSelected]}
              onPress={() => setQuality('poor')}
            >
              <MaterialCommunityIcons 
                name="emoticon-confused-outline" 
                size={24} 
                color={quality === 'poor' ? '#FFFFFF' : '#999999'} 
              />
              <Text style={[styles.qualityText, quality === 'poor' && styles.qualityTextSelected]}>
                ไม่ดี
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.qualityButton, quality === 'average' && styles.qualityButtonSelected]}
              onPress={() => setQuality('average')}
            >
              <MaterialCommunityIcons 
                name="emoticon-neutral-outline" 
                size={24} 
                color={quality === 'average' ? '#FFFFFF' : '#999999'} 
              />
              <Text style={[styles.qualityText, quality === 'average' && styles.qualityTextSelected]}>
                ปานกลาง
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.qualityButton, quality === 'good' && styles.qualityButtonSelected]}
              onPress={() => setQuality('good')}
            >
              <MaterialCommunityIcons 
                name="emoticon-happy-outline" 
                size={24} 
                color={quality === 'good' ? '#FFFFFF' : '#999999'} 
              />
              <Text style={[styles.qualityText, quality === 'good' && styles.qualityTextSelected]}>
                ดี
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.qualityButton, quality === 'excellent' && styles.qualityButtonSelected]}
              onPress={() => setQuality('excellent')}
            >
              <MaterialCommunityIcons 
                name="emoticon-excited-outline" 
                size={24} 
                color={quality === 'excellent' ? '#FFFFFF' : '#999999'} 
              />
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
                <MaterialCommunityIcons name="minus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{interruptions}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setInterruptions(parseInt(interruptions) + 1)}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
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
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>ลบข้อมูลการนอน</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {/* Date Time Pickers */}
      {(showBedTimePicker || showWakeTimePicker) && (
        <DateTimePicker
          testID="dateTimePicker"
          value={currentPicker === 'bedTime' ? bedTime : wakeTime}
          mode={pickerMode}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateTimeChange}
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