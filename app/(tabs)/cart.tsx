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
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const TAB_BAR_HEIGHT = 65;

export default function CartScreen() {
  const { items, total, loading, fetchCart, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();
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
    <View style={styles.cartItem}>
      {/* Product image placeholder */}
      <View style={styles.itemImage}>
        <MaterialCommunityIcons name="car-wrench" size={28} color={Colors.textMuted} />
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} EGP</Text>

        {/* Quantity controls */}
        <View style={styles.qtyRow}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={16} color={Colors.purpleLight} />
          </Pressable>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => {
              if (item.quantity <= 1) {
                removeItem(item.cart_item_id);
              } else {
                updateQuantity(item.cart_item_id, item.quantity - 1);
              }
            }}
          >
            <MaterialCommunityIcons name="minus" size={16} color={Colors.purpleLight} />
          </Pressable>
        </View>
      </View>

      {/* Remove button */}
      <Pressable style={styles.removeBtn} onPress={() => removeItem(item.cart_item_id)}>
        <MaterialCommunityIcons name="close-circle-outline" size={22} color={Colors.pink} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="cart-off" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Browse products and add items to your cart</Text>
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

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + (Platform.OS === 'android' ? 25 : 0) }]}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{total} EGP</Text>
        </View>
        <Pressable onPress={handleCheckout} style={styles.checkoutBtn}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
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
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.lg },

  // Header
  header: {
    paddingTop: 60, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary, fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
  },

  // Cart item
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  itemImage: {
    width: 70, height: 70, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(30,20,50,0.5)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: { flex: 1 },
  itemName: { color: Colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: 4 },
  itemPrice: { color: Colors.pink, fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(156,39,176,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.md, minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: Spacing.sm },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderTopWidth: 1.5, borderTopColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  totalLabel: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  totalValue: { color: Colors.pink, fontFamily: Fonts.bold, fontSize: FontSizes.xxl },
  checkoutBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  checkoutGradient: {
    paddingVertical: 14, paddingHorizontal: 36,
    borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  checkoutText: { color: Colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  // Empty
  emptyTitle: { color: Colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtitle: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4 },
});
