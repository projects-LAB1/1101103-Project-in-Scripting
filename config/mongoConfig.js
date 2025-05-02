/**
 * MongoDB Configuration
 * This file handles the connection to MongoDB using Mongoose
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
// Import mongoose directly
import mongoose from 'mongoose';

// MongoDB connection URI
const MONGO_URI = 'mongodb+srv://dbUser:lZNiCp1GOzoCfUu2@cluster0.wzrvmbj.mongodb.net/clockApp?retryWrites=true&w=majority&appName=Cluster0';

// Connection options
const CONNECTION_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Track connection state
let isConnecting = false;
let mongooseConnected = false;

/**
 * Initialize MongoDB connection
 */
export const connectToMongoDB = async () => {
  console.log('Attempting to connect to MongoDB...');

  // Return early if already connected
  if (mongooseConnected && mongoose.connection && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected.');
    return true;
  }

  // Prevent multiple connection attempts
  if (isConnecting) {
    console.log('Connection to MongoDB already in progress...');
    return false;
  }

  isConnecting = true;

  try {
    // Check if mongoose is properly imported
    if (!mongoose || typeof mongoose.connect !== 'function') {
      console.error('Mongoose import failed - mongoose not available or connect not a function');
      isConnecting = false;
      return false;
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB URI:', MONGO_URI);
    await mongoose.connect(MONGO_URI, CONNECTION_OPTIONS);
    
    console.log('✓ Successfully connected to MongoDB!');
    mongooseConnected = true;
    
    // Cache connection status
    await AsyncStorage.setItem('@mongodb_connected', 'true');
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  } finally {
    isConnecting = false;
  }
};

/**
 * Check if MongoDB is connected
 */
export const isConnected = () => {
  return mongooseConnected && mongoose && mongoose.connection && mongoose.connection.readyState === 1;
};

/**
 * Get mongoose instance
 */
export const getMongoose = async () => {
  // Try to connect if not already connected
  if (!isConnected()) {
    await connectToMongoDB();
  }
  return mongoose;
};

// Export mongoose
export default mongoose;