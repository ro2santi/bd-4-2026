import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CartManager } from '../cartStore'; // Pastikan import ini ada jika ingin hapus keranjang saat logout

export default function CustomerHomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); 
  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('is_active', true);
    setProducts(data || []);
  };

  // FUNGSI LOGOUT
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Apakah Anda yakin ingin keluar ke menu utama?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          onPress: () => {
            CartManager.clear(); // Opsional: Bersihkan keranjang saat logout
            // 'replace' digunakan agar user tidak bisa 'Back' lagi ke sini
            navigation.replace('Welcome'); // Ganti 'Welcome' dengan nama screen Dashboard Utama Anda
          },
          style: "destructive"
        }
      ]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }); 

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER DENGAN TOMBOL LOGOUT & KERANJANG */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={26} color="#E74C3C" />
        </TouchableOpacity>
        
        <Text style={styles.brand}>UMKM HUB ✨</Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="cart" size={28} color="#3498DB" />
        </TouchableOpacity>
      </View>

      {/* ... Sisa kode pencarian dan kategori tetap sama ... */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk favoritmu..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{ height: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {categories.map(c => (
            <TouchableOpacity 
              key={c} 
              onPress={() => setSelectedCategory(c)} 
              style={[styles.catChip, selectedCategory === c && styles.catChipActive]}
            >
              <Text style={{ color: selectedCategory === c ? '#FFF' : '#7F8C8D' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList 
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('Detail', { product: item })}
          >
            <Image source={{ uri: item.image_url }} style={styles.cardImg} />
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardPrice}>Rp {item.price.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  brand: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  searchInput: { backgroundColor: '#F0F2F5', padding: 12, borderRadius: 10 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8F9FA', marginRight: 10, borderRadius: 20, height: 40, justifyContent:'center' },
  catChipActive: { backgroundColor: '#3498DB' },
  card: { width: '45%', margin: '2.5%', padding: 10, backgroundColor: '#FFF', elevation: 3, borderRadius: 15 },
  cardImg: { width: '100%', height: 110, borderRadius: 12 },
  cardName: { fontWeight: 'bold', marginTop: 8 },
  cardPrice: { color: '#27AE60', fontWeight: 'bold' }
});