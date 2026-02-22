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
const SUPABASE_URL = 'gunakan url masing-masing'; 
const SUPABASE_ANON_KEY = 'gunakan key masing-masing';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [role, setRole] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);

  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman', 'Kesehatan'];

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (e) { console.log("Error Fetch:", e.message); }
    finally { setLoading(false); }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, 'plus');
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    Alert.alert("Berhasil", "Produk ditambah ke keranjang.");
  };

  const updateQuantity = (id, type) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        let newQty = type === 'plus' ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!buyerName.trim() || !buyerPhone.trim()) {
      Alert.alert("Data Kosong", "Isi Nama dan Nomor WA Anda.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('orders').insert([
        { customer_name: buyerName, phone_number: buyerPhone, items: cart, total_price: calculateTotal() }
      ]);
      if (error) throw error;
      Alert.alert("Sukses", "Pesanan tersimpan di database!");
      setCart([]); setBuyerName(''); setBuyerPhone(''); setCartVisible(false);
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setRole(null); setIsLoggedIn(false); setEmail(''); setPassword('');
  };

  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- UI: MODAL KERANJANG & DETAIL ---
  const CartModal = () => (
    <Modal animationType="slide" transparent={true} visible={cartVisible} onRequestClose={() => setCartVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: height * 0.85 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Checkout 🛒</Text>
            <TouchableOpacity onPress={() => setCartVisible(false)}><MaterialCommunityIcons name="close" size={28} /></TouchableOpacity>
          </View>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
              <View style={styles.formSection}>
                <Text style={styles.label}>Identitas Pemesan</Text>
                <TextInput style={styles.input} placeholder="Nama Lengkap" value={buyerName} onChangeText={setBuyerName} />
                <TextInput style={styles.input} placeholder="Nomor WA" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad" />
                <Text style={styles.label}>Daftar Belanja</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{fontWeight: 'bold'}}>{item.name}</Text>
                  <Text style={{color: '#27AE60'}}>Rp {item.price.toLocaleString()}</Text>
                </View>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, 'minus')} style={styles.qtyBtn}><MaterialCommunityIcons name="minus" size={18} color="#FFF" /></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, 'plus')} style={styles.qtyBtn}><MaterialCommunityIcons name="plus" size={18} color="#FFF" /></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{marginLeft: 10}}><MaterialCommunityIcons name="delete" size={24} color="#E74C3C" /></TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <View>
                <View style={styles.totalRow}>
                  <Text style={{fontSize: 18}}>Total:</Text>
                  <Text style={styles.totalVal}>Rp {calculateTotal().toLocaleString('id-ID')}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}><Text style={styles.btnTxt}>Simpan Pesanan</Text></TouchableOpacity>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const ProductDetailModal = () => (
    <Modal animationType="fade" transparent={true} visible={detailVisible} onRequestClose={() => setDetailVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentDetail}>
          <TouchableOpacity style={{alignSelf: 'flex-end'}} onPress={() => setDetailVisible(false)}><MaterialCommunityIcons name="close" size={28} /></TouchableOpacity>
          {selectedProduct && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedProduct.image_url }} style={styles.detailImg} />
              <View style={styles.detailInfoContainer}>
                <Text style={styles.detailName}>{selectedProduct.name}</Text>
                <Text style={styles.detailPrice}>Rp {selectedProduct.price.toLocaleString()}</Text>
                <View style={styles.divider} />
                <Text style={styles.descriptionTitle}>Deskripsi Produk</Text>
                <Text style={styles.detailDescription}>
                  {selectedProduct.description || "Produk berkualitas tinggi mitra UMKM HUB."}
                </Text>
              </View>
              <TouchableOpacity style={styles.btn} onPress={() => { addToCart(selectedProduct); setDetailVisible(false); }}>
                <Text style={styles.btnTxt}>Tambah ke Keranjang</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // --- LOGIKA HALAMAN (URUTAN DIPERBAIKI) ---

  // 1. LANDING PAGE
  if (!role) {
    return (
      <View style={styles.center}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/609/609803.png' }} style={{width: 80, height: 80, marginBottom: 20}} />
        <Text style={styles.title}>UMKM HUB</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setRole('customer')}><Text style={styles.btnTxt}>Pelanggan</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, {backgroundColor: '#34495E'}]} onPress={() => setRole('owner')}><Text style={styles.btnTxt}>Pemilik Usaha</Text></TouchableOpacity>
      </View>
    );
  }

  // 2. DASHBOARD OWNER (Harus di atas katalog pelanggan)
  if (role === 'owner' && isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navBar}>
          <Text style={styles.brand}>Owner Dashboard</Text>
          <TouchableOpacity onPress={handleLogout}><MaterialCommunityIcons name="logout" size={28} color="#E74C3C" /></TouchableOpacity>
        </View>
        <ScrollView style={{padding: 20}}>
           <View style={styles.statCard}><Text style={{fontSize: 32, fontWeight: 'bold'}}>{products.length}</Text><Text>Produk Aktif</Text></View>
           <Text style={{textAlign: 'center', marginTop: 40, color: '#95A5A6'}}>Selamat datang di Panel Kontrol Pemilik!</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. LOGIN OWNER
  if (role === 'owner' && !isLoggedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Login Owner</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={() => {
            if(email === 'admin@umkm.com' && password === '123456') setIsLoggedIn(true);
            else Alert.alert("Error", "Akun Salah");
        }}><Text style={styles.btnTxt}>Masuk</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setRole(null)} style={{marginTop: 20}}><Text style={{color: '#3498DB'}}>Kembali</Text></TouchableOpacity>
      </View>
    );
  }

  // 4. CUSTOMER HOME
  return (
    <SafeAreaView style={styles.container}>
      <CartModal />
      <ProductDetailModal />
      <View style={styles.navBar}>
        <Text style={styles.brand}>UMKM HUB ✨</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => setCartVisible(true)} style={{marginRight: 15}}>
            <MaterialCommunityIcons name="cart" size={28} color="#3498DB" />
            {cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{cart.length}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRole(null)}><MaterialCommunityIcons name="logout" size={28} color="#E74C3C" /></TouchableOpacity>
        </View>
      </View>

      <View style={{height: 50, marginBottom: 10}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}>
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setSelectedProduct(item); setDetailVisible(true); }}>
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
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#F0F7FF' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: '#DDD' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  btn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, width: '100%', alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  brand: { fontSize: 22, fontWeight: 'bold' },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8F9FA', marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ECF0F1', height: 40, justifyContent: 'center' },
  catChipActive: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  catChipText: { color: '#7F8C8D' },
  catChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', width: '45%', margin: '2.5%', borderRadius: 15, padding: 10, elevation: 5 },
  cardImg: { width: '100%', height: 110, borderRadius: 12 },
  cardName: { fontWeight: 'bold', marginTop: 10 },
  cardPrice: { color: '#27AE60', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalContentDetail: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: height * 0.9 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 8, padding: 5 },
  qtyBtn: { backgroundColor: '#3498DB', padding: 5, borderRadius: 5 },
  qtyText: { marginHorizontal: 12, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#EEE' },
  totalVal: { fontSize: 22, fontWeight: 'bold', color: '#27AE60' },
  checkoutBtn: { backgroundColor: '#27AE60', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  detailImg: { width: '100%', height: 300, borderRadius: 20, marginBottom: 15 },
  detailInfoContainer: { paddingHorizontal: 5 },
  detailName: { fontSize: 24, fontWeight: 'bold' },
  detailPrice: { fontSize: 22, color: '#27AE60', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  descriptionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  detailDescription: { fontSize: 14, color: '#7F8C8D', lineHeight: 20, marginBottom: 25 },
  statCard: { backgroundColor: '#E1F0FF', padding: 25, borderRadius: 20, alignItems: 'center' },
  badge: { position: 'absolute', right: -5, top: -5, backgroundColor: '#E74C3C', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeTxt: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});