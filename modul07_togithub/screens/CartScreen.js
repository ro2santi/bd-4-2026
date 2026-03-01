import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, 
  StyleSheet, Linking, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CartScreen({ route, navigation }) {
  const [cart, setCart] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  useEffect(() => {
    if (route.params?.addItem) {
      const item = route.params.addItem;
      setCart(prev => {
        const exist = prev.find(i => i.id === item.id);
        if (exist) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, quantity: 1 }];
      });
    }
  }, [route.params?.addItem]);

  // --- FUNGSI UPDATE QTY (+ / -) ---
  const updateQty = (id, action) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = action === 'plus' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // --- FUNGSI HAPUS ITEM ---
  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (!buyerName || !buyerPhone) return Alert.alert("Perhatian", "Mohon isi nama dan nomor WA");
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const { error } = await supabase.from('orders').insert([
      { 
        customer_name: buyerName, 
        phone_number: buyerPhone, 
        items: cart, 
        total_price: total, 
        status: 'Baru' 
      }
    ]);

    if (!error) {
      const message = `Halo Owner, saya ${buyerName}. Pesanan saya:\n` + 
                      cart.map(i => `- ${i.name} (${i.quantity}x)`).join('\n') + 
                      `\nTotal: Rp ${total.toLocaleString()}`;
      
      Linking.openURL(`whatsapp://send?phone=6281220042270&text=${encodeURIComponent(message)}`);
      setCart([]); 
      navigation.navigate('CustomerHome');
    } else {
      Alert.alert("Error", "Gagal menyimpan pesanan");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* BAGIAN INPUT NAMA & WA (Dipisah dari FlatList agar tidak loncat) */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Nama Penerima</Text>
        <TextInput 
          style={styles.input} 
          value={buyerName} 
          onChangeText={setBuyerName} 
          placeholder="Nama Lengkap"
        />
        <Text style={styles.label}>Nomor WhatsApp</Text>
        <TextInput 
          style={styles.input} 
          value={buyerPhone} 
          onChangeText={setBuyerPhone} 
          placeholder="0812..." 
          keyboardType="phone-pad"
        />
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
            
            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => updateQty(item.id, 'minus')} style={styles.qtyBtn}>
                <MaterialCommunityIcons name="minus" size={18} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQty(item.id, 'plus')} style={styles.qtyBtn}>
                <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
              <MaterialCommunityIcons name="trash-can" size={26} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="cart-off" size={60} color="#DDD" />
            <Text style={styles.emptyText}>Keranjang Anda Kosong</Text>
          </View>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalPrice}>Rp {cart.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.btnText}>Checkout via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  formSection: { padding: 20, backgroundColor: '#F8F9FA' },
  label: { fontWeight: 'bold', marginBottom: 5, fontSize: 14, color: '#333' },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  cartItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
  itemName: { fontWeight: 'bold', fontSize: 16 },
  itemPrice: { color: '#27AE60', fontWeight: 'bold' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 10, padding: 5 },
  qtyBtn: { backgroundColor: '#3498DB', padding: 5, borderRadius: 8 },
  qtyText: { marginHorizontal: 15, fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { marginLeft: 15 },
  emptyBox: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#AAA', marginTop: 10, fontSize: 16 },
  footer: { padding: 20, borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#7F8C8D' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  checkoutBtn: { backgroundColor: '#25D366', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});