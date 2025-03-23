// ProfileScreen.js - หน้าโปรไฟล์ผู้ใช้
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, Image, ScrollView, ActivityIndicator 
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        // กรณีไม่พบข้อมูลผู้ใช้ ให้สร้างข้อมูลเริ่มต้น
        setUserData({
          email: user.email,
          displayName: user.displayName || 'ผู้ใช้',
          statistics: {
            totalAlarms: 0,
            alarmsCompleted: 0,
            alarmsSnooze: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับการเชื่อมต่อออฟไลน์หรือไม่
      if (error.message && error.message.includes('offline')) {
        // กรณีออฟไลน์ ให้สร้างข้อมูลเริ่มต้นเพื่อแสดงในโหมดออฟไลน์
        setUserData({
          email: user.email,
          displayName: user.displayName || 'ผู้ใช้',
          statistics: {
            totalAlarms: 0,
            alarmsCompleted: 0,
            alarmsSnooze: 0
          },
          isOfflineData: true // เพิ่มตัวบ่งชี้ว่าเป็นข้อมูลออฟไลน์
        });
        Alert.alert('โหมดออฟไลน์', 'แอปกำลังทำงานในโหมดออฟไลน์ ข้อมูลบางส่วนอาจไม่อัปเดต');
      } else {
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'ยืนยันการออกจากระบบ',
      'คุณต้องการออกจากระบบใช่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ออกจากระบบ', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // การนำทางจะถูกจัดการโดย onAuthStateChanged ใน App.js
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
            }
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userName}>{user?.displayName || 'ผู้ใช้'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.statistics?.totalAlarms || 0}</Text>
          <Text style={styles.statLabel}>นาฬิกาปลุกทั้งหมด</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.statistics?.alarmsCompleted || 0}</Text>
          <Text style={styles.statLabel}>ปิดปลุกสำเร็จ</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.statistics?.alarmsSnooze || 0}</Text>
          <Text style={styles.statLabel}>เลื่อนปลุก</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>การตั้งค่า</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="bell-outline" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>การแจ้งเตือน</Text>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="theme-light-dark" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>ธีม</Text>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="translate" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>ภาษา</Text>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>เกี่ยวกับ</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="information-outline" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>เกี่ยวกับแอป</Text>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="help-circle-outline" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>ช่วยเหลือ</Text>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="shield-check-outline" size={24} color="#4B5563" style={styles.menuIcon} />
          <Text style={styles.menuText}>นโยบายความเป็นส่วนตัว</Text>
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#EF4444" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default ProfileScreen;
