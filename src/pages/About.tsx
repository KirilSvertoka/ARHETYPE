import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../components/LanguageProvider';
import React, { useState, useEffect } from 'react';
import { GeneralSettings } from '../types';

export default function About() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings/general')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{language === 'ru' ? 'О нас' : 'Пра нас'} | АРХЕТИП</title>
        <meta name="description" content={language === 'ru' ? 'Путешествие в мир высокой парфюмерии.' : 'Падарожжа ў свет высокай парфумерыі.'} />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>

      {/* Hero Section */}
      <section className="pt-16 pb-16 md:pt-24 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="initial" animate="animate" variants={fadeIn}
          className="max-w-4xl"
        >
          <span className="text-brand-accent text-sm font-medium tracking-[0.2em] uppercase mb-6 block">
            {language === 'ru' ? 'О проекте' : 'Пра праект'}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-brand-light leading-tight mb-8">
            {language === 'ru' ? (settings?.aboutTitle || 'Наша история') : (settings?.aboutTitle_be || 'Наша гісторыя')}
          </h1>
          <p className="text-xl sm:text-2xl text-brand-muted font-light leading-relaxed max-w-3xl">
            {language === 'ru' 
              ? (settings?.aboutDescription || 'Путешествие в мир высокой парфюмерии, где мы собираем самые изысканные ароматы для современных людей.') 
              : (settings?.aboutDescription_be || 'Падарожжа ў свет высокай парфумерыі, дзе мы збіраем самыя вытанчаныя водары для сучасных людзей.')}
          </p>
        </motion.div>
      </section>

      {/* Main Content Area */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            <div className="sticky top-32">
              <div className="aspect-[3/4] md:aspect-[4/5] rounded-none border border-brand-border overflow-hidden bg-brand-border/30 relative group">
                <div className="absolute inset-0 bg-brand-bg/10 group-hover:bg-transparent transition-colors duration-700 z-10" />
                <img 
                  src={settings?.aboutPhoto || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop"} 
                  alt="Perfumery Studio" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-7 lg:pt-16 space-y-16"
          >
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-brand-light leading-tight">
                {language === 'ru' ? (settings?.aboutArtTitle || 'Искусство выбора') : (settings?.aboutArtTitle_be || 'Мастацтва выбару')}
              </h2>
              <div className="prose prose-invert prose-brand max-w-none">
                <p className="text-lg sm:text-xl text-brand-muted/90 leading-relaxed font-light">
                  {language === 'ru'
                    ? (settings?.aboutArtText1 || 'Основанный в 2020 году, АРХЕТИП родился из страсти к нишевой парфюмерии. Мы верим, что аромат — это больше, чем просто запах. Это невидимый аксессуар, триггер воспоминаний и глубокое выражение личности.')
                    : (settings?.aboutArtText1_be || 'Заснаваны ў 2020 годзе, АРХЕТИП нарадзіўся з запалу да нішавай парфумерыі. Мы верым, што водар — гэта больш, чым проста пах. Гэта нябачны аксэсуар, трыгер успамінаў і глыбокае выяўленне асобы.')}
                </p>
                <div className="w-16 h-px bg-brand-accent/50 my-10" />
                <p className="text-lg sm:text-xl text-brand-muted/90 leading-relaxed font-light">
                  {language === 'ru'
                    ? (settings?.aboutArtText2 || 'Наша коллекция тщательно отобрана. Мы путешествуем по миру, чтобы найти независимых парфюмеров, которые ставят качество ингредиентов и инновационные композиции выше массовой привлекательности. Каждый флакон в нашем магазине был протестирован и полюблен нашей командой.')
                    : (settings?.aboutArtText2_be || 'Наша калекцыя старанна адабрана. Мы падарожнічаем па свеце, каб знайсці незалежных парфумераў, якія ставяць якасць інгрэдыентаў і інавацыйныя кампазіцыі вышэй за масавую прывабнасць. Кожны флакон у нашай краме быў пратэставаны і ўпадабаны нашай камандай.')}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-12 border-t border-brand-border/50">
              <div className="space-y-3">
                <h3 className="text-4xl sm:text-5xl font-serif text-brand-light">{settings?.stat1Value || '50+'}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted font-medium">
                  {language === 'ru' ? (settings?.stat1Label || 'Уникальных ароматов') : (settings?.stat1Label_be || 'Унікальных водараў')}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl sm:text-5xl font-serif text-brand-light">{settings?.stat2Value || '12'}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted font-medium">
                  {language === 'ru' ? (settings?.stat2Label || 'Нишевых брендов') : (settings?.stat2Label_be || 'Нішавых брэндаў')}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl sm:text-5xl font-serif text-brand-light">{settings?.stat3Value || '10k+'}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted font-medium">
                  {language === 'ru' ? (settings?.stat3Label || 'Счастливых клиентов') : (settings?.stat3Label_be || 'Шчаслівых кліентаў')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
