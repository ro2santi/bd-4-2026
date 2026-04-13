import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView, Linking, Alert } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editOrder, setEditOrder] = useState({});

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const handleUpdate = async () => {
    const payload = {
      customer_name: editOrder.customer_name,
      other_cost: parseInt(editOrder.other_cost || 0),
      total_price: parseInt(editOrder.total_price),
      notes: editOrder.notes,
      status: editOrder.status // Menyimpan status baru
    };
    await supabase.from('orders').update(payload).eq('id', editOrder.id);
    setModalVisible(false); 
    fetchOrders();
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus pesanan ini secara permanen?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            await supabase.from('orders').delete().eq('id', id);
            fetchOrders();
          } 
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Baru': return '#E74C3C'; // Merah
      case 'Diproses': return '#F1C40F'; // Kuning
      case 'Selesai': return '#27AE60'; // Hijau
      default: return '#95A5A6';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.headerCard}>
              <View>
                <Text style={styles.custName}>{item.customer_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status || 'Baru'}</Text>
                </View>
              </View>
              <Text style={styles.date}>{item.created_at?.split('T')[0]}</Text>
            </View>

            <View style={styles.itemsBox}>
              {item.items?.map((it, i) => <Text key={i} style={styles.itTxt}>• {it.name} ({it.quantity}x)</Text>)}
            </View>

            {item.notes && <Text style={styles.notes}>Ket: {item.notes}</Text>}
            <Text style={styles.total}>Total: Rp {item.total_price?.toLocaleString()}</Text>

            <View style={styles.rowBtn}>
              <TouchableOpacity style={styles.btnWA} onPress={() => Linking.openURL(`whatsapp://send?phone=${item.phone_number}`)}>
                <MaterialCommunityIcons name="whatsapp" size={18} color="#FFF" />
                <Text style={styles.whiteTxt}> Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnEdit} onPress={() => { setEditOrder(item); setModalVisible(true); }}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
                <Text style={styles.whiteTxt}> Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(item.id)}>
                <MaterialCommunityIcons name="trash-can" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Detail Pesanan</Text>
            
            <Text style={styles.label}>Nama Pelanggan</Text>
            <TextInput style={styles.input} value={editOrder.customer_name} onChangeText={t => setEditOrder({...editOrder, customer_name:t})} />
            
            <Text style={styles.label}>Ubah Status Pesanan</Text>
            <View style={styles.statusRow}>
              {['Baru', 'Diproses', 'Selesai'].map((s) => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.statusOption, editOrder.status === s && { backgroundColor: getStatusColor(s) }]}
                  onPress={() => setEditOrder({...editOrder, status: s})}
                >
                  <Text style={[styles.statusOptionText, editOrder.status === s && { color: '#FFF' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Biaya Lain (Ongkir/Admin)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={editOrder.other_cost?.toString()} 
              onChangeText={t => {
                const cost = parseInt(t || 0);
                const base = editOrder.items?.reduce((a, b) => a + (b.price * b.quantity), 0) || 0;
                setEditOrder({...editOrder, other_cost: t, total_price: base + cost});
              }} 
            />
            
            <Text style={styles.labelTotal}>Total Akhir: Rp {editOrder.total_price?.toLocaleString()}</Text>
            
            <Text style={styles.label}>Catatan</Text>
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Catatan" multiline value={editOrder.notes} onChangeText={t => setEditOrder({...editOrder, notes:t})} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.whiteTxt}>Simpan Perubahan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelTxt}>Tutup</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  card: { backgroundColor: '#FFF', padding: 15, margin: 15, borderRadius: 15, elevation: 3 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEE', paddingBottom: 10 },
  custName: { fontWeight: 'bold', fontSize: 16 },
  date: { fontSize: 12, color: '#95A5A6' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginTop: 5, alignSelf: 'flex-start' },
  statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  itemsBox: { marginVertical: 10 },
  itTxt: { fontSize: 13, color: '#7F8C8D' },
  notes: { fontSize: 12, color: 'orange', fontStyle: 'italic', marginBottom: 5 },
  total: { fontWeight: 'bold', textAlign: 'right', fontSize: 15, color: '#2C3E50' },
  rowBtn: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between', alignItems: 'center' },
  btnWA: { backgroundColor: '#25D366', padding: 10, borderRadius: 8, flex: 0.35, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnEdit: { backgroundColor: '#3498DB', padding: 10, borderRadius: 8, flex: 0.35, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnDelete: { backgroundColor: '#E74C3C', padding: 10, borderRadius: 8, flex: 0.2, alignItems: 'center' },
  whiteTxt: { color: '#FFF', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 12, color: '#7F8C8D', marginBottom: 5, fontWeight: 'bold' },
  labelTotal: { fontSize: 14, color: '#27AE60', fontWeight: 'bold', marginBottom: 15 },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8, color: '#2C3E50' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statusOption: { flex: 0.3, padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  statusOptionText: { fontSize: 11, fontWeight: 'bold', color: '#7F8C8D' },
  saveBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  cancelTxt: { color: 'red', textAlign: 'center', marginTop: 15 }
});