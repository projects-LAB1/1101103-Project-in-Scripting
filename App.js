import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import PagerView from "react-native-pager-view";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// นำเข้าคอมโพเนนต์จากไฟล์แยก
import HomeScreen from "./screens/HomeScreen";
import SecondScreen from "./screens/SecondScreen";
import SecondScreen2 from "./screens/SecondScreen2";
import ProfileScreen from "./screens/ProfileScreen";
import AlarmSetupScreen from "./screens/AlarmSetupScreen";

const Stack = createStackNavigator();

// สร้างคอมโพเนนต์สำหรับหน้าหลักที่มี PagerView
function MainScreen({ navigation }) {
  const [currentPage, setCurrentPage] = useState(0);

  const screens = [
    { name: "Alarm", component: () => <HomeScreen navigation={navigation} /> },
    { name: "Wake", component: () => <SecondScreen navigation={navigation} /> },
    { name: "guide", component: () => <SecondScreen2 navigation={navigation} /> },
    { name: "Profile", component: () => <ProfileScreen navigation={navigation} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E2E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Morning Quest</Text>
        <TouchableOpacity style={styles.menuButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine}></View>
            <View style={styles.menuLine}></View>
            <View style={styles.menuLine}></View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content with PagerView */}
      <View style={styles.contentContainer}>
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          {screens.map((screen, index) => (
            <View key={index} style={styles.page}>
              <screen.component />
            </View>
          ))}
        </PagerView>
      </View>

      {/* Fixed Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {screens.map((screen, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tabItem}
            onPress={() => setCurrentPage(index)}
          >
            <View
              style={[
                styles.tabIcon,
                currentPage === index ? styles.activeTabIcon : null,
              ]}
            ></View>
            <Text
              style={[
                styles.tabLabel,
                currentPage === index ? styles.activeTabLabel : null,
              ]}
            >
              {screen.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={MainScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AlarmSetupScreen" 
          component={AlarmSetupScreen} 
          options={{ 
            title: "New Alarm",
            headerStyle: {
              backgroundColor: "#1E1E2E",
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E2E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    width: 24,
    height: 24,
    justifyContent: "space-around",
  },
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "#2D2D3F",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
  },
  tabIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#8F8F9F",
    borderRadius: 12,
    marginBottom: 4,
  },
  activeTabIcon: {
    backgroundColor: "#4080FF",
  },
  tabLabel: {
    color: "#8F8F9F",
    fontSize: 12,
  },
  activeTabLabel: {
    color: "#4080FF",
  },
});