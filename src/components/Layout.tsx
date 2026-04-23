import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Instagram, Send, Mail, ShoppingBag, Heart, Menu, X, ChevronDown, Search } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState, useEffect, useRef } from 'react';
import { HomeConfig, GeneralSettings } from '../types';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { useWishlist } from './WishlistProvider';
import CartDrawer from './CartDrawer';
import Newsletter from './Newsletter';
import Loader from './Loader';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const { items, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCatalogOpen(false);
  }, [location.pathname, location.search]);

  // Close catalog dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setIsCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [catalogRef]);

  // Update html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, settingsRes] = await Promise.all([
          fetch('/api/settings/home'),
          fetch('/api/settings/general')
        ]);
        if (configRes.ok) setConfig(await configRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (error) {
        console.error('Failed to load config/settings in Layout', error);
      }
    };

    // Minimum loading time for the full animation sequence (stroke + fill)
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 3200));
    
    Promise.all([fetchData(), minLoadTime]).then(() => {
      setIsLoading(false);
    });
  }, []);

  const catalogLinks = [
    { label: language === 'be' ? 'Мужчынскія' : 'Мужские', to: '/catalog?gender=Male' },
    { label: language === 'be' ? 'Жаночыя' : 'Женские', to: '/catalog?gender=Female' },
    { label: language === 'be' ? 'Унісекс' : 'Унисекс', to: '/catalog?gender=Unisex' },
    { label: language === 'be' ? 'Наборы' : 'Наборы', to: '/catalog?category=set' },
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100]"
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen bg-brand-bg text-brand-light font-sans selection:bg-brand-accent/50 transition-colors duration-300">
          <div className="sticky top-0 z-50 flex flex-col">
            {config?.announcement?.active && (
              <div className="bg-brand-accent text-white text-center py-2 px-4 text-xs font-medium uppercase tracking-widest">
                {language === 'be' && config.announcement.text_be ? config.announcement.text_be : config.announcement.text}
              </div>
            )}
            <header className="bg-brand-bg border-b border-brand-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 -ml-2 text-brand-muted hover:text-brand-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link to="/" className="flex items-center gap-2 group">
                <span className="font-serif text-xl font-medium tracking-tight uppercase">АРХЕТИП</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex items-center gap-8">
                <div 
                  className="relative py-4" 
                  ref={catalogRef}
                  onMouseEnter={() => setIsCatalogOpen(true)}
                  onMouseLeave={() => setIsCatalogOpen(false)}
                >
                  <Link 
                    to="/catalog"
                    className="flex items-center gap-1 text-sm font-medium uppercase tracking-wider text-brand-muted hover:text-brand-accent transition-colors focus:outline-none"
                  >
                    {t('catalog')}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCatalogOpen ? 'rotate-180' : ''}`} />
                  </Link>
                  
                  <AnimatePresence>
                    {isCatalogOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-48 bg-brand-bg rounded-xl shadow-lg border border-brand-border py-2 z-50"
                      >
                        <Link 
                          to="/catalog" 
                          className="block px-4 py-2 text-sm text-brand-muted hover:bg-brand-hover hover:text-brand-accent transition-colors"
                        >
                          {t('viewAll')}
                        </Link>
                        {catalogLinks.map(link => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="block px-4 py-2 text-sm text-brand-muted hover:bg-brand-hover hover:text-brand-accent transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Link to="/about" className="text-sm font-medium uppercase tracking-wider text-brand-muted hover:text-brand-accent transition-colors">{t('about')}</Link>
                <Link to="/contacts" className="text-sm font-medium uppercase tracking-wider text-brand-muted hover:text-brand-accent transition-colors">{t('contacts')}</Link>
              </nav>
              
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <div className="hidden md:flex items-center gap-4 mr-2 border-r border-brand-border pr-6">
                  <Link to="/catalog" className="text-brand-muted hover:text-brand-accent transition-colors" title={t('search')}>
                    <Search className="w-4 h-4" />
                  </Link>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-accent transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="https://t.me/username" target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-accent transition-colors">
                    <Send className="w-4 h-4" />
                  </a>
                  <a href="mailto:hello@arhetip.com" className="text-brand-muted hover:text-brand-accent transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>

                <Link
                  to="/wishlist"
                  className="relative p-2 text-brand-muted hover:text-brand-accent hover:bg-brand-hover rounded-lg transition-colors"
                  title={t('wishlist')}
                >
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1 -translate-y-1">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <motion.button 
                  id="cart-button"
                  onClick={() => setIsCartOpen(true)}
                  animate={items.length > 0 ? { scale: [1, 1.2, 1] } : {}}
                  key={items.length}
                  className="relative p-2 text-brand-muted hover:text-brand-accent hover:bg-brand-hover rounded-lg transition-colors"
                  title={t('cart')}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {items.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full transform translate-x-1 -translate-y-1">
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </motion.button>

                <button
                  onClick={() => setLanguage(language === 'ru' ? 'be' : 'ru')}
                  className="hidden sm:block text-[10px] font-medium text-brand-muted hover:text-brand-accent transition-colors uppercase tracking-widest"
                  title={t('toggleLanguage')}
                >
                  {language}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-brand-bg z-50 shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-6 flex justify-between items-center border-b border-brand-border">
                <span className="font-serif text-xl font-medium tracking-tight text-brand-light">Menu</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-brand-muted hover:text-brand-accent"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-6">
                <nav className="flex flex-col gap-6">
                  <div>
                    <button 
                      onClick={() => setIsMobileCatalogOpen(!isMobileCatalogOpen)}
                      className="flex items-center justify-between w-full text-lg font-medium uppercase tracking-wider text-brand-light"
                    >
                      {t('catalog')}
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMobileCatalogOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isMobileCatalogOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-4 mt-2 space-y-3 border-l border-brand-border ml-1"
                        >
                          <Link to="/catalog" className="block text-base text-brand-muted hover:text-brand-accent">{t('viewAll')}</Link>
                          {catalogLinks.map(link => (
                            <Link
                              key={link.to}
                              to={link.to}
                              className="block text-base text-brand-muted hover:text-brand-accent"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Link to="/about" className="text-lg font-medium uppercase tracking-wider text-brand-light">{t('about')}</Link>
                  <Link to="/contacts" className="text-lg font-medium uppercase tracking-wider text-brand-light">{t('contacts')}</Link>
                </nav>

                <div className="mt-12 pt-8 border-t border-brand-border space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-muted">{t('toggleLanguage')}</span>
                    <button
                      onClick={() => setLanguage(language === 'ru' ? 'be' : 'ru')}
                      className="px-3 py-1 bg-brand-hover rounded-lg text-sm font-medium uppercase"
                    >
                      {language}
                    </button>
                  </div>
                </div>

                <div className="mt-12 flex gap-6">
                  <a href={settings?.instagram || "https://instagram.com"} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-accent">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href={settings?.telegram || "https://t.me/username"} target="_blank" rel="noreferrer" className="text-brand-muted hover:text-brand-accent">
                    <Send className="w-6 h-6" />
                  </a>
                  <a href={`mailto:${settings?.email || 'hello@arhetip.com'}`} className="text-brand-muted hover:text-brand-accent">
                    <Mail className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />

      <main className="min-h-[80vh]">
        <Outlet />
      </main>

      <footer className="border-t border-brand-border mt-24 transition-colors duration-300">
        <Newsletter />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-brand-muted text-sm">
          <p>&copy; {new Date().getFullYear()} АРХЕТИП. {t('allRightsReserved')}</p>
        </div>
      </footer>
        </div>
      )}
    </>
  );
}
