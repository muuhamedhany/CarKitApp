import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Props = {
  name: string;
  price: string | number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
  fullWidth?: boolean;
};

export default function ProductCard({
  name, price, imageUrl, rating, reviewCount, onPress, onAddToCart, fullWidth,
}: Props) {
  const renderStars = (r: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= Math.round(r) ? 'star' : 'star-outline'}
          size={12}
          color={i <= Math.round(r) ? '#FFD700' : Colors.textMuted}
        />
      );
    }
    return stars;
  };

  return (
    <Pressable style={[styles.card, fullWidth && { width: '100%' }]} onPress={onPress}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="car-brake-parking" size={40} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.price}>{price} EGP</Text>
        {rating !== undefined && (
          <View style={styles.ratingRow}>
            {renderStars(rating)}
            {reviewCount !== undefined && (
              <Text style={styles.reviewCount}>({reviewCount})</Text>
            )}
          </View>
        )}
      </View>
      {onAddToCart && (
        <Pressable onPress={onAddToCart} style={styles.addBtn}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addBtnGradient}
          >
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </LinearGradient>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  info: {
    padding: Spacing.sm,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  price: {
    color: Colors.pink,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: Fonts.regular,
    marginLeft: 4,
  },
  addBtn: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  addBtnGradient: {
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
  },
});
