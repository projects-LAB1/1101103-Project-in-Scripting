import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  SafeAreaView,
} from 'react-native';

const AlarmSetupScreen = () => {
  // State management
  const [alarmTime, setAlarmTime] = useState({ hours: 23, minutes: 0 });
  const [repeatMode, setRepeatMode] = useState('once'); // 'once', 'workdays', 'custom'
  
  const [customDays, setCustomDays] = useState({
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
  });
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [alarmName, setAlarmName] = useState('');
  const [ringtone, setRingtone] = useState('Default alarm sound');
  const [quest, setQuest] = useState('Default alarm Quest');
  const [snooze, setSnooze] = useState({
    duration: 5, // minutes
    maxTimes: 3,
  });

  // Helper functions
  const updateCustomDay = (day, value) => {
    setCustomDays(prev => ({ ...prev, [day]: value }));
  };

  const renderTimePicker = () => {
    // Simple time picker for demo purposes
    // Real implementation would have scrollable time picker
    return (
      <View style={styles.timePickerContainer}>
        <View style={styles.timePickerRow}>
          <Text style={styles.timePickerValue}>23</Text>
          <Text style={styles.timePickerValue}>00</Text>
        </View>
        <View style={styles.timePickerSeparator} />
        <View style={styles.timePickerRow}>
          <Text style={styles.timePickerValue}>00</Text>
          <Text style={styles.timePickerValue}>01</Text>
        </View>
        <View style={styles.timePickerSeparator} />
        <View style={styles.timePickerRow}>
          <Text style={styles.timePickerValue}>01</Text>
          <Text style={styles.timePickerValue}>02</Text>
        </View>
      </View>
    );
  };

  const renderRepeatOptions = () => {
    return (
      <View style={styles.repeatOptionsContainer}>
        <TouchableOpacity
          style={[
            styles.repeatOptionButton,
            repeatMode === 'once' && styles.repeatOptionButtonActive,
          ]}
          onPress={() => setRepeatMode('once')}
        >
          <Text style={[
            styles.repeatOptionText,
            repeatMode === 'once' && styles.repeatOptionTextActive,
          ]}>Ring once</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.repeatOptionButton,
            repeatMode === 'workdays' && styles.repeatOptionButtonActive,
          ]}
          onPress={() => setRepeatMode('workdays')}
        >
          <Text style={[
            styles.repeatOptionText,
            repeatMode === 'workdays' && styles.repeatOptionTextActive,
          ]}>workdays</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.repeatOptionButton,
            repeatMode === 'custom' && styles.repeatOptionButtonActive,
          ]}
          onPress={() => setRepeatMode('custom')}
        >
          <Text style={[
            styles.repeatOptionText,
            repeatMode === 'custom' && styles.repeatOptionTextActive,
          ]}>Custom</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWorkdaySchedule = () => {
    if (repeatMode !== 'workdays') return null;

    return (
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Work schedule</Text>
        <Text style={styles.settingValue}>Mon to Fri</Text>
      </View>
    );
  };

  const renderCustomDaySelector = () => {
    if (repeatMode !== 'custom') return null;

    const days = [
      { key: 'sunday', label: 'S' },
      { key: 'monday', label: 'M' },
      { key: 'tuesday', label: 'T' },
      { key: 'wednesday', label: 'W' },
      { key: 'thursday', label: 'T' },
      { key: 'friday', label: 'F' },
      { key: 'saturday', label: 'S' },
    ];

    return (
      <View style={styles.customDaysSelectorContainer}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Repeat</Text>
          <Text style={styles.settingValue}>Every day</Text>
        </View>

        <View style={styles.daysContainer}>
          {days.map((day) => (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayButton,
                customDays[day.key] && styles.dayButtonActive,
              ]}
              onPress={() => updateCustomDay(day.key, !customDays[day.key])}
            >
              <Text style={[
                styles.dayButtonText,
                customDays[day.key] && styles.dayButtonTextActive,
              ]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.holidaysContainer}>
          <View style={styles.holidayTextContainer}>
            <Text style={styles.settingLabel}>Do Not Ring on Holidays</Text>
            <Text style={styles.settingSubLabel}>Alarm won't ring on holidays</Text>
          </View>
          <Switch
            value={skipHolidays}
            onValueChange={setSkipHolidays}
            trackColor={{ false: '#767577', true: '#2196F3' }}
            thumbColor={skipHolidays ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>
      </View>
    );
  };

  const renderSettingsFields = () => {
    return (
      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Alarm name</Text>
          <TextInput 
            style={styles.settingInput}
            value={alarmName}
            onChangeText={setAlarmName}
            placeholder=""
            placeholderTextColor="#888"
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Ringtone</Text>
          <Text style={styles.settingValue}>{ringtone}</Text>
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Quest</Text>
          <Text style={styles.settingValue}>{quest}</Text>
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Snooze</Text>
          <Text style={styles.settingValue}>{`${snooze.duration} minutes, ${snooze.maxTimes} times`}</Text>
        </View>
      </View>
    );
  };

  const saveAlarm = () => {
    // Save alarm logic here
    console.log('Saving alarm with settings:', {
      alarmTime,
      repeatMode,
      customDays,
      skipHolidays,
      alarmName,
      ringtone,
      quest,
      snooze,
    });
    // Navigate back or show confirmation
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New alarm</Text>
          <Text style={styles.headerSubtitle}>Ring in 1 day</Text>
        </View>

        {renderTimePicker()}
        {renderRepeatOptions()}
        
        <View style={styles.settingsWrapper}>
          {renderWorkdaySchedule()}
          {renderCustomDaySelector()}
          {renderSettingsFields()}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={saveAlarm}>
        <Text style={styles.saveButtonText}>SAVE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  timePickerContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  timePickerValue: {
    fontSize: 28,
    color: '#888',
    width: 50,
    textAlign: 'center',
  },
  timePickerSeparator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
  repeatOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  repeatOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#333',
  },
  repeatOptionButtonActive: {
    backgroundColor: '#2196F3',
  },
  repeatOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  repeatOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  settingsWrapper: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 80,
  },
  settingsContainer: {
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingSubLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#888',
  },
  settingInput: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'right',
  },
  customDaysSelectorContainer: {
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  dayButtonActive: {
    backgroundColor: '#2196F3',
  },
  dayButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  dayButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  holidaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  holidayTextContainer: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AlarmSetupScreen;