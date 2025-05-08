// AlarmListScreen.js - หน้าแสดงรายการนาฬิกาปลุก
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loadAlarms,
  saveAlarms,
  deleteAlarm as deleteAlarmFromStorage,
  toggleAlarmStatus as toggleAlarmInStorage
} from '../utils/alarmStorage';
import { scheduleAlarmNotification, cancelAlarmNotification } from "../models/NotificationManager";

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const swipeableRef = useRef(null);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  // Load alarms from storage
  const loadStoredAlarms = async () => {
    try {
      const storedAlarms = await loadAlarms();
      setAlarms(storedAlarms.sort((a, b) => {
        const timeA = a.hour * 60 + a.minute;
        const timeB = b.hour * 60 + b.minute;
        return timeA - timeB;
      }));
    } catch (error) {
      console.error('Error loading alarms:', error);
      Alert.alert('Error', 'Could not load alarm data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStoredAlarms();
  }, []);

  // Add navigation options
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // Navigate to settings in a real app
              Alert.alert('Action', 'Would navigate to settings');
            }}
          >
            <Icon name="cog-outline" size={24} color="#0A84FF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddAlarm')}
          >
            <Icon name="plus" size={24} color="#0A84FF" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: '#000000',
        borderBottomWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitle: 'Alarm',
      headerTitleStyle: {
        fontSize: 26,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadStoredAlarms();
  };

  const toggleAlarmActive = async (alarmId, currentStatus) => {
    try {
      const success = await toggleAlarmInStorage(alarmId);
      if (success) {
        const updatedAlarms = alarms.map(alarm => {
          if (alarm.id === alarmId) {
            const newStatus = !currentStatus;
            // Handle notifications
            if (newStatus) {
              scheduleAlarmNotification(alarm);
            } else {
              cancelAlarmNotification(alarm.notificationId);
            }
            return { ...alarm, isActive: newStatus };
          }
          return alarm;
        });
        setAlarms(updatedAlarms);
        await saveAlarms(updatedAlarms);
      }
    } catch (error) {
      console.error('Error toggling alarm:', error);
      Alert.alert('Error', 'Could not change alarm status');
    }
  };

  const deleteAlarm = async (alarmId) => {
    try {
      const success = await deleteAlarmFromStorage(alarmId);
      if (success) {
        const alarm = alarms.find(a => a.id === alarmId);
        if (alarm?.notificationId) {
          await cancelAlarmNotification(alarm.notificationId);
        }
        const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
        setAlarms(updatedAlarms);
      }
    } catch (error) {
      console.error('Error deleting alarm:', error);
      Alert.alert('Error', 'Could not delete the alarm');
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const getDaysText = (days) => {
    if (!days || days.length === 0) return "Once";
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (days.length === 7) return "Every day";
    
    // Check for weekdays pattern
    const weekdaysArray = [0, 1, 2, 3, 4];
    const weekendArray = [5, 6];
    
    const hasAllWeekdays = weekdaysArray.every(day => days.includes(day));
    if (hasAllWeekdays && days.length === 5) return "Weekdays";
    
    const hasAllWeekend = weekendArray.every(day => days.includes(day));
    if (hasAllWeekend && days.length === 2) return "Weekend";
    
    return days.map((day) => dayNames[day]).join(", ");
  };

  // สร้าง component สำหรับปุ่มลบที่จะแสดงเมื่อเลื่อนรายการไปทางซ้าย
  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          if (swipeableRef.current) {
            swipeableRef.current.close();
          }
        }}
      >
        <Animated.View
          style={[
            styles.deleteActionContent,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Icon name="trash-can-outline" size={28} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // อ้างอิงไปยัง Swipeable ที่กำลังเปิดอยู่
  const closeOpenSwipeable = (ref) => {
    if (swipeableRef.current && swipeableRef.current !== ref) {
      swipeableRef.current.close();
    }
    swipeableRef.current = ref;
  };

  const renderAlarmItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX)
      }
      onSwipeableOpen={() => {
        Alert.alert(
          'Delete Alarm',
          'Are you sure you want to delete this alarm?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => deleteAlarm(item.id)
            }
          ]
        );
      }}
      ref={(ref) => {
        if (ref && item.id === swipeableRef?.current?.props?.children?.props?.item?.id) {
          swipeableRef.current = ref;
        }
      }}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.alarmItem}
        onPress={() => navigation.navigate("AddAlarm", { alarm: item })}
      >
        <View style={styles.alarmContent}>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, !item.isActive && styles.inactiveText]}>
              {formatTime(item.hour, item.minute)}
            </Text>
            <View style={styles.alarmDetailsContainer}>
              {item.label ? (
                <Text style={[styles.labelText, !item.isActive && styles.inactiveText]}>
                  {item.label}
                </Text>
              ) : null}
              <Text style={[styles.daysText, !item.isActive && styles.inactiveText]}>
                {getDaysText(item.repeatDays)}
              </Text>
            </View>
          </View>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleAlarmActive(item.id, item.isActive)}
            trackColor={{ false: '#767577', true: '#34C759' }}
            thumbColor={item.isActive ? '#FFFFFF' : '#F4F3F4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off-outline" size={20} color="#FFFFFF" />
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      )}
      
      <FlatList
        data={alarms}
        renderItem={renderAlarmItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="alarm-plus" size={64} color="#666666" />
            <Text style={styles.emptyText}>No alarms</Text>
            <Text style={styles.emptySubtext}>Tap + to add an alarm</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
  },
  alarmItem: {
    backgroundColor: "#1C1C1E",
  },
  alarmContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 92,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 42,
    color: "#FFFFFF",
    fontWeight: "300",
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  alarmDetailsContainer: {
    flexDirection: 'column',
  },
  labelText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  inactiveText: {
    color: "#666666",
  },
  daysText: {
    fontSize: 14,
    color: "#999999",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#333333",
    marginLeft: 16,
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteActionContent: {
    alignItems: "center",
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 4,
  },
  offlineBanner: {
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  offlineText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#666666",
    fontSize: 17,
    marginTop: 16,
  },
  emptySubtext: {
    color: "#666666",
    fontSize: 15,
    marginTop: 8,
  },
});

export default AlarmListScreen;
