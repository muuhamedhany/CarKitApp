import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { API_URL } from '@/constants/config';

type WishlistContextType = {
  wishlist: Record<number, boolean>;
  isLoading: boolean;
  toggleWishlist: (productId: number) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refreshWishlist = async () => {
    if (!token) {
      setWishlist({});
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const newWishlist: Record<number, boolean> = {};
        data.data.forEach((id: number) => {
          newWishlist[id] = true;
        });
        setWishlist(newWishlist);
      }
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load wishlist when user logs in or token changes
  useEffect(() => {
    refreshWishlist();
  }, [token]);

  const toggleWishlist = async (productId: number): Promise<boolean> => {
    if (!token || !user) {
      showToast('error', 'Authentication Required', 'Please log in to add to wishlist.');
      return false;
    }

    // Optimistic update
    const wasWishlisted = !!wishlist[productId];
    setWishlist(prev => ({
      ...prev,
      [productId]: !wasWishlisted
    }));

    try {
      const res = await fetch(`${API_URL}/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      
      if (!data.success) {
        // Revert optimistic update on failure
        setWishlist(prev => ({
          ...prev,
          [productId]: wasWishlisted
        }));
        showToast('error', 'Error', data.message || 'Failed to update wishlist');
        return false;
      }
      return true;
    } catch (e) {
      // Revert optimistic update
      setWishlist(prev => ({
        ...prev,
        [productId]: wasWishlisted
      }));
      showToast('error', 'Network Error', 'Failed to update wishlist');
      return false;
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, toggleWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
