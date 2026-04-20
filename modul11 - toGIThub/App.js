import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- LAYAR UMUM ---
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginOwnerScreen';

// --- LAYAR PELANGGAN (Read-Only) ---
import CustomerHomeScreen from './screens/CustomerHomeScreen';
import CustomerProfileScreen from './screens/CustomerProfileScreen'; // Khusus tampil data
import CustomerPromoScreen from './screens/CustomerPromoScreen';     // Khusus tampil promo
import DetailScreen from './screens/DetailScreen';
import CartScreen from './screens/CartScreen';
import SupportScreen from './screens/SupportScreen';

// --- LAYAR ADMIN (Management / CRUD) ---
import AdminDashboard from './screens/AdminDashboardScreen';
import ManageProducts from './screens/AdminProducts';
import ManageOrders from './screens/AdminOrders';
import EditProfileToko from './screens/ProfileUMKMScreen'; // Admin bisa Edit
import AdminPromo from './screens/PromoScreen';           // Admin bisa Edit Promo
import LaporanScreen from './screens/LaporanScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginOwner" component={LoginScreen} options={{ title: 'Login Admin' }} />

        {/* JALUR PELANGGAN */}
        <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} options={{ title: 'Katalog Produk' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: 'Detail Produk' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Keranjang Belanja' }} />
        <Stack.Screen name="ProfileUMKM" component={CustomerProfileScreen} options={{ title: 'Profil Toko' }} />
        <Stack.Screen name="Promo" component={CustomerPromoScreen} options={{ title: 'Promo Spesial' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Bantuan' }} />

        {/* JALUR ADMIN */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Panel Admin' }} />
        <Stack.Screen name="ManageProducts" component={ManageProducts} options={{ title: 'Kelola Produk' }} />
        <Stack.Screen name="ManageOrders" component={ManageOrders} options={{ title: 'Daftar Pesanan' }} />
        <Stack.Screen name="EditProfile" component={EditProfileToko} options={{ title: 'Edit Profil Toko' }} />
        <Stack.Screen name="AdminPromo" component={AdminPromo} options={{ title: 'Kelola Promo' }} />
        <Stack.Screen name="Laporan" component={LaporanScreen} options={{ title: 'Laporan Penjualan' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}