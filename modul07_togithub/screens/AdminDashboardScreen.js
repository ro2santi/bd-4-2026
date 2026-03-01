import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, Linking, TextInput, Modal, ScrollView, Image, ActivityIndicator 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Modal Produk (Tambah/Edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: prod } = await supabase.from('products').select('*').order('id', { ascending: false });
    const { data: ord } = await supabase.from('orders').select('*').order('id', { ascending: false });
    setProducts(prod || []);
    setOrders(ord || []);
    setLoading(false);
  };

  // --- LOGIKA PRODUK (KATALOG) ---
  const handleSaveProduct = async () => {
    if (!editingProduct.name || !editingProduct.price || !editingProduct.category) {
      return Alert.alert("Lengkapi Data", "Nama, Harga, dan Kategori wajib diisi");
    }
    
    const payload = {
      name: editingProduct.name,
      price: parseInt(editingProduct.price),
      category: editingProduct.category,
      image_url: editingProduct.image_url || 'https://via.placeholder.com/150',
    };

    if (isAdding) {
      await supabase.from('products').insert([{ ...payload, is_active: true }]);
    } else {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    }
    setModalVisible(false);
    fetchData();
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const deleteProduct = (id) => {
    Alert.alert("Konfirmasi", "Hapus produk ini secara permanen?", [
      { text: "Batal" },
      { text: "Hapus", onPress: async () => { await supabase.from('products').delete().eq('id', id); fetchData(); }}
    ]);
  };

  // --- LOGIKA PESANAN ---
  const updateOrderStatus = async (id) => {
    await supabase.from('orders').update({ status: 'Selesai' }).eq('id', id);
    fetchData();
  };

  const deleteOrder = (id) => {
    Alert.alert("Hapus Riwayat", "Hapus data pesanan ini?", [
      { text: "Batal" },
      { text: "Hapus", onPress: async () => { await supabase.from('orders').delete().eq('id', id); fetchData(); }}
    ]);
  };

  // --- TAMPILAN PER TAB ---
  
  // 1. TAB HOME (Statistik)
  const renderHome = () => (
    <ScrollView style={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Ringkasan Bisnis</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statsValue}>{products.filter(p => p.is_active).length}</Text>
          <Text style={styles.statsLabel}>Produk Aktif</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.statsValue}>{products.filter(p => !p.is_active).length}</Text>
          <Text style={styles.statsLabel}>Non-Aktif</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.statsValue}>{orders.filter(o => o.status !== 'Selesai').length}</Text>
          <Text style={styles.statsLabel}>Pesanan Baru</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statsValue}>{orders.filter(o => o.status === 'Selesai').length}</Text>
          <Text style={styles.statsLabel}>Selesai</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
        <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
        <Text style={{color:'#FFF', fontWeight:'bold', marginLeft:10}}>Perbarui Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* HEADER TAB NAVIGATION */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('home')} style={[styles.tab, activeTab === 'home' && styles.tabActive]}>
          <MaterialCommunityIcons name="home" size={24} color={activeTab === 'home' ? '#3498DB' : '#7F8C8D'} />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('products')} style={[styles.tab, activeTab === 'products' && styles.tabActive]}>
          <MaterialCommunityIcons name="package-variant-closed" size={24} color={activeTab === 'products' ? '#3498DB' : '#7F8C8D'} />
          <Text style={[styles.tabLabel, activeTab === 'products' && styles.tabLabelActive]}>Katalog</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('orders')} style={[styles.tab, activeTab === 'orders' && styles.tabActive]}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={activeTab === 'orders' ? '#3498DB' : '#7F8C8D'} />
          <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>Pesanan</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#3498DB" style={{marginTop: 20}} />}

      {activeTab === 'home' ? renderHome() : (
        <FlatList 
          data={activeTab === 'products' ? products : orders}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={() => activeTab === 'products' && (
            <TouchableOpacity style={styles.btnAdd} onPress={() => { setEditingProduct({}); setIsAdding(true); setModalVisible(true); }}>
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={{color:'#FFF', fontWeight:'bold', marginLeft: 10}}>Tambah Produk Baru</Text>
            </TouchableOpacity>
          )}
          renderItem={({ item }) => (
            activeTab === 'products' ? (
              // TAMPILAN ITEM KATALOG (PRODUK)
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nameText, !item.is_active && {color: '#AAA'}]}>{item.name} {!item.is_active && '(Off)'}</Text>
                  <Text style={styles.categoryBadge}>{item.category || 'Tanpa Kategori'}</Text>
                  <Text style={styles.priceText}>Rp {item.price?.toLocaleString()}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => toggleStatus(item.id, item.is_active)}><MaterialCommunityIcons name={item.is_active ? "eye" : "eye-off"} size={26} color={item.is_active ? "green" : "gray"} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingProduct(item); setIsAdding(false); setModalVisible(true); }}><MaterialCommunityIcons name="pencil" size={26} color="blue" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteProduct(item.id)}><MaterialCommunityIcons name="trash-can" size={26} color="red" /></TouchableOpacity>
                </View>
              </View>
            ) : (
              // TAMPILAN ITEM PESANAN
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.custName}>{item.customer_name}</Text>
                  <TouchableOpacity onPress={() => deleteOrder(item.id)}><MaterialCommunityIcons name="close-box" size={26} color="red" /></TouchableOpacity>
                </View>
                <Text style={styles.orderTotal}>Total: Rp {item.total_price?.toLocaleString()}</Text>
                <Text style={[styles.orderStatus, {color: item.status === 'Selesai' ? '#27AE60' : '#E67E22'}]}>
                  Status: {item.status || 'Baru'}
                </Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnWA} onPress={() => Linking.openURL(`whatsapp://send?phone=${item.phone_number}`)}>
                    <MaterialCommunityIcons name="whatsapp" size={18} color="#FFF" />
                    <Text style={{color:'#FFF', fontWeight:'bold', marginLeft:5}}>Chat WA</Text>
                  </TouchableOpacity>
                  {item.status !== 'Selesai' && (
                    <TouchableOpacity style={styles.btnDone} onPress={() => updateOrderStatus(item.id)}>
                      <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                      <Text style={{color:'#FFF', fontWeight:'bold', marginLeft:5}}>Selesaikan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          )}
        />
      )}

      {/* MODAL TAMBAH & EDIT (LENGKAP DENGAN KATEGORI) */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isAdding ? 'Tambah' : 'Edit'} Produk</Text>
            <ScrollView>
              <Text style={styles.inputLabel}>Nama Produk</Text>
              <TextInput style={styles.input} placeholder="Nama Produk" value={editingProduct.name} onChangeText={t => setEditingProduct({...editingProduct, name:t})} />
              
              <Text style={styles.inputLabel}>Harga</Text>
              <TextInput style={styles.input} placeholder="Harga (Contoh: 15000)" value={editingProduct.price?.toString()} onChangeText={t => setEditingProduct({...editingProduct, price:t})} keyboardType="numeric" />
              
              <Text style={styles.inputLabel}>Kategori</Text>
              <TextInput style={styles.input} placeholder="Contoh: Makanan, Minuman, Pakaian" value={editingProduct.category} onChangeText={t => setEditingProduct({...editingProduct, category:t})} />
              
              <Text style={styles.inputLabel}>URL Gambar</Text>
              <TextInput style={styles.input} placeholder="https://image-link.com" value={editingProduct.image_url} onChangeText={t => setEditingProduct({...editingProduct, image_url:t})} />
              
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveProduct}>
                <Text style={{color:'#FFF', fontWeight:'bold', fontSize:16}}>Simpan Produk</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:20}}>
                <Text style={{color:'red', textAlign:'center', fontWeight:'bold'}}>Batal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 4, borderBottomWidth: 1, borderColor: '#DDD' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 4, borderColor: '#3498DB' },
  tabLabel: { fontSize: 11, color: '#7F8C8D', marginTop: 4 },
  tabLabelActive: { color: '#3498DB', fontWeight: 'bold' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#2C3E50' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statsCard: { flex: 0.48, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50' },
  statsLabel: { fontSize: 13, color: '#546E7A', marginTop: 5 },
  refreshBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnAdd: { backgroundColor: '#3498DB', margin: 15, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  card: { flexDirection: 'row', padding: 18, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  nameText: { fontWeight: 'bold', fontSize: 17 },
  categoryBadge: { fontSize: 12, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 3 },
  priceText: { color: '#27AE60', fontWeight: 'bold', fontSize: 15 },
  actionRow: { flexDirection: 'row', width: 110, justifyContent: 'space-between' },
  orderCard: { backgroundColor: '#FFF', margin: 12, padding: 18, borderRadius: 15, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  custName: { fontWeight: 'bold', fontSize: 18, color: '#2C3E50' },
  orderTotal: { fontSize: 16, marginVertical: 6, color: '#34495E' },
  orderStatus: { fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btnWA: { backgroundColor: '#25D366', padding: 12, borderRadius: 10, flex: 0.48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnDone: { backgroundColor: '#3498DB', padding: 12, borderRadius: 10, flex: 0.48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '88%', padding: 25, borderRadius: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontWeight: 'bold', marginBottom: 5, color: '#34495E' },
  input: { backgroundColor: '#F9F9F9', padding: 14, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  btnSave: { backgroundColor: '#3498DB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }
});