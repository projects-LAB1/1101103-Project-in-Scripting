// MazeGame.js - เกมเขาวงกตที่ต้องเคลื่อนที่ไปสู่เป้าหมาย
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Accelerometer } from 'expo-sensors';
import { useAlarmSound } from '../../contexts/AlarmSoundContext';

const { width, height } = Dimensions.get('window');

const MazeGame = ({ route, navigation }) => {
  // ป้องกันข้อมูลไม่ถูกส่งมา
  const params = route?.params || {};
  const { alarm, difficulty = 'medium', onComplete, soundAlreadyStopped = false } = params;
  
  // ใช้ AlarmSound context
  const { isPlaying, stopAlarmSound } = useAlarmSound();
  
  // สร้าง ref เพื่อป้องกันการเรียก onComplete ซ้ำ
  const isCompletedRef = useRef(false);
  
  // สถานะเกม
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // ขนาดของเกม (ตามความยาก)
  const mazeSizes = {
    easy: { rows: 5, cols: 5 },
    medium: { rows: 7, cols: 7 },
    hard: { rows: 9, cols: 9 },
  };
  
  const { rows, cols } = mazeSizes[difficulty] || mazeSizes.medium;
  
  // ตำแหน่งผู้เล่น และเป้าหมาย
  const [playerPosition, setPlayerPosition] = useState({ row: 0, col: 0 });
  const [goalPosition, setGoalPosition] = useState({ row: rows - 1, col: cols - 1 });
  
  // เซนเซอร์
  const [isSensorAvailable, setIsSensorAvailable] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  
  // เขาวงกต
  const [maze, setMaze] = useState([]);
  
  // สถานะการควบคุม
  const [controlMode, setControlMode] = useState('touch'); // 'touch' หรือ 'sensor'
  
  // สร้างเขาวงกต
  useEffect(() => {
    generateMaze();
    checkSensorAvailability();
  }, [difficulty]);
  
  // ติดตามเวลา
  useEffect(() => {
    if (gameStarted && !isGameComplete) {
      const interval = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameStarted, isGameComplete, startTime]);
  
  // ตรวจสอบและติดตั้งเซนเซอร์
  const checkSensorAvailability = async () => {
    try {
      const isAvailable = await Accelerometer.isAvailableAsync();
      setIsSensorAvailable(isAvailable);
      
      if (isAvailable) {
        startAccelerometer();
      }
    } catch (error) {
      console.error("Sensor error:", error);
      setIsSensorAvailable(false);
    }
  };
  
  // เริ่มการทำงานของเซนเซอร์
  const startAccelerometer = () => {
    try {
      Accelerometer.setUpdateInterval(100); // อัพเดททุก 100ms
      
      const subscription = Accelerometer.addListener(data => {
        setAccelerometerData(data);
        
        if (gameStarted && !isGameComplete && controlMode === 'sensor') {
          // ใช้ค่าเซนเซอร์ในการเคลื่อนที่
          const threshold = 0.2; // ค่าจุดเริ่มต้นสำหรับการตรวจจับการเอียง
          
          if (Math.abs(data.x) > threshold || Math.abs(data.y) > threshold) {
            // กำหนดทิศทางการเคลื่อนที่ตามการเอียงของอุปกรณ์
            let direction = '';
            
            if (Math.abs(data.x) > Math.abs(data.y)) {
              // เอียงซ้าย-ขวา
              direction = data.x > 0 ? 'right' : 'left';
            } else {
              // เอียงขึ้น-ลง
              direction = data.y > 0 ? 'down' : 'up';
            }
            
            movePlayer(direction);
          }
        }
      });
      
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error("Accelerometer setup error:", error);
    }
  };
  
  // สร้างเขาวงกต
  const generateMaze = () => {
    // สร้างตาราง maze เริ่มต้นที่เต็มไปด้วยกำแพง
    const initialMaze = Array(rows).fill().map(() => Array(cols).fill(1));
    
    // ใช้ Recursive Backtracking อัลกอริทึมสำหรับสร้างเขาวงกต
    const carvePassage = (r, c) => {
      const directions = [
        [0, -2], // ซ้าย
        [0, 2], // ขวา
        [-2, 0], // บน
        [2, 0] // ล่าง
      ];
      
      // สลับลำดับทิศทางแบบสุ่ม
      directions.sort(() => Math.random() - 0.5);
      
      for (let [dr, dc] of directions) {
        const newR = r + dr;
        const newC = c + dc;
        
        // ตรวจสอบว่ายังอยู่ในขอบเขตของเขาวงกตหรือไม่
        if (newR >= 0 && newR < rows && newC >= 0 && newC < cols && initialMaze[newR][newC] === 1) {
          // เปิดทางเดิน (คือกำหนดให้เป็น 0)
          initialMaze[r + dr/2][c + dc/2] = 0; // ช่องระหว่างกลาง
          initialMaze[newR][newC] = 0; // ช่องปลายทาง
          carvePassage(newR, newC); // ทำต่อที่ช่องใหม่
        }
      }
    };
    
    // เริ่มที่จุดมุมซ้ายบน
    initialMaze[0][0] = 0;
    initialMaze[rows-1][cols-1] = 0;
    
    if (rows > 2 && cols > 2) {
      // ใช้เฉพาะกับเขาวงกตที่มีขนาดใหญ่พอ
      carvePassage(1, 1);
    } else {
      // สำหรับเขาวงกตขนาดเล็ก สร้างเส้นทางง่ายๆ
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          initialMaze[i][j] = Math.random() > 0.3 ? 0 : 1;
        }
      }
      // ทำให้แน่ใจว่าจุดเริ่มต้นและจุดสิ้นสุดเป็นทางเดิน
      initialMaze[0][0] = 0;
      initialMaze[rows-1][cols-1] = 0;
    }
    
    setMaze(initialMaze);
    setPlayerPosition({ row: 0, col: 0 });
    setGoalPosition({ row: rows - 1, col: cols - 1 });
    
    // รีเซ็ตสถานะการจบเกม
    isCompletedRef.current = false;
    setIsGameComplete(false);
  };
  
  // ดูแลการเคลื่อนไหวของผู้เล่น
  const movePlayer = (direction) => {
    if (!gameStarted || isGameComplete) return;
    
    const { row, col } = playerPosition;
    let newRow = row;
    let newCol = col;
    
    switch (direction) {
      case 'up':
        newRow = row - 1;
        break;
      case 'down':
        newRow = row + 1;
        break;
      case 'left':
        newCol = col - 1;
        break;
      case 'right':
        newCol = col + 1;
        break;
    }
    
    // ตรวจสอบว่าเคลื่อนที่ได้หรือไม่
    if (
      newRow >= 0 && newRow < rows &&
      newCol >= 0 && newCol < cols &&
      maze[newRow][newCol] === 0 // ไม่มีกำแพง
    ) {
      setPlayerPosition({ row: newRow, col: newCol });
      
      // ตรวจสอบว่าถึงเป้าหมายหรือไม่
      if (newRow === goalPosition.row && newCol === goalPosition.col) {
        handleComplete();
      }
    } else {
      // ชนกำแพง สั่น
      try {
        Vibration.vibrate(100);
      } catch (error) {
        console.error("Vibration error:", error);
      }
    }
  };
  
  // เริ่มเกม
  const startGame = () => {
    setGameStarted(true);
    setIsGameComplete(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setShowHelp(false);
    isCompletedRef.current = false;
  };
  
  // จบเกม
  const handleComplete = () => {
    // ป้องกันการเรียกซ้ำ
    if (isCompletedRef.current) {
      return;
    }
    
    isCompletedRef.current = true;
    setIsGameComplete(true);
    
    try {
      Vibration.vibrate([100, 200, 100, 200]);
    } catch (error) {
      console.error("Vibration error:", error);
    }
    
    // หยุดเสียงปลุกเมื่อเล่นเกมเสร็จ (ถ้ายังไม่ได้หยุด)
    if (isPlaying && !soundAlreadyStopped) {
      console.log("Stopping alarm sound in MazeGame");
      stopAlarmSound();
    } else {
      console.log("Sound was already stopped or not playing in MazeGame");
    }
    
    // เรียกฟังก์ชันเมื่อเล่นเสร็จ
    setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      } else {
        // ถ้าไม่มี onComplete ให้กลับไปที่หน้า GameSelector
        navigation.goBack();
      }
    }, 2000);
  };
  
  // ฟังก์ชัน cleanup เมื่อออกจากหน้า
  useEffect(() => {
    return () => {
      // ถ้าผู้ใช้ออกจากหน้าโดยไม่เล่นเกมให้จบ ตรวจสอบว่าควรหยุดเสียงหรือไม่
      if (isPlaying && !soundAlreadyStopped) {
        console.log("Stopping alarm sound on MazeGame unmount");
        stopAlarmSound();
      } else {
        console.log("Sound was already stopped or not playing in MazeGame unmount");
      }
    };
  }, [isPlaying, stopAlarmSound, soundAlreadyStopped]);
  
  // ปิดหน้าช่วยเหลือและเริ่มเกม
  const closeHelp = () => {
    setShowHelp(false);
    startGame();
  };
  
  // สลับโหมดควบคุม
  const toggleControlMode = () => {
    setControlMode(prev => (prev === 'touch' ? 'sensor' : 'touch'));
  };
  
  // แสดงเขาวงกต
  const renderMaze = () => {
    if (!maze || maze.length === 0) return null;
    
    const cellSize = Math.min((width - 40) / cols, (height - 200) / rows);
    
    return (
      <View style={styles.mazeContainer}>
        {maze.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.mazeRow}>
            {row.map((cell, colIndex) => {
              const isPlayer = rowIndex === playerPosition.row && colIndex === playerPosition.col;
              const isGoal = rowIndex === goalPosition.row && colIndex === goalPosition.col;
              
              return (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[
                    styles.mazeCell,
                    { width: cellSize, height: cellSize },
                    cell === 1 && styles.wall,
                  ]}
                >
                  {isPlayer && (
                    <View style={styles.player}>
                      <Icon name="circle" size={cellSize * 0.7} color="#0A84FF" />
                    </View>
                  )}
                  
                  {isGoal && !isPlayer && (
                    <View style={styles.goal}>
                      <Icon name="flag-checkered" size={cellSize * 0.7} color="#10b981" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };
  
  // แสดงปุ่มควบคุม
  const renderTouchControls = () => {
    if (controlMode !== 'touch' || !gameStarted || isGameComplete) return null;
    
    return (
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => movePlayer('up')}
          >
            <Icon name="arrow-up" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => movePlayer('left')}
          >
            <Icon name="arrow-left" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={{ width: 80 }} />
          
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => movePlayer('right')}
          >
            <Icon name="arrow-right" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => movePlayer('down')}
          >
            <Icon name="arrow-down" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>เขาวงกต</Text>
      <Text style={styles.subHeaderText}>
        เคลื่อนที่ลูกบอลไปสู่เป้าหมายโดยไม่ชนกำแพง
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>เวลาที่ใช้</Text>
          <Text style={styles.statValue}>{elapsedTime} วินาที</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ความยาก</Text>
          <Text style={styles.statValue}>
            {difficulty === 'easy' ? 'ง่าย' : difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
          </Text>
        </View>
      </View>
      
      {/* แสดงเขาวงกต */}
      {renderMaze()}
      
      {/* ปุ่มควบคุม */}
      {renderTouchControls()}
      
      {/* ข้อความเมื่อเล่นเสร็จ */}
      {isGameComplete && (
        <View style={styles.completionOverlay}>
          <Text style={styles.completionText}>เยี่ยมมาก!</Text>
          <Text style={styles.completionSubtext}>
            คุณทำสำเร็จใน {elapsedTime} วินาที
          </Text>
        </View>
      )}
      
      {/* สลับโหมดควบคุม */}
      {isSensorAvailable && gameStarted && !isGameComplete && (
        <TouchableOpacity
          style={styles.modeToggleButton}
          onPress={toggleControlMode}
        >
          <Icon 
            name={controlMode === 'touch' ? 'gesture-tap' : 'rotate-3d'} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.modeToggleText}>
            {controlMode === 'touch' ? 'ใช้การเอียง' : 'ใช้การแตะ'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* คำอธิบายเกม */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showHelp}
        onRequestClose={closeHelp}
      >
        <View style={styles.helpOverlay}>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>วิธีเล่นเขาวงกต</Text>
            
            <View style={styles.helpItem}>
              <Icon name="maze" size={32} color="#fff" style={styles.helpIcon} />
              <Text style={styles.helpText}>1. เคลื่อนย้ายลูกบอลผ่านเขาวงกตไปยังธงที่จุดหมาย</Text>
            </View>
            
            <View style={styles.helpItem}>
              <Icon name="gesture-tap" size={32} color="#fff" style={styles.helpIcon} />
              <Text style={styles.helpText}>2. ใช้ปุ่มลูกศรเพื่อควบคุมทิศทาง</Text>
            </View>
            
            {isSensorAvailable && (
              <View style={styles.helpItem}>
                <Icon name="rotate-3d" size={32} color="#fff" style={styles.helpIcon} />
                <Text style={styles.helpText}>3. หรือเอียงโทรศัพท์เพื่อควบคุม (มีให้เลือกในเกม)</Text>
              </View>
            )}
            
            <View style={styles.helpTip}>
              <Text style={styles.helpTipText}>
                คำแนะนำ: ระวังกำแพง! หากคุณชนกำแพง คุณจะไม่สามารถเคลื่อนที่ผ่านได้
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.helpButton} 
              onPress={closeHelp}
            >
              <Text style={styles.helpButtonText}>เริ่มเล่น</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* ปุ่มรีเซ็ตและย้อนกลับ */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            generateMaze();
            startGame();
          }}
        >
          <Text style={styles.resetButtonText}>เริ่มใหม่</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>กลับ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 4,
  },
  subHeaderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mazeContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mazeRow: {
    flexDirection: 'row',
  },
  mazeCell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 50, 50, 0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(100, 100, 100, 0.3)',
  },
  wall: {
    backgroundColor: 'rgba(44, 62, 80, 0.8)',
    borderColor: 'rgba(30, 30, 30, 0.6)',
  },
  player: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  goal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  controlBtn: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 30, 0.6)',
    borderRadius: 30,
    margin: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 200, 0.3)',
  },
  modeToggleButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeToggleText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  completionSubtext: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpContent: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  helpIcon: {
    marginRight: 16,
  },
  helpText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  helpTip: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  helpTipText: {
    fontSize: 14,
    color: '#fff',
  },
  helpButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  resetButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'rgba(44, 44, 46, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default MazeGame; 