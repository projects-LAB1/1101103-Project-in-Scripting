// GlowJigsawGame.js - เกมจิ๊กซอว์แสงที่ต้องจัดเรียงชิ้นส่วนในความมืด
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
  Animated,
  Alert,
  Vibration,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAlarmSound } from '../../contexts/AlarmSoundContext';

const { width, height } = Dimensions.get('window');

// รูปร่างเรขาคณิตเรืองแสงแทนรูปภาพ
const glowShapes = [
  { key: 'circle', shape: 'circle', icon: 'circle', title: 'วงกลม', colors: ['#1e3a8a', '#2563eb', '#3b82f6'] },
  { key: 'triangle', shape: 'triangle', icon: 'triangle', title: 'สามเหลี่ยม', colors: ['#7c2d12', '#c2410c', '#f97316'] },
  { key: 'square', shape: 'square', icon: 'square', title: 'สี่เหลี่ยม', colors: ['#064e3b', '#059669', '#10b981'] },
  { key: 'star', shape: 'star', icon: 'star', title: 'ดาว', colors: ['#3f3f46', '#52525b', '#71717a'] },
  { key: 'heart', shape: 'heart', icon: 'heart', title: 'หัวใจ', colors: ['#831843', '#be185d', '#ec4899'] },
  { key: 'rhombus', shape: 'rhombus', icon: 'rhombus', title: 'ข้าวหลามตัด', colors: ['#581c87', '#7e22ce', '#a855f7'] },
];

