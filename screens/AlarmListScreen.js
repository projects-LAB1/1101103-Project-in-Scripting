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
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการปลุกได้');
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAlarm')}
        >
          <Icon name="plus" size={24} color="#FF9500" />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#000000',
      },
      headerTintColor: '#FFFFFF',
      headerTitle: 'ปลุก',
      headerTitleStyle: {
        fontSize: 34,
        fontWeight: '700',
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
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะการปลุกได้');
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
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบการปลุกได้');
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const getDaysText = (days) => {
    if (!days || days.length === 0) return "ครั้งเดียว";
    const dayNames = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
    if (days.length === 7) return "ทุกวัน";
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
          <Text style={styles.deleteActionText}>ลบ</Text>
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
          'ลบการปลุก',
          'คุณแน่ใจหรือไม่ที่จะลบการปลุกนี้?',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            { 
              text: 'ลบ', 
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
            <Text style={[styles.daysText, !item.isActive && styles.inactiveText]}>
              {getDaysText(item.repeatDays)}
            </Text>
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
        <ActivityIndicator size="large" color="#FF9500" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off-outline" size={20} color="#FFFFFF" />
          <Text style={styles.offlineText}>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</Text>
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
            tintColor="#FF9500"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="alarm-plus" size={64} color="#666666" />
            <Text style={styles.emptyText}>ไม่มีการตั้งปลุก</Text>
            <Text style={styles.emptySubtext}>แตะที่ + เพื่อเพิ่มการปลุก</Text>
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
  addButton: {
    marginRight: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  alarmItem: {
    backgroundColor: "#1C1C1E",
  },
  alarmContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 88,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "300",
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  inactiveText: {
    color: "#666666",
  },
  daysText: {
    fontSize: 15,
    color: "#999999",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#333333",
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
