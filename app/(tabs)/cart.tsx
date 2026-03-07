import { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

export default function CartScreen() {
  const { cart, isLoading, fetchCart, updateQuantity, removeItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => { fetchCart(); }, []);

  const handleUpdateQty = async (cartItemId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      const res = await removeItem(cartItemId);
      if (res.success) showToast('info', 'Removed', 'Item removed from cart.');
    } else {
      await updateQuantity(cartItemId, newQty);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    const res = await removeItem(cartItemId);
    if (res.success) showToast('info', 'Removed', 'Item removed from cart.');
  };

  if (isLoading && !cart) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.pink} />
      </View>
    );
  }

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="cart-off" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Browse products and add items to your cart</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => String(item.cart_item_id)}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 180 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                {/* Thumbnail */}
                <View style={styles.thumbnail}>
                  <MaterialCommunityIcons name="car-brake-parking" size={32} color={Colors.textMuted} />
                </View>

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price} EGP</Text>
                  {/* Qty controls */}
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQty(item.cart_item_id, item.quantity, -1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Remove */}
                <Pressable style={styles.removeBtn} onPress={() => handleRemove(item.cart_item_id)}>
                  <MaterialCommunityIcons name="close-circle-outline" size={24} color={Colors.pink} />
                </Pressable>
              </View>
            )}
          />

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{total} EGP</Text>
            </View>
            <Pressable style={styles.checkoutBtn}>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginTop: Spacing.xs,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  itemPrice: {
    color: Colors.pink,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyBtnText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
  qtyValue: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
    marginHorizontal: Spacing.md,
  },
  removeBtn: {
    padding: Spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
  },
  totalAmount: {
    color: Colors.pink,
    fontSize: FontSizes.xl,
    fontFamily: Fonts.extraBold,
  },
  checkoutBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  checkoutGradient: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: BorderRadius.xl,
  },
  checkoutText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
});
