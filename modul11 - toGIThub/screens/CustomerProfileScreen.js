import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomerProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profile_umkm').select('*').maybeSingle();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{flex:1, marginTop: 50}} color="#3498DB" />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <View style={styles.header}>
        <Image source={{ uri: profile?.logo_url || 'https://via.placeholder.com/150' }} style={styles.logo} />
        <Text style={styles.name}>{profile?.name || 'Toko UMKM'}</Text>
        <Text style={styles.slogan}>{profile?.slogan || 'Kualitas Terbaik untuk Anda'}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Tentang Kami</Text>
        <Text style={styles.desc}>{profile?.description || 'Kami menyediakan produk UMKM pilihan.'}</Text>
        
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#E74C3C" />
          <Text style={styles.infoText}>{profile?.address || 'Alamat belum diatur'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: 40, backgroundColor: '#F8F9FA' },
  logo: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold' },
  slogan: { fontSize: 14, color: '#7F8C8D', fontStyle: 'italic' },
  body: { padding: 25 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  desc: { lineHeight: 22, color: '#444' },
  infoBox: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  infoText: { marginLeft: 10, color: '#2C3E50' }
});