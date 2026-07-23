import React, { useRef, useState } from 'react';
import { Product, getVariantType } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { useWishlist } from './WishlistProvider';
import { ShoppingBag, Heart } from 'lucide-react';
import { brandPath } from '../utils/seo';

interface ProductCardProps {
  product: Product;
  variant?: 'standard' | 'overlay' | 'interactive';
}

interface FlyingItem {
  id: number;
  x: number;
  y: number;
}

export default function ProductCard({ product, variant = 'interactive' }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : undefined
  );
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const productUrl = `/catalog/${product.slug || product.id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Start animation
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newItem = {
        id: Date.now(),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setFlyingItems(prev => [...prev, newItem]);
    }

    addToCart(product, selectedVariantId);
  };

  const handleVariantSelect = (e: React.MouseEvent, variantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariantId(variantId);
    setHasInteracted(true);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const isWishlisted = isInWishlist(product.id);

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(brandPath(product.brand));
  };

  const getSelectedVariantPrice = () => {
    if (selectedVariantId && product.variants && product.variants.length > 0) {
      const selected = product.variants.find(v => v.id === selectedVariantId);
      if (selected) {
        const val = typeof selected.price === 'number' ? selected.price : parseFloat(selected.price as string);
        return isNaN(val) ? selected.price : val.toFixed(2);
      }
    }
    return null;
  };

  const selectedPriceValue = getSelectedVariantPrice();

  const formattedPrice = (variant !== 'standard' && (isHovered || hasInteracted) && selectedPriceValue !== null)
    ? selectedPriceValue
    : (product.variants && product.variants.length > 0 
        ? `${language === 'be' ? 'ад' : 'от'} ${(() => {
            const prices = product.variants.map(v => typeof v.price === 'number' ? v.price : parseFloat(v.price as string));
            const minPrice = Math.min(...prices.filter(p => !isNaN(p)));
            return isFinite(minPrice) ? minPrice.toFixed(2) : product.variants[0].price;
          })()}` 
        : (typeof product.price === 'number' ? product.price.toFixed(2) : product.price));

  const formatPriceWithCurrency = (priceStr: string | number) => {
    const s = String(priceStr);
    return /\d/.test(s) ? `${s} ${t('currency')}` : s;
  };

  const isOutOfStock = product.variants && product.variants.every(v => v.stock === 0);

  return (
    <motion.div 
      ref={ref} 
      initial="initial"
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block w-full h-full group overflow-hidden bg-brand-bg relative flex flex-col"
    >
      <AnimatePresence>
        {flyingItems.map(item => {
          const cartButton = document.getElementById('cart-button');
          const targetRect = cartButton?.getBoundingClientRect() || { left: window.innerWidth - 50, top: 50 };
          
          return (
            <motion.div
              key={item.id}
              initial={{ 
                x: item.x - 12, 
                y: item.y - 12, 
                scale: 1, 
                opacity: 1 
              }}
              animate={{ 
                x: targetRect.left + 10, 
                y: targetRect.top + 10, 
                scale: 0.2, 
                opacity: 0.5 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.4, 0, 0.2, 1] 
              }}
              onAnimationComplete={() => {
                setFlyingItems(prev => prev.filter(i => i.id !== item.id));
              }}
              className="fixed top-0 left-0 z-[9999] pointer-events-none"
            >
              <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-4 right-4 z-30 p-2 rounded-none bg-black/15 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-all cursor-pointer"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
        </button>

        <Link to={productUrl} className="block w-full h-full">
          {/* Image with zoom on hover */}
          <motion.img 
            initial={{ scale: 1.1 }}
            variants={{
              hover: { scale: 1, opacity: 0.85 }
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={product.imageUrl} 
            alt={`${product.brand} ${product.name}`} 
            className="absolute inset-0 object-cover w-full h-full bg-brand-bg relative z-0"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />

          {/* GRADIENT OVERLAY (only for overlay or interactive styles) */}
          {variant !== 'standard' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent opacity-75 group-hover:opacity-90 transition-opacity duration-300" />
          )}

          {/* OVERLAY VARIANT CONTENT */}
          {variant === 'overlay' && (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end text-white z-10 pointer-events-none">
              <button 
                onClick={handleBrandClick}
                className="pointer-events-auto text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-brand-accent transition-colors relative z-20 cursor-pointer text-left w-fit mb-1" 
              >
                {product.brand}
              </button>
              <div className="flex justify-between items-end gap-3 w-full">
                <h3 className="font-serif text-base sm:text-lg md:text-xl leading-tight text-white/95">{product.name}</h3>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs sm:text-sm md:text-base font-light font-mono whitespace-nowrap text-white">
                    {formatPriceWithCurrency(formattedPrice)}
                  </span>
                  {isOutOfStock && (
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-red-500 font-bold mt-0.5">
                      {language === 'be' ? 'Няма ў наяўнасці' : 'Нет в наличии'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE VARIANT CONTENT (The original hover details) */}
          {variant === 'interactive' && (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-6 flex flex-col justify-end text-white z-10 pointer-events-none">
              <div className="transform transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                <button 
                  onClick={handleBrandClick}
                  className="pointer-events-auto text-[10px] md:text-xs font-medium uppercase tracking-widest text-white/90 mb-1 hover:text-brand-accent transition-colors relative z-20 cursor-pointer" 
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {product.brand}
                </button>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-0.5 md:gap-4">
                  <h3 className="font-serif text-lg sm:text-xl md:text-2xl leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{product.name}</h3>
                  <div className="flex flex-col items-start md:items-end shrink-0">
                    <span className="text-[11px] sm:text-base md:text-lg font-light whitespace-nowrap" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {formatPriceWithCurrency(formattedPrice)}
                    </span>
                    {isOutOfStock && (
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-red-400 font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                        {language === 'be' ? 'Няма ў наяўнасці' : 'Нет в наличии'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Description and Add to Cart on hover */}
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
                  <div className="overflow-hidden">
                    <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      <p className="text-white/80 text-sm leading-relaxed line-clamp-2 mb-4">
                        {language === 'be' && product.description_be ? product.description_be : product.description}
                      </p>
                      
                      {/* Add to Cart Section */}
                      <motion.div 
                        variants={{
                          initial: { opacity: 0 },
                          hover: { opacity: 1 }
                        }}
                        transition={{ duration: 0.3 }}
                        className="pointer-events-auto flex flex-col items-start gap-4 w-full"
                      >
                        {product.variants && product.variants.length > 0 && (
                          <div className="flex flex-col gap-3 w-full max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] pr-1">
                            {Object.entries(
                              product.variants.reduce((acc, variant) => {
                                const type = getVariantType(variant, language);
                                if (!acc[type]) acc[type] = [];
                                acc[type].push(variant);
                                return acc;
                              }, {} as Record<string, typeof product.variants>)
                            ).map(([type, variants]) => (
                              <div key={type} className="space-y-1.5">
                                <span className="text-[10px] uppercase tracking-widest text-white/80 font-medium">{type}</span>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map((variant) => (
                                      <button
                                        key={variant.id}
                                        onClick={(e) => handleVariantSelect(e, variant.id)}
                                        className={`flex items-center justify-center px-3 py-1.5 rounded-none border transition-all duration-300 ${
                                          selectedVariantId === variant.id
                                            ? 'bg-white text-brand-accent border-white scale-105'
                                            : 'bg-black/40 text-white border-white/30 hover:bg-white/20 hover:border-white/60'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center">
                                          <span className="text-xs font-bold">{variant.size}</span>
                                          {variant.stock === 0 && (
                                            <span className="text-[8px] opacity-70 uppercase leading-none mt-0.5">
                                              {language === 'be' ? 'Няма' : 'Нет'}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <motion.button
                          ref={buttonRef}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddToCart}
                          disabled={product.variants && product.variants.length > 0 && !selectedVariantId}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-accent text-white rounded-none text-xs font-semibold uppercase tracking-[0.15em] hover:bg-brand-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-95 sm:py-2.5"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{t('addToCart')}</span>
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* STANDARD VARIANT CONTENT (Text positioned underneath, clean and stable) */}
      {variant === 'standard' && (
        <div className="pt-3 pb-1 px-1 flex flex-col flex-1 justify-between bg-transparent">
          <div>
            <button 
              onClick={handleBrandClick}
              className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.18em] text-brand-muted hover:text-brand-accent transition-colors relative z-20 cursor-pointer text-left w-fit block" 
            >
              {product.brand}
            </button>
            <Link to={productUrl} className="block mt-1 hover:opacity-80 transition-opacity">
              <h3 className="font-serif text-base sm:text-lg leading-snug text-brand-light/95">{product.name}</h3>
            </Link>
          </div>
          <div className="flex justify-between items-end mt-2 pt-1 border-t border-brand-border/20 w-full">
            <span className="text-xs sm:text-sm font-light font-mono text-brand-light">
              {formatPriceWithCurrency(formattedPrice)}
            </span>
            {isOutOfStock && (
              <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-red-500 font-bold">
                {language === 'be' ? 'Няма' : 'Нет в наличии'}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
