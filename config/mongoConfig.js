// Import necessary modules
import mongoose from 'mongoose';
import bcrypt from 'react-native-bcrypt';

// Set a secure random function fallback for bcrypt
bcrypt.setRandomFallback((len) => {
  const buf = new Uint8Array(len);
  global.crypto.getRandomValues(buf);
  return buf;
});

// MongoDB Atlas connection URL
const MONGO_URI = 'mongodb+srv://dbUser:wfTtrUC5eyixuRMz@cluster0.wzrvmbj.mongodb.net/clockApp?retryWrites=true&w=majority&appName=Cluster0';

// Define mongoose connection options for React Native
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// ฟังก์ชันสำหรับเชื่อมต่อกับ MongoDB
export const connectToMongoDB = async () => {
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGO_URI, connectionOptions);
      console.log('Connected to MongoDB Atlas');
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return false;
    }
  }
  return true;
};

// ตรวจสอบว่ามีการเชื่อมต่อกับ MongoDB หรือไม่
export const isConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

// Export mongoose
export default mongoose;