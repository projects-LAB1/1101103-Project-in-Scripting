import React, { useEffect } from 'react';
import { Animated, ViewProps } from 'react-native';

/**
 * FadeIn - คอมโพเนนต์สำหรับทำ fade-in animation
 * 
 * @param {object} props - Props ทั้งหมด
 * @param {React.ReactNode} props.children - React children
 * @param {number} props.duration - ระยะเวลาของ animation (มิลลิวินาที)
 * @param {number} props.delay - ระยะเวลาหน่วงก่อนเริ่ม animation (มิลลิวินาที)
 * @param {ViewProps} props.style - สไตล์เพิ่มเติม
 */
const FadeIn = ({ 
  children, 
  duration = 500, 
  delay = 0, 
  style, 
  ...props 
}) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: duration,
      delay: delay,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity },
        style
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default FadeIn; 