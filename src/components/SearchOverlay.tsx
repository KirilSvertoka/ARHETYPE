import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Sparkles, Star, Heart } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { Product } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          // Take top 5 best matches to make suggestions elegant
          setResults(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleProductClick = (slug: string) => {
    navigate(`/catalog/${slug}`);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  const selectPopularBrand = (brandName: string) => {
    navigate(`/catalog?brand=${encodeURIComponent(brandName)}`);
    onClose();
  };

  const POPULAR_SEARCHES = [
    { name: 'Chloe', label: 'Chloé' },
    { name: 'Byredo', label: 'Byredo' },
    { name: 'Le Labo', label: 'Le Labo' },
    { name: 'Tom Ford', label: 'Tom Ford' },
    { name: 'Creed', label: 'Creed' },
    { name: 'Kilian', label: 'Kilian' }
  ];

  const QUICK_FAMILIES = [
    { id: 'woody', label: language === 'be' ? 'Драўняныя' : 'Древесные' },
    { id: 'oriental', label: language === 'be' ? 'Усходнія' : 'Восточные' },
    { id: 'fresh', label: language === 'be' ? 'Свежыя' : 'Свежие' },
    { id: 'floral', label: language === 'be' ? 'Кветкавыя' : 'Цветочные' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden flex flex-col">
          {/* Backdrop blurring effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Search Content container */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-full max-h-[85vh] bg-brand-bg/95 border-b border-brand-border/40 text-brand-light flex flex-col z-10 overflow-y-auto"
            ref={overlayRef}
          >
            <div className="max-w-4xl mx-auto w-full px-6 py-8 sm:py-12 flex flex-col">
              
              {/* Top search action row */}
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <span className="text-[10px] font-mono tracking-widest text-brand-muted uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3" />
                  {language === 'be' ? 'ЭЛІТНЫ ПАКЕТ ПАШУКУ' : 'ЭЛИТНЫЙ ПОИСК АРОМАТОВ'}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -mr-2 text-brand-muted hover:text-brand-light transition-colors hover:rotate-90 duration-200"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Central Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full mb-8 sm:mb-10">
                <div className="relative flex items-center border-b border-brand-border/60 hover:border-brand-accent transition-colors duration-300">
                  <Search className="absolute left-1 w-5 h-5 text-brand-muted/70" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search')}
                    className="w-full pl-9 pr-12 py-3.5 bg-transparent border-none text-brand-light text-lg sm:text-xl font-sans placeholder-brand-muted/40 focus:outline-none focus:ring-0 font-light"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2 p-1.5 text-brand-muted/60 hover:text-brand-light"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Main suggestions and queries split layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 flex-1">
                
                {/* Left side: Search suggestions or placeholder information */}
                <div className="md:col-span-7 space-y-6">
                  {loading && (
                    <div className="space-y-4 py-4 animate-pulse">
                      <div className="h-2.5 bg-brand-border/50 rounded-full w-40"></div>
                      <div className="space-y-3">
                        <div className="h-10 bg-brand-border/30 rounded-none w-full"></div>
                        <div className="h-10 bg-brand-border/30 rounded-none w-full"></div>
                        <div className="h-10 bg-brand-border/30 rounded-none w-full"></div>
                      </div>
                    </div>
                  )}

                  {!loading && query && results.length === 0 && (
                    <div className="py-8 text-center sm:text-left">
                      <p className="text-brand-muted text-sm font-light mb-2">
                        {language === 'be' ? 'Нічога не знойдзена па запыце' : 'Ничего не найдено по запросу'}{' '}
                        <span className="text-brand-accent italic font-medium">"{query}"</span>
                      </p>
                      <p className="text-xs text-brand-muted/70 font-light">
                        {language === 'be' 
                          ? 'Паспрабуйце ўвесці іншае імя, праверце правапіс, або абярыце адзін з папулярных брэндаў.' 
                          : 'Попробуйте ввести другое имя, проверьте правописание, или выберите один из популярных брендов.'}
                      </p>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-mono tracking-widest text-brand-muted uppercase">
                        {language === 'be' ? 'ПРАДЛАЖЭННІ ТАВАРАЎ' : 'ПРЕДЛОЖЕНИЯ ТОВАРОВ'} ({results.length})
                      </h3>
                      <div className="space-y-1.5 division-y division-brand-border/30">
                        {results.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product.slug)}
                            className="group flex gap-3.5 items-center p-2.5 -mx-2.5 hover:bg-brand-hover/40 rounded-none border border-transparent hover:border-brand-border/30 cursor-pointer transition-all duration-300"
                          >
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-11 h-11 object-cover bg-brand-hover/10 mix-blend-lighten border border-brand-border/30 group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="block text-[10px] uppercase font-sans tracking-wide text-brand-accent/90">
                                {product.brand}
                              </span>
                              <h4 className="text-sm font-serif tracking-tight text-brand-light truncate group-hover:text-brand-accent transition-colors">
                                {product.name}
                              </h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-xs font-mono font-medium text-brand-light">
                                {product.price} {t('currency')}
                              </span>
                              <span className="text-[9px] text-brand-muted font-light uppercase tracking-wider block">
                                {product.concentration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSearchSubmit}
                        className="w-full py-2.5 border border-brand-border/60 hover:border-brand-accent text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-light transition-all flex items-center justify-center gap-2 group cursor-pointer mt-4"
                      >
                        {language === 'be' ? 'Глядзець усе вынікі' : 'Смотреть все результаты'}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}

                  {!query && (
                    <div className="py-2 text-center sm:text-left">
                      <p className="text-brand-muted/70 text-sm font-light">
                        {language === 'be' 
                          ? 'Пачніце ўводзіць назву або брэнд водару, каб убачыць імгненныя прапановы.' 
                          : 'Начните вводить название или бренд аромата, чтобы увидеть мгновенные предложения.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right side: Quick Links & Popular Searches */}
                <div className="md:col-span-5 space-y-8 md:border-l md:border-brand-border/30 md:pl-8">
                  {/* Popular Perfume Houses */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-mono tracking-widest text-brand-muted uppercase">
                      {language === 'be' ? 'БРЭНДЫ Ў ТРЭНДЗЕ' : 'БРЕНДЫ В ТРЕНДЕ'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => selectPopularBrand(item.name)}
                          className="px-3.5 py-2 bg-brand-hover/30 hover:bg-brand-accent text-xs tracking-wide text-brand-light hover:text-white border border-brand-border/40 hover:border-brand-accent rounded-none transition-all duration-200 cursor-pointer text-left"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Families Filter */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-mono tracking-widest text-brand-muted uppercase">
                      {language === 'be' ? 'ПАРФУМЕРНЫЯ СЯМЕЙСТВЫ' : 'ПАРФЮМЕРНЫЕ СЕМЕЙСТВА'}
                    </h3>
                    <ul className="grid grid-cols-2 gap-2 text-xs">
                      {QUICK_FAMILIES.map((family) => (
                        <button
                          key={family.id}
                          onClick={() => {
                            navigate(`/catalog?families=${encodeURIComponent(family.id)}`);
                            onClose();
                          }}
                          className="text-left py-2 px-3 border border-brand-border/20 text-brand-muted hover:text-brand-accent hover:border-brand-accent/40 bg-brand-hover/10 hover:bg-brand-hover/20 transition-all font-light"
                        >
                          {family.label}
                        </button>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
