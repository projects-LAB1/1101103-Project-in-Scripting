// API endpoints for individual user operations
import fs from 'fs';
import path from 'path';

// Path to our JSON file that will act as a database
const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

// Helper function to read users data
const readUsersData = () => {
  try {
    if (!fs.existsSync(usersFilePath)) {
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
    fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users data:', error);
    return false;
  }
};

export default function handler(req, res) {
  const { id } = req.query;

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getUserById(req, res, id);
    case 'PUT':
      return updateUser(req, res, id);
    case 'DELETE':
      return deleteUser(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/users/:id - Get a specific user
function getUserById(req, res, id) {
  try {
    const data = readUsersData();
    const user = data.users.find(user => user.id === id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information like password before sending
    const { password, ...safeUser } = user;
    return res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
}

// PUT /api/users/:id - Update a user
function updateUser(req, res, id) {
  try {
    const { displayName, email, photoURL } = req.body;
    
    // Read current data
    const data = readUsersData();
    
    // Find user index
    const userIndex = data.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== data.users[userIndex].email) {
      const emailExists = data.users.some((user, index) => 
        index !== userIndex && user.email === email
      );
      
      if (emailExists) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }
    
    // Update user data
    data.users[userIndex] = {
      ...data.users[userIndex],
      displayName: displayName || data.users[userIndex].displayName,
      email: email || data.users[userIndex].email,
      photoURL: photoURL !== undefined ? photoURL : data.users[userIndex].photoURL,
      updatedAt: new Date().toISOString()
    };
    
    // Write back to file
    if (writeUsersData(data)) {
      // Remove password before sending response
      const { password, ...safeUser } = data.users[userIndex];
      return res.status(200).json(safeUser);
    } else {
      return res.status(500).json({ message: 'Failed to update user' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
}

// DELETE /api/users/:id - Delete a user
function deleteUser(req, res, id) {
  try {
    // Read current data
    const data = readUsersData();
    
    // Check if user exists
    const userIndex = data.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user
    data.users.splice(userIndex, 1);
    
    // Write back to file
    if (writeUsersData(data)) {
      return res.status(200).json({ message: 'User deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
} 