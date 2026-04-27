import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert("Error", "Lengkapi data");

    setLoading(true);
    const { error } = await supabase.from('users').insert([
      { 
        full_name: form.name, 
        phone: form.phone, 
        email: form.email.toLowerCase(), 
        password: form.password,
        role: 'pelanggan' 
      }
    ]);

    setLoading(false);
    if (error) {
      Alert.alert("Gagal", "Email mungkin sudah terdaftar");
    } else {
      Alert.alert("Sukses", "Daftar Berhasil!", [{ text: "Login", onPress: () => navigation.goBack() }]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daftar Pelanggan</Text>
      <TextInput style={styles.input} placeholder="Nama" onChangeText={t => setForm({...form, name:t})} />
      <TextInput style={styles.input} placeholder="No WA" onChangeText={t => setForm({...form, phone:t})} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Email" onChangeText={t => setForm({...form, email:t})} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" onChangeText={t => setForm({...form, password:t})} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Daftar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  btn: { backgroundColor: '#2ECC71', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});