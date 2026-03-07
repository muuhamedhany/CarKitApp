import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '@/constants/config';

type CartItem = {
  cart_item_id: number;
  product_id_fk: number;
  quantity: number;
  name: string;
  price: string;
  stock: number;
  item_total: string;
};

type CartData = {
  cart_id: number;
  items: CartItem[];
  total: string;
};

type CartContextType = {
  cart: CartData | null;
  isLoading: boolean;
  cartCount: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<{ success: boolean; message: string }>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<{ success: boolean; message: string }>;
  removeItem: (cartItemId: number) => Promise<{ success: boolean; message: string }>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const fetchCart = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/cart`, { headers: headers() });
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [token, headers]);

  const addToCart = useCallback(async (productId: number, quantity: number = 1) => {
    if (!token) return { success: false, message: 'Not logged in.' };
    try {
      const res = await fetch(`${API_URL}/cart/items`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart();
        return { success: true, message: 'Added to cart!' };
      }
      return { success: false, message: data.message || 'Failed to add.' };
    } catch {
      return { success: false, message: 'Network error.' };
    }
  }, [token, headers, fetchCart]);

  const updateQuantity = useCallback(async (cartItemId: number, quantity: number) => {
    if (!token) return { success: false, message: 'Not logged in.' };
    try {
      const res = await fetch(`${API_URL}/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart();
        return { success: true, message: 'Cart updated.' };
      }
      return { success: false, message: data.message || 'Failed to update.' };
    } catch {
      return { success: false, message: 'Network error.' };
    }
  }, [token, headers, fetchCart]);

  const removeItem = useCallback(async (cartItemId: number) => {
    if (!token) return { success: false, message: 'Not logged in.' };
    try {
      const res = await fetch(`${API_URL}/cart/items/${cartItemId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart();
        return { success: true, message: 'Item removed.' };
      }
      return { success: false, message: data.message || 'Failed to remove.' };
    } catch {
      return { success: false, message: 'Network error.' };
    }
  }, [token, headers, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/cart/clear`, {
        method: 'DELETE',
        headers: headers(),
      });
      setCart(null);
    } catch {
      // silently fail
    }
  }, [token, headers]);

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart, isLoading, cartCount,
      fetchCart, addToCart, updateQuantity, removeItem, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}
