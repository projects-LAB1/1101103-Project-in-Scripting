import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * StatisticCard - การ์ดแสดงข้อมูลสถิติต่างๆ
 * 
 * @param {string} title - หัวข้อของการ์ด
 * @param {array} items - รายการข้อมูลสถิติ [{ label, value, icon, valueColor }]
 * @param {function} onPress - ฟังก์ชันเมื่อกดการ์ด
 * @param {boolean} showViewMore - แสดงปุ่ม "ดูเพิ่มเติม"
 * @param {string} viewMoreText - ข้อความปุ่ม "ดูเพิ่มเติม"
 * @param {function} onViewMorePress - ฟังก์ชันเมื่อกดปุ่ม "ดูเพิ่มเติม"
 * @param {object} style - สไตล์เพิ่มเติม 
 * @param {string} icon - ไอคอนของการ์ด
 * @param {string} iconColor - สีของไอคอน
 */
const StatisticCard = ({ 
  title, 
  items, 
  onPress, 
  showViewMore = false,
  viewMoreText = 'ดูเพิ่มเติม',
  onViewMorePress,
  style,
  icon,
  iconColor = '#FF9500'
}) => {
  if (!items || items.length === 0) return null;
  
  // สำหรับ layout ของ items 
  const getItemLayout = () => {
    switch (items.length) {
      case 1:
        return styles.singleItem;
      case 2:
        return styles.twoItemsContainer;
      case 3:
        return styles.threeItemsContainer;
      default:
        return styles.multiItemsContainer;
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Header */}
      {title && (
        <View style={styles.header}>
          {icon && (
            <MaterialCommunityIcons 
              name={icon} 
              size={24} 
              color={iconColor} 
              style={styles.icon}
            />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      {/* Content */}
      <View style={[styles.content, getItemLayout()]}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            {item.icon && (
              <MaterialCommunityIcons 
                name={item.icon} 
                size={20} 
                color={item.iconColor || iconColor} 
                style={styles.itemIcon}
              />
            )}
            <View style={styles.itemContent}>
              <Text style={[
                styles.itemValue, 
                item.valueColor && { color: item.valueColor }
              ]}>
                {item.value}
              </Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* View More Button */}
      {showViewMore && (
        <TouchableOpacity 
          style={styles.viewMoreButton}
          onPress={onViewMorePress}
          activeOpacity={0.7}
        >
          <Text style={styles.viewMoreText}>{viewMoreText}</Text>
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={20} 
            color="#0A84FF" 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    marginBottom: 8,
  },
  singleItem: {
    alignItems: 'center',
  },
  twoItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  threeItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  multiItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 80,
  },
  itemIcon: {
    marginRight: 8,
  },
  itemContent: {
    flexDirection: 'column',
  },
  itemValue: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  itemLabel: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  viewMoreText: {
    fontSize: 15,
    color: '#0A84FF',
    marginRight: 4,
  },
});

export default StatisticCard; 