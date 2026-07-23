import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useLanguage } from '../components/LanguageProvider';
import { SITE_ORIGIN, brandPath, slugify } from '../utils/seo';

export default function Brands() {
  const { language } = useLanguage();
  const isBe = language === 'be';
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((products: { brand?: string }[]) => {
        const set = new Set<string>();
        products.forEach((p) => {
          if (p.brand) set.add(p.brand);
        });
        setBrands(Array.from(set).sort((a, b) => a.localeCompare(b)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const title = isBe
    ? 'Брэнды парфумерыі — купіць у Гродне і Беларусі | АРХЕТЫП'
    : 'Бренды парфюмерии — купить в Гродно и Беларуси | АРХЕТИП';
  const description = isBe
    ? 'Каталог нішавых брэндаў: Tom Ford, Byredo, Initio, Mancera і іншыя. Арыгінал, распіў і дастаўка па Гродне і РБ.'
    : 'Каталог нишевых брендов: Tom Ford, Byredo, Initio, Mancera и другие. Оригинал, распив и доставка по Гродно и РБ.';

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: brands.map((brand, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: brand,
      url: `${SITE_ORIGIN}${brandPath(brand)}`,
    })),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_ORIGIN}/brands`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_ORIGIN}/brands`} />
        <script type="application/ld+json">{JSON.stringify(itemList)}</script>
      </Helmet>

      <h1 className="font-serif text-4xl md:text-5xl text-brand-light mb-4">
        {isBe ? 'Брэнды' : 'Бренды'}
      </h1>
      <p className="text-brand-muted font-light mb-10 max-w-2xl">
        {isBe
          ? 'Абярыце бренд, каб убачыць арыгінальныя духі і туалетную ваду з дастаўкай па Гродне і Беларусі.'
          : 'Выберите бренд, чтобы увидеть оригинальные духи и туалетную воду с доставкой по Гродно и Беларуси.'}
      </p>

      {loading ? (
        <div className="animate-pulse h-12 w-12 rounded-full bg-brand-border" />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {brands.map((brand) => (
            <li key={brand}>
              <Link
                to={brandPath(brand)}
                className="block border border-brand-border px-5 py-4 text-brand-light hover:border-brand-accent hover:text-brand-accent transition-colors"
              >
                <span className="font-serif text-lg">{brand}</span>
                <span className="block text-[10px] uppercase tracking-widest text-brand-muted mt-1">
                  /brand/{slugify(brand)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-12">
        <Link to="/grodno" className="text-sm text-brand-accent hover:underline">
          {isBe ? '← Духі ў Гродне' : '← Духи в Гродно'}
        </Link>
      </p>
    </motion.div>
  );
}
