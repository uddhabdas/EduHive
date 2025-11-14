import React, { createContext, useContext, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

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

  const value = useMemo(() => ({ items, add, remove }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
