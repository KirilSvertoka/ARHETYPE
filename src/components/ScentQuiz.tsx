import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, X, ShoppingBag, Check, CheckCircle2, ChevronDown } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Product, getVariantType } from '../types';

interface ScentQuizProps {
  onOrderBoxClick?: () => void;
}

/* ---------- Matching profiles ---------- */

const FAMILY_PROFILES: Record<string, { families: string[]; notes: string[]; label: { ru: string; be: string } }> = {
  citrus_fresh: {
    families: ['CITRUS', 'FRESH', 'AQUATIC', 'GREEN', 'AROMATIC', 'WATER', 'MARINE'],
    notes: ['цитр', 'бергамот', 'лимон', 'грейп', 'апельсин', 'лайм', 'мята', 'аква', 'водн', 'морск', 'чай', 'шалфей', 'свеж', 'citrus', 'bergamot', 'mint', 'aquatic', 'marine'],
    label: { ru: 'свежий цитрусовый характер', be: 'свежы цытрусавы характар' }
  },
  sweet_gourmand: {
    families: ['GOURMAND', 'SWEET', 'ORIENTAL', 'VANILLA', 'AMBERY'],
    notes: ['ванил', 'карамел', 'шоколад', 'мёд', 'мед', 'кокос', 'вишн', 'малина', 'слив', 'тонка', 'миндал', 'прянич', 'сахар', 'гурман', 'сладк', 'vanilla', 'caramel', 'sweet', 'gourmand', 'praline'],
    label: { ru: 'гурманский сладкий профиль', be: 'гурманскі салодкі профіль' }
  },
  woody_spicy: {
    families: ['WOODY', 'SPICY', 'LEATHER', 'OUD', 'WARM SPICY', 'SMOKY'],
    notes: ['древес', 'дерев', 'прян', 'кожан', 'кожа', 'уд ', 'табак', 'тытунь', 'перец', 'кардамон', 'кедр', 'сандал', 'пачули', 'ветивер', 'ладан', 'woody', 'spicy', 'leather', 'oud'],
    label: { ru: 'древесно-пряной профиль', be: 'драўняна-рэзкі профіль' }
  },
  floral_powdery: {
    families: ['FLORAL', 'POWDERY', 'MUSK', 'WHITE FLORAL', 'SOFT FLORAL'],
    notes: ['цветоч', 'цвет', 'пудр', 'роза', 'ружа', 'жасмин', 'ясмін', 'пион', 'мускус', 'муску', 'тубероз', 'фиалк', 'ірск', 'ирис', 'лаванд', 'floral', 'powdery', 'rose', 'jasmine', 'musk', 'iris'],
    label: { ru: 'цветочно-пудровый профиль', be: 'кветкава-пудравы профіль' }
  }
};

const OCCASION_KEYWORDS: Record<string, string[]> = {
  everyday: ['офис', 'ежедневн', 'каждый день', 'универсальн', 'чист', 'легк', 'нежн', 'мускус', 'чай', 'daily', 'everyday', 'office', 'clean', 'light', 'soft'],
  date: ['свидан', 'спаткан', 'вечер', 'вечар', 'чувствен', 'пачуцц', 'романт', 'ноч', 'амброксан', 'date', 'evening', 'sensual', 'romantic', 'night'],
  fresh: ['свеж', 'спорт', 'водн', 'морск', 'акват', 'аква', 'прохлад', 'цитрус', 'лайм', 'лимон', 'бергамот', 'мята', 'грейп', 'fresh', 'aquatic', 'marine', 'citrus', 'mint', 'sport'],
  status: ['статус', 'роскош', 'престиж', 'шлейф', 'глубок', 'глыбок', 'дерев', 'уд ', 'кожа', 'амбр', 'сандал', 'пачули', 'luxury', 'status', 'rich', 'oud', 'leather', 'woody', 'amber']
};

const IDEAL_SILLAGE: Record<string, number> = { subtle: 40, moderate: 65, bold: 85 };

