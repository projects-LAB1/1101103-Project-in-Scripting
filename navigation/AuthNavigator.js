import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Stack = createStackNavigator();

// กำหนด config สำหรับ transition ที่สวยงาม
const screenOptions = {
  headerStyle: {
    backgroundColor: '#000000',
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontWeight: '600',
  },
  cardStyle: { backgroundColor: '#000000' },
  gestureEnabled: true, 
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
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
};

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 