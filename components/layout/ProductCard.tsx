import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type ProductCardProps = {
  name: string;
  price: string | number;
  rating?: number;
  reviewCount?: number;
  vendorName?: string;
  onPress?: () => void;
  onAddToCart?: () => void;
};

export default function ProductCard({
  name,
  price,
  rating,
  reviewCount,
  vendorName,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]} onPress={onPress}>
      <View style={[styles.imageContainer, { backgroundColor: colors.imagePlaceholder }]}>
        <MaterialCommunityIcons name="car-wrench" size={40} color={colors.textMuted} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
        {vendorName && (
          <Text style={[styles.vendor, { color: colors.textMuted }]} numberOfLines={1}>{vendorName}</Text>
        )}
        <Text style={[styles.price, { color: colors.pink }]}>{price} EGP</Text>

        {rating !== undefined && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name={star <= Math.round(rating) ? 'star' : 'star-outline'}
                size={14}
                color={star <= Math.round(rating) ? '#FFD700' : colors.textMuted}
              />
            ))}
            {reviewCount !== undefined && (
              <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({reviewCount})</Text>
            )}
          </View>
        )}

        {onAddToCart && (
          <Pressable onPress={onAddToCart} style={styles.addButton}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    margin: 4,
  },
  imageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: Spacing.sm },
  name: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: 2 },
  vendor: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginBottom: 4 },
  price: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewCount: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginLeft: 4 },
  addButton: { borderRadius: BorderRadius.sm, overflow: 'hidden' },
  addButtonGradient: {
    paddingVertical: 6, paddingHorizontal: 12,
    alignItems: 'center', borderRadius: BorderRadius.sm,
  },
  addButtonText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },
});
