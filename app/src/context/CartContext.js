import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load cart items from storage on startup
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('cart_items');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {
        // ignore corrupt cache
      }
    })();
  }, []);

  const add = async (course) => {
    setItems((prev) => {
      if (prev.find((c) => c._id === course._id)) return prev;
      const next = [...prev, course];
      AsyncStorage.setItem('cart_items', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const remove = async (id) => {
    setItems((prev) => {
      const next = prev.filter((c) => c._id !== id);
      AsyncStorage.setItem('cart_items', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clear = async () => {
    setItems([]);
    try {
      await AsyncStorage.removeItem('cart_items');
    } catch {
      // ignore storage error
    }
  };

  const value = useMemo(() => ({ items, add, remove, clear }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
