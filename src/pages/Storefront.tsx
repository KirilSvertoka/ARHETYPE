import { useEffect, useState, useRef } from 'react';
import { Product } from '../types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CallbackForm from '../components/CallbackForm';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageCircle, X, ChevronDown, Check, SlidersHorizontal, Filter, Grid2X2, Square } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../components/LanguageProvider';
import Breadcrumbs from '../components/Breadcrumbs';
import { brandPath, resolveBrandFromSlug, SITE_ORIGIN } from '../utils/seo';

export default function Storefront() {
  const location = useLocation();
  const navigate = useNavigate();
  const { brandSlug } = useParams<{ brandSlug?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(location.search).get('search') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => new URLSearchParams(location.search).get('search') || '');
  const [activeGenderTab, setActiveGenderTab] = useState<'All' | 'Male' | 'Female' | 'Unisex'>(() => (new URLSearchParams(location.search).get('gender') as any) || 'All');
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(() => new URLSearchParams(location.search).get('families')?.split(',') || []);
  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<string>(() => new URLSearchParams(location.search).get('category') || 'All');
  const [accordsList, setAccordsList] = useState<string[]>([]);
  const [selectedAccords, setSelectedAccords] = useState<string[]>(() => new URLSearchParams(location.search).get('accords')?.split(',') || []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>(() => new URLSearchParams(location.search).get('sort') || 'name-asc');
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<{type: string, text: string, id?: number}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const findMatchingBrand = (paramBrand: string, availableBrands: string[]) => {
    if (!paramBrand || paramBrand === 'All') return 'All';
    const brandNames = availableBrands.filter((b) => b !== 'All');
    const normParam = paramBrand.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const match = brandNames.find(b => {
      const normB = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      return normB === normParam;
    });
    return match || paramBrand;
  };

  const brandNames = brands.filter((b) => b !== 'All');

  const buildCatalogUrl = (filters: {
    brand?: string;
    category?: string;
    gender?: string;
    sort?: string;
    search?: string;
    families?: string[];
    accords?: string[];
  }) => {
    const brand = filters.brand && filters.brand !== 'All' ? filters.brand : 'All';
    const params = new URLSearchParams();
    if (filters.gender && filters.gender !== 'All') params.set('gender', filters.gender);
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.sort && filters.sort !== 'name-asc') params.set('sort', filters.sort);
    if (filters.search) params.set('search', filters.search);
    if (filters.families && filters.families.length > 0) params.set('families', filters.families.join(','));
    if (filters.accords && filters.accords.length > 0) params.set('accords', filters.accords.join(','));
    const qs = params.toString();
    const path = brand !== 'All' ? brandPath(brand) : '/catalog';
    return `${path}${qs ? `?${qs}` : ''}`;
  };

  const navigateFilters = (patch: {
    brand?: string;
    category?: string;
    gender?: string;
    sort?: string;
    search?: string;
    families?: string[];
    accords?: string[];
  }) => {
    const next = {
      brand: patch.brand !== undefined ? patch.brand : activeBrand,
      category: patch.category !== undefined ? patch.category : activeCategory,
      gender: patch.gender !== undefined ? patch.gender : activeGenderTab,
      sort: patch.sort !== undefined ? patch.sort : sortBy,
      search: patch.search !== undefined ? patch.search : debouncedSearchQuery,
      families: patch.families !== undefined ? patch.families : selectedFamilies,
      accords: patch.accords !== undefined ? patch.accords : selectedAccords,
    };
    const target = buildCatalogUrl(next);
    const current = `${location.pathname}${location.search}`;
    if (target !== current) {
      navigate(target);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // URL is the single source of truth — only sync state FROM location
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const genderParam = params.get('gender');
    const sortParam = params.get('sort');
    const brandParam = params.get('brand');
    const searchParam = params.get('search') || '';
    const familiesParam = params.get('families');
    const accordsParam = params.get('accords');

    setActiveCategory(categoryParam || 'All');
    setActiveGenderTab(((genderParam as 'All' | 'Male' | 'Female' | 'Unisex') || 'All'));
    setSortBy(sortParam || 'name-asc');
    setSearchQuery(searchParam);
    setDebouncedSearchQuery(searchParam);

    if (brandSlug) {
      if (brandNames.length > 0) {
        const resolved = resolveBrandFromSlug(brandSlug, brandNames)
          || findMatchingBrand(brandSlug.replace(/-/g, ' '), brandNames);
        setActiveBrand(resolved || 'All');
      }
    } else if (brandParam) {
      setActiveBrand(findMatchingBrand(brandParam, brandNames.length ? brandNames : [brandParam]));
    } else {
      setActiveBrand('All');
    }

    if (familiesParam) {
      setSelectedFamilies(familiesParam.split(',').map(f => f.startsWith('family') ? f : `family${f}`));
    } else {
      setSelectedFamilies([]);
    }

    if (accordsParam) {
      setSelectedAccords(accordsParam.split(','));
    } else {
      setSelectedAccords([]);
    }
  }, [location.search, location.pathname, brandSlug, brands]);

  // Debounce search into URL (don't fight URL sync)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search') || '';
    if (searchQuery === urlSearch) return;

    const handler = setTimeout(() => {
      const target = buildCatalogUrl({
        brand: activeBrand,
        category: activeCategory,
        gender: activeGenderTab,
        sort: sortBy,
        search: searchQuery.trim(),
        families: selectedFamilies,
        accords: selectedAccords,
      });
      const current = `${location.pathname}${location.search}`;
      if (target !== current) navigate(target);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, activeBrand, activeCategory, activeGenderTab, sortBy, selectedFamilies, selectedAccords, location.pathname, location.search, navigate]);

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
      .then((data: string[]) => {
        setBrands(['All', ...data]);
      })
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
    // Wait until /brand/:slug resolves once brands are loaded
    if (brandSlug && activeBrand === 'All' && brandNames.length === 0) {
      setLoading(true);
      return;
    }

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
  }, [debouncedSearchQuery, activeBrand, activeGenderTab, selectedFamilies, selectedAccords, sortBy, activeCategory, brandSlug, brands]);

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
    const next = selectedFamilies.includes(familyId)
      ? selectedFamilies.filter(id => id !== familyId)
      : [...selectedFamilies, familyId];
    navigateFilters({ families: next });
  };

  const toggleAccord = (accord: string) => {
    const next = selectedAccords.includes(accord)
      ? selectedAccords.filter(a => a !== accord)
      : [...selectedAccords, accord];
    navigateFilters({ accords: next });
  };

  const resetFilters = () => {
    setSearchQuery('');
    navigate('/catalog');
  };

  const activeFiltersCount = (activeGenderTab !== 'All' ? 1 : 0) + selectedFamilies.length + selectedAccords.length + (activeBrand !== 'All' ? 1 : 0) + (sortBy !== 'name-asc' ? 1 : 0) + (activeCategory !== 'All' ? 1 : 0) + (searchQuery ? 1 : 0);

  const scrollToCallback = () => {
    const element = document.getElementById('callback-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCategoryName = () => {
    if (activeCategory === 'custom-set') {
      return language === 'be' ? 'Канструктар аромабоксаў' : 'Конструктор аромабоксов';
    }

    let parts = [];
    
    // Brand part (usually first for specific brands)
    if (activeBrand !== 'All') {
      parts.push(activeBrand);
    }

    // Gender part
    if (activeGenderTab === 'Male') parts.push(language === 'be' ? 'Мужчынская парфумерыя' : 'Мужская парфюмерия');
    else if (activeGenderTab === 'Female') parts.push(language === 'be' ? 'Жаночая парфумерыя' : 'Женская парфюмерия');
    else if (activeGenderTab === 'Unisex') parts.push(language === 'be' ? 'Унісекс парфумерыя' : 'Унисекс парфюмерия');
    else if (activeBrand === 'All') parts.push(language === 'be' ? 'Каталог' : 'Каталог');
    else parts.push(language === 'be' ? 'парфумерыя' : 'парфюмерия');
    
    // Category part (suffix)
    if (activeCategory === 'decant') parts.push(language === 'be' ? '(адліванты)' : '(отливанты)');
    else if (activeCategory === 'perfume') parts.push(language === 'be' ? '(цэлыя флаконы)' : '(целые флаконы)');
    else if (activeCategory === 'set') parts.push(language === 'be' ? '(наборы)' : '(наборы)');
    
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

  let pageTitle = `${categoryName} — купить в Гродно/Беларуси цены в интернет-магазине АРХЕТИП`;
  let pageDescription = `Предлагаем купить ${categoryName} оригинал. Большой выбор, гарантия качества, доставка по Гродно и Беларуси. ${minPrice > 0 ? `Цены от ${minPrice.toFixed(2)} руб.` : ''}`;

  if (activeCategory === 'decant' && activeBrand === 'All') {
    pageTitle = 'Распив и отливанты нишевой парфюмерии в Гродно | Оригинал от 1 мл';
    pageDescription = 'Каталог оригинальных отливантов селективной парфюмерии. Большой выбор атомайзеров от 1 до 10 мл. Доступные цены, быстрая доставка по Беларуси. Тестируйте дорогие ароматы выгодно!';
  } else if (activeCategory === 'set' && activeBrand === 'All') {
    pageTitle = 'Парфюмерные наборы и аромабоксы в РБ | Подарочные сеты';
    pageDescription = 'Подарочные наборы нишевой парфюмерии и эксклюзивные аромабоксы. Купить сет оригиналов с распивом в Гродно с доставкой. Идеальный подарок!';
  } else if ((activeCategory === 'eau_de_toilette' || activeCategory === 'toilet_water') && activeBrand === 'All') {
    pageTitle = 'Туалетная вода в Гродно — купить оригинал с доставкой по Беларуси | АРХЕТИП';
    pageDescription = 'Туалетная вода (EDT) в Гродно: оригинальная нишевая парфюмерия на распив и во флаконах. Доставка духов курьером по Гродно и почтой по всей Беларуси.';
  } else if (activeCategory === 'perfume' && activeBrand === 'All') {
    pageTitle = 'Духи в Гродно и Беларуси — купить оригинальный парфюм | АРХЕТИП';
    pageDescription = 'Купить духи в Гродно с доставкой по Беларуси. Оригинальная нишевая парфюмерия: распив, отливанты и полные флаконы. Гарантия подлинности.';
  } else if (activeBrand !== 'All' && activeCategory === 'All' && activeGenderTab === 'All' && selectedFamilies.length === 0) {
    pageTitle = `${activeBrand} — купить духи в Гродно и Беларуси | Распив и флаконы`;
    pageDescription = `Парфюмерия ${activeBrand}: оригинальные духи и туалетная вода. Распив и полные флаконы с доставкой по Гродно и всей Беларуси. Магазин АРХЕТИП.`;
  }

  const catalogCanonicalParams = new URLSearchParams();
  if (activeCategory !== 'All') catalogCanonicalParams.set('category', activeCategory);
  if (activeGenderTab !== 'All') catalogCanonicalParams.set('gender', activeGenderTab);
  const catalogCanonicalQs = catalogCanonicalParams.toString();
  const catalogCanonical = activeBrand !== 'All'
    ? `${SITE_ORIGIN}${brandPath(activeBrand)}${catalogCanonicalQs ? `?${catalogCanonicalQs}` : ''}`
    : (catalogCanonicalQs ? `${SITE_ORIGIN}/catalog?${catalogCanonicalQs}` : `${SITE_ORIGIN}/catalog`);

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
        <meta property="og:url" content={catalogCanonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={catalogCanonical} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <Breadcrumbs 
          items={[
            { label: t('catalog') || (language === 'be' ? 'Каталог' : 'Каталог'), path: '/catalog' },
            ...(activeBrand !== 'All' ? [{ label: activeBrand, path: brandPath(activeBrand) }] : []),
            ...(activeCategory !== 'All' ? [{ 
              label: activeCategory === 'decant' ? (language === 'be' ? 'Адліванты' : 'Отливанты') :
                     activeCategory === 'set' ? (language === 'be' ? 'Наборы' : 'Наборы') :
                     activeCategory === 'perfume' ? t('perfume') :
                     activeCategory === 'eau_de_toilette' ? t('eauDeToilette') :
                     activeCategory === 'cologne' ? t('cologne') :
                     activeCategory === 'oil' ? t('oil') : activeCategory 
            }] : []),
            ...(activeGenderTab !== 'All' ? [{ label: activeGenderTab === 'Male' ? (language === 'be' ? 'Мужчынская' : 'Мужская') : activeGenderTab === 'Female' ? (language === 'be' ? 'Жаночая' : 'Женская') : (language === 'be' ? 'Унісекс' : 'Унисекс') }] : [])
          ]} 
        />
      </div>

      <section className="text-center max-w-3xl mx-auto space-y-4 px-4 sm:px-6 lg:px-8 pt-6 mb-12">
        <span className="text-[10px] uppercase tracking-[0.25em] font-sans font-semibold text-brand-accent/80 block">
          Archetype Parfum | Selectives
        </span>
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-brand-light leading-tight">
          {categoryName}
        </h1>
        <p className="text-sm text-brand-muted font-light max-w-xl mx-auto leading-relaxed">
          {t('exploreCatalog')}
        </p>
        <div className="pt-2">
          <span className="inline-block text-[10px] font-mono tracking-widest text-brand-muted/70 uppercase">
            [ {products.length} {language === 'be' ? 'ароматаў' : 'ароматов'} ]
          </span>
        </div>
      </section>

      <>
        <div className="sticky top-14 sm:top-16 z-40 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border/40 mb-8 sm:mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-brand-muted/60" />
              </div>
              <input
                type="text"
                className="block w-full pl-8 pr-4 py-2 bg-transparent border-t-0 border-x-0 border-b border-brand-border/50 rounded-none text-brand-light placeholder-brand-muted/50 focus:outline-none focus:ring-0 focus:border-brand-accent transition-all text-sm font-light"
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
                    className="absolute top-full left-0 right-0 mt-2 bg-brand-bg border border-brand-border rounded-none shadow-xl overflow-hidden z-50"
                  >
                    <ul>
                      {suggestions.map((sugg, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => {
                              setShowSuggestions(false);
                              if (sugg.type === 'brand') {
                                navigateFilters({ brand: sugg.text, search: '' });
                                setSearchQuery('');
                              } else {
                                setSearchQuery(sugg.text);
                                navigateFilters({ search: sugg.text });
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
                className="sm:hidden p-2.5 text-brand-muted hover:text-brand-accent transition-colors border border-brand-border rounded-none hover:bg-brand-hover bg-brand-hover/10"
                title="Изменить вид сетки"
              >
                {mobileGridCols === 1 ? <Grid2X2 className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-none text-xs font-semibold uppercase tracking-[0.15em] transition-all border ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-brand-accent text-white border-brand-accent font-semibold'
                    : 'bg-brand-hover text-brand-muted border-brand-border hover:border-brand-accent/40'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="text-xs font-mono ml-1">
                    ({activeFiltersCount})
                  </span>
                )}
              </button>
            </div>
          </div>
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid ${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-[1px] bg-brand-border/45 border border-brand-border/45 overflow-hidden transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {products.map((product, index) => {
              return (
                <div key={product.id} className="bg-brand-bg relative h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.21, 1, 0.36, 1],
                      delay: (index % 3) * 0.05
                    }}
                    className="h-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                </div>
              );
            })}
            {!loading && products.length === 0 && (
              <div className="col-span-full text-center py-24 text-brand-muted bg-brand-bg text-sm font-light">
                {t('noProductsFound')} "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </section>
    </>

      <section id="callback-section" className="max-w-xl mx-auto bg-brand-bg/40 p-8 md:p-12 rounded-none border border-brand-border mx-4 sm:mx-auto mb-12 shadow-none">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif mb-2 text-brand-light">{t('needAssistance')}</h2>
          <p className="text-brand-muted text-sm font-light">
            {t('leaveDetails')}
          </p>
        </div>
        <CallbackForm />
      </section>

      {/* Top-level Filters Sidebar Overlay (Moved out of sticky container to prevent viewport cropping / nesting bugs) */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 h-full w-full max-w-md bg-brand-bg z-[70] shadow-2xl flex flex-col border-r border-brand-border"
            >
              <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg shrink-0">
                <h2 className="text-2xl font-serif text-brand-light flex items-center gap-2">
                  <Filter className="w-6 h-6 text-brand-accent" />
                  {t('filters')}
                </h2>
                <button 
                  onClick={() => setIsFilterOpen(false)} 
                  className="p-2 text-brand-muted hover:text-brand-accent transition-colors cursor-pointer"
                  aria-label="Close filters"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-brand-bg custom-scrollbar">
                {/* Category Filter */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                    {t('categories')}
                  </h3>
                  <div className="relative">
                    <select
                      value={activeCategory}
                      onChange={(e) => navigateFilters({ category: e.target.value })}
                      className="w-full appearance-none bg-brand-hover/25 border border-brand-border/60 rounded-none pl-4 pr-10 py-3 text-xs uppercase tracking-wider text-brand-light focus:outline-none focus:border-brand-accent transition-all cursor-pointer font-medium"
                    >
                      <option value="All" className="bg-brand-bg text-brand-light">{t('allFamilies')}</option>
                      <option value="perfume" className="bg-brand-bg text-brand-light">{t('perfume')}</option>
                      <option value="eau_de_toilette" className="bg-brand-bg text-brand-light">{t('eauDeToilette')}</option>
                      <option value="cologne" className="bg-brand-bg text-brand-light">{t('cologne')}</option>
                      <option value="decant" className="bg-brand-bg text-brand-light">{language === 'be' ? 'Адліванты' : 'Отливанты'}</option>
                      <option value="set" className="bg-brand-bg text-brand-light">{language === 'be' ? 'Готовые наборы' : 'Готовые наборы'}</option>
                      <option value="oil" className="bg-brand-bg text-brand-light">{t('oil')}</option>
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
                      onChange={(e) => navigateFilters({ brand: e.target.value })}
                      className="w-full appearance-none bg-brand-hover/25 border border-brand-border/60 rounded-none pl-4 pr-10 py-3 text-xs uppercase tracking-wider text-brand-light focus:outline-none focus:border-brand-accent transition-all cursor-pointer font-medium"
                    >
                      {brands.map(brand => (
                        <option key={brand} value={brand} className="bg-brand-bg text-brand-light">
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
                        onClick={() => navigateFilters({ gender: tab.id })}
                        className={`px-4 py-2.5 rounded-none text-xs font-semibold uppercase tracking-[0.1em] transition-all border ${
                          activeGenderTab === tab.id
                            ? 'bg-brand-accent text-white border-brand-accent font-semibold'
                            : 'bg-brand-hover/10 text-brand-muted border-brand-border/60 hover:border-brand-accent/40 hover:text-brand-accent hover:bg-brand-hover/30'
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
                      { id: 'popularity', label: language === 'be' ? 'Папулярнасць' : 'Популярность' },
                      { id: 'newest', label: language === 'be' ? 'Навінкі' : 'Новинки' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => navigateFilters({ sort: option.id })}
                        className={`px-4 py-2.5 rounded-none text-xs font-semibold uppercase tracking-[0.1em] transition-all border ${
                          sortBy === option.id
                            ? 'bg-brand-accent text-white border-brand-accent font-semibold'
                            : 'bg-brand-hover/10 text-brand-muted border-brand-border/60 hover:border-brand-accent/40 hover:text-brand-accent hover:bg-brand-hover/30'
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
                        onClick={() => navigateFilters({ families: [] })}
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
                        className={`px-4 py-2 rounded-none text-[10px] font-semibold uppercase tracking-[0.12em] transition-all border ${
                          selectedFamilies.includes(family.id)
                            ? 'bg-brand-accent text-white border-brand-accent font-semibold'
                            : 'bg-brand-hover/10 text-brand-muted border-brand-border/60 hover:border-brand-accent/40 hover:text-brand-accent hover:bg-brand-hover/30'
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
                          onClick={() => navigateFilters({ accords: [] })}
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
                          className={`px-4 py-2 rounded-none text-[10px] font-semibold uppercase tracking-[0.12em] transition-all border ${
                            selectedAccords.includes(accord)
                              ? 'bg-brand-accent text-white border-brand-accent font-semibold'
                              : 'bg-brand-hover/10 text-brand-muted border-brand-border/60 hover:border-brand-accent/40 hover:text-brand-accent hover:bg-brand-hover/30'
                          }`}
                        >
                          {accord}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-brand-border flex gap-4 bg-brand-bg shrink-0">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-accent hover:bg-brand-hover/20 transition-all border border-brand-border rounded-none cursor-pointer"
                >
                  {t('reset')}
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 px-6 py-3.5 bg-brand-accent text-white rounded-none text-xs font-semibold uppercase tracking-wider hover:bg-brand-accent-hover transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  {t('apply')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
