import { useEffect, useState, useRef } from 'react';
import { Product } from '../types';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CallbackForm from '../components/CallbackForm';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, X, ChevronDown, Check, SlidersHorizontal, Filter, Grid2X2, Square } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../components/LanguageProvider';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeGenderTab, setActiveGenderTab] = useState<'All' | 'Male' | 'Female' | 'Unisex'>('All');
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [accordsList, setAccordsList] = useState<string[]>([]);
  const [selectedAccords, setSelectedAccords] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<{type: string, text: string, id?: number}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const genderParam = params.get('gender');
    const sortParam = params.get('sort');
    const brandParam = params.get('brand');

    if (categoryParam) setActiveCategory(categoryParam);
    if (genderParam) setActiveGenderTab(genderParam as any);
    if (sortParam) setSortBy(sortParam);
    if (brandParam) setActiveBrand(brandParam);
  }, [location.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
          setShowSuggestions(true);
        })
        .catch(console.error);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch brands and accords on mount
  useEffect(() => {
    fetch('/api/brands')
      .then(res => {
        if (!res.ok) throw new Error(`Brands fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => setBrands(['All', ...data]))
      .catch(console.error);

    fetch('/api/accords')
      .then(res => {
        if (!res.ok) throw new Error(`Accords fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => setAccordsList(data))
      .catch(console.error);
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
    if (activeBrand !== 'All') params.append('brand', activeBrand);
    if (activeGenderTab !== 'All') params.append('gender', activeGenderTab);
    if (activeCategory !== 'All') params.append('category', activeCategory);
    if (selectedFamilies.length > 0) {
      // Map family IDs (e.g. 'familyFloral') to DB values (e.g. 'Floral')
      const mappedFamilies = selectedFamilies.map(f => f.replace('family', ''));
      params.append('families', mappedFamilies.join(','));
    }
    if (selectedAccords.length > 0) {
      params.append('accords', selectedAccords.join(','));
    }
    params.append('sort', sortBy);

    fetch(`/api/products?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products', err);
        setLoading(false);
      });
  }, [debouncedSearchQuery, activeBrand, activeGenderTab, selectedFamilies, selectedAccords, sortBy, activeCategory]);

  const scentFamilies = [
    { id: 'familyFloral', label: t('familyFloral') },
    { id: 'familyOriental', label: t('familyOriental') },
    { id: 'familyWoody', label: t('familyWoody') },
    { id: 'familyFresh', label: t('familyFresh') },
    { id: 'familyCitrus', label: t('familyCitrus') },
    { id: 'familySpicy', label: t('familySpicy') },
    { id: 'familyLeather', label: t('familyLeather') },
    { id: 'familyGourmand', label: t('familyGourmand') },
    { id: 'familyChypre', label: t('familyChypre') },
    { id: 'familyFougere', label: t('familyFougere') },
  ];

  const toggleFamily = (familyId: string) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const toggleAccord = (accord: string) => {
    setSelectedAccords(prev =>
      prev.includes(accord)
        ? prev.filter(a => a !== accord)
        : [...prev, accord]
    );
  };

  const resetFilters = () => {
    setActiveGenderTab('All');
    setSelectedFamilies([]);
    setSelectedAccords([]);
    setActiveBrand('All');
    setActiveCategory('All');
    setSortBy('name-asc');
    setSearchQuery('');
  };

  const activeFiltersCount = (activeGenderTab !== 'All' ? 1 : 0) + selectedFamilies.length + selectedAccords.length + (activeBrand !== 'All' ? 1 : 0) + (sortBy !== 'name-asc' ? 1 : 0) + (activeCategory !== 'All' ? 1 : 0);

  const scrollToCallback = () => {
    const element = document.getElementById('callback-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCategoryName = () => {
    let parts = [];
    
    // Brand part (usually first for specific brands)
    if (activeBrand !== 'All') {
      parts.push(activeBrand);
    }

    // Gender part
    if (activeGenderTab === 'Male') parts.push(language === 'be' ? 'Мужчынская парфумерыя' : 'Мужская парфюмерия');
    else if (activeGenderTab === 'Female') parts.push(language === 'be' ? 'Жаночая парфумерыя' : 'Женская парфюмерия');
    else if (activeGenderTab === 'Unisex') parts.push(language === 'be' ? 'Унісекс парфумерыя' : 'Унисекс парфюмерия');
    else if (activeBrand === 'All') parts.push(language === 'be' ? 'Нішавая парфумерыя' : 'Нишевая парфюмерия');
    else parts.push(language === 'be' ? 'парфумерыя' : 'парфюмерия');
    
    // Category part (suffix)
    if (activeCategory === 'decant') parts.push(language === 'be' ? '(адліванты)' : '(отливанты)');
    else if (activeCategory === 'perfume') parts.push(language === 'be' ? '(цэлыя флаконы)' : '(целые флаконы)');
    
    // Family part
    if (selectedFamilies.length === 1) {
      const family = scentFamilies.find(f => f.id === selectedFamilies[0]);
      if (family) parts.push(`— ${family.label.toLowerCase()}`);
    }

    return parts.join(' ');
  };

  const categoryName = getCategoryName();
  // Index Brand, Gender, and Brand+Gender intersections. Others noindex.
  const isNoIndex = !!debouncedSearchQuery || (selectedFamilies.length > 0 && activeBrand === 'All') || (selectedAccords.length > 0);
  
  const minPrice = products.length > 0 ? Math.min(...products.flatMap(p => {
    if (p.variants && p.variants.length > 0) {
      return p.variants.map(v => typeof v.price === 'number' ? v.price : parseFloat(v.price as string)).filter(p => !isNaN(p));
    }
    const basePrice = typeof p.price === 'number' ? p.price : parseFloat(p.price as string);
    return isNaN(basePrice) ? [] : [basePrice];
  })) : 0;

  const pageTitle = `${categoryName} — купить в Гродно/Беларуси цены в интернет-магазине АРХЕТИП`;
  const pageDescription = `Предлагаем купить ${categoryName} оригинал. Большой выбор, гарантия качества, доставка по Гродно и Беларуси. ${minPrice > 0 ? `Цены от ${minPrice.toFixed(2)} руб.` : ''}`;

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
        "name": categoryName,
        "item": window.location.href
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pb-24 relative"
    >
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {isNoIndex && <meta name="robots" content="noindex, nofollow" />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://archetype.by/catalog" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <Breadcrumbs 
          items={[
            { label: t('catalog') || (language === 'be' ? 'Каталог' : 'Каталог'), path: '/catalog' },
            ...(activeBrand !== 'All' ? [{ label: activeBrand }] : []),
            ...(activeGenderTab !== 'All' ? [{ label: activeGenderTab === 'Male' ? (language === 'be' ? 'Мужчынская' : 'Мужская') : activeGenderTab === 'Female' ? (language === 'be' ? 'Жаночая' : 'Женская') : (language === 'be' ? 'Унісекс' : 'Унисекс') }] : [])
          ]} 
        />
      </div>

      <section className="text-center max-w-3xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 pt-4 mb-8">
        <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-brand-light leading-tight">
          {categoryName}
        </h1>
        <p className="text-lg text-brand-muted font-light leading-relaxed">
          {t('exploreCatalog')}
        </p>
      </section>

      <div className="sticky top-[96px] z-40 bg-brand-bg border-b border-brand-border mb-8 sm:mb-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-muted" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl text-brand-light placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all shadow-sm text-sm"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
              />
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-brand-bg border border-brand-border rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <ul>
                      {suggestions.map((sugg, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => {
                              setSearchQuery(sugg.text);
                              setShowSuggestions(false);
                              if (sugg.type === 'brand') {
                                setActiveBrand(sugg.text);
                              }
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-brand-hover text-sm border-b border-brand-border/50 last:border-b-0 flex items-center justify-between"
                          >
                            <span className="text-brand-light font-medium">{sugg.text}</span>
                            <span className="text-xs text-brand-muted uppercase tracking-wider">{sugg.type === 'brand' ? 'Бренд' : 'Аромат'}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileGridCols(prev => prev === 1 ? 2 : 1)}
                className="sm:hidden p-2.5 text-brand-muted hover:text-brand-accent transition-colors border border-brand-border rounded-xl hover:bg-brand-hover bg-white"
                title="Изменить вид сетки"
              >
                {mobileGridCols === 1 ? <Grid2X2 className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-brand-accent text-white border-brand-accent'
                    : 'bg-brand-hover text-brand-muted border-brand-border hover:border-brand-accent/40'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">{t('filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-brand-bg text-brand-accent text-xs rounded-full w-5 h-5 flex items-center justify-center border border-brand-accent/20">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterOpen(false)}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 left-0 bottom-0 w-full max-w-md bg-brand-bg z-[70] shadow-2xl flex flex-col border-r border-brand-border"
                >
                  <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg">
                    <h2 className="text-2xl font-serif text-brand-light flex items-center gap-2">
                      <Filter className="w-6 h-6 text-brand-accent" />
                      {t('filters')}
                    </h2>
                    <button onClick={() => setIsFilterOpen(false)} className="p-2 text-brand-muted hover:text-brand-accent transition-colors rounded-full hover:bg-brand-hover">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-brand-bg">
                    {/* Category Filter */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        {t('categories')}
                      </h3>
                      <div className="relative">
                        <select
                          value={activeCategory}
                          onChange={(e) => setActiveCategory(e.target.value)}
                          className="w-full appearance-none bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all cursor-pointer shadow-sm"
                        >
                          <option value="All">{t('allFamilies')}</option>
                          <option value="perfume">{t('perfume')}</option>
                          <option value="eau_de_toilette">{t('eauDeToilette')}</option>
                          <option value="cologne">{t('cologne')}</option>
                          <option value="decant">{language === 'be' ? 'Адліванты' : 'Отливанты'}</option>
                          <option value="set">{language === 'be' ? 'Наборы' : 'Наборы'}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-brand-muted">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        {t('brand')}
                      </h3>
                      <div className="relative">
                        <select
                          value={activeBrand}
                          onChange={(e) => setActiveBrand(e.target.value)}
                          className="w-full appearance-none bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all cursor-pointer"
                        >
                          {brands.map(brand => (
                            <option key={brand} value={brand}>
                              {brand === 'All' ? t('allBrands') : brand}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-brand-muted">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Gender Filter */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        {t('gender')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'All', label: t('genderAll') },
                          { id: 'Female', label: t('genderFemale') },
                          { id: 'Male', label: t('genderMale') },
                          { id: 'Unisex', label: t('genderUnisex') }
                        ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveGenderTab(tab.id as any)}
                              className={`px-4 py-2.5 rounded-xl text-sm transition-all border ${
                                activeGenderTab === tab.id
                                  ? 'bg-brand-accent text-white border-brand-accent font-medium'
                                  : 'bg-white text-brand-muted border-brand-border hover:border-brand-accent/40 hover:text-brand-accent'
                              }`}
                            >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        {t('sortBy')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'name-asc', label: t('sortNameAsc') },
                          { id: 'name-desc', label: t('sortNameDesc') },
                          { id: 'price-asc', label: t('sortPriceAsc') },
                          { id: 'price-desc', label: t('sortPriceDesc') },
                          { id: 'popularity', label: language === 'be' ? 'Папулярнасць' : 'Популярность' }
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={`px-4 py-2.5 rounded-xl text-sm transition-all border ${
                              sortBy === option.id
                                ? 'bg-brand-accent text-white border-brand-accent font-medium'
                                : 'bg-white text-brand-muted border-brand-border hover:border-brand-accent/40 hover:text-brand-accent'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scent Families */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                          {t('scentFamilies')}
                        </h3>
                        {selectedFamilies.length > 0 && (
                          <button 
                            onClick={() => setSelectedFamilies([])}
                            className="text-xs text-brand-accent hover:underline font-medium"
                          >
                            {t('reset')}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scentFamilies.map(family => (
                          <button
                            key={family.id}
                            onClick={() => toggleFamily(family.id)}
                            className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all border ${
                              selectedFamilies.includes(family.id)
                                ? 'bg-brand-accent text-white border-brand-accent'
                                : 'bg-white text-brand-muted border-brand-border hover:border-brand-accent/40 hover:text-brand-accent'
                            }`}
                          >
                            {family.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accords Filter */}
                    {accordsList.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                            {language === 'be' ? 'Акорды' : 'Аккорды'}
                          </h3>
                          {selectedAccords.length > 0 && (
                            <button 
                              onClick={() => setSelectedAccords([])}
                              className="text-xs text-brand-accent hover:underline font-medium"
                            >
                              {t('reset')}
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {accordsList.map(accord => (
                            <button
                              key={accord}
                              onClick={() => toggleAccord(accord)}
                              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all border ${
                                selectedAccords.includes(accord)
                                  ? 'bg-brand-accent text-white border-brand-accent'
                                  : 'bg-white text-brand-muted border-brand-border hover:border-brand-accent/40 hover:text-brand-accent'
                              }`}
                            >
                              {accord}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-brand-border flex gap-4 bg-brand-bg">
                    <button
                      onClick={resetFilters}
                      className="flex-1 px-4 py-3.5 text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors border border-brand-border rounded-xl hover:bg-brand-hover"
                    >
                      {t('reset')}
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 px-6 py-3.5 bg-brand-accent text-white rounded-xl text-sm font-medium hover:bg-brand-accent-hover transition-all shadow-md active:scale-[0.98]"
                    >
                      {t('apply')}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <section className="relative min-h-[400px] mb-16 sm:mb-24">
        {loading && (
          <div className="absolute inset-0 z-10 bg-brand-bg/50 backdrop-blur-[2px] flex justify-center items-center">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-brand-accent/20 h-10 w-10"></div>
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-brand-accent/20 rounded w-32"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-brand-accent/20 rounded col-span-2"></div>
                    <div className="h-2 bg-brand-accent/20 rounded col-span-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {products.map((product, index) => {
            return (
              <div key={product.id} className="bg-brand-bg">
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 1, 
                    ease: [0.21, 1, 0.36, 1],
                    delay: (index % 3) * 0.1 
                  }}
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              </div>
            );
          })}
          {!loading && products.length === 0 && (
            <div className="col-span-full text-center py-24 text-brand-muted bg-brand-bg">
              {t('noProductsFound')} "{searchQuery}".
            </div>
          )}
        </div>
      </section>

      <section id="callback-section" className="max-w-xl mx-auto bg-brand-bg/50 p-8 md:p-12 rounded-3xl shadow-sm border border-brand-border mx-4 sm:mx-auto mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif mb-2 text-brand-light">{t('needAssistance')}</h2>
          <p className="text-brand-muted text-sm">
            {t('leaveDetails')}
          </p>
        </div>
        <CallbackForm />
      </section>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        onClick={scrollToCallback}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-4 bg-brand-accent text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label={t('contactUs')}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}
