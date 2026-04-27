import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';

const ServerError: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20">
      <Helmet>
        <title>502 — Ой, сервер приуныл | АРХЕТИП</title>
      </Helmet>

      <div className="max-w-2xl w-full text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative inline-block"
        >
          <div className="text-[120px] md:text-[180px] font-serif leading-none opacity-10 select-none">
            502
          </div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img 
              src="https://vgif.ru/gifs/135/kot-upal-s-korobkoy.gif" 
              alt="Падающий кот" 
              className="w-48 md:w-64 h-auto rounded-3xl shadow-2xl border-4 border-brand-accent/20"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-3xl md:text-4xl font-serif text-brand-light">
            {language === 'be' ? 'Ой, сервер прыуныў...' : 'Ой, сервер приуныл...'}
          </h1>
          <p className="text-brand-muted text-lg max-w-md mx-auto">
            {language === 'be' 
              ? 'Наш сервер упаў, але хутка ўстане і будзе яшчэ мацнейшым! Мы ўжо падымаем яго.' 
              : 'Наш сервер упал, но скоро встанет и будет ещё сильнее! Мы уже поднимаем его.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-brand-accent text-white rounded-full hover:bg-brand-accent-hover transition-all shadow-lg shadow-brand-accent/20"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>{language === 'be' ? 'Паспрабаваць яшчэ раз' : 'Попробовать ещё раз'}</span>
          </button>
          
          <Link 
            to="/"
            className="flex items-center gap-2 px-8 py-3 bg-white/5 text-brand-light rounded-full border border-brand-border hover:bg-white/10 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{t('backToHome')}</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ServerError;
