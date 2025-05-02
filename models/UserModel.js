import bcrypt from 'react-native-bcrypt';
import { getStorageData, setStorageData } from '../config/mongoDBConfig';

export class UserModel {
  static async findByEmail(email) {
    const users = await getStorageData('USERS') || [];
    return users.find(user => user.email === email);
  }

  static async create(userData) {
    const users = await getStorageData('USERS') || [];
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    
    const newUser = {
      _id: 'user_' + Date.now(),
      email: userData.email,
      password: hashedPassword,
      displayName: userData.displayName || userData.email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    await setStorageData('USERS', users);
    return newUser;
  }

  static async findById(id) {
    const users = await getStorageData('USERS') || [];
    return users.find(user => user._id === id);
  }

  static async updateUser(id, updateData) {
    const users = await getStorageData('USERS') || [];
    const index = users.findIndex(user => user._id === id);
    
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updateData,
      updatedAt: new Date()
    };

    await setStorageData('USERS', users);
    return users[index];
  }

  static async validatePassword(user, password) {
    return bcrypt.compareSync(password, user.password);
  }

  static async changePassword(id, newPassword) {
    const users = await getStorageData('USERS') || [];
    const index = users.findIndex(user => user._id === id);
    
    if (index === -1) return false;

    users[index].password = bcrypt.hashSync(newPassword, 10);
    users[index].updatedAt = new Date();

    await setStorageData('USERS', users);
    return true;
  }
}