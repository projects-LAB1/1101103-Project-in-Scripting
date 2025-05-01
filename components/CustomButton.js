import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  ActivityIndicator,
  View 
} from 'react-native';

const { width } = Dimensions.get('window');

const CustomButton = ({ 
  title, 
  onPress, 
  type = 'primary', 
  size = 'regular', 
  disabled = false,
  loading = false,
  icon = null,
  style = {},
  textStyle = {}
}) => {
  // Animation value for press effect
  const [pressAnim] = useState(new Animated.Value(1));
  
  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4
    }).start();
  };

  // Determine button styles based on type and size
  const getButtonStyle = () => {
    let buttonStyle = [styles.button];
    
    // Button type
    switch (type) {
      case 'primary':
        buttonStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        buttonStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        buttonStyle.push(styles.outlineButton);
        break;
      case 'text':
        buttonStyle.push(styles.textButton);
        break;
      case 'link':
        buttonStyle.push(styles.linkButton);
        break;
      case 'danger':
        buttonStyle.push(styles.dangerButton);
        break;
      default:
        buttonStyle.push(styles.primaryButton);
    }
    
    // Button size
    switch (size) {
      case 'small':
        buttonStyle.push(styles.smallButton);
        break;
      case 'large':
        buttonStyle.push(styles.largeButton);
        break;
      case 'full':
        buttonStyle.push(styles.fullButton);
        break;
      default:
        // Regular size is default
        break;
    }
    
    // Disabled state
    if (disabled || loading) {
      buttonStyle.push(styles.disabledButton);
    }
    
    return buttonStyle;
  };
  
  // Determine text styles based on button type
  const getTextStyle = () => {
    let textStyleArray = [styles.buttonText];
    
    switch (type) {
      case 'primary':
        textStyleArray.push(styles.primaryText);
        break;
      case 'secondary':
        textStyleArray.push(styles.secondaryText);
        break;
      case 'outline':
        textStyleArray.push(styles.outlineText);
        break;
      case 'text':
      case 'link':
        textStyleArray.push(styles.linkText);
        break;
      case 'danger':
        textStyleArray.push(styles.dangerText);
        break;
      default:
        textStyleArray.push(styles.primaryText);
    }
    
    // Button size affects text
    switch (size) {
      case 'small':
        textStyleArray.push(styles.smallText);
        break;
      case 'large':
        textStyleArray.push(styles.largeText);
        break;
      default:
        // Regular text is default
        break;
    }
    
    // Disabled state
    if (disabled) {
      textStyleArray.push(styles.disabledText);
    }
    
    return textStyleArray;
  };

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: pressAnim }] },
        type === 'full' && styles.fullWidthContainer
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={!disabled && !loading ? onPress : null}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[getButtonStyle(), style]}
        disabled={disabled || loading}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={type === 'outline' || type === 'text' || type === 'link' ? '#4F46E5' : '#FFFFFF'} 
            />
          ) : (
            <>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  // Button Types
  primaryButton: {
    backgroundColor: '#4F46E5',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  secondaryButton: {
    backgroundColor: '#6B7280',
    elevation: 2,
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    paddingVertical: 10,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 80,
  },
  linkButton: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 0,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  // Button Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  fullButton: {
    width: width - 48,
    maxWidth: 400,
    alignSelf: 'center',
    paddingVertical: 15,
  },
  fullWidthContainer: {
    width: '100%',
    alignItems: 'center',
  },
  
  // Disabled State
  disabledButton: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  
  // Text Styles
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#4F46E5',
  },
  linkText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default CustomButton; 