import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingProduct.name || !editingProduct.price) return Alert.alert("Error", "Nama dan Harga wajib diisi");
    
    const payload = {
      name: editingProduct.name,
      price: parseInt(editingProduct.price),
      category: editingProduct.category || 'Umum',
      image_url: editingProduct.image_url || 'https://via.placeholder.com/150',
      is_active: editingProduct.is_active ?? true
    };

    if (isAdding) await supabase.from('products').insert([payload]);
    else await supabase.from('products').update(payload).eq('id', editingProduct.id);

    setModalVisible(false);
    fetchProducts();
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    fetchProducts();
  };

  const deleteProduct = (id) => {
    Alert.alert("Hapus", "Hapus produk ini permanen?", [
      { text: "Batal" },
      { text: "Hapus", onPress: async () => { await supabase.from('products').delete().eq('id', id); fetchProducts(); }, style: 'destructive' }
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnAdd} onPress={() => { setEditingProduct({}); setIsAdding(true); setModalVisible(true); }}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={styles.btnTxt}>Tambah Produk Baru</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#3498DB" /> : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, !item.is_active && { color: '#AAA' }]}>{item.name}</Text>
                <Text style={styles.price}>Rp {item.price?.toLocaleString()}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => toggleStatus(item.id, item.is_active)}>
                  <MaterialCommunityIcons name={item.is_active ? "eye" : "eye-off"} size={26} color={item.is_active ? "green" : "gray"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingProduct(item); setIsAdding(false); setModalVisible(true); }}>
                  <MaterialCommunityIcons name="pencil" size={26} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteProduct(item.id)}>
                  <MaterialCommunityIcons name="trash-can" size={26} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isAdding ? 'Tambah' : 'Edit'} Produk</Text>
            <TextInput style={styles.input} placeholder="Nama Produk" value={editingProduct.name} onChangeText={t => setEditingProduct({...editingProduct, name:t})} />
            <TextInput style={styles.input} placeholder="Harga" keyboardType="numeric" value={editingProduct.price?.toString()} onChangeText={t => setEditingProduct({...editingProduct, price:t})} />
            <TextInput style={styles.input} placeholder="Kategori" value={editingProduct.category} onChangeText={t => setEditingProduct({...editingProduct, category:t})} />
            <TextInput style={styles.input} placeholder="URL Gambar" value={editingProduct.image_url} onChangeText={t => setEditingProduct({...editingProduct, image_url:t})} />
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
  btnAdd: { backgroundColor: '#3498DB', margin: 15, padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, marginHorizontal: 15, marginBottom: 10, borderRadius: 12, elevation: 2, alignItems: 'center' },
  name: { fontWeight: 'bold', fontSize: 16 },
  price: { color: '#27AE60', fontWeight: 'bold' },
  rowActions: { flexDirection: 'row', width: 110, justifyContent: 'space-between' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8 },
  saveBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelTxt: { color: 'red', textAlign: 'center', marginTop: 15 }
});