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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSleep } from '../../contexts/SleepContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDailyRecommendation } from '../../utils/sleepAI';

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
                  {sleepAnalytics.avgQualityScore || 0}
                </Text>
                <Text style={styles.analyticLabel}>คะแนนคุณภาพ</Text>
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