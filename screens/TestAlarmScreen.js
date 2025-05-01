import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { scheduleTestAlarmNotification, cancelAlarmNotification } from '../models/NotificationManager';

const TestAlarmScreen = ({ navigation }) => {
  const [seconds, setSeconds] = useState('10');
  const [lastTestInfo, setLastTestInfo] = useState(null);

  const handleTestAlarm = async () => {
    // Convert input to number with a minimum of 3 seconds
    const secondsToTrigger = Math.max(3, parseInt(seconds) || 10);
    
    // Schedule the test alarm
    const result = await scheduleTestAlarmNotification(secondsToTrigger);
    
    if (result) {
      setLastTestInfo(result);
      console.log(`Test alarm scheduled: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.error('Failed to schedule test alarm');
    }
  };

  const cancelTest = async () => {
    if (lastTestInfo?.notificationId) {
      await cancelAlarmNotification(lastTestInfo.notificationId);
      console.log(`Canceled test alarm: ${lastTestInfo.notificationId}`);
      setLastTestInfo(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ทดสอบนาฬิกาปลุกแบบเวลาจริง</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>ตั้งเวลาในอีก (วินาที):</Text>
        <TextInput
          style={styles.input}
          value={seconds}
          onChangeText={setSeconds}
          keyboardType="numeric"
          placeholder="10"
        />
      </View>
      
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={handleTestAlarm}
      >
        <Text style={styles.buttonText}>ทดสอบนาฬิกาปลุก</Text>
      </TouchableOpacity>
      
      {lastTestInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ข้อมูลการทดสอบล่าสุด:</Text>
          <Text style={styles.infoText}>ID: {lastTestInfo.notificationId}</Text>
          <Text style={styles.infoText}>
            เวลา: {lastTestInfo.alarmData.hour.toString().padStart(2, '0')}:
            {lastTestInfo.alarmData.minute.toString().padStart(2, '0')}
          </Text>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={cancelTest}
          >
            <Text style={styles.buttonText}>ยกเลิกการทดสอบ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  testButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#2C2C2C',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
});

export default TestAlarmScreen; 