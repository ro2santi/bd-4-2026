import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  SafeAreaView, ScrollView, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import Komponen Tab
import AdminHome from './AdminHome'; 
import AdminProducts from './AdminProducts'; 
import AdminCustomers from './AdminCustomers';
import AdminOrders from './AdminOrders';
import PromoScreen from './PromoScreen';
import LaporanScreen from './LaporanScreen';
import ProfileUMKMScreen from './ProfileUMKMScreen';

export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');

  // --- FUNGSI LOGOUT DENGAN KONFIRMASI ---
  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari Panel Admin?",
      [
        {
          text: "Batal",
          onPress: () => console.log("Logout dibatalkan"),
          style: "cancel"
        },
        { 
          text: "Keluar", 
          onPress: () => {
            // Mengganti route ke Welcome agar tidak bisa 'Back' lagi ke Admin
            navigation.replace('Welcome'); 
          },
          style: "destructive" // Membuat teks tombol berwarna merah (iOS)
        }
      ]
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <AdminHome />;
      case 'products': return <AdminProducts />;
      case 'customers': return <AdminCustomers />;
      case 'orders': return <AdminOrders />;
      case 'promo': return <PromoScreen />;
      case 'report': return <LaporanScreen />;
      case 'profile': return <ProfileUMKMScreen />;
      default: return <AdminHome />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER UTAMA */}
      <View style={styles.topHeader}>
        <View>
            <Text style={styles.subBrand}>Panel Owner</Text>
            <Text style={styles.brand}>UMKM ADMIN</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutCircle}>
          <MaterialCommunityIcons name="logout" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {/* TAB NAVIGATION (SCROLLABLE) */}
      <View style={styles.tabNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'home', icon: 'home', label: 'RINGKASAN' },
            { id: 'products', icon: 'package-variant', label: 'PRODUK' },
            { id: 'customers', icon: 'account-group', label: 'PELANGGAN' },
            { id: 'orders', icon: 'clipboard-list', label: 'PESANAN' },
            { id: 'promo', icon: 'ticket-percent', label: 'PROMO' },
            { id: 'report', icon: 'file-chart', label: 'LAPORAN' },
            { id: 'profile', icon: 'storefront', label: 'PROFIL' },
          ].map((t) => (
            <TouchableOpacity 
              key={t.id} 
              onPress={() => setActiveTab(t.id)} 
              style={[styles.tabItem, activeTab === t.id && styles.activeTabItem]}
            >
              <MaterialCommunityIcons 
                name={t.icon} 
                size={22} 
                color={activeTab === t.id ? '#3498DB' : '#95A5A6'} 
              />
              <Text style={[styles.tabTxt, activeTab === t.id && { color: '#3498DB' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* AREA KONTEN */}
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingVertical: 15, 
    backgroundColor: '#FFF',
    alignItems: 'center',
    elevation: 2
  },
  subBrand: { fontSize: 12, color: '#95A5A6' },
  brand: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  logoutCircle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F5'
  },
  tabNav: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    paddingVertical: 5, 
    borderTopWidth: 1, 
    borderColor: '#F0F0F0',
    elevation: 4
  },
  tabItem: { width: 95, alignItems: 'center', paddingVertical: 10 },
  activeTabItem: { borderBottomWidth: 3, borderColor: '#3498DB' },
  tabTxt: { fontSize: 10, color: '#95A5A6', marginTop: 4, fontWeight: 'bold' },
  contentArea: { flex: 1 }
});