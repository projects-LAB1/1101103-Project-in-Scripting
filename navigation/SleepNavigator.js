import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SleepHomeScreen from '../screens/sleep/SleepHomeScreen';
import SleepHistoryScreen from '../screens/sleep/SleepHistoryScreen';
import SleepEntryScreen from '../screens/sleep/SleepEntryScreen';
import SleepAnalyticsScreen from '../screens/sleep/SleepAnalyticsScreen';
import SleepGoalsScreen from '../screens/sleep/SleepGoalsScreen';

const Stack = createStackNavigator();

const SleepNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="SleepHome"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#000000',
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        cardStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen 
        name="SleepHome" 
        component={SleepHomeScreen}
        options={{
          title: 'การนอนหลับ',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen 
        name="SleepHistory" 
        component={SleepHistoryScreen}
        options={{
          title: 'ประวัติการนอน',
          headerBackTitle: 'กลับ',
        }}
      />
      <Stack.Screen 
        name="SleepEntry" 
        component={SleepEntryScreen}
        options={({ route }) => ({
          title: route.params?.editing ? 'แก้ไขการนอน' : 'เพิ่มการนอน',
          headerBackTitle: 'กลับ',
        })}
      />
      <Stack.Screen 
        name="SleepAnalytics" 
        component={SleepAnalyticsScreen}
        options={{
          title: 'วิเคราะห์การนอน',
          headerBackTitle: 'กลับ',
        }}
      />
      <Stack.Screen 
        name="SleepGoals" 
        component={SleepGoalsScreen}
        options={{
          title: 'เป้าหมายการนอน',
          headerBackTitle: 'กลับ',
        }}
      />
    </Stack.Navigator>
  );
};

export default SleepNavigator; 