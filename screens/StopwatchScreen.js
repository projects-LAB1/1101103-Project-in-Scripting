import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StopwatchScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const startAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimation = () => {
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
  };

  const formatTime = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }, []);

  const startStopwatch = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
      startAnimation();
    } else {
      clearInterval(timerRef.current);
      stopAnimation();
    }
    setIsRunning(!isRunning);
  };

  const lapTime = () => {
    const currentLap = time;
    const previousLap = laps[0]?.time || 0;
    const lapTime = currentLap - previousLap;
    setLaps([{ time: currentLap, lapTime }, ...laps]);
  };

  const resetStopwatch = () => {
    clearInterval(timerRef.current);
    stopAnimation();
    setTime(0);
    setLaps([]);
    setIsRunning(false);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderLap = ({ item, index }) => {
    const lapNumber = laps.length - index;
    return (
      <View style={styles.lapRow}>
        <Text style={styles.lapText}>Lap {lapNumber}</Text>
        <Text style={styles.lapTime}>{formatTime(item.lapTime)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จับเวลา</Text>
      </View>

      <View style={styles.timerContainer}>
        <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinner} />
        </Animated.View>
        <Text style={styles.timerText}>{formatTime(time)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={resetStopwatch}
          disabled={isRunning || time === 0}
        >
          <Text style={[styles.buttonText, styles.resetButtonText, (isRunning || time === 0) && styles.buttonDisabled]}>
            รีเซ็ต
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.mainButton, isRunning ? styles.stopButton : styles.startButton]}
          onPress={startStopwatch}
        >
          <Text style={[styles.buttonText, styles.mainButtonText]}>
            {isRunning ? 'หยุด' : 'เริ่ม'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.lapButton]}
          onPress={lapTime}
          disabled={!isRunning}
        >
          <Text style={[styles.buttonText, styles.lapButtonText, !isRunning && styles.buttonDisabled]}>
            รอบ
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={laps}
        renderItem={renderLap}
        keyExtractor={(_, index) => index.toString()}
        style={styles.lapList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    height: 200,
  },
  spinnerContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 3,
    height: 90,
    backgroundColor: '#FF9500',
    borderRadius: 3,
  },
  timerText: {
    fontSize: 70,
    fontVariant: ['tabular-nums'],
    color: '#FFFFFF',
    fontWeight: '200',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  startButton: {
    backgroundColor: '#1C3C1E',
  },
  stopButton: {
    backgroundColor: '#3C1C1E',
  },
  resetButton: {
    backgroundColor: '#1C1C1E',
  },
  lapButton: {
    backgroundColor: '#1C1C1E',
  },
  buttonText: {
    fontSize: 17,
  },
  mainButtonText: {
    color: '#FFFFFF',
  },
  resetButtonText: {
    color: '#FF9500',
  },
  lapButtonText: {
    color: '#FF9500',
  },
  buttonDisabled: {
    color: '#666666',
  },
  lapList: {
    flex: 1,
  },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lapText: {
    fontSize: 17,
    color: '#98989F',
  },
  lapTime: {
    fontSize: 17,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginLeft: 16,
  },
});

export default StopwatchScreen; 