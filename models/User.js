/**
 * User model for MongoDB
 * Handles user authentication and profile data
 */
import 'react-native-get-random-values';
import bcrypt from 'react-native-bcrypt';
import * as Crypto from 'expo-crypto';
import mongoose from '../config/mongoConfig';

// Set up a secure random function fallback for bcrypt
bcrypt.setRandomFallback((len) => {
  try {
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  } catch (err) {
    console.error('Error generating random values:', err);
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  }
});

// Generate a salt for password hashing
const generateSalt = (rounds = 10) => {
  return bcrypt.genSaltSync(rounds);
};

// Define the user schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'กรุณาใส่อีเมล'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'กรุณาใส่อีเมลที่ถูกต้อง']
  },
  password: {
    type: String,
    required: [true, 'กรุณาใส่รหัสผ่าน'],
    minlength: 6,
    select: false // ไม่แสดงรหัสผ่านเมื่อเรียกข้อมูลผู้ใช้
  },
  displayName: {
    type: String,
    trim: true
  },
  photoURL: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add password hashing middleware
userSchema.pre('save', function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hash password
    const salt = generateSalt(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Add password verification method
userSchema.methods.matchPassword = function(enteredPassword) {
  try {
    return bcrypt.compareSync(enteredPassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Create and register the User model
let User;
try {
  // Try to retrieve existing model first
  User = mongoose.model('User');
  console.log('Retrieved existing User model');
} catch (error) {
  // Model doesn't exist yet, create it
  User = mongoose.model('User', userSchema);
  console.log('Created new User model');
}

export default User;