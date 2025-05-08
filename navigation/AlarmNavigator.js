import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AlarmListScreen from '../screens/AlarmListScreen';
import AddAlarmScreen from '../screens/AddAlarmScreen';
import RepeatDaysScreen from '../screens/RepeatDaysScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';

const Stack = createStackNavigator();

const AlarmNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="AlarmList" 
        component={AlarmListScreen}
        options={{
          title: 'ปลุก',
        }}
      />
      <Stack.Screen 
        name="AddAlarm" 
        component={AddAlarmScreen}
        options={{
          title: 'เพิ่มการปลุก',
        }}
      />
      <Stack.Screen 
        name="RepeatDays" 
        component={RepeatDaysScreen}
        options={{
          title: 'ทำซ้ำ',
        }}
      />
      <Stack.Screen 
        name="AlarmRinging" 
        component={AlarmRingingScreen}
        options={{
          title: 'กำลังปลุก',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AlarmNavigator; 