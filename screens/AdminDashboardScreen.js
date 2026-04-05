import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, Linking, TextInput, Modal, ScrollView, ActivityIndicator, SafeAreaView 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home'); 
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState({});
  const [custModalVisible, setCustModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({});
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prod } = await supabase.from('products').select('*').order('id', { ascending: false });
      const { data: ord } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data: cust } = await supabase.from('customers').select('*').order('name', { ascending: true });
      
      setProducts(prod || []);
      setOrders(ord || []);
      setCustomers(cust || []);
    } catch (error) {
      Alert.alert("Error", "Gagal sinkronisasi data");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA ANALITIK ---
  const getAnalytics = () => {
    const now = new Date();
    let d = 0, w = 0, m = 0, y = 0;
    const salesMap = {};

    orders.forEach(o => {
      const date = new Date(o.created_at);
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) d += (o.total_price || 0);
      if (diffDays <= 7) w += (o.total_price || 0);
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) m += (o.total_price || 0);
      if (date.getFullYear() === now.getFullYear()) y += (o.total_price || 0);

      if (o.items) {
        o.items.forEach(it => {
          salesMap[it.name] = (salesMap[it.name] || 0) + (it.quantity || 0);
        });
      }
    });
    const topProduct = Object.entries(salesMap).sort((a, b) => b[1] - a[1])[0];
    return { d, w, m, y, topProduct };
  };

  const stats = getAnalytics();

  // --- ACTIONS ---
  const handleLogout = () => {
    Alert.alert("Logout", "Keluar dari Panel Admin?", [
      { text: "Batal" },
      { text: "Keluar", onPress: () => navigation.replace('Welcome'), style: "destructive" }
    ]);
  };

  const handleSaveProduct = async () => {
    const payload = { 
      name: editingProduct.name, 
      price: parseInt(editingProduct.price), 
      category: editingProduct.category,
      image_url: editingProduct.image_url || 'https://via.placeholder.com/150',
      is_active: editingProduct.is_active ?? true 
    };
    if (isAdding) await supabase.from('products').insert([payload]);
    else await supabase.from('products').update(payload).eq('id', editingProduct.id);
    setModalVisible(false); fetchData();
  };

  const handleSaveOrder = async () => {
    const payload = {
      customer_name: editingOrder.customer_name,
      phone_number: editingOrder.phone_number,
      other_cost: parseInt(editingOrder.other_cost || 0),
      total_price: parseInt(editingOrder.total_price),
      notes: editingOrder.notes || "",
      status: editingOrder.status
    };
    await supabase.from('orders').update(payload).eq('id', editingOrder.id);
    setOrderModalVisible(false); fetchData();
  };

  const toggleProductStatus = async (id, currentStatus) => {
    await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    fetchData();
  };

  const deleteItem = async (table, id) => {
    Alert.alert("Konfirmasi", "Hapus data ini secara permanen?", [
      { text: "Batal" },
      { text: "Hapus", onPress: async () => { await supabase.from(table).delete().eq('id', id); fetchData(); }, style: "destructive" }
    ]);
  };

  const handleSaveCustomer = async () => {
    const payload = { name: editingCustomer.name, phone: editingCustomer.phone, address: editingCustomer.address };
    if (editingCustomer.id) await supabase.from('customers').update(payload).eq('id', editingCustomer.id);
    else await supabase.from('customers').insert([payload]);
    setCustModalVisible(false); fetchData();
  };

  // --- RENDER DASHBOARD (HOME) ---
  const renderHome = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.headerDashboard}>
        <Text style={styles.sectionTitle}>Ringkasan Bisnis</Text>
        <TouchableOpacity onPress={handleLogout}><MaterialCommunityIcons name="logout" size={26} color="red" /></TouchableOpacity>
      </View>

      <Text style={styles.label}>Statistik Omset</Text>
      <View style={styles.grid}>
        <View style={styles.box}><Text style={styles.boxLabel}>Hari Ini</Text><Text style={styles.boxValue}>Rp {stats.d.toLocaleString()}</Text></View>
        <View style={styles.box}><Text style={styles.boxLabel}>Minggu Ini</Text><Text style={styles.boxValue}>Rp {stats.w.toLocaleString()}</Text></View>
      </View>
      <View style={styles.grid}>
        <View style={styles.box}><Text style={styles.boxLabel}>Bulan Ini</Text><Text style={styles.boxValue}>Rp {stats.m.toLocaleString()}</Text></View>
        <View style={styles.box}><Text style={styles.boxLabel}>Tahun Ini</Text><Text style={styles.boxValue}>Rp {stats.y.toLocaleString()}</Text></View>
      </View>

      <View style={styles.bestCard}>
        <MaterialCommunityIcons name="trophy" size={30} color="#F1C40F" />
        <View style={{marginLeft: 15}}>
          <Text style={styles.boxLabel}>Produk Terlaris</Text>
          <Text style={styles.bestName}>{stats.topProduct ? `${stats.topProduct[0]} (${stats.topProduct[1]} terjual)` : "-"}</Text>
        </View>
      </View>

      <Text style={styles.label}>Data Operasional</Text>
      <View style={styles.grid}>
        <View style={[styles.box, {backgroundColor:'#E3F2FD'}]}><Text style={styles.boxValue}>{products.filter(p => p.is_active).length}</Text><Text style={styles.boxLabel}>Produk Aktif</Text></View>
        <View style={[styles.box, {backgroundColor:'#E8F5E9'}]}><Text style={styles.boxValue}>{customers.length}</Text><Text style={styles.boxLabel}>Total User</Text></View>
      </View>
      <View style={styles.grid}>
        <View style={[styles.box, {backgroundColor:'#FFF3E0'}]}><Text style={styles.boxValue}>{orders.filter(o => o.status !== 'Selesai').length}</Text><Text style={styles.boxLabel}>Pesanan Baru</Text></View>
        <View style={[styles.box, {backgroundColor:'#F3E5F5'}]}><Text style={styles.boxValue}>{orders.filter(o => o.status === 'Selesai').length}</Text><Text style={styles.boxLabel}>Selesai</Text></View>
      </View>
      
      <TouchableOpacity style={styles.btnRefresh} onPress={fetchData}>
        <MaterialCommunityIcons name="sync" size={20} color="#FFF" />
        <Text style={styles.btnTxt}>Perbarui Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabNav}>
        {['home', 'products', 'customers', 'orders'].map((t) => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tabItem, activeTab === t && styles.activeTabItem]}>
            <MaterialCommunityIcons name={t === 'home' ? 'home' : t === 'products' ? 'package-variant' : t === 'customers' ? 'account-group' : 'clipboard-list'} size={24} color={activeTab === t ? '#3498DB' : '#95A5A6'} />
            <Text style={[styles.tabTxt, activeTab === t && {color:'#3498DB'}]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#3498DB" style={{marginTop: 20}} /> : (
        <FlatList 
          data={activeTab === 'home' ? [] : (activeTab === 'products' ? products : (activeTab === 'customers' ? customers : orders))}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          ListHeaderComponent={activeTab === 'home' ? renderHome : (
            <View>
              {activeTab === 'products' && (
                <TouchableOpacity style={styles.btnAddHeader} onPress={() => { setEditingProduct({}); setIsAdding(true); setModalVisible(true); }}>
                  <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                  <Text style={styles.btnTxt}>Tambah Produk Baru</Text>
                </TouchableOpacity>
              )}
              {activeTab === 'customers' && (
                <TouchableOpacity style={[styles.btnAddHeader, {backgroundColor:'#34495E'}]} onPress={() => { setEditingCustomer({}); setCustModalVisible(true); }}>
                  <MaterialCommunityIcons name="account-plus" size={20} color="#FFF" />
                  <Text style={styles.btnTxt}>Tambah Pelanggan Baru</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          renderItem={({ item }) => {
            if (activeTab === 'products') return (
              <View style={styles.listCard}>
                <View style={{flex:1}}>
                  <Text style={[styles.listName, !item.is_active && {color:'#AAA'}]}>{item.name} {!item.is_active && '(Off)'}</Text>
                  <Text style={styles.priceTxt}>Rp {item.price?.toLocaleString()}</Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => toggleProductStatus(item.id, item.is_active)}><MaterialCommunityIcons name={item.is_active ? "eye" : "eye-off"} size={26} color={item.is_active ? "green" : "gray"} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => {setEditingProduct(item); setIsAdding(false); setModalVisible(true)}}><MaterialCommunityIcons name="pencil" size={26} color="blue" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem('products', item.id)}><MaterialCommunityIcons name="trash-can" size={26} color="red" /></TouchableOpacity>
                </View>
              </View>
            );
            if (activeTab === 'customers') return (
              <View style={styles.listCard}>
                <View style={{flex:1}}><Text style={styles.listName}>{item.name}</Text><Text style={styles.subTxt}>{item.phone}</Text></View>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => {
                    const logs = orders.filter(o => String(o.phone_number) === String(item.phone));
                    const info = logs.length > 0 ? logs.map(l => `• ${l.created_at?.split('T')[0] || 'Tgl Kosong'}: Rp ${l.total_price?.toLocaleString()}`).join('\n') : "Belum belanja.";
                    Alert.alert(`Riwayat Belanja`, info);
                  }}><MaterialCommunityIcons name="history" size={28} color="#3498DB" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingCustomer(item); setCustModalVisible(true); }}><MaterialCommunityIcons name="pencil" size={26} color="blue" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem('customers', item.id)}><MaterialCommunityIcons name="trash-can" size={26} color="red" /></TouchableOpacity>
                </View>
              </View>
            );
            if (activeTab === 'orders') return (
              <View style={styles.orderBox}>
                <View style={styles.headerCard}>
                  <Text style={styles.listName}>{item.customer_name}</Text>
                  <TouchableOpacity onPress={() => { setEditingOrder(item); setOrderModalVisible(true); }}><MaterialCommunityIcons name="pencil-box-outline" size={26} color="#3498DB" /></TouchableOpacity>
                </View>
                <View style={styles.detailList}>
                  {item.items?.map((it, i) => <Text key={i} style={styles.itTxt}>• {it.name} ({it.quantity}x)</Text>)}
                </View>
                {item.other_cost > 0 && <Text style={styles.itTxt}>+ Biaya Lain: Rp {item.other_cost.toLocaleString()}</Text>}
                {item.notes && <Text style={styles.notesTxt}>Catatan: {item.notes}</Text>}
                <Text style={styles.totalTxt}>Total: Rp {item.total_price?.toLocaleString()}</Text>
                <View style={styles.rowBtn}>
                  <TouchableOpacity style={styles.waBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=${item.phone_number}`)}><MaterialCommunityIcons name="whatsapp" size={18} color="#FFF" /><Text style={styles.btnTxt}>WA</Text></TouchableOpacity>
                  {item.status !== 'Selesai' && <TouchableOpacity style={styles.doneBtn} onPress={() => { 
                    supabase.from('orders').update({ status: 'Selesai' }).eq('id', item.id).then(() => fetchData());
                  }}><Text style={styles.btnTxt}>Selesai</Text></TouchableOpacity>}
                  <TouchableOpacity onPress={() => deleteItem('orders', item.id)}><MaterialCommunityIcons name="delete" size={24} color="red" /></TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* MODAL EDIT PRODUK (Lengkap URL Gambar) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}><View style={styles.modalBody}>
          <Text style={styles.modalTitle}>{isAdding ? 'Tambah Produk' : 'Edit Produk'}</Text>
          <TextInput style={styles.input} placeholder="Nama Produk" value={editingProduct.name} onChangeText={t => setEditingProduct({...editingProduct, name:t})} />
          <TextInput style={styles.input} placeholder="Harga" keyboardType="numeric" value={editingProduct.price?.toString()} onChangeText={t => setEditingProduct({...editingProduct, price:t})} />
          <TextInput style={styles.input} placeholder="Kategori" value={editingProduct.category} onChangeText={t => setEditingProduct({...editingProduct, category:t})} />
          <TextInput style={styles.input} placeholder="URL Gambar (https://...)" value={editingProduct.image_url} onChangeText={t => setEditingProduct({...editingProduct, image_url:t})} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}><Text style={styles.btnTxt}>SIMPAN PRODUK</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15}}><Text style={{textAlign:'center', color:'red'}}>BATAL</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* MODAL EDIT PESANAN (Biaya Lain & Catatan) */}
      <Modal visible={orderModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}><View style={styles.modalBody}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Edit Detail Pesanan</Text>
            <TextInput style={styles.input} placeholder="Nama Penerima" value={editingOrder.customer_name} onChangeText={t => setEditingOrder({...editingOrder, customer_name:t})} />
            <TextInput style={styles.input} placeholder="Nomor WA" value={editingOrder.phone_number} onChangeText={t => setEditingOrder({...editingOrder, phone_number:t})} />
            
            <View style={styles.detailBox}>
                <Text style={styles.labelSmall}>Detail Produk:</Text>
                {editingOrder.items?.map((it, i) => (
                    <Text key={i} style={styles.itTxt}>• {it.name} ({it.quantity}x) @Rp {it.price.toLocaleString()}</Text>
                ))}
            </View>

            <TextInput 
                style={styles.input} 
                placeholder="Biaya Tambahan (Ongkir, dll)" 
                keyboardType="numeric" 
                value={editingOrder.other_cost?.toString()} 
                onChangeText={t => {
                    const cost = parseInt(t || 0);
                    const basePrice = editingOrder.items?.reduce((a, b) => a + (b.price * b.quantity), 0) || 0;
                    setEditingOrder({...editingOrder, other_cost: t, total_price: basePrice + cost});
                }} 
            />
            <Text style={styles.totalPreview}>Total Akhir: Rp {editingOrder.total_price?.toLocaleString()}</Text>

            <TextInput 
                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                placeholder="Catatan Pesanan" 
                multiline 
                value={editingOrder.notes} 
                onChangeText={t => setEditingOrder({...editingOrder, notes:t})} 
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOrder}><Text style={styles.btnTxt}>SIMPAN PERUBAHAN</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setOrderModalVisible(false)} style={{marginTop:15}}><Text style={{textAlign:'center', color:'red'}}>BATAL</Text></TouchableOpacity>
          </ScrollView>
        </View></View>
      </Modal>

      {/* MODAL PELANGGAN */}
      <Modal visible={custModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}><View style={styles.modalBody}>
          <Text style={styles.modalTitle}>Data Pelanggan</Text>
          <TextInput style={styles.input} placeholder="Nama" value={editingCustomer.name} onChangeText={t => setEditingCustomer({...editingCustomer, name:t})} />
          <TextInput style={styles.input} placeholder="WA" value={editingCustomer.phone} onChangeText={t => setEditingCustomer({...editingCustomer, phone:t})} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Alamat" value={editingCustomer.address} onChangeText={t => setEditingCustomer({...editingCustomer, address:t})} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCustomer}><Text style={styles.btnTxt}>SIMPAN PELANGGAN</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setCustModalVisible(false)} style={{marginTop:15}}><Text style={{textAlign:'center', color:'red'}}>BATAL</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  tabNav: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 10 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTabItem: { borderBottomWidth: 3, borderColor: '#3498DB' },
  tabTxt: { fontSize: 10, color: '#95A5A6', marginTop: 2, fontWeight: 'bold' },
  scrollContent: { padding: 15 },
  headerDashboard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#7F8C8D', marginVertical: 10 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  box: { flex: 0.48, backgroundColor: '#FFF', padding: 15, borderRadius: 12, elevation: 2, alignItems: 'center' },
  boxLabel: { fontSize: 11, color: '#95A5A6' },
  boxValue: { fontSize: 14, fontWeight: 'bold', color: '#27AE60', marginTop: 4 },
  bestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  bestName: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  btnRefresh: { backgroundColor: '#3498DB', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnTxt: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  btnAddHeader: { backgroundColor: '#3498DB', margin: 15, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  listCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 10, alignItems: 'center', elevation: 2 },
  listName: { fontWeight: 'bold', fontSize: 15 },
  priceTxt: { color: '#27AE60', fontWeight: 'bold', fontSize: 13 },
  rowActions: { flexDirection: 'row', width: 110, justifyContent: 'space-between', alignItems: 'center' },
  subTxt: { fontSize: 12, color: '#95A5A6' },
  orderBox: { backgroundColor: '#FFF', padding: 15, margin: 15, borderRadius: 12, elevation: 3 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEE', paddingBottom: 5 },
  detailList: { marginVertical: 8 },
  itTxt: { fontSize: 13, color: '#546E7A', marginBottom: 2 },
  notesTxt: { fontSize: 12, color: '#E67E22', fontStyle: 'italic', marginBottom: 5 },
  totalTxt: { fontWeight: 'bold', fontSize: 14, color: '#2C3E50', textAlign: 'right' },
  rowBtn: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', alignItems: 'center' },
  waBtn: { backgroundColor: '#25D366', padding: 8, borderRadius: 8, flexDirection: 'row', flex: 0.4, justifyContent: 'center' },
  doneBtn: { backgroundColor: '#3498DB', padding: 8, borderRadius: 8, flex: 0.4, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalBody: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8 },
  saveBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 12, alignItems: 'center' },
  detailBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, marginBottom: 15 },
  labelSmall: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  totalPreview: { textAlign: 'right', fontWeight: 'bold', color: '#27AE60', marginBottom: 15 }
});