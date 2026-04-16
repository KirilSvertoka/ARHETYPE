import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export default function CallbackForm() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to send');
      
      setStatus('success');
      setFormData({ name: '', phone: '', message: '' });
      
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-emerald-600 dark:text-emerald-400 space-y-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
        <CheckCircle2 className="w-12 h-12" />
        <div>
          <h3 className="font-serif text-xl mb-1 text-emerald-800 dark:text-emerald-300">{t('requestReceived')}</h3>
          <p className="text-emerald-600/80 dark:text-emerald-400/80 text-sm">{t('managerContact')}</p>
        </div>
      </div>
    );
  }

  return (
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
            <span>{t('requestCallback')}</span>
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
