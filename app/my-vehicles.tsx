import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Vehicle = {
  vehicle_id: number;
  year: number;
  make_name: string;
  model_name: string;
};

export default function MyVehiclesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } catch {} finally { setLoading(false); }
  }, [token]);

  // Refresh when screen comes into focus
  useFocusEffect(useCallback(() => { fetchVehicles(); }, [fetchVehicles]));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => String(item.vehicle_id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.vehicleCard}>
              {/* Thumbnail */}
              <View style={styles.thumbnail}>
                <MaterialCommunityIcons name="car-side" size={32} color={Colors.textMuted} />
              </View>
              {/* Info */}
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{item.model_name || 'My Car'}</Text>
                <Text style={styles.vehicleDetail}>
                  {item.year} {item.make_name} {item.model_name}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="car-off" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No vehicles added yet</Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push('/add-vehicle' as any)}
            >
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtnGradient}
              >
                <Text style={styles.addBtnText}>+ Add New Vehicle</Text>
              </LinearGradient>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: Colors.white, fontSize: FontSizes.lg, fontFamily: Fonts.bold },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumbnail: {
    width: 70,
    height: 55,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
  vehicleDetail: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    marginTop: Spacing.md,
  },
  addBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  addBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
});
