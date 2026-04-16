import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing } from '@/constants/theme';

type ProductCardProps = {
  productId?: number;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  vendorName?: string;
  onPress?: () => void;
  onAddToCart?: () => void;
};

export default function ProductCard({
  productId,
  name,
  price,
  imageUrl,
  rating,
  reviewCount,
  vendorName,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(!!imageUrl);
  const { wishlist, toggleWishlist: contextToggleWishlist } = useWishlist();
  const isWishlisted = productId ? !!wishlist[productId] : false;

  const handleToggleWishlist = () => {
    if (!productId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    contextToggleWishlist(productId);
  };

  const showImage = !!imageUrl && !imgError;

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
      onPress={onPress}
    >
      {/* Image / Placeholder */}
      <View style={[styles.imageContainer, { backgroundColor: colors.imagePlaceholder }]}>
        {showImage ? (
          <>
            <Image
              source={{ uri: imageUrl! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onLoad={() => setImgLoading(false)}
              onError={() => { setImgError(true); setImgLoading(false); }}
            />
            {imgLoading && (
              <ActivityIndicator
                size="small"
                color={colors.pink}
                style={styles.imgLoader}
              />
            )}
          </>
        ) : (
          <MaterialCommunityIcons name="car-wrench" size={40} color={colors.textMuted} />
        )}
        {productId && (
          <Pressable 
            style={styles.favoriteCardIcon}
            onPress={handleToggleWishlist}
            hitSlop={8}
          >
            <MaterialCommunityIcons 
              name={isWishlisted ? "cards-heart" : "cards-heart-outline"} 
              size={18} 
              color={isWishlisted ? colors.pink : '#FFF'} 
            />
          </Pressable>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        {vendorName && (
          <Text style={[styles.vendor, { color: colors.textMuted }]} numberOfLines={1}>
            {vendorName}
          </Text>
        )}

        {rating !== undefined && (
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
            <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
              {rating.toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>{price} EGP</Text>
          {onAddToCart && (
            <Pressable onPress={onAddToCart} style={styles.addButton} hitSlop={8}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.pink} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imgLoader: {
    ...StyleSheet.absoluteFillObject as any,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: Spacing.md },
  name: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 2 },
  vendor: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewCount: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginLeft: 4 },
  addButton: { padding: 4 },
  favoriteCardIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
  },
});
