import Text from '@/components/common/LocalizedText';
import {
  BorderRadius,
  Fonts,
  FontSizes,
  Shadows,
  Spacing
} from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

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
  isCompatible?: boolean;
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
  isCompatible,
}: ProductCardProps) {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(!!imageUrl);
  const { wishlist, toggleWishlist: contextToggleWishlist } = useWishlist();
  const isWishlisted = productId ? !!wishlist[productId] : false;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const handleToggleWishlist = () => {
    if (!productId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    contextToggleWishlist(productId);
  };

  const showImage = !!imageUrl && !imgError;

  return (
    <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder
          },
          Shadows.md
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Image / Placeholder */}
        <View style={[styles.imageContainer, { backgroundColor: colors.imagePlaceholder, borderBottomColor: colors.dividerLine }]}>
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
                <View style={styles.imgLoader}>
                  <ActivityIndicator size="small" color={colors.pink} />
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={isDark ? [colors.backgroundSecondary, colors.background] : [colors.surfaceMuted, colors.accentSoft]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.placeholderIcon}>
                <MaterialCommunityIcons name="car-wrench" size={40} color={colors.pink + '40'} />
              </View>
            </LinearGradient>
          )}

          {productId && (
            <Pressable
              style={[
                styles.favoriteCardIcon,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : colors.surfaceElevated, borderColor: colors.cardBorder }
              ]}
              onPress={handleToggleWishlist}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={isWishlisted ? "cards-heart" : "cards-heart-outline"}
                size={18}
                color={isWishlisted ? colors.pink : colors.textPrimary}
              />
            </Pressable>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
              {name}
            </Text>
            {vendorName && (
              <Text style={[styles.vendor, { color: colors.textSecondary }]} numberOfLines={1}>
                {vendorName}
              </Text>
            )}

            {isCompatible && (
              <View style={[styles.compatibilityBadge, { backgroundColor: colors.pink + '15', borderColor: colors.pink + '40', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MaterialCommunityIcons name="check-decagram" size={12} color={colors.pink} style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                <Text style={[styles.compatibilityText, { color: colors.pink }]}>
                  {t('search.fitsYourVehicle')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomRow}>
            <View style={{ flex: 1 }}>
              {rating !== undefined && rating !== null && (
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
                  <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                    {Number(rating).toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
                  </Text>
                </View>
              )}
              <Text style={[styles.price, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {typeof price === 'number' ? price.toLocaleString() : price} <Text style={styles.currency}>{t('product.card.currency')}</Text>
              </Text>
            </View>

            {onAddToCart && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAddToCart();
                }}
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: colors.pink,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.92 : 1 }]
                  }
                ]}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    flex: 1,
    margin: 3,
  },
  card: {
    flex: 1,
    minHeight: 290,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Platform.select({
      ios: { overflow: 'hidden' as const },
      android: { overflow: 'hidden' as const, elevation: 0 },
    }),
  },
  imageContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  placeholderIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgLoader: {
    ...StyleSheet.absoluteFillObject as any,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  info: { padding: Spacing.md, flex: 1, justifyContent: 'space-between' },
  name: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: 2 },
  vendor: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 8, opacity: 0.5 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs
  },
  price: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  currency: { fontSize: 10, fontFamily: Fonts.bold, opacity: 0.6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  reviewCount: { fontFamily: Fonts.bold, fontSize: 10, marginLeft: 2, opacity: 0.6 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  favoriteCardIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    ...Shadows.sm,
  },
  compatibilityBadge: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
  },
  compatibilityText: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
  },
});

