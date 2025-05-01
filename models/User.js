import mongoose from 'mongoose';
import bcrypt from 'react-native-bcrypt';
import * as Crypto from 'expo-crypto';

// Set a secure random function fallback for bcrypt using expo-crypto
if (!bcrypt.getRandom) {
  bcrypt.setRandomFallback(async (len) => {
    const bytes = await Crypto.getRandomBytesAsync(len);
    return new Uint8Array(bytes);
  });
}

// Generate a salt using a more compatible method
const generateSalt = (rounds = 10) => {
  return bcrypt.genSaltSync(rounds);
};

// สร้างโครงสร้าง Schema สำหรับผู้ใช้
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

// Middleware เข้ารหัสรหัสผ่านก่อนบันทึกลงฐานข้อมูล
userSchema.pre('save', async function(next) {
  // ทำงานเฉพาะเมื่อมีการเปลี่ยนแปลงรหัสผ่าน
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // เข้ารหัสรหัสผ่านด้วย bcrypt แบบ React Native compatible
    const salt = generateSalt(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// เมธอดเปรียบเทียบรหัสผ่าน
userSchema.methods.matchPassword = function(enteredPassword) {
  try {
    return bcrypt.compareSync(enteredPassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// สร้างโมเดล User จาก Schema
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;