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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-16 px-4 sm:px-6 lg:px-8 py-12"
    >
      <Helmet>
        <title>{language === 'ru' ? 'О нас' : 'Пра нас'} | Arhetip</title>
        <meta name="description" content={language === 'ru' ? 'Путешествие в мир высокой парфюмерии.' : 'Падарожжа ў свет высокай парфумерыі.'} />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-brand-light">
          {language === 'ru' ? (settings?.aboutTitle || 'Наша история') : (settings?.aboutTitle_be || 'Наша гісторыя')}
        </h1>
        <p className="text-brand-muted max-w-2xl mx-auto">
          {language === 'ru' 
            ? (settings?.aboutDescription || 'Путешествие в мир высокой парфюмерии, где мы собираем самые изысканные ароматы для современных людей.') 
            : (settings?.aboutDescription_be || 'Падарожжа ў свет высокай парфумерыі, дзе мы збіраем самыя вытанчаныя водары для сучасных людзей.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="aspect-square rounded-3xl overflow-hidden bg-brand-bg">
          <img 
            src={settings?.aboutPhoto || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop"} 
            alt="Perfumery Studio" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-brand-light">
            {language === 'ru' ? (settings?.aboutArtTitle || 'Искусство выбора') : (settings?.aboutArtTitle_be || 'Мастацтва выбару')}
          </h2>
          <p className="text-brand-muted leading-relaxed font-light">
            {language === 'ru'
              ? (settings?.aboutArtText1 || 'Основанный в 2020 году, Arhetip родился из страсти к нишевой парфюмерии. Мы верим, что аромат — это больше, чем просто запах. Это невидимый аксессуар, триггер воспоминаний и глубокое выражение личности.')
              : (settings?.aboutArtText1_be || 'Заснаваны ў 2020 годзе, Arhetip нарадзіўся з запалу да нішавай парфумерыі. Мы верым, што водар — гэта больш, чым проста пах. Гэта нябачны аксэсуар, трыгер успамінаў і глыбокае выяўленне асобы.')}
          </p>
          <p className="text-brand-muted leading-relaxed font-light">
            {language === 'ru'
              ? (settings?.aboutArtText2 || 'Наша коллекция тщательно отобрана. Мы путешествуем по миру, чтобы найти независимых парфюмеров, которые ставят качество ингредиентов и инновационные композиции выше массовой привлекательности. Каждый флакон в нашем магазине был протестирован и полюблен нашей командой.')
              : (settings?.aboutArtText2_be || 'Наша калекцыя старанна адабрана. Мы падарожнічаем па свеце, каб знайсці незалежных парфумераў, якія ставяць якасць інгрэдыентаў і інавацыйныя кампазіцыі вышэй за масавую прывабнасць. Кожны флакон у нашай краме быў пратэставаны і ўпадабаны нашай камандай.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-12 border-t border-brand-border">
        <div className="space-y-2">
          <h3 className="text-3xl font-serif text-brand-light">{settings?.stat1Value || '50+'}</h3>
          <p className="text-sm uppercase tracking-wider text-brand-muted">
            {language === 'ru' ? (settings?.stat1Label || 'Уникальных ароматов') : (settings?.stat1Label_be || 'Унікальных водараў')}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-serif text-brand-light">{settings?.stat2Value || '12'}</h3>
          <p className="text-sm uppercase tracking-wider text-brand-muted">
            {language === 'ru' ? (settings?.stat2Label || 'Нишевых брендов') : (settings?.stat2Label_be || 'Нішавых брэндаў')}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-serif text-brand-light">{settings?.stat3Value || '10k+'}</h3>
          <p className="text-sm uppercase tracking-wider text-brand-muted">
            {language === 'ru' ? (settings?.stat3Label || 'Счастливых клиентов') : (settings?.stat3Label_be || 'Шчаслівых кліентаў')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
