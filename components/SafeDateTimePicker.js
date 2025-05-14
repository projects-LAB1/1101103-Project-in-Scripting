// SafeDateTimePicker.js - A wrapper for DateTimePicker that handles platform differences
import React from 'react';
import { Platform, View, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * SafeDateTimePicker is a wrapper around DateTimePicker that safely handles
 * platform differences between iOS and Android.
 * 
 * On Android, text must be wrapped in <Text> components, and the DateTimePicker
 * may sometimes cause "Text strings must be rendered within a <Text> component" errors.
 * This component ensures proper rendering across platforms.
 */
const SafeDateTimePicker = (props) => {
  // Create a safe set of props for each platform
  const pickerProps = { ...props };
  
  // Remove iOS-specific props when on Android
  if (Platform.OS === 'android') {
    delete pickerProps.textColor;
    delete pickerProps.themeVariant;
    // Keep locale for proper localization
  }

  // On Android, we need to be extra careful about text rendering
  if (Platform.OS === 'android') {
    try {
      return (
        <View>
          {/* This hidden text component helps prevent the "Text strings must be rendered within a <Text> component" error */}
          <Text style={{ height: 0, width: 0, opacity: 0 }}>placeholder text to prevent rendering errors</Text>
          <DateTimePicker {...pickerProps} />
        </View>
      );
    } catch (error) {
      console.error('DateTimePicker error:', error);
      return (
        <View style={{ padding: 10, backgroundColor: '#333', borderRadius: 8 }}>
          <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>
            Error loading date picker. Please try again.
          </Text>
        </View>
      );
    }
  }
  
  // iOS rendering is more straightforward
  return (
    <View>
      <DateTimePicker {...pickerProps} />
    </View>
  );
};

export default SafeDateTimePicker;
