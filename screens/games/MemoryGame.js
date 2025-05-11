// MemoryGame.js - เกมความจำสำหรับปิดนาฬิกาปลุก
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAlarmSound } from '../../contexts/AlarmSoundContext';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 80) / 4;

const icons = [
  'heart', 'star', 'diamond', 'bell',
  'flower', 'leaf', 'fire', 'water',
  'cake', 'food', 'car', 'airplane'
];

const MemoryGame = ({ route, navigation }) => {
  const { alarm, difficulty = 'medium', onComplete, soundAlreadyStopped = false } = route.params || {};
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // ใช้ context เพื่อเข้าถึงเสียงปลุก
  const { isPlaying, stopAlarmSound } = useAlarmSound();
  
  // สร้าง ref เพื่อป้องกันการเรียก onComplete ซ้ำ
  const isCompletedRef = useRef(false);

  // Setup game based on difficulty
  useEffect(() => {
    setupGame();
    
    // ไม่ต้องหยุดเสียงที่นี่ เพราะยังเล่นเกมไม่เสร็จ
    return () => {
      // ถ้าผู้ใช้ออกจากหน้าโดยไม่เล่นเกมให้จบ ตรวจสอบว่าควรหยุดเสียงหรือไม่
      if (isPlaying && !soundAlreadyStopped) {
        console.log("Stopping alarm sound on MemoryGame unmount");
        stopAlarmSound();
      } else {
        console.log("Sound was already stopped or not playing in MemoryGame unmount");
      }
    };
  }, [difficulty, isPlaying, stopAlarmSound, soundAlreadyStopped]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!timerActive && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const handleGameComplete = () => {
    // ป้องกันการเรียกซ้ำ
    if (isCompletedRef.current) {
      return;
    }
    
    isCompletedRef.current = true;
    
    // หยุดเสียงเมื่อเล่นเกมเสร็จ (ถ้ายังไม่ได้หยุด)
    if (isPlaying && !soundAlreadyStopped) {
      console.log("Stopping alarm sound in MemoryGame");
      // เรียกใช้ stopAlarmSound ซ้ำหลายครั้งเพื่อให้แน่ใจว่าเสียงถูกหยุดจริงๆ
      stopAlarmSound();
      
      // เรียกใช้ stopAlarmSound อีกครั้งหลังจากรอเล็กน้อย
      setTimeout(() => {
        if (isPlaying) {
          console.log("Trying to stop sound again after delay");
          stopAlarmSound();
        }
      }, 500);
    } else {
      console.log("Sound was already stopped or not playing in MemoryGame");
    }
    
    // เรียกใช้ callback onComplete ถ้ามี
    if (onComplete) {
      onComplete();
    }
  };

  const setupGame = () => {
    setGameStarted(false);
    setMoves(0);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setTimerSeconds(0);
    setTimerActive(false);
    isCompletedRef.current = false;

    // Set number of pairs based on difficulty
    let numPairs;
    switch (difficulty) {
      case 'easy':
        numPairs = 4;
        break;
      case 'medium':
        numPairs = 6;
        break;
      case 'hard':
        numPairs = 8;
        break;
      default:
        numPairs = 6;
    }

    // Create card deck
    const selectedIcons = icons.slice(0, numPairs);
    const cardDeck = [...selectedIcons, ...selectedIcons]
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false
      }))
      .sort(() => Math.random() - 0.5);

    setCards(cardDeck);
  };

  const handleCardPress = (index) => {
    // Start timer on first card flip
    if (!gameStarted) {
      setGameStarted(true);
      setTimerActive(true);
    }

    // Don't allow flipping if:
    // 1. Card is already flipped
    // 2. Card is already matched
    // 3. Two cards are already flipped and being checked
    if (
      flippedIndices.includes(index) ||
      cards[index].matched ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    // Flip the card
    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    // If this is the second card, check for a match
    if (newFlippedIndices.length === 2) {
      setMoves(moves + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;
      
      if (cards[firstIndex].icon === cards[secondIndex].icon) {
        // Match found
        setMatchedPairs([...matchedPairs, cards[firstIndex].icon]);
        
        // Update cards to mark them as matched
        setCards(currentCards => 
          currentCards.map((card, idx) => 
            idx === firstIndex || idx === secondIndex
              ? { ...card, matched: true }
              : card
          )
        );
        
        // Reset flipped indices
        setFlippedIndices([]);
      } else {
        // No match, flip cards back after delay
        Vibration.vibrate(200);
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Check for game completion
  useEffect(() => {
    if (matchedPairs.length > 0 && matchedPairs.length === cards.length / 2) {
      setTimerActive(false);
      setTimeout(() => {
        Alert.alert(
          "เยี่ยมมาก!",
          `คุณชนะแล้ว!\nจำนวนการเล่น: ${moves}\nเวลา: ${formatTime(timerSeconds)}`,
          [{ text: "ปิดนาฬิกาปลุก", onPress: handleGameComplete }]
        );
      }, 500);
    }
  }, [matchedPairs, cards.length, moves, timerSeconds]);

  // Format timer display
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>เกมจับคู่ภาพ</Text>
        <Text style={styles.subHeaderText}>จับคู่ให้ครบเพื่อปิดนาฬิกาปลุก</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>การเล่น</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>เวลา</Text>
          <Text style={styles.statValue}>{formatTime(timerSeconds)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>คู่ที่เจอ</Text>
          <Text style={styles.statValue}>{matchedPairs.length}/{cards.length/2}</Text>
        </View>
      </View>

      <View style={styles.gameBoard}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              (flippedIndices.includes(index) || card.matched) && styles.cardFlipped
            ]}
            onPress={() => handleCardPress(index)}
            activeOpacity={0.8}
          >
            {(flippedIndices.includes(index) || card.matched) ? (
              <Icon name={card.icon} size={ITEM_SIZE * 0.6} color="#0A84FF" />
            ) : (
              <View style={styles.cardBack}>
                <Text style={styles.cardBackText}>?</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={setupGame}
      >
        <Text style={styles.resetButtonText}>เริ่มเกมใหม่</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gameBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  card: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  cardFlipped: {
    backgroundColor: '#2C2C2E',
  },
  cardBack: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  cardBackText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F4F4F',
  },
  resetButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MemoryGame; 