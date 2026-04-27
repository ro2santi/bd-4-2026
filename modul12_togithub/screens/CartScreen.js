import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { CartManager } from '../cartStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CartScreen({ route, navigation }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Ambil data user login jika ada
  const userData = route.params?.userData || null;

  // State untuk form Tamu
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAddress, setBuyerAddress] = useState(''); // Menambahkan state alamat sesuai tabel

  useFocusEffect(
    useCallback(() => {
      setCart([...CartManager.getItems()]);
    }, [])
  );

  const handleUpdateQty = (id, action) => {
    CartManager.updateQty(id, action);
    const updated = [...CartManager.getItems()];
    if (action === 'remove') {
        setCart(updated.filter(item => item.id !== id));
    } else {
        setCart(updated);
    }
  };

  const handleCheckout = async () => {
    const finalName = userData ? userData.full_name : buyerName;
    const finalPhone = userData ? userData.phone : buyerPhone;
    const finalEmail = userData ? userData.email : buyerEmail;

    if (!finalName || !finalPhone) return Alert.alert("Error", "Mohon lengkapi identitas pemesan");
    if (cart.length === 0) return Alert.alert("Kosong", "Keranjang kosong");

    setLoading(true);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
      // 1. Simpan Pesanan ke Tabel Orders
      const { error: orderError } = await supabase.from('orders').insert([
        { 
          customer_name: finalName,
          phone_number: finalPhone,
          items: cart, 
          total_price: total, 
          status: 'Baru',
          notes: userData ? `User Login: ${finalEmail}` : `Tamu/Guest: ${finalEmail}`
        }
      ]);

      if (orderError) throw orderError;

      // 2. Jika tamu, simpan data ke tabel customers (Tanpa Upsert/Tanpa Unik)
      if (!userData) {
        const { error: guestError } = await supabase.from('customers').insert([
          { 
            name: buyerName, 
            phone: buyerPhone, 
            email: buyerEmail,
            address: buyerAddress 
          }
        ]);

        if (guestError) {
          console.error("Gagal simpan data tamu:", guestError.message);
        }
      }

      Alert.alert("Sukses", "Pesanan Berhasil dikirim!", [
        { text: "OK", onPress: () => {
          CartManager.clear();
          if (userData) {
            navigation.navigate('CustomerDashboard', { userData });
          } else {
            navigation.navigate('CustomerHome');
          }
        }}
      ]);
    } catch (e) {
      Alert.alert("Gagal", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        {userData ? (
          <View style={styles.loginBadge}>
            <MaterialCommunityIcons name="account-check" size={24} color="#3498DB" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.loginTitle}>Konfirmasi Akun:</Text>
              <Text style={styles.userName}>{userData.full_name}</Text>
              <Text style={styles.userSub}>{userData.phone} | {userData.email}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.guestForm}>
            <Text style={styles.guestTitle}>Data Pemesan (Tamu)</Text>
            <TextInput style={styles.input} placeholder="Nama Lengkap" value={buyerName} onChangeText={setBuyerName} />
            <TextInput style={styles.input} placeholder="No. WA" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Email" value={buyerEmail} onChangeText={setBuyerEmail} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Alamat Lengkap" value={buyerAddress} onChangeText={setBuyerAddress} multiline /> 
          </View>
        )}
      </View>

      <FlatList 
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>Rp {(item.price * item.quantity).toLocaleString()}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => handleUpdateQty(item.id, 'minus')} style={styles.qtyBtn}><MaterialCommunityIcons name="minus" size={16} color="#FFF" /></TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => handleUpdateQty(item.id, 'plus')} style={styles.qtyBtn}><MaterialCommunityIcons name="plus" size={16} color="#FFF" /></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleUpdateQty(item.id, 'remove')} style={{ marginLeft: 15 }}><MaterialCommunityIcons name="trash-can" size={24} color="#E74C3C" /></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Keranjang Kosong.</Text>}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalPrice}>Total: Rp {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</Text>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Konfirmasi Pesanan</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 15, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderColor: '#EEE' },
  loginBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: 15, borderRadius: 12 },
  loginTitle: { fontSize: 11, color: '#3498DB', fontWeight: 'bold' },
  userName: { fontWeight: 'bold', fontSize: 16, color: '#2C3E50' },
  userSub: { fontSize: 12, color: '#7F8C8D' },
  guestForm: { padding: 5 },
  guestTitle: { fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#DDD' },
  cartItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
  itemName: { fontWeight: 'bold', fontSize: 16 },
  itemPrice: { color: '#27AE60', fontWeight: 'bold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 8, padding: 5 },
  qtyBtn: { backgroundColor: '#3498DB', padding: 5, borderRadius: 5 },
  qtyText: { marginHorizontal: 12, fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#EEE' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  checkoutBtn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  empty: {textAlign:'center', marginTop: 50, color: '#AAA'}
});