import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useLanguage } from '../components/LanguageProvider';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CMSPage {
  id: string;
  title: string;
  title_be?: string;
  content: string;
  content_be?: string;
  updated_at: string;
}

export default function Page() {
  const { id } = useParams();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/pages/${id}`);
        if (res.ok) {
          const data: CMSPage = await res.json();
          setPage(data);
        } else {
          setPage(null);
        }
      } catch (error) {
        console.error('Failed to fetch CMS page', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
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
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24"
    >
      <Helmet>
        <title>{title} — Archetype</title>
      </Helmet>

      <div className="mb-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {language === 'be' ? 'На галоўную' : 'На главную'}
        </Link>

        <h1 className="text-3xl sm:text-5xl font-serif text-brand-light uppercase tracking-widest leading-tight">
          {title}
        </h1>
        
        <div className="flex items-center gap-4 mt-6 text-xs text-brand-muted uppercase tracking-widest">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3 h-3" />
            {language === 'be' ? 'Абноўлена' : 'Обновлено'}: {new Date(page.updated_at).toLocaleDateString(language === 'be' ? 'be-BY' : 'ru-RU')}
          </div>
        </div>
      </div>

      <div className="prose prose-invert max-w-none prose-brand prose-p:text-brand-muted prose-p:leading-relaxed prose-p:text-lg prose-headings:font-serif prose-headings:uppercase prose-headings:tracking-wider">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </motion.div>
  );
}
