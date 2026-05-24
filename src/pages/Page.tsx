import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../components/LanguageProvider';
import { ArrowLeft, Clock, Calendar, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FAQItem } from '../types';

interface CMSPage {
  id: string;
  title: string;
  title_be?: string;
  content: string;
  content_be?: string;
  updated_at: string;
  seoTitle?: string;
  seoDescription?: string;
}

export default function Page() {
  const { id } = useParams();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        if (id === 'faq') {
          const res = await fetch('/api/faq');
          if (res.ok) {
            const data = await res.json();
            setFaqItems(data);
          }
          setPage({
            id: 'faq',
            title: 'Часто задаваемые вопросы',
            title_be: 'Часта задаваныя пытанні',
            content: '',
            updated_at: new Date().toISOString(),
            seoTitle: 'Часто задаваемые вопросы (FAQ) — ARCHETYPE',
            seoDescription: 'Ответы на популярные вопросы о покупке нишевой парфюмерии, доставке, оплате и отливантах в магазине Archetype.'
          });
        } else {
          const res = await fetch(`/api/pages/${id}`);
          if (res.ok) {
            const data: CMSPage = await res.json();
            setPage(data);
          } else {
            setPage(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch CMS page or FAQ', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mr-2 inline-block" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center">
        <h1 className="text-4xl font-serif mb-4 uppercase tracking-wider">{t('pageNotFound')}</h1>
        <Link to="/" className="text-brand-accent hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const title = language === 'be' && page.title_be ? page.title_be : page.title;
  const content = language === 'be' && page.content_be ? page.content_be : page.content;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 overflow-hidden"
    >
      <Helmet>
        <title>{page.seoTitle || `${title} — Archetype`}</title>
        {page.seoDescription && <meta name="description" content={page.seoDescription} />}
      </Helmet>

      <div className="mb-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {language === 'be' ? 'На галоўную' : 'На главную'}
        </Link>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-light uppercase tracking-widest leading-tight break-words hyphens-auto">
          {title}
        </h1>
        
        <div className="flex items-center gap-4 mt-6 text-xs text-brand-muted uppercase tracking-widest">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3 h-3" />
            {language === 'be' ? 'Абноўлена' : 'Обновлено'}: {new Date(page.updated_at).toLocaleDateString(language === 'be' ? 'be-BY' : 'ru-RU')}
          </div>
        </div>
      </div>

      {id === 'faq' ? (
        <div className="space-y-4 mt-8">
          {faqItems.length === 0 ? (
            <p className="text-brand-muted text-center py-12">
              {language === 'be' ? 'Няма даступных пытанняў.' : 'Нет доступных вопросов.'}
            </p>
          ) : (
            faqItems.map((item, idx) => {
              const q = language === 'be' && item.question_be ? item.question_be : item.question;
              const a = language === 'be' && item.answer_be ? item.answer_be : item.answer;
              const isExpanded = expandedFaqId === item.id;

              return (
                <div 
                  key={item.id} 
                  className="bg-white/5 border border-brand-border/40 hover:border-brand-border rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : item.id)}
                    className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex justify-between items-center gap-4 group cursor-pointer"
                  >
                    <span className="font-medium text-brand-light group-hover:text-brand-light transition-colors tracking-wide text-sm sm:text-base pr-2 leading-relaxed">
                      {q}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-brand-muted group-hover:text-brand-light transition-transform duration-300 shrink-0 ${
                        isExpanded ? 'rotate-180 text-brand-accent' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="border-t border-brand-border/20 px-5 sm:px-6 py-4 bg-black/10 text-brand-muted leading-relaxed text-xs sm:text-sm font-light whitespace-pre-wrap">
                          {a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="prose prose-invert prose-brand max-w-none prose-p:text-brand-muted prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-headings:font-serif prose-headings:uppercase prose-headings:tracking-wider whitespace-pre-wrap break-words prose-img:rounded-2xl prose-img:w-full prose-img:max-w-3xl prose-table:block prose-table:overflow-x-auto">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
}
