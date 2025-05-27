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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  loadAlarms,
  saveAlarms,
  deleteAlarm as deleteAlarmFromStorage,
  toggleAlarmStatus as toggleAlarmInStorage,
} from "../utils/alarmStorage";
import {
  scheduleAlarmNotification,
  cancelAlarmNotification,
} from "../models/NotificationManager";
import { useFocusEffect } from '@react-navigation/native';

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [loadError, setLoadError] = useState(false);
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

  // เพิ่ม useFocusEffect เพื่อโหลดข้อมูลนาฬิกาปลุกใหม่ทุกครั้งที่กลับมาที่หน้าจอนี้
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen is focused, reloading alarms...');
      loadStoredAlarms();
      return () => {
        // เมื่อออกจากหน้าจอ (ถ้าต้องการทำอะไรตอนนี้)
      };
    }, [])
  );

  // Load alarms from storage
  const loadStoredAlarms = async () => {
    try {
      setLoading(true); // เพิ่มการแสดง loading ระหว่างโหลดข้อมูล
      setLoadError(false); // รีเซ็ตค่าความผิดพลาด
      
      const storedAlarms = await loadAlarms();
      
      if (storedAlarms) {
        setAlarms(
          storedAlarms.sort((a, b) => {
            const timeA = a.hour * 60 + a.minute;
            const timeB = b.hour * 60 + b.minute;
            return timeA - timeB;
          })
        );
      } else {
        // กรณีไม่พบข้อมูลหรือข้อมูลเป็น null
        setAlarms([]);
      }
    } catch (error) {
      console.error("Error loading alarms:", error);
      setLoadError(true); // ตั้งค่าความผิดพลาดในการโหลด
      setAlarms([]); // ตั้งค่านาฬิกาปลุกเป็นอาร์เรย์ว่าง
      // แสดงข้อความแจ้งเตือนให้ผู้ใช้ทราบ
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลนาฬิกาปลุกได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStoredAlarms();
  }, []);

  // Remove header in favor of our custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadStoredAlarms();
  };

  // Format time with leading zeros
  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  // Format repeat days text
  const getDaysText = (days) => {
    if (!days || days.length === 0) return "ครั้งเดียว";
    if (days.length === 7) return "ทุกวัน";

    const dayNames = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
    
    // If weekdays only (Mon-Fri)
    if (days.length === 5 && [0,1,2,3,4].every(day => days.includes(day))) {
      return "วันธรรมดา";
    }
    
    // If weekends only (Sat-Sun)
    if (days.length === 2 && days.includes(5) && days.includes(6)) {
      return "สุดสัปดาห์";
    }
    
    return days.sort().map(day => dayNames[day]).join(" ");
  };

  // Toggle alarm active/inactive
  const toggleAlarmActive = async (alarmId, currentStatus) => {
    try {
      // Find alarm to toggle
      const targetAlarm = alarms.find(alarm => alarm.id === alarmId);
      if (!targetAlarm) return;

      // Toggle status in storage
      const success = await toggleAlarmInStorage(alarmId);
      if (!success) return;

      const newStatus = !currentStatus;
      
      // Update alarms state
      const updatedAlarms = alarms.map(alarm => 
        alarm.id === alarmId ? { ...alarm, isActive: newStatus } : alarm
      );
      setAlarms(updatedAlarms);

      // Handle notification scheduling/cancelling
      if (newStatus) {
        // Schedule the notification
        try {
          const notificationId = await scheduleAlarmNotification(targetAlarm);
          if (notificationId) {
            // Update the alarm with the notification ID
            const alarmsWithNotificationId = updatedAlarms.map(a => 
              a.id === alarmId ? { ...a, notificationId } : a
            );
            setAlarms(alarmsWithNotificationId);
            await saveAlarms(alarmsWithNotificationId);
          }
        } catch (err) {
          console.error("Error scheduling notification:", err);
        }
      } else if (targetAlarm.notificationId) {
        // Cancel the notification
        await cancelAlarmNotification(targetAlarm.notificationId);
      }
    } catch (error) {
      console.error("Error toggling alarm:", error);
    }
  };

  // Delete an alarm
  const deleteAlarm = async (alarmId) => {
    try {
      // Cancel notification if active
      const alarmToDelete = alarms.find(alarm => alarm.id === alarmId);
      if (alarmToDelete?.notificationId) {
        await cancelAlarmNotification(alarmToDelete.notificationId);
      }

      // Delete from storage
      const success = await deleteAlarmFromStorage(alarmId);
      if (success) {
        setAlarms(alarms.filter(alarm => alarm.id !== alarmId));
      }
    } catch (error) {
      console.error("Error deleting alarm:", error);
    }
  };

  // Render swipe action (delete)
  const renderRightActions = (progress, dragX, item) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            "ลบนาฬิกาปลุก",
            "คุณแน่ใจที่จะลบนาฬิกาปลุกนี้?",
            [
              { text: "ยกเลิก", style: "cancel" },
              { text: "ลบ", style: "destructive", onPress: () => deleteAlarm(item.id) }
            ]
          );
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Close any open swipeable when a new one is opened
  const closeOpenSwipeable = (ref) => {
    if (swipeableRef.current && swipeableRef.current !== ref) {
      swipeableRef.current.close();
    }
    swipeableRef.current = ref;
  };

  // Render a single alarm item
  const renderAlarmItem = ({ item }) => (
    <Swipeable
      ref={(ref) => {
        if (ref && item.id) {
          closeOpenSwipeable(ref);
        }
      }}
      friction={2}
      rightThreshold={40}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.alarmItem}
        onPress={() => navigation.navigate("AddAlarm", { alarm: item })}
      >
        <View style={styles.alarmInfo}>
          <Text style={[
            styles.alarmTime, 
            !item.isActive && styles.inactiveText
          ]}>
            {formatTime(item.hour, item.minute)}
          </Text>
          <View style={styles.alarmLabelContainer}>
            <Text style={[
              styles.alarmLabel, 
              !item.isActive && styles.inactiveText
            ]}>
              {item.label || "นาฬิกาปลุก"}
            </Text>
            {item.repeatDays && item.repeatDays.length > 0 && (
              <Text style={styles.alarmRepeat}>{getDaysText(item.repeatDays)}</Text>
            )}
          </View>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleAlarmActive(item.id, item.isActive)}
          trackColor={{ false: '#3e3e3e', true: '#FF9500' }}
          thumbColor={item.isActive ? '#fff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          style={styles.alarmSwitch}
        />
      </TouchableOpacity>
    </Swipeable>
  );

  // รายการว่างเปล่า แสดงข้อความแนะนำให้เพิ่มนาฬิกาปลุก
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {loadError ? (
        <>
          <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#FF9500" />
          <Text style={styles.emptyTitle}>มีข้อผิดพลาด</Text>
          <Text style={styles.emptyText}>ไม่สามารถโหลดข้อมูลนาฬิกาปลุกได้</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStoredAlarms}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <MaterialCommunityIcons name="alarm-plus" size={50} color="#FF9500" />
          <Text style={styles.emptyTitle}>ไม่มีนาฬิกาปลุก</Text>
          <Text style={styles.emptyText}>กดปุ่ม + เพื่อเพิ่มนาฬิกาปลุก</Text>
        </>
      )}
    </View>
  );

  // แสดงหน้าจอโหลดถ้าข้อมูลกำลังโหลด
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>นาฬิกาปลุก</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>นาฬิกาปลุก</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddAlarm")}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FF9500" />
        </TouchableOpacity>
      </View>

      {isOffline && (
        <View style={styles.offlineBar}>
          <MaterialCommunityIcons name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</Text>
        </View>
      )}

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderAlarmItem}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF9500"]}
            tintColor="#FF9500"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  offlineBar: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  offlineText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
  alarmItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
  },
  alarmLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  alarmLabel: {
    color: "#CCCCCC",
    fontSize: 14,
    marginRight: 8,
  },
  alarmRepeat: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  alarmSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  inactiveText: {
    color: "#777777",
  },
  deleteButton: {
    backgroundColor: "#FF453A",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#CCCCCC",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    color: "#CCCCCC",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#FF9500",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#000000",
    fontWeight: "600",
  },
});

export default AlarmListScreen;
