import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { supabase } from '../supabase'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileUMKMScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: null,
    name: '',
    description: '',
    address: '',
    whatsapp: ''
  });

  // Ambil data profil saat halaman dibuka
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Menggunakan maybeSingle agar tidak error jika data kosong
      const { data, error } = await supabase
        .from('profile_umkm')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          id: data.id,
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          whatsapp: data.whatsapp || ''
        });
      }
    } catch (error) {
      console.log('Error fetching profile:', error.message);
      Alert.alert("Error", "Gagal mengambil data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!profile.name) return Alert.alert("Error", "Nama toko tidak boleh kosong");

    try {
      setSaving(true);
      
      const payload = {
        name: profile.name,
        description: profile.description,
        address: profile.address,
        whatsapp: profile.whatsapp,
        updated_at: new Date()
      };

      let error;

      if (profile.id) {
        // Jika sudah ada data, lakukan UPDATE
        const { error: updateError } = await supabase
          .from('profile_umkm')
          .update(payload)
          .eq('id', profile.id);
        error = updateError;
      } else {
        // Jika data masih kosong di DB, lakukan INSERT
        const { error: insertError } = await supabase
          .from('profile_umkm')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      
      Alert.alert("Sukses", "Profil UMKM berhasil disimpan!");
      fetchProfile(); // Segarkan data
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={{marginTop: 10}}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFF'}}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
            <MaterialCommunityIcons name="store-edit" size={40} color="#3498DB" />
            <Text style={styles.title}>Profil UMKM</Text>
            <Text style={styles.subtitle}>Kelola informasi publik toko Anda</Text>
        </View>

        <View style={styles.form}>
            <Text style={styles.label}>Nama Toko</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Contoh: Kedai Seblak Juara" 
              value={profile.name}
              onChangeText={(text) => setProfile({...profile, name: text})}
            />

            <Text style={styles.label}>Deskripsi Toko</Text>
            <TextInput 
              style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
              placeholder="Ceritakan tentang toko Anda..." 
              multiline 
              numberOfLines={4}
              value={profile.description}
              onChangeText={(text) => setProfile({...profile, description: text})}
            />

            <Text style={styles.label}>Nomor WhatsApp Official</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0812xxxxxx" 
              keyboardType="phone-pad"
              value={profile.whatsapp}
              onChangeText={(text) => setProfile({...profile, whatsapp: text})}
            />

            <Text style={styles.label}>Alamat Lengkap</Text>
            <TextInput 
              style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
              placeholder="Jl. Nama Jalan No. XX, Kota..." 
              multiline
              value={profile.address}
              onChangeText={(text) => setProfile({...profile, address: text})}
            />

            <TouchableOpacity 
              style={[styles.button, saving && {backgroundColor: '#BDC3C7'}]} 
              onPress={handleUpdate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                  <Text style={styles.btnText}> Simpan Profil</Text>
                </>
              )}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#7F8C8D' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#34495E', marginBottom: 5 },
  input: { 
    backgroundColor: '#F9F9F9',
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 10,
    padding: 12, 
    marginBottom: 20,
    fontSize: 16,
    color: '#2C3E50'
  },
  button: { 
    backgroundColor: '#3498DB', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2
  },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});