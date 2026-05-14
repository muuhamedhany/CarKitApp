import { CartSkeleton, GlassView, SecondaryButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTabReload } from '@/hooks/useTabReload';
import { useTheme } from '@/hooks/useTheme';
import { CartItem } from '@/types/api.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;

// ─── Memoized Cart Row Component ─────────────────────────────────────────────
const CartItemRow = memo(({ item, index, onUpdate, onRemove }: {
  item: CartItem;
  index: number;
  onUpdate: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) => {
  const { colors, isDark } = useTheme();
  const [imgError, setImgError] = useState(false);
  const showImage = !!item.image_url && !imgError;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(400)}
      exiting={FadeOut.duration(300)}
      layout={Layout.springify().damping(20)}
    >
      <GlassView
        intensity={isDark ? 20 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.cartItem, { borderColor: colors.cardBorder }]}
      >
        <View style={[styles.itemImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          {showImage ? (
            <Image
              source={{ uri: item.image_url! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <MaterialCommunityIcons name="car-cog" size={28} color={colors.textMuted} />
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemPrice, { color: colors.pink }]}>{item.price} EGP</Text>

          <View style={styles.qtyRow}>
            <Pressable
              style={({ pressed }) => [
                styles.qtyBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  opacity: pressed ? 0.6 : 1
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onUpdate(item.cart_item_id, item.quantity - 1);
              }}
            >
              <MaterialCommunityIcons name="minus" size={14} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.qtyBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  opacity: (pressed || item.quantity >= item.stock) ? 0.4 : 1
                }
              ]}
              disabled={item.quantity >= item.stock}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onUpdate(item.cart_item_id, item.quantity + 1);
              }}
            >
              <MaterialCommunityIcons name="plus" size={14} color={item.quantity >= item.stock ? colors.textMuted : colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onRemove(item.cart_item_id);
          }}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 77, 77, 0.08)' : 'rgba(255, 77, 77, 0.04)',
              opacity: pressed ? 0.5 : 1
            }
          ]}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF4D4D" />
        </Pressable>
      </GlassView>
    </Animated.View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CartScreen() {
  const router = useRouter();
  const { items, total, loading, fetchCart, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;
  const listRef = useRef<any>(null);

  useTabReload('cart', () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    fetchCart();
  });

  useEffect(() => { fetchCart(); }, []);

  const handleUpdateQuantity = useCallback(async (id: number, qty: number) => {
    // Note: The context now handles optimistic updates, so this returns instantly
    const res = await updateQuantity(id, qty);
    if (res && !res.success && res.message) {
      showToast('error', 'Limit Reached', res.message);
    }
  }, [updateQuantity, showToast]);

  const handleRemoveItem = useCallback(async (id: number) => {
    await removeItem(id);
  }, [removeItem]);

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('warning', 'Empty Cart', 'Add some products first!');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/checkout');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '12' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '08' }]} />

      <View style={[styles.header, { marginTop: insets.top + 10 }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Cart</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Pressable
            style={({ pressed }) => [
              styles.headerAction,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.7 : 1
              }
            ]}
            onPress={() => router.push('/(tabs)/search')}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.pink} />
          </Pressable>
        </Animated.View>
      </View>

      {loading ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.center}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.pink + '10' }]}>
            <MaterialCommunityIcons name="cart-variant" size={48} color={colors.pink} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Explore our shop to find the best parts for your car.</Text>
          <View style={{ marginTop: Spacing.xxl, width: 220 }}>
            <SecondaryButton title="Start Shopping" onPress={() => router.push('/(tabs)/search')} />
          </View>
        </Animated.View>
      ) : (
        <FlashList
          ref={listRef}
          data={items}
          estimatedItemSize={120}
          keyExtractor={(item) => item.cart_item_id.toString()}
          renderItem={({ item, index }) => (
            <CartItemRow
              item={item}
              index={index}
              onUpdate={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: 10,
            paddingBottom: androidTabOffset + 200
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {items.length > 0 && (
        <Animated.View
          entering={FadeInUp.delay(400).duration(800)}
          style={[styles.bottomContainer, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 15 }]}
        >
          <GlassView
            intensity={isDark ? 30 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={styles.bottomBlur}
          >
            <View style={styles.bottomBar}>
              <View style={{ alignItems: 'flex-start', flexShrink: 1, marginRight: Spacing.md }}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>TOTAL AMOUNT</Text>
                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{parseFloat(total).toLocaleString()} EGP</Text>
              </View>
              <Pressable
                onPress={handleCheckout}
                style={({ pressed }) => [
                  styles.checkoutBtn,
                  {
                    backgroundColor: colors.pink,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
              >
                <Text style={styles.checkoutText}>Checkout</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </Pressable>
            </View>
          </GlassView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md },

  header: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xxxl,
    letterSpacing: -1
  },
  headerSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginTop: -4,
    opacity: 0.6
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
    marginBottom: 10,
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    minWidth: 24,
    textAlign: 'center'
  },

  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
  },
  bottomBlur: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  totalLabel: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
    opacity: 0.5,
  },
  totalValue: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },

  checkoutBtn: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  checkoutText: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
    color: '#FFFFFF'
  },

  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xl,
    marginTop: Spacing.md,
    letterSpacing: -0.5
  },
  emptySubtitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.6,
  },
});
