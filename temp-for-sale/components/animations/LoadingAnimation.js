import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * LoadingAnimation - คอมโพเนนต์สำหรับแสดงสถานะกำลังโหลด
 * 
 * @param {object} props - Props ทั้งหมด
 * @param {string} props.text - ข้อความที่แสดง
 * @param {string} props.color - สีหลัก
 * @param {string} props.size - ขนาด ('small', 'medium', 'large')
 * @param {ViewProps} props.style - สไตล์เพิ่มเติม
 */
const LoadingAnimation = ({ 
  text = 'กำลังโหลด', 
  color = '#FF9500', 
  size = 'medium', 
  style 
}) => {
  // Animation values
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // ขนาดไอคอนตาม size
  const getIconSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 36;
    }
  };
  
  // เริ่ม animation ทันทีที่คอมโพเนนต์ถูกสร้าง
  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
    
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 700,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Fade in animation
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, []);
  
  // แปลง rotation value ให้เป็นค่า rotate degrees
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <Animated.View style={[styles.container, { opacity }, style]}>
      <Animated.View style={[
        styles.iconContainer, 
        {
          transform: [
            { rotate: spin },
            { scale: scale }
          ]
        }
      ]}>
        <MaterialCommunityIcons 
          name="loading" 
          size={getIconSize()} 
          color={color} 
        />
      </Animated.View>
      {text && (
        <Animated.Text style={[styles.text, { color }]}>
          {text}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  }
});

export default LoadingAnimation; 