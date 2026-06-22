import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HomeConfig, Product, BrandCard } from '../types';
import ProductCard from '../components/ProductCard';
import ScentQuiz from '../components/ScentQuiz';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';

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
          fetch('/api/products?sort=newest'),
          fetch('/api/settings/general')
        ]);

        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.status}`);

        const configData = await configRes.json();
        const productsData: Product[] = await productsRes.json();
        const genData = genRes.ok ? await genRes.json() : {};

        setConfig({ ...configData, genData });
        
        // Use the first 8 products as New Arrivals (pre-sorted by newest)
        setNewArrivals(productsData.slice(0, 8));
        setLoading(false);
      } catch (err) {
        console.error('Failed to load home data', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeBrandIdx, setActiveBrandIdx] = useState(0);
  const [accordionHovered, setAccordionHovered] = useState(false);
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

  useEffect(() => {
    if (accordionHovered || !config) return;
    const activeBrands = config.popularBrands && config.popularBrands.length > 0
      ? config.popularBrands.filter((b: any) => b.active !== false)
      : POPULAR_BRANDS;

    if (!activeBrands || activeBrands.length <= 1) return;

    const timer = setInterval(() => {
      setActiveBrandIdx(prev => (prev + 1) % activeBrands.length);
    }, 5000); // 5 seconds of inactivity auto-switch

    return () => clearInterval(timer);
  }, [accordionHovered, config, activeBrandIdx]);

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
        className="relative h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] w-full overflow-hidden bg-black flex items-center"
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
            <div className="absolute inset-x-0 bottom-28 sm:bottom-32 px-4 sm:px-6 z-10 flex flex-col items-center justify-end text-center">
              
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
              <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-25 flex gap-2.5 items-center">
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

        {/* Scrolling bottom helper line (hidden on mobile, perfectly spaced on desktop) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1.5 pointer-events-none opacity-80">
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

      {/* 2. IMMERSIVE FULL-SCREEN POPULAR BRANDS ACCORDION */}
      <motion.section
        initial={{ opacity: 0, scale: 0.99 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        onMouseEnter={() => setAccordionHovered(true)}
        onMouseLeave={() => setAccordionHovered(false)}
        className="relative w-full h-[550px] md:h-[80vh] lg:h-screen min-h-[500px] overflow-hidden bg-zinc-950 border-b border-brand-border/40 flex flex-col md:flex-row select-none"
      >
        {(() => {
          const activeBrands = config.popularBrands && config.popularBrands.length > 0
            ? config.popularBrands.filter((b: any) => b.active !== false)
            : POPULAR_BRANDS;
          const activeBrand = activeBrands[activeBrandIdx] || activeBrands[0];
          const activeBrandsCount = activeBrands.length;

          // Dynamic widths based on card counts
          // If the count of brand cards decreases, the active image area is wider ("картинка увеличивается")
          // and the stripes (right sidebar lines) are narrower ("линии справа становятся тоньше")
          let mainWidthClass = "w-full md:w-[72%] lg:w-[76%] xl:w-[80%]";
          let sidebarWidthClass = "w-[28%] lg:w-[24%] xl:w-[20%]";

          if (activeBrandsCount <= 3) {
            mainWidthClass = "w-full md:w-[84%] lg:w-[87%] xl:w-[90%]";
            sidebarWidthClass = "w-[16%] lg:w-[13%] xl:w-[10%]";
          } else if (activeBrandsCount === 4) {
            mainWidthClass = "w-full md:w-[78%] lg:w-[81%] xl:w-[84%]";
            sidebarWidthClass = "w-[22%] lg:w-[19%] xl:w-[16%]";
          }

          return (
            <>
              <Link
                to={`/catalog?brand=${encodeURIComponent(activeBrand?.name || '')}`}
                className={`absolute top-0 left-0 h-full z-20 group/app-brand-main block overflow-hidden cursor-pointer transition-all duration-700 ease-out ${mainWidthClass}`}
              >
                {/* Active brand background image with crossfade */}
                <div className="absolute inset-0 z-0">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={activeBrandIdx}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <img
                        src={activeBrand?.image}
                        alt=""
                        className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-[1.2s] ease-out group-hover/app-brand-main:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      {/* Smooth gradient with extra opacity towards the bottom for readable overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 md:bg-gradient-to-r md:from-black/80 md:via-black/35 md:to-transparent" />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Brand details overlay - elevated on mobile to avoid overlapping with bottom switcher */}
                <div className="absolute bottom-36 left-6 md:bottom-24 md:left-12 lg:left-16 z-20 max-w-xs md:max-w-md pointer-events-none">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeBrandIdx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-2 md:space-y-3"
                    >
                      <h3 className="font-serif text-3xl md:text-5xl tracking-[0.06em] uppercase text-white font-extralight leading-none">
                        {language === 'be' && activeBrand?.name_be ? activeBrand?.name_be : activeBrand?.name}
                      </h3>
                      <p className="text-xs md:text-sm font-extralight text-white/50 tracking-[0.03em] font-sans leading-relaxed max-w-xs md:max-w-md">
                        {language === 'be' && activeBrand?.desc_be ? activeBrand?.desc_be : activeBrand?.desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Link>

              {/* Right side desktop vertical solid-color stripes container */}
              <div className={`hidden md:flex absolute top-0 right-0 h-full z-30 flex-row border-l border-white/5 select-none bg-zinc-950/95 backdrop-blur-md transition-all duration-700 ease-out ${sidebarWidthClass}`}>
                {activeBrands.map((brand, bIdx) => {
                  const isActive = bIdx === activeBrandIdx;
                  return (
                    <Link
                      to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                      key={brand.name + '-strip-' + bIdx}
                      onClick={(e) => {
                        if (!isActive) {
                          e.preventDefault();
                          setActiveBrandIdx(bIdx);
                        }
                      }}
                      className={`relative h-full flex-1 border-r border-white/5 cursor-pointer overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none group/strip ${
                        isActive ? 'flex-[1.5] bg-zinc-900' : 'hover:flex-[1.25] hover:bg-zinc-900/60 bg-zinc-950'
                      }`}
                    >
                      {/* Clean, gold vertical bar highlight indicator line for active state */}
                      <div className={`absolute top-0 left-0 w-[2px] h-full transition-all duration-500 ${
                        isActive ? 'bg-brand-accent opacity-100' : 'bg-transparent opacity-0'
                      }`} />

                      {/* Vertical Rotated text with short title inside the solid stripe */}
                      <div className="absolute inset-0 flex flex-col justify-end items-center pb-12 z-20">
                        <div
                          className="flex items-center gap-3.5 transition-transform duration-500 whitespace-nowrap"
                          style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)'
                          }}
                        >
                          <span className={`text-[9px] tracking-[0.2em] uppercase font-mono transition-colors duration-300 ${
                            isActive ? 'text-brand-accent font-medium' : 'text-white/40 group-hover/strip:text-white/70'
                          }`}>
                            {language === 'be' && brand.name_be ? brand.name_be : brand.name}
                          </span>
                          <span className={`w-2.5 h-[1px] transition-all duration-500 ${
                            isActive ? 'bg-brand-accent w-5' : 'bg-white/10 group-hover/strip:bg-white/25'
                          }`} />
                          <span className={`text-[8px] tracking-[0.1em] uppercase font-sans transition-colors duration-300 ${
                            isActive ? 'text-white/80 font-medium' : 'text-white/25 group-hover/strip:text-white/50'
                          }`}>
                            {bIdx + 1 < 10 ? `0${bIdx + 1}` : bIdx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Clean glassmorphic border reflection */}
                      <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                    </Link>
                  );
                })}
              </div>

              {/* Mobile bottom solid picker selector */}
              <div className="md:hidden absolute bottom-6 left-0 w-full z-30 px-4">
                <p className="text-[8px] tracking-[0.15em] text-white/35 uppercase mb-2 text-center font-mono">
                  {language === 'be' ? 'Абярыце парфумерны дом' : 'Выберите парфюмерный дом'}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none px-0.5">
                  {activeBrands.map((brand, bIdx) => {
                    const isActive = bIdx === activeBrandIdx;
                    return (
                      <Link
                        to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                        key={brand.name + '-mob-' + bIdx}
                        onClick={(e) => {
                          if (!isActive) {
                            e.preventDefault();
                            setActiveBrandIdx(bIdx);
                          }
                        }}
                        className={`relative flex-shrink-0 min-w-[75px] h-[38px] border overflow-hidden transition-all duration-300 flex items-center justify-center px-3 rounded-none ${
                          isActive ? 'border-brand-accent bg-zinc-900/90' : 'border-white/10 bg-zinc-950/90'
                        }`}
                      >
                        <span className={`relative z-10 text-[8px] font-bold tracking-wider uppercase text-center leading-tight transition-colors duration-300 ${
                          isActive ? 'text-brand-accent' : 'text-white/60'
                        }`}>
                          {language === 'be' && brand.name_be ? brand.name_be : brand.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </motion.section>

      {/* INTERACTIVE SCENT SELECTOR */}
      <ScentQuiz />

      {/* 3. STYLISH GRID OF NEW ARRIVALS (Light Theme Edition) */}
      {newArrivals.length > 0 && (
        <section className="py-24 md:py-32 w-full bg-brand-bg text-brand-light border-b border-brand-border/40 relative overflow-hidden select-none">
          {/* Subtle soft atmospheric background accents */}
          <div className="absolute right-0 top-1/4 w-[400px] h-[400px] bg-brand-accent/[0.015] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute left-[-100px] bottom-10 w-[500px] h-[500px] bg-brand-accent/[0.01] rounded-full blur-[150px] pointer-events-none" />
          
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-20 gap-8">
              <div className="max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-[0.35em] text-brand-accent animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-brand-accent" />
                  {language === 'be' ? 'НОВЫЯ ДАДАТКІ' : 'НОВЫЕ ПОСТУПЛЕНИЯ'}
                </span>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif text-brand-light font-extralight tracking-[0.05em] uppercase leading-none">
                  {language === 'be' ? 'Свежыя паступленні' : 'Свежие поступления'}
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted font-extralight tracking-[0.02em] leading-relaxed max-w-xl">
                  {language === 'be' 
                    ? 'Эксклюзіўныя водарныя шэдэўры, адабраныя нашымі экспертамі для вашых незабыўных момантаў.' 
                    : 'Эксклюзивные селективные творения, отобранные нашими экспертами для ваших незабываемых образов.'}
                </p>
              </div>
              
              <Link 
                to="/catalog" 
                className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted hover:text-brand-light transition-all duration-300 group shrink-0 pb-1 border-b border-brand-border hover:border-brand-accent cursor-pointer"
              >
                <span>{language === 'be' ? 'Глядзець увесь каталог' : 'Смотреть весь каталог'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-accent transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {newArrivals.map((product, pIdx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: pIdx * 0.1 }}
                  className="rounded-none overflow-hidden border border-brand-border/50 hover:border-brand-accent/20 transition-colors"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promo Image Gallery (Light Background) */}
      {config.promoImages && config.promoImages.length > 0 && (
        <section className="py-24 w-full bg-brand-bg border-b border-brand-border/40 select-none overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {config.promoImages.map((img, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: idx * 0.15 }}
                  className="aspect-square md:aspect-[16/10] rounded-none overflow-hidden border border-brand-border/50 hover:border-brand-accent/25 transition-all duration-500 relative group"
                >
                  <img 
                    src={img} 
                    alt={`Promo Highlight ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-[1.04] brightness-95 group-hover:brightness-100 transition-all duration-[1.5s] ease-out"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {/* Subtle clean visual overlay reflection */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none opacity-40" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}

