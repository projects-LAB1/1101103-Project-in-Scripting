// App.js - หน้าหลักของแอป
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
// Import Firebase configuration
import { auth } from "./firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { UserAuth } from "./models/UserAuth";
import { registerForPushNotificationsAsync, savePushToken, setupNotificationListeners } from "./models/NotificationManager";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AlarmListScreen from "./screens/AlarmListScreen";
import AddAlarmScreen from "./screens/AddAlarmScreen";
import AlarmRingingScreen from "./screens/AlarmRingingScreen";
import MathTaskScreen from "./screens/tasks/MathTaskScreen";
import PhotoTaskScreen from "./screens/tasks/PhotoTaskScreen";
import StatisticsScreen from "./screens/StatisticsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SoundLibraryScreen from "./screens/SoundLibraryScreen";

const AuthStack = createStackNavigator();
const MainTab = createBottomTabNavigator();
const AlarmStack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Use the imported auth instance instead of calling getAuth() again
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
      
      // ลงทะเบียนการแจ้งเตือนเมื่อผู้ใช้ล็อกอิน
      if (user) {
        // ขอสิทธิ์การแจ้งเตือนและบันทึก token
        registerForPushNotificationsAsync().then(token => {
          if (token) {
            savePushToken(user.uid, token);
          } else {
            console.log('ไม่สามารถรับ Push Token ได้');
          }
        }).catch(error => {
          console.error('เกิดข้อผิดพลาดในการลงทะเบียนการแจ้งเตือน:', error);
        });
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, [initializing]);
  
  // ตั้งค่าการฟังการแจ้งเตือน
  useEffect(() => {
    if (!user) return;
    
    // ตั้งค่าการฟังการแจ้งเตือนเมื่อผู้ใช้ล็อกอินแล้ว
    const navigationRef = React.createRef();
    const unsubscribeNotifications = setupNotificationListeners(navigationRef.current);
    
    return () => {
      // ยกเลิกการฟังการแจ้งเตือนเมื่อคอมโพเนนต์ถูกทำลาย
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [user]);

  if (initializing) {
    return null; // หรือแสดง LoadingScreen
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        {!user ? <AuthNavigator /> : <MainNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// ส่วนของการนำทางสำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ส่วนของการนำทางสำหรับหน้านาฬิกาปลุก
const AlarmStackNavigator = () => (
  <AlarmStack.Navigator>
    <AlarmStack.Screen
      name="AlarmList"
      component={AlarmListScreen}
      options={({ navigation }) => ({
        title: "นาฬิกาปลุก",
        headerRight: () => (
          <Icon
            name="plus"
            size={24}
            style={{ marginRight: 15 }}
            onPress={() => navigation.navigate("AddAlarm")}
          />
        ),
      })}
    />
    <AlarmStack.Screen
      name="AddAlarm"
      component={AddAlarmScreen}
      options={{ title: "เพิ่มนาฬิกาปลุก" }}
    />
    <AlarmStack.Screen
      name="AlarmRinging"
      component={AlarmRingingScreen}
      options={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />
    <AlarmStack.Screen
      name="MathTask"
      component={MathTaskScreen}
      options={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />
    <AlarmStack.Screen
      name="PhotoTask"
      component={PhotoTaskScreen}
      options={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />
    <AlarmStack.Screen
      name="SoundLibrary"
      component={SoundLibraryScreen}
      options={{ title: "เลือกเสียงปลุก" }}
    />
  </AlarmStack.Navigator>
);

// ส่วนของการนำทางหลักสำหรับผู้ใช้ที่ล็อกอินแล้ว
const MainNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === "Alarm") {
          iconName = focused ? "alarm" : "alarm-outline";
        } else if (route.name === "Statistics") {
          iconName = focused ? "chart-bar" : "chart-bar-outline";
        } else if (route.name === "Profile") {
          iconName = focused ? "account" : "account-outline";
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4F46E5",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <MainTab.Screen
      name="Alarm"
      component={AlarmStackNavigator}
      options={{ headerShown: false, title: "ปลุก" }}
    />
    <MainTab.Screen
      name="Statistics"
      component={StatisticsScreen}
      options={{ title: "สถิติ" }}
    />
    <MainTab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: "โปรไฟล์" }}
    />
  </MainTab.Navigator>
);

export default App;