const GlowJigsawGame = ({ route, navigation }) => {
  // ป้องกันข้อมูลไม่ถูกส่งมา
  const params = route?.params || {};
  const { alarm, difficulty = 'medium', onComplete, soundAlreadyStopped = false } = params;
  
  // ใช้ AlarmSound context
  const { isPlaying, stopAlarmSound } = useAlarmSound();
  
  // ref เพื่อป้องกันการเรียก onComplete ซ้ำ
  const isCompletedRef = useRef(false);
  
  // กำหนดขนาดตาราง (จำนวนชิ้นส่วน) ตามระดับความยาก
  const gridSizes = {
    easy: 3, // 3x3 = 9 ชิ้น
    medium: 4, // 4x4 = 16 ชิ้น
    hard: 5, // 5x5 = 25 ชิ้น
  };
  
  const gridSize = gridSizes[difficulty];
  const puzzleSize = width * 0.9; // ขนาดของจิ๊กซอว์ทั้งหมด
  const pieceSize = puzzleSize / gridSize; // ขนาดของแต่ละชิ้น
  
  // สถานะเกม
  const [pieces, setPieces] = useState([]);
  const [completedPieces, setCompletedPieces] = useState([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedShape, setSelectedShape] = useState(null);
  const [showHelp, setShowHelp] = useState(true); // แสดงคำอธิบายเมื่อเริ่มเกม
  
  // สุ่มเลือกรูปร่าง
  useEffect(() => {
    try {
      const randomIndex = Math.floor(Math.random() * glowShapes.length);
      setSelectedShape(glowShapes[randomIndex]);
      setStartTime(Date.now());
    } catch (error) {
      console.error("Error selecting shape:", error);
      // ใช้รูปร่างแรกหากมีข้อผิดพลาด
      setSelectedShape(glowShapes[0]);
    }
  }, []);
  
  // ติดตามเวลา
  useEffect(() => {
    if (startTime && !isGameComplete) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [startTime, isGameComplete]);
  
  // สร้างชิ้นส่วนจิ๊กซอว์
  useEffect(() => {
    if (selectedShape) {
      const initializePieces = () => {
        try {
          const newPieces = [];
          
          // สร้างชิ้นส่วนตามกริด
          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              // คำนวณตำแหน่งที่ถูกต้องของชิ้นส่วน
              const correctX = col * pieceSize;
              const correctY = row * pieceSize;
              
              // สร้างตำแหน่งเริ่มต้นแบบสุ่ม (อยู่นอกพื้นที่จิ๊กซอว์ตามขอบหน้าจอ)
              let initialX, initialY;
              
              // สุ่มตำแหน่งเริ่มต้น
              const randomEdge = Math.floor(Math.random() * 4); // 0=บน, 1=ขวา, 2=ล่าง, 3=ซ้าย
              switch (randomEdge) {
                case 0: // บน
                  initialX = Math.random() * (width - pieceSize);
                  initialY = -pieceSize;
                  break;
                case 1: // ขวา
                  initialX = width;
                  initialY = Math.random() * (height - pieceSize);
                  break;
                case 2: // ล่าง
                  initialX = Math.random() * (width - pieceSize);
                  initialY = height;
                  break;
                case 3: // ซ้าย
                default: // เพิ่ม default case เพื่อป้องกันความผิดพลาด
                  initialX = -pieceSize;
                  initialY = Math.random() * (height - pieceSize);
                  break;
              }
              
              newPieces.push({
                id: `${row}-${col}`,
                row,
                col,
                correctX,
                correctY,
                currentX: new Animated.Value(initialX),
                currentY: new Animated.Value(initialY),
                zIndex: 1,
                rotation: new Animated.Value(Math.random() * 30 - 15), // หมุนเล็กน้อย
                isCorrect: false,
              });
            }
          }
          
          // เล่นแอนิเมชันให้ชิ้นส่วนเข้ามาในหน้าจอ
          newPieces.forEach((piece, index) => {
            // สร้างตำแหน่งเป้าหมายในพื้นที่เล่น
            const targetX = Math.random() * (width - pieceSize * 2) + pieceSize / 2;
            const targetY = height / 2 + Math.random() * 200 - 100;
            
            // แอนิเมชันเลื่อนชิ้นส่วนเข้าหน้าจอ
            Animated.sequence([
              Animated.delay(index * 100), // หน่วงเวลาทีละชิ้น
              Animated.parallel([
                Animated.spring(piece.currentX, {
                  toValue: targetX,
                  friction: 6,
                  tension: 40,
                  useNativeDriver: true,
                }),
                Animated.spring(piece.currentY, {
                  toValue: targetY,
                  friction: 6,
                  tension: 40,
                  useNativeDriver: true,
                }),
                Animated.spring(piece.rotation, {
                  toValue: 0,
                  friction: 6,
                  tension: 40,
                  useNativeDriver: true,
                }),
              ]),
            ]).start();
          });
          
          setPieces(newPieces);
        } catch (error) {
          console.error("Error initializing pieces:", error);
        }
      };
      
      initializePieces();
    }
  }, [selectedShape]);
  
  // สร้าง PanResponder สำหรับแต่ละชิ้นส่วน
  const createPanResponder = (pieceId) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // เมื่อเริ่มลาก ยกชิ้นส่วนขึ้นมาอยู่ด้านบน
        setPieces(currentPieces => {
          if (!currentPieces || !Array.isArray(currentPieces)) return [];
          return currentPieces.map(p => 
            p.id === pieceId
              ? { ...p, zIndex: 10 }
              : p
          );
        });
      },
      onPanResponderMove: (event, gesture) => {
        // ค้นหาชิ้นส่วนที่กำลังลาก
        if (!pieces || !Array.isArray(pieces)) return;
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece || piece.isCorrect) return;
        
        // อัพเดตตำแหน่งตามการลาก
        piece.currentX.setValue(gesture.moveX - pieceSize / 2);
        piece.currentY.setValue(gesture.moveY - pieceSize / 2);
      },
      onPanResponderRelease: (event, gesture) => {
        // ค้นหาชิ้นส่วนที่กำลังลาก
        if (!pieces || !Array.isArray(pieces)) return;
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece || piece.isCorrect) return;
        
        // คำนวณตำแหน่งของพื้นที่จิ๊กซอว์
        const puzzleAreaX = (width - puzzleSize) / 2;
        const puzzleAreaY = (height - puzzleSize) / 2 - 50; // ปรับให้อยู่ตรงกลางค่อนไปทางบน
        
        // คำนวณตำแหน่งที่ถูกต้องในหน้าจอ
        const targetX = puzzleAreaX + piece.correctX;
        const targetY = puzzleAreaY + piece.correctY;
        
        // คำนวณระยะห่างระหว่างตำแหน่งปัจจุบันกับตำแหน่งที่ถูกต้อง
        const currentX = gesture.moveX - pieceSize / 2;
        const currentY = gesture.moveY - pieceSize / 2;
        const distance = Math.sqrt(
          Math.pow(currentX - targetX, 2) + 
          Math.pow(currentY - targetY, 2)
        );
        
        // ถ้าระยะห่างน้อยกว่าขนาดชิ้นส่วน/2 ให้ถือว่าอยู่ใกล้พอที่จะนับว่าถูกตำแหน่ง
        if (distance < pieceSize * 0.4) {
          // ชิ้นส่วนอยู่ในตำแหน่งที่ถูกต้อง
          Animated.spring(piece.currentX, {
            toValue: targetX,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
          
          Animated.spring(piece.currentY, {
            toValue: targetY,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
          
          // อัพเดตสถานะว่าชิ้นส่วนนี้อยู่ในตำแหน่งที่ถูกต้อง
          setPieces(currentPieces => {
            if (!currentPieces || !Array.isArray(currentPieces)) return [];
            return currentPieces.map(p =>
              p.id === pieceId
                ? { ...p, isCorrect: true, zIndex: 5 }
                : p
            );
          });
          
          // เพิ่มชิ้นส่วนที่ถูกต้องลงในอาเรย์
          setCompletedPieces(current => {
            if (!current || !Array.isArray(current)) return [pieceId];
            const newCompleted = [...current, pieceId];
            
            // ตรวจสอบว่าเกมจบหรือยัง (ทุกชิ้นอยู่ในตำแหน่งที่ถูกต้อง)
            if (newCompleted.length === gridSize * gridSize) {
              // เกมจบแล้ว - เรียกฟังก์ชันจัดการเมื่อเกมเสร็จสิ้น
              handleGameComplete();
            } else {
              // ยังไม่จบ ให้สั่นนิดหน่อยเป็นการให้ feedback
              try {
                Vibration.vibrate(50);
              } catch (error) {
                console.error("Vibration error:", error);
              }
            }
            
            return newCompleted;
          });
        }
      },
    });
  };
  
  // ฟังก์ชันจัดการเมื่อเกมเสร็จสิ้น
  const handleGameComplete = () => {
    // ป้องกันการเรียกซ้ำ
    if (isCompletedRef.current) {
      return;
    }
    
    isCompletedRef.current = true;
    setIsGameComplete(true);
    
    try {
      Vibration.vibrate([100, 200, 100, 200, 100]);
    } catch (error) {
      console.error("Vibration error:", error);
    }
    
    // หยุดเสียงปลุกเมื่อเล่นเกมเสร็จ (ถ้ายังไม่ได้หยุด)
    if (isPlaying && !soundAlreadyStopped) {
      console.log("Stopping alarm sound in GlowJigsawGame");
      stopAlarmSound();
    } else {
      console.log("Sound was already stopped or not playing in GlowJigsawGame");
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
        console.log("Stopping alarm sound on GlowJigsawGame unmount");
        stopAlarmSound();
      } else {
        console.log("Sound was already stopped or not playing in GlowJigsawGame unmount");
      }
    };
  }, [isPlaying, stopAlarmSound, soundAlreadyStopped]);
  
  // รีเซ็ตเกม
  const resetGame = () => {
    try {
      // รีเซ็ตสถานะ
      setCompletedPieces([]);
      setIsGameComplete(false);
      setStartTime(Date.now());
      setElapsedTime(0);
      isCompletedRef.current = false;
      
      // สุ่มรูปร่างใหม่
      const randomIndex = Math.floor(Math.random() * glowShapes.length);
      setSelectedShape(glowShapes[randomIndex]);
      
      // ชิ้นส่วนจะถูกสร้างใหม่เมื่อรูปร่างเปลี่ยน
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  };
  
  // ใส่ลูกเล่นเมื่อเกมจบ
  useEffect(() => {
    if (isGameComplete && pieces && Array.isArray(pieces)) {
      // แอนิเมชันเมื่อเกมเสร็จ (ทำให้ภาพสว่างขึ้น)
      pieces.forEach((piece) => {
        if (piece && piece.rotation) {
          Animated.sequence([
            Animated.delay(Math.random() * 500),
            Animated.spring(piece.rotation, {
              toValue: 0,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    }
  }, [isGameComplete, pieces]);
  
  // สร้างชิ้นส่วนจิ๊กซอว์
  const renderPieces = () => {
    if (!selectedShape || !pieces || pieces.length === 0) return null;
    
    // คำนวณพื้นที่จิ๊กซอว์
    const puzzleAreaX = (width - puzzleSize) / 2;
    const puzzleAreaY = (height - puzzleSize) / 2 - 50;
    
    return pieces.map((piece) => {
      if (!piece) return null;
      
      // สร้าง PanResponder สำหรับชิ้นนี้
      const panResponder = !piece.isCorrect ? createPanResponder(piece.id) : {};
      
      // ความโปร่งใสและเรืองแสงเมื่อจบเกม
      const opacity = isGameComplete ? 1 : piece.isCorrect ? 1 : 0.8;
      
      // ขอบและเงา
      const borderWidth = isGameComplete ? 0 : piece.isCorrect ? 0.5 : 2;
      const elevation = isGameComplete ? 5 : piece.isCorrect ? 3 : 1;
      
      return (
        <Animated.View
          key={piece.id}
          {...panResponder.panHandlers}
          style={[
            styles.puzzlePiece,
            {
              width: pieceSize,
              height: pieceSize,
              zIndex: piece.zIndex,
              opacity: opacity,
              transform: [
                { translateX: piece.currentX },
                { translateY: piece.currentY },
                { rotate: piece.rotation.interpolate({
                  inputRange: [-360, 360],
                  outputRange: ['-360deg', '360deg']
                })},
              ],
              borderWidth: borderWidth,
              elevation: elevation,
              backgroundColor: piece.isCorrect 
                ? selectedShape.colors[0] 
                : 'rgba(20, 20, 30, 0.7)',
            },
          ]}
        >
          {/* แสดงไอคอนแทนภาพ */}
          <View style={styles.pieceIconContainer}>
            <Icon 
              name={selectedShape.icon} 
              size={pieceSize * 0.5} 
              color={piece.isCorrect ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)"} 
            />
          </View>
          
          {/* เอฟเฟกต์เรืองแสงเมื่อจบเกม */}
          {isGameComplete && (
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.2)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
        </Animated.View>
      );
    });
  };
  
  // สร้างพื้นที่จิ๊กซอว์
  const renderPuzzleBoard = () => {
    // คำนวณพื้นที่จิ๊กซอว์
    const puzzleAreaX = (width - puzzleSize) / 2;
    const puzzleAreaY = (height - puzzleSize) / 2 - 50;
    
    return (
      <View
        style={[
          styles.puzzleBoard,
          {
            width: puzzleSize,
            height: puzzleSize,
            left: puzzleAreaX,
            top: puzzleAreaY,
            opacity: isGameComplete ? 0.1 : 0.2,
            borderWidth: isGameComplete ? 0 : 1,
          },
        ]}
      >
        {/* แสดงเส้นตาราง */}
        {Array(gridSize).fill(0).map((_, rowIndex) => 
          rowIndex > 0 && (
            <View
              key={`row-${rowIndex}`}
              style={[
                styles.gridLine,
                {
                  top: rowIndex * pieceSize,
                  width: puzzleSize,
                  height: 1,
                },
              ]}
            />
          )
        )}
        
        {Array(gridSize).fill(0).map((_, colIndex) => 
          colIndex > 0 && (
            <View
              key={`col-${colIndex}`}
              style={[
                styles.gridLine,
                {
                  left: colIndex * pieceSize,
                  height: puzzleSize,
                  width: 1,
                },
              ]}
            />
          )
        )}
      </View>
    );
  };
  
  // ความคืบหน้าของเกม
  const progress = completedPieces && Array.isArray(completedPieces) 
    ? completedPieces.length / (gridSize * gridSize) * 100 
    : 0;
  
  // ปิดคำอธิบายเกม
  const closeHelp = () => {
    setShowHelp(false);
    if (!startTime) {
      setStartTime(Date.now());
    }
  };
  
  // รูปแบบการแสดงผล
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={selectedShape ? selectedShape.colors : ['#000000', '#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerText}>จิ๊กซอว์แสง</Text>
        <Text style={styles.subHeaderText}>
          {selectedShape ? selectedShape.title : 'กำลังโหลด...'}
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>เวลา</Text>
          <Text style={styles.statValue}>{elapsedTime} วินาที</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ความคืบหน้า</Text>
          <Text style={styles.statValue}>{Math.round(progress)}%</Text>
        </View>
      </View>
      
      {/* คำอธิบายเกม */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showHelp}
        onRequestClose={closeHelp}
      >
        <View style={styles.helpOverlay}>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>วิธีเล่นจิ๊กซอว์แสง</Text>
            
            <View style={styles.helpItem}>
              <Icon name="gesture-tap-drag" size={32} color="#fff" style={styles.helpIcon} />
              <Text style={styles.helpText}>1. ลากชิ้นส่วนที่เรืองแสงในความมืด</Text>
            </View>
            
            <View style={styles.helpItem}>
              <Icon name="puzzle" size={32} color="#fff" style={styles.helpIcon} />
              <Text style={styles.helpText}>2. จัดวางลงในตำแหน่งที่ถูกต้องบนตาราง</Text>
            </View>
            
            <View style={styles.helpItem}>
              <Icon name="check-circle" size={32} color="#10b981" style={styles.helpIcon} />
              <Text style={styles.helpText}>3. ทำให้ครบทุกชิ้นเพื่อปิดนาฬิกาปลุก</Text>
            </View>
            
            <View style={styles.helpTip}>
              <Text style={styles.helpTipText}>
                คำแนะนำ: ลากชิ้นส่วนใกล้ๆ ตำแหน่งที่ถูกต้อง ระบบจะช่วยดึงเข้าที่ให้!
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
      
      {/* แสดงปุ่มช่วยเหลือ */}
      <TouchableOpacity
        style={styles.floatingHelpButton}
        onPress={() => setShowHelp(true)}
      >
        <Icon name="help-circle" size={28} color="#fff" />
      </TouchableOpacity>
      
      {/* แสดงข้อความเมื่อเกมจบ */}
      {isGameComplete && (
        <View style={styles.completionOverlay}>
          <Text style={styles.completionText}>เยี่ยมมาก!</Text>
          <Text style={styles.completionSubtext}>
            คุณทำสำเร็จใน {elapsedTime} วินาที
          </Text>
        </View>
      )}
      
      {/* แสดงข้อความรอโหลดเมื่อยังไม่มีชิ้นส่วน */}
      {(!pieces || pieces.length === 0) && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>กำลังเตรียมชิ้นส่วนจิ๊กซอว์...</Text>
        </View>
      )}
      
      {/* แสดงพื้นที่จิ๊กซอว์ */}
      {renderPuzzleBoard()}
      
      {/* แสดงชิ้นส่วนจิ๊กซอว์ */}
      {renderPieces()}
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetGame}
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
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subHeaderText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 12,
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
  loadingContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  puzzleBoard: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  puzzlePiece: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  completionOverlay: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  completionText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  completionSubtext: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resetButton: {
    backgroundColor: 'rgba(10, 132, 255, 0.8)',
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
  floatingHelpButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

export default GlowJigsawGame; 