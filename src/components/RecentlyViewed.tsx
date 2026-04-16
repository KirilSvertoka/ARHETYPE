import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { useLanguage } from './LanguageProvider';
import { motion } from 'motion/react';

export default function RecentlyViewed({ currentProductId }: { currentProductId: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    // Filter out current product to avoid duplication if it's in history
    const filteredIds = viewedIds.filter((id: number) => id !== currentProductId).slice(0, 3);

    if (filteredIds.length > 0) {
      fetch('/api/products')
        .then(res => {
          if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
          return res.json();
        })
        .then((data: Product[]) => {
          const viewedProducts = filteredIds
            .map((id: number) => data.find(p => p.id === id))
            .filter((p: Product | undefined): p is Product => !!p);
          setProducts(viewedProducts);
        })
        .catch(console.error);
    }
  }, [currentProductId]);

  // Update history when currentProductId changes
  useEffect(() => {
    if (!currentProductId) return;
    
    const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    // Remove current if exists, add to front
    const newIds = [currentProductId, ...viewedIds.filter((id: number) => id !== currentProductId)].slice(0, 10);
    
    localStorage.setItem('recentlyViewed', JSON.stringify(newIds));
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-12 border-t border-brand-border pt-16">
      <h2 className="text-2xl font-serif text-brand-light mb-8">{t('recentlyViewed')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-brand-border overflow-hidden rounded-2xl border border-brand-border">
        {products.map((product, index) => (
          <div key={product.id} className="bg-brand-bg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <ProductCard product={product} />
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
