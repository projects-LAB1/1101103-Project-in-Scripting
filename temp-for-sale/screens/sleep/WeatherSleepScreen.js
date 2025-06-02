import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Title, Paragraph, Button, ProgressBar } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getWeatherData, 
  getWeatherForecast,
  selectCurrentWeather,
  selectWeatherForecast,
  selectSleepImpact,
  selectWeatherLoading,
  selectWeatherError,
  selectLastUpdated,
} from '../../redux/slices/weatherSlice';

const WeatherSleepScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  // Redux selectors
  const currentWeather = useSelector(selectCurrentWeather);
  const weatherForecast = useSelector(selectWeatherForecast);
  const sleepImpact = useSelector(selectSleepImpact);
  const loading = useSelector(selectWeatherLoading);
  const error = useSelector(selectWeatherError);
  const lastUpdated = useSelector(selectLastUpdated);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  // โหลดข้อมูลสภาพอากาศเมื่อหน้าจอโหลด
  useEffect(() => {
    loadWeatherData();
  }, [dispatch]);
  
  // โหลดข้อมูลสภาพอากาศ
  const loadWeatherData = async () => {
    try {
      const resultAction = await dispatch(getWeatherData());
      
      if (getWeatherData.rejected.match(resultAction)) {
        if (resultAction.payload === 'ไม่สามารถรับพิกัดปัจจุบันได้') {
          setPermissionError(true);
          
          Alert.alert(
            'ไม่สามารถเข้าถึงตำแหน่งได้',
            'กรุณาเปิดการเข้าถึงตำแหน่งในการตั้งค่าเพื่อดูข้อมูลสภาพอากาศ',
            [
              { text: 'ยกเลิก', style: 'cancel' },
              { 
                text: 'ไปที่การตั้งค่า', 
                onPress: openLocationSettings
              }
            ]
          );
          return;
        }
      } else {
        // โหลดพยากรณ์อากาศหลังจากโหลดข้อมูลปัจจุบันสำเร็จ
        dispatch(getWeatherForecast());
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };
  
  // เปิดการตั้งค่าตำแหน่ง
  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };
  
  // รีเฟรชข้อมูล
  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };
  
  // แปลงรหัสไอคอนเป็น URL
  const getWeatherIconUrl = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };
  
  // ฟอร์แมตวันที่
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' };
    return date.toLocaleDateString('th-TH', options);
  };
  
  // ฟอร์แมตเวลาล่าสุดที่อัปเดต
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'เมื่อสักครู่';
    } else if (diffMins < 60) {
      return `${diffMins} นาทีที่แล้ว`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} ชั่วโมงที่แล้ว`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} วันที่แล้ว`;
    }
  };
  
  // สีตามคะแนนคุณภาพการนอน
  const getSleepQualityColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  };
  
  // ข้อความตามคะแนนคุณภาพการนอน
  const getSleepQualityText = (score) => {
    if (score >= 80) return 'ดีมาก';
    if (score >= 60) return 'ดี';
    if (score >= 40) return 'ปานกลาง';
    if (score >= 20) return 'ไม่ค่อยดี';
    return 'แย่';
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : ['#e0f2f1', '#b2dfdb']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>สภาพอากาศและการนอนหลับ</Title>
        <Paragraph style={styles.headerDescription}>
          ตรวจสอบสภาพอากาศและผลกระทบต่อการนอนหลับของคุณ
        </Paragraph>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.colors.primary]}
          />
        }
      >
        {permissionError ? (
          <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Card.Content>
              <View style={styles.permissionErrorContainer}>
                <MaterialCommunityIcons name="map-marker-off" size={56} color={theme.colors.error} />
                <Text style={[styles.permissionErrorText, { color: theme.colors.text }]}>
                  ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้
                </Text>
                <Text style={[styles.permissionErrorDescription, { color: theme.colors.text }]}>
                  กรุณาเปิดการเข้าถึงตำแหน่งในการตั้งค่าเพื่อดูข้อมูลสภาพอากาศ
                </Text>
                <Button 
                  mode="contained" 
                  onPress={openLocationSettings}
                  style={styles.permissionButton}
                  color={theme.colors.primary}
                >
                  ไปที่การตั้งค่า
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : error ? (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.error }]}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button 
                mode="contained" 
                onPress={loadWeatherData}
                style={styles.retryButton}
                color="#FFFFFF"
              >
                ลองใหม่
              </Button>
            </Card.Content>
          </Card>
        ) : loading && !currentWeather ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              กำลังโหลดข้อมูลสภาพอากาศ...
            </Text>
          </View>
        ) : currentWeather ? (
          <>
            {/* ข้อมูลสภาพอากาศปัจจุบัน */}
            <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Card.Content>
                <View style={styles.weatherHeaderContainer}>
                  <View>
                    <Title style={{ color: theme.colors.text }}>
                      {currentWeather.city || 'ไม่ทราบตำแหน่ง'}
                    </Title>
                    <Text style={[styles.countryText, { color: theme.colors.text }]}>
                      {currentWeather.country || ''}
                    </Text>
                  </View>
                  <Text style={[styles.lastUpdatedText, { color: theme.colors.text }]}>
                    อัปเดตล่าสุด: {formatLastUpdated(lastUpdated)}
                  </Text>
                </View>
                
                <View style={styles.currentWeatherContainer}>
                  <Image 
                    source={{ uri: getWeatherIconUrl(currentWeather.icon) }}
                    style={styles.weatherIcon}
                  />
                  <View style={styles.weatherDetailsContainer}>
                    <Text style={[styles.temperatureText, { color: theme.colors.text }]}>
                      {Math.round(currentWeather.temperature)}°C
                    </Text>
                    <Text style={[styles.weatherDescription, { color: theme.colors.text }]}>
                      {currentWeather.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.weatherAttributesContainer}>
                  <View style={styles.weatherAttribute}>
                    <MaterialCommunityIcons name="thermometer" size={20} color={theme.colors.primary} />
                    <Text style={[styles.attributeLabel, { color: theme.colors.text }]}>
                      รู้สึกเหมือน
                    </Text>
                    <Text style={[styles.attributeValue, { color: theme.colors.text }]}>
                      {Math.round(currentWeather.feelsLike)}°C
                    </Text>
                  </View>
                  
                  <View style={styles.weatherAttribute}>
                    <MaterialCommunityIcons name="water-percent" size={20} color={theme.colors.primary} />
                    <Text style={[styles.attributeLabel, { color: theme.colors.text }]}>
                      ความชื้น
                    </Text>
                    <Text style={[styles.attributeValue, { color: theme.colors.text }]}>
                      {currentWeather.humidity}%
                    </Text>
                  </View>
                  
                  <View style={styles.weatherAttribute}>
                    <MaterialCommunityIcons name="weather-windy" size={20} color={theme.colors.primary} />
                    <Text style={[styles.attributeLabel, { color: theme.colors.text }]}>
                      ความเร็วลม
                    </Text>
                    <Text style={[styles.attributeValue, { color: theme.colors.text }]}>
                      {currentWeather.windSpeed} m/s
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
            
            {/* ผลกระทบต่อการนอนหลับ */}
            {sleepImpact && (
              <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                  <Title style={{ color: theme.colors.text }}>ผลกระทบต่อการนอนหลับ</Title>
                  
                  <View style={styles.sleepQualityContainer}>
                    <View style={styles.sleepQualityScoreContainer}>
                      <Text style={[styles.sleepQualityScore, { color: getSleepQualityColor(sleepImpact.sleepQualityScore) }]}>
                        {Math.round(sleepImpact.sleepQualityScore)}%
                      </Text>
                      <Text style={[styles.sleepQualityLabel, { color: theme.colors.text }]}>
                        คะแนนคุณภาพการนอน
                      </Text>
                      <Text style={[styles.sleepQualityDescription, { color: theme.colors.text }]}>
                        {getSleepQualityText(sleepImpact.sleepQualityScore)}
                      </Text>
                    </View>
                    
                    <ProgressBar 
                      progress={sleepImpact.sleepQualityScore / 100} 
                      color={getSleepQualityColor(sleepImpact.sleepQualityScore)} 
                      style={styles.sleepQualityProgressBar} 
                    />
                  </View>
                  
                  <View style={styles.impactDetailsContainer}>
                    <Text style={[styles.impactSectionTitle, { color: theme.colors.text }]}>
                      รายละเอียดผลกระทบ
                    </Text>
                    
                    {sleepImpact.impactDetails.map((detail, index) => (
                      <View key={`impact-${index}`} style={styles.impactDetailItem}>
                        <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.primary} />
                        <Text style={[styles.impactDetailText, { color: theme.colors.text }]}>
                          {detail}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.recommendationsContainer}>
                    <Text style={[styles.impactSectionTitle, { color: theme.colors.text }]}>
                      คำแนะนำสำหรับการนอนหลับที่ดีขึ้น
                    </Text>
                    
                    {sleepImpact.recommendations.map((recommendation, index) => (
                      <View key={`rec-${index}`} style={styles.recommendationItem}>
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color={theme.colors.primary} />
                        <Text style={[styles.recommendationText, { color: theme.colors.text }]}>
                          {recommendation}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            )}
            
            {/* พยากรณ์อากาศกลางคืน */}
            {weatherForecast && weatherForecast.forecast && weatherForecast.forecast.length > 0 && (
              <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                  <Title style={{ color: theme.colors.text }}>พยากรณ์อากาศกลางคืน</Title>
                  <Paragraph style={{ color: theme.colors.text, marginBottom: 10 }}>
                    พยากรณ์อากาศสำหรับช่วงกลางคืน (18:00 - 06:00) ในวันถัดไป
                  </Paragraph>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScrollView}>
                    {weatherForecast.forecast.slice(0, 8).map((item, index) => {
                      const forecastDate = new Date(item.date);
                      const hour = forecastDate.getHours();
                      const day = forecastDate.getDate();
                      const month = forecastDate.getMonth() + 1;
                      
                      return (
                        <View key={`forecast-${index}`} style={styles.forecastItem}>
                          <Text style={[styles.forecastTime, { color: theme.colors.text }]}>
                            {hour}:00
                          </Text>
                          <Text style={[styles.forecastDate, { color: theme.colors.text }]}>
                            {day}/{month}
                          </Text>
                          <Image 
                            source={{ uri: getWeatherIconUrl(item.icon) }}
                            style={styles.forecastIcon}
                          />
                          <Text style={[styles.forecastTemp, { color: theme.colors.text }]}>
                            {Math.round(item.temperature)}°C
                          </Text>
                          <Text style={[styles.forecastDescription, { color: theme.colors.text }]}>
                            {item.description}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </Card.Content>
              </Card>
            )}
            
            <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Card.Content>
                <Title style={{ color: theme.colors.text }}>เกี่ยวกับสภาพอากาศและการนอนหลับ</Title>
                <Paragraph style={{ color: theme.colors.text, marginTop: 10 }}>
                  สภาพอากาศมีผลกระทบโดยตรงต่อคุณภาพการนอนหลับของเรา อุณหภูมิที่เหมาะสมสำหรับการนอนอยู่ระหว่าง 18-22 องศาเซลเซียส 
                  ความชื้นที่เหมาะสมอยู่ระหว่าง 30-50%
                </Paragraph>
                
                <View style={styles.tipsContainer}>
                  <View style={styles.tipItem}>
                    <MaterialCommunityIcons name="thermometer" size={18} color={theme.colors.primary} />
                    <Text style={[styles.tipText, { color: theme.colors.text }]}>
                      อุณหภูมิห้องที่ต่ำกว่า 24°C จะช่วยให้นอนหลับได้ดีขึ้น
                    </Text>
                  </View>
                  
                  <View style={styles.tipItem}>
                    <MaterialCommunityIcons name="weather-night" size={18} color={theme.colors.primary} />
                    <Text style={[styles.tipText, { color: theme.colors.text }]}>
                      อากาศที่หนาวเย็นเกินไปหรือร้อนเกินไปจะรบกวนการนอนหลับ
                    </Text>
                  </View>
                  
                  <View style={styles.tipItem}>
                    <MaterialCommunityIcons name="water-percent" size={18} color={theme.colors.primary} />
                    <Text style={[styles.tipText, { color: theme.colors.text }]}>
                      ความชื้นสูงทำให้รู้สึกอึดอัดและนอนไม่สบาย ควรใช้เครื่องปรับอากาศ
                    </Text>
                  </View>
                  
                  <View style={styles.tipItem}>
                    <MaterialCommunityIcons name="weather-pouring" size={18} color={theme.colors.primary} />
                    <Text style={[styles.tipText, { color: theme.colors.text }]}>
                      เสียงฝนตกเบาๆ ช่วยให้ผ่อนคลายและนอนหลับได้ง่ายขึ้น
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="weather-cloudy-alert" size={64} color={theme.colors.text} />
            <Text style={[styles.noDataText, { color: theme.colors.text }]}>
              ไม่พบข้อมูลสภาพอากาศ
            </Text>
            <Text style={[styles.noDataDescription, { color: theme.colors.text }]}>
              ลองรีเฟรชหน้านี้เพื่อโหลดข้อมูลใหม่
            </Text>
            <Button 
              mode="contained" 
              onPress={loadWeatherData}
              style={styles.retryButton}
              color={theme.colors.primary}
            >
              โหลดข้อมูลใหม่
            </Button>
          </View>
        )}
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
  weatherHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  countryText: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastUpdatedText: {
    fontSize: 12,
    opacity: 0.7,
  },
  currentWeatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  weatherDetailsContainer: {
    marginLeft: 10,
  },
  temperatureText: {
    fontSize: 36,
    fontWeight: '200',
  },
  weatherDescription: {
    fontSize: 16,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  weatherAttributesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  weatherAttribute: {
    flex: 1,
    alignItems: 'center',
  },
  attributeLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  attributeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 3,
  },
  sleepQualityContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  sleepQualityScoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  sleepQualityScore: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  sleepQualityLabel: {
    fontSize: 14,
    marginTop: 5,
  },
  sleepQualityDescription: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  sleepQualityProgressBar: {
    height: 10,
    borderRadius: 5,
  },
  impactDetailsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  impactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  impactDetailItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  impactDetailText: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsContainer: {
    marginTop: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  recommendationText: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  forecastScrollView: {
    marginTop: 10,
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 90,
  },
  forecastTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  forecastDate: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5,
  },
  forecastIcon: {
    width: 50,
    height: 50,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: '600',
  },
  forecastDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    textTransform: 'capitalize',
  },
  tipsContainer: {
    marginTop: 15,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
  },
  noDataDescription: {
    marginTop: 10,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorCard: {
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    marginBottom: 15,
  },
  retryButton: {
    marginTop: 10,
  },
  permissionErrorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  permissionErrorText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
  },
  permissionErrorDescription: {
    marginTop: 10,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
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

export default WeatherSleepScreen; 