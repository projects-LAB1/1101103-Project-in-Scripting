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
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../supabase.config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FAB } from "react-native-paper";
import { Swipeable } from "react-native-gesture-handler";
import { UserAuth } from "../models/UserAuth";
import { scheduleAlarmNotification, cancelAlarmNotification } from "../models/NotificationManager";

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { user } = UserAuth();

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOffline(!isConnected);
    });

    // Initial network check
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOffline(!isConnected);
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  // Subscribe to alarms changes
  useEffect(() => {
    if (!user?.id) return;

    // Set up realtime subscription
    const channel = supabase
      .channel('alarms')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alarms',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        fetchAlarms();
      })
      .subscribe();

    // Initial fetch
    fetchAlarms();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAlarms = async () => {
    try {
      const { data: alarmList, error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', user.id)
        .order('hour, minute');

      if (error) throw error;

      setAlarms(alarmList || []);
      setLoading(false);
      setRefreshing(false);
      setIsOffline(false);
    } catch (error) {
      console.error("Error fetching alarms:", error);
      setLoading(false);
      setRefreshing(false);

      if (!navigator.onLine) {
        setIsOffline(true);
        if (alarms.length === 0) {
          Alert.alert(
            "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
            "กำลังแสดงข้อมูลที่บันทึกไว้ล่าสุด"
          );
        }
      } else {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดรายการนาฬิกาปลุกได้");
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (!isConnected) {
        setRefreshing(false);
        setIsOffline(true);
        Alert.alert(
          "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
          "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง"
        );
      } else {
        fetchAlarms();
      }
    });
  };

  const toggleAlarmActive = async (alarmId, currentStatus) => {
    try {
      console.log(`กำลังเปลี่ยนสถานะนาฬิกาปลุก ID: ${alarmId}, สถานะปัจจุบัน: ${currentStatus}`);

      // Get the full alarm data
      const { data: alarm, error: fetchError } = await supabase
        .from('alarms')
        .select('*')
        .eq('id', alarmId)
        .single();

      if (fetchError) throw fetchError;

      const newStatus = !currentStatus;
      console.log(`สถานะใหม่: ${newStatus}`);

      // อัปเดตข้อมูลในแอปก่อนเพื่อให้ UI ตอบสนองทันที
      console.log(`กำลังอัปเดตข้อมูลในแอป: ${alarmId} -> ${newStatus}`);

      // สร้างสำเนาของข้อมูลและอัปเดตเฉพาะรายการที่ต้องการ
      const updatedAlarms = [...alarms];
      const alarmIndex = updatedAlarms.findIndex(item => item.id === alarmId);

      if (alarmIndex !== -1) {
        updatedAlarms[alarmIndex] = {
          ...updatedAlarms[alarmIndex],
          is_active: newStatus
        };
        setAlarms(updatedAlarms);
        console.log(`อัปเดตข้อมูลในแอปสำเร็จ`);
      } else {
        console.log(`ไม่พบนาฬิกาปลุก ID: ${alarmId} ในข้อมูลปัจจุบัน`);
      }

      // Update the alarm status in database
      console.log(`กำลังอัปเดตสถานะในฐานข้อมูล: ${alarmId} -> ${newStatus}`);
      const { data: updateData, error: updateError } = await supabase
        .from('alarms')
        .update({
          is_active: newStatus,
          updated_at: new Date()
        })
        .eq('id', alarmId)
        .select();

      if (updateError) {
        console.error("Error updating alarm status:", updateError);
        throw updateError;
      }

      console.log(`อัปเดตสถานะสำเร็จ:`, updateData);

      // Handle notifications
      if (newStatus) {
        // ส่งข้อมูลที่ถูกต้องไปยัง scheduleAlarmNotification
        console.log(`กำลังตั้งการแจ้งเตือนสำหรับนาฬิกาปลุก ID: ${alarmId}`);
        
        // ตรวจสอบว่ามีข้อมูลครบถ้วนก่อนส่งไปยัง scheduleAlarmNotification
        if (alarm && alarm.hour !== undefined && alarm.minute !== undefined) {
          // บันทึกเวลาเริ่มต้นก่อนตั้งค่านาฬิกาปลุก
          console.log(`เริ่มตั้งค่านาฬิกาปลุกเวลา: ${new Date().toLocaleTimeString()}`);
          
          const notificationId = await scheduleAlarmNotification({
            ...alarm,
            id: alarm.id,
            hour: alarm.hour,
            minute: alarm.minute,
            repeat_days: alarm.repeat_days || [],
            is_active: true
          });

          if (notificationId) {
            console.log(`ได้รับ notification ID: ${notificationId}`);
            await supabase
              .from('alarms')
              .update({ notification_id: notificationId })
              .eq('id', alarmId);
            
            console.log("ตั้งค่านาฬิกาปลุกเรียบร้อยแล้ว กลับไปที่หน้ารายการนาฬิกาปลุก");
          } else {
            console.error("ไม่สามารถตั้งการแจ้งเตือนได้");
            // อัปเดตสถานะกลับเป็นปิด ถ้าไม่สามารถตั้งการแจ้งเตือนได้
            await supabase
              .from('alarms')
              .update({ is_active: false })
              .eq('id', alarmId);
            
            // ดึงข้อมูลใหม่เพื่ออัปเดต UI
            fetchAlarms();
          }
        } else {
          console.error("ข้อมูลนาฬิกาปลุกไม่ครบถ้วน:", alarm);
        }
      } else if (alarm.notification_id) {
        console.log(`กำลังยกเลิกการแจ้งเตือน ID: ${alarm.notification_id}`);
        await cancelAlarmNotification(alarm.notification_id);
        await supabase
          .from('alarms')
          .update({ notification_id: null })
          .eq('id', alarmId);
      }

      // ดึงข้อมูลใหม่เพื่ออัปเดต UI
      fetchAlarms();

    } catch (error) {
      console.error("Error toggling alarm:", error);
      // ไม่แสดง Alert เมื่อเปิด/ปิดนาฬิกาปลุก เพื่อไม่ให้รบกวนผู้ใช้
      // เพียงแค่บันทึกข้อผิดพลาดลงใน console

      // กรณีเกิดข้อผิดพลาด ให้ดึงข้อมูลใหม่เพื่อให้ UI แสดงสถานะที่ถูกต้อง
      fetchAlarms();
    }
  };

  const deleteAlarm = async (alarmId) => {
    try {
      const { error } = await supabase
        .from('alarms')
        .delete()
        .eq('id', alarmId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting alarm:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบนาฬิกาปลุกได้");
    }
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const getDaysText = (days) => {
    if (!days || days.length === 0) return "ครั้งเดียว";

    const dayNames = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

    if (days.length === 7) return "ทุกวัน";

    return days.map((day) => dayNames[day]).join(", ");
  };

  // สร้าง component สำหรับปุ่มลบที่จะแสดงเมื่อเลื่อนรายการไปทางซ้าย
  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <View style={styles.deleteActionContent}>
          <Icon name="trash-can-outline" size={28} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>ลบ</Text>
        </View>
      </Animated.View>
    );
  };

  // อ้างอิงไปยัง Swipeable ที่กำลังเปิดอยู่
  const swipeableRef = useRef(null);

  // ปิด Swipeable ที่เปิดอยู่เมื่อเปิด Swipeable ใหม่
  const closeOpenSwipeable = (ref) => {
    if (swipeableRef.current && swipeableRef.current !== ref) {
      swipeableRef.current.close();
    }
    swipeableRef.current = ref;
  };

  const renderAlarmItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
      onSwipeableOpen={() => {
        closeOpenSwipeable(swipeableRef.current);
        deleteAlarm(item.id);
      }}
      ref={(ref) => {
        if (ref && !swipeableRef.current) {
          swipeableRef.current = ref;
        }
      }}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={styles.alarmItem}>
        <TouchableOpacity
          style={styles.alarmInfo}
          onPress={() => navigation.navigate("AddAlarm", { alarm: item })}
        >
          <Text style={styles.alarmTime}>
            {formatTime(item.hour, item.minute)}
          </Text>
          <Text style={styles.alarmDays}>{getDaysText(item.repeat_days)}</Text>
          <Text style={styles.alarmLabel}>{item.label || "นาฬิกาปลุก"}</Text>
          <Text style={styles.alarmTask}>
            {item.task_type === "math"
              ? "โจทย์คณิตศาสตร์"
              : item.task_type === "photo"
              ? "ถ่ายรูป"
              : item.task_type === "random"
              ? "สุ่มภารกิจ"
              : "ปกติ"}
          </Text>
        </TouchableOpacity>

        <View style={styles.alarmActions}>
          <Switch
            value={Boolean(item.is_active)}
            onValueChange={() => {
              console.log(`กดปุ่มเปิด/ปิดนาฬิกาปลุก ID: ${item.id}, สถานะปัจจุบัน: ${item.is_active}`);
              toggleAlarmActive(item.id, item.is_active);
            }}
            trackColor={{ false: "#D1D5DB", true: "#4F46E5" }}
            thumbColor={Boolean(item.is_active) ? "#FFFFFF" : "#F3F4F6"}
            disabled={false}
          />
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ออฟไลน์ - แสดงข้อมูลที่บันทึกไว้
          </Text>
        </View>
      )}

      <View style={styles.headerButtonsContainer}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => navigation.navigate("TestAlarm")}
        >
          <Icon name="test-tube" size={16} color="#FFFFFF" />
          <Text style={styles.testButtonText}>ทดสอบนาฬิกาปลุก</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation.navigate("Help")}
        >
          <Icon name="help-circle" size={16} color="#FFFFFF" />
          <Text style={styles.helpButtonText}>ช่วยเหลือ</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : alarms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="alarm-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>ไม่มีนาฬิกาปลุก</Text>
          <Text style={styles.emptySubText}>
            กดปุ่ม + เพื่อเพิ่มนาฬิกาปลุกใหม่
          </Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          renderItem={renderAlarmItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddAlarm")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12111D",
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10, // Spacing between buttons
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  helpButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B5563",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  alarmItem: {
    flexDirection: "row",
    backgroundColor: "#1F1D2B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#2A2838",
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: 1,
  },
  alarmDays: {
    fontSize: 14,
    color: "#a5b4fc",
    marginBottom: 6,
    fontWeight: "500",
  },
  alarmLabel: {
    fontSize: 16,
    color: "#c7d2fe",
    marginBottom: 6,
    fontWeight: "500",
  },
  alarmTask: {
    fontSize: 14,
    color: "#818cf8",
    fontWeight: "500",
  },
  alarmActions: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 16,
  },
  deleteButton: {
    marginTop: 12,
    padding: 4,
  },
  deleteAction: {
    backgroundColor: "rgb(239, 68, 68)", // ปรับความโปร่งใสของสีแดงให้มากขึ้น
    justifyContent: "center",
    alignItems: "center",
    width: 160,
    height: "93%",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)", // เพิ่มขอบให้ชัดขึ้นเล็กน้อย
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteActionContent: {
    justifyContent: "center",
    alignItems: "center",
    width: "75%",
    height: "75%",
  },
  deleteActionText: {
    color: "rgba(255, 255, 255, 0.9)", // ทำให้ข้อความมีความโปร่งใสเล็กน้อย
    fontWeight: "600", // ปรับความหนาของตัวอักษร
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5, // เพิ่มระยะห่างระหว่างตัวอักษร
  },
  offlineBanner: {
    backgroundColor: "#EF4444",
    padding: 8,
    alignItems: "center",
    width: "100%",
  },
  offlineText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "#D8D5F5",
    borderRadius: 28,
    width: 56,
    height: 56,
  },
});

export default AlarmListScreen;
