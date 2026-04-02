import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const TAB_BAR_HEIGHT = 65;

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

  const renderItem = ({ item }: { item: typeof items[0] }) => (
    <View style={[styles.cartItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
      <View style={[styles.itemImage, { backgroundColor: colors.imagePlaceholder }]}>
        <MaterialCommunityIcons name="car-wrench" size={28} color={colors.textMuted} />
      </View>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemPrice, { color: colors.pink }]}>{item.price} EGP</Text>

        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: colors.purpleGlow }]}
            onPress={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.purpleLight} />
          </Pressable>
          <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: colors.purpleGlow }]}
            onPress={() => {
              if (item.quantity <= 1) {
                removeItem(item.cart_item_id);
              } else {
                updateQuantity(item.cart_item_id, item.quantity - 1);
              }
            }}
          >
            <MaterialCommunityIcons name="minus" size={16} color={colors.purpleLight} />
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.removeBtn} onPress={() => removeItem(item.cart_item_id)}>
        <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.pink} />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Cart</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="cart-off" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Browse products and add items to your cart</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.cart_item_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: androidTabOffset + 130 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + (Platform.OS === 'android' ? 25 : 0) }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.pink }]}>{total} EGP</Text>
        </View>
        <Pressable onPress={handleCheckout} style={styles.checkoutBtn}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutGradient}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.lg },

  header: {
    paddingTop: 60, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },

  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  itemImage: {
    width: 70, height: 70, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: 4 },
  itemPrice: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontFamily: Fonts.bold, fontSize: FontSizes.md, minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: Spacing.sm },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1.5,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  totalLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  totalValue: { fontFamily: Fonts.bold, fontSize: FontSizes.xxl },
  checkoutBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  checkoutGradient: {
    paddingVertical: 14, paddingHorizontal: 36,
    borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  checkoutText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: FontSizes.md },

  emptyTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4 },
});
