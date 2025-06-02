import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Title, Paragraph, Button, Divider, List } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { setOnSleepDetectedCallback } from '../../utils/SensorManager';
import { 
  startMotionTracking, 
  stopMotionTracking,
  setSleepDetectionEnabled,
  saveSleepDetection,
  fetchSleepDetectionHistory,
  clearSleepDetectionHistoryAction,
  selectMotionTracking,
  selectMotionData,
  selectSleepDetectionHistory,
  selectSleepDetectionEnabled,
  selectSensorLoading,
  selectSensorError
} from '../../redux/slices/sensorSlice';
import { addSleepRecord } from '../../redux/slices/sleepSlice';

const SleepDetectionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  // Redux selectors
  const motionTracking = useSelector(selectMotionTracking);
  const motionData = useSelector(selectMotionData);
  const sleepDetectionHistory = useSelector(selectSleepDetectionHistory);
  const sleepDetectionEnabled = useSelector(selectSleepDetectionEnabled);
  const loading = useSelector(selectSensorLoading);
  const error = useSelector(selectSensorError);
  
  // Local state
  const [expandedItemId, setExpandedItemId] = useState(null);
  
  // โหลดประวัติการตรวจจับการนอนเมื่อหน้าจอโหลด
  useEffect(() => {
    dispatch(fetchSleepDetectionHistory());
  }, [dispatch]);
  
  // ตั้งค่า callback เมื่อตรวจพบการนอน
  useEffect(() => {
    if (sleepDetectionEnabled) {
      setOnSleepDetectedCallback((sleepData) => {
        console.log('Sleep detected:', sleepData);
        
        // บันทึกข้อมูลการตรวจจับ
        const detectionData = {
          timestamp: new Date().toISOString(),
          detectedAt: sleepData.timestamp,
          noMotionDuration: sleepData.noMotionDuration,
          isProcessed: false,
        };
        
        dispatch(saveSleepDetection(detectionData));
        
        // แจ้งเตือนผู้ใช้ (อาจจะเป็น silent notification)
        console.log('Detected sleep at:', sleepData.timestamp);
      });
    }
    
    return () => {
      // ยกเลิก callback เมื่อ component unmount
      setOnSleepDetectedCallback(null);
    };
  }, [sleepDetectionEnabled, dispatch]);
  
  // เริ่ม/หยุดการตรวจจับเมื่อ sleepDetectionEnabled เปลี่ยน
  useEffect(() => {
    if (sleepDetectionEnabled && !motionTracking) {
      dispatch(startMotionTracking(1000)); // อัปเดตทุก 1 วินาที
    } else if (!sleepDetectionEnabled && motionTracking) {
      dispatch(stopMotionTracking());
    }
  }, [sleepDetectionEnabled, motionTracking, dispatch]);
  
  // Toggle การตรวจจับการนอน
  const toggleSleepDetection = () => {
    dispatch(setSleepDetectionEnabled(!sleepDetectionEnabled));
  };
  
  // ล้างประวัติการตรวจจับ
  const clearHistory = () => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบประวัติการตรวจจับการนอนทั้งหมดหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ลบ', 
          onPress: () => dispatch(clearSleepDetectionHistoryAction()),
          style: 'destructive'
        }
      ]
    );
  };
  
  // เพิ่มข้อมูลการนอนไปยังประวัติการนอน
  const addToSleepHistory = (item) => {
    // สร้างข้อมูลการนอนจากการตรวจจับอัตโนมัติ
    const bedTime = new Date(item.detectedAt);
    const wakeTime = new Date(bedTime);
    
    // สมมติให้นอน 8 ชั่วโมง (สามารถปรับเปลี่ยนได้)
    wakeTime.setHours(wakeTime.getHours() + 8);
    
    const sleepRecord = {
      bedTime: bedTime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      quality: 3, // คุณภาพปานกลาง (1-5)
      durationMinutes: 8 * 60, // 8 ชั่วโมง
      notes: 'บันทึกอัตโนมัติจากการตรวจจับการนอน',
      detectedAutomatically: true,
    };
    
    // เพิ่มข้อมูลการนอนใหม่ผ่าน Redux
    dispatch(addSleepRecord(sleepRecord));
    
    // อัปเดตสถานะของรายการตรวจจับให้เป็น processed
    // ในกรณีนี้เราไม่ได้อัปเดตสถานะจริงๆ แต่แค่แสดงให้เห็นว่าเราสามารถทำได้
    Alert.alert(
      'บันทึกสำเร็จ',
      'บันทึกข้อมูลการนอนเรียบร้อยแล้ว',
      [{ text: 'ตกลง' }]
    );
    
    // ปิดรายการที่กำลังขยาย
    setExpandedItemId(null);
  };
  
  // Render รายการประวัติการตรวจจับ
  const renderHistoryItem = (item, index) => {
    const detectedDate = new Date(item.detectedAt || item.timestamp);
    const isExpanded = expandedItemId === item.id;
    
    return (
      <>
        <List.Item
          key={item.id || index}
          title={`ตรวจพบการนอนหลับ`}
          description={`${detectedDate.toLocaleString('th-TH')}`}
          left={props => (
            <List.Icon 
              {...props} 
              icon="sleep" 
              color={theme.colors.primary}
            />
          )}
          right={props => (
            <TouchableOpacity
              onPress={() => setExpandedItemId(isExpanded ? null : item.id)}
            >
              <List.Icon 
                {...props} 
                icon={isExpanded ? "chevron-up" : "chevron-down"} 
              />
            </TouchableOpacity>
          )}
          onPress={() => setExpandedItemId(isExpanded ? null : item.id)}
          style={styles.historyItem}
        />
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={[styles.expandedText, { color: theme.colors.text }]}>
              ตรวจพบเมื่อ: {detectedDate.toLocaleString('th-TH')}
            </Text>
            <Text style={[styles.expandedText, { color: theme.colors.text }]}>
              ไม่มีการเคลื่อนไหวเป็นเวลา: {item.noMotionDuration} วินาที
            </Text>
            <Button 
              mode="contained" 
              onPress={() => addToSleepHistory(item)}
              style={styles.actionButton}
            >
              เพิ่มไปยังประวัติการนอน
            </Button>
          </View>
        )}
      </>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#e0f2f1', '#b2dfdb']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>การตรวจจับการนอนอัตโนมัติ</Title>
        <Paragraph style={styles.headerDescription}>
          ตรวจจับการนอนโดยอัตโนมัติจากเซนเซอร์การเคลื่อนไหว
        </Paragraph>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView}>
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View style={styles.switchContainer}>
              <Title style={{ color: theme.colors.text }}>เปิดใช้งานการตรวจจับอัตโนมัติ</Title>
              <Switch
                value={sleepDetectionEnabled}
                onValueChange={toggleSleepDetection}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={sleepDetectionEnabled ? theme.colors.accent : '#f4f3f4'}
                disabled={loading}
              />
            </View>
            
            {sleepDetectionEnabled && (
              <View style={styles.statusContainer}>
                <MaterialCommunityIcons 
                  name={motionTracking ? "motion-sensor" : "motion-sensor-off"} 
                  size={24} 
                  color={motionTracking ? theme.colors.primary : theme.colors.error} 
                />
                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                  {motionTracking 
                    ? "กำลังตรวจจับการเคลื่อนไหว..." 
                    : "ไม่ได้ตรวจจับการเคลื่อนไหว"}
                </Text>
              </View>
            )}
            
            <Paragraph style={{ color: theme.colors.text, marginTop: 10 }}>
              ระบบจะตรวจจับการนอนของคุณโดยอัตโนมัติเมื่อไม่มีการเคลื่อนไหวเป็นเวลานาน
              การตรวจจับนี้จะใช้เซนเซอร์การเคลื่อนไหวของอุปกรณ์ 
              และจะทำงานแม้ในขณะที่แอปทำงานอยู่ในพื้นหลัง
            </Paragraph>
          </Card.Content>
        </Card>
        
        {error && (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.error }]}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        )}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              กำลังโหลด...
            </Text>
          </View>
        )}
        
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Title style={{ color: theme.colors.text }}>ประวัติการตรวจจับ</Title>
            <Button 
              mode="text" 
              onPress={clearHistory}
              disabled={loading || sleepDetectionHistory.length === 0}
            >
              ล้างประวัติ
            </Button>
          </View>
          
          {sleepDetectionHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              ยังไม่มีประวัติการตรวจจับการนอน
            </Text>
          ) : (
            sleepDetectionHistory.map((item, index) => renderHistoryItem(item, index))
          )}
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          กลับ
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerDescription: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
  },
  historyContainer: {
    marginTop: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    marginLeft: 20,
    marginBottom: 16,
  },
  expandedText: {
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    opacity: 0.6,
  },
  errorCard: {
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  button: {
    marginTop: 10,
  },
});

export default SleepDetectionScreen; 