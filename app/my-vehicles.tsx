import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const TAB_BAR_HEIGHT = 65;

type Vehicle = {
  vehicle_id: number;
  nickname?: string;
  year?: number;
  color?: string;
  photo_url?: string;
  make_name: string;
  model_name: string;
};

export default function MyVehiclesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { token } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } catch {
      showToast('error', 'Error', 'Could not load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  return (
    <View style={styles.container}>
      <CenteredHeader title="My Vehicles" titleColor={colors.textPrimary} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="car-off" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptySubtitle}>Add your first vehicle to personalize your experience</Text>
            </View>
          ) : (
            vehicles.map((v) => (
              <Pressable
                key={v.vehicle_id}
                style={styles.vehicleCard}
                onPress={() => router.push({ pathname: '/vehicle-detail', params: { vehicleId: v.vehicle_id.toString() } })}
              >
                <View style={styles.vehicleThumb}>
                  {v.photo_url ? (
                    <Image source={{ uri: v.photo_url }} style={styles.vehicleThumbImg} />
                  ) : (
                    <MaterialCommunityIcons name="car-side" size={32} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{v.nickname || `${v.make_name} ${v.model_name}`}</Text>
                  <Text style={styles.vehicleSub}>
                    {v.year ? `${v.year} ` : ''}{v.make_name} {v.model_name}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
              </Pressable>
            ))
          )}

          {/* Add New Vehicle button */}
          <Pressable
            onPress={() => router.push('/add-vehicle')}
            style={{ marginTop: Spacing.md }}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addBtn}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.addBtnText}>Add New Vehicle</Text>
            </LinearGradient>
          </Pressable>

          <View style={{ height: androidTabOffset + Spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 20 },

  // Vehicle card
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  vehicleThumb: {
    width: 70,
    height: 55,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(30,20,50,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  vehicleThumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  vehicleSub: {
    color: colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  addBtnText: {
    color: colors.white,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },

  // Empty
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.lg,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    marginTop: 4,
    textAlign: 'center',
  },
});
