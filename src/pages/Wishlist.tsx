import { useEffect, useState } from 'react';
import { useWishlist } from '../components/WishlistProvider';
import { useLanguage } from '../components/LanguageProvider';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: Product[]) => {
        const wishlistProducts = data.filter(p => wishlist.includes(p.id));
        setProducts(wishlistProducts);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products', err);
        setLoading(false);
      });
  }, [wishlist]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-white/20 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-white/20 rounded w-48"></div>
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-brand-bg">
      <Helmet>
        <title>{t('wishlist')} | Arhetip</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-serif mb-8 text-brand-light">
          {t('wishlist')}
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-brand-muted text-lg mb-8">
              {t('emptyWishlist')}
            </p>
            <Link 
              to="/catalog" 
              className="inline-block px-8 py-3 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors"
            >
              {t('shopCollection')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-brand-border overflow-hidden rounded-2xl border border-brand-border">
            {products.map((product, index) => (
              <div key={product.id} className="bg-brand-bg">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
