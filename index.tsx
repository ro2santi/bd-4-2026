import React, { useState, useEffect } from 'react';
import { 
  Text, View, StyleSheet, TouchableOpacity, FlatList, 
  Image, ActivityIndicator, SafeAreaView, ScrollView, 
  StatusBar, Dimensions, Alert, TextInput, Modal
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// --- 1. KONFIGURASI DATABASE ---
const SUPABASE_URL = 'url masing-masing'; 
const SUPABASE_ANON_KEY = 'key masing-masing';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function HomeScreen() {
  const [role, setRole] = useState<null | 'customer' | 'owner'>(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modul 04 (Search & Login)
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State Modul 04 (Detail Produk)
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman', 'Kesehatan'];

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) { console.log("Error:", e.message); }
    finally { setLoading(false); }
  };

  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogin = () => {
    if (email.trim() === 'admin@umkm.com' && password === '123456') {
      setIsLoggedIn(true);
    } else {
      Alert.alert("Akses Ditolak", "Email atau Password salah!");
    }
  };

  const handleLogout = () => {
    setRole(null);
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  // --- UI COMPONENTS ---

  const ProductDetailModal = () => (
    <Modal animationType="slide" transparent={true} visible={detailVisible} onRequestClose={() => setDetailVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailVisible(false)}>
            <MaterialCommunityIcons name="close" size={28} color="#2C3E50" />
          </TouchableOpacity>
          {selectedProduct && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedProduct.image_url }} style={styles.detailImg} />
              <View style={styles.detailInfo}>
                <View style={styles.detailBadge}><Text style={styles.detailBadgeText}>{selectedProduct.category}</Text></View>
                <Text style={styles.detailName}>{selectedProduct.name}</Text>
                <Text style={styles.detailPrice}>Rp {selectedProduct.price.toLocaleString('id-ID')}</Text>
                <Text style={styles.detailDesc}>Produk unggulan mitra UMKM Hub dengan kualitas terjamin.</Text>
                <TouchableOpacity style={styles.mainBtn} onPress={() => Alert.alert("Pesanan", "Menghubungkan ke Penjual...")}>
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.mainBtnText}>Beli Sekarang</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (role === 'owner' && isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <Text style={styles.brandText}>Owner Dashboard</Text>
          <TouchableOpacity onPress={handleLogout}><Text style={{color: '#E74C3C', fontWeight: 'bold'}}>Keluar</Text></TouchableOpacity>
        </View>
        <ScrollView style={{padding: 20}}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statNum}>{products.length}</Text><Text style={styles.statLabel}>Produk</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>24</Text><Text style={styles.statLabel}>Pesanan</Text></View>
          </View>
          <View style={styles.dummyChart}><Text style={{color: '#95A5A6'}}>Statistik Penjualan (Modul 08)</Text></View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (role === 'owner' && !isLoggedIn) {
    return (
      <View style={styles.landingContainer}>
        <Text style={styles.landingTitle}>Login Pemilik</Text>
        <View style={styles.inputGroup}>
          <TextInput style={styles.formInput} placeholder="Email (admin@umkm.com)" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.formInput} placeholder="Password (123456)" value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.mainBtn} onPress={handleLogin}><Text style={styles.mainBtnText}>Masuk Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => setRole(null)}><Text style={styles.backLinkText}>Kembali</Text></TouchableOpacity>
      </View>
    );
  }

  if (!role) {
    return (
      <View style={styles.landingContainer}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/609/609803.png' }} style={styles.landingLogo} />
        <Text style={styles.landingTitle}>UMKM HUB</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.mainBtn} onPress={() => setRole('customer')}><Text style={styles.mainBtnText}>Pelanggan</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#fff', borderWidth: 2, borderColor: '#3498DB', marginTop: 10}]} onPress={() => setRole('owner')}><Text style={{color: '#3498DB', fontWeight: 'bold'}}>Pemilik Usaha</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ProductDetailModal />
      <View style={styles.navBar}>
        <Text style={styles.brandText}>UMKM HUB ✨</Text>
        <TouchableOpacity onPress={() => setRole(null)}><MaterialCommunityIcons name="logout" size={24} color="#E74C3C" /></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#95A5A6" />
        <TextInput style={styles.searchInput} placeholder="Cari produk..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={{height: 50}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}>
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? <ActivityIndicator size="large" color="#3498DB" style={{flex: 1}} /> : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.pCard} onPress={() => { setSelectedProduct(item); setDetailVisible(true); }}>
              <Image source={{ uri: item.image_url }} style={styles.pImg} />
              <View style={styles.pContent}>
                <Text style={styles.pName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.pPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  landingContainer: { flex: 1, backgroundColor: '#F0F7FF', alignItems: 'center', justifyContent: 'center', padding: 30 },
  landingLogo: { width: 100, height: 100, marginBottom: 20 },
  landingTitle: { fontSize: 32, fontWeight: '900', color: '#2C3E50', marginBottom: 40 },
  buttonGroup: { width: '100%' },
  mainBtn: { backgroundColor: '#3498DB', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { marginTop: 20 },
  backLinkText: { color: '#7F8C8D' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', paddingTop: 40 },
  brandText: { fontSize: 22, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#F0F3F4', margin: 20, padding: 12, borderRadius: 12, alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 10 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8F9FA', marginRight: 10, borderRadius: 20, height: 40, justifyContent: 'center' },
  catChipActive: { backgroundColor: '#3498DB' },
  catChipText: { color: '#7F8C8D' },
  catChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  inputGroup: { width: '100%', marginBottom: 20 },
  formInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#D5DBDB' },
  listPadding: { padding: 15 },
  columnWrapper: { justifyContent: 'space-between' },
  pCard: { backgroundColor: '#FFF', width: '48%', marginBottom: 15, borderRadius: 15, elevation: 3, overflow: 'hidden' },
  pImg: { width: '100%', height: 120 },
  pContent: { padding: 10 },
  pName: { fontWeight: 'bold' },
  pPrice: { color: '#27AE60', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', height: height * 0.75, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  closeBtn: { alignSelf: 'flex-end' },
  detailImg: { width: '100%', height: 250, borderRadius: 20 },
  detailInfo: { paddingVertical: 15 },
  detailBadge: { backgroundColor: '#EBF5FB', padding: 5, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 10 },
  detailBadgeText: { color: '#3498DB', fontWeight: 'bold', fontSize: 10 },
  detailName: { fontSize: 26, fontWeight: 'bold' },
  detailPrice: { fontSize: 22, color: '#27AE60', fontWeight: 'bold', marginVertical: 10 },
  detailDesc: { color: '#7F8C8D', lineHeight: 22, marginBottom: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { backgroundColor: '#F0F7FF', width: '48%', padding: 20, borderRadius: 20, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#7F8C8D', fontSize: 12 },
  dummyChart: { height: 180, backgroundColor: '#F8F9FA', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});
