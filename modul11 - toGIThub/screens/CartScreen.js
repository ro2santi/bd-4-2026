import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase'; 
import { CartManager } from '../cartStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState(''); // Field Baru

  useFocusEffect(
    useCallback(() => {
      setCart([...CartManager.getItems()]);
    }, [])
  );

  const handleUpdateQty = (id, action) => {
    CartManager.updateQty(id, action);
    setCart([...CartManager.getItems()]);
  };

  const handleCheckout = async () => {
    if (!buyerName || !buyerPhone || !buyerEmail) return Alert.alert("Error", "Mohon lengkapi Nama, WA & Email");
    if (cart.length === 0) return Alert.alert("Kosong", "Keranjang kosong");
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
      const { error } = await supabase.from('orders').insert([
        { 
          customer_name: buyerName, 
          phone_number: buyerPhone, 
          items: cart, 
          total_price: total, 
          status: 'Baru', 
          notes: `Email: ${buyerEmail}` 
        }
      ]);
      if (error) throw error;

      // Login/Daftar Cepat (Update CRM)
      await supabase.from('customers').upsert([
        { name: buyerName, phone: buyerPhone, email: buyerEmail }
      ], { onConflict: 'phone' });
      
      Alert.alert("Sukses", "Pesanan Berhasil Disimpan!", [{ 
        text: "Selesai", 
        onPress: () => {
          CartManager.clear();
          navigation.navigate('CustomerHome');
        } 
      }]);
    } catch (e) { Alert.alert("Gagal", e.message); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.formSection}>
        <TextInput style={styles.input} placeholder="Nama Penerima" value={buyerName} onChangeText={setBuyerName} />
        <TextInput style={styles.input} placeholder="Nomor WA (08...)" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Alamat Email" value={buyerEmail} onChangeText={setBuyerEmail} keyboardType="email-address" autoCapitalize="none" />
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
        ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 50, color: '#AAA'}}>Keranjang Kosong.</Text>}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalPrice}>Total: Rp {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</Text>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.btnText}>Konfirmasi Pesanan</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  formSection: { padding: 20, backgroundColor: '#F8F9FA' },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#DDD' },
  cartItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
  itemName: { fontWeight: 'bold', fontSize: 16 },
  itemPrice: { color: '#27AE60', fontWeight: 'bold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 8, padding: 5 },
  qtyBtn: { backgroundColor: '#3498DB', padding: 5, borderRadius: 5 },
  qtyText: { marginHorizontal: 12, fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#EEE' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  checkoutBtn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});