function isSetProduct(p: Product): boolean {
  return (p.setItems && p.setItems.length > 0) ||
    (p.tags || []).some(t => t.toLowerCase() === 'set' || t.toLowerCase() === 'набор') ||
    p.name.toLowerCase().includes('набор') ||
    p.name.toLowerCase().includes('сет') ||
    p.name.toLowerCase().includes('set');
}

/** Plain-text haystack of a product's olfactory data (plus its set children). */
function productHaystack(p: Product, all: Product[]): string {
  const parts: (string | undefined)[] = [
    p.name, p.brand, p.description, p.description_be,
    ...(p.scentFamilies || []), ...(p.scentFamilies_be || []),
    ...(p.accords || []).map(a => a.name),
    ...(p.topNotes || []).map(n => n.name),
    ...(p.heartNotes || []).map(n => n.name),
    ...(p.baseNotes || []).map(n => n.name),
    ...(p.tags || []), ...(p.tags_be || [])
  ];
  if (isSetProduct(p) && p.setItems) {
    for (const item of p.setItems) {
      const sub = all.find(x => x.id === item.id ||
        (x.name.toLowerCase() === item.name.toLowerCase() && x.brand.toLowerCase() === item.brand.toLowerCase()));
      if (sub) parts.push(sub.name, sub.brand, sub.description, sub.description_be,
        ...(sub.scentFamilies || []), ...(sub.accords || []).map(a => a.name),
        ...(sub.topNotes || []).map(n => n.name),
        ...(sub.heartNotes || []).map(n => n.name),
        ...(sub.baseNotes || []).map(n => n.name));
    }
  }
  return parts.map(t => (t || '').toString().toLowerCase()).join(' ');
}

/** Restrained, factual explanation instead of marketing clichés. */
function buildExplanation(p: Product, family: string, occasion: string, lang: 'ru' | 'be'): string {
  const isBe = lang === 'be';
  const notes = (list: typeof p.topNotes, n: number) =>
    (list || []).slice(0, n).map(x => (isBe && x.name_be ? x.name_be : x.name).toLowerCase()).filter(Boolean);
  const top = notes(p.topNotes, 2);
  const base = notes(p.baseNotes, 2);
  const accords = (p.accords || []).slice(0, 2).map(a => (isBe && a.name_be ? a.name_be : a.name).toLowerCase());

  const sentences: string[] = [];
  const profile = FAMILY_PROFILES[family]?.label[isBe ? 'be' : 'ru'];
  if (accords.length) {
    sentences.push(isBe ? `${p.brand} — ${accords.join(' + ')}; профіль: ${profile}.` : `${p.brand} — ${accords.join(' + ')}; профиль: ${profile}.`);
  } else {
    sentences.push(isBe ? `${p.brand}; профіль: ${profile}.` : `${p.brand}; профиль: ${profile}.`);
  }
  if (top.length) {
    sentences.push(isBe ? `У пачатку — ${top.join(', ')}.` : `В старте — ${top.join(', ')}.`);
  }
  if (base.length) {
    sentences.push(isBe ? `База трымаецца на ${base.join(', ')}.` : `База держится на ${base.join(', ')}.`);
  }
  const occasionPhrases: Record<string, { ru: string; be: string }> = {
    everyday: { ru: 'Достаточно сдержан для офиса.', be: 'Дастаткова стрыманы для офісу.' },
    date: { ru: 'Достаточно тёплый для вечера.', be: 'Дастаткова цёплы для вечара.' },
    fresh: { ru: 'Хорошо работает днём и в жару.', be: 'Добра працуе днём і ў спёку.' },
    status: { ru: 'Достаточно плотный для особого случая.', be: 'Дастаткова шчыльны для асаблівага выпадку.' }
  };
  sentences.push(occasionPhrases[occasion]?.[isBe ? 'be' : 'ru'] ?? '');
  return sentences.filter(Boolean).join(' ');
}

/* ---------- Component ---------- */

