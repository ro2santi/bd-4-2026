import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomerPromoScreen() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromos = async () => {
      const { data } = await supabase.from('promos').select('*').eq('is_active', true);
      setPromos(data || []);
      setLoading(false);
    };
    fetchPromos();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{flex:1}} color="#E74C3C" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={promos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.badge}><MaterialCommunityIcons name="tag" size={24} color="#FFF" /></View>
            <View style={{ flex: 1, padding: 15 }}>
              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoDesc}>{item.description}</Text>
              <Text style={styles.discount}>Diskon: {item.discount_pct}%</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada promo saat ini.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', padding: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 12, flexDirection: 'row', marginBottom: 15, elevation: 3, overflow: 'hidden' },
  badge: { backgroundColor: '#E74C3C', width: 60, justifyContent: 'center', alignItems: 'center' },
  promoTitle: { fontSize: 16, fontWeight: 'bold' },
  promoDesc: { color: '#7F8C8D', marginVertical: 5 },
  discount: { color: '#E74C3C', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#AAA' }
});