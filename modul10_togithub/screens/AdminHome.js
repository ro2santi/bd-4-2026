import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, Modal, FlatList, SafeAreaView 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminHome() {
  const [loading, setLoading] = useState(false);
  // State untuk mengontrol isi Modal Detail
  const [detailModal, setDetailModal] = useState({ visible: false, title: '', data: [], type: '' });
  
  const [data, setData] = useState({
    omset: { harian: 0, mingguan: 0, bulanan: 0, tahunan: 0 },
    terlaris: { name: '-', total: 0 },
    terbaru: null,
    operasional: { aktif: 0, user: 0, baru: 0, diproses: 0, selesai: 0 },
    rawOrders: [], 
    rawUsers: []
  });

  useEffect(() => {
    fetchSummaryData();
    // Setup Realtime: Langsung refresh data jika ada perubahan di tabel orders
    const channel = supabase.channel('realtime-admin').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, () => fetchSummaryData()).subscribe();
    
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchSummaryData = async () => {
    if (!data.terbaru) setLoading(true);
    try {
      const now = new Date();
      const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { data: users } = await supabase.from('customers').select('*').order('name');
      const { count: aktifProd } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);

      let h = 0, w = 0, m = 0, y = 0, b = 0, p = 0, s = 0, salesMap = {};
      
      orders?.forEach(o => {
        const date = new Date(o.created_at);
        const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
        
        // Kalkulasi Omset
        if (diffDays <= 1) h += (o.total_price || 0);
        if (diffDays <= 7) w += (o.total_price || 0);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) m += (o.total_price || 0);
        if (date.getFullYear() === now.getFullYear()) y += (o.total_price || 0);

        // Kalkulasi Status
        if (o.status === 'Selesai') s++; 
        else if (o.status === 'Diproses') p++; 
        else b++;

        // Kalkulasi Produk Terlaris
        o.items?.forEach(it => salesMap[it.name] = (salesMap[it.name] || 0) + it.quantity);
      });

      const top = Object.entries(salesMap).sort((a, b) => b[1] - a[1])[0];

      setData({
        omset: { harian: h, mingguan: w, bulanan: m, tahunan: y },
        terlaris: top ? { name: top[0], total: top[1] } : { name: '-', total: 0 },
        terbaru: orders?.[0] || null,
        operasional: { aktif: aktifProd || 0, user: users?.length || 0, baru: b, diproses: p, selesai: s },
        rawOrders: orders || [],
        rawUsers: users || []
      });
    } finally { setLoading(false); }
  };

  // Fungsi untuk menampilkan rincian data ke dalam Modal
  const openDetail = (type, title) => {
    let listData = [];
    const todayStr = new Date().toDateString();

    switch(type) {
      case 'harian': 
        listData = data.rawOrders.filter(o => new Date(o.created_at).toDateString() === todayStr);
        break;
      case 'users': 
        listData = data.rawUsers;
        break;
      case 'baru': 
        listData = data.rawOrders.filter(o => o.status === 'Baru' || !o.status);
        break;
      case 'proses': 
        listData = data.rawOrders.filter(o => o.status === 'Diproses');
        break;
      case 'selesai': 
        listData = data.rawOrders.filter(o => o.status === 'Selesai');
        break;
    }
    setDetailModal({ visible: true, title, data: listData, type });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 15}}>
        <Text style={styles.title}>Ringkasan Bisnis</Text>

        {loading ? <ActivityIndicator size="large" color="#3498DB" /> : (
          <>
            <Text style={styles.sectionLabel}>Statistik Omset (Klik untuk Rincian)</Text>
            <View style={styles.grid}>
              <TouchableOpacity style={styles.omsetBox} onPress={() => openDetail('harian', 'Pesanan Hari Ini')}>
                <Text style={styles.boxLabel}>Hari Ini</Text>
                <Text style={styles.boxValueGreen}>Rp {data.omset.harian.toLocaleString()}</Text>
              </TouchableOpacity>
              <View style={styles.omsetBox}>
                <Text style={styles.boxLabel}>Minggu Ini</Text>
                <Text style={styles.boxValueGreen}>Rp {data.omset.mingguan.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.grid}>
              <View style={styles.omsetBox}>
                <Text style={styles.boxLabel}>Bulan Ini</Text>
                <Text style={styles.boxValueGreen}>Rp {data.omset.bulanan.toLocaleString()}</Text>
              </View>
              <View style={styles.omsetBox}>
                <Text style={styles.boxLabel}>Tahun Ini</Text>
                <Text style={styles.boxValueGreen}>Rp {data.omset.tahunan.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.bestSellerCard}>
              <MaterialCommunityIcons name="trophy" size={24} color="#F1C40F" />
              <View style={{marginLeft: 12}}>
                <Text style={styles.smallLabel}>Produk Terlaris</Text>
                <Text style={styles.bestSellerText}>{data.terlaris.name} ({data.terlaris.total} terjual)</Text>
              </View>
            </View>

            <View style={styles.recentHeader}>
               <Text style={styles.sectionLabel}>Pesanan Terbaru</Text>
               <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
            </View>
            
            <View style={styles.recentOrderCard}>
              {data.terbaru ? (
                <View style={styles.recentOrderItem}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="account" size={18} color="#3498DB" />
                  </View>
                  <View style={{marginLeft: 12, flex: 1}}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.recentName}>{data.terbaru.customer_name}</Text>
                      <Text style={styles.recentTime}>Baru Saja</Text>
                    </View>
                    <View style={styles.productBadgeContainer}>
                      {data.terbaru.items?.map((it, idx) => (
                        <View key={idx} style={styles.productBadge}>
                          <Text style={styles.productBadgeText}>{it.name} x{it.quantity}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ) : <Text style={styles.emptyText}>Belum ada pesanan terbaru</Text>}
            </View>

            <Text style={styles.sectionLabel}>Data Operasional</Text>
            <View style={styles.grid}>
              <TouchableOpacity style={[styles.opBox, {backgroundColor: '#E3F2FD'}]} onPress={() => openDetail('users', 'Daftar Pelanggan')}>
                <Text style={styles.opValue}>{data.operasional.user}</Text>
                <Text style={styles.opLabel}>Total User</Text>
              </TouchableOpacity>
              <View style={[styles.opBox, {backgroundColor: '#E8F5E9'}]}>
                <Text style={styles.opValue}>{data.operasional.aktif}</Text>
                <Text style={styles.opLabel}>Produk Aktif</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <TouchableOpacity style={[styles.statusBox, {backgroundColor: '#FFF3E0'}]} onPress={() => openDetail('baru', 'Pesanan Baru')}>
                <Text style={styles.statusValue}>{data.operasional.baru}</Text>
                <Text style={styles.statusLabel}>Baru</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusBox, {backgroundColor: '#E0F7FA'}]} onPress={() => openDetail('proses', 'Pesanan Diproses')}>
                <Text style={styles.statusValue}>{data.operasional.diproses}</Text>
                <Text style={styles.statusLabel}>Proses</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusBox, {backgroundColor: '#F3E5F5'}]} onPress={() => openDetail('selesai', 'Pesanan Selesai')}>
                <Text style={styles.statusValue}>{data.operasional.selesai}</Text>
                <Text style={styles.statusLabel}>Selesai</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnPerbarui} onPress={fetchSummaryData}>
              <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
              <Text style={styles.btnText}> Perbarui Data</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* MODAL DETAIL POPUP */}
      <Modal visible={detailModal.visible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailModal.title}</Text>
              <TouchableOpacity onPress={() => setDetailModal({...detailModal, visible: false})}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#95A5A6" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={detailModal.data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.detailItem}>
                  <View>
                    <Text style={styles.detailItemName}>{detailModal.type === 'users' ? item.name : item.customer_name}</Text>
                    <Text style={styles.detailItemSub}>{detailModal.type === 'users' ? item.phone : item.created_at?.split('T')[0]}</Text>
                  </View>
                  {detailModal.type !== 'users' && (
                    <Text style={styles.detailItemPrice}>Rp {item.total_price?.toLocaleString()}</Text>
                  )}
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada data rincian.</Text>}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 5 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#95A5A6', marginVertical: 10 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  omsetBox: { flex: 0.48, backgroundColor: '#FFF', padding: 15, borderRadius: 12, elevation: 1 },
  boxLabel: { fontSize: 11, color: '#95A5A6' },
  boxValueGreen: { fontSize: 14, fontWeight: 'bold', color: '#27AE60', marginTop: 5 },
  bestSellerCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 5, elevation: 1 },
  smallLabel: { fontSize: 10, color: '#95A5A6' },
  bestSellerText: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  recentHeader: { flexDirection: 'row', alignItems: 'center' },
  liveBadge: { backgroundColor: 'red', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  liveText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  recentOrderCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#3498DB' },
  recentOrderItem: { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle: { backgroundColor: '#E3F2FD', padding: 8, borderRadius: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  recentName: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
  recentTime: { fontSize: 10, color: '#3498DB', fontWeight: 'bold' },
  productBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  productBadge: { backgroundColor: '#F0F3F4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 5, marginBottom: 5, borderWidth: 0.5, borderColor: '#D1D8E0' },
  productBadgeText: { fontSize: 10, color: '#546E7A' },
  opBox: { flex: 0.48, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  opValue: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  opLabel: { fontSize: 11, color: '#7F8C8D', marginTop: 2 },
  statusBox: { flex: 0.31, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  statusValue: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  statusLabel: { fontSize: 10, color: '#7F8C8D', marginTop: 2 },
  btnPerbarui: { backgroundColor: '#3498DB', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  emptyText: { textAlign: 'center', color: '#95A5A6', marginTop: 20 },
  // Modal Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', height: '75%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailItemName: { fontWeight: 'bold', color: '#2C3E50' },
  detailItemSub: { fontSize: 12, color: '#95A5A6' },
  detailItemPrice: { fontWeight: 'bold', color: '#27AE60' }
});