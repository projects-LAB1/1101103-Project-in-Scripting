// GameSelector.js - ตัวเลือกเกมสำหรับปิดนาฬิกาปลุก
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const GAME_CARD_WIDTH = width * 0.43;

const GameSelector = ({ route, navigation }) => {
  const { alarm, onComplete } = route.params || {};
  
  // แสดงข้อมูลเพื่อการดีบัก
  useEffect(() => {
    console.log('GameSelector loaded');
    console.log('Alarm data:', JSON.stringify(alarm, null, 2));
    console.log('onComplete function available:', !!onComplete);
  }, []);
  
  const games = [
    {
      id: 'math',
      name: 'โจทย์คณิตศาสตร์',
      description: 'ตอบโจทย์คณิตศาสตร์ให้ถูกต้อง',
      icon: 'calculator',
      difficulty: ['easy', 'medium', 'hard'],
      screen: 'MathTaskScreen',
    },
    {
      id: 'memory',
      name: 'เกมจับคู่ภาพ',
      description: 'จับคู่ไอคอนให้ตรงกัน',
      icon: 'cards',
      difficulty: ['easy', 'medium', 'hard'],
      screen: 'MemoryGame',
    },
    {
      id: 'photo',
      name: 'ถ่ายรูปยืนยัน',
      description: 'ถ่ายภาพตามที่กำหนด',
      icon: 'camera',
      difficulty: ['medium'],
      screen: 'PhotoTaskScreen',
    },
  ];
  
  const handleSelectGame = (game, difficulty) => {
    // บันทึกข้อมูลเพื่อการดีบัก
    console.log('Game selected:', game.id, 'Difficulty:', difficulty);
    
    // Navigate to the selected game screen
    navigation.navigate(game.screen, {
      alarm,
      difficulty,
      onComplete: () => {
        console.log('Game completed, calling onComplete');
        // เมื่อเกมเสร็จสิ้น ใช้ฟังก์ชัน onComplete จาก route.params ถ้ามี
        if (typeof onComplete === 'function') {
          onComplete();
        } else {
          // ถ้าไม่มี onComplete ให้กลับไปที่หน้ารายการนาฬิกาปลุก
          navigation.reset({
            index: 0,
            routes: [{ name: 'Alarm', params: { screen: 'AlarmList' } }],
          });
        }
      },
    });
  };
  
  const renderDifficultyOptions = (game) => {
    return (
      <View style={styles.difficultyContainer}>
        {game.difficulty.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.difficultyButton,
              { 
                backgroundColor: 
                  level === 'easy' ? '#4CAF50' : 
                  level === 'medium' ? '#FFC107' : '#F44336' 
              }
            ]}
            onPress={() => handleSelectGame(game, level)}
          >
            <Text style={styles.difficultyText}>
              {level === 'easy' ? 'ง่าย' : 
               level === 'medium' ? 'ปานกลาง' : 'ยาก'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderGameCard = (game) => {
    return (
      <View key={game.id} style={styles.gameCard}>
        <View style={styles.gameIconContainer}>
          <Icon name={game.icon} size={40} color="#0A84FF" />
        </View>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDescription}>{game.description}</Text>
        {renderDifficultyOptions(game)}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>เลือกเกม</Text>
        <Text style={styles.subHeaderText}>เลือกเกมที่ต้องทำเพื่อปิดนาฬิกาปลุก</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.gamesContainer}>
        {games.map(renderGameCard)}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          // Go back without selecting a game (will keep alarm ringing)
          navigation.goBack();
        }}
      >
        <Text style={styles.backButtonText}>กลับไปหน้านาฬิกาปลุก</Text>
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
  gamesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gameCard: {
    width: GAME_CARD_WIDTH,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  backButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default GameSelector; 