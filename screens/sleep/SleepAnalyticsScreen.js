import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSleep } from '../../contexts/SleepContext';
import { LineChart } from 'react-native-chart-kit';
import { analyzeSleepPatterns, detectSleepIssues } from '../../utils/sleepAI';

const { width } = Dimensions.get('window');

const SleepAnalyticsScreen = ({ navigation }) => {
  const { sleepRecords, sleepAnalytics, refresh, refreshing, sleepGoals } = useSleep();
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'
  const [chartData, setChartData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [sleepIssues, setSleepIssues] = useState([]);
  
  // Prepare chart data when sleepRecords or selectedPeriod changes
  useEffect(() => {
    if (sleepRecords && sleepRecords.length > 0) {
      prepareChartData();
      
      try {
        // AI Analysis
        const analysis = analyzeSleepPatterns(sleepRecords, sleepGoals);
        setAiAnalysis(analysis);
        
        // Detect potential sleep issues
        const issues = detectSleepIssues(sleepRecords);
        setSleepIssues(issues);
      } catch (error) {
        console.error('Error analyzing sleep patterns:', error);
        // Set default values if analysis fails
        setAiAnalysis({
          message: 'ไม่สามารถวิเคราะห์ข้อมูลการนอนได้ในขณะนี้',
          insights: [],
          recommendations: ['ลองรีเฟรชหน้านี้ใหม่อีกครั้ง'],
          stats: {
            averageDurationHours: '0.0',
            consistencyScore: 0,
            daysAnalyzed: 0
          }
        });
        setSleepIssues([]);
      }
    }
  }, [sleepRecords, selectedPeriod, sleepGoals]);
  
  // Format time as HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Get quality level color
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent':
        return '#4CAF50';
      case 'very good':
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FFC107';
      case 'poor':
        return '#FF9800';
      case 'very poor':
        return '#FF5722';
      default:
        return '#999999';
    }
  };
  
  // Get consistency level color
  const getConsistencyColor = (consistency) => {
    switch (consistency) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FFC107';
      case 'poor':
        return '#FF5722';
      default:
        return '#999999';
    }
  };

  // Prepare chart data based on selected period
  const prepareChartData = () => {
    // Sort records by bed time
    const sortedRecords = [...sleepRecords].sort((a, b) => 
      new Date(a.bedTime) - new Date(b.bedTime)
    );
    
    // Filter records based on selected period
    const now = new Date();
    let filteredRecords = [];
    
    if (selectedPeriod === 'week') {
      // Last 7 days
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      filteredRecords = sortedRecords.filter(record => 
        new Date(record.bedTime) >= sevenDaysAgo
      );
    } else if (selectedPeriod === 'month') {
      // Last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      filteredRecords = sortedRecords.filter(record => 
        new Date(record.bedTime) >= thirtyDaysAgo
      );
    } else {
      // Last 365 days, but only show monthly data points
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      
      filteredRecords = sortedRecords.filter(record => 
        new Date(record.bedTime) >= yearAgo
      );
    }
    
    // If no records found for the selected period, return empty chart data
    if (filteredRecords.length === 0) {
      setChartData(null);
      return;
    }
    
    // Prepare labels and data for the chart
    let labels = [];
    let durationData = [];
    let qualityData = [];
    
    if (selectedPeriod === 'week') {
      // Group data by day
      const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      const dayData = Array(7).fill(null).map(() => ({ count: 0, duration: 0, quality: 0 }));
      
      filteredRecords.forEach(record => {
        const date = new Date(record.bedTime);
        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        
        dayData[dayIndex].count++;
        dayData[dayIndex].duration += record.durationMinutes / 60; // Convert to hours
        dayData[dayIndex].quality += Math.round((record.durationMinutes / 480) * 100); // Simple quality metric
      });
      
      // Calculate averages and prepare data
      dayNames.forEach((day, index) => {
        labels.push(day);
        
        if (dayData[index].count > 0) {
          durationData.push(parseFloat((dayData[index].duration / dayData[index].count).toFixed(1)));
          qualityData.push(Math.round(dayData[index].quality / dayData[index].count));
        } else {
          durationData.push(null);
          qualityData.push(null);
        }
      });
    } else if (selectedPeriod === 'month') {
      // Last 4 weeks
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (i * 7));
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        
        weeks.push({
          start: startDate,
          end: endDate,
          label: `W${4-i}`,
          records: [],
        });
      }
      
      // Group records by week
      filteredRecords.forEach(record => {
        const recordDate = new Date(record.bedTime);
        
        for (const week of weeks) {
          if (recordDate >= week.start && recordDate <= week.end) {
            week.records.push(record);
            break;
          }
        }
      });
      
      // Calculate averages and prepare data
      weeks.reverse().forEach(week => {
        labels.push(week.label);
        
        if (week.records.length > 0) {
          const totalDuration = week.records.reduce((sum, record) => sum + record.durationMinutes, 0);
          const totalQuality = week.records.reduce((sum, record) => 
            sum + Math.round((record.durationMinutes / 480) * 100), 0);
          
          durationData.push(parseFloat((totalDuration / week.records.length / 60).toFixed(1)));
          qualityData.push(Math.round(totalQuality / week.records.length));
        } else {
          durationData.push(null);
          qualityData.push(null);
        }
      });
    } else {
      // Last 12 months
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        
        const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
        months.push({
          year: date.getFullYear(),
          month: date.getMonth(),
          label: monthName,
          records: [],
        });
      }
      
      // Group records by month
      filteredRecords.forEach(record => {
        const recordDate = new Date(record.bedTime);
        
        for (const month of months) {
          if (recordDate.getFullYear() === month.year && recordDate.getMonth() === month.month) {
            month.records.push(record);
            break;
          }
        }
      });
      
      // Calculate averages and prepare data
      months.reverse().forEach(month => {
        labels.push(month.label);
        
        if (month.records.length > 0) {
          const totalDuration = month.records.reduce((sum, record) => sum + record.durationMinutes, 0);
          const totalQuality = month.records.reduce((sum, record) => 
            sum + Math.round((record.durationMinutes / 480) * 100), 0);
          
          durationData.push(parseFloat((totalDuration / month.records.length / 60).toFixed(1)));
          qualityData.push(Math.round(totalQuality / month.records.length));
        } else {
          durationData.push(null);
          qualityData.push(null);
        }
      });
    }
    
    setChartData({
      labels,
      durationData,
      qualityData,
    });
  };

  // Render
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#FF9500']} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.selectedPeriodText,
              ]}
            >
              สัปดาห์
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.selectedPeriodText,
              ]}
            >
              เดือน
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'year' && styles.selectedPeriodButton,
            ]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'year' && styles.selectedPeriodText,
              ]}
            >
              ปี
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Analysis Card */}
        <View style={styles.aiAnalysisCard}>
          <View style={styles.aiHeaderContainer}>
            <MaterialCommunityIcons name="brain" size={24} color="#0A84FF" />
            <Text style={styles.aiCardTitle}>วิเคราะห์การนอนด้วย AI</Text>
          </View>
          
          {aiAnalysis ? (
            <View style={styles.aiContentContainer}>
              <Text style={styles.aiMessageText}>{aiAnalysis.message || 'ไม่มีข้อมูลการวิเคราะห์'}</Text>
              
              {/* AI Insights */}
              <View style={styles.aiSection}>
                <Text style={styles.aiSectionTitle}>ข้อมูลเชิงลึก</Text>
                {(aiAnalysis.insights || []).map((insight, index) => (
                  <View key={`insight-${index}`} style={styles.aiItem}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#0A84FF" />
                    <Text style={styles.aiItemText}>{insight}</Text>
                  </View>
                ))}
              </View>
              
              {/* AI Recommendations */}
              <View style={styles.aiSection}>
                <Text style={styles.aiSectionTitle}>คำแนะนำ</Text>
                {(aiAnalysis.recommendations || []).map((recommendation, index) => (
                  <View key={`recommendation-${index}`} style={styles.aiItem}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4CAF50" />
                    <Text style={styles.aiItemText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
              
              {/* Sleep Issues Warning */}
              {sleepIssues && sleepIssues.length > 0 && (
                <View style={styles.sleepIssuesContainer}>
                  <Text style={styles.sleepIssuesTitle}>ข้อควรระวัง</Text>
                  {sleepIssues.map((issue, index) => (
                    <View key={`issue-${index}`} style={styles.sleepIssueItem}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF5722" />
                      <Text style={styles.sleepIssueText}>{issue.message}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.aiStatsContainer}>
                <View style={styles.aiStatItem}>
                  <Text style={styles.aiStatLabel}>ระยะเวลานอนเฉลี่ย</Text>
                  <Text style={styles.aiStatValue}>{aiAnalysis.stats?.averageDurationHours || '0.0'} ชั่วโมง</Text>
                </View>
                
                <View style={styles.aiStatItem}>
                  <Text style={styles.aiStatLabel}>ความสม่ำเสมอ</Text>
                  <Text style={styles.aiStatValue}>{aiAnalysis.stats?.consistencyScore || 0}%</Text>
                </View>
                
                <View style={styles.aiStatItem}>
                  <Text style={styles.aiStatLabel}>จำนวนวันที่วิเคราะห์</Text>
                  <Text style={styles.aiStatValue}>{aiAnalysis.stats?.daysAnalyzed || 0} วัน</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์</Text>
              <Text style={styles.noDataSubText}>เพิ่มข้อมูลการนอนอย่างน้อย 3 วันเพื่อรับการวิเคราะห์จาก AI</Text>
            </View>
          )}
        </View>
        
        {/* Sleep Duration Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>ระยะเวลาการนอน (ชั่วโมง)</Text>
          
          {chartData ? (
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.durationData.map(value => value === null ? 0 : value),
                    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 40}
              height={180}
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
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก</Text>
            </View>
          )}
        </View>
        
        {/* Sleep Quality Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>คะแนนคุณภาพการนอนหลับ</Text>
          
          {chartData ? (
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.qualityData.map(value => value === null ? 0 : value),
                    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 40}
              height={180}
              chartConfig={{
                backgroundColor: '#1C1C1E',
                backgroundGradientFrom: '#1C1C1E',
                backgroundGradientTo: '#1C1C1E',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#0A84FF',
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก</Text>
            </View>
          )}
        </View>
        
        {/* Sleep Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>ข้อมูลเชิงลึก</Text>
          
          {sleepAnalytics ? (
            <View style={styles.insightsContent}>
              {/* Average Sleep Duration */}
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <MaterialCommunityIcons name="clock-time-eight-outline" size={24} color="#FF9500" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightLabel}>ระยะเวลาการนอนเฉลี่ย</Text>
                  <Text style={styles.insightValue}>{sleepAnalytics.avgDurationHours} ชั่วโมง</Text>
                </View>
              </View>
              
              {/* Average Bed Time */}
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <MaterialCommunityIcons name="bed" size={24} color="#FF9500" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightLabel}>เวลาเข้านอนเฉลี่ย</Text>
                  <Text style={styles.insightValue}>{formatTime(sleepAnalytics.avgBedTime)}</Text>
                </View>
              </View>
              
              {/* Sleep Quality */}
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <MaterialCommunityIcons name="star-outline" size={24} color="#FF9500" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightLabel}>คุณภาพการนอน</Text>
                  <View style={styles.qualityContainer}>
                    <View 
                      style={[
                        styles.qualityIndicator, 
                        { backgroundColor: getQualityColor(sleepAnalytics.qualityLevel) }
                      ]}
                    />
                    <Text style={styles.insightValue}>
                      {sleepAnalytics.qualityLevel === 'excellent' ? 'ดีเยี่ยม' : 
                       sleepAnalytics.qualityLevel === 'very good' ? 'ดีมาก' : 
                       sleepAnalytics.qualityLevel === 'good' ? 'ดี' : 
                       sleepAnalytics.qualityLevel === 'fair' ? 'พอใช้' : 
                       sleepAnalytics.qualityLevel === 'poor' ? 'ไม่ดี' : 'แย่'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Sleep Consistency */}
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#FF9500" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightLabel}>ความสม่ำเสมอในการนอน</Text>
                  <View style={styles.qualityContainer}>
                    <View 
                      style={[
                        styles.qualityIndicator, 
                        { backgroundColor: getConsistencyColor(sleepAnalytics.consistency) }
                      ]}
                    />
                    <Text style={styles.insightValue}>
                      {sleepAnalytics.consistency === 'excellent' ? 'ดีเยี่ยม' : 
                       sleepAnalytics.consistency === 'good' ? 'ดี' : 
                       sleepAnalytics.consistency === 'fair' ? 'พอใช้' : 'ไม่ดี'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Recent Trend */}
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <MaterialCommunityIcons 
                    name={
                      sleepAnalytics.recentTrend === 'positive' ? 'trending-up' : 
                      sleepAnalytics.recentTrend === 'negative' ? 'trending-down' : 'trending-neutral'
                    } 
                    size={24} 
                    color="#FF9500" 
                  />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightLabel}>แนวโน้มล่าสุด</Text>
                  <Text style={styles.insightValue}>
                    {sleepAnalytics.recentTrend === 'positive' ? 'กำลังดีขึ้น' : 
                     sleepAnalytics.recentTrend === 'negative' ? 'กำลังแย่ลง' : 'คงที่'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์</Text>
              <Text style={styles.noDataSubText}>เพิ่มข้อมูลการนอนอย่างน้อย 5 รายการเพื่อดูผลการวิเคราะห์</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#333333',
  },
  periodButtonText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  aiAnalysisCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
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
  aiContentContainer: {
    
  },
  aiMessageText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 22,
  },
  aiSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  aiSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A84FF',
    marginBottom: 12,
  },
  aiItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  aiItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  aiStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  aiStatItem: {
    width: '48%',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  aiStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  aiStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sleepIssuesContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  sleepIssuesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF5722',
    marginBottom: 12,
  },
  sleepIssueItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  sleepIssueText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  insightsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  insightsContent: {
    
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default SleepAnalyticsScreen; 