import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CartManager } from '../cartStore';

export default function CustomerHomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [latestProducts, setLatestProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman'];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('products').select('*').eq('is_active', true);
    if (data) {
      setProducts(data);
      setLatestProducts([...data].reverse().slice(0, 5));
      setPopularProducts([...data].sort(() => 0.5 - Math.random()).slice(0, 5));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Welcome')}><MaterialCommunityIcons name="logout" size={26} color="#E74C3C" /></TouchableOpacity>
        <Text style={styles.brand}>UMKM HUB ✨</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}><MaterialCommunityIcons name="cart" size={28} color="#3498DB" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <TextInput style={styles.searchInput} placeholder="Cari produk..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* MENU PINTAS - Navigasi Langsung */}
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileUMKM')}>
            <View style={[styles.menuIcon, { backgroundColor: '#E67E22' }]}><MaterialCommunityIcons name="storefront" size={24} color="#FFF" /></View>
            <Text style={styles.menuLabel}>Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Promo')}>
            <View style={[styles.menuIcon, { backgroundColor: '#E74C3C' }]}><MaterialCommunityIcons name="ticket-percent" size={24} color="#FFF" /></View>
            <Text style={styles.menuLabel}>Promo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Support')}>
            <View style={[styles.menuIcon, { backgroundColor: '#3498DB' }]}><MaterialCommunityIcons name="help-circle" size={24} color="#FFF" /></View>
            <Text style={styles.menuLabel}>Bantuan</Text>
          </TouchableOpacity>
        </View>

        {/* FILTER KATEGORI */}
        <View style={{ height: 50, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {categories.map(c => (
              <TouchableOpacity key={c} onPress={() => setSelectedCategory(c)} style={[styles.catChip, selectedCategory === c && styles.catChipActive]}>
                <Text style={{ color: selectedCategory === c ? '#FFF' : '#7F8C8D', fontWeight: 'bold' }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {searchQuery === '' && selectedCategory === 'Semua' && (
          <>
            <Text style={styles.secTitle}>🆕 Produk Terbaru</Text>
            <FlatList horizontal data={latestProducts} renderItem={({item}) => (
              <TouchableOpacity style={styles.hCard} onPress={() => navigation.navigate('Detail', { product: item })}>
                <Image source={{ uri: item.image_url }} style={styles.hImg} />
                <Text numberOfLines={1} style={styles.hName}>{item.name}</Text>
                <Text style={styles.hPrice}>Rp {item.price.toLocaleString()}</Text>
              </TouchableOpacity>
            )} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }} />
          </>
        )}

        {/* HASIL PENCARIAN */}
        <Text style={styles.secTitle}>{searchQuery !== '' ? 'Hasil Pencarian' : 'Semua Produk'}</Text>
        <View style={styles.gridContainer}>
          {filteredProducts.map(item => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate('Detail', { product: item })}>
              <Image source={{ uri: item.image_url }} style={styles.cardImg} />
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardPrice}>Rp {item.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  brand: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  searchInput: { backgroundColor: '#F0F2F5', padding: 12, borderRadius: 10 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8F9FA', marginRight: 10, borderRadius: 20, height: 40, justifyContent:'center' },
  catChipActive: { backgroundColor: '#3498DB' },
  menuGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  menuItem: { alignItems: 'center' },
  menuIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 5, elevation: 2 },
  menuLabel: { fontSize: 12, fontWeight: 'bold' },
  secTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginTop: 20, marginBottom: 15 },
  hCard: { width: 130, marginRight: 15 },
  hImg: { width: 130, height: 130, borderRadius: 15 },
  hName: { marginTop: 5, fontWeight: 'bold', fontSize: 13 },
  hPrice: { color: '#27AE60', fontSize: 12, fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  card: { width: '45%', margin: '2.5%', padding: 10, backgroundColor: '#FFF', elevation: 3, borderRadius: 15 },
  cardImg: { width: '100%', height: 110, borderRadius: 12 },
  cardName: { fontWeight: 'bold', marginTop: 8 },
  cardPrice: { color: '#27AE60', fontWeight: 'bold' }
});