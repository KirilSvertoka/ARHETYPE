import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: number;
  selectedVariantSize?: string;
  price: number; // The price of the selected variant or base price
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedVariantId?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  total: number;
  clearCart: () => void;
  justAdded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, selectedVariantId?: number) => {
    setItems(prev => {
      const variant = product.variants?.find(v => v.id === selectedVariantId);
      const cartItemId = selectedVariantId ? `${product.id}-${selectedVariantId}` : `${product.id}`;
      
      const existing = prev.find(item => {
        const itemKey = item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : `${item.id}`;
        return itemKey === cartItemId;
      });

      if (existing) {
        return prev.map(item => {
          const itemKey = item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : `${item.id}`;
          return itemKey === cartItemId ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }

      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedVariantId: variant?.id,
        selectedVariantSize: variant?.size,
        price: variant ? variant.price : product.price
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => {
      const itemKey = item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : `${item.id}`;
      return itemKey !== cartItemId;
    }));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(cartItemId);
    setItems(prev => prev.map(item => {
      const itemKey = item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : `${item.id}`;
      return itemKey === cartItemId ? { ...item, quantity } : item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, total, clearCart, justAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
