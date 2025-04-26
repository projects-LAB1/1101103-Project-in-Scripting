// AlarmListScreen.js - หน้าแสดงรายการนาฬิกาปลุก
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FAB } from "react-native-paper";
import { Swipeable } from "react-native-gesture-handler";
import { UserAuth } from "../models/UserAuth";

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ใช้ hook จาก UserAuth เพื่อเข้าถึงฟังก์ชัน logout
  const { logout } = UserAuth();

  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

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



  useEffect(() => {
    if (!userId) return;

    // Subscribe to alarms collection for the current user
    const alarmsRef = collection(db, "alarms");
    const userAlarmsQuery = query(alarmsRef, where("userId", "==", userId));

    const unsubscribe = onSnapshot(
      userAlarmsQuery,
      (snapshot) => {
        const alarmList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort alarms by time
        alarmList.sort((a, b) => {
          const timeA = a.hour * 60 + a.minute;
          const timeB = b.hour * 60 + b.minute;
          return timeA - timeB;
        });

        setAlarms(alarmList);
        setLoading(false);
        setRefreshing(false);
        setIsOffline(false); // Successfully loaded data, so we're online
      },
      (error) => {
        console.error("Error fetching alarms:", error);
        setLoading(false);
        setRefreshing(false);

        // Check if error is due to being offline
        if (
          error.code === "unavailable" ||
          error.code === "failed-precondition" ||
          error.message.includes("offline") ||
          error.message.includes("network") ||
          error.message.includes("client is offline")
        ) {
          setIsOffline(true);
          // If we have cached data, don't show an error
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
    );

    return unsubscribe;
  }, [userId, db]);

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    // Check network status
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (!isConnected) {
        setRefreshing(false);
        setIsOffline(true);
        Alert.alert(
          "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
          "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง"
        );
      }
      // The Firestore listener will automatically update when back online
    });
  };

  // Import notification functions
  const {
    scheduleAlarmNotification,
    cancelAlarmNotification,
  } = require("../models/NotificationManager");

  const toggleAlarmActive = async (alarmId, currentStatus) => {
    try {
      // Get the full alarm data
      const alarmRef = doc(db, "alarms", alarmId);
      const alarmDoc = await getDoc(alarmRef);

      if (!alarmDoc.exists()) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลนาฬิกาปลุก");
        return;
      }

      const alarmData = { id: alarmId, ...alarmDoc.data() };
      const newStatus = !currentStatus;

      // Update the alarm status
      await updateDoc(alarmRef, {
        isActive: newStatus,
      });

      // Schedule or cancel notification based on new status
      if (newStatus) {
        // Schedule notification
        const notificationId = await scheduleAlarmNotification({
          ...alarmData,
          isActive: true,
        });

        // Save notification ID
        if (notificationId) {
          await updateDoc(alarmRef, { notificationId });
        }
      } else if (alarmData.notificationId) {
        // Cancel notification
        await cancelAlarmNotification(alarmData.notificationId);

        // Remove notification ID
        await updateDoc(alarmRef, { notificationId: null });
      }
    } catch (error) {
      console.error("Error toggling alarm:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเปลี่ยนสถานะนาฬิกาปลุกได้");
    }
  };

  const deleteAlarm = async (alarmId) => {
    try {
      const alarmRef = doc(db, "alarms", alarmId);
      await deleteDoc(alarmRef);
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
          <Text style={styles.alarmDays}>{getDaysText(item.repeatDays)}</Text>
          <Text style={styles.alarmLabel}>{item.label || "นาฬิกาปลุก"}</Text>
          <Text style={styles.alarmTask}>
            {item.taskType === "math"
              ? "โจทย์คณิตศาสตร์"
              : item.taskType === "photo"
              ? "ถ่ายรูป"
              : item.taskType === "random"
              ? "สุ่มภารกิจ"
              : "ปกติ"}
          </Text>
        </TouchableOpacity>

        <View style={styles.alarmActions}>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleAlarmActive(item.id, item.isActive)}
            trackColor={{ false: "#D1D5DB", true: "#4F46E5" }}
            thumbColor={item.isActive ? "#FFFFFF" : "#F3F4F6"}
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
