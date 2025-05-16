import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { setupNotificationListeners } from "../models/NotificationManager";
import { CardStyleInterpolators } from '@react-navigation/stack';

const Stack = createStackNavigator();

// กำหนด config สำหรับ transition ที่สวยงาม
const createScreenOptions = (isDark) => ({
  headerShown: false,
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  cardStyle: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
  // เพิ่ม transition animation
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 350,
      },
    },
  },
});

const RootNavigator = forwardRef((props, ref) => {
  const { user, loading } = useAuth();
  const { theme, isDark } = useTheme();
  const internalNavigationRef = useRef(null);
  
  // สร้าง navigation theme จากธีมปัจจุบัน
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };
  
  // Screen options ตามธีม
  const screenOptions = createScreenOptions(isDark);
  
  // Forward navigation methods to parent component
  useImperativeHandle(ref, () => ({
    // Expose the navigation object methods
    navigate: (name, params) => {
      if (internalNavigationRef.current) {
        internalNavigationRef.current.navigate(name, params);
      }
    },
    reset: (state) => {
      if (internalNavigationRef.current) {
        internalNavigationRef.current.reset(state);
      }
    },
    goBack: () => {
      if (internalNavigationRef.current) {
        internalNavigationRef.current.goBack();
      }
    },
    // Add custom methods if needed
    getRootState: () => {
      if (internalNavigationRef.current) {
        return internalNavigationRef.current.getRootState();
      }
      return null;
    },
  }));

  // Set up notification listeners when the component mounts
  useEffect(() => {
    try {
      // ตั้งค่าผู้ฟังการแจ้งเตือนทันทีเมื่อมีการโหลดแอป ไม่ต้องรอให้ผู้ใช้ล็อกอิน
      const unsubscribe = setupNotificationListeners(internalNavigationRef.current);
      console.log("Notification listeners set up in RootNavigator");

      // Clean up the notification listeners when the component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
          console.log("Notification listeners cleaned up");
        }
      };
    } catch (error) {
      console.error("Error setting up notification listeners:", error);
      return () => {}; // Return empty cleanup function in case of error
    }
  }, []);

  // ไม่ใช้ loading state อีกต่อไปเพื่อป้องกันการค้าง
  // if (loading) {
  //   // TODO: Add a proper splash screen here
  //   return null;
  // }

  return (
    <NavigationContainer theme={navigationTheme} ref={internalNavigationRef}>
      <Stack.Navigator screenOptions={screenOptions}>
        {/* เริ่มต้นด้วยหน้า Main เสมอไม่ว่าจะล็อกอินหรือไม่ */}
        <Stack.Screen name="Main" component={AppNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="LoginRoot" component={AuthNavigator} initialParams={{ screen: 'Login' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default RootNavigator;
