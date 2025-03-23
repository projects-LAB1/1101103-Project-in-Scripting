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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Subscribe to alarms collection for the current user
    const alarmsRef = collection(db, 'alarms');
    const userAlarmsQuery = query(alarmsRef, where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(userAlarmsQuery, (snapshot) => {
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
    }, (error) => {
      console.error('Error fetching alarms:', error);
      setLoading(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดรายการนาฬิกาปลุกได้');
    });
    
    return unsubscribe;
  }, [userId, db]);

  const toggleAlarmActive = async (alarmId, currentStatus) => {
    try {
      const alarmRef = doc(db, 'alarms', alarmId);
      await updateDoc(alarmRef, {
        isActive: !currentStatus
      });
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

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>กำลังโหลดนาฬิกาปลุก...</Text>
        </View>
      ) : alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="alarm-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>ไม่มีนาฬิกาปลุก</Text>
          <Text style={styles.emptySubText}>กดปุ่ม + เพื่อเพิ่มนาฬิกาปลุกใหม่</Text>
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
});

export default AlarmListScreen;