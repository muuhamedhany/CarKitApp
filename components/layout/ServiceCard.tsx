import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type ServiceCardProps = {
  name: string;
  providerName?: string;
  price: string | number;
  duration?: number;
  rating?: number;
  reviewCount?: number;
  onBookNow?: () => void;
  onView?: () => void;
};

export default function ServiceCard({
  name,
  providerName,
  price,
  duration,
  rating,
  reviewCount,
  onBookNow,
  onView,
}: ServiceCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
          {providerName && (
            <Text style={[styles.provider, { color: colors.textMuted }]} numberOfLines={1}>{providerName}</Text>
          )}
        </View>
        <Text style={[styles.price, { color: colors.pink }]}>{price} EGP</Text>
      </View>

      <View style={styles.metaRow}>
        {rating !== undefined && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{rating.toFixed(1)}</Text>
          </View>
        )}
        {duration !== undefined && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{duration}mins</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onBookNow && (
          <Pressable onPress={onBookNow} style={styles.bookButton}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </LinearGradient>
          </Pressable>
        )}
        {onView && (
          <Pressable onPress={onView} style={[styles.viewButton, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.viewButtonText, { color: colors.purpleLight }]}>View</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: { flex: 1, marginRight: Spacing.sm },
  name: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
  provider: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  price: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  actions: { flexDirection: 'row', gap: 8 },
  bookButton: { borderRadius: BorderRadius.sm, overflow: 'hidden', flex: 1 },
  bookButtonGradient: { paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.sm },
  bookButtonText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  viewButton: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: BorderRadius.sm, borderWidth: 1,
  },
  viewButtonText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
});
