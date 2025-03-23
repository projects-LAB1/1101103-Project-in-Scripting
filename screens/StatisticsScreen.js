// StatisticsScreen.js - หน้าแสดงสถิติการตื่นนอน
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Dimensions, TouchableOpacity
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, enableNetwork } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../firebase.config'; // Import db directly from firebase.config

const StatisticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  // Check network connectivity
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        // For React Native versions < 0.63, use NetInfo.fetch()
        // For newer versions, use the NetInfo.addEventListener approach
        const state = await NetInfo.fetch();
        setIsOffline(!state.isConnected);
        
        if (state.isConnected && isOffline) {
          // If we're back online after being offline, enable Firestore network
          await enableNetwork(db);
        }
      } catch (error) {
        console.log("Error checking connectivity:", error);
      }
    };
    
    checkConnectivity();
    
    // Set up listener for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      
      // When connection is restored, try fetching data again
      if (state.isConnected && isOffline) {
        enableNetwork(db).then(() => fetchStatistics());
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (userId) {
      fetchStatistics();
    }
  }, [userId, timeRange]);
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Check if we're offline
      if (isOffline) {
        // Use cached data if available, otherwise show offline message
        setLoading(false);
        return;
      }
      
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
      
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      
      // Handle offline error specifically
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        setIsOffline(true);
        
        // If we've tried less than 3 times, retry after a delay
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(retryCount + 1);
            fetchStatistics();
          }, 3000); // Retry after 3 seconds
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Retry fetching data
  const handleRetry = () => {
    setRetryCount(0);
    fetchStatistics();
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
    if (!statistics?.totalAlarms) return 0;
    return Math.round((statistics.alarmsCompleted / statistics.totalAlarms) * 100);
  };
  
  // Get snooze rate percentage
  const getSnoozeRate = () => {
    if (!statistics?.totalAlarms) return 0;
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
  
  // Show offline message if we're offline
  if (isOffline) {
    return (
      <View style={styles.offlineContainer}>
        <Icon name="wifi-off" size={60} color="#666" />
        <Text style={styles.offlineTitle}>ไม่สามารถเชื่อมต่อได้</Text>
        <Text style={styles.offlineMessage}>
          ไม่สามารถเชื่อมต่อกับ Firebase ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>ลองใหม่</Text>
        </TouchableOpacity>
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
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
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
    backgroundColor: '#F5F5F5',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
    height: 500,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  offlineMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  avgTimeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  avgTimeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginVertical: 8,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTimeRange: {
    backgroundColor: '#EEF2FF',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTimeRangeText: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
});

export default StatisticsScreen;