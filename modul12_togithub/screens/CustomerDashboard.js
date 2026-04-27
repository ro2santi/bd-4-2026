import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomerDashboard({ route, navigation }) {
  // Menerima data dari Login
  const { userData } = route.params || {}; 

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Selamat Datang, {userData?.full_name || 'Pelanggan'}</Text>
      
      <View style={styles.menuGrid}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('CustomerHome', { userData })}
        >
          <MaterialCommunityIcons name="store" size={40} color="#3498DB" />
          <Text>Katalog Produk</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('Cart', { userData })}
        >
          <MaterialCommunityIcons name="cart" size={40} color="#E67E22" />
          <Text>Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FA' },
  welcome: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  menuGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  menuItem: { backgroundColor: '#FFF', width: '48%', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 }
});