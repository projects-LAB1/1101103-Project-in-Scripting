// API endpoints for games
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to our JSON file that will act as a database
const gamesFilePath = path.join(process.cwd(), 'data', 'games.json');

// Helper function to read games data
const readGamesData = () => {
  try {
    // Check if file exists, if not create it with empty array
    if (!fs.existsSync(gamesFilePath)) {
      const dirPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(gamesFilePath, JSON.stringify({ games: [] }));
      return { games: [] };
    }
    
    const jsonData = fs.readFileSync(gamesFilePath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading games data:', error);
    return { games: [] };
  }
};

// Helper function to write games data
const writeGamesData = (data) => {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(gamesFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing games data:', error);
    return false;
  }
};

export default function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getGames(req, res);
    case 'POST':
      return createGame(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/games - Get all games
function getGames(req, res) {
  try {
    const { userId, type } = req.query;
    const data = readGamesData();
    
    // Apply filters
    let filteredGames = [...data.games];
    
    // Filter by userId if provided
    if (userId) {
      filteredGames = filteredGames.filter(game => game.userId === userId);
    }
    
    // Filter by game type if provided
    if (type) {
      filteredGames = filteredGames.filter(game => game.type === type);
    }
    
    return res.status(200).json(filteredGames);
  } catch (error) {
    console.error('Error getting games:', error);
    return res.status(500).json({ message: 'Failed to get games', error: error.message });
  }
}

// POST /api/games - Create a new game
function createGame(req, res) {
  try {
    const { type, userId, score, duration, level, difficulty } = req.body;
    
    // Validate required fields
    if (!type || !userId) {
      return res.status(400).json({ message: 'Game type and userId are required' });
    }
    
    // Read current data
    const data = readGamesData();
    
    // Create new game record
    const newGame = {
      id: uuidv4(),
      type,
      userId,
      score: score || 0,
      duration: duration || 0,
      level: level || 1,
      difficulty: difficulty || 'medium',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Add to games array
    data.games.push(newGame);
    
    // Write back to file
    if (writeGamesData(data)) {
      return res.status(201).json(newGame);
    } else {
      return res.status(500).json({ message: 'Failed to create game record' });
    }
  } catch (error) {
    console.error('Error creating game record:', error);
    return res.status(500).json({ message: 'Failed to create game record', error: error.message });
  }
} 