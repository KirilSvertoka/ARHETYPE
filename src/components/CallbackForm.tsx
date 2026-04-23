import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2, X } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { motion, AnimatePresence } from 'motion/react';
import { trackGoal } from '../utils/analytics';

interface CallbackFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  productName?: string;
}

export default function CallbackForm({ isOpen, onClose, productName }: CallbackFormProps) {
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    message: productName ? `${productName}` : '' 
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          message: productName ? `ЗАКАЗ В 1 КЛИК: ${productName}. ${formData.message}` : formData.message
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      
      setStatus('success');
      trackGoal(productName ? 'quick_order' : 'callback_request', productName || 'general');
      setFormData({ name: '', phone: '', message: '' });
      
      if (onClose) {
        setTimeout(() => {
          setStatus('idle');
          onClose();
        }, 3000);
      } else {
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const formContent = (
    <div className={onClose ? "bg-brand-bg p-8 rounded-3xl border border-brand-border shadow-2xl w-full max-w-md relative overflow-hidden" : ""}>
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-light transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="mb-8">
        <h3 className="font-serif text-2xl text-brand-light uppercase tracking-wider mb-2">
          {productName 
            ? (language === 'be' ? 'Шуткая замова' : 'Быстрый заказ') 
            : (language === 'be' ? 'Зваротны званок' : 'Обратный звонок')}
        </h3>
        <p className="text-sm text-brand-muted font-light">
          {productName 
            ? (language === 'be' ? 'Пакіньце дадзеныя, і мы звяжамся для афармлення.' : 'Оставьте данные, и мы свяжемся для оформления.') 
            : (language === 'be' ? 'Наш менеджар ператэлефануе вам у бліжэйшы час.' : 'Наш менеджер перезвонит вам в ближайшее время.')}
        </p>
      </div>

      {status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center text-brand-accent space-y-4 bg-brand-accent/5 rounded-2xl border border-brand-accent/20"
        >
          <CheckCircle2 className="w-12 h-12" />
          <div>
            <h3 className="font-serif text-xl mb-1 text-brand-accent">{t('requestReceived')}</h3>
            <p className="text-brand-muted text-sm">{t('managerContact')}</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">{t('name')}</label>
            <input
              type="text"
              id="name"
              required
              minLength={2}
              maxLength={100}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all placeholder:text-brand-muted text-brand-light"
              placeholder={t('placeholderName')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">{t('phoneNumber')}</label>
            <input
              type="tel"
              id="phone"
              required
              pattern="^(\+?[0-9\s\-\(\)]{7,20})$"
              title="Введите корректный номер телефона"
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9+\-\s()]*$/.test(val)) {
                  setFormData({ ...formData, phone: val });
                }
              }}
              className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all placeholder:text-brand-muted text-brand-light"
              placeholder={t('placeholderPhone')}
            />
          </div>

          {!productName && (
            <div className="space-y-1">
              <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">{t('messageOptional')}</label>
              <textarea
                id="message"
                rows={3}
                minLength={formData.message ? 5 : 0}
                maxLength={1000}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all resize-none placeholder:text-brand-muted text-brand-light"
                placeholder={t('placeholderMessage')}
              />
            </div>
          )}

          {status === 'error' && (
            <p className="text-red-400 text-sm text-center py-2 bg-red-900/20 rounded-lg">
              {t('failedToSend')}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-brand-accent text-white rounded-xl font-medium tracking-wide hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent focus:ring-offset-brand-bg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{productName ? (language === 'be' ? 'Замовіць' : 'Заказать') : t('requestCallback')}</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );

  if (onClose) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              {formContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return formContent;
}
