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
import TestingScreen from '../screens/TestingScreen';

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
          title: 'Alarms',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AddAlarm" 
        component={AddAlarmScreen}
        options={({ route }) => ({
          title: route.params?.alarm ? 'Edit Alarm' : 'Add Alarm',
          headerBackTitle: 'Back',
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
          title: 'Repeat',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="SoundLibrary" 
        component={SoundLibraryScreen}
        options={{
          title: 'Sound',
          headerBackTitle: 'Back',
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
      {/* Testing Screen */}
      <Stack.Screen 
        name="Testing" 
        component={TestingScreen}
        options={{
          title: 'Alarm Testing',
          headerBackTitle: 'Back',
        }}
      />
      {/* Mini-game Screens */}
      <Stack.Screen 
        name="GameSelector" 
        component={GameSelector}
        options={{
          title: 'Select Game',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MathTaskScreen" 
        component={MathTaskScreen}
        options={{
          title: 'Math Task',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="PhotoTaskScreen" 
        component={PhotoTaskScreen}
        options={{
          title: 'Photo Task',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MemoryGame" 
        component={MemoryGame}
        options={{
          title: 'Memory Game',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="MazeGame" 
        component={MazeGame}
        options={{
          title: 'Maze Game',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="GlowJigsawGame" 
        component={GlowJigsawGame}
        options={{
          title: 'Glow Jigsaw Game',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AlarmNavigator; 