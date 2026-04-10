import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

const TAB_BAR_HEIGHT = 65;

// ─── Cart row component (needs its own useState for per-image error state) ────
function CartItemRow({ item, onUpdate, onRemove }: {
  item: ReturnType<typeof useCart>['items'][0];
  onUpdate: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const showImage = !!item.image_url && !imgError;

  return (
    <View style={[styles.cartItem, { borderBottomColor: colors.itemSeparator }]}>
      {/* Product thumbnail */}
      <View style={[styles.itemImage, { backgroundColor: colors.imagePlaceholder }]}>
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

      {/* Name & price */}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: colors.pink }]}>{item.price} EGP</Text>
      </View>

      {/* Qty controls + delete */}
      <View style={styles.rightCol}>
        <Pressable onPress={() => onRemove(item.cart_item_id)} style={styles.deleteBtn} hitSlop={8}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onUpdate(item.cart_item_id, item.quantity - 1)}
          >
            <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onUpdate(item.cart_item_id, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CartScreen() {
  const { items, total, loading, fetchCart, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  useEffect(() => { fetchCart(); }, []);

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('warning', 'Empty Cart', 'Add some products first!');
      return;
    }
    showToast('info', 'Coming Soon', 'Checkout flow is being built.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { marginTop: insets.top }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Cart</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{items.length} items</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="cart-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.cart_item_id.toString()}
          renderItem={({ item }) => (
            <CartItemRow
              item={item}
              onUpdate={updateQuantity}
              onRemove={removeItem}
            />
          )}
          estimatedItemSize={84}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: androidTabOffset + 130 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {items.length > 0 && (
        <View style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.itemSeparator,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT,
          },
        ]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{total} EGP</Text>
          </View>
          <Pressable onPress={handleCheckout} style={[styles.checkoutBtn, { backgroundColor: colors.pink }]}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: Spacing.lg, paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xxl, marginBottom: 4 },
  headerSubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },

  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  itemImage: {
    width: 64, height: 64, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  itemInfo: { flex: 1, paddingRight: Spacing.sm },
  itemName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 4 },
  itemPrice: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },

  rightCol: { alignItems: 'flex-end', gap: 8 },
  deleteBtn: { paddingBottom: 2 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontFamily: Fonts.bold, fontSize: FontSizes.md, minWidth: 20, textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
  },
  totalLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: 2 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl },

  checkoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  checkoutText: { fontFamily: Fonts.bold, fontSize: FontSizes.md, color: '#FFFFFF' },

  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginTop: Spacing.md },
});
