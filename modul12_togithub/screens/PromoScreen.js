import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  TextInput, Modal, Alert, ActivityIndicator, Linking, SafeAreaView 
} from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Import service AI yang sudah diperbaiki logika pembersihan JSON-nya
import { generatePromoAI } from '../services/aiService';

export default function PromoScreen() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false); // State untuk loading AI
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', description: '', discount_pct: '0', is_active: true });
  const [aiKeyword, setAiKeyword] = useState(''); // State untuk keyword AI

  // State untuk Fitur Blast
  const [blastModalVisible, setBlastModalVisible] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);

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

  // --- PERBAIKAN FUNGSI GENERATE AI ---
  const handleGenerateAI = async () => {
    if (!aiKeyword) return Alert.alert("Input Kosong", "Masukkan tema promo (contoh: Ramadhan)");
    
    setAiLoading(true);
    try {
      // Memanggil fungsi dari aiService
      const result = await generatePromoAI(aiKeyword);
      
      // Mengisi form secara otomatis dengan hasil AI
      setForm({
        ...form,
        title: result.title || '',
        description: result.description || '',
        discount_pct: (result.discount_pct || 0).toString()
      });
      
      setAiKeyword(''); // Bersihkan input keyword setelah berhasil
      Alert.alert("Sukses", "Promo berhasil dibuat oleh AI!");
    } catch (error) {
      // Menampilkan pesan error yang lebih spesifik jika gagal
      console.error("AI Screen Error:", error.message);
      Alert.alert("Gagal AI", "Error: " + error.message + "\n\nPastikan API Key di services/aiService.js sudah benar.");
    }
    setAiLoading(false);
  };

  // --- FUNGSI WA BLAST ---
  const prepareBlast = async (promo) => {
    setLoading(true);
    try {
      const { data: members } = await supabase.from('users').select('full_name, phone').neq('role', 'admin');
      const { data: guests } = await supabase.from('customers').select('name, phone');

      const list = [
        ...(members || []).map(m => ({ name: m.full_name, phone: m.phone, type: 'Member' })),
        ...(guests || []).map(g => ({ name: g.name, phone: g.phone, type: 'Tamu' }))
      ].filter(p => p.phone);

      if (list.length === 0) {
        Alert.alert("Info", "Tidak ada database pelanggan.");
      } else {
        setRecipients(list);
        setSelectedPromo(promo);
        setBlastModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  const sendSingleWA = (item) => {
    const message = `📢 *PROMO: ${selectedPromo.title}* 📢\n\n${selectedPromo.description}\n\n🔥 *DISKON ${selectedPromo.discount_pct}%* 🔥\n\nHubungi kami untuk pesan sekarang!`;
    let formattedPhone = item.phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '62' + formattedPhone.slice(1);
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Gagal membuka WhatsApp."));
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
    Alert.alert("Hapus Promo", "Yakin ingin menghapus ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          await supabase.from('promos').delete().eq('id', id);
          fetchPromos();
      }}
    ]);
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

      {loading && <ActivityIndicator size="large" color="#3498DB" />}
      
      <FlatList
        data={promos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && { opacity: 0.6 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoDesc}>{item.description}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>Diskon {item.discount_pct}%</Text></View>
            </View>
            
            <View style={styles.actionCol}>
              <TouchableOpacity onPress={() => prepareBlast(item)}>
                <MaterialCommunityIcons name="whatsapp" size={26} color="#25D366" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => toggleStatus(item.id, item.is_active)}>
                <MaterialCommunityIcons 
                  name={item.is_active ? "toggle-switch" : "toggle-switch-off"} 
                  size={28} 
                  color={item.is_active ? "#27AE60" : "#BDC3C7"} 
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openModal(item)}>
                <MaterialCommunityIcons name="pencil" size={22} color="#3498DB" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                <MaterialCommunityIcons name="trash-can" size={22} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* MODAL LIST BLAST */}
      <Modal visible={blastModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
          <View style={styles.blastHeader}>
            <Text style={styles.blastTitle}>Pilih Penerima WA</Text>
            <TouchableOpacity onPress={() => setBlastModalVisible(false)}>
              <MaterialCommunityIcons name="close-circle" size={32} color="red" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={recipients}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.recipientCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recName}>{item.name}</Text>
                  <Text style={styles.recPhone}>{item.phone} ({item.type})</Text>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={() => sendSingleWA(item)}>
                  <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                  <Text style={styles.sendBtnTxt}>Kirim</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* MODAL FORM TAMBAH/EDIT DENGAN AI */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isAdding ? 'Tambah' : 'Edit'} Promo</Text>
            
            {/* PERBAIKAN INPUT KEYWORD AI */}
            <View style={styles.aiBox}>
              <TextInput 
                style={styles.aiInput} 
                placeholder="Tema AI (misal: Weekend)" 
                value={aiKeyword}
                onChangeText={setAiKeyword}
              />
              <TouchableOpacity style={styles.aiBtn} onPress={handleGenerateAI} disabled={aiLoading}>
                {aiLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <>
                    <MaterialCommunityIcons name="robot" size={18} color="#FFF" />
                    <Text style={styles.aiBtnTxt}> AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Judul Promo" value={form.title} onChangeText={t => setForm({...form, title: t})} />
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Deskripsi" multiline value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={styles.input} placeholder="Diskon (%)" keyboardType="numeric" value={form.discount_pct} onChangeText={t => setForm({...form, discount_pct: t})} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.btnText}>Simpan Promo</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop:15}}><Text style={{color:'red', textAlign:'center'}}>Batal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  btnAdd: { backgroundColor: '#3498DB', margin: 15, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 15, elevation: 2 },
  promoTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  promoDesc: { fontSize: 12, color: '#7F8C8D', marginVertical: 4 },
  badge: { backgroundColor: '#E8F5E9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 10, color: '#27AE60', fontWeight: 'bold' },
  actionCol: { justifyContent: 'space-between', alignItems: 'center', width: 45 },
  
  // AI Section
  aiBox: { flexDirection: 'row', backgroundColor: '#F0F3F4', borderRadius: 10, padding: 5, marginBottom: 15, alignItems: 'center' },
  aiInput: { flex: 1, paddingHorizontal: 10, fontSize: 13 },
  aiBtn: { backgroundColor: '#8E44AD', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  aiBtnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  // Blast Section
  blastHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  blastTitle: { fontSize: 18, fontWeight: 'bold' },
  recipientCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, marginHorizontal: 10, marginBottom: 8, borderRadius: 10, alignItems: 'center' },
  recName: { fontWeight: 'bold', fontSize: 15 },
  recPhone: { fontSize: 12, color: '#7F8C8D' },
  sendBtn: { backgroundColor: '#27AE60', flexDirection: 'row', padding: 8, borderRadius: 8, alignItems: 'center' },
  sendBtnTxt: { color: '#FFF', marginLeft: 5, fontWeight: 'bold', fontSize: 12 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8 },
  saveBtn: { backgroundColor: '#3498DB', padding: 15, borderRadius: 10, alignItems: 'center' }
});