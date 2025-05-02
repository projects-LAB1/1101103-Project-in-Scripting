/**
 * Local Storage Configuration
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
export const STORAGE_KEYS = {
  USERS: '@users',
  ALARMS: '@alarms',
  SETTINGS: '@settings',
  CURRENT_USER: '@currentUser'
};

// For compatibility with existing code that checks connection status
export const connectToMongoDB = async () => true;
export const isConnected = () => true;

// Export AsyncStorage for direct use when needed
export { AsyncStorage };

/**
 * Save data to storage
 */
export const saveData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Storage save error:', error);
    Alert.alert(
      'Storage Error',
      'Failed to save data',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Get data from storage
 */
export const getData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Storage read error:', error);
    return null;
  }
};

/**
 * Clear all data from storage
 */
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Storage clear error:', error);
    return false;
  }
};