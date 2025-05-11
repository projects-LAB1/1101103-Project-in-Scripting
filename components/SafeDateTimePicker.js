// SafeDateTimePicker.js - A wrapper for DateTimePicker that handles platform differences
import React from 'react';
import { Platform, View } from 'react-native';
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

  return (
    <View>
      <DateTimePicker {...pickerProps} />
    </View>
  );
};

export default SafeDateTimePicker;
