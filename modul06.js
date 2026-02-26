import React, { useState, useEffect } from 'react';
import { 
  Text, View, StyleSheet, TouchableOpacity, FlatList, 
  Image, ActivityIndicator, SafeAreaView, ScrollView, 
  StatusBar, Dimensions, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, Linking 
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); 
  
  // State Owner
  const [editProdVisible, setEditProdVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  // State Pelanggan
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);

  // State Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const categories = ['Semua', 'Camilan', 'Pakaian', 'Sambal', 'Aksesoris', 'Minuman', 'Kesehatan'];
  const OWNER_WHATSAPP = '6281220042270'; // Nomor Owner Updated

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (role === 'owner' && isLoggedIn) fetchOrders(); }, [role, isLoggedIn, activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); }
  };

  // --- LOGIKA OWNER ---
  const handleSaveProduct = async () => {
    if (!editingProduct.name || !editingProduct.price) return Alert.alert("Lengkapi Data");
    setLoading(true);
    try {
      if (isAdding) {
        const payload = {
          name: editingProduct.name,
          price: parseInt(editingProduct.price),
          image_url: editingProduct.image_url || 'https://via.placeholder.com/150',
          category: editingProduct.category || 'Semua',
          is_active: true
        };
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').update({ 
          name: editingProduct.name, 
          price: parseInt(editingProduct.price),
          image_url: editingProduct.image_url,
          category: editingProduct.category
        }).eq('id', editingProduct.id);
        if (error) throw error;
      }
      setEditProdVisible(false);
      fetchProducts();
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  };

  const toggleProductStatus = async (id, currentStatus) => {
    await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    fetchProducts();
  };

  const deleteProduct = (id) => {
    Alert.alert("Hapus Produk", "Yakin ingin menghapus produk ini?", [
      { text: "Batal" },
      { text: "Hapus", onPress: async () => { await supabase.from('products').delete().eq('id', id); fetchProducts(); }}
    ]);
  };

  const deleteOrder = (id) => {
    Alert.alert("Konfirmasi Hapus", "Yakin ingin menghapus pesanan ini dari riwayat?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { 
          await supabase.from('orders').delete().eq('id', id); 
          fetchOrders(); 
      }}
    ]);
  };

  // --- LOGIKA WHATSAPP PELANGGAN (+62) ---
  const chatCustomer = (phone) => {
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '62' + phone.slice(1);
    } else if (phone.startsWith('+')) {
      formattedPhone = phone.replace('+', '');
    }
    Linking.openURL(`whatsapp://send?phone=${formattedPhone}`).catch(() => Alert.alert("Gagal buka WA"));
  };

  // --- LOGIKA KERANJANG ---
  const addToCart = (product) => {
    const exist = cart.find(item => item.id === product.id);
    if (exist) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    Alert.alert("Sukses", "Masuk keranjang!");
  };

  const handleCheckout = async () => {
    if (!buyerName || !buyerPhone) return Alert.alert("Data Kosong");
    setLoading(true);
    try {
      const total = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
      const { error } = await supabase.from('orders').insert([{ customer_name: buyerName, phone_number: buyerPhone, items: cart, total_price: total, status: 'Baru' }]);
      if (error) throw error;
      
      let msg = `Halo Owner, saya ${buyerName}. Pesanan:\n` + cart.map(i => `- ${i.name} (${i.quantity}x)`).join('\n');
      Linking.openURL(`whatsapp://send?phone=${OWNER_WHATSAPP}&text=${encodeURIComponent(msg)}`);
      
      setCart([]); setBuyerName(''); setBuyerPhone(''); setCartVisible(false); setRole(null);
    } catch (e) { Alert.alert("Error", e.message); }
    finally { setLoading(false); }
  };

  // --- RENDER VIEWS ---
  if (!role) {
    return (
      <View style={styles.center}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/609/609803.png' }} style={{width:80, height:80, marginBottom:20}} />
        <Text style={styles.title}>UMKM HUB</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setRole('customer')}><Text style={styles.btnText}>Pelanggan</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, {backgroundColor:'#34495E'}]} onPress={() => setRole('owner')}><Text style={styles.btnText}>Pemilik Usaha</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* MODAL DETAIL PRODUK */}
      <Modal visible={detailVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={[styles.modalContent, {height:height*0.75}]}>
          <TouchableOpacity onPress={()=>setDetailVisible(false)} style={{alignSelf:'flex-end'}}><MaterialCommunityIcons name="close" size={28}/></TouchableOpacity>
          {selectedProduct && (<ScrollView><Image source={{uri: selectedProduct.image_url}} style={styles.detailImg}/><Text style={styles.detailName}>{selectedProduct.name}</Text><Text style={styles.detailPrice}>Rp {selectedProduct.price.toLocaleString()}</Text><Text style={styles.detailDesc}>{selectedProduct.description || "Produk berkualitas."}</Text>
          <TouchableOpacity style={styles.btn} onPress={()=>{addToCart(selectedProduct); setDetailVisible(false);}}><Text style={styles.btnText}>Tambah ke Keranjang</Text></TouchableOpacity></ScrollView>)}
        </View></View>
      </Modal>

      {/* MODAL EDIT/TAMBAH OWNER */}
      <Modal visible={editProdVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{isAdding ? 'Tambah Produk' : 'Edit Produk'}</Text>
          <TextInput style={styles.input} placeholder="Nama Produk" value={editingProduct?.name} onChangeText={t=>setEditingProduct({...editingProduct, name:t})}/>
          <TextInput style={styles.input} placeholder="Harga" value={editingProduct?.price?.toString()} onChangeText={t=>setEditingProduct({...editingProduct, price:t})} keyboardType="numeric"/>
          <TextInput style={styles.input} placeholder="Link Gambar (URL)" value={editingProduct?.image_url} onChangeText={t=>setEditingProduct({...editingProduct, image_url:t})}/>
          <TextInput style={styles.input} placeholder="Kategori" value={editingProduct?.category} onChangeText={t=>setEditingProduct({...editingProduct, category:t})}/>
          <TouchableOpacity style={styles.btn} onPress={handleSaveProduct}><Text style={styles.btnText}>Simpan Data</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setEditProdVisible(false)} style={{marginTop:15}}><Text style={{textAlign:'center', color:'red'}}>Batal</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* MODAL KERANJANG */}
      <Modal visible={cartVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, {height: height*0.85}]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Keranjang 🛒</Text><TouchableOpacity onPress={()=>setCartVisible(false)}><MaterialCommunityIcons name="close" size={28}/></TouchableOpacity></View>
            <FlatList data={cart} keyExtractor={(i)=>i.id.toString()} renderItem={({item})=>(
              <View style={styles.cartItem}>
                <View style={{flex:1}}><Text style={{fontWeight:'bold'}}>{item.name}</Text><Text>Rp {item.price.toLocaleString()}</Text></View>
                <View style={styles.qtyBox}>
                  <TouchableOpacity onPress={()=>setCart(cart.map(c=>c.id===item.id?{...c, quantity:Math.max(1,c.quantity-1)}:c))} style={styles.qtyBtn}><MaterialCommunityIcons name="minus" color="#FFF" size={16}/></TouchableOpacity>
                  <Text style={{marginHorizontal:10}}>{item.quantity}</Text>
                  <TouchableOpacity onPress={()=>setCart(cart.map(c=>c.id===item.id?{...c, quantity:c.quantity+1}:c))} style={styles.qtyBtn}><MaterialCommunityIcons name="plus" color="#FFF" size={16}/></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={()=>setCart(cart.filter(c=>c.id!==item.id))} style={{marginLeft:10}}><MaterialCommunityIcons name="delete" color="red" size={26}/></TouchableOpacity>
              </View>
            )} ListHeaderComponent={<View style={styles.formSection}><TextInput style={styles.input} placeholder="Nama Anda" value={buyerName} onChangeText={setBuyerName}/><TextInput style={styles.input} placeholder="Nomor WA" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad"/></View>}
            ListFooterComponent={<View style={{marginTop:20}}><View style={styles.totalRow}><Text style={{fontSize:18, fontWeight:'bold'}}>Total Belanja:</Text><Text style={styles.totalVal}>Rp {cart.reduce((a,b)=>a+(b.price*b.quantity),0).toLocaleString()}</Text></View><TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}><Text style={styles.btnText}>Checkout & Kirim WA</Text></TouchableOpacity></View>} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.navBar}>
        <Text style={styles.brand}>{role==='owner'?'Admin Dashboard':'UMKM HUB ✨'}</Text>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          {role==='customer' && <TouchableOpacity onPress={()=>setCartVisible(true)} style={{marginRight:15}}><MaterialCommunityIcons name="cart" size={28} color="#3498DB" />{cart.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{cart.length}</Text></View>}</TouchableOpacity>}
          <TouchableOpacity onPress={()=>{setRole(null); setIsLoggedIn(false)}}><MaterialCommunityIcons name="logout" size={28} color="red"/></TouchableOpacity>
        </View>
      </View>

      {role === 'owner' && isLoggedIn ? (
        <View style={{flex:1}}>
          <View style={styles.tabBar}>
            <TouchableOpacity onPress={()=>setActiveTab('products')} style={[styles.tab, activeTab==='products' && styles.tabActive]}><Text style={activeTab==='products' && {fontWeight:'bold', color:'#3498DB'}}>Katalog</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setActiveTab('orders')} style={[styles.tab, activeTab==='orders' && styles.tabActive]}><Text style={activeTab==='orders' && {fontWeight:'bold', color:'#3498DB'}}>Pesanan</Text></TouchableOpacity>
          </View>
          {activeTab === 'products' && (
            <TouchableOpacity style={styles.btnAddProd} onPress={()=>{setEditingProduct({}); setIsAdding(true); setEditProdVisible(true)}}>
              <MaterialCommunityIcons name="plus-box" size={20} color="#FFF"/><Text style={{color:'#FFF', fontWeight:'bold', marginLeft:5}}>Tambah Produk</Text>
            </TouchableOpacity>
          )}
          <FlatList data={activeTab==='products' ? products : orders} keyExtractor={i=>i.id.toString()} renderItem={activeTab==='products' ? ({item})=>(
            <View style={styles.adminCard}>
              <Text style={{flex:1, fontWeight:'bold', color: item.is_active ? '#000' : '#AAA'}}>{item.name} {!item.is_active && '(Mati)'}</Text>
              <TouchableOpacity onPress={()=>toggleProductStatus(item.id, item.is_active)} style={{marginRight:15}}><MaterialCommunityIcons name={item.is_active ? "eye" : "eye-off"} size={26} color={item.is_active ? "green" : "gray"}/></TouchableOpacity>
              <TouchableOpacity onPress={()=>{setEditingProduct(item); setIsAdding(false); setEditProdVisible(true)}} style={{marginRight:15}}><MaterialCommunityIcons name="pencil" size={26} color="blue"/></TouchableOpacity>
              <TouchableOpacity onPress={()=>deleteProduct(item.id)}><MaterialCommunityIcons name="trash-can" size={26} color="red"/></TouchableOpacity>
            </View>
          ) : ({item})=>(
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <MaterialCommunityIcons name={item.status === 'Selesai' ? "check-circle" : "plus-circle"} size={22} color={item.status === 'Selesai' ? "#27AE60" : "#3498DB"} />
                  <Text style={{fontWeight:'bold', fontSize:16, marginLeft:8}}>{item.customer_name}</Text>
                </View>
                <TouchableOpacity onPress={()=>deleteOrder(item.id)}><MaterialCommunityIcons name="delete-circle" color="red" size={28}/></TouchableOpacity>
              </View>
              <Text style={{color: item.status === 'Selesai' ? 'green' : '#3498DB', fontWeight:'bold'}}>{item.status || 'Baru'}</Text>
              <Text>Rp {item.total_price.toLocaleString()}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={()=>chatCustomer(item.phone_number)} style={styles.btnWA}><Text style={{color:'#FFF', fontWeight:'bold'}}>Chat WA</Text></TouchableOpacity>
                <TouchableOpacity onPress={async()=>{await supabase.from('orders').update({status:'Selesai'}).eq('id',item.id); fetchOrders();}} style={styles.btnDone}><Text style={{color:'#FFF', fontWeight:'bold'}}>Selesaikan</Text></TouchableOpacity>
              </View>
            </View>
          )} />
        </View>
      ) : role === 'owner' ? (
        <View style={styles.center}><Text style={styles.title}>Login Owner</Text><TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail}/><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/><TouchableOpacity style={styles.btn} onPress={()=>{if(email==='admin@umkm.com'&&password==='123456')setIsLoggedIn(true); else Alert.alert("Gagal");}}><Text style={styles.btnText}>Masuk</Text></TouchableOpacity></View>
      ) : (
        <View style={{flex:1}}>
           <View style={{height: 50}}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20}}>{categories.map(c=>(<TouchableOpacity key={c} onPress={()=>setSelectedCategory(c)} style={[styles.catChip, selectedCategory===c && styles.catChipActive]}><Text style={{color:selectedCategory===c?'#FFF':'#7F8C8D'}}>{c}</Text></TouchableOpacity>))}</ScrollView></View>
           <FlatList data={products.filter(p => p.is_active === true && (selectedCategory === 'Semua' || p.category === selectedCategory))} numColumns={2} renderItem={({item})=>(
            <TouchableOpacity style={styles.card} onPress={()=>{setSelectedProduct(item); setDetailVisible(true)}}>
              <Image source={{uri: item.image_url}} style={styles.cardImg}/><Text style={styles.cardName}>{item.name}</Text><Text style={{color:'#27AE60', fontWeight:'bold'}}>Rp {item.price.toLocaleString()}</Text>
            </TouchableOpacity>
           )}/>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, marginBottom: 12, width:'100%', borderWidth:1, borderColor:'#EEE' },
  btn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, width:'100%', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems:'center', borderBottomWidth:1, borderColor:'#EEE' },
  brand: { fontSize: 20, fontWeight: 'bold' },
  card: { width: '45%', margin: '2.5%', padding: 10, backgroundColor: '#FFF', elevation: 5, borderRadius: 15 },
  cardImg: { width: '100%', height: 110, borderRadius: 12 },
  cardName: { fontWeight: 'bold', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 30, width: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#EEE' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor:'#F0F0F0', borderRadius: 8, padding:5 },
  qtyBtn: { backgroundColor: '#3498DB', padding: 5, borderRadius: 5 },
  checkoutBtn: { backgroundColor: '#27AE60', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  badge: { position: 'absolute', right: -5, top: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeTxt: { color: '#FFF', fontSize: 11, fontWeight:'bold' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE' },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderColor: '#3498DB' },
  adminCard: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  btnAddProd: { backgroundColor:'#3498DB', margin:15, padding:15, borderRadius:12, flexDirection:'row', justifyContent:'center', alignItems:'center' },
  orderCard: { backgroundColor: '#F9F9F9', margin: 15, padding: 15, borderRadius: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  btnWA: { backgroundColor: '#25D366', padding: 10, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  btnDone: { backgroundColor: '#3498DB', padding: 10, borderRadius: 10, flex: 0.48, alignItems: 'center' },
  detailImg: { width: '100%', height: 220, borderRadius: 20, marginBottom: 20 },
  detailName: { fontSize: 24, fontWeight: 'bold' },
  detailPrice: { fontSize: 20, color: '#27AE60', fontWeight:'bold', marginVertical: 10 },
  detailDesc: { color: '#7F8C8D', fontSize:15, lineHeight:22, marginBottom: 25 },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F8F9FA', marginRight: 10, borderRadius: 20, height: 40, justifyContent:'center' },
  catChipActive: { backgroundColor: '#3498DB' },
  totalRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  totalVal: { fontSize: 20, color:'#27AE60', fontWeight:'bold' },
  divider: { height:1, backgroundColor:'#EEE', marginVertical:15 },
  formSection: { paddingVertical:10 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});