import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius, Shadows, Colors } from '@/constants/theme';

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
  const { colors, isDark } = useTheme();
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
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,1)', 
            borderColor: colors.cardBorder 
          },
          Shadows.md
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Image / Placeholder */}
        <View style={[styles.imageContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7' }]}>
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
              colors={isDark ? ['#1A0B2E', '#2D1B4E'] : ['#F8F0FF', '#EBE0FF']}
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
                { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }
              ]}
              onPress={handleToggleWishlist}
              hitSlop={8}
            >
              <MaterialCommunityIcons 
                name={isWishlisted ? "cards-heart" : "cards-heart-outline"} 
                size={18} 
                color={isWishlisted ? colors.pink : (isDark ? '#FFF' : '#000')} 
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
            <Text style={[styles.vendor, { color: colors.textSecondary }]} numberOfLines={1}>
              {vendorName}
            </Text>
          )}

          <View style={styles.bottomRow}>
            <View style={{ flex: 1 }}>
              {rating !== undefined && (
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
                  <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                    {rating.toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
                  </Text>
                </View>
              )}
              <Text style={[styles.price, { color: colors.textPrimary }]}>{typeof price === 'number' ? price.toLocaleString() : price} <Text style={styles.currency}>EGP</Text></Text>
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
    margin: 6,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  info: { padding: Spacing.md },
  name: { fontFamily: Fonts.extraBold, fontSize: FontSizes.md, marginBottom: 2, letterSpacing: -0.3 },
  vendor: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 8, opacity: 0.6 },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 2 
  },
  price: { fontFamily: Fonts.extraBold, fontSize: FontSizes.md, letterSpacing: -0.5 },
  currency: { fontSize: 10, fontFamily: Fonts.bold, opacity: 0.7 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  reviewCount: { fontFamily: Fonts.bold, fontSize: 10, marginLeft: 2, opacity: 0.7 },
  addButton: { 
    width: 34, 
    height: 34, 
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    shadowColor: Colors.pink,
  },
  favoriteCardIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 14,
    padding: 8,
    ...Shadows.sm,
  },
});

