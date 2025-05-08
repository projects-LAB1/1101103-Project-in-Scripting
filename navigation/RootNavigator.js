import React, { useEffect, useRef } from "react";
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

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);

  // Set up notification listeners when the component mounts
  useEffect(() => {
    // ตั้งค่าผู้ฟังการแจ้งเตือนทันทีเมื่อมีการโหลดแอป ไม่ต้องรอให้ผู้ใช้ล็อกอิน
    const unsubscribe = setupNotificationListeners(navigationRef.current);
    console.log("Notification listeners set up in RootNavigator");

    // Clean up the notification listeners when the component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log("Notification listeners cleaned up");
      }
    };
  }, []);

  if (loading) {
    // TODO: Add a proper splash screen here
    return null;
  }

  return (
    <NavigationContainer theme={CustomDarkTheme} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="App" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
