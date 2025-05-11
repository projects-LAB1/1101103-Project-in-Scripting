import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AlarmListScreen from '../screens/AlarmListScreen';
import AddAlarmScreen from '../screens/AddAlarmScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';
import RepeatDaysScreen from '../screens/RepeatDaysScreen';
import SoundLibraryScreen from '../screens/SoundLibraryScreen';
import SoundPickerScreen from '../screens/SoundPickerScreen';
import MathTaskScreen from '../screens/tasks/MathTaskScreen';
import PhotoTaskScreen from '../screens/tasks/PhotoTaskScreen';
import GameSelector from '../screens/games/GameSelector';
import MemoryGame from '../screens/games/MemoryGame';
import MazeGame from '../screens/games/MazeGame';
import GlowJigsawGame from '../screens/games/GlowJigsawGame';

const Stack = createStackNavigator();

const AlarmNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AlarmList"
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
        name="AlarmList" 
        component={AlarmListScreen}
        options={{
          title: 'นาฬิกาปลุก',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddAlarm" 
        component={AddAlarmScreen}
        options={({ route }) => ({
          title: route.params?.alarm ? 'แก้ไขการปลุก' : 'เพิ่มการปลุก',
          headerBackTitle: 'กลับ',
        })}
      />
      <Stack.Screen 
        name="AlarmRinging" 
        component={AlarmRingingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="RepeatDays" 
        component={RepeatDaysScreen}
        options={{
          title: 'ทำซ้ำ',
          headerBackTitle: 'กลับ',
        }}
      />
      <Stack.Screen 
        name="SoundLibrary" 
        component={SoundLibraryScreen}
        options={{
          title: 'เสียง',
          headerBackTitle: 'กลับ',
        }}
      />
      <Stack.Screen 
        name="SoundPicker" 
        component={SoundPickerScreen}
        options={{
          title: 'เลือกเสียงปลุก',
          headerShown: false,
        }}
      />
      {/* Mini-game Screens */}
      <Stack.Screen 
        name="GameSelector" 
        component={GameSelector}
        options={{
          title: 'เลือกเกม',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MathTaskScreen" 
        component={MathTaskScreen}
        options={{
          title: 'เกมคณิตศาสตร์',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="PhotoTaskScreen" 
        component={PhotoTaskScreen}
        options={{
          title: 'เกมถ่ายภาพ',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MemoryGame" 
        component={MemoryGame}
        options={{
          title: 'เกมความจำ',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MazeGame" 
        component={MazeGame}
        options={{
          title: 'เกมเขาวงกต',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="GlowJigsawGame" 
        component={GlowJigsawGame}
        options={{
          title: 'เกมจิ๊กซอว์',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AlarmNavigator; 