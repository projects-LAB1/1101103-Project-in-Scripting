import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ScrollView, 
  ActivityIndicator, 
  Platform,
  Alert 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Title, Paragraph, Button, ProgressBar } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { setOnLightLevelChangeCallback } from '../../utils/SensorManager';
import { 
  startLightTracking, 
  stopLightTracking,
  updateLightData,
  selectLightTracking,
  selectLightData,
  selectSensorLoading,
  selectSensorError
} from '../../redux/slices/sensorSlice';

const LightSensorScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  // Redux selectors
  const lightTracking = useSelector(selectLightTracking);
  const lightData = useSelector(selectLightData);
  const loading = useSelector(selectSensorLoading);
  const error = useSelector(selectSensorError);
  
  // Local state
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  
  // ตรวจสอบว่า Platform รองรับเซนเซอร์แสงหรือไม่ (iOS ไม่รองรับโดยส่วนใหญ่)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      setSensorAvailable(false);
      Alert.alert(
        'ไม่รองรับเซนเซอร์แสง',
        'อุปกรณ์ของคุณไม่รองรับเซนเซอร์แสง เราจะแสดงข้อมูลจำลองแทน',
        [{ text: 'ตกลง' }]
      );
    }
  }, []);
  
  // ตั้งค่า callback เมื่อระดับแสงเปลี่ยน
  useEffect(() => {
    if (trackingEnabled) {
      setOnLightLevelChangeCallback((data) => {
        console.log('Light level changed:', data);
        dispatch(updateLightData({
          currentLightLevel: data.lightLevel,
          recommendation: data.recommendation,
          lastUpdate: data.timestamp
        }));
      });
    }
    
    return () => {
      // ยกเลิก callback เมื่อ component unmount
      setOnLightLevelChangeCallback(null);
    };
  }, [trackingEnabled, dispatch]);
  
  // เริ่ม/หยุดการตรวจจับเมื่อ trackingEnabled เปลี่ยน
  useEffect(() => {
    if (trackingEnabled && !lightTracking) {
      dispatch(startLightTracking(500)); // อัปเดตทุก 0.5 วินาที
      
      // ถ้าเป็น iOS จำลองข้อมูล
      if (Platform.OS === 'ios') {
        simulateLightData();
      }
    } else if (!trackingEnabled && lightTracking) {
      dispatch(stopLightTracking());
    }
  }, [trackingEnabled, lightTracking, dispatch]);
  
  // จำลองข้อมูลแสงสำหรับอุปกรณ์ที่ไม่รองรับเซนเซอร์
  const simulateLightData = () => {
    // จำลองค่าแสงระหว่าง 0-200 lux
    const interval = setInterval(() => {
      if (!trackingEnabled) {
        clearInterval(interval);
        return;
      }
      
      // สุ่มค่าแสงแต่กำหนดให้มีความสัมพันธ์กับค่าก่อนหน้า
      const lightLevel = Math.max(0, Math.min(200, 
        lightData.currentLightLevel 
          ? lightData.currentLightLevel + (Math.random() * 20 - 10)
          : Math.random() * 60
      ));
      
      // กำหนดคำแนะนำตามค่าแสง
      let recommendation = '';
      if (lightLevel <= 5) {
        recommendation = 'ความสว่างของห้องเหมาะสมกับการนอนหลับแล้ว';
      } else if (lightLevel <= 100) {
        recommendation = 'ความสว่างของห้องพอใช้ แต่ควรลดแสงลงอีกเพื่อการนอนที่ดีขึ้น';
      } else {
        recommendation = 'ห้องสว่างเกินไป ควรลดแสงลงเพื่อการนอนหลับที่มีคุณภาพ';
      }
      
      dispatch(updateLightData({
        currentLightLevel: lightLevel,
        recommendation,
        lastUpdate: new Date()
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  };
  
  // Toggle การตรวจจับแสง
  const toggleLightTracking = () => {
    setTrackingEnabled(!trackingEnabled);
  };
  
  // คำนวณระดับแสงเป็นเปอร์เซ็นต์สำหรับแสดงผล
  const calculateLightPercentage = () => {
    if (lightData.currentLightLevel === null) return 0;
    
    // จำกัดค่าสูงสุดที่ 200 lux เพื่อการแสดงผลที่ดี
    return Math.min(lightData.currentLightLevel / (200), 1);
  };
  
  // แสดงระดับความสว่างเป็นข้อความ
  const getLightLevelText = () => {
    if (lightData.currentLightLevel === null) return 'ไม่มีข้อมูล';
    
    const level = lightData.currentLightLevel;
    if (level <= 5) return 'มืด (เหมาะสมกับการนอน)';
    if (level <= 25) return 'ค่อนข้างมืด (เหมาะกับการนอน)';
    if (level <= 100) return 'สว่างปานกลาง';
    if (level <= 200) return 'สว่าง';
    return 'สว่างมาก';
  };
  
  // สีของแถบแสดงผลตามระดับแสง
  const getLightLevelColor = () => {
    if (lightData.currentLightLevel === null) return theme.colors.primary;
    
    const level = lightData.currentLightLevel;
    if (level <= 5) return '#3F51B5'; // สีน้ำเงิน (เหมาะสม)
    if (level <= 25) return '#4CAF50'; // สีเขียว (ดี)
    if (level <= 100) return '#FFC107'; // สีเหลือง (ปานกลาง)
    if (level <= 200) return '#FF9800'; // สีส้ม (สว่างไป)
    return '#F44336'; // สีแดง (สว่างเกินไป)
  };
  
  // ไอคอนตามระดับแสง
  const getLightLevelIcon = () => {
    if (lightData.currentLightLevel === null) return 'brightness-5';
    
    const level = lightData.currentLightLevel;
    if (level <= 5) return 'weather-night';
    if (level <= 25) return 'brightness-2';
    if (level <= 100) return 'brightness-5';
    if (level <= 200) return 'brightness-6';
    return 'brightness-7';
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#e0f2f1', '#b2dfdb']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>เซนเซอร์แสงสภาพแวดล้อม</Title>
        <Paragraph style={styles.headerDescription}>
          ตรวจวัดความสว่างของห้องเพื่อสภาพแวดล้อมการนอนที่ดี
        </Paragraph>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView}>
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <View style={styles.switchContainer}>
              <Title style={{ color: theme.colors.text }}>เปิดใช้งานเซนเซอร์แสง</Title>
              <Switch
                value={trackingEnabled}
                onValueChange={toggleLightTracking}
                trackColor={{ false: '#767577', true: theme.colors.primary }}
                thumbColor={trackingEnabled ? theme.colors.accent : '#f4f3f4'}
                disabled={loading || !sensorAvailable}
              />
            </View>
            
            {!sensorAvailable && (
              <Text style={[styles.warningText, { color: theme.colors.notification }]}>
                อุปกรณ์ของคุณไม่รองรับเซนเซอร์แสง เราจะแสดงข้อมูลจำลองแทน
              </Text>
            )}
            
            {trackingEnabled && (
              <View style={styles.statusContainer}>
                <MaterialCommunityIcons 
                  name={lightTracking ? "brightness-auto" : "brightness-4"} 
                  size={24} 
                  color={lightTracking ? theme.colors.primary : theme.colors.error} 
                />
                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                  {lightTracking 
                    ? "กำลังตรวจวัดแสง..." 
                    : "ไม่ได้ตรวจวัดแสง"}
                </Text>
              </View>
            )}
            
            <Paragraph style={{ color: theme.colors.text, marginTop: 10 }}>
              ระบบจะตรวจวัดความสว่างของห้องและให้คำแนะนำสำหรับสภาพแวดล้อมการนอนที่เหมาะสม
              การนอนหลับที่มีคุณภาพควรอยู่ในห้องที่มืดหรือมีแสงสลัวเท่านั้น
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
        
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>ระดับแสงในห้อง</Title>
            
            {lightData.currentLightLevel !== null ? (
              <>
                <View style={styles.lightLevelContainer}>
                  <MaterialCommunityIcons 
                    name={getLightLevelIcon()} 
                    size={36} 
                    color={getLightLevelColor()} 
                  />
                  <View style={styles.lightLevelTextContainer}>
                    <Text style={[styles.lightLevelValue, { color: theme.colors.text }]}>
                      {lightData.currentLightLevel.toFixed(1)} lux
                    </Text>
                    <Text style={[styles.lightLevelLabel, { color: theme.colors.text }]}>
                      {getLightLevelText()}
                    </Text>
                  </View>
                </View>
                
                <ProgressBar 
                  progress={calculateLightPercentage()} 
                  color={getLightLevelColor()} 
                  style={styles.progressBar} 
                />
                
                <View style={styles.recommendationContainer}>
                  <MaterialCommunityIcons 
                    name="lightbulb-on-outline" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <Text style={[styles.recommendationText, { color: theme.colors.text }]}>
                    {lightData.recommendation || 'ไม่มีคำแนะนำ'}
                  </Text>
                </View>
                
                {lightData.lastUpdate && (
                  <Text style={[styles.lastUpdateText, { color: theme.colors.text }]}>
                    อัปเดตล่าสุด: {new Date(lightData.lastUpdate).toLocaleTimeString('th-TH')}
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                เปิดใช้งานเซนเซอร์แสงเพื่อดูข้อมูล
              </Text>
            )}
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>คำแนะนำสำหรับการนอนที่ดี</Title>
            
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons name="lightbulb-off" size={20} color={theme.colors.primary} />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                ปิดไฟทุกดวงในห้องนอน แม้แต่ไฟ LED ขนาดเล็กจากอุปกรณ์อิเล็กทรอนิกส์
              </Text>
            </View>
            
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons name="curtains" size={20} color={theme.colors.primary} />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                ใช้ผ้าม่านทึบแสงเพื่อป้องกันแสงจากภายนอก
              </Text>
            </View>
            
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons name="cellphone-off" size={20} color={theme.colors.primary} />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                หลีกเลี่ยงการใช้อุปกรณ์อิเล็กทรอนิกส์ก่อนนอน 1-2 ชั่วโมง
              </Text>
            </View>
            
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons name="eye-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                ที่ปิดตาช่วยให้นอนหลับได้ดีขึ้นในสภาพแวดล้อมที่ไม่สามารถควบคุมแสงได้
              </Text>
            </View>
          </Card.Content>
        </Card>
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
  warningText: {
    marginTop: 5,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  lightLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  lightLevelTextContainer: {
    marginLeft: 15,
  },
  lightLevelValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lightLevelLabel: {
    fontSize: 16,
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  recommendationText: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
  lastUpdateText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
    marginTop: 10,
  },
  tipContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    marginLeft: 10,
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 30,
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

export default LightSensorScreen; 