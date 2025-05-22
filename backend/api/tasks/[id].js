// API endpoints for individual task operations
import fs from 'fs';
import path from 'path';

// Path to our JSON file that will act as a database
const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json');

// Helper function to read tasks data
const readTasksData = () => {
  try {
    if (!fs.existsSync(tasksFilePath)) {
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
    fs.writeFileSync(tasksFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing tasks data:', error);
    return false;
  }
};

export default function handler(req, res) {
  const { id } = req.query;

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getTaskById(req, res, id);
    case 'PUT':
      return updateTask(req, res, id);
    case 'DELETE':
      return deleteTask(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/tasks/:id - Get a specific task
function getTaskById(req, res, id) {
  try {
    const data = readTasksData();
    const task = data.tasks.find(task => task.id === id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    return res.status(500).json({ message: 'Failed to get task', error: error.message });
  }
}

// PUT /api/tasks/:id - Update a task
function updateTask(req, res, id) {
  try {
    const { title, description, dueDate, category, priority, completed } = req.body;
    
    // Read current data
    const data = readTasksData();
    
    // Find task index
    const taskIndex = data.tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update task data
    data.tasks[taskIndex] = {
      ...data.tasks[taskIndex],
      title: title || data.tasks[taskIndex].title,
      description: description !== undefined ? description : data.tasks[taskIndex].description,
      dueDate: dueDate !== undefined ? dueDate : data.tasks[taskIndex].dueDate,
      category: category || data.tasks[taskIndex].category,
      priority: priority || data.tasks[taskIndex].priority,
      completed: completed !== undefined ? completed : data.tasks[taskIndex].completed,
      updatedAt: new Date().toISOString()
    };
    
    // Write back to file
    if (writeTasksData(data)) {
      return res.status(200).json(data.tasks[taskIndex]);
    } else {
      return res.status(500).json({ message: 'Failed to update task' });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
}

// DELETE /api/tasks/:id - Delete a task
function deleteTask(req, res, id) {
  try {
    // Read current data
    const data = readTasksData();
    
    // Check if task exists
    const taskIndex = data.tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Remove task
    data.tasks.splice(taskIndex, 1);
    
    // Write back to file
    if (writeTasksData(data)) {
      return res.status(200).json({ message: 'Task deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete task' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
} 