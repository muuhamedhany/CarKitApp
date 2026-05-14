import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '@/constants/config';
import { CartItem } from '@/types/api.types';

// Timeout wrapper — Render free tier can be slow to wake up
const fetchWithTimeout = (url: string, options: RequestInit = {}, ms = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};


type CartContextType = {
  items: CartItem[];
  total: string;
  cartCount: number;
  loading: boolean;
  fetchCart: (silent?: boolean) => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<{ success: boolean; message: string }>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<{ success: boolean; message: string }>;
  removeItem: (cartItemId: number) => Promise<void>;
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
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState('0.00');
  const [loading, setLoading] = useState(false);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchCart = useCallback(async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      const res = await fetchWithTimeout(`${API_URL}/cart`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setTotal(data.data.total || '0.00');
      }
    } catch {
      // silently fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, authHeaders]);

  const addToCart = useCallback(async (productId: number, quantity = 1) => {
    if (!token) return { success: false, message: 'Not logged in.' };
    
    try {
      const existingItem = items.find(i => i.product_id_fk === productId);
      if (existingItem) {
        if (existingItem.quantity + quantity > existingItem.stock) {
          return { 
            success: false, 
            message: `Cannot add more. Only ${existingItem.stock} items in stock.` 
          };
        }
      }

      const res = await fetchWithTimeout(`${API_URL}/cart/items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart(true); // Silent refresh
        return { success: true, message: 'Added to cart!' };
      }
      return { success: false, message: data.message || 'Failed to add.' };
    } catch {
      return { success: false, message: 'Server is waking up, please try again.' };
    }
  }, [token, authHeaders, fetchCart, items]);

  const updateQuantity = useCallback(async (cartItemId: number, quantity: number) => {
    if (!token) return { success: false, message: 'Not logged in.' };
    
    const originalItems = [...items];
    const originalTotal = total;

    if (quantity <= 0) {
      await removeItem(cartItemId);
      return { success: true, message: 'Item removed.' };
    }

    const item = items.find(i => i.cart_item_id === cartItemId);
    if (item && quantity > item.stock) {
      return { success: false, message: `Only ${item.stock} items available.` };
    }

    // --- Optimistic Update ---
    setItems(prev => prev.map(i => i.cart_item_id === cartItemId ? { ...i, quantity } : i));
    // Recalculate total optimistically if possible (simple version)
    if (item) {
      const diff = (quantity - item.quantity) * parseFloat(item.price);
      setTotal((parseFloat(total) + diff).toFixed(2));
    }

    try {
      const res = await fetchWithTimeout(`${API_URL}/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart(true); // Silent sync with server
        return { success: true, message: 'Quantity updated.' };
      }
      // Revert if failed
      setItems(originalItems);
      setTotal(originalTotal);
      return { success: false, message: data.message || 'Update failed.' };
    } catch {
      setItems(originalItems);
      setTotal(originalTotal);
      return { success: false, message: 'Error updating quantity.' };
    }
  }, [token, authHeaders, fetchCart, items, total, removeItem]);

  const removeItem = useCallback(async (cartItemId: number) => {
    if (!token) return;
    
    const originalItems = [...items];
    const originalTotal = total;
    const itemToRemove = items.find(i => i.cart_item_id === cartItemId);

    // --- Optimistic Update ---
    setItems(prev => prev.filter(i => i.cart_item_id !== cartItemId));
    if (itemToRemove) {
      const diff = itemToRemove.quantity * parseFloat(itemToRemove.price);
      setTotal((parseFloat(total) - diff).toFixed(2));
    }

    try {
      const res = await fetchWithTimeout(`${API_URL}/cart/items/${cartItemId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCart(true); // Silent sync
      } else {
        setItems(originalItems);
        setTotal(originalTotal);
      }
    } catch {
      setItems(originalItems);
      setTotal(originalTotal);
    }
  }, [token, authHeaders, fetchCart, items, total]);

  const clearCart = useCallback(async () => {
    if (!token) return;
    try {
      await fetchWithTimeout(`${API_URL}/cart/clear`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setItems([]);
      setTotal('0.00');
    } catch {
      // silently fail
    }
  }, [token, authHeaders]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, cartCount, loading, fetchCart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
