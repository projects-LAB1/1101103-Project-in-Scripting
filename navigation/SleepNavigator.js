import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SleepHomeScreen from '../screens/sleep/SleepHomeScreen';
import SleepHistoryScreen from '../screens/sleep/SleepHistoryScreen';
import SleepEntryScreen from '../screens/sleep/SleepEntryScreen';
import SleepAnalyticsScreen from '../screens/sleep/SleepAnalyticsScreen';
import SleepGoalsScreen from '../screens/sleep/SleepGoalsScreen';
import SleepTestScreen from '../screens/sleep/SleepTestScreen';

const Stack = createStackNavigator();

const SleepNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="SleepHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1C1C1E',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: { backgroundColor: '#000000' }
      }}
    >
      <Stack.Screen
        name="SleepHome"
        component={SleepHomeScreen}
        options={({ navigation }) => ({
          title: 'การนอนหลับ',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('SleepTest')}
            >
              <MaterialCommunityIcons name="test-tube" size={24} color="#0A84FF" />
            </TouchableOpacity>
          ),
        })}
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
      <Stack.Screen
        name="SleepTest"
        component={SleepTestScreen}
        options={{
          title: 'ทดสอบการวิเคราะห์ AI',
        }}
      />
    </Stack.Navigator>
  );
};

export default SleepNavigator; 