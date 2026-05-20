import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from './LanguageContext';
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
  const { t } = useTranslation();
  
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
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
  }, [token]);

  // Load wishlist when user logs in or token changes
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: number): Promise<boolean> => {
    if (!token || !user) {
      showToast('error', t('wishlist.authRequiredTitle'), t('wishlist.authRequiredMessage'));
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
        showToast('error', t('common.error'), data.message || t('wishlist.updateFailed'));
        return false;
      }
      return true;
    } catch {
      // Revert optimistic update
      setWishlist(prev => ({
        ...prev,
        [productId]: wasWishlisted
      }));
      showToast('error', t('common.networkError'), t('wishlist.updateFailed'));
      return false;
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, toggleWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
