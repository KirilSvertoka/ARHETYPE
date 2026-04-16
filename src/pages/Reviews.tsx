import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../components/LanguageProvider';
import { Review } from '../types';

export default function Reviews() {
  const { language, t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => {
        if (!res.ok) throw new Error(`Reviews fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch reviews', err);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8 py-12"
    >
      <Helmet>
        <title>{language === 'ru' ? 'Отзывы' : 'Водгукі'} | Arhetip</title>
        <meta name="description" content={language === 'ru' ? 'Что говорят наши клиенты о Arhetip. Реальные отзывы о качестве парфюмерии и сервисе.' : 'Што кажуць нашы кліенты пра Arhetip. Рэальныя водгукі аб якасці парфумерыі і сэрвісе.'} />
        <link rel="canonical" href={`${window.location.origin}/reviews`} />
      </Helmet>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-brand-light">
          {language === 'ru' ? 'Отзывы клиентов' : 'Водгукі кліентаў'}
        </h1>
        <p className="text-brand-muted">
          {language === 'ru' ? 'Прочтите, что говорят наши клиенты о своих ароматах.' : 'Прачытайце, што кажуць нашы кліенты пра свае водары.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm h-48 animate-pulse" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, i) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm flex flex-col h-full"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-brand-border'}`} />
                ))}
              </div>
              <p className="text-brand-muted italic mb-6 flex-1">"{review.comment}"</p>
              <div className="flex items-center justify-between border-t border-brand-border pt-4 mt-auto">
                <span className="font-medium text-brand-light">{review.userName}</span>
                <span className="text-xs uppercase tracking-wider text-brand-muted">{(review as any).productName}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-brand-muted italic">{t('noReviews')}</p>
        </div>
      )}
    </motion.div>
  );
}
