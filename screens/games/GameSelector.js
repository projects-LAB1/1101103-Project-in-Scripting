// GameSelector.js - ตัวเลือกเกมสำหรับปิดนาฬิกาปลุก
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAlarmSound } from '../../contexts/AlarmSoundContext';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const GAME_CARD_WIDTH = width * 0.43;

const GameSelector = ({ route, navigation }) => {
  const { 
    alarm, 
    onComplete, 
    completionAction, 
    soundAlreadyStopped = false,
    gameCompleted = false 
  } = route.params || {};
  
  // ใช้ context เพื่อเข้าถึงเสียงปลุก
  const { isPlaying, stopAlarmSound } = useAlarmSound();
  // ใช้ ref เพื่อระวังไม่ให้เรียก onComplete ซ้ำ
  const isCompletedRef = useRef(false);
  // เพิ่ม state เพื่อตรวจสอบสถานะเสียง
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // ตรวจสอบเมื่อกลับมาที่หน้านี้หลังจากเล่นเกมเสร็จ
  useFocusEffect(
    React.useCallback(() => {
      console.log('GameSelector focused, gameCompleted:', gameCompleted);
      
      if (gameCompleted) {
        console.log('Game completed flag detected, handling completion');
        // เพิ่มการหน่วงเวลาเล็กน้อยเพื่อให้แน่ใจว่า UI ได้อัพเดตก่อนที่จะนำทางไปหน้าอื่น
        setTimeout(() => {
          handleGameComplete();
        }, 300);
      }
      
      return () => {
        // ทำความสะอาดเมื่อออกจากหน้านี้
        console.log('GameSelector focus lost');
      };
    }, [gameCompleted])
  );
  
  // ตรวจสอบและเตรียมระบบเสียง
  useEffect(() => {
    const prepareAudio = async () => {
      try {
        // ตรวจสอบว่าระบบเสียงพร้อมใช้งานหรือไม่
        await Audio.setIsEnabledAsync(true);
        setAudioEnabled(true);
      } catch (error) {
        console.error('Error enabling audio:', error);
        // Don't show alert as it might disrupt the game experience
        // Just set audio as enabled anyway to allow the game to continue
        setAudioEnabled(true);
        
        // Try to recover audio system silently
        setTimeout(async () => {
          try {
            await Audio.setIsEnabledAsync(false);
            await new Promise(resolve => setTimeout(resolve, 300));
            await Audio.setIsEnabledAsync(true);
          } catch (e) {
            // Ignore recovery errors
          }
        }, 1000);
      }
    };
    
    prepareAudio();
  }, []);
  
  // แสดงข้อมูลเพื่อการดีบัก
  useEffect(() => {
    console.log('GameSelector loaded');
    console.log('Alarm data:', JSON.stringify(alarm, null, 2));
    console.log('onComplete function available:', !!onComplete);
    console.log('completionAction:', completionAction);
    console.log('Alarm sound is playing:', isPlaying);
    console.log('Sound already stopped:', soundAlreadyStopped);
    console.log('Game completed flag:', gameCompleted);
    
    // หยุดเสียงปลุกเมื่อโหลดหน้าเกม (ถ้ายังไม่ได้หยุดจาก AlarmRingingScreen)
    if (isPlaying && !soundAlreadyStopped) {
      console.log('Stopping alarm sound in GameSelector useEffect');
      // เรียกใช้งาน stopAlarmSound เพื่อหยุดเสียง
      try {
        stopAlarmSound();
      } catch (error) {
        console.error('Error stopping alarm sound:', error);
      }
      
      // ตรวจสอบอีกครั้งหลังจากรอสักครู่เพื่อให้แน่ใจว่าเสียงถูกหยุดจริงๆ
      setTimeout(() => {
        if (isPlaying) {
          console.log('Trying to stop sound again after delay in GameSelector');
          try {
            stopAlarmSound();
          } catch (error) {
            console.error('Error stopping alarm sound in timeout:', error);
          }
        }
      }, 500);
    }
    
    // เมื่อปิดหน้านี้ ตรวจสอบว่าหยุดเสียงแล้วหรือยัง - ไม่ต้องดำเนินการอะไรเพิ่มเติม
    return () => {
      // ตรวจสอบว่าเสียงหยุดแล้วหรือยัง และหยุดอีกครั้งถ้ายังไม่หยุด
      if (isPlaying) {
        console.log('Stopping sound in GameSelector cleanup');
        try {
          stopAlarmSound();
        } catch (error) {
          console.error('Error stopping alarm sound in cleanup:', error);
        }
      }
    }; 
  }, [isPlaying, stopAlarmSound, soundAlreadyStopped, alarm, completionAction, gameCompleted]);

  // ฟังก์ชันเรียกเมื่อเล่นเกมเสร็จแล้ว
  const handleGameComplete = () => {
    // ป้องกันการเรียกซ้ำ
    if (isCompletedRef.current) {
      console.log('Game completion already handled, ignoring duplicate call');
      return;
    }
    
    isCompletedRef.current = true;
    console.log('Game completed, handling navigation');
    
    // หยุดเสียงปลุกเมื่อเล่นเกมเสร็จ (ถ้ายังไม่ได้หยุด)
    if (isPlaying && !soundAlreadyStopped) {
      console.log('Stopping alarm sound after game completion');
      // เรียกใช้ stopAlarmSound เพื่อหยุดเสียง
      try {
        stopAlarmSound();
      } catch (error) {
        console.error('Error stopping alarm sound after game completion:', error);
      }
    } else {
      console.log('Sound was already stopped or not playing');
    }
    
    // ตรวจสอบการดำเนินการหลังจากเกมเสร็จสิ้น
    try {
      // ใช้ onComplete function ถ้ามี (สำหรับการรองรับเวอร์ชันเก่า)
      if (typeof onComplete === 'function') {
        console.log('Calling provided onComplete function');
        onComplete();
      } 
      // ใช้ completionAction string ถ้ามี (รูปแบบใหม่)
      else if (completionAction === 'completeAlarm') {
        console.log('Using completionAction: completeAlarm');
        // กลับไปที่หน้า AlarmList โดยตรง
        navigation.reset({
          index: 0,
          routes: [{ name: 'Alarm', params: { screen: 'AlarmList' } }],
        });
      }
      else {
        console.log('No completion handler provided, navigating to AlarmList');
        // ถ้าไม่มี onComplete ให้กลับไปที่หน้ารายการนาฬิกาปลุก
        navigation.reset({
          index: 0,
          routes: [{ name: 'Alarm', params: { screen: 'AlarmList' } }],
        });
      }
    } catch (error) {
      console.error('Error in navigation after game completion:', error);
      // ถ้าเกิดข้อผิดพลาดในการนำทาง ให้พยายามกลับไปที่หน้ารายการนาฬิกาปลุกโดยตรงด้วยวิธีอื่น
      try {
        // ลองใช้ navigate แทน reset
        navigation.navigate('Alarm', { 
          screen: 'AlarmList',
          params: { alarmCompleted: true }
        });
      } catch (navError) {
        console.error('Failed to navigate after error:', navError);
        
        // ลองใช้ navigate แบบง่ายที่สุด
        try {
          navigation.navigate('Alarm');
        } catch (finalError) {
          console.error('All navigation attempts failed:', finalError);
          
          // ถ้าไม่สามารถนำทางได้ ให้แสดงข้อความแจ้งเตือนและให้ผู้ใช้กดปุ่มย้อนกลับเอง
          Alert.alert(
            'เกิดข้อผิดพลาด',
            'ไม่สามารถกลับไปยังหน้าหลักได้ กรุณากดปุ่มย้อนกลับ',
            [{ text: 'ตกลง' }]
          );
        }
      }
    }
  };
  
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
    
    // รีเซ็ต completion status เมื่อเริ่มเกมใหม่
    isCompletedRef.current = false;
    
    // Navigate to the selected game screen with serializable parameters
    navigation.navigate(game.screen, {
      alarm,
      difficulty,
      gameCompletionHandler: 'handleGameComplete', // ใช้ string แทนฟังก์ชัน
      soundAlreadyStopped,  // ส่งต่อ flag ไปยังเกม
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