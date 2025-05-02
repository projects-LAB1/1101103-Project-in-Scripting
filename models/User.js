/**
 * User model using AsyncStorage
 */
import 'react-native-get-random-values';
import bcrypt from 'react-native-bcrypt';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_STORAGE_KEY = '@users';

// Helper functions
const getAllUsers = async () => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
};

const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
};

// User Model methods
const User = {
  findOne: async ({ email }) => {
    const users = await getAllUsers();
    return users.find(user => user.email === email) || null;
  },

  findById: async (id) => {
    const users = await getAllUsers();
    return users.find(user => user._id === id) || null;
  },

  findByIdAndUpdate: async (id, updateData) => {
    const users = await getAllUsers();
    const index = users.findIndex(user => user._id === id);
    if (index === -1) return null;

    const updatedUser = { ...users[index], ...updateData };
    users[index] = updatedUser;
    await saveUsers(users);
    return updatedUser;
  },

  create: async (userData) => {
    const users = await getAllUsers();
    const newUser = {
      _id: 'user-' + Date.now(),
      ...userData,
      password: bcrypt.hashSync(userData.password, 10)
    };
    users.push(newUser);
    await saveUsers(users);
    return newUser;
  }
};

export default User;