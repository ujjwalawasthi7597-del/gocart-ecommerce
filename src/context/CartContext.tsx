import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  appliedCoupon: { code: string; discount: number } | null;
  isCartOpen: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'gocart_guest_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Initialize cart
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        try {
          const serverCart = await api.getCart();
          // Merge any guest cart items
          const savedGuest = localStorage.getItem(LOCAL_STORAGE_KEY);
          let mergedItems: CartItem[] = serverCart.items;

          if (savedGuest) {
            try {
              const guestItems: CartItem[] = JSON.parse(savedGuest);
              const map = new Map<string, CartItem>();
              mergedItems.forEach((i) => map.set(i.productId, i));
              guestItems.forEach((g) => {
                if (map.has(g.productId)) {
                  const existing = map.get(g.productId)!;
                  existing.quantity = Math.min(
                    existing.quantity + g.quantity,
                    existing.product.stock
                  );
                } else {
                  map.set(g.productId, g);
                }
              });
              mergedItems = Array.from(map.values());
              // Clean up guest cart and sync to server
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              await api.syncCart(
                mergedItems.map((i) => ({ productId: i.productId, quantity: i.quantity }))
              );
            } catch (err) {
              console.error('Failed to merge guest cart', err);
            }
          }
          setItems(mergedItems);
        } catch {
          // fallback
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) setItems(JSON.parse(saved));
        }
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch {
            setItems([]);
          }
        }
      }
    };

    loadCart();
  }, [user]);

  // Sync to local storage or server on cart change
  const syncCartState = async (newItems: CartItem[]) => {
    setItems(newItems);
    if (user) {
      try {
        await api.syncCart(
          newItems.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        );
      } catch (err) {
        console.error('Failed to sync cart to server', err);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product.id);
      let updated: CartItem[];

      if (existingIndex > -1) {
        updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, product.stock);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          product, // fresh copy
        };
      } else {
        const initialQty = Math.min(quantity, product.stock);
        updated = [
          ...prev,
          {
            productId: product.id,
            quantity: initialQty,
            product,
          },
        ];
      }

      syncCartState(updated);
      return updated;
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.productId === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: validQty };
        }
        return item;
      });
      syncCartState(updated);
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.productId !== productId);
      syncCartState(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    if (user) {
      api.syncCart([]).catch(() => {});
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Authoritative calculations
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    discount = Math.min(appliedCoupon.discount, subtotal);
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shippingFee =
    items.length === 0 || discountedSubtotal >= 50 || appliedCoupon?.code === 'FREESHIP' ? 0 : 10;
  const tax = items.length === 0 ? 0 : Math.round(discountedSubtotal * 0.08 * 100) / 100;
  const total = items.length === 0 ? 0 : Math.round((discountedSubtotal + shippingFee + tax) * 100) / 100;

  const applyCoupon = async (code: string) => {
    if (!code.trim()) {
      return { success: false, message: 'Please enter a coupon code' };
    }
    try {
      const res = await api.validateCoupon(code.trim(), subtotal);
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discount: res.discount });
        return { success: true, message: `Coupon "${res.code}" applied! Saved $${res.discount}` };
      }
      return { success: false, message: 'Invalid coupon code' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        discount,
        tax,
        total,
        appliedCoupon,
        isCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
