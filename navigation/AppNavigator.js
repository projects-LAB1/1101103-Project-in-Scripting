import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WorldClockNavigator from "./WorldClockNavigator";
import AlarmNavigator from "./AlarmNavigator";
import StopwatchScreen from "../screens/StopwatchScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SleepNavigator from "./SleepNavigator";

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF9500", // iPhone's orange accent color
        tabBarInactiveTintColor: "gray",
        headerStyle: {
          backgroundColor: "#000000",
        },
        headerTintColor: "#FFFFFF",
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#333333",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="WorldClock"
        component={WorldClockNavigator}
        options={{
          title: "นาฬิกาโลก",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="earth" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alarm"
        component={AlarmNavigator}
        options={{
          title: "ปลุก",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="alarm" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sleep"
        component={SleepNavigator}
        options={{
          title: "การนอน",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sleep" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stopwatch"
        component={StopwatchScreen}
        options={{
          title: "จับเวลา",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="timer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "ตั้งค่า",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
