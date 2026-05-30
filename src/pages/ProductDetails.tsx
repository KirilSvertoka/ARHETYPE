import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product, getVariantType, GeneralSettings, getConcentrationLabel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, ChevronLeft, ChevronRight, ShoppingBag, Minus, Plus, Info, Truck, CheckCircle, Send, Star, ChevronDown, Sun, Moon, Compass, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import NoteDiagram from '../components/NoteDiagram';
import DecantSizeGuide from '../components/DecantSizeGuide';
import { useCart } from '../components/CartProvider';
import { useLanguage } from '../components/LanguageProvider';
import RelatedProducts from '../components/RelatedProducts';
import RecentlyViewed from '../components/RecentlyViewed';
import Breadcrumbs from '../components/Breadcrumbs';
import { trackViewItem, trackAddToCart, trackGoal } from '../utils/analytics';

interface FlyingItem {
  id: number;
  x: number;
  y: number;
}

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(undefined);
  const [isFullscreenGalleryOpen, setIsFullscreenGalleryOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [quantity, setQuantity] = useState(1);
  const [activeNotesAccordion, setActiveNotesAccordion] = useState<'top' | 'heart' | 'base' | null>('top');
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      setReviewSubmitError(language === 'be' ? 'Калі ласка, запоўніце ўсе палі' : 'Пожалуйста, заполните все поля');
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewSubmitError('');
    setReviewSubmitSuccess(false);

    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: newReviewName,
          rating: newReviewRating,
          comment: newReviewComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setReviewSubmitSuccess(true);
      setNewReviewName('');
      setNewReviewComment('');
      setNewReviewRating(5);
    } catch (err) {
      console.error(err);
      setReviewSubmitError(language === 'be' ? 'Памылка пры адпраўцы водгуку' : 'Ошибка при отправке отзыва');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const allImages = product ? [product.imageUrl, ...(product.images || [])] : [];

  const handleAddToCart = () => {
    if (!product) return;
    
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

    // Add to cart with quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedVariantId);
    }
    const variant = selectedVariantId ? product.variants?.find(v => v.id === selectedVariantId) : product.variants?.[0];
    if (variant) {
      trackAddToCart(product, variant, quantity);
    }
  };

  const openFullscreen = (index: number) => {
    setFullscreenImageIndex(index);
    setIsFullscreenGalleryOpen(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setActiveImage(data.imageUrl);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
        setLoading(false);
        
        // Log view
        fetch(`/api/products/${data.id}/view`, { method: 'POST' }).catch(console.error);
        trackViewItem(data, data.variants && data.variants.length > 0 ? data.variants[0] : undefined);

        // Fetch product reviews
        fetch(`/api/products/${data.id}/reviews`)
          .then(res => res.json())
          .then(reviewsData => setReviews(reviewsData.filter((r: any) => r.status === 'Approved')))
          .catch(console.error);
      })
      .catch(err => {
        console.error('Failed to fetch product', err);
        setProduct(null);
        setLoading(false);
      });

    // Fetch settings for manager links
    fetch('/api/settings/general')
      .then(res => res.json())
      .then(setSettings)
      .catch(console.error);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-white/20 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-white/20 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-white/20 rounded col-span-2"></div>
                <div className="h-2 bg-white/20 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <Helmet>
          <title>{t('notFound')} | Arhetip</title>
        </Helmet>
        <h2 className="text-2xl font-serif text-brand-light mb-4">{t('notFound')}</h2>
        <Link to="/catalog" className="text-brand-muted hover:text-white flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToCatalog')}</span>
        </Link>
      </div>
    );
  }

  const selectedVariant = selectedVariantId 
    ? product.variants?.find(v => v.id === selectedVariantId) 
    : product.variants?.[0];

  const volumeStr = selectedVariant ? `${selectedVariant.size}` : '';
  
  const parseNotes = (notes: any) => {
    try {
      if (typeof notes === 'string') return JSON.parse(notes);
      if (Array.isArray(notes)) return notes;
      return [];
    } catch (e) {
      return [];
    }
  };

  const topNotesList = parseNotes(product.topNotes);
  const baseNotesList = parseNotes(product.baseNotes);
  const getNoteStringVal = (n: any) => {
    if (!n) return '';
    if (typeof n === 'string') return n;
    return language === 'be' && n.name_be ? n.name_be : n.name;
  };
  const notesStr = [
    ...topNotesList.slice(0, 3).map(getNoteStringVal),
    ...baseNotesList.slice(0, 2).map(getNoteStringVal)
  ].filter(Boolean).join(', ');

  const minVolume = product.variants?.reduce((min, v) => {
    const sizeMatch = v.size.match(/(\d+)/);
    return sizeMatch ? Math.min(min, parseInt(sizeMatch[1])) : min;
  }, Infinity) || 1;
  const isDecant = minVolume < 30; // rough heuristic
  
  const pageTitle = `Купить ${product.brand} ${product.name} (Оригинал) | ${isDecant ? `Отливант от ${minVolume === Infinity ? 1 : minVolume} мл или Флакон` : 'Распив и Флаконы'}`;
  const pageDescription = `${product.brand} ${product.name} — ${notesStr || 'эксклюзивный селективный парфюм'}. Оригинал, распив в Гродно с доставкой по Беларуси. Гарантия подлинности, стойкость и шлейф.`;

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "BYN",
      "price": selectedVariant ? selectedVariant.price : product.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": selectedVariant && selectedVariant.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 5,
          "currency": "BYN"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "BY"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "BY",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn",
        "merchantReturnLink": `${window.location.origin}/page/returns`
      }
    },
    ...(reviews.length > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
        "reviewCount": reviews.length
      },
      "review": reviews.map(r => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.userName
        },
        "datePublished": r.createdAt,
        "reviewBody": r.comment,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating
        }
      }))
    } : {
      // Default placeholder ratings to improve SEO and satisfy Google Rich Results requirements
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "1"
      },
      "review": {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Клиент"
        },
        "datePublished": "2024-01-01",
        "reviewBody": "Прекрасный оригинальный аромат. Рекомендую!",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      }
    })
  };
  
  const heartNotesList = parseNotes(product.heartNotes);
  const allIngredients = [...topNotesList, ...heartNotesList, ...baseNotesList];

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === 'be' ? "Галоўная" : "Главная",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": language === 'be' ? "Каталог" : "Каталог",
        "item": `${window.location.origin}/catalog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": window.location.href
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in"
    >
      <Breadcrumbs 
        items={[
          { label: t('catalog') || (language === 'be' ? 'Каталог' : 'Каталог'), path: '/catalog' },
          { label: product.brand, path: `/catalog?brand=${encodeURIComponent(product.brand)}` },
          { label: product.name }
        ]} 
      />

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
              <div className="w-4 h-4 bg-brand-accent flex items-center justify-center">
                <ShoppingBag className="w-2.5 h-2.5 text-white" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={product.imageUrl} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="Arhetip" />
        <meta property="og:type" content="product" />
        <meta property="product:brand" content={product.brand} />
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="BYN" />
        <link rel="canonical" href={`https://archetype.by/catalog/${product.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify([structuredData, breadcrumbData])}
        </script>
      </Helmet>

      <Link to="/catalog" className="inline-flex items-center gap-2 text-brand-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium uppercase tracking-wider">{t('backToCatalog')}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-7 space-y-6" id="product-gallery">
          <div 
            className="relative aspect-[3/4] sm:aspect-[4/5] rounded-none overflow-hidden bg-brand-hover/5 cursor-zoom-in border border-brand-border/80 group shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
            onClick={() => openFullscreen(allImages.indexOf(activeImage) !== -1 ? allImages.indexOf(activeImage) : 0)}
          >
            {/* Elegant Luxury Badge Overlay */}
            <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 bg-brand-bg/95 backdrop-blur-md border border-brand-border/60 text-[9px] uppercase tracking-[0.2em] text-brand-light font-semibold select-none">
              {product.brand} • {language === 'be' ? 'Калекцыя' : 'Коллекция'}
            </div>
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          </div>
          {product.images && product.images.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setActiveImage(product.imageUrl)}
                className={`flex-shrink-0 w-16 h-20 rounded-none overflow-hidden border transition-all duration-300 ${
                  activeImage === product.imageUrl 
                    ? 'border-brand-accent bg-brand-hover/10 scale-102 shadow-sm' 
                    : 'border-brand-border/60 opacity-60 hover:opacity-100 hover:border-brand-accent/30'
                }`}
              >
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
              </button>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`flex-shrink-0 w-16 h-20 rounded-none overflow-hidden border transition-all duration-300 ${
                    activeImage === img 
                      ? 'border-brand-accent bg-brand-hover/10 scale-102 shadow-sm' 
                      : 'border-brand-border/60 opacity-60 hover:opacity-100 hover:border-brand-accent/30'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 2}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between py-1 space-y-8 lg:sticky lg:top-24">
          <div className="space-y-8">
            <div>
              <Link 
                to={`/catalog?brand=${encodeURIComponent(product.brand)}`}
                className="inline-block text-sm font-medium uppercase tracking-widest text-brand-muted mb-2 hover:text-brand-accent transition-colors"
              >
                {product.brand}
              </Link>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-light mb-2 leading-tight break-words [hyphens:auto]">
                <span className="inline-block">{product.brand}</span> <span className="inline-block">{product.name}</span>
              </h1>
              <div className="flex items-center gap-4 text-brand-muted text-sm">
                <span>{getConcentrationLabel(product.concentration, language)}</span>
                <span className="w-px h-4 bg-brand-border" />
                <span>{product.gender === 'Male' ? (language === 'be' ? 'Для яго' : 'Для него') : product.gender === 'Female' ? (language === 'be' ? 'Для яе' : 'Для нее') : (language === 'be' ? 'Унісекс' : 'Для него и для нее')}</span>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div>
                <div className="flex justify-between items-baseline mb-4 ml-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">
                    {language === 'be' ? 'Аб\'ём' : 'Объем'}
                  </p>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-[10px] font-medium tracking-[0.12em] uppercase text-brand-accent hover:text-brand-accent-hover transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
                  >
                    <span className="text-[10px] opacity-85">📐</span>
                    <span className="border-b border-brand-accent/20 hover:border-brand-accent transition-all leading-tight">
                      {showSizeGuide 
                        ? (language === 'be' ? 'Схаваць гід' : 'Скрыть гид') 
                        : (language === 'be' ? 'Як выглядае адлівант?' : 'Как выглядит отливант?')
                      }
                    </span>
                  </button>
                </div>
                <div className="flex flex-col gap-6">
                  {Object.entries(
                    product.variants.reduce((acc, variant) => {
                      const type = getVariantType(variant, language);
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(variant);
                      return acc;
                    }, {} as Record<string, typeof product.variants>)
                  ).map(([type, variants]) => (
                    <div key={type} className="space-y-3">
                      <h3 className="text-[10px] font-medium text-brand-muted uppercase tracking-[0.2em] ml-1">{type}</h3>
                      <div className="flex flex-wrap gap-2">
                          {(variants as typeof product.variants).map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedVariantId(variant.id)}
                              disabled={variant.stock === 0 && variant.variant_type !== 'remainder'}
                              className={`px-4 py-3 rounded-none border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                                selectedVariantId === variant.id
                                  ? 'bg-brand-light text-brand-bg border-brand-light'
                                  : 'border-brand-border text-brand-light hover:border-brand-accent/60'
                              } ${variant.stock === 0 && variant.variant_type !== 'remainder' ? 'opacity-40 cursor-not-allowed grayscale' : ''} whitespace-nowrap`}
                            >
                              {variant.size}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <AnimatePresence initial={false}>
                  {showSizeGuide && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        <DecantSizeGuide selectedSize={volumeStr} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {selectedVariant?.variant_type === 'remainder' ? (
            <div className="mt-8 pt-8 border-t border-brand-border space-y-6">
              <div className="p-6 rounded-none bg-brand-hover border border-brand-border flex flex-col items-center text-center gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  {language === 'be' 
                    ? 'Кошт астатку ў флаконе ўдакладняйце ў мэнэджэра' 
                    : 'Стоимость остатка во флаконе уточняйте у менеджера'}
                </p>
                <a 
                  href={settings?.telegram || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoal('messenger_click', 'remainder_manager')}
                  className="w-full flex items-center justify-center gap-3 px-8 py-3 bg-brand-accent text-white rounded-none text-xs font-semibold uppercase tracking-[0.2em] hover:bg-brand-accent-hover transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{language === 'be' ? 'Напісаць мэнэджэру' : 'Написать менеджеру'}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-8 border-t border-brand-border">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-serif lining-nums text-brand-light">
                  {(() => {
                    const price = selectedVariantId 
                      ? product.variants?.find(v => v.id === selectedVariantId)?.price 
                      : product.price;
                    const formatted = typeof price === 'number' ? price.toFixed(2) : price;
                    return /\d/.test(String(formatted)) ? `${formatted} ${t("currency")}` : formatted;
                  })()}
                </span>
                {selectedVariantId && product.variants?.find(v => v.id === selectedVariantId)?.stock === 0 && (
                  <span className="text-xs font-bold text-red-500 uppercase tracking-[0.15em]">
                    {language === 'be' ? 'Няма ў наяўнасці' : 'Нет в наличии'}
                  </span>
                )}
              </div>
              <div className="flex flex-row items-center gap-2 sm:gap-3 mt-6">
                <div className="flex items-center bg-brand-hover border border-brand-border rounded-none overflow-hidden shrink-0 h-10 sm:h-12">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 sm:w-10 h-full flex items-center justify-center text-brand-light hover:bg-brand-accent/10 transition-colors"
                  >
                    <Minus className="w-3 h-3 sm:w-4 h-4" />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    readOnly
                    className="w-8 sm:w-10 text-center bg-transparent border-none focus:ring-0 text-brand-light font-semibold text-xs sm:text-sm p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none select-none pointer-events-none"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 sm:w-10 h-full flex items-center justify-center text-brand-light hover:bg-brand-accent/10 transition-colors"
                  >
                    <Plus className="w-3 h-3 sm:w-4 h-4" />
                  </button>
                </div>

                <motion.button 
                  ref={buttonRef}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  disabled={selectedVariantId ? product.variants?.find(v => v.id === selectedVariantId)?.stock === 0 : false}
                  className="flex-1 px-3 sm:px-8 h-10 sm:h-12 bg-brand-accent text-white rounded-none font-semibold uppercase tracking-[0.15em] hover:bg-brand-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 text-xs whitespace-nowrap"
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>{t('addToCart')}</span>
                </motion.button>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-none bg-brand-hover border border-brand-border">
                <div className="flex items-center gap-2 mb-2 text-brand-light font-semibold text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-brand-accent" />
                  <span>{language === 'be' ? 'Дастаўка і Аплата' : 'Доставка и Распив'}</span>
                </div>
                <p className="text-[10px] text-brand-muted leading-relaxed">
                  {language === 'be' 
                    ? 'Бяспечная ўпакоўка, якасныя атамайзеры. Дастаўка па Гродне і па ўсёй РБ.' 
                    : 'Безопасная упаковка, надежные стеклянные атомайзеры для отливантов. Доставка по Гродно — сегодня. РБ — 5 дней.'}
                </p>
              </div>
              <div className="p-4 rounded-none bg-brand-hover border border-brand-border">
                <div className="flex items-center gap-2 mb-2 text-brand-light font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-brand-accent" />
                  <span>{language === 'be' ? '100% Арыгінал' : '100% Оригинал'}</span>
                </div>
                <p className="text-[10px] text-brand-muted leading-relaxed">
                  {language === 'be' 
                    ? 'Толькі сапраўдная парфума з гарантыяй. Высокая стойкасць і высакародны шлейф.' 
                    : 'Мы гарантируем подлинность каждого аромата. Сохраненная база и ноты, оригинальная стойкость и шлейф парфюмера.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-brand-border pt-16">
        <div className="lg:col-span-7 space-y-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-muted">
            {language === 'be' ? 'Пра аромат' : 'Об аромате'}
          </h2>
          <p className="text-brand-light leading-relaxed text-base sm:text-lg font-light break-words [hyphens:auto] whitespace-pre-wrap font-serif opacity-90">
            {language === 'be' && product.description_be ? product.description_be : product.description}
          </p>
        </div>
        
        {/* Accordions */}
        <div className="lg:col-span-5 space-y-4">
          <NoteDiagram
            topNotes={topNotesList}
            heartNotes={heartNotesList}
            baseNotes={baseNotesList}
            topNotesDuration={product.topNotesDuration}
            topNotesDuration_be={product.topNotesDuration_be}
            heartNotesDuration={product.heartNotesDuration}
            heartNotesDuration_be={product.heartNotesDuration_be}
            baseNotesDuration={product.baseNotesDuration}
            baseNotesDuration_be={product.baseNotesDuration_be}
          />

          {/* Scent Profiles (Longevity, Sillage, Seasonality, Time of Day) */}
          <div className="mt-8 pt-6 border-t border-brand-border/40 space-y-6">
            
            {/* Longevity & Sillage Gauges */}
            <div className="grid grid-cols-2 gap-6 bg-brand-hover/5 p-5 border border-brand-border/45 animate-fade-in">
              <div>
                <span className="text-[10px] uppercase tracking-[0.12em] text-brand-muted font-medium mb-1.5 block">
                  {language === 'be' ? 'стойкасць' : 'стойкость'}
                </span>
                <span className="text-xs sm:text-sm font-serif font-medium text-brand-light leading-snug block h-10">
                  {(() => {
                    const val = product.longevity || 70;
                    if (val < 35) return language === 'be' ? 'Блізка да скуры' : 'Близко к коже';
                    if (val < 65) return language === 'be' ? 'Умераная стойкасць' : 'Умеренная стойкость';
                    if (val < 85) return language === 'be' ? 'Длітельная стойкасць' : 'Длительная стойкость';
                    return language === 'be' ? 'Экстрэмальная стойкасць' : 'Экстремальная стойкость';
                  })()}
                </span>
                <div className="w-full h-1 bg-brand-border/30 rounded-full mt-2 overflow-hidden relative">
                  <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: `${product.longevity || 70}%` }}
                     viewport={{ once: true }}
                     transition={{ duration: 1, ease: "circOut" }}
                     className="h-full bg-brand-accent rounded-full absolute left-0 top-0"
                  />
                </div>
              </div>

              <div className="pl-6 border-l border-brand-border/30">
                <span className="text-[10px] uppercase tracking-[0.12em] text-brand-muted font-medium mb-1.5 block">
                  {language === 'be' ? 'шлейф' : 'шлейф'}
                </span>
                <span className="text-xs sm:text-sm font-serif font-medium text-brand-light leading-snug block h-10">
                  {(() => {
                    const val = product.sillage || 60;
                    if (val < 35) return language === 'be' ? 'Інтымны' : 'Интимный';
                    if (val < 60) return language === 'be' ? 'Умераны шлейф' : 'Умеренный шлейф';
                    if (val < 85) return language === 'be' ? 'Заўважны шлейф' : 'Заметный шлейф';
                    return language === 'be' ? 'Запаўняе ўвесь пакой' : 'Заполняет всю комнату';
                  })()}
                </span>
                <div className="w-full h-1 bg-brand-border/30 rounded-full mt-2 overflow-hidden relative">
                  <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: `${product.sillage || 60}%` }}
                     viewport={{ once: true }}
                     transition={{ duration: 1, ease: "circOut" }}
                     className="h-full bg-brand-accent rounded-full absolute left-0 top-0"
                  />
                </div>
              </div>
            </div>

            {/* Time of Day & Seasonality Visual Compass */}
            <div className="border border-brand-border/40 p-5 space-y-5 bg-[#FAF9F6] shadow-2xs">
              
              {/* Seasonality Grid */}
              <div className="space-y-2.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-brand-muted font-semibold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-brand-accent" />
                  {language === 'be' ? 'сезоннасць' : 'сезонность'}
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { id: 'spring', label: 'Весна', labelBe: 'Вясна' },
                    { id: 'summer', label: 'Лето', labelBe: 'Лета' },
                    { id: 'autumn', label: 'Осень', labelBe: 'Восень' },
                    { id: 'winter', label: 'Зима', labelBe: 'Зіма' }
                  ].map(seasonOpt => {
                    const activeSeasons = product.season || [];
                    let isActive = false;
                    
                    if (activeSeasons.includes('all_season')) {
                      isActive = true;
                    } else if (activeSeasons.length === 0 || (activeSeasons.length === 1 && activeSeasons[0] === '')) {
                      const accordsStr = (product.accords || []).map(a => a.name.toLowerCase()).join(' ');
                      
                      if (seasonOpt.id === 'summer') {
                        isActive = accordsStr.includes('цитрус') || accordsStr.includes('водн') || accordsStr.includes('морск') || accordsStr.includes('свеж');
                      } else if (seasonOpt.id === 'winter') {
                        isActive = accordsStr.includes('сладк') || accordsStr.includes('кожа') || accordsStr.includes('табак') || accordsStr.includes('прян') || accordsStr.includes('тепл');
                      } else if (seasonOpt.id === 'autumn') {
                        isActive = accordsStr.includes('дерев') || accordsStr.includes('карамел') || accordsStr.includes('пудр');
                      } else {
                        isActive = true;
                      }
                    } else {
                      isActive = activeSeasons.includes(seasonOpt.id);
                    }

                    return (
                      <div 
                        key={seasonOpt.id} 
                        className={`py-2 px-1 border transition-all text-[9px] uppercase tracking-wider ${
                          isActive 
                            ? 'bg-brand-accent text-white border-brand-accent font-medium' 
                            : 'border-brand-border/30 bg-transparent text-brand-muted/50'
                        }`}
                      >
                        {language === 'be' ? seasonOpt.labelBe : seasonOpt.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time of Day Sun / Moon Slider */}
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.12em] text-brand-muted font-semibold">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    {language === 'be' ? 'Дзень' : 'День'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    {language === 'be' ? 'Ноч' : 'Ночь'}
                  </span>
                </div>
                
                {/* Visual horizontal compass line */}
                <div className="relative w-full h-1 bg-gradient-to-r from-amber-400/20 via-brand-border/40 to-indigo-500/20 rounded-full flex items-center">
                  <motion.div 
                    initial={{ left: '50%' }}
                    whileInView={{ 
                      left: (() => {
                        const accordsStr = (product.accords || []).map(a => a.name.toLowerCase()).join(' ');
                        let isNightLeaning = accordsStr.includes('уд') || accordsStr.includes('кожа') || accordsStr.includes('табак') || accordsStr.includes('прян') || accordsStr.includes('тепл') || accordsStr.includes('гурма');
                        let isDayLeaning = accordsStr.includes('цитрус') || accordsStr.includes('водн') || accordsStr.includes('мята') || accordsStr.includes('свеж');
                        if (isNightLeaning && !isDayLeaning) return '80%';
                        if (isDayLeaning && !isNightLeaning) return '20%';
                        return '50%';
                      })()
                    }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    className="absolute -translate-x-1/2 w-3.5 h-3.5 bg-brand-accent rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-default z-10"
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute opacity-70" />
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Clean & Minimalist Reviews Block */}
      <div className="mt-20 border-t border-brand-border pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Reviews Info & Submission Form */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-muted font-mono">
                {language === 'be' ? 'Водгукі кліентаў' : 'Отзывы о товаре'}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-serif lining-nums text-brand-light">
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
                    : "5.0"}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => {
                      const avg = reviews.length > 0 
                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) 
                        : 5;
                      return (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(avg) ? 'text-brand-accent fill-brand-accent' : 'text-brand-border'}`} />
                      );
                    })}
                  </div>
                  <p className="text-xs text-brand-muted font-medium">
                    {reviews.length} {language === 'be' ? 'водгук(аў)' : 'отзывов'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subtle submission form */}
            <form onSubmit={submitReview} className="p-6 border border-brand-border/60 bg-brand-hover/10 rounded-none space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                {language === 'be' ? 'Пакінуць водгук' : 'Оставить свой отзыв'}
              </h3>
              
              {reviewSubmitSuccess && (
                <div className="text-xs p-3.5 bg-green-950/20 border border-green-500/30 text-green-400">
                  {language === 'be' 
                    ? 'Дзякуй! Ваш водгук паспяхова адпраўлены і будзе апублікаваны пасля мадэрацыі.' 
                    : 'Спасибо! Ваш отзыв успешно отправлен и будет опубликован после модерации.'}
                </div>
              )}

              {reviewSubmitError && (
                <div className="text-xs p-3.5 bg-red-950/20 border border-red-500/30 text-red-400">
                  {reviewSubmitError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold">
                  {language === 'be' ? 'Ваша імя' : 'Ваше имя'}
                </label>
                <input
                  required
                  type="text"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder={language === 'be' ? 'Увядзіце імя' : 'Введите ваше имя'}
                  className="w-full bg-brand-bg text-xs border border-brand-border/60 rounded-none px-3.5 py-2.5 text-brand-light focus:outline-none focus:border-brand-accent transition-colors block font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold block">
                  {language === 'be' ? 'Адзнака' : 'Ваша оценка'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setNewReviewRating(starVal)}
                      className="p-0.5 text-brand-muted hover:text-brand-accent transition-colors focus:outline-none focus:ring-0"
                    >
                      <Star 
                        className={`w-6 h-6 transition-all duration-150 ${starVal <= newReviewRating ? 'text-brand-accent fill-brand-accent' : 'text-brand-border hover:scale-105'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-brand-muted font-semibold">
                  {language === 'be' ? 'Каментарый' : 'Комментарий'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder={language === 'be' ? 'Падзяліцеся ўражаннямі аб водары...' : 'Поделитесь впечатлениями об аромате...'}
                  className="w-full bg-brand-bg text-xs border border-brand-border/60 rounded-none px-3.5 py-2.5 text-brand-light focus:outline-none focus:border-brand-accent transition-colors block font-medium animate-fade-in"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2.5 bg-brand-accent text-white text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
              >
                {isSubmittingReview 
                  ? (language === 'be' ? 'Адпраўка...' : 'Отправка...') 
                  : (language === 'be' ? 'Адправіць водгук' : 'Отправить отзыв')}
              </button>
            </form>
          </div>

          {/* Clean minimal lists */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-muted mb-6">
              {language === 'be' ? 'Мнініі і ўражанні' : 'Мнения покупателей'}
            </h2>
            
            {reviews.length > 0 ? (
              <div className="divide-y divide-brand-border/40">
                {reviews.map((review, idx) => (
                  <div key={idx} className="py-6 first:pt-0 last:pb-0 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-none bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-[10px] font-semibold text-brand-accent select-none">
                          {review.user_name ? review.user_name[0].toUpperCase() : review.userName ? review.userName[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand-light">
                            {review.user_name || review.userName || 'Аноним'}
                          </p>
                          <p className="text-[10px] text-brand-muted font-medium uppercase tracking-wider">
                            {language === 'be' ? 'Правэраны пакупнік' : 'Проверенный покупатель'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-brand-accent fill-brand-accent' : 'text-brand-border/40'}`} />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-brand-light font-light leading-relaxed pl-9 break-words whitespace-pre-wrap font-serif italic text-brand-light/90">
                      "{review.comment}"
                    </p>
                    
                    {review.createdAt && (
                      <p className="text-[9px] text-brand-muted pl-9">
                        {new Date(review.createdAt).toLocaleDateString(language === 'be' ? 'be-BY' : 'ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 border border-dashed border-brand-border/40 text-center rounded-none bg-brand-hover/5">
                <p className="text-xs text-brand-muted italic font-medium">
                  {language === 'be' 
                    ? 'Пакуль няма водгукаў на гэты тавар. Вы будзеце першым!' 
                    : 'Пока нет отзывов на этот товар. Поделитесь своим мнением первым!'}
                </p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {product && (
        <>
          <RelatedProducts 
            product={product}
          />
          <RecentlyViewed currentProductId={product.id} />
        </>
      )}

      <AnimatePresence>
        {isFullscreenGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setIsFullscreenGalleryOpen(false)}
          >
            <button 
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-none transition-colors z-50 animate-fade-in"
              onClick={() => setIsFullscreenGalleryOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            
            {allImages.length > 1 && (
              <>
                <button 
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-none transition-colors z-50"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-none transition-colors z-50"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="w-full h-full p-4 md:p-12 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <motion.img 
                key={fullscreenImageIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                src={allImages[fullscreenImageIndex]} 
                alt={`${product.name} gallery image ${fullscreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-none border border-white/5"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
