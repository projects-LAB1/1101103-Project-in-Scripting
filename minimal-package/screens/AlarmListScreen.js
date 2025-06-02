// AlarmListScreen.js - หน้าแสดงรายการนาฬิกาปลุก
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { useAuth } from "../contexts/AuthContext";

const AlarmListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const swipeableRef = useRef(null);
  const loadingRef = useRef(false); // ป้องกันการโหลดซ้ำ

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
    useCallback(() => {
      console.log('Screen is focused, reloading alarms...');
      if (!loadingRef.current) {
        loadStoredAlarms();
      }
      return () => {
        // เมื่อออกจากหน้าจอ
        loadingRef.current = false;
      };
    }, [])
  );

  // Load alarms from storage with optimization
  const loadStoredAlarms = useCallback(async () => {
    if (loadingRef.current) return; // ป้องกันการโหลดซ้ำ
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const storedAlarms = await loadAlarms();
      
      // ปรับปรุงข้อมูล requireGame อย่างมีประสิทธิภาพ
      const processedAlarms = storedAlarms.map(alarm => ({
        ...alarm,
        requireGame: alarm.requireGame === true
      }));
      
      // Sort alarms by time efficiently
      const sortedAlarms = processedAlarms.sort((a, b) => {
        return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute);
      });
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error("Error loading alarms:", error);
      Alert.alert("Error", "Could not load alarm data");
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStoredAlarms();
  }, [loadStoredAlarms]);

  // Remove header in favor of our custom header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStoredAlarms();
  }, [loadStoredAlarms]);

  // Memoized format functions
  const formatTime = useCallback((hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }, []);

  // Memoized days text
  const getDaysText = useCallback((days) => {
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
  }, []);

  // Optimized toggle function
  const toggleAlarmActive = useCallback(async (alarmId, currentStatus) => {
    try {
      const targetAlarm = alarms.find(alarm => alarm.id === alarmId);
      if (!targetAlarm) return;

      const success = await toggleAlarmInStorage(alarmId);
      if (!success) return;

      const newStatus = !currentStatus;
      
      // Update alarms state efficiently
      setAlarms(prevAlarms => 
        prevAlarms.map(alarm => 
          alarm.id === alarmId ? { ...alarm, isActive: newStatus } : alarm
        )
      );

      // Handle notification scheduling/cancelling
      if (newStatus) {
        try {
          const notificationId = await scheduleAlarmNotification(targetAlarm);
          if (notificationId) {
            setAlarms(prevAlarms => {
              const updated = prevAlarms.map(a => 
                a.id === alarmId ? { ...a, notificationId } : a
              );
              saveAlarms(updated); // เซฟแบบ async ไม่ต้องรอ
              return updated;
            });
          }
        } catch (err) {
          console.error("Error scheduling notification:", err);
        }
      } else if (targetAlarm.notificationId) {
        await cancelAlarmNotification(targetAlarm.notificationId);
      }
    } catch (error) {
      console.error("Error toggling alarm:", error);
    }
  }, [alarms]);

  // Optimized delete function
  const deleteAlarm = useCallback(async (alarmId) => {
    try {
      const alarmToDelete = alarms.find(alarm => alarm.id === alarmId);
      if (alarmToDelete?.notificationId) {
        await cancelAlarmNotification(alarmToDelete.notificationId);
      }

      await deleteAlarmFromStorage(alarmId);
      setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== alarmId));
    } catch (error) {
      console.error("Error deleting alarm:", error);
      Alert.alert("Error", "Could not delete the alarm");
    }
  }, [alarms]);

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
          
          {/* แสดงข้อมูลเพิ่มเติมเกี่ยวกับการตั้งค่าเกม */}
          {item.requireGame === true && (
            <View style={styles.gameIndicatorContainer}>
              <MaterialCommunityIcons 
                name="gamepad-variant" 
                size={16} 
                color="#FF9500" 
                style={styles.gameIcon} 
              />
              <Text style={styles.gameIndicatorText}>
                {item.gameType === "math" ? "เกมคณิตศาสตร์" : 
                 item.gameType === "memory" ? "เกมจับคู่ภาพ" : 
                 item.gameType === "photo" ? "เกมถ่ายรูป" : "เกม"}
                {" - "}
                {item.gameDifficulty === "easy" ? "ง่าย" : 
                 item.gameDifficulty === "medium" ? "ปานกลาง" : 
                 item.gameDifficulty === "hard" ? "ยาก" : ""}
              </Text>
            </View>
          )}
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

  // ฟังก์ชันสำหรับการนำทางไปยังหน้าเพิ่มนาฬิกาปลุกใหม่ โดยตรวจสอบการล็อกอินก่อน
  const navigateToAddAlarm = () => {
    if (!user) {
      Alert.alert(
        "กรุณาเข้าสู่ระบบ",
        "คุณจำเป็นต้องเข้าสู่ระบบก่อนจึงจะสามารถตั้งนาฬิกาปลุกได้",
        [
          {
            text: "เข้าสู่ระบบ",
            onPress: () => navigation.navigate("Auth", { screen: "Login" })
          },
          {
            text: "ยกเลิก",
            style: "cancel"
          }
        ]
      );
      return;
    }
    
    navigation.navigate("AddAlarm");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>นาฬิกาปลุก</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToAddAlarm}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FF9500" />
        </TouchableOpacity>
      </View>
      
      {loading && alarms.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      ) : alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alarm-off" size={60} color="#666" />
          <Text style={styles.emptyText}>ไม่มีนาฬิกาปลุก</Text>
          <Text style={styles.emptySubText}>แตะที่ + เพื่อเพิ่มนาฬิกาปลุก</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarmItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF9500"
              colors={["#FF9500"]}
            />
          }
        />
      )}
      
      {/* Floating action button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={navigateToAddAlarm}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  alarmItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  alarmInfo: {
    flex: 1,
    paddingRight: 16,
  },
  alarmTime: {
    fontSize: 48,
    fontWeight: "300",
    color: "#FFFFFF",
  },
  alarmLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  alarmRepeat: {
    fontSize: 16,
    color: "#999",
    marginLeft: 8,
  },
  alarmSwitch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  inactiveText: {
    color: "#666",
  },
  deleteButton: {
    backgroundColor: "#FF453A",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  gameIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  gameIcon: {
    marginRight: 5,
  },
  gameIndicatorText: {
    fontSize: 14,
    color: "#FF9500",
    fontWeight: '500',
  },
});

export default AlarmListScreen;
