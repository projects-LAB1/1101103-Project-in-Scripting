// API endpoint for recording game scores
import fs from 'fs';
import path from 'path';

// Path to our JSON file that will act as a database
const gamesFilePath = path.join(process.cwd(), 'data', 'games.json');

// Helper function to read games data
const readGamesData = () => {
  try {
    if (!fs.existsSync(gamesFilePath)) {
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
    fs.writeFileSync(gamesFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing games data:', error);
    return false;
  }
};

export default function handler(req, res) {
  const { id } = req.query;

  // Only allow POST method for this endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return recordGameScore(req, res, id);
}

// POST /api/games/:id/score - Record a score for a specific game
function recordGameScore(req, res, id) {
  try {
    const { score, duration, level, completed } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({ message: 'Score is required' });
    }
    
    // Read current data
    const data = readGamesData();
    
    // Find game index
    const gameIndex = data.games.findIndex(game => game.id === id);
    
    if (gameIndex === -1) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Update game data
    const updatedGame = {
      ...data.games[gameIndex],
      score: score,
      duration: duration !== undefined ? duration : data.games[gameIndex].duration,
      level: level !== undefined ? level : data.games[gameIndex].level,
      completed: completed !== undefined ? completed : data.games[gameIndex].completed,
      updatedAt: new Date().toISOString()
    };
    
    data.games[gameIndex] = updatedGame;
    
    // Write back to file
    if (writeGamesData(data)) {
      return res.status(200).json(updatedGame);
    } else {
      return res.status(500).json({ message: 'Failed to record game score' });
    }
  } catch (error) {
    console.error('Error recording game score:', error);
    return res.status(500).json({ message: 'Failed to record game score', error: error.message });
  }
} 