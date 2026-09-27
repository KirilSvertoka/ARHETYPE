import React, { useRef, useState } from 'react';
import { Product, getVariantType } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { useWishlist } from './WishlistProvider';
import { Heart } from 'lucide-react';
import { brandPath } from '../utils/seo';
import { applyDiscount, hasActiveDiscount, normalizeDiscountPercent } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  variant?: 'standard' | 'overlay' | 'interactive';
}

interface FlyingItem {
  id: number;
  x: number;
  y: number;
}

/**
 * Gallery-label product card: the bottle is the exhibit, the text block
 * beneath behaves like a museum placard — quiet typography, hairline rule,
 * price set like a catalogue number. Hover extends the placard with the
 * volume picker instead of animating the image.
 */
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

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setFlyingItems(prev => [...prev, { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
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

  const discountPercent = normalizeDiscountPercent(product.discountPercent);
  const onSale = hasActiveDiscount(discountPercent);

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
  const showSelected = variant !== 'standard' && (isHovered || hasInteracted) && selectedPriceValue !== null;

  const minPrice = (apply: (raw: number) => number) => {
    const prices = (product.variants || []).map(v => {
      const raw = typeof v.price === 'number' ? v.price : parseFloat(v.price as string);
      return isNaN(raw) ? NaN : apply(raw);
    });
    const min = Math.min(...prices.filter(p => !isNaN(p)));
    return isFinite(min) ? min.toFixed(2) : null;
  };

  const originalPriceLabel = showSelected
    ? selectedPriceValue
    : (product.variants && product.variants.length > 0
        ? (minPrice(p => p) ?? product.variants[0].price)
        : (typeof product.price === 'number' ? product.price.toFixed(2) : product.price));

  const salePriceLabel = showSelected
    ? applyDiscount(selectedPriceValue, discountPercent)
    : (product.variants && product.variants.length > 0
        ? (minPrice(raw => parseFloat(String(applyDiscount(raw, discountPercent)))) ?? applyDiscount(product.variants[0].price, discountPercent))
        : applyDiscount(product.price, discountPercent));

  const formattedPrice = onSale ? salePriceLabel : originalPriceLabel;
  const isOutOfStock = product.variants && product.variants.every(v => v.stock === 0);

  const families = (language === 'be' && product.scentFamilies_be?.length ? product.scentFamilies_be : product.scentFamilies) || [];
  const characterLine = families.slice(0, 2).join(', ');

  /** Museum-placard price block. */
  const Price = ({ align = 'right' }: { align?: 'left' | 'right' }) => (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} leading-none`}>
      {onSale && (
        <span className="text-[11px] text-brand-muted/70 line-through decoration-brand-muted/40">
          {String(originalPriceLabel)} {t('currency')}
        </span>
      )}
      <span className="font-display font-medium text-[22px] sm:text-2xl text-brand-light tracking-tight tabular-nums">
        {String(formattedPrice)} <span className="text-sm text-brand-muted font-sans font-normal">{t('currency')}</span>
      </span>
      {onSale && (
        <span className="text-[10px] font-sans text-brand-accent font-medium tracking-wide mt-0.5">
          −{discountPercent}%
        </span>
      )}
    </div>
  );

  /** Brand + name + character line — the placard header. */
  const PlacardHeader = ({ light = false }: { light?: boolean }) => (
    <>
      <button
        onClick={handleBrandClick}
        className={`text-[10px] font-sans font-medium uppercase tracking-[0.22em] transition-colors cursor-pointer text-left ${
          light ? 'text-white/70 hover:text-white' : 'text-brand-muted hover:text-brand-accent'
        }`}
      >
        {product.brand}
      </button>
      <Link to={productUrl} className="block group/title mt-1">
        <h3 className={`font-display text-[21px] sm:text-[22px] leading-[1.12] font-medium transition-colors ${light ? 'text-white' : 'text-brand-light group-hover/title:text-brand-accent'}`}>
          {product.name}
        </h3>
      </Link>
      {characterLine && (
        <p className={`font-display italic text-[14px] leading-snug mt-0.5 ${light ? 'text-white/60' : 'text-brand-muted/80'}`}>
          {characterLine}
        </p>
      )}
    </>
  );

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block w-full h-full group relative flex flex-col bg-brand-bg"
    >
      <AnimatePresence>
        {flyingItems.map(item => {
          const cartButton = document.getElementById('cart-button');
          const targetRect = cartButton?.getBoundingClientRect() || { left: window.innerWidth - 50, top: 50 };
          return (
            <motion.div
              key={item.id}
              initial={{ x: item.x - 12, y: item.y - 12, scale: 1, opacity: 1 }}
              animate={{ x: targetRect.left + 10, y: targetRect.top + 10, scale: 0.2, opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              onAnimationComplete={() => setFlyingItems(prev => prev.filter(i => i.id !== item.id))}
              className="fixed top-0 left-0 z-[9999] pointer-events-none"
            >
              <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Exhibit — the image. No zoom, no gradient wash; light frame like a gallery wall. */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-brand-hover">
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-30 p-2 transition-all cursor-pointer bg-transparent ${
            isWishlisted ? 'text-brand-accent' : 'text-brand-muted/50 hover:text-brand-accent'
          }`}
          aria-label={isWishlisted ? 'Убрать из избранного' : 'В избранное'}
        >
          <Heart className={`w-[18px] h-[18px] transition-all ${isWishlisted ? 'fill-brand-accent' : ''}`} />
        </button>

        <Link to={productUrl} className="block w-full h-full">
          <img
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="absolute inset-0 object-cover w-full h-full"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />

          {/* Overlay variant: placard printed on the photo itself */}
          {variant !== 'standard' && variant === 'overlay' && (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 pt-16 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end z-10">
              <PlacardHeader light />
              <div className="flex items-end justify-between gap-3 mt-2">
                <div className="text-white/90">
                  <Price align="left" />
                </div>
                {isOutOfStock && (
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/60 font-sans">
                    {language === 'be' ? 'Няма ў наяўнасці' : 'Нет в наличии'}
                  </span>
                )}
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* The placard — under the exhibit for standard and interactive. */}
      {variant !== 'overlay' && (
        <div className={`flex flex-col flex-1 ${variant === 'standard' ? 'pt-3' : 'pt-3 md:pt-3'}`}>
          <PlacardHeader />

          {/* Interactive: volume picker extends from the placard on hover */}
          {variant === 'interactive' && (
            <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
              <div className="overflow-hidden">
                <div className="pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {product.variants && product.variants.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-44 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                      {Object.entries(
                        product.variants.reduce((acc, v) => {
                          const type = getVariantType(v, language);
                          if (!acc[type]) acc[type] = [];
                          acc[type].push(v);
                          return acc;
                        }, {} as Record<string, typeof product.variants>)
                      ).map(([type, variants]) => (
                        <div key={type} className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[9px] font-sans uppercase tracking-[0.18em] text-brand-muted/70 w-16 shrink-0">{type}</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {variants.map(v => {
                              const selected = selectedVariantId === v.id;
                              return (
                                <button
                                  key={v.id}
                                  onClick={e => handleVariantSelect(e, v.id)}
                                  className={`font-display text-[15px] leading-tight transition-colors cursor-pointer relative ${
                                    selected ? 'text-brand-accent font-semibold' : v.stock === 0 ? 'text-brand-muted/40' : 'text-brand-muted hover:text-brand-light'
                                  }`}
                                >
                                  {v.size}
                                  {selected && <span className="absolute left-0 -bottom-0.5 w-full h-px bg-brand-accent" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <motion.button
                    ref={buttonRef}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    disabled={product.variants && product.variants.length > 0 && !selectedVariantId}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 border border-brand-accent/60 text-brand-accent text-[10px] font-sans font-semibold uppercase tracking-[0.22em] hover:bg-brand-accent hover:text-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('addToCart')}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Catalogue line — price on the right, stock note on the left */}
          <div className="mt-auto pt-2.5 pb-1 flex items-end justify-between gap-3 w-full">
            {isOutOfStock ? (
              <span className="text-[10px] uppercase tracking-[0.15em] text-brand-muted/60 font-sans">
                {language === 'be' ? 'Няма ў наяўнасці' : 'Нет в наличии'}
              </span>
            ) : (
              <span className="text-[10px] font-sans text-brand-muted/60 tracking-wide">
                {product.concentration || ''}
              </span>
            )}
            <Price />
          </div>
        </div>
      )}
    </motion.div>
  );
}
