import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * SleepCard - การ์ดแสดงข้อมูลการนอนหลับ
 * 
 * @param {object} sleepData - ข้อมูลการนอน (bedTime, wakeTime, durationMinutes, quality, hasDream)
 * @param {function} onPress - ฟังก์ชันเมื่อกดการ์ด
 * @param {boolean} compact - โหมดแสดงแบบย่อ
 * @param {object} style - สไตล์เพิ่มเติม
 */
const SleepCard = ({ sleepData, onPress, compact = false, style }) => {
  if (!sleepData) return null;
  
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
  
  // Format day of week
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

  // Calculate quality score if not available
  const qualityScore = Math.round((sleepData.durationMinutes / 480) * 100);
  
  // Get sleep quality color
  const getSleepQualityColor = (score) => {
    if (!score && score !== 0) return '#666666';
    
    if (score >= 80) return '#4CAF50';  // Good
    if (score >= 60) return '#FFC107';  // Fair
    return '#FF5722';  // Poor
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with date and quality indicator */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(sleepData.bedTime)}</Text>
          <Text style={styles.dayOfWeek}>{formatDayOfWeek(sleepData.bedTime)}</Text>
        </View>
        
        <View style={[
          styles.qualityIndicator, 
          { backgroundColor: getSleepQualityColor(qualityScore) }
        ]}>
          <Text style={styles.qualityScore}>{qualityScore || '?'}</Text>
        </View>
      </View>
      
      {/* Sleep times */}
      {!compact && (
        <View style={styles.timesContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>เข้านอน</Text>
            <Text style={styles.timeValue}>{formatTime(sleepData.bedTime)}</Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>ตื่นนอน</Text>
            <Text style={styles.timeValue}>{formatTime(sleepData.wakeTime)}</Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>ระยะเวลา</Text>
            <Text style={styles.durationValue}>{formatDuration(sleepData.durationMinutes)}</Text>
          </View>
        </View>
      )}
      
      {/* Compact mode - just show duration */}
      {compact && (
        <View style={styles.compactContainer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#FF9500" />
          <Text style={styles.compactDuration}>{formatDuration(sleepData.durationMinutes)}</Text>
        </View>
      )}
      
      {/* Tags - show only in non-compact mode */}
      {!compact && (sleepData.quality || sleepData.hasDream) && (
        <View style={styles.tagsContainer}>
          {sleepData.quality && (
            <View style={styles.qualityTag}>
              <Text style={styles.qualityTagText}>
                {sleepData.quality === 'excellent' ? 'ดีเยี่ยม' : 
                 sleepData.quality === 'good' ? 'ดี' : 
                 sleepData.quality === 'average' ? 'ปานกลาง' : 
                 sleepData.quality === 'poor' ? 'ไม่ดี' : 'แย่'}
              </Text>
            </View>
          )}
          
          {sleepData.hasDream && (
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'column',
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dayOfWeek: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },
  qualityIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF9500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDuration: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qualityTag: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  qualityTagText: {
    fontSize: 12,
    color: '#FF9500',
  },
  dreamTag: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamTagText: {
    fontSize: 12,
    color: '#0A84FF',
    marginLeft: 4,
  },
});

export default SleepCard; 