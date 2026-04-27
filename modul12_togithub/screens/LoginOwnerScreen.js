import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';

export default function LoginOwnerScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Isi email dan password");
    
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password.trim())
      .maybeSingle();

    setLoading(false);

    if (error) return Alert.alert("Error", "Masalah koneksi database");

    if (data) {
      if (data.role === 'admin') {
        navigation.replace('AdminDashboard', { userData: data });
      } else {
        // Meneruskan data user ke Dashboard Pelanggan
        navigation.replace('CustomerDashboard', { userData: data });
      }
    } else {
      Alert.alert("Gagal", "Email atau Password salah");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login UMKM HUB</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Masuk</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{marginTop: 20}}>
        <Text style={styles.link}>Daftar Pelanggan Baru</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  btn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  link: { color: '#3498DB', textAlign: 'center' }
});