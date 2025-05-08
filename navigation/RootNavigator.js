import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();

// Customize dark theme to match iOS dark mode
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF9500',
    background: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    border: '#1C1C1E',
  },
};

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // TODO: Add a proper splash screen here
    return null;
  }

  return (
    <NavigationContainer theme={CustomDarkTheme}>
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