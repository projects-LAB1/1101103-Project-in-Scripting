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
  
  // Get sleep quality color
  const getSleepQualityColor = (qualityScore) => {
    if (!qualityScore && qualityScore !== 0) return '#666666';
    
    if (qualityScore >= 80) return '#4CAF50';  // Good
    if (qualityScore >= 60) return '#FFC107';  // Fair
    return '#FF5722';  // Poor
  };
  
  // Render quality indicator
  const renderQualityIndicator = (qualityScore) => {
    const color = getSleepQualityColor(qualityScore);
    
    return (
      <View style={[styles.qualityIndicator, { backgroundColor: color }]}>
        <Text style={styles.qualityScore}>{qualityScore || '?'}</Text>
      </View>
    );
  };
  
  // Render a sleep record item
  const renderSleepItem = ({ item }) => {
    // Calculate quality score if not available
    const qualityScore = Math.round((item.durationMinutes / 480) * 100);
    
    return (
      <TouchableOpacity 
        style={styles.sleepItem}
        onPress={() => navigation.navigate('SleepEntry', { record: item, editing: true })}
      >
        <View style={styles.sleepItemHeader}>
          <Text style={styles.sleepDate}>{formatDate(item.bedTime)}</Text>
          {renderQualityIndicator(qualityScore)}
        </View>
        
        <View style={styles.sleepTimes}>
          <View style={styles.timeBlock}>
            <MaterialCommunityIcons name="bed" size={20} color="#999999" />
            <Text style={styles.timeLabel}>เข้านอน</Text>
            <Text style={styles.timeValue}>{formatTime(item.bedTime)}</Text>
          </View>
          
          <View style={styles.durationBlock}>
            <Text style={styles.durationValue}>{formatDuration(item.durationMinutes)}</Text>
          </View>
          
          <View style={styles.timeBlock}>
            <MaterialCommunityIcons name="weather-sunset-up" size={20} color="#999999" />
            <Text style={styles.timeLabel}>ตื่นนอน</Text>
            <Text style={styles.timeValue}>{formatTime(item.wakeTime)}</Text>
          </View>
        </View>
        
        {item.notes && (
          <Text style={styles.sleepNotes} numberOfLines={1}>{item.notes}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </SafeAreaView>
    );
  }

  // Get the recent sleep records (last 7 days)
  const recentRecords = sleepRecords
    .sort((a, b) => new Date(b.bedTime) - new Date(a.bedTime))
    .slice(0, 7);

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
              <MaterialCommunityIcons name="chevron-right" size={20} color="#0A84FF" />
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
            <MaterialCommunityIcons name="chevron-right" size={20} color="#0A84FF" />
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
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666666" />
          </View>
        </TouchableOpacity>
        
        {/* Recent Sleep section */}
        <View style={styles.recentSleepSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ประวัติการนอนล่าสุด</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SleepHistory')}>
              <Text style={styles.sectionLink}>ดูทั้งหมด</Text>
            </TouchableOpacity>
          </View>
          
          {recentRecords.length > 0 ? (
            <FlatList
              data={recentRecords}
              renderItem={renderSleepItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="sleep" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>ยังไม่มีข้อมูลการนอน</Text>
              <Text style={styles.emptyStateSubText}>เพิ่มข้อมูลการนอนเพื่อเริ่มติดตามรูปแบบการนอนของคุณ</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Add sleep record button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('SleepEntry')}
      >
        <LinearGradient
          colors={['#FF9500', '#FF5733']}
          style={styles.addButtonGradient}
        >
          <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
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
  recentSleepSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionLink: {
    fontSize: 15,
    color: '#0A84FF',
  },
  sleepItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  sleepItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qualityIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sleepTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 17,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  durationBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationValue: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
  },
  sleepNotes: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default SleepHomeScreen; 