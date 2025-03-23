// AlarmListScreen.js - หน้าแสดงรายการนาฬิกาปลุก
import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Switch, Alert, ActivityIndicator 
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, collection, query, where, 
  onSnapshot, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { scheduleAlarmNotification, cancelAlarmNotification } from '../models/NotificationManager';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        Alert.alert(
          'ข้อผิดพลาด', 
          'การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          [
            {text: 'ตกลง'},
            {text: 'ลองใหม่', onPress: () => retryLoading()}
          ]
        );
      }
    }, 10000); // ลดเวลารอเป็น 10 วินาที

    // Subscribe to alarms collection for the current user
    const alarmsRef = collection(db, 'alarms');
    const userAlarmsQuery = query(alarmsRef, where('userId', '==', userId));
    
    let unsubscribe;
    try {
      // เพิ่มตัวเลือกสำหรับ onSnapshot เพื่อให้ทำงานได้ดีขึ้นในสภาพแวดล้อมที่การเชื่อมต่อไม่เสถียร
      const snapshotOptions = {
        includeMetadataChanges: true,
      };
      
      unsubscribe = onSnapshot(userAlarmsQuery, snapshotOptions, (snapshot) => {
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        const alarmList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort alarms by time
        alarmList.sort((a, b) => {
          const timeA = a.hour * 60 + a.minute;
          const timeB = b.hour * 60 + b.minute;
          return timeA - timeB;
        });
        
        setAlarms(alarmList);
        setLoading(false);
        
        // ตรวจสอบและตั้งค่าการแจ้งเตือนสำหรับนาฬิกาปลุกที่เปิดใช้งาน
        alarmList.forEach(async (alarm) => {
          if (alarm.isActive) {
            // ถ้ายังไม่มี notificationId หรือมีการอัปเดตข้อมูลหลังจากตั้งค่าการแจ้งเตือน
            if (!alarm.notificationId || 
                (alarm.updatedAt && alarm.lastNotificationUpdate && 
                 new Date(alarm.updatedAt) > new Date(alarm.lastNotificationUpdate))) {
              
              // ตั้งค่าการแจ้งเตือนใหม่
              const notificationId = await scheduleAlarmNotification(alarm);
              
              // บันทึก notificationId และเวลาที่อัปเดตการแจ้งเตือนล่าสุด
              if (notificationId) {
                const alarmRef = doc(db, 'alarms', alarm.id);
                await updateDoc(alarmRef, { 
                  notificationId,
                  lastNotificationUpdate: new Date()
                });
              }
            }
          }
        });
      }, (error) => {
        // Clear timeout since we got an error response
        clearTimeout(timeoutId);
        
        console.error('Error fetching alarms:', error);
        setLoading(false);
        Alert.alert(
          'ข้อผิดพลาด', 
          'ไม่สามารถโหลดรายการนาฬิกาปลุกได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          [
            {text: 'ตกลง'},
            {text: 'ลองใหม่', onPress: () => retryLoading()}
          ]
        );
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error setting up snapshot listener:', error);
      setLoading(false);
      Alert.alert(
        'ข้อผิดพลาด', 
        'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        [
          {text: 'ตกลง'},
          {text: 'ลองใหม่', onPress: () => retryLoading()}
        ]
      );
    }
    
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, [userId, db]);

  const toggleAlarmActive = async (alarmId, currentStatus) => {
    try {
      // ค้นหาข้อมูลนาฬิกาปลุกจาก state
      const alarm = alarms.find(a => a.id === alarmId);
      if (!alarm) return;
      
      // อัปเดตสถานะในฐานข้อมูล
      const alarmRef = doc(db, 'alarms', alarmId);
      const newStatus = !currentStatus;
      
      // อัปเดตข้อมูลในฐานข้อมูล
      await updateDoc(alarmRef, {
        isActive: newStatus,
        updatedAt: new Date()
      });
      
      // จัดการการแจ้งเตือน
      if (newStatus) {
        // ถ้าเปิดใช้งาน ให้ตั้งค่าการแจ้งเตือน
        const notificationId = await scheduleAlarmNotification(alarm);
        
        // บันทึก notificationId ลงในฐานข้อมูล
        if (notificationId) {
          await updateDoc(alarmRef, { notificationId });
        }
      } else {
        // ถ้าปิดใช้งาน ให้ยกเลิกการแจ้งเตือน
        if (alarm.notificationId) {
          await cancelAlarmNotification(alarm.notificationId);
        }
      }
    } catch (error) {
      console.error('Error toggling alarm:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะนาฬิกาปลุกได้');
    }
  };

  const deleteAlarm = async (alarmId) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบนาฬิกาปลุกนี้ใช่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ลบ', 
          style: 'destructive',
          onPress: async () => {
            try {
              // ค้นหาข้อมูลนาฬิกาปลุกจาก state
              const alarm = alarms.find(a => a.id === alarmId);
              
              // ยกเลิกการแจ้งเตือนก่อนลบ
              if (alarm && alarm.notificationId) {
                await cancelAlarmNotification(alarm.notificationId);
              }
              
              // ลบข้อมูลจากฐานข้อมูล
              const alarmRef = doc(db, 'alarms', alarmId);
              await deleteDoc(alarmRef);
            } catch (error) {
              console.error('Error deleting alarm:', error);
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบนาฬิกาปลุกได้');
            }
          }
        }
      ]
    );
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getDaysText = (days) => {
    if (!days || days.length === 0) return 'ครั้งเดียว';
    
    const dayNames = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
    
    if (days.length === 7) return 'ทุกวัน';
    
    return days.map(day => dayNames[day]).join(', ');
  };

  const renderAlarmItem = ({ item }) => (
    <View style={styles.alarmItem}>
      <TouchableOpacity 
        style={styles.alarmInfo}
        onPress={() => navigation.navigate('AddAlarm', { alarm: item })}
      >
        <Text style={styles.alarmTime}>{formatTime(item.hour, item.minute)}</Text>
        <Text style={styles.alarmDays}>{getDaysText(item.repeatDays)}</Text>
        <Text style={styles.alarmLabel}>{item.label || 'นาฬิกาปลุก'}</Text>
        <Text style={styles.alarmTask}>
          {item.taskType === 'math' ? 'โจทย์คณิตศาสตร์' : 
           item.taskType === 'photo' ? 'ถ่ายรูป' : 
           item.taskType === 'random' ? 'สุ่มภารกิจ' : 'ปกติ'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.alarmActions}>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleAlarmActive(item.id, item.isActive)}
          trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
          thumbColor={item.isActive ? '#FFFFFF' : '#F3F4F6'}
        />
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAlarm(item.id)}
        >
          <Icon name="trash-can-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Function to retry loading alarms
  const retryLoading = () => {
    console.log('กำลังลองโหลดข้อมูลใหม่...');
    setLoading(true);
    // Force re-render of the component to trigger useEffect again
    setAlarms([]);
    
    // แสดงข้อความให้ผู้ใช้ทราบว่ากำลังลองใหม่
    Alert.alert('กำลังลองใหม่', 'กำลังพยายามเชื่อมต่อกับฐานข้อมูลอีกครั้ง...');
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>กำลังโหลดนาฬิกาปลุก...</Text>
          <Text style={styles.loadingSubText}>หากใช้เวลานานเกินไป อาจเกิดจากปัญหาการเชื่อมต่อ</Text>
        </View>
      ) : alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="alarm-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>ไม่มีนาฬิกาปลุก</Text>
          <Text style={styles.emptySubText}>กดปุ่ม + เพื่อเพิ่มนาฬิกาปลุกใหม่</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryLoading}
          >
            <Icon name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>ลองโหลดใหม่</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  alarmItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  alarmDays: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  alarmLabel: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  alarmTask: {
    fontSize: 14,
    color: '#6B7280',
  },
  alarmActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
  },
  deleteButton: {
    marginTop: 12,
    padding: 4,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AlarmListScreen;