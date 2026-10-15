import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlist: Product[];
  wishlistIds: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  moveToCart: (product: Product) => void;
  isWishlistOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gocart_guest_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    const loadWishlist = async () => {
      if (user) {
        try {
          const res = await api.getWishlist();
          setWishlist(res.products);
        } catch (err) {
          console.error('Failed to fetch wishlist', err);
        }
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            setWishlist(JSON.parse(saved));
          } catch {
            setWishlist([]);
          }
        }
      }
    };
    loadWishlist();
  }, [user]);

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      // Prompt user or handle local guest wishlist
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.toggleWishlist(product.id);
      if (res.inWishlist) {
        setWishlist((prev) => [...prev, product]);
      } else {
        setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      }
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    }
  };

  const moveToCart = (product: Product) => {
    addToCart(product);
    toggleWishlist(product);
  };

  const wishlistIds = wishlist.map((p) => p.id);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        isInWishlist,
        toggleWishlist,
        moveToCart,
        isWishlistOpen,
        openWishlist: () => setIsWishlistOpen(true),
        closeWishlist: () => setIsWishlistOpen(false),
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
