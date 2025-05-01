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
  getDocs,
  getDocsFromCache,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FAB } from "react-native-paper";
import { Swipeable } from "react-native-gesture-handler";

// ตั้งค่า persistence สำหรับ Firestore ตั้งแต่เริ่มต้น
try {
  const db = getFirestore();
  enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
  .catch((err) => {
    console.log("Firebase persistence error: ", err);
  });
} catch (error) {
  console.log("Firebase initialization error: ", error);
}

const AlarmListScreen = ({ navigation }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;
  const unsubscribeRef = useRef(null);
  
  // ฟังก์ชันสำหรับบันทึกข้อมูล alarms ล่าสุดลงใน AsyncStorage
  const cacheAlarms = async (alarmsData) => {
    try {
      await AsyncStorage.setItem('cached_alarms', JSON.stringify(alarmsData));
    } catch (error) {
      console.error("Error caching alarms:", error);
    }
  };

  // ฟังก์ชันสำหรับดึงข้อมูลจาก AsyncStorage
  const loadCachedAlarms = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cached_alarms');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setAlarms(parsedData);
        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Error loading cached alarms:", error);
    }
    return false;
  };

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

  // ช่วยให้โหลดเร็วขึ้นเมื่อเปิดแอปครั้งแรก โดยโหลดจาก cache ก่อน
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId) return;
      
      // ลองโหลดข้อมูลจาก cache ก่อน
      const hasCache = await loadCachedAlarms();
      
      if (!hasCache) {
        // ถ้าไม่มี cache ให้แสดงว่ากำลังโหลด
        setLoading(true);
      }
      
      // แสดงหน้าโหลดไม่เกิน 5 วินาที
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    };
    
    fetchInitialData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to alarms collection for the current user
    const alarmsRef = collection(db, "alarms");
    const userAlarmsQuery = query(alarmsRef, where("userId", "==", userId));
    
    // ลองดึงข้อมูลจาก cache ก่อน
    const fetchFromCacheFirst = async () => {
      try {
        // ลองดึงข้อมูลจาก local cache ก่อน
        const cachedSnapshot = await getDocsFromCache(userAlarmsQuery);
        if (!cachedSnapshot.empty) {
          const alarmList = cachedSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          // เรียงลำดับข้อมูล
          alarmList.sort((a, b) => {
            const timeA = a.hour * 60 + a.minute;
            const timeB = b.hour * 60 + b.minute;
            return timeA - timeB;
          });
          
          setAlarms(alarmList);
          setLoading(false);
          
          // บันทึกลง AsyncStorage เพื่อใช้ในครั้งถัดไป
          cacheAlarms(alarmList);
        }
      } catch (error) {
        console.log("Error getting cached data:", error);
      }
    };
    
    // เรียกใช้ดึงข้อมูลจาก cache ก่อน
    fetchFromCacheFirst();

    // ตั้งค่า listener เพื่อรับข้อมูลใหม่
    const unsubscribe = onSnapshot(
      userAlarmsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        // ตรวจสอบว่าข้อมูลมาจาก server จริงๆ หรือ cache
        const source = snapshot.metadata.fromCache ? "local cache" : "server";
        console.log("Data came from:", source);
        
        if (snapshot.metadata.hasPendingWrites) {
          // มีการเปลี่ยนแปลงข้อมูลแต่ยังไม่ได้บันทึกไปยัง server
          console.log("Has local changes that haven't been written to the server yet");
        }
        
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
        setIsInitialLoad(false);
        
        // บันทึกลง AsyncStorage เพื่อใช้ในครั้งถัดไป
        cacheAlarms(alarmList);
        
        // ถ้าข้อมูลมาจาก server จริงๆ แสดงว่าเราออนไลน์
        if (!snapshot.metadata.fromCache) {
          setIsOffline(false);
        }
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
          // ลองโหลดจาก cache ถ้ามีปัญหาเรื่องการเชื่อมต่อ
          loadCachedAlarms();
          
          // ถ้าเรามีข้อมูล cached ไม่ต้องแสดงข้อความ
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
    
    unsubscribeRef.current = unsubscribe;
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, db]);

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    // Check network status
    NetInfo.fetch().then(async (state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (!isConnected) {
        setRefreshing(false);
        setIsOffline(true);
        
        // ถ้าออฟไลน์ให้โหลดจาก cache
        await loadCachedAlarms();
        
        Alert.alert(
          "ไม่มีการเชื่อมต่ออินเทอร์เน็ต",
          "กำลังแสดงข้อมูลที่บันทึกไว้ล่าสุด"
        );
        return;
      }
      
      // ถ้าออนไลน์ให้พยายามโหลดข้อมูลใหม่จาก Firestore
      if (userId) {
        const alarmsRef = collection(db, "alarms");
        const userAlarmsQuery = query(alarmsRef, where("userId", "==", userId));
        
        try {
          const snapshot = await getDocs(userAlarmsQuery);
          const alarmList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          // เรียงลำดับข้อมูล
          alarmList.sort((a, b) => {
            const timeA = a.hour * 60 + a.minute;
            const timeB = b.hour * 60 + b.minute;
            return timeA - timeB;
          });
          
          setAlarms(alarmList);
          cacheAlarms(alarmList);
          setIsOffline(false);
        } catch (error) {
          console.error("Error refreshing alarms:", error);
          Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดรายการนาฬิกาปลุกใหม่ได้");
        }
      }
      
      setRefreshing(false);
    });
  };

  // Import notification functions
  const {
    scheduleAlarmNotification,
    cancelAlarmNotification,
  } = require("../models/NotificationManager");

  const toggleAlarmActive = async (alarmId, currentStatus) => {
    // เพิ่มการจัดการแบบ optimistic update
    // update state ทันที่แม้ว่าการเชื่อมต่อจะช้า
    setAlarms(prevAlarms =>
      prevAlarms.map(alarm =>
        alarm.id === alarmId 
          ? { ...alarm, isActive: !currentStatus }
          : alarm
      )
    );

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
      // ถ้ามีข้อผิดพลาดให้เปลี่ยน state กลับ
      setAlarms(prevAlarms =>
        prevAlarms.map(alarm =>
          alarm.id === alarmId 
            ? { ...alarm, isActive: currentStatus }
            : alarm
        )
      );
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเปลี่ยนสถานะนาฬิกาปลุกได้");
    }
  };

  // ใช้ optimistic delete สำหรับความรวดเร็วในการตอบสนอง UI
  const deleteAlarm = async (alarmId) => {
    // ลบออกจาก UI ก่อนทันที
    const deletedAlarm = alarms.find(alarm => alarm.id === alarmId);
    setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== alarmId));
    
    try {
      const alarmRef = doc(db, "alarms", alarmId);
      await deleteDoc(alarmRef);
      
      // อัพเดท cache
      cacheAlarms(alarms.filter(alarm => alarm.id !== alarmId));
    } catch (error) {
      console.error("Error deleting alarm:", error);
      
      // ถ้าเกิดข้อผิดพลาดให้เพิ่มกลับเข้าไป
      if (deletedAlarm) {
        setAlarms(prevAlarms => [...prevAlarms, deletedAlarm]);
      }
      
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบนาฬิกาปลุกได้");
    }
  };

  // ...ส่วนที่เหลือของโค้ดเหมือนเดิม...
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
            ออฟไน์ - แสดงข้อมูลที่บันทึกไว้
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
          initialNumToRender={10} // โหลดจำนวนไอเทมที่จะแสดงในครั้งแรก
          maxToRenderPerBatch={5} // จำนวนไอเทมที่จะเรนเดอร์ต่อครั้ง
          windowSize={10} // จำนวนหน้าจอที่จะโหลดไว้ก่อน
          removeClippedSubviews={true} // ช่วยประหยัด memory
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
