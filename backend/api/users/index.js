// API endpoints for users
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to our JSON file that will act as a database
const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

// Helper function to read users data
const readUsersData = () => {
  try {
    // Check if file exists, if not create it with empty array
    if (!fs.existsSync(usersFilePath)) {
      const dirPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(usersFilePath, JSON.stringify({ users: [] }));
      return { users: [] };
    }
    
    const jsonData = fs.readFileSync(usersFilePath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading users data:', error);
    return { users: [] };
  }
};

// Helper function to write users data
const writeUsersData = (data) => {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users data:', error);
    return false;
  }
};

export default function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getUsers(req, res);
    case 'POST':
      return createUser(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/users - Get all users
function getUsers(req, res) {
  try {
    const data = readUsersData();
    
    // Remove sensitive information like passwords before sending
    const safeUsers = data.users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    return res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
}

// POST /api/users - Create a new user
function createUser(req, res) {
  try {
    const { email, password, displayName = '' } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Read current data
    const data = readUsersData();
    
    // Check if email already exists
    if (data.users.some(user => user.email === email)) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      email,
      password, // In a real app, this should be hashed
      displayName,
      photoURL: null,
      createdAt: new Date().toISOString()
    };
    
    // Add to users array
    data.users.push(newUser);
    
    // Write back to file
    if (writeUsersData(data)) {
      // Remove password before sending response
      const { password, ...safeUser } = newUser;
      return res.status(201).json(safeUser);
    } else {
      return res.status(500).json({ message: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
} 