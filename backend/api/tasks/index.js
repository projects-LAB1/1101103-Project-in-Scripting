// API endpoints for tasks
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to our JSON file that will act as a database
const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json');

// Helper function to read tasks data
const readTasksData = () => {
  try {
    // Check if file exists, if not create it with empty array
    if (!fs.existsSync(tasksFilePath)) {
      const dirPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(tasksFilePath, JSON.stringify({ tasks: [] }));
      return { tasks: [] };
    }
    
    const jsonData = fs.readFileSync(tasksFilePath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading tasks data:', error);
    return { tasks: [] };
  }
};

// Helper function to write tasks data
const writeTasksData = (data) => {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(tasksFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing tasks data:', error);
    return false;
  }
};

export default function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getTasks(req, res);
    case 'POST':
      return createTask(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/tasks - Get all tasks
function getTasks(req, res) {
  try {
    const { userId } = req.query;
    const data = readTasksData();
    
    // If userId is provided, filter tasks for that user
    if (userId) {
      const userTasks = data.tasks.filter(task => task.userId === userId);
      return res.status(200).json(userTasks);
    }
    
    // Otherwise return all tasks
    return res.status(200).json(data.tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    return res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
}

// POST /api/tasks - Create a new task
function createTask(req, res) {
  try {
    const { title, description, dueDate, category, userId, priority = 'medium' } = req.body;
    
    // Validate required fields
    if (!title || !userId) {
      return res.status(400).json({ message: 'Title and userId are required' });
    }
    
    // Read current data
    const data = readTasksData();
    
    // Create new task
    const newTask = {
      id: uuidv4(),
      title,
      description: description || '',
      dueDate: dueDate || null,
      category: category || 'general',
      userId,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to tasks array
    data.tasks.push(newTask);
    
    // Write back to file
    if (writeTasksData(data)) {
      return res.status(201).json(newTask);
    } else {
      return res.status(500).json({ message: 'Failed to create task' });
    }
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
} 