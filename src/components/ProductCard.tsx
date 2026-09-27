import React, { useRef, useState } from 'react';
import { Product, getVariantType } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { useWishlist } from './WishlistProvider';
import { Heart, ShoppingBag } from 'lucide-react';
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

  /** Price block: solid numerals, sale price in accent, old price struck through. */
  const Price = ({ light = false }: { light?: boolean }) => (
    <div className="flex items-baseline gap-2 leading-none flex-wrap justify-end">
      {onSale && (
        <span className={`text-[12px] line-through ${light ? 'text-white/60' : 'text-brand-muted/60'}`}>
          {String(originalPriceLabel)} {t('currency')}
        </span>
      )}
      <span className={`font-display font-semibold text-[24px] sm:text-[26px] tracking-tight tabular-nums ${light ? 'text-white' : 'text-brand-light'}`}>
        {String(formattedPrice)}
      </span>
      <span className={`text-[13px] font-sans ${light ? 'text-white/80' : 'text-brand-muted'}`}>{t('currency')}</span>
      {onSale && (
        <span className={`text-[11px] font-sans font-bold px-1.5 py-0.5 ${light ? 'bg-white text-brand-light' : 'bg-brand-accent text-white'}`}>
          −{discountPercent}%
        </span>
      )}
    </div>
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
                <ShoppingBag className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Photo */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-brand-hover">
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-30 p-2 rounded-full transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-brand-accent text-white'
              : 'bg-white/85 backdrop-blur-sm text-brand-light hover:bg-brand-accent hover:text-white'
          }`}
          aria-label={isWishlisted ? 'Убрать из избранного' : 'В избранное'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {isOutOfStock && variant !== 'standard' && (
          <span className="absolute top-3 left-3 z-30 bg-brand-light/90 text-white text-[10px] font-sans font-semibold uppercase tracking-[0.15em] px-2.5 py-1">
            {language === 'be' ? 'Няма' : 'Нет в наличии'}
          </span>
        )}

        <Link to={productUrl} className="block w-full h-full">
          <img
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="absolute inset-0 object-cover w-full h-full transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />

          {/* Overlay variant: text printed on the photo */}
          {variant === 'overlay' && (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 pt-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end z-10">
              <button
                onClick={handleBrandClick}
                className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors cursor-pointer text-left w-fit mb-1"
              >
                {product.brand}
              </button>
              <div className="flex items-end justify-between gap-3">
                <h3 className="font-display font-medium text-lg sm:text-xl text-white leading-tight">{product.name}</h3>
                <div className="text-white shrink-0"><Price light /></div>
              </div>
            </div>
          )}
          {/* Interactive: quick-add panel rises over the photo on hover */}
          {variant === 'interactive' && product.variants && product.variants.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-brand-bg/95 backdrop-blur-sm border-t border-brand-border px-3 py-3">
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {(product.variants || []).map(v => {
                  const selected = selectedVariantId === v.id;
                  const type = getVariantType(v, language);
                  return (
                    <button
                      key={v.id}
                      onClick={e => handleVariantSelect(e, v.id)}
                      title={type}
                      disabled={v.stock === 0}
                      className={`px-2.5 py-1 text-[12px] font-sans border transition-all cursor-pointer ${
                        selected
                          ? 'border-brand-accent bg-brand-accent text-white font-semibold'
                          : v.stock === 0
                            ? 'border-brand-border text-brand-muted/40 cursor-not-allowed line-through'
                            : 'border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-accent'
                      }`}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
              <button
                ref={buttonRef}
                onClick={handleAddToCart}
                disabled={product.variants && product.variants.length > 0 && !selectedVariantId}
                className="mt-2.5 w-full inline-flex items-center justify-center gap-2 py-2.5 bg-brand-light text-white text-[10px] font-sans font-semibold uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {t('addToCart')}
              </button>
            </div>
          )}
        </Link>
      </div>

      {/* Placard under the photo (standard + interactive) */}
      {variant !== 'overlay' && (
        <div className="flex flex-col flex-1 pt-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <button
              onClick={handleBrandClick}
              className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-brand-accent hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
            >
              {product.brand}
            </button>
            {product.concentration && (
              <span className="text-[10px] font-sans text-brand-muted/70 uppercase tracking-wider">{product.concentration}</span>
            )}
          </div>
          <Link to={productUrl} className="block mt-1">
            <h3 className="font-display font-semibold text-[21px] sm:text-[23px] leading-[1.15] text-brand-light group-hover:text-brand-accent transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Price pinned to the bottom of the placard */}
          <div className="mt-auto pt-3 pb-1 flex justify-end w-full border-t border-brand-border mt-2">
            <Price />
          </div>
        </div>
      )}
    </motion.div>
  );
}
