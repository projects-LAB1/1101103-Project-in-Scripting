import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSleep } from '../../contexts/SleepContext';
import { LinearGradient } from 'expo-linear-gradient';

const SleepHistoryScreen = ({ navigation }) => {
  const { sleepRecords, loading, refreshing, refresh, deleteSleep } = useSleep();
  const [groupedRecords, setGroupedRecords] = useState({});
  const [sections, setSections] = useState([]);
  
  // Group records by month
  useEffect(() => {
    if (sleepRecords.length === 0) return;
    
    const sorted = [...sleepRecords].sort((a, b) => new Date(b.bedTime) - new Date(a.bedTime));
    const grouped = {};
    
    sorted.forEach(record => {
      const date = new Date(record.bedTime);
      const month = date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
      
      if (!grouped[month]) {
        grouped[month] = [];
      }
      
      grouped[month].push(record);
    });
    
    setGroupedRecords(grouped);
    setSections(Object.keys(grouped));
  }, [sleepRecords]);
  
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
  
  // Format date as day week
  const formatDayOfWeek = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { weekday: 'short' };
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
          <View style={styles.sleepDateContainer}>
            <Text style={styles.sleepDate}>{formatDate(item.bedTime)}</Text>
            <Text style={styles.sleepDayOfWeek}>{formatDayOfWeek(item.bedTime)}</Text>
          </View>
          
          {renderQualityIndicator(qualityScore)}
        </View>
        
        <View style={styles.sleepTimes}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>เข้านอน</Text>
            <Text style={styles.timeValue}>{formatTime(item.bedTime)}</Text>
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>ตื่นนอน</Text>
            <Text style={styles.timeValue}>{formatTime(item.wakeTime)}</Text>
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>ระยะเวลา</Text>
            <Text style={styles.durationValue}>{formatDuration(item.durationMinutes)}</Text>
          </View>
        </View>
        
        {(item.quality || item.hasDream) && (
          <View style={styles.sleepDetails}>
            {item.quality && (
              <View style={styles.qualityTag}>
                <Text style={styles.qualityTagText}>
                  {item.quality === 'excellent' ? 'ดีเยี่ยม' : 
                   item.quality === 'good' ? 'ดี' : 
                   item.quality === 'average' ? 'ปานกลาง' : 
                   item.quality === 'poor' ? 'ไม่ดี' : 'แย่'}
                </Text>
              </View>
            )}
            
            {item.hasDream && (
              <View style={styles.dreamTag}>
                <MaterialCommunityIcons name="thought-bubble" size={12} color="#FFFFFF" />
                <Text style={styles.dreamTagText}>มีความฝัน</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render a section header
  const renderSectionHeader = ({ section }) => (
    <Text style={styles.sectionHeader}>{section}</Text>
  );

  // Render flatlist section
  const renderSection = ({ item: section }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeader}>{section}</Text>
      <FlatList
        data={groupedRecords[section]}
        renderItem={renderSleepItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      {sleepRecords.length > 0 ? (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#FF9500']} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="sleep" size={64} color="#666666" />
          <Text style={styles.emptyText}>ยังไม่มีประวัติการนอน</Text>
          <Text style={styles.emptySubText}>เพิ่มการนอนแรกของคุณโดยการกดปุ่ม + ด้านล่าง</Text>
        </View>
      )}
      
      {/* Add sleep record button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('SleepEntry')}
      >
        <LinearGradient
          colors={['#FF9500', '#FF5733']}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>
            <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
          </Text>
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
  listContent: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
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
  sleepDateContainer: {
    flexDirection: 'column',
  },
  sleepDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sleepDayOfWeek: {
    fontSize: 13,
    color: '#999999',
    marginTop: 2,
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
    marginBottom: 12,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  durationValue: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  sleepDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qualityTag: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  qualityTagText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  dreamTag: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
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
  addButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default SleepHistoryScreen; 