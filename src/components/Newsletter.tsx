import React, { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Newsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
  };

  return (
    <div className="bg-brand-hover border-t border-brand-border py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2">
          <h2 className="text-2xl md:text-3xl font-serif mb-2 text-brand-light">{t('newsletterTitle')}</h2>
          <p className="text-brand-muted font-light">{t('newsletterDesc')}</p>
        </div>
        
        <div className="w-full md:w-1/2 max-w-md">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-emerald-600 font-medium p-4 bg-emerald-500/10 rounded-none text-xs uppercase tracking-wider"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('newsletterSuccess')}</span>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="relative"
              >
                <div className="flex border border-brand-border bg-white rounded-none">
                  <input
                    type="email"
                    required
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 w-full pl-4 py-4 bg-transparent text-brand-light placeholder:text-brand-muted focus:outline-none text-xs uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-8 bg-brand-accent text-white rounded-none font-semibold text-xs uppercase tracking-[0.2em] hover:bg-brand-accent-hover transition-colors disabled:opacity-70"
                  >
                    {status === 'loading' ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('subscribe')
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
