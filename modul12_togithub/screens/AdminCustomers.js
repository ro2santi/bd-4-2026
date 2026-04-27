import React, { useState, useEffect } from 'react';
// PENTING: SafeAreaView sekarang sudah diimpor
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Linking, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminCustomers() {
  const [tab, setTab] = useState('member'); 
  const [members, setMembers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Modal Form
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCust, setEditingCust] = useState({});
  
  // State Modal Detail & Riwayat
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    // Mengambil data dari tabel users (Member)
    const { data: userData } = await supabase.from('users').select('*').neq('role', 'admin').order('full_name');
    // Mengambil data dari tabel customers (Tamu)
    const { data: guestData } = await supabase.from('customers').select('*').order('name');
    // Mengambil data pesanan
    const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    setMembers(userData || []);
    setGuests(guestData || []);
    setOrders(ordData || []);
    setLoading(false);
  };

  const openDetail = (item) => {
    const phone = item.phone;
    // Mencari riwayat belanja berdasarkan nomor telepon
    const history = orders.filter(o => String(o.phone_number) === String(phone));
    setSelectedUser(item);
    setUserHistory(history);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selesai': return '#27AE60';
      case 'Proses': return '#F1C40F';
      default: return '#E67E22';
    }
  };

  const handleSave = async () => {
    const table = tab === 'member' ? 'users' : 'customers';
    const payload = tab === 'member' 
      ? { full_name: editingCust.full_name, phone: editingCust.phone, email: editingCust.email, address: editingCust.address }
      : { name: editingCust.name, phone: editingCust.phone, email: editingCust.email, address: editingCust.address };

    try {
      if (editingCust.id) {
        await supabase.from(table).update(payload).eq('id', editingCust.id);
      } else {
        if (tab === 'member') payload.role = 'customer';
        await supabase.from(table).insert([payload]);
      }
      setModalVisible(false);
      fetchData();
      Alert.alert("Sukses", "Data berhasil disimpan");
    } catch (e) { Alert.alert("Gagal", e.message); }
  };

  const confirmDelete = (item) => {
    const table = tab === 'member' ? 'users' : 'customers';
    Alert.alert("Hapus Pelanggan", "Data ini akan dihapus permanen. Lanjutkan?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          await supabase.from(table).delete().eq('id', item.id);
          fetchData();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnAdd} onPress={() => { setEditingCust({}); setModalVisible(true); }}>
        <Text style={styles.btnTxt}>+ Tambah {tab === 'member' ? 'Member' : 'Tamu'}</Text>
      </TouchableOpacity>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'member' && styles.activeTab]} onPress={() => setTab('member')}>
          <Text style={[styles.tabTxt, tab === 'member' && styles.activeTabTxt]}>Pelanggan Tetap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'guest' && styles.activeTab]} onPress={() => setTab('guest')}>
          <Text style={[styles.tabTxt, tab === 'guest' && styles.activeTabTxt]}>Tamu / Guest</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tab === 'member' ? members : guests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{tab === 'member' ? item.full_name : item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.emailCard}>{item.email || 'Tidak ada email'}</Text>
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=${item.phone}`)}>
                <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingCust(item); setModalVisible(true); }}>
                <MaterialCommunityIcons name="pencil" size={24} color="#F1C40F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item)}>
                <MaterialCommunityIcons name="trash-can" size={24} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* MODAL DETAIL LENGKAP & RIWAYAT */}
      <Modal visible={detailModalVisible} animationType="slide">
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Profil Pelanggan</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={32} color="#E74C3C" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Nama Lengkap:</Text>
                <Text style={styles.infoValue}>{selectedUser?.full_name || selectedUser?.name}</Text>
                
                <Text style={styles.infoLabel}>Nomor WhatsApp:</Text>
                <Text style={styles.infoValue}>{selectedUser?.phone}</Text>
                
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{selectedUser?.email || '-'}</Text>
                
                <Text style={styles.infoLabel}>Alamat:</Text>
                <Text style={styles.infoValue}>{selectedUser?.address || 'Alamat tidak diisi'}</Text>
                
                <Text style={styles.infoLabel}>Bergabung Sejak:</Text>
                <Text style={styles.infoValue}>{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString('id-ID') : '-'}</Text>
              </View>

              <Text style={styles.historySectionTitle}>Riwayat Transaksi</Text>
              
              {userHistory.length > 0 ? userHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString('id-ID')}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.productSection}>
                    {/* Menampilkan Detail Produk dan Jumlah */}
                    {item.items.map((prod, idx) => (
                      <Text key={idx} style={styles.productTxt}>• {prod.name} (x{prod.quantity})</Text>
                    ))}
                  </View>
                  <Text style={styles.historyTotal}>Total: Rp {item.total_price.toLocaleString()}</Text>
                </View>
              )) : (
                <Text style={styles.emptyTxt}>Belum ada riwayat pesanan.</Text>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL FORM TAMBAH/EDIT */}
      <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBg}>
              <View style={styles.modalContent}>
                <Text style={styles.modalHeader}>Input Data Pelanggan</Text>
                <TextInput style={styles.input} placeholder="Nama" value={tab === 'member' ? editingCust.full_name : editingCust.name} onChangeText={t => tab === 'member' ? setEditingCust({...editingCust, full_name: t}) : setEditingCust({...editingCust, name: t})} />
                <TextInput style={styles.input} placeholder="WA (628...)" value={editingCust.phone} keyboardType="phone-pad" onChangeText={t => setEditingCust({...editingCust, phone: t})} />
                <TextInput style={styles.input} placeholder="Email" value={editingCust.email} onChangeText={t => setEditingCust({...editingCust, email: t})} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Alamat Lengkap" value={editingCust.address} onChangeText={t => setEditingCust({...editingCust, address: t})} multiline />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnTxt}>Simpan Data</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15}}><Text style={{color:'red', textAlign:'center'}}>Batal</Text></TouchableOpacity>
              </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  btnAdd: { margin: 15, padding: 15, backgroundColor: '#2C3E50', borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', marginBottom: 5, elevation: 2 },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#3498DB' },
  tabTxt: { fontWeight: 'bold', color: '#95A5A6' },
  activeTabTxt: { color: '#3498DB' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, marginHorizontal: 15, marginVertical: 5, borderRadius: 12, alignItems: 'center', elevation: 2 },
  name: { fontWeight: 'bold', fontSize: 16, color: '#2C3E50' },
  phone: { color: '#7F8C8D', fontSize: 13 },
  emailCard: { fontSize: 11, color: '#3498DB' },
  rowActions: { flexDirection: 'row', width: 110, justifyContent: 'space-between' },

  detailContainer: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  infoBox: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 25 },
  infoLabel: { fontSize: 12, color: '#95A5A6', marginTop: 10 },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
  historySectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2C3E50' },
  historyCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#F0F0F0', paddingBottom: 10 },
  historyDate: { fontWeight: 'bold', color: '#7F8C8D' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  productSection: { marginVertical: 10 },
  productTxt: { fontSize: 14, color: '#34495E' },
  historyTotal: { textAlign: 'right', fontWeight: 'bold', color: '#27AE60', fontSize: 16 },

  modalBg: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding:20 },
  modalContent: { backgroundColor:'#FFF', padding:25, borderRadius:20 },
  modalHeader: { fontSize:18, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  input: { borderBottomWidth:1, borderColor:'#DDD', marginBottom:15, padding:10, fontSize: 15 },
  saveBtn: { backgroundColor:'#3498DB', padding:15, borderRadius:12, alignItems:'center', marginTop:10 },
  saveBtnTxt: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  emptyTxt: { textAlign:'center', color:'#95A5A6', marginTop:20 }
});