export default function ScentQuiz({ onOrderBoxClick }: ScentQuizProps) {
  const { language, t } = useLanguage();
  const { addToCart, setIsCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingResults, setLoadingResults] = useState(false);

  const [gender, setGender] = useState('');
  const [occasion, setOccasion] = useState('');
  const [family, setFamily] = useState('');
  const [intensity, setIntensity] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<{ product: Product; match: number; explanation: string; explanationBe: string }[]>([]);
  const [successAdded, setSuccessAdded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && allProducts.length === 0) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => setAllProducts(data))
        .catch(err => console.error('Error fetching products for quiz', err));
    }
  }, [isOpen, allProducts]);

  const resetQuiz = () => {
    setCurrentStep(0);
    setGender('');
    setOccasion('');
    setFamily('');
    setIntensity('');
    setResults([]);
    setSuccessAdded({});
    setSelectedVariants({});
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
    else calculateRecommendations();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const calculateRecommendations = () => {
    setLoadingResults(true);
    setCurrentStep(4);

    setTimeout(() => {
      if (allProducts.length === 0) {
        setLoadingResults(false);
        return;
      }

      const profile = FAMILY_PROFILES[family];

      const scored = allProducts.map(product => {
        const hay = productHaystack(product, allProducts);
        const famUpper = (product.scentFamilies || []).map(f => f.toUpperCase());

        /* 1. Gender — max 35 */
        let genderScore: number;
        if (gender === 'unisex') {
          genderScore = product.gender === 'Unisex' ? 35 : 15;
        } else if (product.gender === (gender === 'female' ? 'Female' : 'Male')) {
          genderScore = 35;
        } else if (product.gender === 'Unisex') {
          genderScore = 31;
        } else {
          genderScore = -25;
        }

        /* 2. Family — max 40, graded by direct families + share of notes hit */
        let familyScore = 0;
        const directFamily = profile.families.some(f => famUpper.includes(f));
        const noteHits = profile.notes.filter(kw => hay.includes(kw)).length;
        const noteShare = Math.min(1, noteHits / 4);
        if (directFamily) familyScore = 26 + Math.round(noteShare * 14);     // 26–40
        else if (noteHits > 0) familyScore = 10 + Math.round(noteShare * 16); // 10–26 partial
        const familyMissed = familyScore === 0;

        /* 3. Occasion — max 25, graded by keyword coverage */
        const occKeywords = OCCASION_KEYWORDS[occasion] || [];
        const occHits = occKeywords.filter(kw => hay.includes(kw)).length;
        let occasionScore = occHits >= 3 ? 25 : occHits === 2 ? 18 : occHits === 1 ? 11 : 4;
        if (occasion === 'date' && occHits === 0) {
          occasionScore = product.concentration === 'Parfum' || product.concentration === 'EDP' ? 11 : 4;
        }
        if (occasion === 'status' && occHits === 0) {
          const price = typeof product.price === 'number' ? product.price : parseFloat(product.price as string) || 0;
          occasionScore = price > 300 ? 13 : 4;
        }

        /* 4. Intensity — max 15, distance to the ideal sillage */
        const sillage = product.sillage || 60;
        const longevity = product.longevity || 70;
        const ideal = IDEAL_SILLAGE[intensity] ?? 65;
        const diff = Math.abs(sillage - ideal);
        let intensityScore = diff <= 10 ? 15 : diff <= 25 ? 10 : 4;
        if (intensity === 'bold' && (product.concentration === 'Parfum' || longevity > 80) && intensityScore < 15) intensityScore = 15;
        if (intensity === 'subtle' && longevity < 55 && intensityScore < 15) intensityScore = 15;

        let raw = genderScore + familyScore + occasionScore + intensityScore;
        if (familyMissed) raw -= 20; // wrong olfactory family is a real mismatch

        const normalized = Math.max(0, Math.min(1, raw / 115));
        const matchPercent = Math.max(40, Math.min(98, Math.round(38 + normalized * 60)));

        return { product, match: matchPercent, accordsWeight: (product.accords || []).reduce((s, a) => s + (a.value || 0), 0) };
      });

      const sortedResults = scored
        .sort((a, b) => b.match - a.match || b.accordsWeight - a.accordsWeight)
        .slice(0, 3)
        .map(({ product, match }) => ({
          product,
          match,
          explanation: buildExplanation(product, family, occasion, 'ru'),
          explanationBe: buildExplanation(product, family, occasion, 'be')
        }));

      const initialSelected: Record<number, number> = {};
      sortedResults.forEach(({ product }) => {
        if (product.variants && product.variants.length > 0 && product.variants[0].id) {
          initialSelected[product.id] = product.variants[0].id;
        }
      });
      setSelectedVariants(initialSelected);
      setResults(sortedResults);
      setLoadingResults(false);
    }, 900);
  };

  const handleAddScentToCart = (prod: Product) => {
    const selectedVarId = selectedVariants[prod.id] || (prod.variants && prod.variants.length > 0 ? prod.variants[0].id : undefined);
    addToCart(prod, selectedVarId);
    setSuccessAdded(prev => ({ ...prev, [prod.id]: true }));
    setTimeout(() => setSuccessAdded(prev => ({ ...prev, [prod.id]: false })), 2000);
  };

  const stepTitles = [
    { ru: 'Для кого аромат', be: 'Для каго водар' },
    { ru: 'Повод', be: 'Нагода' },
    { ru: 'Аккорды', be: 'Акорды' },
    { ru: 'Интенсивность', be: 'Інтэнсіўнасць' },
    { ru: 'Результат', be: 'Вынік' }
  ];

  const genderOptions = [
    { id: 'female', title: 'Для неё', titleBe: 'Для яе', desc: 'Женские композиции', descBe: 'Жаноцкія кампазіцыі' },
    { id: 'male', title: 'Для него', titleBe: 'Для яго', desc: 'Мужские композиции', descBe: 'Мужчынскія кампазіцыі' },
    { id: 'unisex', title: 'Унисекс', titleBe: 'Унісекс', desc: 'Без стереотипов', descBe: 'Без стэрэатыпаў' }
  ];

  const occasionOptions = [
    { id: 'everyday', title: 'Каждый день', titleBe: 'Кожны дзень', desc: 'Офис, учёба, рутина', descBe: 'Офіс, учёба, руціна' },
    { id: 'date', title: 'Вечер, свидание', titleBe: 'Вечар, спатканне', desc: 'Тёплые, чувственные', descBe: 'Цёплыя, пачуццёвыя' },
    { id: 'fresh', title: 'День, спорт', titleBe: 'Дзень, спорт', desc: 'Свежие, лёгкие', descBe: 'Свежыя, лёгкія' },
    { id: 'status', title: 'Особый случай', titleBe: 'Асаблівы выпадак', desc: 'Глубокие, плотные', descBe: 'Глыбокія, шчыльныя' }
  ];

  const familyOptions = [
    { id: 'citrus_fresh', title: 'Свежие и цитрусовые', titleBe: 'Свежыя і цытрусавыя', desc: 'Бергамот, мята, аква', descBe: 'Бергамот, мята, аква' },
    { id: 'sweet_gourmand', title: 'Сладкие и гурманские', titleBe: 'Салодкія і гурманскія', desc: 'Ваниль, карамель, тонка', descBe: 'Ваніль, карамель, тонка' },
    { id: 'woody_spicy', title: 'Древесные и пряные', titleBe: 'Драўняныя і рэзкія', desc: 'Сандал, уд, табак, специи', descBe: 'Сандал, уд, тытунь, спецыі' },
    { id: 'floral_powdery', title: 'Цветочные и пудровые', titleBe: 'Кветкавыя і пудравыя', desc: 'Роза, жасмин, мускус', descBe: 'Ружа, ясмін, мускус' }
  ];

  const intensityOptions = [
    { id: 'subtle', title: 'Деликатный', titleBe: 'Дэлікатны', desc: 'Близко к коже', descBe: 'Блізка да скуры', level: 1 },
    { id: 'moderate', title: 'Элегантный', titleBe: 'Элегантны', desc: 'Заметный шлейф', descBe: 'Заўважны шлейф', level: 2 },
    { id: 'bold', title: 'Выразительный', titleBe: 'Выразны', desc: 'Максимум стойкости', descBe: 'Максімум стойкасці', level: 3 }
  ];

  /** Editorial option row: index — title — descriptor — marker. */
  const OptionRow = ({ index, title, desc, selected, onClick }: {
    index: number; title: string; desc: string; selected: boolean; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-5 md:gap-7 py-5 md:py-6 border-b border-brand-border/60 cursor-pointer group transition-colors duration-200 ${
        selected ? 'text-brand-light' : 'text-brand-muted hover:text-brand-light'
      }`}
    >
      <span className={`font-mono text-[10px] tracking-widest shrink-0 w-6 ${selected ? 'text-brand-accent' : 'text-brand-muted/60'}`}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block font-serif text-base md:text-lg uppercase tracking-[0.08em] leading-snug ${selected ? 'text-brand-light' : ''}`}>
          {title}
        </span>
        <span className="block text-[11px] font-sans font-light text-brand-muted mt-1">{desc}</span>
      </span>
      <span
        className={`shrink-0 w-4 h-4 rounded-full border transition-colors duration-200 ${
          selected ? 'border-brand-accent bg-brand-accent' : 'border-brand-border group-hover:border-brand-accent/60'
        }`}
      />
    </button>
  );

  return (
    <>
      {/* Landing section — quiet, typographic, no decorative noise */}
      <section className="relative w-full py-28 md:py-40 overflow-hidden bg-brand-bg border-b border-brand-border/40 select-none">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-10">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brand-accent">
                {language === 'be' ? 'Падбор' : 'Подбор'}
              </span>
              <span className="h-px flex-1 bg-brand-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-brand-muted/60">04</span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extralight text-brand-light uppercase tracking-[0.04em] leading-[1.1] max-w-2xl">
              {language === 'be' ? 'Тры водары пад вас' : 'Три аромата под вас'}
            </h2>

            <p className="mt-6 max-w-xl text-sm text-brand-muted font-sans font-light leading-relaxed">
              {language === 'be'
                ? 'Чатыры пытанні — і канкрэтныя рэкамендацыі з наяўнай калекцыі. Толькі супастаўленне нотаў, сямей і інтэнсіўнасці, без агульных слоў.'
                : 'Четыре вопроса — и конкретные рекомендации из наличной коллекции. Только сопоставление нот, семейств и интенсивности, без общих слов.'}
            </p>

            <button
              id="start-scent-quiz-btn"
              onClick={() => { setIsOpen(true); resetQuiz(); }}
              className="group mt-10 inline-flex items-center gap-4 px-8 py-4 border border-brand-light/30 hover:border-brand-accent text-brand-light hover:text-brand-accent text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors duration-300 cursor-pointer bg-transparent"
            >
              <span>{language === 'be' ? 'Прайсці падбор' : 'Пройти подбор'}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Quiz dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-bg md:bg-black/80">
            <div className="fixed inset-0 hidden md:block" onClick={() => setIsOpen(false)} />

            <motion.div
              id="scent-quiz-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-brand-bg w-full h-[100dvh] md:h-auto md:max-h-[86vh] md:max-w-2xl md:border md:border-brand-border flex flex-col relative z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 md:px-10 pt-7 pb-5 border-b border-brand-border flex justify-between items-start gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted mb-2">
                    {currentStep < 4
                      ? `${String(currentStep + 1).padStart(2, '0')} / 04 — ${language === 'be' ? stepTitles[currentStep].be : stepTitles[currentStep].ru}`
                      : (language === 'be' ? 'Вынік' : 'Результат')}
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-light text-brand-light uppercase tracking-[0.06em] leading-tight">
                    {currentStep < 4
                      ? (language === 'be' ? stepTitles[currentStep].be : stepTitles[currentStep].ru)
                      : (language === 'be' ? 'Вашы ідэальныя водары' : 'Ваши идеальные ароматы')}
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -m-2 text-brand-muted hover:text-brand-light transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps body */}
              <div className="overflow-y-auto flex-1 custom-scrollbar px-6 md:px-10 py-6 md:py-8">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {genderOptions.map((opt, i) => (
                        <OptionRow
                          key={opt.id}
                          index={i}
                          title={language === 'be' ? opt.titleBe : opt.title}
                          desc={language === 'be' ? opt.descBe : opt.desc}
                          selected={gender === opt.id}
                          onClick={() => { setGender(opt.id); setTimeout(handleNext, 200); }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {occasionOptions.map((opt, i) => (
                        <OptionRow
                          key={opt.id}
                          index={i}
                          title={language === 'be' ? opt.titleBe : opt.title}
                          desc={language === 'be' ? opt.descBe : opt.desc}
                          selected={occasion === opt.id}
                          onClick={() => { setOccasion(opt.id); setTimeout(handleNext, 200); }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {familyOptions.map((opt, i) => (
                        <OptionRow
                          key={opt.id}
                          index={i}
                          title={language === 'be' ? opt.titleBe : opt.title}
                          desc={language === 'be' ? opt.descBe : opt.desc}
                          selected={family === opt.id}
                          onClick={() => { setFamily(opt.id); setTimeout(handleNext, 200); }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {intensityOptions.map((opt, i) => (
                        <button
                          key={opt.id}
                          onClick={() => { setIntensity(opt.id); setTimeout(handleNext, 200); }}
                          className={`w-full text-left flex items-center gap-5 md:gap-7 py-5 md:py-6 border-b border-brand-border/60 cursor-pointer group transition-colors duration-200 ${
                            intensity === opt.id ? 'text-brand-light' : 'text-brand-muted hover:text-brand-light'
                          }`}
                        >
                          <span className={`font-mono text-[10px] tracking-widest shrink-0 w-6 ${intensity === opt.id ? 'text-brand-accent' : 'text-brand-muted/60'}`}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-serif text-base md:text-lg uppercase tracking-[0.08em] leading-snug">
                              {language === 'be' ? opt.titleBe : opt.title}
                            </span>
                            <span className="block text-[11px] font-sans font-light text-brand-muted mt-1">
                              {language === 'be' ? opt.descBe : opt.desc}
                            </span>
                          </span>
                          <span className="shrink-0 flex items-end gap-1">
                            {[1, 2, 3].map(n => (
                              <span
                                key={n}
                                className={`w-[3px] transition-colors duration-200 ${
                                  n <= opt.level ? (intensity === opt.id ? 'bg-brand-accent' : 'bg-brand-muted/50') : 'bg-brand-border'
                                }`}
                                style={{ height: `${6 + n * 4}px` }}
                              />
                            ))}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                      {loadingResults ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-5">
                          <div className="w-8 h-8 border border-brand-border border-t-brand-accent animate-spin" />
                          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                            {language === 'be' ? 'Супастаўляем ноты' : 'Сопоставляем ноты'}
                          </p>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="text-center py-16 space-y-4">
                          <p className="text-sm text-brand-muted font-light">
                            {language === 'be' ? 'Па вашым запыце нічога не знойдзена.' : 'По вашему запросу ничего не найдено.'}
                          </p>
                          <button onClick={resetQuiz} className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand-accent cursor-pointer">
                            {language === 'be' ? 'Пачаць наноў' : 'Начать заново'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          {results.map(({ product, match, explanation, explanationBe }, idx) => (
                            <div key={product.id} className={`py-6 flex flex-col gap-5 ${idx > 0 ? 'border-t border-brand-border/60' : ''}`}>
                              <div className="flex gap-5">
                                <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 overflow-hidden border border-brand-border/60">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand-muted">
                                      {product.brand}
                                    </span>
                                    <span className="font-mono text-[11px] text-brand-accent shrink-0">
                                      {match}%
                                    </span>
                                  </div>
                                  <div className="mt-1.5 h-px bg-brand-border/60 relative">
                                    <div className="absolute left-0 top-0 h-px bg-brand-accent" style={{ width: `${match}%` }} />
                                  </div>
                                  <h4 className="mt-2 font-serif text-lg text-brand-light leading-snug">
                                    {product.name}
                                  </h4>
                                  <div className="mt-1.5 flex flex-wrap gap-2">
                                    {isSetProduct(product) && (
                                      <span className="text-[9px] font-mono uppercase tracking-wider text-brand-muted border border-brand-border px-1.5 py-0.5">
                                        {language === 'be' ? 'Набор' : 'Сет'}
                                      </span>
                                    )}
                                    {gender !== 'unisex' && product.gender === 'Unisex' && (
                                      <span className="text-[9px] font-mono uppercase tracking-wider text-brand-muted border border-brand-border px-1.5 py-0.5">
                                        Unisex
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-brand-muted font-sans font-light leading-relaxed border-l border-brand-accent/40 pl-3">
                                {language === 'be' ? explanationBe : explanation}
                              </p>

                              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                {product.variants && product.variants.length > 0 && (
                                  <div className="relative flex-1 sm:max-w-[220px]">
                                    <select
                                      value={selectedVariants[product.id] || ''}
                                      onChange={(e) => setSelectedVariants(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                                      className="w-full text-xs uppercase tracking-wider pr-8 pl-3 py-2.5 bg-brand-bg border border-brand-border hover:border-brand-accent/60 text-brand-light focus:outline-none focus:border-brand-accent appearance-none cursor-pointer"
                                    >
                                      {product.variants.map((v) => {
                                        const typeStr = getVariantType(v, language);
                                        return (
                                          <option key={v.id} value={v.id} disabled={v.stock === 0}>
                                            {v.size} — {typeStr}{v.stock === 0 ? (language === 'be' ? ' (няма)' : ' (нет)') : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-brand-muted">
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                )}
                                <span className="font-mono text-sm text-brand-light sm:ml-auto whitespace-nowrap">
                                  {(product.variants?.find(v => v.id === selectedVariants[product.id])?.price || product.price)} {t('currency')}
                                </span>
                                <button
                                  id={`quiz-add-to-cart-${product.id}`}
                                  onClick={() => handleAddScentToCart(product)}
                                  disabled={product.variants?.find(v => v.id === selectedVariants[product.id])?.stock === 0}
                                  className="h-10 px-6 border border-brand-light/30 hover:border-brand-accent hover:text-brand-accent text-brand-light text-[10px] uppercase font-semibold tracking-[0.2em] transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer bg-transparent"
                                >
                                  {successAdded[product.id] ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent" />
                                      <span>{language === 'be' ? 'Дададзена' : 'Добавлено'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3.5 h-3.5" />
                                      <span>{language === 'be' ? 'У кошык' : 'В корзину'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer controls */}
              <div className="px-6 md:px-10 py-4 border-t border-brand-border flex justify-between items-center">
                {currentStep < 4 ? (
                  <>
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-brand-muted hover:text-brand-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {language === 'be' ? 'Назад' : 'Назад'}
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={
                        (currentStep === 0 && !gender) ||
                        (currentStep === 1 && !occasion) ||
                        (currentStep === 2 && !family) ||
                        (currentStep === 3 && !intensity)
                      }
                      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-brand-light hover:text-brand-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
                    >
                      {language === 'be' ? 'Далей' : 'Далее'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={resetQuiz}
                      className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand-muted hover:text-brand-light transition-colors cursor-pointer bg-transparent"
                    >
                      {language === 'be' ? 'Нанова' : 'Заново'}
                    </button>
                    <button
                      onClick={() => { setIsOpen(false); setIsCartOpen(true); }}
                      className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand-light hover:text-brand-accent transition-colors cursor-pointer bg-transparent"
                    >
                      {language === 'be' ? 'Да кошыка' : 'В корзину'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
