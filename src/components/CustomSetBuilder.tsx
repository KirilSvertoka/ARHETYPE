import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, SlidersHorizontal, Eye, ShoppingBag, CheckCircle2, RefreshCw, X, Sparkles, Box, Info, ChevronDown } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';

interface CustomSetBuilderProps {
  onAddToCartSuccess?: () => void;
}

export default function CustomSetBuilder({ onAddToCartSuccess }: CustomSetBuilderProps) {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  
  // States
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [boxSize, setBoxSize] = useState<3 | 5>(3);
  const [selectedItems, setSelectedItems] = useState<(Product | null)[]>(Array(3).fill(null));
  const [selectedVariants, setSelectedVariants] = useState<(ProductVariant | null)[]>(Array(3).fill(null));
  
  // Selection / Search states
  const [activeSlot, setActiveSlot] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female' | 'Unisex'>('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [brands, setBrands] = useState<string[]>([]);
  
  // Success states
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          const items: Product[] = Array.isArray(data) ? data : (data.products || []);
          setProducts(items);
          
          // Get unique brands
          const uniqueBrands = Array.from(new Set(items.map(p => p.brand))).sort();
          setBrands(uniqueBrands);
        }
      } catch (err) {
        console.error('Failed to load products in Set Builder', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Update selected array when box size changes
  const handleBoxSizeChange = (size: 3 | 5) => {
    setBoxSize(size);
    setSelectedItems(prev => {
      if (prev.length === size) return prev;
      if (prev.length < size) {
        return [...prev, ...Array(size - prev.length).fill(null)];
      } else {
        return prev.slice(0, size);
      }
    });
    setSelectedVariants(prev => {
      if (prev.length === size) return prev;
      if (prev.length < size) {
        return [...prev, ...Array(size - prev.length).fill(null)];
      } else {
        return prev.slice(0, size);
      }
    });
    if (activeSlot && activeSlot >= size) {
      setActiveSlot(0);
    }
  };

  // Safe decant extraction: gets standard decant variant or falls back to lowest price variant
  const getPreferredDecantVariant = (product: Product): ProductVariant | null => {
    if (!product.variants || product.variants.length === 0) return null;
    
    // 1. Try to find variant explicit decant with size ~ 2ml or 3ml
    const decant2ml = product.variants.find(v => v.size.toLowerCase().includes('2ml') || v.size === '2' || v.size === '3');
    if (decant2ml) return decant2ml;
    
    // 2. Try to find any splitting or decant type
    const decant = product.variants.find(v => v.variant_type === 'decant' || v.variant_type === 'splitting');
    if (decant) return decant;

    // 3. Fallback to smallest size
    const sorted = [...product.variants].sort((a, b) => {
      const aVal = parseFloat(a.size) || 999;
      const bVal = parseFloat(b.size) || 999;
      return aVal - bVal;
    });
    return sorted[0];
  };

  // Add perfume to current slot
  const handleSelectPerfume = (product: Product) => {
    if (activeSlot === null) return;
    
    const variant = getPreferredDecantVariant(product);
    
    const newItems = [...selectedItems];
    newItems[activeSlot] = product;
    setSelectedItems(newItems);

    const newVariants = [...selectedVariants];
    newVariants[activeSlot] = variant;
    setSelectedVariants(newVariants);

    // Auto navigate to next empty slot or close editing
    const nextEmpty = newItems.findIndex((item, idx) => item === null);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    } else {
      setActiveSlot(null); // All filled!
    }
  };

  // Clear slot
  const handleClearSlot = (index: number) => {
    const newItems = [...selectedItems];
    newItems[index] = null;
    setSelectedItems(newItems);

    const newVariants = [...selectedVariants];
    newVariants[index] = null;
    setSelectedVariants(newVariants);

    setActiveSlot(index);
    setAddedToCartSuccess(false);
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    const matchesBrand = brandFilter === 'All' || p.brand === brandFilter;

    // Must have variants (at least decants) to be added to a custom set
    const hasVariants = p.variants && p.variants.length > 0;
    
    return matchesSearch && matchesGender && matchesBrand && hasVariants;
  });

  // Price calculations
  const calculateOriginalTotal = () => {
    return selectedVariants.reduce((sum, v, idx) => {
      if (v) return sum + (typeof v.price === 'number' ? v.price : parseFloat(v.price as string) || 0);
      // fallback to product starting price if no variant
      const p = selectedItems[idx];
      if (p) return sum + (typeof p.price === 'number' ? p.price : parseFloat(p.price as string) || 0);
      return sum;
    }, 0);
  };

  const discountPercent = 15; // Custom box discount!
  const originalTotal = calculateOriginalTotal();
  const boxDiscount = (originalTotal * discountPercent) / 100;
  const setPrice = originalTotal - boxDiscount;

  // Build the virtul custom set Product and add to Cart
  const handleAddBoxToCart = () => {
    const filledCount = selectedItems.filter(item => item !== null).length;
    if (filledCount < boxSize) {
      alert(language === 'be' ? 'Калі ласка, запоўніце ўсе слоты ў наборы!' : 'Пожалуйста, заполните все слоты в наборе!');
      return;
    }

    // Compose a list of sub-items
    const subItemsSummary = selectedItems.map((item, idx) => {
      const v = selectedVariants[idx];
      return {
        id: item!.id,
        name: item!.name,
        brand: item!.brand,
        size: v ? v.size : '2ml'
      };
    });

    // Create unique combined components string for order item tracking
    const listDescription = subItemsSummary.map(itm => `${itm.brand} - ${itm.name} (${itm.size})`).join(', ');

    // Virtual Product model for custom box
    const customSetProduct: Product = {
      id: 900000 + Math.floor(Math.random() * 99999), // Virtual unique ID
      name: language === 'be' 
        ? `Парфумерны набор адлівантаў (${boxSize} шт)` 
        : `Набор отливантов Archetype Box (${boxSize} шт)`,
      brand: 'Archetype Set Creator',
      slug: 'custom-discovery-set-' + Date.now(),
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
      description: `Индвидуальный набор из ${boxSize} отливантов: ${listDescription}`,
      description_be: `Індывідуальны набор з ${boxSize} адлівантаў: ${listDescription}`,
      price: parseFloat(setPrice.toFixed(2)),
      topNotes: [],
      heartNotes: [],
      baseNotes: [],
      gender: 'Unisex',
      concentration: 'EDP',
      scentFamilies: [],
      tags: ['set', 'custom-set'],
      stockThreshold: 0,
      variants: [
        {
          id: 9900000 + Math.floor(Math.random() * 99999),
          productId: 900000,
          size: `${boxSize} x 2ml`,
          price: parseFloat(setPrice.toFixed(2)),
          stock: 999,
          sku: `CUSTOM-${boxSize}SET-${Date.now()}`,
          variant_type: 'decant'
        }
      ]
    };

    // Include the extra list of sub-items directly as generic properties
    const cartProductWithSubItems = {
      ...customSetProduct,
      customBundleItems: subItemsSummary,
      // Overwrite base item details
      name: language === 'be' 
        ? `Індывідуальны набор адлівантаў (${boxSize}шт)` 
        : `Индивидуальный набор отливантов (${boxSize}шт)`,
      brand: 'Archetype Custom Box'
    };

    // Add to cart with the variant ID
    addToCart(cartProductWithSubItems as any, cartProductWithSubItems.variants[0].id);
    
    setAddedToCartSuccess(true);
    setTimeout(() => setAddedToCartSuccess(false), 3000);
  };

  return (
    <div className="bg-brand-bg rounded-[2rem] border border-brand-border/40 p-4 sm:p-8 md:p-12 shadow-xl max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-brand-border/30 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-accent/10 border border-brand-accent/25 rounded-full text-[10px] text-brand-accent font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-brand-accent" />
            Interactive Lab
          </span>
          <h2 className="text-3xl font-serif text-brand-light font-medium tracking-tight">
            {language === 'be' ? 'Канструктар адлівантаў' : 'Конструктор аромабоксов'}
          </h2>
          <p className="text-sm text-brand-muted mt-1 max-w-xl font-light">
            {language === 'be' 
              ? 'Стварыце персанальны набор з 3 ці 5 любімых селектыўных водараў са зніжкай 15%. Мы запакуем іх у фірмовы аромабокс з анатацыямі.'
              : 'Создайте персональный наборы из 3 или 5 любых нишевых ароматов со скидкой 15%. Мы бережно упакуем их в наш фирменный аромабокс с карточками описания.'}
          </p>
        </div>
        
        {/* Box Size Selector */}
        <div className="flex bg-white/5 border border-brand-border/40 p-1 rounded-xl">
          <button 
            onClick={() => handleBoxSizeChange(3)}
            className={`px-4 py-2 text-xs uppercase font-semibold tracking-wider transition-all duration-300 rounded-lg ${boxSize === 3 ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-light'}`}
          >
            {language === 'be' ? '3 водары' : '3 аромата'}
          </button>
          <button 
            onClick={() => handleBoxSizeChange(5)}
            className={`px-4 py-2 text-xs uppercase font-semibold tracking-wider transition-all duration-300 rounded-lg ${boxSize === 5 ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-light'}`}
          >
            {language === 'be' ? '5 водараў' : '5 ароматов'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Slots visualization */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xs uppercase tracking-widest font-mono text-brand-muted block pl-1">
            {language === 'be' ? 'Ваш набор:' : 'Ваш аромабокс:'}
          </h3>

          <div className="p-6 bg-white/[0.02] border border-brand-border/50 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[420px]">
            {/* Ambient box mesh lines styling */}
            <div className="absolute inset-0 border border-brand-accent/5 rounded-3xl pointer-events-none scale-[0.98]" />
            
            {/* Visual presentation of slots */}
            <div className="space-y-4 z-10">
              {selectedItems.map((item, idx) => {
                const isActive = activeSlot === idx;
                const v = selectedVariants[idx];
                const priceVal = v ? (typeof v.price === 'number' ? v.price : parseFloat(v.price as string)) : 0;
                
                return (
                  <motion.div 
                    layout
                    key={idx}
                    onClick={() => setActiveSlot(idx)}
                    className={`flex items-center gap-4 p-3 border rounded-2xl cursor-pointer transition-all duration-300 group select-none ${
                      isActive 
                        ? 'border-brand-accent bg-brand-accent/[0.04] shadow-md shadow-brand-accent/5' 
                        : item 
                          ? 'border-brand-border/50 bg-white/[0.01] hover:border-brand-border/80' 
                          : 'border-dashed border-brand-border hover:border-brand-muted/70 bg-transparent'
                    }`}
                  >
                    {/* Index number/Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                      item 
                        ? 'bg-brand-accent/15 text-brand-accent' 
                        : isActive 
                          ? 'bg-brand-light/10 text-brand-light' 
                          : 'bg-white/5 text-brand-muted'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0">
                      {item ? (
                        <>
                          <p className="text-xs text-brand-muted font-medium uppercase tracking-wider">{item.brand}</p>
                          <h4 className="text-sm text-brand-light font-medium truncate">{item.name}</h4>
                          <span className="text-[10px] inline-block font-mono text-brand-accent mt-0.5">
                            {v ? `${v.size}` : '2ml'} — {priceVal.toFixed(2)} BYN
                          </span>
                        </>
                      ) : (
                        <p className="text-xs font-mono text-brand-muted uppercase tracking-widest py-1">
                          {isActive 
                            ? (language === 'be' ? 'ВЫБЕРЫЦЕ АРАМАТ...' : 'ВЫБЕРИТЕ АРОМАТ...') 
                            : (language === 'be' ? 'Пусты слот...' : 'Пустой слот...')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {item ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearSlot(idx); }}
                        className="p-1.5 bg-red-500/10 text-red-400 group-hover:opacity-100 opacity-60 rounded-xl hover:bg-red-500 hover:text-white transition-all border-none cursor-pointer"
                        title={language === 'be' ? 'Ачысціць' : 'Очистить'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'text-brand-accent animate-pulse' : 'text-brand-muted'}`}>
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Total box calculations and CTA */}
            <div className="mt-8 border-t border-brand-border/30 pt-6 space-y-4">
              <div className="flex justify-between items-center text-xs text-brand-muted uppercase tracking-wider">
                <span>{language === 'be' ? 'Агульны кошт адлівантаў' : 'Обычная сумма'}</span>
                <span className="line-through">{originalTotal.toFixed(2)} BYN</span>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                <span>{language === 'be' ? 'Сеткавая зніжка 15%' : 'Скидка набора 15%'}</span>
                <span>-{boxDiscount.toFixed(2)} BYN</span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-sm font-sans font-medium uppercase text-brand-light tracking-wider">
                  {language === 'be' ? 'Выніковы кошт набору' : 'Итого за набор'}
                </span>
                <span className="text-3xl font-serif text-brand-light font-semibold">
                  {setPrice.toFixed(2)} BYN
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddBoxToCart}
                disabled={selectedItems.some(item => item === null)}
                className="w-full mt-2 py-4 bg-brand-accent text-white rounded-none hover:bg-brand-accent-hover font-semibold text-xs tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group border border-brand-accent/20"
              >
                {addedToCartSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'be' ? 'Набор дададзены!' : 'Набор добавлен!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>{language === 'be' ? 'Дадаць набор у кашык' : 'Добавить набор в корзину'}</span>
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-brand-muted text-center flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand-accent/70 shrink-0" />
                <span>
                  {language === 'be'
                    ? 'Мы дададзім да набору бясплатны фірмовы пакет Archetype.'
                    : 'Мы добавим к набору бесплатный фирменный пакет Archetype.'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Search, filters and selecting perfumes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <h3 className="text-xs uppercase tracking-widest font-mono text-brand-muted block pl-1">
              {activeSlot !== null 
                ? (language === 'be' ? `Парфума для слота ${activeSlot + 1}:` : `Парфюм для слота ${activeSlot + 1}:`)
                : (language === 'be' ? 'Усе слаты запоўнены' : 'Все слоты заполнены')}
            </h3>

            {/* Quick gender filters */}
            <div className="flex bg-white/5 border border-brand-border/40 p-0.5 rounded-lg text-[10px]">
              {(['All', 'Male', 'Female', 'Unisex'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`px-2.5 py-1.5 uppercase tracking-wider rounded-md font-semibold transition-all ${genderFilter === g ? 'bg-brand-light/10 text-white' : 'text-brand-muted hover:text-brand-light'}`}
                >
                  {g === 'All' ? (language === 'be' ? 'Усе' : 'Все') :
                   g === 'Male' ? (language === 'be' ? 'Ён' : 'Он') :
                   g === 'Female' ? (language === 'be' ? 'Яна' : 'Она') : 'Mix'}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar & Brand selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-brand-muted">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70 font-light"
                placeholder={language === 'be' ? 'Пошук па назве ці брэндзе...' : 'Поиск по названию или бренду...'}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-light"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white/5 border border-brand-border rounded-xl text-xs text-brand-light font-medium focus:outline-none focus:border-brand-accent cursor-pointer"
              >
                <option value="All" className="bg-brand-bg text-brand-light">{language === 'be' ? 'Усе брэнды' : 'Все бренды'}</option>
                {brands.map(brand => (
                  <option key={brand} value={brand} className="bg-brand-bg text-brand-light">{brand}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-brand-muted">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Scent selector grid */}
          <div className="p-4 bg-white/[0.01] border border-brand-border rounded-3xl min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 text-brand-muted font-light text-sm">
                {language === 'be' ? 'Ароматы не знойдзены.' : 'Ароматы не найдены.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
                {filteredProducts.map(product => {
                  const preVariant = getPreferredDecantVariant(product);
                  const price = preVariant ? (typeof preVariant.price === 'number' ? preVariant.price : parseFloat(preVariant.price as string)) : (typeof product.price === 'number' ? product.price : parseFloat(product.price as string));
                  
                  return (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={product.id}
                      onClick={() => activeSlot !== null && handleSelectPerfume(product)}
                      className={`flex gap-3 p-3 bg-brand-hover/5 hover:bg-brand-hover/15 border border-brand-border/40 rounded-2xl items-center cursor-pointer transition-all ${
                        activeSlot === null ? 'opacity-40 pointer-events-none' : 'hover:border-brand-accent/50'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-brand-light/5 shrink-0">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>

                      {/* Detail Column */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-brand-muted font-bold uppercase truncate tracking-wider">{product.brand}</p>
                        <h4 className="text-xs text-brand-light font-medium truncate leading-tight">{product.name}</h4>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-brand-light/[0.04] text-brand-muted font-mono rounded">
                            {preVariant ? preVariant.size : '2ml'}
                          </span>
                          <span className="text-xs font-mono font-medium text-brand-accent">
                            {price.toFixed(2)} BYN
                          </span>
                        </div>
                      </div>

                      {/* Selector Trigger button */}
                      <button
                        type="button"
                        disabled={activeSlot === null}
                        className="p-1 px-2.5 bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent hover:text-white transition-all text-[9px] uppercase font-bold tracking-wider text-brand-accent leading-none rounded-lg"
                      >
                        {language === 'be' ? 'Выбраць' : 'Выбрать'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
