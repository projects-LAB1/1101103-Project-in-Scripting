import React, { useEffect } from 'react';
import { Animated, ViewProps } from 'react-native';

/**
 * SlideIn - คอมโพเนนต์สำหรับทำ slide-in animation
 * 
 * @param {object} props - Props ทั้งหมด
 * @param {React.ReactNode} props.children - React children
 * @param {number} props.duration - ระยะเวลาของ animation (มิลลิวินาที)
 * @param {number} props.delay - ระยะเวลาหน่วงก่อนเริ่ม animation (มิลลิวินาที)
 * @param {string} props.direction - ทิศทางของการ slide ('left', 'right', 'up', 'down')
 * @param {number} props.distance - ระยะทางของการ slide (pixel)
 * @param {ViewProps} props.style - สไตล์เพิ่มเติม
 */
const SlideIn = ({ 
  children, 
  duration = 500, 
  delay = 0, 
  direction = 'up', 
  distance = 50,
  style, 
  ...props 
}) => {
  // กำหนดค่าเริ่มต้นของการเคลื่อนไหวตามทิศทาง
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { translateX: new Animated.Value(distance) };
      case 'right':
        return { translateX: new Animated.Value(-distance) };
      case 'up':
        return { translateY: new Animated.Value(distance) };
      case 'down':
        return { translateY: new Animated.Value(-distance) };
      default:
        return { translateY: new Animated.Value(distance) };
    }
  };

  const { translateX, translateY } = getInitialPosition();
  const opacity = new Animated.Value(0);

  useEffect(() => {
    const animations = [];
    
    // Animate position
    if (translateX) {
      animations.push(
        Animated.timing(translateX, {
          toValue: 0,
          duration: duration,
          delay: delay,
          useNativeDriver: true
        })
      );
    }
    
    if (translateY) {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration,
          delay: delay,
          useNativeDriver: true
        })
      );
    }
    
    // Animate opacity
    animations.push(
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true
      })
    );
    
    // Run animations in parallel
    Animated.parallel(animations).start();
  }, []);

  return (
    <Animated.View
      style={[
        { 
          opacity,
          transform: [translateX ? { translateX } : { translateY }]
        },
        style
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default SlideIn; 