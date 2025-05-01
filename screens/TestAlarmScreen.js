import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleTestAlarmNotification, cancelAlarmNotification } from '../models/NotificationManager';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

// Thai month names
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const TestAlarmScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pulseAnim] = useState(new Animated.Value(1));
  const [lastTestInfo, setLastTestInfo] = useState(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Pulse animation for the alarm icon
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulse).start();
  }, []);

  // Format time as HH:MM
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format date in Thai
  const formatThaiDate = (date) => {
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist year
    return `วัน${getDayName(date)}ที่ ${day} ${month} ${year}`;
  };

  // Get Thai day name
  const getDayName = (date) => {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return days[date.getDay()];
  };

  const handleTestAlarm = async () => {
    const result = await scheduleTestAlarmNotification(3); // 3 seconds for quick testing
    if (result) {
      setLastTestInfo(result);
    }
  };

  const handleSnooze = () => {
    // Implement snooze functionality
    navigation.goBack();
  };

  const handleDismiss = async () => {
    if (lastTestInfo?.notificationId) {
      await cancelAlarmNotification(lastTestInfo.notificationId);
      setLastTestInfo(null);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.content}>
        {/* Time Display */}
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.dateText}>{formatThaiDate(currentTime)}</Text>

        {/* Alarm Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Icon name="alarm" size={80} color="#4F46E5" />
        </Animated.View>

        {/* Alarm Message */}
        <Text style={styles.alarmTitle}>นาฬิกาปลุกทดสอบ</Text>
        <Text style={styles.alarmSubtitle}>แจ้งเตือนการปลุกที่ตั้งค่าไว้ กรุณาปิดการแจ้งเตือน</Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.snoozeButton}
            onPress={handleSnooze}
          >
            <Icon name="alarm-snooze" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>เลื่อนปลุก</Text>
            <Text style={styles.buttonSubtext}>1/3</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <LinearGradient
              colors={['#4F46E5', '#6B46E5']}
              style={styles.gradientButton}
            >
              <Icon name="alarm-off" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>ปิดเสียง{'\n'}ปลุก</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    marginBottom: 40,
  },
  iconContainer: {
    marginVertical: 30,
    padding: 20,
  },
  alarmTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  alarmSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 20,
  },
  snoozeButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dismissButton: {
    flex: 1,
  },
  gradientButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonSubtext: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 12,
    marginTop: 4,
  },
});

export default TestAlarmScreen; 