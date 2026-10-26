import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { applyDiscount } from '../utils/pricing';

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: number;
  selectedVariantSize?: string;
  variant_type?: string;
  price: string | number; // The price of the selected variant or base price
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedVariantId?: number) => void;
  addCustomMl: (product: Product, ml: number) => void;
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
        variant_type: variant?.variant_type || (variant ? 'full' : undefined),
        price: applyDiscount(variant ? variant.price : product.price, product.discountPercent)
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  /** Decant builder position: fixed price per ml chosen with the slider. */
  const addCustomMl = (product: Product, ml: number) => {
    const perMl = Number(product.price_per_ml) || 0;
    if (perMl <= 0 || ml <= 0) return;
    const cartItemId = `${product.id}-custom-${ml}`;
    setItems(prev => {
      const existing = prev.find(item =>
        item.id === product.id &&
        item.selectedVariantId === undefined &&
        item.selectedVariantSize === `${ml} мл` &&
        item.variant_type === 'custom_ml');
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedVariantId: undefined,
        selectedVariantSize: `${ml} мл`,
        variant_type: 'custom_ml',
        price: Math.round(perMl * ml * 100) / 100
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

  const total = items.reduce((sum, item) => {
    const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price as string);
    return sum + (isNaN(priceNum) ? 0 : priceNum) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, addCustomMl, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, total, clearCart, justAdded }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
