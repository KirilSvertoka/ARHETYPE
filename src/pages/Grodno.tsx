import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useLanguage } from '../components/LanguageProvider';
import { SITE_ORIGIN, brandPath } from '../utils/seo';

const TOP_BRANDS = ['Tom Ford', 'Byredo', 'Le Labo', 'Kilian', 'Creed', 'Initio Parfums Prives', 'Mancera'];

export default function Grodno() {
  const { language } = useLanguage();
  const isBe = language === 'be';

  const title = isBe
    ? 'Духі і туалетная вада ў Гродне з дастаўкай па Беларусі | АРХЕТЫП'
    : 'Духи и туалетная вода в Гродно с доставкой по Беларуси | АРХЕТИП';
  const description = isBe
    ? 'Купіць арыгінальныя нішавыя духі ў Гродне: распіў, адліванты і флаконы. Кур\'ер па Гродне, Еўрапошта і Белпошта па ўсёй Беларусі.'
    : 'Купить оригинальные нишевые духи в Гродно: распив, отливанты и флаконы. Курьер по Гродно, Европочта и Белпочта по всей Беларуси.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE_ORIGIN}/grodno`,
    isPartOf: { '@type': 'WebSite', name: 'АРХЕТИП', url: SITE_ORIGIN },
    about: {
      '@type': 'Thing',
      name: isBe ? 'Парфумерыя ў Гродне' : 'Парфюмерия в Гродно',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
    >
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="духи гродно, туалетная вода гродно, парфюм гродно, доставка духов беларусь, нишевая парфюмерия гродно" />
        <link rel="canonical" href={`${SITE_ORIGIN}/grodno`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_ORIGIN}/grodno`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <p className="text-[10px] uppercase tracking-[0.25em] text-brand-accent mb-4">
        {isBe ? 'Гродна · Беларусь' : 'Гродно · Беларусь'}
      </p>
      <h1 className="font-serif text-4xl md:text-5xl text-brand-light leading-tight mb-6">
        {isBe ? 'Духі і туалетная вада ў Гродне' : 'Духи и туалетная вода в Гродно'}
      </h1>
      <p className="text-brand-muted text-lg font-light leading-relaxed mb-10">
        {isBe
          ? 'АРХЕТЫП — інтэрнэт-крама арыгінальнай нішавай парфумерыі ў Гродне. Распіў і поўныя флаконы з дастаўкай па горадзе і ўсёй Беларусі.'
          : 'АРХЕТИП — интернет-магазин оригинальной нишевой парфюмерии в Гродно. Распив и полные флаконы с доставкой по городу и всей Беларуси.'}
      </p>

      <section className="space-y-4 mb-12 text-brand-muted font-light leading-relaxed">
        <h2 className="font-serif text-2xl text-brand-light">
          {isBe ? 'Чаму купляць парфюм у Гродне ў нас' : 'Почему покупать парфюм в Гродно у нас'}
        </h2>
        <p>
          {isBe
            ? 'Мы працуем толькі з арыгінальнай прадукцыяй: Tom Ford, Byredo, Initio, Mancera, Kilian і іншыя нішавыя дамы. Можна ўзяць адлівант ад 1–2 мл, каб праверыць аромат, або замовіць поўны флакон.'
            : 'Мы работаем только с оригинальной продукцией: Tom Ford, Byredo, Initio, Mancera, Kilian и другие нишевые дома. Можно взять отливант от 1–2 мл, чтобы проверить аромат, или заказать полный флакон.'}
        </p>
        <p>
          {isBe
            ? 'Дастаўка кур\'ерам па Гродне — звычайна ў дзень замовы ці на наступны. Па Беларусі — Еўрапошта і Белпошта. Падрабязнасці на старонцы дастаўкі.'
            : 'Доставка курьером по Гродно — обычно в день заказа или на следующий. По Беларуси — Европочта и Белпочта. Подробности на странице доставки.'}
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-serif text-2xl text-brand-light mb-4">
          {isBe ? 'Папулярныя брэнды' : 'Популярные бренды'}
        </h2>
        <ul className="flex flex-wrap gap-3">
          {TOP_BRANDS.map((brand) => (
            <li key={brand}>
              <Link
                to={brandPath(brand)}
                className="inline-block border border-brand-border px-4 py-2 text-sm text-brand-muted hover:text-brand-accent hover:border-brand-accent transition-colors"
              >
                {brand}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/brands" className="inline-block px-4 py-2 text-sm text-brand-accent hover:underline">
              {isBe ? 'Усе брэнды →' : 'Все бренды →'}
            </Link>
          </li>
        </ul>
      </section>

      <section className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/catalog"
          className="inline-flex justify-center px-6 py-3 bg-brand-accent text-brand-bg text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {isBe ? 'Каталог' : 'В каталог'}
        </Link>
        <Link
          to="/catalog?category=eau_de_toilette"
          className="inline-flex justify-center px-6 py-3 border border-brand-border text-sm uppercase tracking-widest text-brand-light hover:border-brand-accent transition-colors"
        >
          {isBe ? 'Туалетная вада' : 'Туалетная вода'}
        </Link>
        <Link
          to="/p/delivery"
          className="inline-flex justify-center px-6 py-3 border border-brand-border text-sm uppercase tracking-widest text-brand-light hover:border-brand-accent transition-colors"
        >
          {isBe ? 'Дастаўка' : 'Доставка'}
        </Link>
      </section>
    </motion.div>
  );
}
