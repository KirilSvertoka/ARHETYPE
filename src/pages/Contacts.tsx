import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Instagram, MessageCircle, Send, Facebook, Youtube, Link2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../components/LanguageProvider';
import React, { useState, useEffect } from 'react';
import { GeneralSettings } from '../types';

export default function Contacts() {
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

  const orgData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "АРХЕТИП",
    "url": "https://archetype.by",
    "logo": "https://archetype.by/favicon.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Grodno",
      "addressCountry": "BY",
      "postalCode": "230005",
      "streetAddress": "ул. Парфюмерная 123"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings?.phone || "+37529XXXXXXX",
      "contactType": "customer service"
    }
  };

  const blocks = [];
  
  if (settings?.showContactsEmail !== false) {
    blocks.push(
      <motion.div 
        key="email"
        variants={fadeIn}
        className="flex flex-col items-center text-center p-10 bg-brand-bg/50 backdrop-blur-sm rounded-none border border-brand-border hover:border-brand-accent/50 transition-colors group w-full md:flex-1 min-w-[280px] max-w-[400px]"
      >
        <div className="w-16 h-16 bg-brand-accent/5 border border-brand-accent/20 rounded-none flex items-center justify-center mb-6 group-hover:bg-brand-accent/10 transition-colors">
          <Mail className="w-5 h-5 text-brand-accent" />
        </div>
        <h3 className="text-xl font-serif text-brand-light mb-3">Email</h3>
        <a href={`mailto:${settings?.email || 'hello@arhetip.com'}`} className="text-lg text-brand-muted hover:text-brand-accent transition-colors break-words text-center w-full">
          {settings?.email || 'hello@arhetip.com'}
        </a>
      </motion.div>
    );
  }

  if (settings?.showContactsPhone !== false) {
    blocks.push(
      <motion.div 
        key="phone"
        variants={fadeIn}
        className="flex flex-col items-center text-center p-10 bg-brand-bg/50 backdrop-blur-sm rounded-none border border-brand-border hover:border-brand-accent/50 transition-colors group w-full md:flex-1 min-w-[280px] max-w-[400px]"
      >
        <div className="w-16 h-16 bg-brand-accent/5 border border-brand-accent/20 rounded-none flex items-center justify-center mb-6 group-hover:bg-brand-accent/10 transition-colors">
          <Phone className="w-5 h-5 text-brand-accent" />
        </div>
        <h3 className="text-xl font-serif text-brand-light mb-3">
          {language === 'ru' ? 'Телефон' : 'Тэлефон'}
        </h3>
        <a href={`tel:${settings?.phone || '+375 (29) 123-45-67'}`} className="text-lg text-brand-muted hover:text-brand-accent transition-colors break-words text-center w-full">
          {settings?.phone || '+375 (29) 123-45-67'}
        </a>
      </motion.div>
    );
  }

  if (settings?.showContactsAddress !== false) {
    blocks.push(
      <motion.div 
        key="address"
        variants={fadeIn}
        className="flex flex-col items-center text-center p-10 bg-brand-bg/50 backdrop-blur-sm rounded-none border border-brand-border hover:border-brand-accent/50 transition-colors group w-full md:flex-1 min-w-[280px] max-w-[400px]"
      >
        <div className="w-16 h-16 bg-brand-accent/5 border border-brand-accent/20 rounded-none flex items-center justify-center mb-6 group-hover:bg-brand-accent/10 transition-colors">
          <MapPin className="w-5 h-5 text-brand-accent" />
        </div>
        <h3 className="text-xl font-serif text-brand-light mb-3">
          {language === 'ru' ? 'Студия' : 'Студыя'}
        </h3>
        <p className="text-lg text-brand-muted max-w-[250px] mx-auto text-center w-full">
          {language === 'ru' ? (settings?.address || 'ул. Парфюмерная 123, Гродно, Беларусь') : (settings?.address_be || 'вул. Парфумерная 123, Гродна, Беларусь')}
        </p>
      </motion.div>
    );
  }

  const socialLinks = settings?.socialLinks?.filter(l => l.active) || [];

  return (
    <div className="min-h-screen pt-16 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Helmet>
        <title>{language === 'ru' ? 'Контакты' : 'Кантакты'} | АРХЕТИП</title>
        <meta name="description" content={language === 'ru' ? 'Свяжитесь с нами для консультации по выбору аромата.' : 'Звяжыцеся з намі для кансультацыі па выбары водару.'} />
        <link rel="canonical" href="https://archetype.by/contacts" />
        <script type="application/ld+json">
          {JSON.stringify(orgData)}
        </script>
      </Helmet>

      <motion.div 
        initial="initial" animate="animate" variants={fadeIn}
        className="max-w-4xl mx-auto text-center mb-16 md:mb-24"
      >
        <span className="text-brand-accent text-sm font-medium tracking-[0.2em] uppercase mb-6 block">
          {language === 'ru' ? 'Связь' : 'Сувязь'}
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-light leading-tight mb-8">
          {language === 'ru' 
            ? (settings?.contactsTitle || 'Свяжитесь с нами') 
            : (settings?.contactsTitle_be || 'Звяжыцеся з намі')}
        </h1>
        <p className="text-xl text-brand-muted font-light leading-relaxed max-w-2xl mx-auto">
          {language === 'ru' 
            ? (settings?.contactsDescription || 'Мы будем рады ответить на ваши вопросы и помочь с выбором.') 
            : (settings?.contactsDescription_be || 'Мы будзем рады адказаць на вашы пытанні і дапамагчы з выбарам.')}
        </p>
      </motion.div>

      <motion.div 
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: 0.1 } }
        }}
        className="flex flex-wrap justify-center gap-8 mb-24"
      >
        {blocks}
      </motion.div>

      {settings?.showContactsSocials !== false && socialLinks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-brand-light mb-4">
              {language === 'ru' ? 'Мы в соцсетях' : 'Мы ў сацсетках'}
            </h2>
            <div className="w-16 h-px bg-brand-accent/50 mx-auto" />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {socialLinks.map((link, idx) => {
              let Icon = Link2;
              switch (link.platform) {
                case 'instagram': Icon = Instagram; break;
                case 'telegram': Icon = Send; break;
                case 'whatsapp': Icon = MessageCircle; break;
                case 'viber': Icon = MessageCircle; break;
                case 'facebook': Icon = Facebook; break;
                case 'youtube': Icon = Youtube; break;
              }
              
              return (
                <a 
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="px-8 py-3.5 bg-brand-bg/50 backdrop-blur-sm border border-brand-border rounded-none text-brand-light hover:border-brand-accent hover:bg-brand-accent/5 transition-all duration-300 font-semibold flex items-center justify-center gap-3 group min-w-[200px]"
                >
                  <Icon className="w-4 h-4 text-brand-muted group-hover:text-brand-accent transition-colors" />
                  <span className="text-xs uppercase tracking-[0.15em]">{link.platform}</span>
                </a>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
