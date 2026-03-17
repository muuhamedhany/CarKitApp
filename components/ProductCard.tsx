import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

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
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Placeholder image area */}
      <View style={styles.imageContainer}>
        <MaterialCommunityIcons name="car-wrench" size={40} color={Colors.textMuted} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        {vendorName && (
          <Text style={styles.vendor} numberOfLines={1}>{vendorName}</Text>
        )}
        <Text style={styles.price}>{price} EGP</Text>

        {rating !== undefined && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name={star <= Math.round(rating) ? 'star' : 'star-outline'}
                size={14}
                color={star <= Math.round(rating) ? '#FFD700' : Colors.textMuted}
              />
            ))}
            {reviewCount !== undefined && (
              <Text style={styles.reviewCount}>({reviewCount})</Text>
            )}
          </View>
        )}

        {onAddToCart && (
          <Pressable onPress={onAddToCart} style={styles.addButton}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
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
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    margin: 4,
  },
  imageContainer: {
    height: 120,
    backgroundColor: 'rgba(30, 20, 50, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: Spacing.sm,
  },
  name: {
    color: Colors.textPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    marginBottom: 2,
  },
  vendor: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  price: {
    color: Colors.pink,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCount: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginLeft: 4,
  },
  addButton: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: Colors.white,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
});
