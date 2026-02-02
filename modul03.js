import React, { useState, useEffect } from 'react';
import { 
  Text, View, StyleSheet, TouchableOpacity, FlatList, 
  Image, ActivityIndicator, SafeAreaView, ScrollView, 
  StatusBar, Dimensions, Alert
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- 1. KONFIGURASI DATABASE ---
// Ganti dengan kredensial dari Dashboard Supabase -> Project Settings -> API
const SUPABASE_URL = 'gunakan url masing-masing'; 
const SUPABASE_ANON_KEY = 'gunakan key masing-masing';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [role, setRole] = useState(null); // null, 'customer', 'owner'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman', 'Kesehatan'];

  // Fungsi Fetch Data
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.log("Error Fetching:", e.message);
      Alert.alert("Error", "Gagal memuat data dari database. Pastikan RLS di Supabase sudah di-enable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter Logic
  const filteredProducts = selectedCategory === 'Semua' 
    ? products 
    : products.filter(item => item.category === selectedCategory);

  // --- 2. UI: LANDING PAGE ---
  const LandingPage = () => (
    <View style={styles.landingContainer}>
      <View style={styles.circleDecor} />
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/609/609803.png' }} 
        style={styles.landingLogo} 
      />
      <Text style={styles.landingTitle}>UMKM HUB</Text>
      <Text style={styles.landingSubtitle}>Satu Aplikasi, Solusi Digital UMKM Indonesia</Text>
      
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.mainBtn} onPress={() => setRole('customer')}>
          <MaterialCommunityIcons name="shopping" size={24} color="#fff" />
          <Text style={styles.mainBtnText}>Masuk Pelanggan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setRole('owner')}>
          <MaterialCommunityIcons name="storefront" size={24} color="#3498DB" />
          <Text style={styles.secondaryBtnText}>Pemilik Usaha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- 3. UI: CUSTOMER HOME ---
  const CustomerHome = () => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navbar */}
      <View style={styles.navBar}>
        <View>
          <Text style={styles.welcomeText}>Halo Pelanggan,</Text>
          <Text style={styles.brandText}>UMKM HUB ✨</Text>
        </View>
        <TouchableOpacity style={styles.logoutCircle} onPress={() => setRole(null)}>
          <MaterialCommunityIcons name="logout" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* Category Slider */}
      <View style={styles.catWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setSelectedCategory(cat)}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>Katalog {selectedCategory}</Text>

      {loading ? (
        <View style={styles.center}>
           <ActivityIndicator size="large" color="#3498DB" />
           <Text style={{marginTop: 10, color: '#95A5A6'}}>Menghubungkan ke Database...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{color: '#BDC3C7'}}>Tidak ada produk di kategori ini.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.pCard}>
              <Image source={{ uri: item.image_url }} style={styles.pImg} />
              <View style={styles.pContent}>
                <Text style={styles.pCat}>{item.category}</Text>
                <Text style={styles.pName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.pPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
                <TouchableOpacity style={styles.pBtn} onPress={() => Alert.alert("Sukses", "Produk masuk keranjang!")}>
                  <Text style={styles.pBtnText}>Tambah +</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );

  // --- LOGIC NAVIGASI ---
  if (!role) return <LandingPage />;
  if (role === 'owner') {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="lock" size={80} color="#E67E22" />
        <Text style={styles.title}>Mode CRM Pemilik</Text>
        <Text style={{textAlign: 'center', margin: 20}}>Fitur Manajemen Pelanggan & Produk akan dibuka pada Pertemuan berikutnya. See You :-)</Text>
        <TouchableOpacity onPress={() => setRole(null)}>
          <Text style={{color: '#3498DB', fontWeight: 'bold'}}>Kembali ke Awal</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <CustomerHome />;
}

// --- 4. STYLESHEET ---
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  // Landing Page Styles
  landingContainer: { flex: 1, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center', padding: 30 },
  circleDecor: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E1F0FF' },
  landingLogo: { width: 140, height: 140, marginBottom: 20 },
  landingTitle: { fontSize: 36, fontWeight: '900', color: '#2C3E50' },
  landingSubtitle: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginBottom: 50 },
  buttonGroup: { width: '100%' },
  mainBtn: { backgroundColor: '#3498DB', flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 4 },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  secondaryBtn: { backgroundColor: '#fff', flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#3498DB' },
  secondaryBtnText: { color: '#3498DB', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },

  // Customer Home Styles
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: 40 },
  welcomeText: { fontSize: 14, color: '#95A5A6' },
  brandText: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  logoutCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#FDEDEC', justifyContent: 'center', alignItems: 'center' },
  
  catWrapper: { marginVertical: 10 },
  catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#F8F9FA', marginRight: 10, borderWidth: 1, borderColor: '#ECF0F1' },
  catChipActive: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  catChipText: { color: '#7F8C8D', fontWeight: '600' },
  catChipTextActive: { color: '#FFF' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 25, marginBottom: 15, color: '#2C3E50' },
  listPadding: { paddingHorizontal: 15, paddingBottom: 20 },
  pCard: { backgroundColor: '#FFF', width: (width / 2) - 22, margin: 7, borderRadius: 20, elevation: 4, overflow: 'hidden' },
  pImg: { width: '100%', height: 140, backgroundColor: '#F0F3F4' },
  pContent: { padding: 12 },
  pCat: { fontSize: 9, color: '#3498DB', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  pName: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  pPrice: { fontSize: 15, fontWeight: '800', color: '#27AE60', marginBottom: 10 },
  pBtn: { backgroundColor: '#3498DB', padding: 8, borderRadius: 10, alignItems: 'center' },
  pBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});