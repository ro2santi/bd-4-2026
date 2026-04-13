import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  TextInput, Modal, Alert, ActivityIndicator 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PromoScreen() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', description: '', discount_pct: '0', is_active: true });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setPromos(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.title) return Alert.alert("Error", "Judul promo wajib diisi");

    const payload = {
      title: form.title,
      description: form.description,
      discount_pct: parseInt(form.discount_pct || 0),
      is_active: form.is_active
    };

    if (isAdding) {
      await supabase.from('promos').insert([payload]);
    } else {
      await supabase.from('promos').update(payload).eq('id', form.id);
    }

    setModalVisible(false);
    fetchPromos();
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Hapus Promo",
      "Apakah Anda yakin ingin menghapus promo ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            await supabase.from('promos').delete().eq('id', id);
            fetchPromos();
          } 
        }
      ]
    );
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('promos').update({ is_active: !currentStatus }).eq('id', id);
    fetchPromos();
  };

  const openModal = (item = null) => {
    if (item) {
      setForm({ ...item, discount_pct: item.discount_pct.toString() });
      setIsAdding(false);
    } else {
      setForm({ id: null, title: '', description: '', discount_pct: '0', is_active: true });
      setIsAdding(true);
    }
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btnAdd} onPress={() => openModal()}>
        <MaterialCommunityIcons name="tag-plus" size={20} color="#FFF" />
        <Text style={styles.btnText}> Tambah Promo Baru</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#3498DB" /> : (
        <FlatList
          data={promos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.is_active && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>{item.title}</Text>
                <Text style={styles.promoDesc}>{item.description}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Diskon {item.discount_pct}%</Text>
                </View>
              </View>
              
              <View style={styles.actionCol}>
                <TouchableOpacity onPress={() => toggleStatus(item.id, item.is_active)}>
                  <MaterialCommunityIcons 
                    name={item.is_active ? "toggle-switch" : "toggle-switch-off"} 
                    size={32} 
                    color={item.is_active ? "#27AE60" : "#BDC3C7"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openModal(item)}>
                  <MaterialCommunityIcons name="pencil" size={24} color="#3498DB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <MaterialCommunityIcons name="trash-can" size={24} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL TAMBAH/EDIT */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isAdding ? 'Tambah' : 'Edit'} Promo</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Judul Promo (Contoh: Diskon Gajian)" 
              value={form.title}
              onChangeText={t => setForm({...form, title: t})}
            />
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              placeholder="Keterangan Promo" 
              multiline
              value={form.description}
              onChangeText={t => setForm({...form, description: t})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Persentase Diskon (%)" 
              keyboardType="numeric"
              value={form.discount_pct}
              onChangeText={t => setForm({...form, discount_pct: t})}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.btnText}>Simpan Promo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelTxt}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  btnAdd: { 
    backgroundColor: '#3498DB', 
    margin: 15, 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3
  },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    marginHorizontal: 15, 
    marginBottom: 10, 
    padding: 15, 
    borderRadius: 15, 
    elevation: 2 
  },
  promoTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  promoDesc: { fontSize: 12, color: '#7F8C8D', marginVertical: 4 },
  badge: { 
    backgroundColor: '#E8F5E9', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 5 
  },
  badgeText: { fontSize: 10, color: '#27AE60', fontWeight: 'bold' },
  actionCol: { justifyContent: 'space-between', alignItems: 'center', width: 40 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8 },
  saveBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  cancelTxt: { color: 'red', textAlign: 'center', marginTop: 15, fontWeight: 'bold' }
});