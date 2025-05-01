// Import necessary modules
import mongoose from 'mongoose';
import * as Crypto from 'expo-crypto';
import bcrypt from 'react-native-bcrypt';

// Fix for crypto in React Native environment
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (buffer) => {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    }
  };
}

// Set a secure random function fallback for bcrypt
bcrypt.setRandomFallback((len) => {
  const buf = new Uint8Array(len);
  global.crypto.getRandomValues(buf);
  return buf;
});

// MongoDB Atlas connection URL
const MONGO_URI = 'mongodb+srv://dbUser:lZNiCp1GOzoCfUu2@cluster0.wzrvmbj.mongodb.net/clockApp?retryWrites=true&w=majority&appName=Cluster0';

// Define mongoose connection options for React Native
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let isInitialized = false;
let mongooseInstance = null;

// ฟังก์ชันสำหรับเชื่อมต่อกับ MongoDB
export const connectToMongoDB = async () => {
  try {
    if (isInitialized) return true;
    
    // Check if mongoose is properly imported
    if (!mongoose || typeof mongoose.connect !== 'function') {
      console.error('Mongoose is not properly imported');
      return false;
    }
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, connectionOptions);
    console.log('Connected to MongoDB Atlas');
    mongooseInstance = mongoose;
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// ตรวจสอบว่ามีการเชื่อมต่อกับ MongoDB หรือไม่
export const isConnected = () => {
  return isInitialized && mongooseInstance && 
         mongooseInstance.connection && 
         mongooseInstance.connection.readyState === 1;
};

// Export mongoose instance
export default mongoose;