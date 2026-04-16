import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';

export default function Forbidden() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.21, 1, 0.36, 1] }}
        className="text-center max-w-lg"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.21, 1, 0.36, 1] }}
          className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <Lock className="w-10 h-10 text-brand-muted" />
        </motion.div>
        
        <h1 className="text-8xl font-serif text-brand-light mb-4 tracking-tighter">403</h1>
        <h2 className="text-2xl font-serif text-brand-light mb-4">{t('exclusiveVault')}</h2>
        
        <p className="text-brand-muted mb-10 leading-relaxed">
          {t('exclusiveVaultDesc')}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/admin"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-full hover:bg-brand-accent-hover transition-colors font-medium w-full sm:w-auto"
          >
            <span>{t('presentCredentials')}</span>
          </Link>
          <Link 
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-brand-border text-brand-light rounded-full hover:bg-white/5 transition-colors font-medium w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('returnToBoutique')}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
