import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SleepHomeScreen from '../screens/sleep/SleepHomeScreen';
import SleepHistoryScreen from '../screens/sleep/SleepHistoryScreen';
import SleepEntryScreen from '../screens/sleep/SleepEntryScreen';
import SleepAnalyticsScreen from '../screens/sleep/SleepAnalyticsScreen';
import SleepGoalsScreen from '../screens/sleep/SleepGoalsScreen';
import SleepTestScreen from '../screens/sleep/SleepTestScreen';
import SleepDetectionScreen from '../screens/sleep/SleepDetectionScreen';
import LightSensorScreen from '../screens/sleep/LightSensorScreen';
import WeatherSleepScreen from '../screens/sleep/WeatherSleepScreen';

const Stack = createStackNavigator();

const SleepNavigator = ({ route }) => {
  // Check if we need to initially navigate to SleepHistory
  const initialRouteName = route?.params?.screen === 'SleepHistory' 
    ? 'SleepHistory' 
    : 'SleepHome';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => navigation.navigate('WeatherSleep')}
              >
                <MaterialCommunityIcons name="weather-cloudy" size={24} color="#0A84FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => navigation.navigate('SleepDetection')}
              >
                <MaterialCommunityIcons name="motion-sensor" size={24} color="#0A84FF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => navigation.navigate('SleepTest')}
              >
                <MaterialCommunityIcons name="test-tube" size={24} color="#0A84FF" />
              </TouchableOpacity>
            </View>
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
      <Stack.Screen
        name="SleepDetection"
        component={SleepDetectionScreen}
        options={{
          title: 'ตรวจจับการนอนอัตโนมัติ',
          headerBackTitle: 'กลับ',
        }}
      />
      <Stack.Screen
        name="LightSensor"
        component={LightSensorScreen}
        options={{
          title: 'ตรวจวัดแสงในห้อง',
          headerBackTitle: 'กลับ',
        }}
      />
      <Stack.Screen
        name="WeatherSleep"
        component={WeatherSleepScreen}
        options={{
          title: 'สภาพอากาศและการนอนหลับ',
          headerBackTitle: 'กลับ',
        }}
      />
    </Stack.Navigator>
  );
};

export default SleepNavigator; 