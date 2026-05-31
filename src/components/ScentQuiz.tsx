import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, Check, CheckCircle2, ShoppingBag, X, Compass, Gift, Briefcase, Flame, Droplets, Crown, ChevronDown } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Product, getVariantType } from '../types';

interface ScentQuizProps {
  onOrderBoxClick?: () => void;
}

export default function ScentQuiz({ onOrderBoxClick }: ScentQuizProps) {
  const { language, t } = useLanguage();
  const { addToCart, setIsCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingResults, setLoadingResults] = useState(false);
  
  // Quiz Selections
  const [gender, setGender] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [family, setFamily] = useState<string>('');
  const [intensity, setIntensity] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  
  // Matched products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<{ product: Product; match: number; explanation: string; explanationBe: string }[]>([]);
  const [successAdded, setSuccessAdded] = useState<Record<number, boolean>>({});

  // Fetch products on mount if needed
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
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Helper to generate bespoke copywriting explanations for matched products
  const generateBespokeExplanation = (
    product: Product, 
    selectedFamily: string, 
    selectedOccasion: string, 
    lang: 'ru' | 'be',
    idx: number
  ): string => {
    const isBe = lang === 'be';
    
    // Extract notes
    const topNotes = (product.topNotes || []).slice(0, 2).map(n => isBe && n.name_be ? n.name_be.toLowerCase() : n.name.toLowerCase());
    const heartNotes = (product.heartNotes || []).slice(0, 2).map(n => isBe && n.name_be ? n.name_be.toLowerCase() : n.name.toLowerCase());
    const baseNotes = (product.baseNotes || []).slice(0, 2).map(n => isBe && n.name_be ? n.name_be.toLowerCase() : n.name.toLowerCase());
    const accords = (product.accords || []).slice(0, 2).map(a => isBe && a.name_be ? a.name_be.toLowerCase() : a.name.toLowerCase());

    const brand = product.brand;
    const name = product.name;

    // Use (product.id + idx) as a seed to ensure high variety
    const patternId = (product.id + idx) % 4;

    const notesJoined = topNotes.concat(heartNotes).concat(baseNotes).slice(0, 3);
    const notesStr = notesJoined.length > 0 ? notesJoined.join(', ') : '';

    if (isBe) {
      let context = 'вельмі вытанчаны спадарожнік';
      if (selectedOccasion === 'everyday') context = 'ідэальна падыходзіць на кожны дзень і для працы';
      else if (selectedOccasion === 'date') context = 'зачаруе і створыць рамантычную атмасферу вечарам';
      else if (selectedOccasion === 'fresh') context = 'падорыць доўгачаканую свежасць і прыліў бадзёрасці';
      else if (selectedOccasion === 'status') context = 'падкрэсліць вытанчаны стыль і асаблівы статус';

      let famStr = 'воды';
      if (selectedFamily === 'citrus_fresh') famStr = 'віхрам цытрусавай прахалоды';
      else if (selectedFamily === 'sweet_gourmand') famStr = 'млявым гурманскім шлейфам';
      else if (selectedFamily === 'woody_spicy') famStr = 'шляхетнымі драўняна-рэзкімі акордамі';
      else if (selectedFamily === 'floral_powdery') famStr = 'далікатнымі пудрава-кветкавымі нотамі';

      if (patternId === 0) {
        return `Гэты шэдэўр ад ${brand} з нотамі ${notesStr} ${context}.`;
      } else if (patternId === 1) {
        return `Выразны ${name} раскрываецца ${famStr}, што ${context}.`;
      } else if (patternId === 2) {
        const accordPart = accords.length > 0 ? ` з асноўнымі акцэнтамі ${accords.join(' і ')}` : '';
        return `Цудоўны выбар ад ${brand}${accordPart}. Водар ${context}.`;
      } else {
        return `Кампазіцыя раскрываецца гучаннем ${notesStr} і ${context}.`;
      }
    } else {
      let context = 'великолепно подчеркнет ваш образ';
      if (selectedOccasion === 'everyday') context = 'создаст безупречный и деликатный офисный стиль на каждый день';
      else if (selectedOccasion === 'date') context = 'окружит вас притягательной, теплой атмосферой вечернего свидания';
      else if (selectedOccasion === 'fresh') context = 'подарит ощущение живительной прохлады, чистоты и легкости';
      else if (selectedOccasion === 'status') context = 'выгодно выделит ваш безупречный вкус и высокий статус';

      let famStr = 'утонченного парфюма';
      if (selectedFamily === 'citrus_fresh') famStr = 'свежим вихрем сочных цитрусов';
      else if (selectedFamily === 'sweet_gourmand') famStr = 'аппетитным ванильно-гурманским шлейфом';
      else if (selectedFamily === 'woody_spicy') famStr = 'благородными древесно-пряными полутонами';
      else if (selectedFamily === 'floral_powdery') famStr = 'нежным, обволакивающим пудровым облаком';

      if (patternId === 0) {
        return `Аромат от ${brand} с нотами ${notesStr} ${context}.`;
      } else if (patternId === 1) {
        return `Гармоничный ${name} раскрывается ${famStr}, который ${context}.`;
      } else if (patternId === 2) {
        const accordPart = accords.length > 0 ? ` с доминирующими аккордами ${accords.join(' и ')}` : '';
        return `Изысканное творение от ${brand}${accordPart} — ${context}.`;
      } else {
        return `Сочетание нот ${notesStr} подчеркивает фирменный стиль бренда и ${context}.`;
      }
    }
  };

  const calculateRecommendations = () => {
    setLoadingResults(true);
    setCurrentStep(4);
    
    setTimeout(() => {
      if (allProducts.length === 0) {
        setLoadingResults(false);
        return;
      }

      // Mathematical matching algorithms
      const scored = allProducts.map(product => {
        // Construct detailed lowcase product text for searchable match
        const productText = [
          product.name,
          product.brand,
          product.description,
          product.description_be,
          ...(product.scentFamilies || []),
          ...(product.scentFamilies_be || []),
          ...(product.accords || []).map(a => a.name),
          ...(product.topNotes || []).map(n => n.name),
          ...(product.heartNotes || []).map(n => n.name),
          ...(product.baseNotes || []).map(n => n.name),
          ...(product.tags || []),
          ...(product.tags_be || [])
        ].map(t => (t || '').toLowerCase()).join(' ');

        const checkKeywords = (keywords: string[]) => keywords.some(kw => productText.includes(kw));

        // 1. Gender Filter & Match (Max 35 points)
        let genderScore = 0;
        if (gender === 'female') {
          if (product.gender === 'Female') genderScore = 35;
          else if (product.gender === 'Unisex') genderScore = 20;
          else genderScore = -20; // Heavy penalty for opposite gender
        } else if (gender === 'male') {
          if (product.gender === 'Male') genderScore = 35;
          else if (product.gender === 'Unisex') genderScore = 20;
          else genderScore = -20; // Heavy penalty
        } else { // unisex choice
          if (product.gender === 'Unisex') genderScore = 35;
          else genderScore = 15;
        }

        // 2. Olfactory Family Match (Max 40 points)
        let familyScore = 0;
        let hasDirectFamilyMatch = false;

        const famUpper = (product.scentFamilies || []).map(f => f.toUpperCase());
        const tagsUpper = (product.tags || []).map(t => t.toUpperCase());

        if (family === 'citrus_fresh') {
          const directMatch = ['CITRUS', 'FRESH', 'AQUATIC', 'GREEN', 'AROMATIC'].some(f => famUpper.includes(f) || tagsUpper.includes(f));
          if (directMatch) {
            familyScore = 40;
            hasDirectFamilyMatch = true;
          } else if (checkKeywords(['цитр', 'свеж', 'водн', 'морск', 'аква', 'акват', 'зелен', 'чай', 'бергамот', 'лимон', 'грейп', 'мята', 'минерал', 'шалфей', 'citrus', 'fresh', 'aquatic', 'marine'])) {
            familyScore = 30;
            hasDirectFamilyMatch = true;
          } else {
            familyScore = 0; // No match
          }
        } else if (family === 'sweet_gourmand') {
          const directMatch = ['GOURMAND', 'SWEET', 'ORIENTAL', 'VANILLA'].some(f => famUpper.includes(f) || tagsUpper.includes(f));
          if (directMatch) {
            familyScore = 40;
            hasDirectFamilyMatch = true;
          } else if (checkKeywords(['гурман', 'сладк', 'ванил', 'карамел', 'шоколад', 'мёд', 'мед', 'кокос', 'вишн', 'малина', 'слив', 'тонка', 'миндал', 'sugar', 'gourmand', 'sweet', 'vanilla'])) {
            familyScore = 30;
            hasDirectFamilyMatch = true;
          } else {
            familyScore = 0;
          }
        } else if (family === 'woody_spicy') {
          const directMatch = ['WOODY', 'SPICY', 'LEATHER', 'OUD', 'WARM SPICY'].some(f => famUpper.includes(f) || tagsUpper.includes(f));
          if (directMatch) {
            familyScore = 40;
            hasDirectFamilyMatch = true;
          } else if (checkKeywords(['древес', 'прян', 'кожан', 'дерев', 'уд', 'кожа', 'табак', 'перец', 'кардамон', 'кедр', 'сандал', 'пачули', 'ветивер', 'woody', 'spicy', 'leather', 'oud'])) {
            familyScore = 30;
            hasDirectFamilyMatch = true;
          } else {
            familyScore = 0;
          }
        } else if (family === 'floral_powdery') {
          const directMatch = ['FLORAL', 'POWDERY', 'MUSK'].some(f => famUpper.includes(f) || tagsUpper.includes(f));
          if (directMatch) {
            familyScore = 40;
            hasDirectFamilyMatch = true;
          } else if (checkKeywords(['цветоч', 'пудр', 'цвет', 'роза', 'жасмин', 'пион', 'мускус', 'тубероз', 'фиалк', 'ирис', 'лаванд', 'floral', 'powdery', 'rose', 'jasmine', 'musk'])) {
            familyScore = 30;
            hasDirectFamilyMatch = true;
          } else {
            familyScore = 0;
          }
        }

        // 3. Occasion Match (Max 25 points)
        let occasionScore = 0;
        if (occasion === 'everyday') {
          if (checkKeywords(['офис', 'ежедневн', 'каждый день', 'чист', 'легк', 'нежн', 'мускус', 'чай', 'office', 'clean', 'light', 'daily', 'everyday', 'soft'])) {
            occasionScore = 25;
          } else {
            const isLightBrand = ['molecule', 'byredo', 'jo malone'].some(b => productText.includes(b));
            occasionScore = isLightBrand ? 20 : 5;
          }
        } else if (occasion === 'date') {
          if (checkKeywords(['свидан', 'вечер', 'чувствен', 'сладк', 'прян', 'амбр', 'тепл', 'романт', 'ноч', 'ванил', 'вишн', 'страст', 'карамел', 'date', 'evening', 'sensual', 'romantic', 'night', 'vanilla', 'sweet', 'amber'])) {
            occasionScore = 25;
          } else {
            const isRich = product.concentration === 'Parfum' || product.concentration === 'EDP';
            occasionScore = isRich ? 15 : 5;
          }
        } else if (occasion === 'fresh') {
          if (checkKeywords(['свеж', 'спорт', 'водн', 'морск', 'акват', 'прохлад', 'аква', 'минерал', 'цитрус', 'лайм', 'лимон', 'бергамот', 'мята', 'грейп', 'fresh', 'aquatic', 'marine', 'citrus', 'mint'])) {
            occasionScore = 25;
          } else {
            occasionScore = 5;
          }
        } else if (occasion === 'status') {
          if (checkKeywords(['статус', 'роскош', 'особ', 'богат', 'шлейф', 'глубок', 'дерев', 'уд', 'кожа', 'амбр', 'сандал', 'пачули', 'luxury', 'fancy', 'status', 'rich', 'oud', 'leather', 'woody'])) {
            occasionScore = 25;
          } else {
            const isPremium = typeof product.price === 'number' ? product.price > 300 : parseFloat(product.price as string) > 300;
            occasionScore = isPremium ? 18 : 5;
          }
        }

        // 4. Intensity Match (Max 15 points)
        const sillageValue = product.sillage || 60; // 0-100 scale
        const longevityValue = product.longevity || 70; // 0-100 scale
        let intensityScore = 0;
        if (intensity === 'subtle') {
          if (sillageValue < 55) intensityScore = 15;
          else if (sillageValue < 75) intensityScore = 10;
          else intensityScore = 2; // high boundary penalty
        } else if (intensity === 'moderate') {
          if (sillageValue >= 50 && sillageValue <= 78) intensityScore = 15;
          else intensityScore = 10;
        } else if (intensity === 'bold') {
          if (sillageValue > 75 || longevityValue > 75 || product.concentration === 'Parfum') intensityScore = 15;
          else if (sillageValue > 60 || longevityValue > 60) intensityScore = 10;
          else intensityScore = 2; // low sillage penalty
        }

        // Penalty if family doesn't match at all
        let finalMaxScore = genderScore + familyScore + occasionScore + intensityScore;
        if (!hasDirectFamilyMatch) {
          finalMaxScore -= 25; // penalty for wrong family preference
        }

        // Match percentage calculation from 40% to 98%
        const normalizedScore = Math.max(0, Math.min(100, (finalMaxScore / 115) * 100));
        const microAdjustment = (product.price ? (Number(product.id) % 3) * 0.5 : 0);
        let matchPercent = Math.min(99, Math.round(50 + (normalizedScore * 0.49) + microAdjustment));
        if (matchPercent < 40) matchPercent = 40;

        return {
          product,
          match: matchPercent,
          hasDirectFamilyMatch
        };
      });

      // Sort by score desc, take top 3
      const sortedResults = scored
        .sort((a, b) => b.match - a.match)
        .slice(0, 3)
        .map(({ product, match }, idx) => {
          const explanation = generateBespokeExplanation(product, family, occasion, 'ru', idx);
          const explanationBe = generateBespokeExplanation(product, family, occasion, 'be', idx);
          return {
            product,
            match,
            explanation,
            explanationBe
          };
        });

      // Pre-select the first available variant identifier for each product
      const initialSelected: Record<number, number> = {};
      sortedResults.forEach(({ product }) => {
        if (product.variants && product.variants.length > 0 && product.variants[0].id) {
          initialSelected[product.id] = product.variants[0].id;
        }
      });
      setSelectedVariants(initialSelected);

      setResults(sortedResults);
      setLoadingResults(false);
    }, 1200);
  };

  const handleAddScentToCart = (prod: Product) => {
    const selectedVarId = selectedVariants[prod.id] || (prod.variants && prod.variants.length > 0 ? prod.variants[0].id : undefined);
    addToCart(prod, selectedVarId);
    
    setSuccessAdded(prev => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setSuccessAdded(prev => ({ ...prev, [prod.id]: false }));
    }, 2000);
  };

  // Translations dictionary for Quiz ui
  const stepTitles = [
    {
      ru: 'Для кого этот аромат?',
      be: 'Для каго гэты водар?'
    },
    {
      ru: 'Настроение или повод',
      be: 'Настрой ці нагода'
    },
    {
      ru: 'Ваши аккорды-фавориты',
      be: 'Вашы акорды-фаварыты'
    },
    {
      ru: 'Интенсивность и шлейф',
      be: 'Інтэнсіўнасць і шлейф'
    },
    {
      ru: 'Ваши идеальные ароматы',
      be: 'Вашы ідэальныя водары'
    }
  ];

  return (
    <>
      {/* Dynamic Scent Quiz Banner Card */}
      <section className="py-12 bg-gradient-to-b from-brand-bg to-brand-hover/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative border border-brand-accent/20 bg-[#FAF9F6] p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center gap-8 justify-between overflow-hidden shadow-sm">
            
            {/* Subtle background atmospheric blur */}
            <div className="absolute right-0 top-0 w-72 h-72 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            
            <div className="max-w-xl text-center md:text-left space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-[0.3em] text-brand-accent px-2.5 py-1 bg-brand-accent/5">
                <Sparkles className="w-3 h-3" />
                {language === 'be' ? 'ІНТЭРАКТЫЎНЫ ПАДБОР' : 'ИНТЕРАКТИВНЫЙ ПОДБОР'}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-light leading-snug">
                {language === 'be' ? 'Знайдзіце свой парфюмерны Архетып' : 'Найдите свой парфюмерный Архетип'}
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted font-light leading-relaxed">
                {language === 'be' 
                  ? 'Пройдзеце кароткі тэст з 4 пытанняў, і нашы алгарытмы з дакладнасцю вызначаць 3 ідэальных для вас водару з калекцыі.'
                  : 'Пройдите короткий тест из 4 вопросов, и наши алгоритмы с точностью определят 3 идеальных для вас аромата из коллекции.'}
              </p>
            </div>
            
            <div className="shrink-0 relative z-10">
              <button 
                id="start-scent-quiz-btn"
                onClick={() => { setIsOpen(true); resetQuiz(); }}
                className="bg-brand-light text-white hover:bg-brand-accent px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] rounded-none transition-all duration-300 transform hover:scale-[1.02] active:scale-98 shadow-sm flex items-center gap-3.5"
              >
                <span>{language === 'be' ? 'Падабраць водар' : 'Подобрать аромат'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* QUIZ WIZARD DIALOG OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              id="scent-quiz-modal"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="bg-brand-bg border border-brand-border/40 w-full max-w-3xl h-[90vh] md:h-auto max-h-[700px] flex flex-col justify-between shadow-2xl relative"
            >
              
              {/* Header */}
              <div className="p-6 border-b border-brand-border/40 flex justify-between items-center bg-[#FAF9F6]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-accent" />
                    <span className="text-[10px] font-semibold tracking-widest text-brand-accent uppercase">
                      {language === 'be' ? 'Водарны квіз' : 'Парфюмерный квиз'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg text-brand-light">
                    {language === 'be' ? stepTitles[currentStep].be : stepTitles[currentStep].ru}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-brand-hover border border-transparent hover:border-brand-border/30 transition-all rounded-none"
                >
                  <X className="w-5 h-5 text-brand-muted hover:text-brand-light" />
                </button>
              </div>

              {/* Progress Indicator for steps 1-4 */}
              {currentStep < 4 && (
                <div className="w-full bg-brand-border/10 h-1">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStep / 3) * 100}%` }}
                    className="bg-brand-accent h-full transition-all duration-300"
                  />
                </div>
              )}

              {/* Steps Body */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: GENDER */}
                  {currentStep === 0 && (
                    <motion.div 
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                        {[
                          { id: 'female', title: 'Для неё', desc: 'Утонченные женственные сочетания', titleBe: 'Для яе', descBe: 'Вытанчаныя жаноцкія спалучэнні', icon: Gift },
                          { id: 'male', title: 'Для него', desc: 'Харизматичные мужские акценты', titleBe: 'Для яго', descBe: 'Харызматычныя мужчынскія акцэнты', icon: Crown },
                          { id: 'unisex', title: 'Унисекс', desc: 'Для двоих или без стереотипов', titleBe: 'Унісекс', descBe: 'Для дваіх ці без стэрэатыпаў', icon: Compass }
                        ].map(opt => {
                          const IconComp = opt.icon;
                          const selected = gender === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => { setGender(opt.id); setTimeout(handleNext, 200); }}
                              className={`p-6 border text-center flex flex-col items-center justify-center gap-3.5 group transition-all relative ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.02]' 
                                  : 'border-brand-border/65 hover:border-brand-accent/50 hover:bg-brand-hover/10'
                              }`}
                            >
                              <div className={`p-3 rounded-full transition-colors ${selected ? 'bg-brand-accent text-white' : 'bg-brand-hover/30 text-brand-muted group-hover:text-brand-accent'}`}>
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-serif text-sm font-medium text-brand-light leading-none mb-1">
                                  {language === 'be' ? opt.titleBe : opt.title}
                                </h4>
                                <p className="text-[10px] text-brand-muted lowercase leading-normal">
                                  {language === 'be' ? opt.descBe : opt.desc}
                                </p>
                              </div>
                              {selected && (
                                <span className="absolute top-2 right-2 bg-brand-accent text-white p-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: OCCASION */}
                  {currentStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                        {[
                          { id: 'everyday', title: 'Офис / На каждый день', desc: 'Легкие, ненавязчивые спутники дня', titleBe: 'Офіс / На кожны дзень', descBe: 'Лёгкія, непатрабавальныя спадарожнікі дня', icon: Briefcase },
                          { id: 'date', title: 'Свидание / Вечер', desc: 'Чувственные сладковатые молекулы', titleBe: 'Спатканне / Вечар', descBe: 'Пачуццёвыя саладкавыя малекулы', icon: Flame },
                          { id: 'fresh', title: 'Спорт / Сорбет свежести', desc: 'Энергичный заряд цитрусов и воды', titleBe: 'Спорт / Сарбет свежасці', descBe: 'Энергічны зарад цытрусаў і вады', icon: Droplets },
                          { id: 'status', title: 'Особый случай / Статус', desc: 'Глубокие кожаные и удовые ароматы', titleBe: 'Асаблівы выпадак / Статус', descBe: 'Глыбокія скураныя і ўдавыя водары', icon: Crown }
                        ].map(opt => {
                          const IconComp = opt.icon;
                          const selected = occasion === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => { setOccasion(opt.id); setTimeout(handleNext, 200); }}
                              className={`p-5 border text-left flex items-start gap-4 transition-all relative ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.02]' 
                                  : 'border-brand-border/65 hover:border-brand-accent/50 hover:bg-brand-hover/10'
                              }`}
                            >
                              <div className={`p-2.5 shrink-0 transition-colors ${selected ? 'bg-brand-accent text-white' : 'bg-brand-hover/30 text-brand-muted'}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-serif text-sm font-medium text-brand-light max-w-[180px]">
                                  {language === 'be' ? opt.titleBe : opt.title}
                                </h4>
                                <p className="text-[10px] text-brand-muted leading-snug">
                                  {language === 'be' ? opt.descBe : opt.desc}
                                </p>
                              </div>
                              {selected && (
                                <span className="absolute top-2 right-2 bg-brand-accent text-white p-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: FAMILY */}
                  {currentStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                        {[
                          { id: 'citrus_fresh', title: 'Свежие, Цитрусовые и Морские', desc: 'Бергамот, мята, аква-аккорды', titleBe: 'Свежыя, Цытрусавыя і Марскія', descBe: 'Бергамот, мята, аква-акорды' },
                          { id: 'sweet_gourmand', title: 'Сладкие, Ванильные, Гурманские', desc: 'Ваниль, карамель, бобы тонка', titleBe: 'Салодкія, Ванільныя, Гурманскія', descBe: 'Ваніль, карамель, бобы тонка' },
                          { id: 'woody_spicy', title: 'Древесные, Пряные и Кожаные', desc: 'Сандал, кедр, табак, специи', titleBe: 'Драўняныя, Рэзкія і Скураныя', descBe: 'Сандал, кедр, тытунь, спецыі' },
                          { id: 'floral_powdery', title: 'Цветочные, Пудровые и Нежные', desc: 'Роза, жасмин, утонченный мускус', titleBe: 'Кветкавыя, Пудравыя і Нёжныя', descBe: 'Ружа, ясмін, вытанчаны мускус' }
                        ].map(opt => {
                          const selected = family === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => { setFamily(opt.id); setTimeout(handleNext, 200); }}
                              className={`p-5 border text-left flex flex-col justify-center gap-1.5 transition-all relative ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.02]' 
                                  : 'border-brand-border/65 hover:border-brand-accent/50 hover:bg-brand-hover/10'
                              }`}
                            >
                              <h4 className="font-serif text-sm font-medium text-brand-light">
                                {language === 'be' ? opt.titleBe : opt.title}
                              </h4>
                              <p className="text-[10px] text-brand-muted leading-tight leading-relaxed">
                                {language === 'be' ? opt.descBe : opt.desc}
                              </p>
                              {selected && (
                                <span className="absolute top-2 right-2 bg-brand-accent text-white p-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: INTENSITY */}
                  {currentStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                        {[
                          { id: 'subtle', title: 'Деликатный', desc: 'Шепот интимного мускуса близко к коже', titleBe: 'Дэлікатны', descBe: 'Шэпт інтымнага мускусу блізка да скуры' },
                          { id: 'moderate', title: 'Элегантный', desc: 'Заметный, но изысканный классический шлейф', titleBe: 'Элегантны', descBe: 'Заўважны, але вытанчаны класічны шлейф' },
                          { id: 'bold', title: 'Выразительный', desc: 'Максимальный восторг, стойкость и длинный хвост', titleBe: 'Выразны', descBe: 'Максімальнае захапленне, стойкасць і даўгі хвост' }
                        ].map(opt => {
                          const selected = intensity === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setIntensity(opt.id)}
                              className={`p-6 border text-center flex flex-col items-center justify-center gap-3 transition-all relative ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.02]' 
                                  : 'border-brand-border/65 hover:border-brand-accent/50 hover:bg-brand-hover/10'
                              }`}
                            >
                              <span className="text-[9px] uppercase tracking-widest text-brand-accent font-semibold">{opt.id === 'bold' ? '★★★' : opt.id === 'moderate' ? '★★' : '★'}</span>
                              <div>
                                <h4 className="font-serif text-sm font-medium text-brand-light mb-1">
                                  {language === 'be' ? opt.titleBe : opt.title}
                                </h4>
                                <p className="text-[10px] text-brand-muted leading-tight leading-relaxed max-w-[150px] mx-auto uppercase tracking-wide">
                                  {language === 'be' ? opt.descBe : opt.desc}
                                </p>
                              </div>
                              {selected && (
                                <span className="absolute top-2 right-2 bg-brand-accent text-white p-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: RESULTS SCREEN */}
                  {currentStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4 py-2"
                    >
                      {loadingResults ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                          <div className="w-12 h-12 rounded-full border-2 border-brand-accent/20 border-t-brand-accent animate-spin" />
                          <p className="text-xs uppercase tracking-widest text-brand-muted">
                            {language === 'be' ? 'Аналізуем інгрэдыенты калекцыі...' : 'Анализируем ингредиенты коллекции...'}
                          </p>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                          <p className="text-sm text-brand-muted">
                            {language === 'be' ? 'Выбачайце, па вашым запыце нічога не знойдзена.' : 'Извините, по вашему запросу ничего не найдено.'}
                          </p>
                          <button onClick={resetQuiz} className="text-xs uppercase tracking-widest text-brand-accent underline">
                            {language === 'be' ? 'Пачаць наноў' : 'Начать заново'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {results.map(({ product, match, explanation, explanationBe }, idx) => (
                            <div 
                              key={product.id}
                              className="border border-brand-border/30 p-5 flex flex-col md:flex-row gap-6 items-start md:items-stretch justify-between text-left group hover:border-brand-accent/20 transition-all bg-white relative"
                            >
                              {/* Left column: image and description */}
                              <div className="flex gap-5 flex-1 min-w-0 items-start">
                                {/* Product Image with match badge overlay */}
                                <div className="shrink-0 aspect-square w-20 h-20 sm:w-24 sm:h-24 relative overflow-hidden border border-brand-border/20 bg-brand-hover/5 shadow-xs">
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-1.5 left-1.5 bg-brand-accent text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wider font-sans uppercase">
                                    {match}% Match
                                  </div>
                                </div>

                                {/* Texts: Brand, Name, Recommendation/Explanation */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] tracking-widest text-brand-muted font-sans font-semibold uppercase">
                                      {product.brand}
                                    </span>
                                  </div>
                                  <h4 className="font-serif text-sm sm:text-base font-semibold text-brand-light leading-snug">
                                    {product.name}
                                  </h4>
                                  
                                  {/* Explanation block - beautiful block design to handle wrap nicely */}
                                  <div className="pt-2">
                                    <p className="text-[11px] sm:text-xs text-brand-muted font-serif italic leading-relaxed pl-3 border-l-2 border-brand-accent/30">
                                      {language === 'be' ? explanationBe : explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right column: Action section (selector and add to cart) */}
                              <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-stretch md:items-end justify-between sm:justify-start md:justify-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-brand-border/20">
                                {product.variants && product.variants.length > 0 && (
                                  <div className="relative w-full sm:w-48 md:w-[160px]">
                                    <span className="absolute -top-3.5 left-0 text-[8px] font-mono text-brand-muted uppercase tracking-wider block">
                                      {language === 'be' ? 'Аб’ём' : 'Объем'}
                                    </span>
                                    <select
                                      value={selectedVariants[product.id] || ''}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSelectedVariants(prev => ({ ...prev, [product.id]: val }));
                                      }}
                                      className="w-full text-[10px] uppercase font-semibold tracking-wider pr-8 pl-3 py-2.5 bg-white border border-brand-border/40 hover:border-brand-accent/30 text-brand-light focus:outline-none focus:border-brand-accent appearance-none cursor-pointer rounded-none"
                                    >
                                      {product.variants.map((v) => {
                                        const typeStr = getVariantType(v, language);
                                        return (
                                          <option key={v.id} value={v.id} disabled={v.stock === 0}>
                                            {v.size} — {typeStr} {v.stock === 0 ? `(${language === 'be' ? 'Няма' : 'Нет'})` : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-brand-muted">
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                                  <span className="text-sm font-serif font-semibold text-brand-light whitespace-nowrap sm:min-w-[65px] text-right">
                                    {(product.variants?.find(v => v.id === selectedVariants[product.id])?.price || product.price)} {t('currency')}
                                  </span>
                                  <button
                                    id={`quiz-add-to-cart-${product.id}`}
                                    onClick={() => handleAddScentToCart(product)}
                                    disabled={product.variants?.find(v => v.id === selectedVariants[product.id])?.stock === 0}
                                    className="bg-brand-accent text-white hover:bg-brand-accent-hover h-10 px-6 text-[10px] uppercase font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-w-[120px]"
                                  >
                                    {successAdded[product.id] ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>{language === 'be' ? 'Дададзена!' : 'Добавлено!'}</span>
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
                            </div>
                          ))}
                          
                          {/* Scentbox Promo Card inside results to suggest boxed discovery match */}
                          <div className="p-4 border border-brand-accent/20 bg-brand-accent/[0.01] flex flex-col sm:flex-row items-center gap-4 justify-between mt-6 text-center sm:text-left">
                            <div className="space-y-1">
                              <h5 className="font-serif text-xs font-semibold text-brand-accent uppercase tracking-widest">
                                {language === 'be' ? 'Хочаце паспрабаваць усё адразу?' : 'Хотите попробовать всё сразу?'}
                              </h5>
                              <p className="text-[10px] text-brand-muted max-w-[400px]">
                                {language === 'be' 
                                  ? 'Закажыце індывідуальны Аромабокс са зніжкай! Нашы эксперты збяруць усе 3 падабраных водару па 2 мл у падарункавую скрыначку.'
                                  : 'Закажите индивидуальный Аромабокс со скидкой! Наши эксперты соберут все 3 подобранных аромата по 2 мл в подарочную шкатулку.'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                if (onOrderBoxClick) {
                                  onOrderBoxClick();
                                } else {
                                  // Open cart after some delay to let them see
                                  setIsCartOpen(true);
                                }
                              }}
                              className="text-[10px] uppercase tracking-wider text-brand-accent hover:text-brand-accent-hover font-semibold shrink-0 py-2 border-b border-brand-accent hover:border-brand-accent-hover"
                            >
                              {language === 'be' ? 'Скласці Бокс' : 'Создать Бокс'}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Wizard Footer Controls */}
              <div className="p-5 border-t border-brand-border/40 bg-[#FAF9F6] flex justify-between items-center text-xs">
                {currentStep < 4 ? (
                  <>
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="px-4 py-2 border border-brand-border/40 text-brand-muted hover:text-brand-light disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-[9px] rounded-none flex items-center gap-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'be' ? 'Назад' : 'Назад'}</span>
                    </button>
                    
                    <span className="text-[10px] tracking-widest text-brand-muted font-sans font-medium uppercase">
                      {language === 'be' ? 'Пытанне' : 'Вопрос'} {currentStep + 1} / 4
                    </span>

                    <button
                      onClick={handleNext}
                      disabled={
                        (currentStep === 0 && !gender) ||
                        (currentStep === 1 && !occasion) ||
                        (currentStep === 2 && !family) ||
                        (currentStep === 3 && !intensity)
                      }
                      className="px-5 py-2.5 bg-brand-light text-white hover:bg-brand-accent uppercase tracking-widest text-[9px] rounded-none flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{language === 'be' ? 'Далей' : 'Далее'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full flex justify-between">
                    <button
                      onClick={resetQuiz}
                      className="px-5 py-2.5 border border-brand-border/40 text-brand-light hover:text-brand-accent uppercase tracking-widest text-[9px] rounded-none"
                    >
                      {language === 'be' ? 'Пачаць наноў' : 'Начать заново'}
                    </button>
                    
                    <button
                      onClick={() => { setIsOpen(false); setIsCartOpen(true); }}
                      className="px-6 py-2.5 bg-brand-accent text-white hover:bg-brand-accent-hover uppercase tracking-widest text-[9px] rounded-none"
                    >
                      {language === 'be' ? 'Перайсці ў кошык' : 'Перейти в корзину'}
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
