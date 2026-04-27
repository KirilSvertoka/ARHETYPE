import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, RefreshCcw, Coffee } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';

const ServerError: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-brand-bg relative overflow-hidden">
      <Helmet>
        <title>502 — Котик приуныл | АРХЕТИП</title>
      </Helmet>

      {/* Декоративные элементы на фоне */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent blur-[120px]" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block"
        >
          {/* Большая надпись 502 на фоне */}
          <div className="text-[150px] md:text-[220px] font-serif font-bold leading-none text-brand-light/5 select-none tracking-tighter italic">
            502
          </div>
          
          {/* Контейнер с гифкой */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pt-8"
          >
            <div className="relative group">
              {/* Свечение за гифкой */}
              <div className="absolute -inset-4 bg-brand-accent/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <img 
                src="https://vgif.ru/gifs/135/kot-upal-s-korobkoy.gif" 
                alt="Падающий кот" 
                className="w-56 md:w-72 h-auto rounded-[32px] shadow-2xl border-2 border-white/10 relative z-10 object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Плашка с надписью поверх гифки (как мем) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-4 -right-4 bg-white text-brand-bg px-4 py-2 rounded-xl font-bold text-sm shadow-xl z-20 rotate-6"
              >
                Упс! Шкаф упал... 📦
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] uppercase font-bold tracking-[0.2em]">
            Server Under Maintenance
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif text-brand-light leading-tight">
            {language === 'be' ? 'Наш сервер крыху прыстаў...' : 'Наш сервер немного прилёг...'}
          </h1>
          
          <p className="text-brand-muted text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            {language === 'be' 
              ? 'Ён проста вырашыў адпачыць разам з гэтым катом. Але не хвалюйцеся, мы яго ўжо будзім! Хутка ён будзе яшчэ мацнейшым і хутчэйшым.' 
              : 'Он просто решил отдохнуть вместе с этим котиком. Но не волнуйтесь, мы его уже будим! Скоро он станет ещё сильнее и быстрее.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
        >
          <button 
            onClick={() => window.location.reload()}
            className="group flex items-center gap-3 px-10 py-4 bg-brand-accent text-white rounded-full hover:bg-brand-accent-hover transition-all shadow-2xl shadow-brand-accent/30 font-bold"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span>{language === 'be' ? 'Разбудзіць сервер' : 'Разбудить сервер'}</span>
          </button>
          
          <Link 
            to="/"
            className="flex items-center gap-3 px-10 py-4 bg-white/5 text-brand-light rounded-full border border-brand-border hover:bg-white/10 hover:border-brand-light/20 transition-all font-medium"
          >
            <Home className="w-5 h-5" />
            <span>{t('backToHome')}</span>
          </Link>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5 }}
          className="text-[10px] uppercase tracking-widest text-brand-muted"
        >
          Error Code: 502 Bad Gateway / Server Nap Time
        </motion.p>
      </div>
    </div>
  );
};

export default ServerError;
