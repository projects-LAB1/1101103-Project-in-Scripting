import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment-timezone';

// Sample city data - In a real app, this would come from an API or larger dataset
const CITIES = [
  { id: '1', city: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand' },
  { id: '2', city: 'London', timezone: 'Europe/London', country: 'United Kingdom' },
  { id: '3', city: 'New York', timezone: 'America/New_York', country: 'United States' },
  { id: '4', city: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
  { id: '5', city: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
  { id: '6', city: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { id: '7', city: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
  { id: '8', city: 'Dubai', timezone: 'Asia/Dubai', country: 'United Arab Emirates' },
];

const AddCityScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState(CITIES);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCities(CITIES);
    } else {
      const filtered = CITIES.filter(
        city =>
          city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [searchQuery]);

  const handleAddCity = (city) => {
    // TODO: Add city to world clock list
    console.log('Adding city:', city);
    navigation.goBack();
  };

  const renderItem = ({ item }) => {
    const time = moment().tz(item.timezone).format('HH:mm');
    
    return (
      <TouchableOpacity
        style={styles.cityItem}
        onPress={() => handleAddCity(item)}
      >
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{item.city}</Text>
          <Text style={styles.countryName}>{item.country}</Text>
        </View>
        <Text style={styles.cityTime}>{time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>ยกเลิก</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>เพิ่มนาฬิกา</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#98989F" />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาเมือง"
          placeholderTextColor="#98989F"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredCities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 17,
    color: '#FF9500',
  },
  placeholder: {
    width: 61, // Match cancel button width for center alignment
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
    color: '#FFFFFF',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  countryName: {
    fontSize: 15,
    color: '#98989F',
  },
  cityTime: {
    fontSize: 17,
    color: '#98989F',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginLeft: 16,
  },
});

export default AddCityScreen; 