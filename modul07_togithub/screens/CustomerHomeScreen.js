import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomerHomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('is_active', true);
    setProducts(data || []);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>UMKM HUB ✨</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <MaterialCommunityIcons name="cart" size={28} color="#3498DB" />
        </TouchableOpacity>
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
        data={products.filter(p => selectedCategory === 'Semua' || p.category === selectedCategory)}
        numColumns={2}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  brand: { fontSize: 22, fontWeight: 'bold' },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8F9FA', marginRight: 10, borderRadius: 20, height: 40, justifyContent:'center' },
  catChipActive: { backgroundColor: '#3498DB' },
  card: { width: '45%', margin: '2.5%', padding: 10, backgroundColor: '#FFF', elevation: 3, borderRadius: 15 },
  cardImg: { width: '100%', height: 110, borderRadius: 12 },
  cardName: { fontWeight: 'bold', marginTop: 8 },
  cardPrice: { color: '#27AE60', fontWeight: 'bold' }
});