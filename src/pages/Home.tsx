import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HomeConfig, Product } from '../types';
import ProductCard from '../components/ProductCard';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';

export default function Home() {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [maleProducts, setMaleProducts] = useState<Product[]>([]);
  const [femaleProducts, setFemaleProducts] = useState<Product[]>([]);
  const [unisexProducts, setUnisexProducts] = useState<Product[]>([]);
  const [decantProducts, setDecantProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, productsRes] = await Promise.all([
          fetch('/api/settings/home'),
          fetch('/api/products')
        ]);

        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.status}`);

        const configData = await configRes.json();
        const productsData: Product[] = await productsRes.json();

        setConfig(configData);
        
        setMaleProducts(productsData.filter(p => p.gender === 'Male').slice(0, 4));
        setFemaleProducts(productsData.filter(p => p.gender === 'Female').slice(0, 4));
        setUnisexProducts(productsData.filter(p => p.gender === 'Unisex').slice(0, 4));
        setDecantProducts(productsData.filter(p => 
          p.tags?.includes('decant') || 
          p.tags?.includes('отливант') || 
          p.name.toLowerCase().includes('отливант') ||
          p.description.toLowerCase().includes('отливант')
        ).slice(0, 4));

        setLoading(false);
      } catch (err) {
        console.error('Failed to load home data', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!config || config.hero.slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % config.hero.slides.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(timer);
  }, [config]);

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
    "logo": "https://archetype.by/favicon.svg",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Grodno",
      "addressCountry": "BY"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+37529XXXXXXX",
      "contactType": "customer service"
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full"
    >
      <Helmet>
        <title>АРХЕТИП | Элитная нишевая парфюмерия в Беларуси</title>
        <meta name="description" content="Откройте для себя коллекцию эксклюзивных нишевых ароматов в АРХЕТИП. Минимализм, качество и уникальные композиции. Доставка по всей Беларуси." />
        <meta property="og:title" content="АРХЕТИП | Элитная нишевая парфюмерия" />
        <meta property="og:description" content="Эксклюзивные ароматы для ценителей. Найдите свой идеальный парфюм в нашей коллекции." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://archetype.by" />
        <meta property="og:image" content={config.hero.slides[0]?.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://archetype.by" />
        <script type="application/ld+json">
          {JSON.stringify(orgData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-brand-bg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            {activeSlide?.image && (
              <>
                <motion.img 
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.15 }}
                  transition={{ duration: 7, ease: "linear" }}
                  src={activeSlide.image} 
                  alt={activeSlide.title || "Hero"} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/40 via-transparent to-brand-bg" />
              </>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
              <motion.h1 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-tight max-w-5xl flex flex-col gap-4 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              >
                <span style={{ 
                  fontFamily: 'var(--font-oranienbaum)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.3)',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.1)'
                }}>
                  {language === 'be' ? 'АРХЕТЫП:' : 'АРХЕТИП:'}
                </span>
                <span style={{ 
                  fontFamily: 'var(--font-arsenica)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.3)',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.1)'
                }}>
                  {language === 'be' ? 'Парфумерная крама' : 'Парфюмерный магазин'}
                </span>
              </motion.h1>

              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-lg md:text-xl text-white font-light max-w-2xl mb-10"
                style={{ 
                  fontFamily: 'var(--font-adventor)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  WebkitTextStroke: '0.2px rgba(0,0,0,0.05)'
                }}
              >
                {language === 'be' ? 'Множнасць архетыпаў. Множнасць водараў' : 'Множественность архетипов. Множественность ароматов'}
              </motion.p>
              
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <Link 
                  to={activeSlide.link || "/catalog"} 
                  className="inline-flex items-center gap-2 bg-brand-accent text-white px-8 py-4 rounded-full font-medium uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-2xl hover:scale-105 active:scale-95"
                >
                  {t('shopCollection')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        {config.hero.slides.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {config.hero.slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  currentSlide === idx ? 'w-12 bg-brand-accent' : 'w-4 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sections */}
      <div className="py-24 space-y-24">
        {/* Для него */}
        {maleProducts.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-serif text-brand-light">
                {language === 'be' ? 'Для яго' : 'Для него'}
              </h2>
              <Link 
                to="/catalog?gender=Male" 
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted hover:text-white transition-colors"
              >
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {maleProducts.map((product, pIdx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: pIdx * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/catalog?gender=Male" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted">
                {t('viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Для неё */}
        {femaleProducts.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-serif text-brand-light">
                {language === 'be' ? 'Для яе' : 'Для неё'}
              </h2>
              <Link 
                to="/catalog?gender=Female" 
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted hover:text-white transition-colors"
              >
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {femaleProducts.map((product, pIdx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: pIdx * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/catalog?gender=Female" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted">
                {t('viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Унисекс */}
        {unisexProducts.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-serif text-brand-light">
                {language === 'be' ? 'Унісэкс' : 'Унисекс'}
              </h2>
              <Link 
                to="/catalog?gender=Unisex" 
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted hover:text-white transition-colors"
              >
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {unisexProducts.map((product, pIdx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: pIdx * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/catalog?gender=Unisex" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted">
                {t('viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Отливанты */}
        {decantProducts.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-3xl font-serif text-brand-light">
                {language === 'be' ? 'Адліванты' : 'Отливанты'}
              </h2>
              <Link 
                to="/catalog?category=decant" 
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted hover:text-white transition-colors"
              >
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {decantProducts.map((product, pIdx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: pIdx * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/catalog?category=decant" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-muted">
                {t('viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Promo Images / Gallery */}
      {config.promoImages && config.promoImages.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.promoImages.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden"
              >
                <img 
                  src={img} 
                  alt={`Promo ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
