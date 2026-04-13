import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Platform 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function LaporanScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    rawOrders: []
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const total = data.reduce((sum, item) => sum + (item.total_price || 0), 0);
        setStats({
          totalRevenue: total,
          totalOrders: data.length,
          rawOrders: data
        });
      }
    } catch (error) {
      Alert.alert("Error", "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI BUAT PDF
  const exportToPDF = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Info", "Fitur PDF hanya tersedia di Android/iOS (Expo Go).");
      return;
    }

    try {
      // Desain HTML untuk isi PDF
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; }
              h1 { color: #3498db; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #3498db; color: white; }
              .total { margin-top: 20px; font-weight: bold; font-size: 18px; text-align: right; }
            </style>
          </head>
          <body>
            <h1>LAPORAN PENJUALAN UMKM</h1>
            <p>Total Pesanan: ${stats.totalOrders}</p>
            <table>
              <tr>
                <th>Tanggal</th>
                <th>Nama Pelanggan</th>
                <th>Total Bayar</th>
                <th>Status</th>
              </tr>
              ${stats.rawOrders.map(o => `
                <tr>
                  <td>${o.created_at.split('T')[0]}</td>
                  <td>${o.customer_name}</td>
                  <td>Rp ${o.total_price.toLocaleString()}</td>
                  <td>${o.status}</td>
                </tr>
              `).join('')}
            </table>
            <div class="total">Total Omset: Rp ${stats.totalRevenue.toLocaleString()}</div>
          </body>
        </html>
      `;

      // Proses Print ke File
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Bagikan File
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (error) {
      Alert.alert("Error", "Gagal membuat PDF.");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3498DB" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Analisis Keuangan</Text>

        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>Total Omset</Text>
          <Text style={styles.cardValue}>Rp {stats.totalRevenue.toLocaleString()}</Text>
          <Text style={styles.subText}>Jumlah Pesanan: {stats.totalOrders}</Text>
        </View>

        <Text style={styles.sectionTitle}>Cetak Laporan</Text>
        
        <TouchableOpacity style={styles.btnPdf} onPress={exportToPDF}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
          <Text style={styles.btnText}> Simpan sebagai PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnRefresh} onPress={fetchReportData}>
          <Text style={{color: '#3498DB', marginTop: 20}}>Refresh Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  mainCard: { backgroundColor: '#3498DB', borderRadius: 15, padding: 20, elevation: 5 },
  cardLabel: { color: '#FFF', opacity: 0.8 },
  cardValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginVertical: 10 },
  subText: { color: '#FFF', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 25, marginBottom: 10 },
  btnPdf: { backgroundColor: '#E74C3C', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 },
  btnRefresh: { alignItems: 'center' }
});