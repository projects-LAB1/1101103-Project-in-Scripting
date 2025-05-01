import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "./supabase.config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar, TouchableOpacity, Alert, Linking } from "react-native";
import { AuthProvider, UserAuth } from "./models/UserAuth";
import 'react-native-url-polyfill/auto';
import * as Notifications from "expo-notifications";
import { setupNotificationListeners, checkNotificationPermissions } from "./models/NotificationManager";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import AlarmListScreen from "./screens/AlarmListScreen";
import AddAlarmScreen from "./screens/AddAlarmScreen";
import AlarmRingingScreen from "./screens/AlarmRingingScreen";
import MathTaskScreen from "./screens/tasks/MathTaskScreen";
import PhotoTaskScreen from "./screens/tasks/PhotoTaskScreen";
import SoundLibraryScreen from "./screens/SoundLibraryScreen";
import TestAlarmScreen from "./screens/TestAlarmScreen";
import HelpScreen from "./screens/HelpScreen";

const AuthStack = createStackNavigator();
const MainTab = createBottomTabNavigator();
const AlarmStack = createStackNavigator();

// สร้างการกำหนดค่า linking สำหรับการทำ deep linking
const linking = {
  prefixes: ['myproj://', 'https://myproj.app', 'https://iabspnskcaiobwtfxxtv.supabase.co'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      // ระบุ path สำหรับการเรียกใช้งานจาก OAuth callback
      Auth: {
        path: 'auth/callback'
      },
      ResetPasswordAuth: {
        path: 'auth/v1/callback'
      }
    },
  },
};

const AppContent = () => {
  const { user } = UserAuth();
  const navigationRef = useRef(null);

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
    <NavigationContainer ref={navigationRef} linking={linking}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  // ตั้งค่าตรวจสอบ deep link ตั้งแต่เริ่มต้นแอป
  useEffect(() => {
    // ตรวจสอบว่าแอปถูกเปิดจาก deep link หรือไม่
    const getInitialURL = async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        console.log('App opened with URL:', initialURL);
      }
    };

    getInitialURL();

    // ลงทะเบียนสำหรับข้อมูล URL ที่เข้ามาเมื่อแอปกำลังทำงาน
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Incoming URL:', url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
      <AlarmStack.Screen
        name="TestAlarm"
        component={TestAlarmScreen}
        options={{ title: "ทดสอบนาฬิกาปลุก" }}
      />
      <AlarmStack.Screen
        name="Help"
        component={HelpScreen}
        options={{ 
          title: "วิธีใช้งาน",
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerTintColor: "#000000",
          cardStyle: { backgroundColor: "#FFFFFF" },
        }}
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
