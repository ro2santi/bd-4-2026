import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CartManager } from '../cartStore';
import { supabase } from '../supabase';

export default function DetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [storeWA, setStoreWA] = useState('628123456789'); // Default jika DB kosong

  useEffect(() => {
    fetchStorePhone();
  }, []);

  const fetchStorePhone = async () => {
    // Ambil nomor WA dari profil toko di database
    const { data } = await supabase.from('profile_umkm').select('whatsapp').limit(1).maybeSingle();
    if (data && data.whatsapp) {
      setStoreWA(data.whatsapp);
    }
  };

  const handleChatSeller = () => {
    // Format nomor: Bersihkan karakter non-angka, ganti 0 jadi 62
    let cleanPhone = storeWA.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const message = `Halo Admin, saya tertarik dengan produk *${product.name}*. Stoknya masih ada?`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Jika aplikasi WA tidak ada, buka lewat browser wa.me
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView>
        <Image source={{ uri: product.image_url }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>Rp {product.price.toLocaleString()}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Deskripsi</Text>
          <Text style={styles.desc}>{product.description || "Produk UMKM berkualitas."}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnChat} onPress={handleChatSeller}>
          <MaterialCommunityIcons name="whatsapp" size={28} color="#25D366" />
          <Text style={{ fontSize: 10, color: '#25D366', fontWeight: 'bold' }}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnCart} onPress={() => { CartManager.add(product); Alert.alert("Berhasil", "Produk telah masuk keranjang"); }}>
          <MaterialCommunityIcons name="cart-plus" size={24} color="#FFF" />
          <Text style={styles.btnText}> Tambah Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 350 },
  info: { padding: 25 },
  name: { fontSize: 26, fontWeight: 'bold' },
  price: { fontSize: 22, color: '#27AE60', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  label: { fontSize: 16, fontWeight: 'bold' },
  desc: { fontSize: 15, color: '#7F8C8D', lineHeight: 22 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  btnChat: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRightWidth: 1, borderColor: '#EEE' },
  btnCart: { flex: 1, backgroundColor: '#3498DB', marginLeft: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});