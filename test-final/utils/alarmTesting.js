// alarmTesting.js - Utility for testing alarm functionality

/**
 * Test utility for creating and verifying alarms with different configurations.
 * Allows for automated testing of alarm features.
 */

// Generate a test alarm with various parameters
export const createTestAlarm = (options = {}) => {
  const now = new Date();
  
  // Default test alarm with current time
  const testAlarm = {
    hour: now.getHours(),
    minute: now.getMinutes(),
    repeatDays: [],
    isActive: true,
    userId: options.userId || 'test-user',
    label: options.label || 'Test Alarm',
    soundId: options.soundId || 'default',
    soundName: options.soundName || 'Default Sound',
    snooze: options.hasOwnProperty('snooze') ? options.snooze : true,
    snoozeTime: options.snoozeTime || 5,
    snoozeCount: options.snoozeCount || 3,
    vibrate: options.hasOwnProperty('vibrate') ? options.vibrate : true,
    vibrateType: options.vibrateType || 'Default',
    skipHolidays: options.hasOwnProperty('skipHolidays') ? options.skipHolidays : false,
    isTest: true,
    createdAt: new Date().toISOString(),
    id: `test-${Date.now()}`,
  };
  
  // Add mini-game settings if specified
  if (options.requireGame) {
    testAlarm.requireGame = true;
    testAlarm.gameType = options.gameType || 'memory';
    testAlarm.gameDifficulty = options.gameDifficulty || 'medium';
  }
  
  return testAlarm;
};

// Test different mini-game scenarios
export const testMiniGames = (navigation) => {
  const gameTests = [
    {
      name: 'Memory Game - Easy',
      alarm: createTestAlarm({
        label: 'Test: Memory Game (Easy)',
        requireGame: true,
        gameType: 'memory',
        gameDifficulty: 'easy'
      })
    },
    {
      name: 'Memory Game - Hard',
      alarm: createTestAlarm({
        label: 'Test: Memory Game (Hard)',
        requireGame: true,
        gameType: 'memory',
        gameDifficulty: 'hard'
      })
    },
    {
      name: 'Math Game - Easy',
      alarm: createTestAlarm({
        label: 'Test: Math Game (Easy)',
        requireGame: true,
        gameType: 'math',
        gameDifficulty: 'easy'
      })
    },
    {
      name: 'Math Game - Hard',
      alarm: createTestAlarm({
        label: 'Test: Math Game (Hard)',
        requireGame: true,
        gameType: 'math',
        gameDifficulty: 'hard'
      })
    },
    {
      name: 'Photo Verification',
      alarm: createTestAlarm({
        label: 'Test: Photo Verification',
        requireGame: true,
        gameType: 'photo',
        gameDifficulty: 'medium'
      })
    },
    {
      name: 'Maze Game - Easy',
      alarm: createTestAlarm({
        label: 'Test: Maze Game (Easy)',
        requireGame: true,
        gameType: 'maze',
        gameDifficulty: 'easy'
      })
    },
    {
      name: 'Maze Game - Medium',
      alarm: createTestAlarm({
        label: 'Test: Maze Game (Medium)',
        requireGame: true,
        gameType: 'maze',
        gameDifficulty: 'medium'
      })
    },
    {
      name: 'Maze Game - Hard',
      alarm: createTestAlarm({
        label: 'Test: Maze Game (Hard)',
        requireGame: true,
        gameType: 'maze',
        gameDifficulty: 'hard'
      })
    },
    {
      name: 'Glow Jigsaw - Easy',
      alarm: createTestAlarm({
        label: 'Test: Glow Jigsaw (Easy)',
        requireGame: true,
        gameType: 'jigsaw',
        gameDifficulty: 'easy'
      })
    },
    {
      name: 'Glow Jigsaw - Medium',
      alarm: createTestAlarm({
        label: 'Test: Glow Jigsaw (Medium)',
        requireGame: true,
        gameType: 'jigsaw',
        gameDifficulty: 'medium'
      })
    },
    {
      name: 'Glow Jigsaw - Hard',
      alarm: createTestAlarm({
        label: 'Test: Glow Jigsaw (Hard)',
        requireGame: true,
        gameType: 'jigsaw',
        gameDifficulty: 'hard'
      })
    }
  ];
  
  return gameTests;
};

// Run a specific test
export const runTest = (navigation, testCase) => {
  console.log(`Running test: ${testCase.name}`);
  console.log('Test alarm configuration:', testCase.alarm);
  
  // Navigate to AlarmRinging with the test alarm
  navigation.navigate('AlarmRinging', {
    alarm: testCase.alarm
  });
};

// Create demo alarms with various configurations for testing
export const createDemoAlarms = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  return [
    // Regular alarm
    createTestAlarm({
      label: 'Regular Alarm',
      hour: (hour + 1) % 24,
      minute,
      isTest: false
    }),
    
    // Repeating alarm
    createTestAlarm({
      label: 'Weekday Alarm',
      hour: (hour + 2) % 24,
      minute,
      repeatDays: [1, 2, 3, 4, 5], // Monday to Friday
      isTest: false
    }),
    
    // Memory game alarm
    createTestAlarm({
      label: 'Memory Game Alarm',
      hour: (hour + 3) % 24,
      minute,
      requireGame: true,
      gameType: 'memory',
      gameDifficulty: 'medium',
      isTest: false
    }),
    
    // Math game alarm
    createTestAlarm({
      label: 'Math Game Alarm',
      hour: (hour + 4) % 24,
      minute,
      requireGame: true,
      gameType: 'math',
      gameDifficulty: 'hard',
      isTest: false
    })
  ];
}; 