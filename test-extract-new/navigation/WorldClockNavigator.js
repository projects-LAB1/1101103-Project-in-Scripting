import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorldClockScreen from '../screens/WorldClockScreen';
import AddCityScreen from '../screens/AddCityScreen';

const Stack = createStackNavigator();

const WorldClockNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorldClockList" component={WorldClockScreen} />
      <Stack.Screen
        name="AddCity"
        component={AddCityScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </Stack.Navigator>
  );
};

export default WorldClockNavigator; 