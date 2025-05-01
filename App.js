import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "./supabase.config";
// Import Firebase configuration
import { auth, db, storage, initializeAlarmCache } from './firebase.config';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar, TouchableOpacity, Alert } from "react-native";
import { AuthProvider, UserAuth } from "./models/UserAuth";
import 'react-native-url-polyfill/auto';
import * as Notifications from "expo-notifications";
import { setupNotificationListeners, checkNotificationPermissions } from "./models/NotificationManager";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AlarmListScreen from "./screens/AlarmListScreen";
import AddAlarmScreen from "./screens/AddAlarmScreen";
import AlarmRingingScreen from "./screens/AlarmRingingScreen";
import MathTaskScreen from "./screens/tasks/MathTaskScreen";
import PhotoTaskScreen from "./screens/tasks/PhotoTaskScreen";
import SoundLibraryScreen from "./screens/SoundLibraryScreen";

const AuthStack = createStackNavigator();
const MainTab = createBottomTabNavigator();
const AlarmStack = createStackNavigator();

const AppContent = () => {
  const { user } = UserAuth();
  const navigationRef = useRef(null);

  // Initialize Firebase alarm cache
  useEffect(() => {
    initializeAlarmCache().catch(error => {
      console.error("Error initializing alarm cache:", error);
    });
  }, []);

  // ตั้งค่าการแจ้งเตือน
  useEffect(() => {
    // ตั้งค่าการแสดงการแจ้งเตือนเมื่อแอปกำลังทำงาน
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // ตรวจสอบและขอสิทธิ์การแจ้งเตือน
    checkNotificationPermissions();

    // ตั้งค่าการจัดการเมื่อได้รับการแจ้งเตือน
    const unsubscribe = setupNotificationListeners(navigationRef.current);

    // ยกเลิกการติดตามเมื่อ component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#12111D"
          translucent={false}
        />
        <AppContent />
      </PaperProvider>
    </AuthProvider>
  );
}

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
const AlarmStackNavigator = () => {
  const { logout } = UserAuth();

  // ฟังก์ชันสำหรับออกจากระบบ
  const handleLogout = () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        {
          text: "ยกเลิก",
          style: "cancel"
        },
        {
          text: "ออกจากระบบ",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("ข้อผิดพลาด", "ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง");
            }
          }
        }
      ]
    );
  };

  return (
    <AlarmStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#12111D",
        },
        headerTintColor: "#fff",
        cardStyle: { backgroundColor: "#12111D" },
      }}
    >
      <AlarmStack.Screen
        name="AlarmList"
        component={AlarmListScreen}
        options={{
          title: "นาฬิกาปลุก",
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={handleLogout}
            >
              <Icon name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <AlarmStack.Screen
        name="AddAlarm"
        component={AddAlarmScreen}
        options={{
          headerShown: false, // ซ่อน header
          presentation: "modal",
          gestureEnabled: true,
          gestureDirection: "vertical",
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                },
              ],
            },
          }),
        }}
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
};

// แก้ไข MainNavigator ให้ซ่อน tab bar เมื่ออยู่ในหน้าเพิ่มนาฬิกาปลุก
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={() => ({
        tabBarStyle: {
          backgroundColor: "#D8D5F5",
          borderTopColor: "#12111D",
        },
        tabBarIcon: ({ focused, size }) => {
          let iconName = focused ? "alarm" : "alarm-off";
          return <Icon name={iconName} size={size} color="#000000" />;
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#000000",
      })}
    >
      <MainTab.Screen
        name="Alarm"
        component={AlarmStackNavigator}
        options={({ route }) => ({
          headerShown: false,
          title: "ปลุก",
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? "";
            if (routeName === "AddAlarm" || routeName === "SoundLibrary") {
              return { display: "none" };
            }
            return;
          })(route),
        })}
      />
    </MainTab.Navigator>
  );
};
