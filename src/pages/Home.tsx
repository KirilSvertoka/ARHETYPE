import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HomeConfig, Product, BrandCard } from '../types';
import ProductCard from '../components/ProductCard';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';

export default function Home() {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, productsRes, genRes] = await Promise.all([
          fetch('/api/settings/home'),
          fetch('/api/products'),
          fetch('/api/settings/general')
        ]);

        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.status}`);

        const configData = await configRes.json();
        const productsData: Product[] = await productsRes.json();
        const genData = genRes.ok ? await genRes.json() : {};

        setConfig({ ...configData, genData });
        
        // Filter and sort for New Arrivals
        // Match tags like 'new', 'новинка', 'hot' first, or fallback to the latest products (highest IDs or first 8)
        const taggedNew = productsData.filter(p => 
          p.tags?.some(tag => {
            const tl = tag.toLowerCase();
            return tl === 'new' || tl === 'новинка' || tl === 'новинки' || tl === 'hot' || tl === 'decant' || tl === 'отливант';
          })
        );
        
        // Combine tagged & all products, keep unique, then take first 8
        const combined = [...taggedNew, ...productsData];
        const uniqueProducts = Array.from(new Set(combined.map(p => p.id)))
          .map(id => combined.find(p => p.id === id)!)
          .slice(0, 8);

        setNewArrivals(uniqueProducts);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load home data', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!config || config.hero.slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % config.hero.slides.length);
    }, 7000); // Change slide every 7 seconds

    return () => clearInterval(timer);
  }, [config, currentSlide]);

  if (loading || !config) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-pulse rounded-full bg-brand-border h-12 w-12"></div>
      </div>
    );
  }

  const activeSlide = config.hero.slides[currentSlide] || config.hero.slides[0];

  const orgData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "АРХЕТИП",
    "url": "https://archetype.by",
    "logo": "https://archetype.by/favicon.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Grodno",
      "addressCountry": "BY",
      "postalCode": "230005",
      "streetAddress": "ул. Парфюмерная 123"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": (config as any).genData?.phone || "+37529XXXXXXX",
      "contactType": "customer service"
    }
  };

  const webSiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "АРХЕТИП",
    "url": "https://archetype.by",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://archetype.by/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Luxury Popular Brands list
  const POPULAR_BRANDS: BrandCard[] = [
    {
      name: 'Byredo',
      name_be: 'Byredo',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
      desc: 'Шведский авангард и поэзия',
      desc_be: 'Швэдскі авангард і паэзія'
    },
    {
      name: 'Le Labo',
      name_be: 'Le Labo',
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
      desc: 'Индустриальная эстетика Нью-Йорка',
      desc_be: 'Індустрыяльная эстэтыка Нью-Ёрка'
    },
    {
      name: 'Tom Ford',
      name_be: 'Tom Ford',
      image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=800&auto=format&fit=crop',
      desc: 'Роскошь, смелость и чувственность',
      desc_be: 'Раскоша, смеласць і пачуццёвасць'
    },
    {
      name: 'Creed',
      name_be: 'Creed',
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
      desc: 'Монархическое величие и классика',
      desc_be: 'Манархічная веліч і класіка'
    },
    {
      name: 'Kilian',
      name_be: 'Kilian',
      image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
      desc: 'Ночные тайны и парижский шик',
      desc_be: 'Начныя тайны і парыжскі шык'
    },
    {
      name: 'Maison Francis Kurkdjian',
      name_be: 'Maison Francis Kurkdjian',
      image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
      desc: 'Ювелирная точность ароматов',
      desc_be: 'Ювелірная дакладнасць водараў'
    },
  ];

  const handlePrevSlide = () => {
    if (!config) return;
    setCurrentSlide(prev => (prev - 1 + config.hero.slides.length) % config.hero.slides.length);
  };

  const handleNextSlide = () => {
    if (!config) return;
    setCurrentSlide(prev => (prev + 1) % config.hero.slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    
    if (diffX > 50) {
      handleNextSlide();
    } else if (diffX < -50) {
      handlePrevSlide();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full min-h-screen bg-brand-bg flex flex-col"
    >
      <Helmet>
        <title>Купить нишевую парфюмерию в Гродно с доставкой по РБ | Распив и Оригинал | АРХЕТИП</title>
        <meta name="description" content="Эксклюзивные нишевые ароматы на распив и во флаконах. Оригинальная селективная парфюмерия с доставкой по Минску и всей Беларуси. Закажите подарочный aromabox!" />
        <meta property="og:title" content="Купить нишевую парфюмерию в Гродно с доставкой по РБ | Распив и Оригинал | АРХЕТИП" />
        <meta property="og:description" content="Эксклюзивные нишевые ароматы на распив и во флаконах. Оригинальная селективная парфюмерия с доставкой по Минску и всей Беларуси. Закажите подарочный aromabox!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://archetype.by" />
        <meta property="og:image" content={config.hero.slides[0]?.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://archetype.by" />
        <script type="application/ld+json">
          {JSON.stringify([orgData, webSiteData])}
        </script>
      </Helmet>

      {/* 1. LUXURIOUS FULL-SCREEN HERO BANNER */}
      <section 
        className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-black flex items-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-0 h-full w-full"
          >
            {activeSlide?.image && (
              <>
                <motion.img 
                  initial={{ scale: 1.05, filter: "brightness(0.95)" }}
                  animate={{ scale: 1.10, filter: "brightness(0.88)" }}
                  transition={{ duration: 10, ease: "linear" }}
                  src={(isMobile && activeSlide.mobileImage) ? activeSlide.mobileImage : activeSlide.image} 
                  alt={activeSlide.title || "Hero Banner"} 
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
                {/* Micro-soft, very smooth overlays to remove sharp contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5 transition-all duration-1000" />
              </>
            )}
            
            {/* Direct Content Frame positioned elegantly at the bottom */}
            <div className="absolute inset-x-0 bottom-[18%] sm:bottom-[15%] px-4 sm:px-6 z-10 flex flex-col items-center justify-end text-center">
              
              {/* Main Titles / Inscriptions (Only if administrator has written titles and titles are not hidden) */}
              {!config.hero.hideTitles && (
                <div className="text-center max-w-4xl space-y-3 mb-6 sm:mb-8">
                  {/* Subtitle - only if entered by admin */}
                  {((language === 'be' ? (activeSlide.subtitle_be || activeSlide.subtitle) : activeSlide.subtitle)) && (
                    <motion.p
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs font-semibold tracking-[0.4em] text-brand-accent uppercase"
                    >
                      {language === 'be' ? (activeSlide.subtitle_be || activeSlide.subtitle) : activeSlide.subtitle}
                    </motion.p>
                  )}
                  {/* Title - only if entered by admin */}
                  {((language === 'be' ? (activeSlide.title_be || activeSlide.title) : activeSlide.title)) && (
                    <motion.h1 
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="text-lg sm:text-3xl md:text-4xl lg:text-5xl text-white font-sans font-light tracking-[0.18em] leading-snug uppercase break-keep whitespace-nowrap md:whitespace-normal px-2"
                    >
                      {language === 'be' ? (activeSlide.title_be || activeSlide.title) : activeSlide.title}
                    </motion.h1>
                  )}
                </div>
              )}

              {/* Catalog Button physically slightly below the titles */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <Link 
                  to={activeSlide.link || "/catalog"} 
                  className="inline-flex items-center gap-3 bg-brand-accent text-white px-10 py-5 rounded-none text-xs font-semibold uppercase tracking-[0.25em] hover:bg-brand-accent-hover transition-all duration-300 hover:scale-[1.02]"
                >
                  <span>{t('shopCollection')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Slider Dots Indicator */}
            {config.hero.slides.length > 1 && (
              <div className="absolute bottom-[10%] sm:bottom-[8%] left-1/2 -translate-x-1/2 z-25 flex gap-2.5 items-center">
                {config.hero.slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-[3px] rounded-none transition-all duration-700 ${
                      currentSlide === idx ? 'w-10 bg-brand-accent' : 'w-3 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {config.hero.slides.length > 1 && (
          <>
            <button 
              onClick={handlePrevSlide}
              className="absolute left-2 sm:left-4 md:left-8 z-20 p-2 sm:p-3 bg-black/15 hover:bg-black/45 border border-white/5 hover:border-white/20 text-white/65 hover:text-white transition-all flex items-center justify-center rounded-none"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={handleNextSlide}
              className="absolute right-2 sm:right-4 md:right-8 z-20 p-2 sm:p-3 bg-black/15 hover:bg-black/45 border border-white/5 hover:border-white/20 text-white/65 hover:text-white transition-all flex items-center justify-center rounded-none"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Scrolling bottom helper line */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none opacity-80">
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/50 font-semibold mb-1">
            {language === 'be' ? 'гартаць' : 'листать'}
          </span>
          <div className="w-[1px] h-10 bg-white/20 relative overflow-hidden">
            <motion.div 
              animate={{ y: [0, 40], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-4 bg-brand-accent"
            />
          </div>
        </div>
      </section>

      {/* 2. MINIMALIST NEAT BLOCKS OF POPULAR BRANDS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-brand-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-accent font-semibold mb-3">
            {language === 'be' ? 'СЕЛЕКТЫЎНЫЯ БРЭНДЫ' : 'СЕЛЕКТИВНЫЕ БРЕНДЫ'}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-brand-light leading-snug">
            {language === 'be' ? 'Лепшыя парфумерныя дамы' : 'Лучшие парфюмерные дома'}
          </h2>
          <div className="h-[1px] w-12 bg-brand-accent mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(config.popularBrands && config.popularBrands.length > 0
            ? config.popularBrands.filter((b: any) => b.active !== false)
            : POPULAR_BRANDS
          ).map((brand, bIdx) => (
            <motion.div
              key={brand.name + '-' + bIdx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: bIdx * 0.08 }}
            >
              <Link
                to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden border border-brand-border/40 hover:border-brand-accent/40 transition-colors"
              >
                {/* Image zoom effect */}
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Cover overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors duration-500" />

                {/* Text Layout */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center text-white">
                  <span className="text-xs tracking-[0.15em] text-white/70 uppercase mb-1.5 font-light">
                    {language === 'be' ? 'Калекцыя' : 'Коллекция'}
                  </span>
                  <h3 className="font-serif text-2xl tracking-[0.05em] uppercase border-b border-white/20 pb-2 mb-2 w-fit">
                    {language === 'be' && brand.name_be ? brand.name_be : brand.name}
                  </h3>
                  <p className="text-xs font-sans text-white/60 uppercase tracking-widest max-w-xs transition-opacity duration-300 opacity-60 group-hover:opacity-100">
                    {language === 'be' && brand.desc_be ? brand.desc_be : brand.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. STYLISH GRID OF NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-4">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-accent font-semibold mb-3">
                {language === 'be' ? 'НОВЫЯ ДАДАТКІ' : 'НОВЫЕ ПОСТУПЛЕНИЯ'}
              </p>
              <h2 className="text-3xl md:text-5xl font-serif text-brand-light leading-tight">
                {language === 'be' ? 'Свежыя паступленні' : 'Свежие поступления'}
              </h2>
              <p className="text-sm text-brand-muted mt-3 font-light leading-relaxed">
                {language === 'be' 
                  ? 'Эксклюзіўныя водарныя шэдэўры, адабраныя нашымі экспертамі для вашых незабыўных момантаў.' 
                  : 'Эксклюзивные селективные творения, отобранные нашими экспертами для ваших незабываемых образов.'}
              </p>
            </div>
            
            <Link 
              to="/catalog" 
              className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-accent transition-all duration-300 group shrink-0 pb-1 border-b border-brand-border/40 hover:border-brand-accent"
            >
              <span>{language === 'be' ? 'Глядзець увесь каталог' : 'Смотреть весь каталог'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {newArrivals.map((product, pIdx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: pIdx * 0.08 }}
                className="rounded-none overflow-hidden"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Promo Image Gallery */}
      {config.promoImages && config.promoImages.length > 0 && (
        <section className="pb-24 pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.promoImages.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="aspect-square md:aspect-[16/10] rounded-none overflow-hidden border border-brand-border/30"
              >
                <img 
                  src={img} 
                  alt={`Promo Highlight ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-1000 ease-out"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

