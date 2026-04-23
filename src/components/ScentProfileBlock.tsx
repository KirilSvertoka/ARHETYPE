import React from 'react';
import { Product } from '../types';
import { useLanguage } from './LanguageProvider';
import { motion } from 'motion/react';
import { IconMap } from '../utils/icons';

interface ScentProfileBlockProps {
  product: Product;
}

const renderIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconCmp = IconMap[iconName];
  if (!IconCmp) return null;
  return <IconCmp className="w-3.5 h-3.5 inline-block mr-1.5 opacity-70" />;
};

export default function ScentProfileBlock({ product }: ScentProfileBlockProps) {
  const { language } = useLanguage();
  
  const getNoteName = (note: { name: string; name_be?: string }) => 
    language === 'be' && note.name_be ? note.name_be : note.name;

  const getAccordName = (accord: { name: string; name_be?: string }) => 
    language === 'be' && accord.name_be ? accord.name_be : accord.name;

  const hasAccords = product.accords && product.accords.length > 0;
  const showBlock = hasAccords || product.topNotes.length > 0 || product.heartNotes.length > 0 || product.baseNotes.length > 0;

  if (!showBlock) return null;

  const sortedAccords = [...(product.accords || [])].sort((a, b) => b.value - a.value);

  return (
    <div className="mt-16 bg-transparent rounded-[32px] border border-brand-border overflow-hidden flex flex-col">
      <div className="p-8 border-b border-brand-border text-center bg-brand-hover">
        <h2 className="text-2xl font-serif text-brand-light">
          {language === 'be' ? 'Профіль водару' : 'Профиль аромата'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-brand-border">
        
        {/* Left Column: Accords and Performance */}
        <div className="col-span-12 lg:col-span-5 flex flex-col divide-y divide-brand-border">
          {hasAccords && (
            <div className="p-6 md:p-8 flex-1 bg-transparent">
              <h3 className="text-xs uppercase tracking-widest text-brand-muted mb-6 font-medium">
                {language === 'be' ? 'Асноўныя акорды' : 'Основные аккорды'}
              </h3>
              <div className="space-y-1.5">
                {sortedAccords.map((accord, idx) => (
                  <div 
                    key={idx} 
                    className="relative flex items-center h-10 rounded-e-xl rounded-s-sm px-4 group cursor-pointer"
                    style={{ 
                      width: `${accord.value}%`, 
                      backgroundColor: accord.color || '#ff6b35',
                      minWidth: 'fit-content'
                    }}
                    title={`${getAccordName(accord)} - ${accord.value}%`}
                  >
                    <div 
                      className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30" 
                      style={{ backgroundColor: 'white' }} 
                    />
                    <span className="relative z-10 text-white font-medium text-sm drop-shadow-md whitespace-nowrap px-2">
                      {getAccordName(accord)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 divide-x divide-brand-border bg-transparent">
            <div 
              className="p-6 md:p-8 flex flex-col justify-center group cursor-pointer hover:bg-brand-hover transition-colors"
              title={`${language === 'be' ? 'Працягласць гучання на скуры' : 'Продолжительность звучания на коже'}`}
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                {language === 'be' ? 'Стойкасць' : 'Стойкость'}
              </p>
              <div className="flex flex-col gap-3">
                <span className="text-3xl font-serif text-brand-light">{product.longevity || 70}%</span>
                <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${product.longevity || 70}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full bg-brand-accent rounded-full"
                  />
                </div>
              </div>
            </div>
            <div 
              className="p-6 md:p-8 flex flex-col justify-center group cursor-pointer hover:bg-brand-hover transition-colors"
              title={`${language === 'be' ? 'Інтэнсіўнасць водару ў паветры' : 'Интенсивность аромата в воздухе'}`}
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-muted mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                {language === 'be' ? 'Шлейф' : 'Шлейф'}
              </p>
              <div className="flex flex-col gap-3">
                <span className="text-3xl font-serif text-brand-light">{product.sillage || 60}%</span>
                <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${product.sillage || 60}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full bg-brand-accent rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Pyramid */}
        <div className="col-span-12 lg:col-span-7 flex flex-col bg-transparent">
          <div className="p-6 md:p-8">
            <h3 className="text-xs uppercase tracking-widest text-brand-muted mb-6 font-medium">
              {language === 'be' ? 'Піраміда водару' : 'Пирамида аромата'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-brand-border rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-brand-border bg-transparent">
              
              {/* Top Notes */}
              <div className="p-5 hover:bg-brand-hover transition-colors">
                <div className="text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-medium flex justify-between">
                  <span>{language === 'be' ? 'Верхнія ноты' : 'Верхние ноты'}</span>
                </div>
                <div className="space-y-4">
                  {[...product.topNotes].sort((a,b) => b.value - a.value).map((note, idx) => (
                    <div 
                      key={idx} 
                      className="group cursor-pointer"
                      title={`${language === 'be' ? 'Раскрываецца адразу пасля нанясення' : 'Раскрывается сразу после нанесения'}`}
                    >
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-brand-light group-hover:text-brand-accent transition-colors flex items-center">
                          {renderIcon(note.icon)}
                          {getNoteName(note)}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${note.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.1 + (idx * 0.1), ease: "circOut" }}
                          className="h-full bg-brand-accent rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                  {product.topNotes.length === 0 && <span className="text-sm text-brand-muted italic">-</span>}
                </div>
              </div>
              
              {/* Heart Notes */}
              <div className="p-5 hover:bg-brand-hover transition-colors">
                <div className="text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-medium flex justify-between">
                  <span>{language === 'be' ? 'Сярэднія ноты' : 'Средние ноты'}</span>
                </div>
                <div className="space-y-4">
                  {[...product.heartNotes].sort((a,b) => b.value - a.value).map((note, idx) => (
                    <div 
                      key={idx} 
                      className="group cursor-pointer"
                      title={`${language === 'be' ? 'Сэрца водару, гучыць некалькі гадзін' : 'Сердце аромата, звучит несколько часов'}`}
                    >
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-brand-light group-hover:text-brand-accent transition-colors flex items-center">
                          {renderIcon(note.icon)}
                          {getNoteName(note)}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${note.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 + (idx * 0.1), ease: "circOut" }}
                          className="h-full bg-brand-accent rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                  {product.heartNotes.length === 0 && <span className="text-sm text-brand-muted italic">-</span>}
                </div>
              </div>
              
              {/* Base Notes */}
              <div className="p-5 hover:bg-brand-hover transition-colors">
                <div className="text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-medium flex justify-between">
                  <span>{language === 'be' ? 'Базавыя ноты' : 'Базовые ноты'}</span>
                </div>
                <div className="space-y-4">
                  {[...product.baseNotes].sort((a,b) => b.value - a.value).map((note, idx) => (
                    <div 
                      key={idx} 
                      className="group cursor-pointer"
                      title={`${language === 'be' ? 'Шлейф, застаецца на скуры даўжэй за ўсё' : 'Шлейф, остается на коже дольше всего'}`}
                    >
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-brand-light group-hover:text-brand-accent transition-colors flex items-center">
                          {renderIcon(note.icon)}
                          {getNoteName(note)}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${note.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "circOut" }}
                          className="h-full bg-brand-accent rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                  {product.baseNotes.length === 0 && <span className="text-sm text-brand-muted italic">-</span>}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
