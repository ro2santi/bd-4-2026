import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function LoginOwnerScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === 'admin@umkm.com' && password === '123456') {
      navigation.navigate('AdminDashboard');
    } else {
      Alert.alert("Gagal", "Email atau Password Admin salah");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email Owner</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="admin@umkm.com" autoCapitalize="none" />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Login Ke Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#FFF' },
  label: { fontWeight: 'bold', marginBottom: 5 },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  btn: { backgroundColor: '#34495E', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});