import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Linking } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCust, setEditingCust] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: cust } = await supabase.from('customers').select('*').order('name');
    const { data: ord } = await supabase.from('orders').select('*');
    setCustomers(cust || []);
    setOrders(ord || []);
  };

  // --- FUNGSI HUBUNGI VIA WHATSAPP ---
  const contactWhatsApp = (phone) => {
    if (!phone) return Alert.alert("Error", "Nomor telepon tidak ditemukan");
    
    // Hilangkan karakter non-angka dan pastikan mulai dengan kode negara (62)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const url = `whatsapp://send?phone=${formattedPhone}&text=Halo Pelanggan UMKM...`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp tidak terpasang di perangkat ini");
      }
    });
  };

  const checkHistory = (phone, name) => {
    const history = orders.filter(o => String(o.phone_number) === String(phone));
    const msg = history.length > 0 
      ? history.map(h => `• ${h.created_at?.split('T')[0]}: Rp ${h.total_price.toLocaleString()}`).join('\n')
      : "Belum ada transaksi.";
    Alert.alert(`Riwayat Belanja: ${name}`, msg);
  };

  const handleSave = async () => {
    if (editingCust.id) await supabase.from('customers').update(editingCust).eq('id', editingCust.id);
    else await supabase.from('customers').insert([editingCust]);
    setModalVisible(false); fetchData();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btnAdd, { backgroundColor: '#34495E' }]} onPress={() => { setEditingCust({}); setModalVisible(true); }}>
        <Text style={styles.btnTxt}>+ Tambah Pelanggan Baru</Text>
      </TouchableOpacity>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <View style={styles.rowActions}>
              {/* TOMBOL WHATSAPP BARU */}
              <TouchableOpacity onPress={() => contactWhatsApp(item.phone)}>
                <MaterialCommunityIcons name="whatsapp" size={26} color="#25D366" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => checkHistory(item.phone, item.name)}>
                <MaterialCommunityIcons name="history" size={26} color="#3498DB" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => { setEditingCust(item); setModalVisible(false); setModalVisible(true); }}>
                <MaterialCommunityIcons name="pencil" size={26} color="blue" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={async () => { 
                Alert.alert("Hapus", "Hapus pelanggan ini?", [
                  {text: "Batal"},
                  {text: "Hapus", onPress: async () => {
                    await supabase.from('customers').delete().eq('id', item.id); fetchData();
                  }}
                ])
              }}>
                <MaterialCommunityIcons name="trash-can" size={26} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Data Pelanggan</Text>
            <TextInput style={styles.input} placeholder="Nama" value={editingCust.name} onChangeText={t => setEditingCust({...editingCust, name:t})} />
            <TextInput style={styles.input} placeholder="No WA" value={editingCust.phone} keyboardType="phone-pad" onChangeText={t => setEditingCust({...editingCust, phone:t})} />
            <TextInput style={styles.input} placeholder="Alamat" value={editingCust.address} onChangeText={t => setEditingCust({...editingCust, address:t})} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.btnTxt}>Simpan</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelTxt}>Batal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  btnAdd: { margin: 15, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, marginHorizontal: 15, marginBottom: 10, borderRadius: 12, alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 16 },
  phone: { color: '#7F8C8D' },
  // Lebar ditingkatkan sedikit agar muat 4 ikon
  rowActions: { flexDirection: 'row', width: 140, justifyContent: 'space-between' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8 },
  saveBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelTxt: { color: 'red', textAlign: 'center', marginTop: 15 }
});