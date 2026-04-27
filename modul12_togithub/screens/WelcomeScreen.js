import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.center}>
      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/609/609803.png' }} style={styles.logo} />
      <Text style={styles.title}>UMKM HUB</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CustomerHome')}>
        <Text style={styles.btnText}>Umum</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, {backgroundColor:'#34495E'}]} onPress={() => navigation.navigate('LoginOwner')}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25, backgroundColor: '#FFF' },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  btn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, width: '100%', alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});