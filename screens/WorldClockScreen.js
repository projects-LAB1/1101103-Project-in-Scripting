import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment-timezone';

const WorldClockScreen = ({ navigation }) => {
  const [cities, setCities] = useState([
    { id: '1', city: 'Bangkok', timezone: 'Asia/Bangkok' },
    { id: '2', city: 'London', timezone: 'Europe/London' },
    { id: '3', city: 'New York', timezone: 'America/New_York' },
    { id: '4', city: 'Tokyo', timezone: 'Asia/Tokyo' },
  ]);
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderItem = ({ item }) => {
    const time = currentTime.tz(item.timezone);
    const timeString = time.format('HH:mm');
    const dateString = time.format('ddd');
    const hourDiff = time.utcOffset() - moment().tz('Asia/Bangkok').utcOffset();
    const diffString = hourDiff === 0 ? 'เวลาเดียวกัน' : 
      `${hourDiff > 0 ? '+' : ''}${hourDiff / 60} ชั่วโมง`;

    return (
      <View style={styles.cityItem}>
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{item.city}</Text>
          <Text style={styles.cityDiff}>{dateString} • {diffString}</Text>
        </View>
        <Text style={styles.cityTime}>{timeString}</Text>
      </View>
    );
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        แตะที่ + เพื่อเพิ่มนาฬิกาเมืองต่างๆ
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>นาฬิกาโลก</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // TODO: Navigate to Add City screen
            console.log('Add city');
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FF9500" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={cities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={EmptyList}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexGrow: 1,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cityDiff: {
    fontSize: 15,
    color: '#98989F',
  },
  cityTime: {
    fontSize: 32,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 17,
    color: '#98989F',
    textAlign: 'center',
  },
});

export default WorldClockScreen; 