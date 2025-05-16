import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDailyRecommendation } from '../../utils/sleepAI';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const SleepHomeScreen = ({ navigation }) => {
  const { 
    sleepRecords, 
    sleepAnalytics, 
    sleepGoals,
    loading, 
    refreshing, 
    refresh,
    getWeeklySummary
  } = useSleep();

  const [weeklySummary, setWeeklySummary] = useState(null);
  const [dailyRecommendation, setDailyRecommendation] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [trendDescription, setTrendDescription] = useState('');
  
  useEffect(() => {
    // Calculate weekly summary when sleepRecords change
    if (sleepRecords.length > 0) {
      const summary = getWeeklySummary();
      setWeeklySummary(summary);
      
      try {
        // Get daily recommendation from AI
        const sortedRecords = [...sleepRecords].sort((a, b) => 
          new Date(b.bedTime) - new Date(a.bedTime)
        );
        
        const latestRecord = sortedRecords[0];
        const recommendation = getDailyRecommendation(latestRecord, sleepGoals, sleepAnalytics);
        setDailyRecommendation(recommendation);
        
        // Prepare chart data
        prepareChartData(sleepRecords);
      } catch (error) {
        console.error('Error getting daily recommendation:', error);
        // Set default recommendation if fails
        setDailyRecommendation({
          title: 'คำแนะนำประจำวัน',
          message: 'ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้ ลองบันทึกข้อมูลการนอนเพิ่มเติม',
          actionItems: []
        });
      }
    }
  }, [sleepRecords, sleepGoals, sleepAnalytics]);
  
  // Prepare chart data
  const prepareChartData = (records) => {
    if (!records || records.length === 0) {
      setChartData(null);
      setTrendDescription('');
      return;
    }
    
    // Sort records by bed time
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.bedTime) - new Date(b.bedTime)
    );
    
    // Filter for the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const filteredRecords = sortedRecords.filter(record => 
      new Date(record.bedTime) >= sevenDaysAgo
    );
    
    // Group data by day
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const dayData = Array(7).fill(null).map(() => ({ count: 0, duration: 0 }));
    
    filteredRecords.forEach(record => {
      const date = new Date(record.bedTime);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
      
      dayData[dayIndex].count++;
      dayData[dayIndex].duration += record.durationMinutes / 60; // Convert to hours
    });
    
    // Calculate averages and prepare data
    const labels = [];
    const durationData = [];
    
    dayNames.forEach((day, index) => {
      labels.push(day);
      
      if (dayData[index].count > 0) {
        durationData.push(parseFloat((dayData[index].duration / dayData[index].count).toFixed(1)));
      } else {
        durationData.push(0);
      }
    });
    
    setChartData({ labels, durationData });
    
    // Generate trend description
    generateTrendDescription(durationData);
  };
  
  // Generate a description of the sleep trend
  const generateTrendDescription = (durationData) => {
    // Filter out zeros
    const validData = durationData.filter(value => value > 0);
    
    if (validData.length < 2) {
      setTrendDescription('ข้อมูลยังไม่เพียงพอสำหรับการวิเคราะห์แนวโน้ม');
      return;
    }
    
    // Calculate average
    const average = validData.reduce((sum, value) => sum + value, 0) / validData.length;
    const avgRounded = average.toFixed(1);
    
    // Check if trend is increasing or decreasing
    const firstHalf = validData.slice(0, Math.ceil(validData.length / 2));
    const secondHalf = validData.slice(Math.ceil(validData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length;
    
    let trendText = '';
    const diff = secondHalfAvg - firstHalfAvg;
    
    if (diff > 0.5) {
      trendText = `ระยะเวลาการนอนช่วงนี้เพิ่มขึ้น (เฉลี่ย ${avgRounded} ชั่วโมง/วัน)`;
    } else if (diff < -0.5) {
      trendText = `ระยะเวลาการนอนช่วงนี้ลดลง (เฉลี่ย ${avgRounded} ชั่วโมง/วัน)`;
    } else {
      trendText = `ระยะเวลาการนอนค่อนข้างคงที่ (เฉลี่ย ${avgRounded} ชั่วโมง/วัน)`;
    }
    
    // Check sleep health
    let healthText = '';
    if (average >= 7) {
      healthText = 'เวลานอนของคุณอยู่ในเกณฑ์ดีมาก ช่วยให้ร่างกายได้พักผ่อนเพียงพอ';
    } else if (average >= 6) {
      healthText = 'เวลานอนของคุณค่อนข้างดี แต่ควรพยายามนอนให้ได้ 7-8 ชั่วโมงเพื่อสุขภาพที่ดี';
    } else if (average >= 5) {
      healthText = 'เวลานอนของคุณอยู่ในเกณฑ์พอใช้ ควรพยายามนอนให้ได้มากกว่านี้';
    } else {
      healthText = 'เวลานอนของคุณน้อยเกินไป อาจส่งผลเสียต่อสุขภาพในระยะยาว';
    }
    
    setTrendDescription(`${trendText} ${healthText}`);
  };
  
  // Format time as HH:MM
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Format date as day month
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('th-TH', options);
  };
  
  // Format duration as H hr M min
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} นาที`;
    } else if (mins === 0) {
      return `${hours} ชั่วโมง`;
    } else {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
  };
    // Helper functions removed as they are no longer needed

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#FF9500']} />
        }
      >
        {/* AI Daily Recommendation */}
        {dailyRecommendation && (
          <View style={styles.aiRecommendationCard}>
            <View style={styles.aiHeaderContainer}>
              <MaterialCommunityIcons name="brain" size={24} color="#0A84FF" />
              <Text style={styles.aiCardTitle}>คำแนะนำประจำวัน</Text>
            </View>
            
            <Text style={styles.aiRecommendationTitle}>{dailyRecommendation.title || 'คำแนะนำประจำวัน'}</Text>
            <Text style={styles.aiRecommendationMessage}>{dailyRecommendation.message || 'ไม่มีข้อมูลเพียงพอ'}</Text>
            
            {dailyRecommendation.actionItems && dailyRecommendation.actionItems.length > 0 && (
              <View style={styles.aiActionItemsContainer}>
                {dailyRecommendation.actionItems.map((item, index) => (
                  <View key={`action-${index}`} style={styles.aiActionItem}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color="#0A84FF" />
                    <Text style={styles.aiActionItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.aiViewMoreButton}
              onPress={() => navigation.navigate('SleepAnalytics')}
            >
              <Text style={styles.aiViewMoreButtonText}>ดูการวิเคราะห์เพิ่มเติม</Text>
              <View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#0A84FF" />
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Sleep summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>สรุปการนอนหลับ</Text>
          
          {sleepAnalytics ? (
            <View style={styles.analyticsContainer}>
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>
                  {sleepAnalytics.avgDurationHours || sleepAnalytics.stats?.averageDurationHours || '0.0'}
                </Text>
                <Text style={styles.analyticLabel}>ชั่วโมง/วัน</Text>
              </View>
              
              <View style={styles.analyticDivider} />
              
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>
                  {formatTime(sleepAnalytics.avgBedTime) || '--:--'}
                </Text>
                <Text style={styles.analyticLabel}>เวลาเข้านอนเฉลี่ย</Text>
              </View>
              
              <View style={styles.analyticDivider} />
              
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>
                  {sleepAnalytics.consistencyScore || 0}%
                </Text>
                <Text style={styles.analyticLabel}>ความสม่ำเสมอ</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์</Text>
          )}
          
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('SleepAnalytics')}
          >
            <Text style={styles.viewMoreButtonText}>ดูการวิเคราะห์ทั้งหมด</Text>
            <View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#0A84FF" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Sleep Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderContainer}>
            <Text style={styles.chartTitle}>ระยะเวลานอนหลับ 7 วันล่าสุด</Text>
            <View style={styles.chartLegendContainer}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, {backgroundColor: '#FF9500'}]}></View>
                <Text style={styles.chartLegendText}>ชั่วโมงการนอน</Text>
              </View>
            </View>
          </View>
          
          {chartData ? (
            <>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.durationData,
                      color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={width - 40}
                height={180}
                yAxisSuffix=" ชม."
                chartConfig={{
                  backgroundColor: '#1C1C1E',
                  backgroundGradientFrom: '#1C1C1E',
                  backgroundGradientTo: '#1C1C1E',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#FF9500',
                  },
                  propsForLabels: {
                    fontSize: 12,
                  }
                }}
                bezier
                style={styles.chart}
              />
              
              <View style={styles.chartInfoContainer}>
                <View style={styles.chartInfoIconContainer}>
                  <MaterialCommunityIcons name="information" size={22} color="#FF9500" />
                </View>
                <Text style={styles.chartInfoText}>กราฟแสดงจำนวนชั่วโมงการนอนแต่ละวัน</Text>
              </View>
              
              {trendDescription ? (
                <View style={styles.trendContainer}>
                  <Text style={styles.trendText}>{trendDescription}</Text>
                </View>
              ) : null}
              
              <View style={styles.chartHelpContainer}>
                <Text style={styles.chartHelpText}>• แตะที่จุดบนกราฟเพื่อดูข้อมูลในแต่ละวัน</Text>
                <Text style={styles.chartHelpText}>• วันที่ไม่มีจุดหมายถึงไม่มีข้อมูลการนอนในวันนั้น</Text>
                <Text style={styles.chartHelpText}>• เส้นสีส้มแสดงถึงจำนวนชั่วโมงการนอนในแต่ละวัน</Text>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>ไม่มีข้อมูลสำหรับการแสดงกราฟ</Text>
              <Text style={styles.noDataHelpText}>เพิ่มข้อมูลการนอนเพื่อดูกราฟการนอนหลับของคุณ</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('SleepHistory')}
          >
            <Text style={styles.viewMoreButtonText}>ดูประวัติการนอนทั้งหมด</Text>
            <View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#0A84FF" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Sleep Goals Card */}
        <TouchableOpacity 
          style={styles.goalsCard}
          onPress={() => navigation.navigate('SleepGoals')}
        >
          <View style={styles.goalsCardContent}>
            <View style={styles.goalsIconContainer}>
              <MaterialCommunityIcons name="flag-outline" size={28} color="#FF9500" />
            </View>
            <View style={styles.goalsTextContainer}>
              <Text style={styles.goalsTitle}>เป้าหมายการนอน</Text>
              <Text style={styles.goalsSubtitle}>ตั้งค่าเป้าหมายการนอนหลับและรูปแบบการนอน</Text>
            </View>
            <View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666666" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiRecommendationCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  aiHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  aiRecommendationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  aiRecommendationMessage: {
    fontSize: 15,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 22,
  },
  aiActionItemsContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  aiActionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  aiActionItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  aiViewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  aiViewMoreButtonText: {
    fontSize: 15,
    color: '#0A84FF',
    marginRight: 4,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  analyticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  analyticItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticValue: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  analyticLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  analyticDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333333',
  },
  noDataText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    marginVertical: 16,
  },
  noDataHelpText: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    marginTop: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  viewMoreButtonText: {
    fontSize: 15,
    color: '#0A84FF',
    marginRight: 4,
  },
  chartCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
  },
  chartHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartLegendContainer: {
    flexDirection: 'row',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  chartLegendText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  chartInfoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  chartInfoIconContainer: {
    marginRight: 10,
  },
  chartInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  trendContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  trendText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  chartHelpContainer: {
    marginTop: 8,
  },
  chartHelpText: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 20,
  },
  noDataContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  goalsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  goalsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalsTextContainer: {
    flex: 1,
  },
  goalsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goalsSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
  },
});

export default SleepHomeScreen; 