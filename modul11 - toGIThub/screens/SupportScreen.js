import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SupportScreen() {
  const contactWA = () => Linking.openURL('whatsapp://send?phone=628123456789&text=Halo Bantuan UMKM...');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Tentang UMKM HUB</Text>
        <Text style={styles.text}>Platform ini dibuat untuk mendukung pertumbuhan ekonomi lokal melalui digitalisasi produk UMKM unggulan.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Pusat Bantuan</Text>
        <TouchableOpacity style={styles.item} onPress={contactWA}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
          <Text style={styles.itemText}>Hubungi Admin via WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <MaterialCommunityIcons name="email-outline" size={24} color="#3498DB" />
          <Text style={styles.itemText}>Email: support@umkmhub.com</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 20, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2C3E50' },
  text: { lineHeight: 22, color: '#7F8C8D' },
  item: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  itemText: { marginLeft: 15, fontSize: 16, color: '#2C3E50' }
});