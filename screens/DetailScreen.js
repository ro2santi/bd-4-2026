import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CartManager } from '../cartStore'; // Import dari file store baru

export default function DetailScreen({ route, navigation }) {
  const { product } = route.params;

  const handleAddToCart = () => {
    CartManager.add(product);
    Alert.alert("Berhasil", `${product.name} telah masuk ke keranjang!`);
    navigation.goBack(); // Kembali ke katalog produk
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>Rp {product.price.toLocaleString()}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Deskripsi</Text>
        <Text style={styles.desc}>{product.description || "Produk UMKM berkualitas tinggi."}</Text>
        
        <TouchableOpacity style={styles.btn} onPress={handleAddToCart}>
          <MaterialCommunityIcons name="cart-plus" size={24} color="#FFF" style={{marginRight: 10}} />
          <Text style={styles.btnText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  image: { width: '100%', height: 350 },
  info: { padding: 25 },
  name: { fontSize: 26, fontWeight: 'bold' },
  price: { fontSize: 22, color: '#27AE60', fontWeight: 'bold', marginVertical: 10 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  label: { fontSize: 16, fontWeight: 'bold' },
  desc: { fontSize: 15, color: '#7F8C8D', lineHeight: 22 },
  btn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});