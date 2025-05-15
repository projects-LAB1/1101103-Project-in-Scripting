import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { setupNotificationListeners } from "../models/NotificationManager";

const Stack = createStackNavigator();

// Customize dark theme to match iOS dark mode
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#FF9500",
    background: "#000000",
    card: "#000000",
    text: "#FFFFFF",
    border: "#1C1C1E",
  },
};

const RootNavigator = forwardRef((props, ref) => {
  const { user, loading } = useAuth();
  const internalNavigationRef = useRef(null);
  
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
    <NavigationContainer theme={CustomDarkTheme} ref={internalNavigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* เริ่มต้นด้วยหน้า Main เสมอไม่ว่าจะล็อกอินหรือไม่ */}
        <Stack.Screen name="Main" component={AppNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Login" component={AuthNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default RootNavigator;
