import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { useLanguage } from './LanguageProvider';
import { motion } from 'motion/react';

interface RelatedProductsProps {
  product: Product;
}

export default function RelatedProducts({ product }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: Product[]) => {
        const currentNotes = [
          ...(product.topNotes || []).map(n => n.name),
          ...(product.heartNotes || []).map(n => n.name),
          ...(product.baseNotes || []).map(n => n.name)
        ];
        const currentFamilies = product.scentFamilies || [];

        const scoredProducts = data
          .filter(p => p.id !== product.id)
          .map(p => {
            let score = 0;
            
            // Score based on scent families overlap
            const pFamilies = p.scentFamilies || [];
            const familyOverlap = pFamilies.filter(f => currentFamilies.includes(f)).length;
            score += familyOverlap * 3;

            // Score based on notes overlap
            const pNotes = [
              ...(p.topNotes || []).map(n => n.name),
              ...(p.heartNotes || []).map(n => n.name),
              ...(p.baseNotes || []).map(n => n.name)
            ];
            const notesOverlap = pNotes.filter(n => currentNotes.includes(n)).length;
            score += notesOverlap * 2;

            // Same brand bonus
            if (p.brand === product.brand) {
              score += 1;
            }

            return { product: p, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.product);
        
        setProducts(scoredProducts);
      })
      .catch(console.error);
  }, [product]);

  if (products.length === 0) return null;

  return (
    <div className="mt-24 border-t border-brand-border pt-16">
      <h2 className="text-2xl font-serif text-brand-light mb-8">{t('youMayAlsoLike')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-brand-border overflow-hidden rounded-2xl border border-brand-border">
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
