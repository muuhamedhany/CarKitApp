import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type ServiceCardProps = {
  name: string;
  providerName?: string;
  price: string | number;
  duration?: number; // in minutes
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
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {providerName && (
            <Text style={styles.provider} numberOfLines={1}>{providerName}</Text>
          )}
        </View>
        <Text style={styles.price}>{price} EGP</Text>
      </View>

      <View style={styles.metaRow}>
        {rating !== undefined && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
            <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
          </View>
        )}
        {duration !== undefined && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{duration}mins</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onBookNow && (
          <Pressable onPress={onBookNow} style={styles.bookButton}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </LinearGradient>
          </Pressable>
        )}
        {onView && (
          <Pressable onPress={onView} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    color: Colors.textPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  provider: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  price: {
    color: Colors.pink,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookButton: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    flex: 1,
  },
  bookButtonGradient: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  bookButtonText: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  viewButtonText: {
    color: Colors.purpleLight,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
});
