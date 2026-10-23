import React, { useRef, useState } from 'react';
import { Product, getVariantType } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { useWishlist } from './WishlistProvider';
import { Heart, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
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
 * Gallery product card.
 *
 * DNA of the store: warm-white ground #FCFBFA, ink #111111, wine accent
 * #660010, Playfair/Cormorant display type, hairline rules, zero radius.
 * The photo hangs clean on the wall; every control lives on the placard
 * beneath it, and the quick-buy sheet is a solid sheet of the same paper
 * sliding over the photo.
 */
export default function ProductCard({ product, variant = 'interactive' }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t, language } = useLanguage();
  const { addToCart, addCustomMl } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(
    product.variants && product.variants.length > 0
      ? product.variants.find(v => v.stock > 0)?.id || product.variants[0].id
      : undefined
  );
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [cardMl, setCardMl] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const productUrl = `/catalog/${product.slug || product.id}`;
  const hasDecant = Number(product.price_per_ml) > 0;

  const fireFly = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setFlyingItems(prev => [...prev, { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardMl != null && hasDecant) {
      addCustomMl(product, cardMl);
    } else {
      addToCart(product, selectedVariantId);
    }
    fireFly();
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleVariantSelect = (e: React.MouseEvent, variantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariantId(variantId);
    setCardMl(null);
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

  const selectedPrice = (() => {
    if (cardMl != null && hasDecant) return (Math.round(Number(product.price_per_ml) * cardMl * 100) / 100).toFixed(2);
    if (selectedVariantId && product.variants) {
      const v = product.variants.find(v => v.id === selectedVariantId);
      if (v) {
        const val = typeof v.price === 'number' ? v.price : parseFloat(v.price as string);
        return isNaN(val) ? null : val.toFixed(2);
      }
    }
    return null;
  })();

  const minPrice = (apply: (raw: number) => number) => {
    const prices = (product.variants || []).map(v => {
      const raw = typeof v.price === 'number' ? v.price : parseFloat(v.price as string);
      return isNaN(raw) ? NaN : apply(raw);
    });
    const min = Math.min(...prices.filter(p => !isNaN(p)));
    return isFinite(min) ? min.toFixed(2) : null;
  };

  const fromPrice = product.variants && product.variants.length > 0
    ? (minPrice(p => p) ?? null)
    : (typeof product.price === 'number' ? product.price.toFixed(2) : String(product.price ?? ''));

  const salePrice = product.variants && product.variants.length > 0
    ? (minPrice(raw => parseFloat(String(applyDiscount(raw, discountPercent)))) ?? null)
    : (() => { const r = applyDiscount(product.price, discountPercent); return /\d/.test(String(r)) ? String(r) : null; })();

  const priceShown = (selectedPrice ?? (onSale ? salePrice : fromPrice)) || '0';
  const isOutOfStock = hasDecant
    ? false
    : (!product.variants || product.variants.every(v => v.stock === 0));

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setSheetOpen(true)}
      onMouseLeave={() => setSheetOpen(false)}
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

      {/* The photo — clean, hairline mat, no washes */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-brand-hover border border-brand-border/60">
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 cursor-pointer ${
            isWishlisted
              ? 'bg-brand-accent text-white'
              : 'bg-white/90 text-brand-light/70 hover:text-brand-accent'
          }`}
          aria-label={isWishlisted ? 'Убрать из избранного' : 'В избранное'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {onSale && (
          <span className="absolute top-3 left-3 z-30 bg-brand-accent text-white text-[10px] font-sans font-semibold tracking-[0.08em] px-2 py-1">
            −{discountPercent}%
          </span>
        )}
        {isOutOfStock && !onSale && (
          <span className="absolute top-3 left-3 z-30 bg-brand-light/85 text-white text-[10px] font-sans font-semibold uppercase tracking-[0.1em] px-2 py-1">
            {language === 'be' ? 'Няма' : 'Нет'}
          </span>
        )}

        <Link to={productUrl} className="block w-full h-full">
          <img
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="absolute inset-0 object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Quick-buy sheet: solid paper matching the placard, slides over the photo */}
        {variant !== 'standard' && (
          <div
            className={`absolute inset-x-0 bottom-0 z-20 bg-brand-bg/95 backdrop-blur-[2px] border-t border-brand-border transition-transform duration-300 ease-out ${
              sheetOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 space-y-3 max-h-[70%] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="text-[11px] leading-snug text-brand-muted line-clamp-1">
                {language === 'be' && product.description_be ? product.description_be : product.description}
              </p>

              {hasDecant && (
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-sans uppercase tracking-[0.18em] text-brand-muted">
                      {language === 'be' ? 'Распіў' : 'Распив'} · {product.price_per_ml} {t('currency')}/мл
                    </span>
                    <span className={`text-[11px] font-sans font-semibold ${cardMl != null ? 'text-brand-accent' : 'text-brand-muted'}`}>
                      {cardMl != null ? `${cardMl} мл` : '—'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={Number(product.decant_max_ml) > 2 ? Math.round(Number(product.decant_max_ml)) : 10}
                    step={1}
                    value={cardMl ?? 2}
                    onChange={(e) => { e.stopPropagation(); setCardMl(Number(e.target.value)); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-brand-border
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-accent
                               [&::-webkit-slider-thumb]:cursor-grab
                               [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-accent"
                    aria-label={language === 'be' ? 'Аб’ём адліванта' : 'Объем отливанта'}
                  />
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  {Object.entries(
                    product.variants.reduce((acc, v) => {
                      const type = getVariantType(v, language);
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(v);
                      return acc;
                    }, {} as Record<string, typeof product.variants>)
                  ).map(([type, vs]) => (
                    <div key={type} className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] font-sans uppercase tracking-wider text-brand-muted/60">{type}:</span>
                      {(vs as typeof product.variants).map(v => (
                        <button
                          key={v.id}
                          onClick={(e) => handleVariantSelect(e, v.id)}
                          disabled={v.stock === 0}
                          className={`px-2 py-0.5 text-[11px] font-sans border transition-all cursor-pointer ${
                            selectedVariantId === v.id && cardMl == null
                              ? 'border-brand-accent bg-brand-accent text-white font-semibold'
                              : v.stock === 0
                                ? 'border-brand-border text-brand-muted/40 line-through cursor-not-allowed'
                                : 'border-brand-border text-brand-light hover:border-brand-accent'
                          }`}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <button
                ref={buttonRef}
                onClick={handleAddToCart}
                disabled={cardMl == null && !!product.variants && product.variants.length > 0 && !selectedVariantId}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-brand-accent text-white text-[10px] font-sans font-semibold uppercase tracking-[0.2em] hover:bg-brand-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                {added ? (language === 'be' ? 'Дададзена' : 'Добавлено') : t('addToCart')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* The placard */}
      {variant !== 'overlay' && (
        <div className="flex flex-col flex-1 pt-3 pb-1 px-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button
                onClick={handleBrandClick}
                className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-accent transition-colors cursor-pointer text-left"
              >
                {product.brand}
              </button>
              <Link to={productUrl} className="block mt-0.5">
                <h3 className="font-serif text-[17px] leading-snug text-brand-light group-hover:text-brand-accent transition-colors">
                  {product.name}
                </h3>
              </Link>
            </div>
            {/* touch toggle for the quick-buy sheet (no hover on phones) */}
            {variant !== 'standard' && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSheetOpen(o => !o); }}
                className={`sm:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                  sheetOpen ? 'border-brand-accent text-brand-accent' : 'border-brand-border text-brand-muted'
                }`}
                aria-label={sheetOpen ? 'Скрыть' : 'Купить'}
              >
                {sheetOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            {onSale && (
              <span className="text-[11px] font-sans text-brand-muted/70 line-through">
                {fromPrice} {t('currency')}
              </span>
            )}
            <span className={`font-sans font-semibold text-[15px] tabular-nums ml-auto ${onSale ? 'text-brand-accent' : 'text-brand-light'}`}>
              {onSale ? `${salePrice} ` : `${priceShown} `}
              <span className="text-brand-muted font-medium">{t('currency')}</span>
            </span>
            {onSale && (
              <span className="text-[10px] font-sans font-bold text-brand-accent">−{discountPercent}%</span>
            )}
          </div>

          {isOutOfStock && (
            <span className="mt-1 text-[10px] font-sans uppercase tracking-wider text-red-500">
              {language === 'be' ? 'Няма ў наяўнасці' : 'Нет в наличии'}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
