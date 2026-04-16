import { motion } from 'motion/react';
import { Mail, Phone, MapPin } from 'lucide-react';
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8 py-12"
    >
      <Helmet>
        <title>{language === 'ru' ? 'Контакты' : 'Кантакты'} | Arhetip</title>
        <meta name="description" content={language === 'ru' ? 'Свяжитесь с нами для консультации по выбору аромата.' : 'Звяжыцеся з намі для кансультацыі па выбары водару.'} />
        <link rel="canonical" href={`${window.location.origin}/contacts`} />
      </Helmet>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-brand-light">
          {language === 'ru' ? 'Свяжитесь с нами' : 'Звяжыцеся з намі'}
        </h1>
        <p className="text-brand-muted">
          {language === 'ru' ? 'Мы будем рады ответить на ваши вопросы.' : 'Мы будзем рады адказаць на вашы пытанні.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-2xl border border-brand-border shadow-sm">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-brand-light" />
          </div>
          <h3 className="font-medium text-brand-light mb-1">Email</h3>
          <p className="text-sm text-brand-muted">{settings?.email || 'hello@arhetip.com'}</p>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-2xl border border-brand-border shadow-sm">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-5 h-5 text-brand-light" />
          </div>
          <h3 className="font-medium text-brand-light mb-1">
            {language === 'ru' ? 'Телефон' : 'Тэлефон'}
          </h3>
          <p className="text-sm text-brand-muted">{settings?.phone || '+375 (29) 123-45-67'}</p>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-2xl border border-brand-border shadow-sm">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5 text-brand-light" />
          </div>
          <h3 className="font-medium text-brand-light mb-1">
            {language === 'ru' ? 'Студия' : 'Студыя'}
          </h3>
          <p className="text-sm text-brand-muted">
            {language === 'ru' ? (settings?.address || 'ул. Парфюмерная 123, Минск, Беларусь') : (settings?.address_be || 'вул. Парфумерная 123, Мінск, Беларусь')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
