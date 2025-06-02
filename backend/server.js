import express from 'express';
import cors from 'cors';
import { adminDb } from './firebase-config.js';
import { verifyFirebaseToken, optionalAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sleep App API with Firebase',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users',
      tasks: '/api/tasks',
      games: '/api/games',
      sleep: '/api/sleep'
    }
  });
});

// ==================== AUTH ENDPOINTS ====================

// Register user (สร้างข้อมูลผู้ใช้ใน Firestore หลังจาก Firebase Auth สำเร็จ)
app.post('/api/auth/register', verifyFirebaseToken, async (req, res) => {
  try {
    const { displayName, phoneNumber, birthDate, preferences } = req.body;
    const uid = req.user.uid;
    
    // สร้างข้อมูลผู้ใช้ใน Firestore
    const userData = {
      uid: uid,
      email: req.user.email,
      displayName: displayName || req.user.name,
      phoneNumber: phoneNumber || '',
      birthDate: birthDate || '',
      preferences: preferences || {},
      emailVerified: req.user.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await adminDb.collection('users').doc(uid).set(userData);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userData
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Get user profile
app.get('/api/auth/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(userDoc.data());
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await adminDb.collection('users').doc(uid).update(updateData);
    
    const updatedDoc = await adminDb.collection('users').doc(uid).get();
    res.json(updatedDoc.data());
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// ==================== USERS ENDPOINTS ====================

// Get all users (admin only or public list)
app.get('/api/users', optionalAuth, async (req, res) => {
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // ซ่อนข้อมูลส่วนตัวถ้าไม่ใช่เจ้าของ
      users.push({
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        createdAt: userData.createdAt
      });
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
app.get('/api/users/:id', optionalAuth, async (req, res) => {
  try {
    const userDoc = await adminDb.collection('users').doc(req.params.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // ถ้าเป็นเจ้าของข้อมูลเอง ให้ข้อมูลครบ
    if (req.user && req.user.uid === req.params.id) {
      res.json(userData);
    } else {
      // ถ้าไม่ใช่ ให้ข้อมูลสาธารณะเท่านั้น
      res.json({
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        createdAt: userData.createdAt
      });
    }
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ==================== TASKS ENDPOINTS ====================

// Get all tasks for authenticated user
app.get('/api/tasks', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const tasksSnapshot = await adminDb.collection('tasks')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const tasks = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create new task
app.post('/api/tasks', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const taskData = {
      ...req.body,
      userId: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await adminDb.collection('tasks').add(taskData);
    const newTask = { id: docRef.id, ...taskData };
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const taskId = req.params.id;
    
    // ตรวจสอบว่า task นี้เป็นของผู้ใช้หรือไม่
    const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = taskDoc.data();
    if (taskData.userId !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await adminDb.collection('tasks').doc(taskId).update(updateData);
    
    const updatedDoc = await adminDb.collection('tasks').doc(taskId).get();
    res.json({ id: taskId, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
app.delete('/api/tasks/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const taskId = req.params.id;
    
    // ตรวจสอบว่า task นี้เป็นของผู้ใช้หรือไม่
    const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = taskDoc.data();
    if (taskData.userId !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await adminDb.collection('tasks').doc(taskId).delete();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ==================== GAMES ENDPOINTS ====================

// Get all games
app.get('/api/games', optionalAuth, async (req, res) => {
  try {
    const gamesSnapshot = await adminDb.collection('games').get();
    const games = [];
    
    gamesSnapshot.forEach(doc => {
      games.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(games);
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// Get user's game scores
app.get('/api/games/scores', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const scoresSnapshot = await adminDb.collection('gameScores')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const scores = [];
    scoresSnapshot.forEach(doc => {
      scores.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(scores);
  } catch (error) {
    console.error('Error getting game scores:', error);
    res.status(500).json({ error: 'Failed to get game scores' });
  }
});

// Record game score
app.post('/api/games/:gameId/score', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const gameId = req.params.gameId;
    const { score, level, duration, metadata } = req.body;
    
    const scoreData = {
      userId: uid,
      gameId: gameId,
      score: score,
      level: level || 1,
      duration: duration || 0,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };
    
    const docRef = await adminDb.collection('gameScores').add(scoreData);
    const newScore = { id: docRef.id, ...scoreData };
    
    res.status(201).json(newScore);
  } catch (error) {
    console.error('Error recording game score:', error);
    res.status(500).json({ error: 'Failed to record game score' });
  }
});

// ==================== SLEEP ENDPOINTS ====================

// Get user's sleep data
app.get('/api/sleep', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { startDate, endDate, limit = 30 } = req.query;
    
    let query = adminDb.collection('sleepData')
      .where('userId', '==', uid)
      .orderBy('bedTime', 'desc')
      .limit(parseInt(limit));
    
    if (startDate && endDate) {
      query = query.where('bedTime', '>=', startDate)
                   .where('bedTime', '<=', endDate);
    }
    
    const sleepSnapshot = await query.get();
    const sleepData = [];
    
    sleepSnapshot.forEach(doc => {
      sleepData.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(sleepData);
  } catch (error) {
    console.error('Error getting sleep data:', error);
    res.status(500).json({ error: 'Failed to get sleep data' });
  }
});

// Create sleep record
app.post('/api/sleep', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const sleepData = {
      ...req.body,
      userId: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await adminDb.collection('sleepData').add(sleepData);
    const newSleepRecord = { id: docRef.id, ...sleepData };
    
    res.status(201).json(newSleepRecord);
  } catch (error) {
    console.error('Error creating sleep record:', error);
    res.status(500).json({ error: 'Failed to create sleep record' });
  }
});

// Update sleep record
app.put('/api/sleep/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const sleepId = req.params.id;
    
    // ตรวจสอบว่า sleep record นี้เป็นของผู้ใช้หรือไม่
    const sleepDoc = await adminDb.collection('sleepData').doc(sleepId).get();
    if (!sleepDoc.exists) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }
    
    const sleepData = sleepDoc.data();
    if (sleepData.userId !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await adminDb.collection('sleepData').doc(sleepId).update(updateData);
    
    const updatedDoc = await adminDb.collection('sleepData').doc(sleepId).get();
    res.json({ id: sleepId, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating sleep record:', error);
    res.status(500).json({ error: 'Failed to update sleep record' });
  }
});

// Delete sleep record
app.delete('/api/sleep/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const sleepId = req.params.id;
    
    // ตรวจสอบว่า sleep record นี้เป็นของผู้ใช้หรือไม่
    const sleepDoc = await adminDb.collection('sleepData').doc(sleepId).get();
    if (!sleepDoc.exists) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }
    
    const sleepData = sleepDoc.data();
    if (sleepData.userId !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await adminDb.collection('sleepData').doc(sleepId).delete();
    res.json({ message: 'Sleep record deleted successfully' });
  } catch (error) {
    console.error('Error deleting sleep record:', error);
    res.status(500).json({ error: 'Failed to delete sleep record' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/`);
  console.log('Firebase integration enabled');
});