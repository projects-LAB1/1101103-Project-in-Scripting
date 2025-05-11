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
      const storedAlarms = await loadAlarms();
      setAlarms(
        storedAlarms.sort((a, b) => {
          const timeA = a.hour * 60 + a.minute;
          const timeB = b.hour * 60 + b.minute;
          return timeA - timeB;
        })
      );
    } catch (error) {
      console.error("Error loading alarms:", error);
      Alert.alert("Error", "Could not load alarm data");
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
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Testing')}
            style={[styles.headerButton, styles.testButton]}
          >
            <Icon name="test-tube" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Testing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={testMiniGameAlarm}
            style={[styles.headerButton, styles.gameButton]}
          >
            <Icon name="gamepad-variant" size={20} color="#FFFFFF" />
            <Text style={styles.gameButtonText}>Test Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddAlarm')}
            style={styles.headerButton}
          >
            <Icon name="plus" size={28} color="#0A84FF" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: "#000000",
        borderBottomWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
      },
      headerTintColor: "#FFFFFF",
      headerTitle: "Alarm",
      headerTitleStyle: {
        fontSize: 26,
        fontWeight: "600",
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
      // ดึงข้อมูล alarm ที่ต้องการเปลี่ยนสถานะ
      const targetAlarm = alarms.find((alarm) => alarm.id === alarmId);
      if (!targetAlarm) {
        console.error("Cannot find alarm with ID:", alarmId);
        return;
      }

      // เปลี่ยนสถานะใน storage
      const success = await toggleAlarmInStorage(alarmId);
      if (success) {
        const newStatus = !currentStatus;

        // อัปเดต state ของ alarms
        const updatedAlarms = alarms.map((alarm) => {
          if (alarm.id === alarmId) {
            return { ...alarm, isActive: newStatus };
          }
          return alarm;
        });

        // บันทึก state ใหม่
        setAlarms(updatedAlarms);

        // อัปเดตการแจ้งเตือน
        const updatedAlarm = { ...targetAlarm, isActive: newStatus };

        // จัดการกับการแจ้งเตือน
        if (newStatus) {
          // ถ้าเปิดการแจ้งเตือน ให้ตั้งเวลาเตือนตามที่กำหนดไว้
          try {
            console.log("Scheduling notification for alarm:", updatedAlarm);
            
            // Calculate time until alarm when turning on
            const now = new Date();
            const alarmTime = new Date(now);
            alarmTime.setHours(updatedAlarm.hour);
            alarmTime.setMinutes(updatedAlarm.minute);
            alarmTime.setSeconds(0);

            // If there are repeat days, check for the next occurrence
            let nextAlarmMessage = "";
            
            if (updatedAlarm.repeatDays && updatedAlarm.repeatDays.length > 0) {
              const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
              const repeatDays = updatedAlarm.repeatDays;
              
              // Convert Sunday(0) to index 6 for comparison with our repeatDays array
              // where Monday is 0, Sunday is 6
              const currentDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              
              // Find the next day to ring from the repeat days
              let nextDayIndex = -1;
              let daysUntilNextAlarm = 7; // Maximum is a week
              
              for (const repeatDay of repeatDays) {
                // Calculate how many days until this repeat day
                let daysUntil = repeatDay - currentDayIndex;
                if (daysUntil <= 0) {
                  daysUntil += 7; // Wrap to next week
                }
                
                // If alarm time is already past for today and the repeat day is today
                if (repeatDay === currentDayIndex && alarmTime <= now) {
                  daysUntil = 7; // Schedule for next week
                }
                
                // Keep track of the closest upcoming day
                if (daysUntil < daysUntilNextAlarm) {
                  daysUntilNextAlarm = daysUntil;
                  nextDayIndex = repeatDay;
                }
              }
              
              // If we found a valid next day
              if (nextDayIndex !== -1) {
                // Set the alarm date to the next occurrence
                alarmTime.setDate(alarmTime.getDate() + daysUntilNextAlarm);
                
                // Map our day index (where Monday is 0) to day names
                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                nextAlarmMessage = ` (Next alarm on ${dayNames[nextDayIndex]})`;
              }
            } else {
              // If no repeat days, just add a day if the time has passed
              if (alarmTime < now) {
                alarmTime.setDate(alarmTime.getDate() + 1);
              }
            }

            // Calculate difference
            const diffMs = alarmTime - now;
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            // Display alert with time until alarm
            let timeDescription = "";
            
            if (diffHrs === 0 && diffMins === 0) {
              timeDescription = "ตอนนี้";
            } else if (diffHrs === 0) {
              timeDescription = `อีก ${diffMins} นาที`;
            } else if (diffMins === 0) {
              timeDescription = `อีก ${diffHrs} ชั่วโมง`;
            } else {
              timeDescription = `อีก ${diffHrs} ชั่วโมง ${diffMins} นาที`;
            }
            
            // Format the alarm time for display
            const formattedTime = `${alarmTime.getHours().toString().padStart(2, '0')}:${alarmTime.getMinutes().toString().padStart(2, '0')}`;
            
            // Format next day in Thai if needed
            let thaiNextAlarmMessage = "";
            if (nextAlarmMessage) {
              const thaiDays = ["วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"];
              const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
              const dayIndex = dayNames.findIndex(day => nextAlarmMessage.includes(day));
              if (dayIndex !== -1) {
                thaiNextAlarmMessage = ` (นาฬิกาปลุกถัดไปใน${thaiDays[dayIndex]})`;
              }
            }
            
            Alert.alert(
              "เปิดใช้งานนาฬิกาปลุก",
              `ตั้งปลุกเวลา ${formattedTime} (${timeDescription})${thaiNextAlarmMessage}`
            );
            
            const notificationId = await scheduleAlarmNotification(
              updatedAlarm
            );

            // บันทึก notificationId กลับไปยัง alarm ที่อัปเดต
            if (notificationId) {
              // อัปเดต alarm ด้วย notificationId ใหม่
              const finalAlarms = updatedAlarms.map((alarm) => {
                if (alarm.id === alarmId) {
                  return { ...alarm, notificationId };
                }
                return alarm;
              });

              setAlarms(finalAlarms);
              await saveAlarms(finalAlarms);
              console.log(
                `Alarm ${alarmId} activated with notification ID: ${notificationId}`
              );
            }
          } catch (notificationError) {
            console.error(
              "Failed to schedule notification:",
              notificationError
            );
            Alert.alert(
              "Warning",
              "Alarm was activated but notification might not work properly"
            );
          }
        } else {
          // ถ้าปิดการแจ้งเตือน ให้ยกเลิกการแจ้งเตือนที่ตั้งไว้
          if (targetAlarm.notificationId) {
            await cancelAlarmNotification(targetAlarm.notificationId);
            console.log(`Notification cancelled for alarm ${alarmId}`);
          }
          await saveAlarms(updatedAlarms);
        }
      }
    } catch (error) {
      console.error("Error toggling alarm:", error);
      Alert.alert("Error", "Could not change alarm status");
    }
  };

  const deleteAlarm = async (alarmId) => {
    try {
      const success = await deleteAlarmFromStorage(alarmId);
      if (success) {
        const alarm = alarms.find((a) => a.id === alarmId);
        if (alarm?.notificationId) {
          await cancelAlarmNotification(alarm.notificationId);
        }
        const updatedAlarms = alarms.filter((alarm) => alarm.id !== alarmId);
        setAlarms(updatedAlarms);
      }
    } catch (error) {
      console.error("Error deleting alarm:", error);
      Alert.alert("Error", "Could not delete the alarm");
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const getDaysText = (days) => {
    if (!days || days.length === 0) return "Once";
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (days.length === 7) return "Every day";

    // Check for weekdays pattern
    const weekdaysArray = [0, 1, 2, 3, 4];
    const weekendArray = [5, 6];

    const hasAllWeekdays = weekdaysArray.every((day) => days.includes(day));
    if (hasAllWeekdays && days.length === 5) return "Weekdays";

    const hasAllWeekend = weekendArray.every((day) => days.includes(day));
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
          "Delete Alarm",
          "Are you sure you want to delete this alarm?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteAlarm(item.id),
            },
          ]
        );
      }}
      ref={(ref) => {
        if (
          ref &&
          item.id === swipeableRef?.current?.props?.children?.props?.item?.id
        ) {
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
            <Text
              style={[styles.timeText, !item.isActive && styles.inactiveText]}
            >
              {formatTime(item.hour, item.minute)}
            </Text>
            <View style={styles.alarmDetailsContainer}>
              {item.label ? (
                <Text
                  style={[
                    styles.labelText,
                    !item.isActive && styles.inactiveText,
                  ]}
                >
                  {item.label}
                </Text>
              ) : null}
              <Text
                style={[styles.daysText, !item.isActive && styles.inactiveText]}
              >
                {getDaysText(item.repeatDays)}
              </Text>
            </View>
          </View>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleAlarmActive(item.id, item.isActive)}
            trackColor={{ false: "#767577", true: "#34C759" }}
            thumbColor={item.isActive ? "#FFFFFF" : "#F4F3F4"}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  // Add test mini-game function to quickly test the mini-game feature
  const testMiniGameAlarm = () => {
    try {
      // Create test alarm data with mini-game enabled
      const testAlarmData = {
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        repeatDays: [],
        isActive: true,
        userId: "test-user",
        label: "Mini-Game Test Alarm",
        soundId: "default",
        soundName: "Default",
        snooze: true,
        isTest: true,
        // Mini-game settings
        requireGame: true,
        gameType: "memory", // Options: math, memory, photo
        gameDifficulty: "easy", // Options: easy, medium, hard
      };

      console.log("Testing mini-game alarm with settings:", JSON.stringify(testAlarmData, null, 2));

      // แสดงข้อความยืนยันก่อนทดสอบ
      Alert.alert(
        "ทดสอบการปลุกพร้อมเกม",
        "จะมีการจำลองการปลุกพร้อมเกมจับคู่ (ระดับง่าย) ให้คุณทดสอบ",
        [
          { text: "ยกเลิก", style: "cancel" },
          { 
            text: "ทดสอบเลย", 
            onPress: () => {
              // Navigate to AlarmRinging with our test alarm
              navigation.navigate("AlarmRinging", {
                alarm: testAlarmData,
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error testing mini-game alarm:", error);
      Alert.alert("Error", "Could not test mini-game alarm");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate("AddAlarm")}
      >
        <Icon name="plus" size={30} color="#FFFFFF" />
      </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  headerButton: {
    marginHorizontal: 5,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
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
    fontVariant: ["tabular-nums"],
    marginBottom: 8,
  },
  alarmDetailsContainer: {
    flexDirection: "column",
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 150,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  testButton: {
    backgroundColor: "#0A84FF",
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  gameButton: {
    backgroundColor: "#FF9500",
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  gameButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
});

export default AlarmListScreen;
