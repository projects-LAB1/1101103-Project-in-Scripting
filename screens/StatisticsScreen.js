// StatisticsScreen.js - หน้าแสดงสถิติการตื่นนอน
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Dimensions, TouchableOpacity
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StatisticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  
  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;
  
  useEffect(() => {
    if (userId) {
      fetchStatistics();
    }
  }, [userId, timeRange]);
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Get user statistics from Firestore
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setStatistics(userData.statistics || {
          totalAlarms: 0,
          alarmsCompleted: 0,
          alarmsSnooze: 0,
          avgWakeUpTime: null,
          wakeUpHistory: []
        });
      } else {
        // Create default statistics if none exist
        setStatistics({
          totalAlarms: 0,
          alarmsCompleted: 0,
          alarmsSnooze: 0,
          avgWakeUpTime: null,
          wakeUpHistory: []
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format minutes to HH:MM
  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return '--:--';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Get completion rate percentage
  const getCompletionRate = () => {
    if (!statistics || !statistics.totalAlarms) return 0;
    return Math.round((statistics.alarmsCompleted / statistics.totalAlarms) * 100);
  };
  
  // Get snooze rate percentage
  const getSnoozeRate = () => {
    if (!statistics || !statistics.totalAlarms) return 0;
    return Math.round((statistics.alarmsSnooze / statistics.totalAlarms) * 100);
  };
  
  // Generate mock data for chart
  // In a real app, this would come from the wakeUpHistory array
  const generateChartData = () => {
    // Mock data - in a real app, this would be actual user data
    let labels = [];
    let data = [];
    
    if (timeRange === 'week') {
      labels = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
      // Convert wake up times to decimal hours (e.g., 7.5 = 7:30)
      data = [7.5, 8.2, 7.0, 7.8, 8.5, 9.2, 9.0];
    } else if (timeRange === 'month') {
      labels = ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4'];
      data = [7.8, 8.1, 7.5, 7.9];
    } else {
      labels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];
      data = [8.2, 7.9, 7.5, 7.8, 8.0, 7.7];
    }
    
    return { labels, data };
  };
  
  const chartData = generateChartData();
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>สถิติการตื่นนอน</Text>
      </View>
      
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="alarm-check" size={30} color="#4F46E5" />
          <Text style={styles.summaryValue}>{statistics?.totalAlarms || 0}</Text>
          <Text style={styles.summaryLabel}>จำนวนปลุกทั้งหมด</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Icon name="alarm-off" size={30} color="#4F46E5" />
          <Text style={styles.summaryValue}>{getCompletionRate()}%</Text>
          <Text style={styles.summaryLabel}>อัตราการปิดปลุก</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Icon name="alarm-snooze" size={30} color="#4F46E5" />
          <Text style={styles.summaryValue}>{getSnoozeRate()}%</Text>
          <Text style={styles.summaryLabel}>อัตราการเลื่อนปลุก</Text>
        </View>
      </View>
      
      {/* Average Wake Up Time */}
      <View style={styles.avgTimeContainer}>
        <Text style={styles.sectionTitle}>เวลาตื่นเฉลี่ย</Text>
        <Text style={styles.avgTimeValue}>
          {formatTime(statistics?.avgWakeUpTime)}
        </Text>
      </View>
      
      {/* Wake Up Time Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>แนวโน้มเวลาตื่น</Text>
        
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'week' && styles.activeTimeRange]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeTimeRangeText]}>
              สัปดาห์
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'month' && styles.activeTimeRange]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeTimeRangeText]}>
              เดือน
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'year' && styles.activeTimeRange]}
            onPress={() => setTimeRange('year')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'year' && styles.activeTimeRangeText]}>
              ปี
            </Text>
          </TouchableOpacity>
        </View>
        
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [
              {
                data: chartData.data
              }
            ]
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#4F46E5'
            }
          }}
          style={styles.chart}
          bezier
        />
      </View>
      
      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>เคล็ดลับการตื่นนอน</Text>
        
        <View style={styles.tipCard}>
          <Icon name="lightbulb-outline" size={24} color="#4F46E5" style={styles.tipIcon} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>ตั้งเวลานอนที่สม่ำเสมอ</Text>
            <Text style={styles.tipText}>
              การนอนและตื่นในเวลาเดียวกันทุกวันช่วยให้นาฬิกาชีวิตของคุณทำงานได้ดีขึ้น
            </Text>
          </View>
        </View>
        
        <View style={styles.tipCard}>
          <Icon name="weather-sunny" size={24} color="#4F46E5" style={styles.tipIcon} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>รับแสงแดดตอนเช้า</Text>
            <Text style={styles.tipText}>
              แสงแดดช่วยหยุดการผลิตเมลาโทนินและทำให้คุณรู้สึกตื่นตัวมากขึ้น
            </Text>
          </View>
        </View>
        
        <View style={styles.tipCard}>
          <Icon name="coffee" size={24} color="#4F46E5" style={styles.tipIcon} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>หลีกเลี่ยงคาเฟอีนก่อนนอน</Text>
            <Text style={styles.tipText}>
              คาเฟอีนสามารถอยู่ในร่างกายได้นานถึง 8 ชั่วโมง ควรหลีกเลี่ยงหลังเที่ยง
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '30%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  avgTimeContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  avgTimeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeTimeRange: {
    backgroundColor: '#EEF2FF',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipCard: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tipCard: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tipIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default StatisticsScreen;