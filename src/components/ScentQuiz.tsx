import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, Check, CheckCircle2, ShoppingBag, X, Compass, Gift, Briefcase, Flame, Droplets, Crown } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { useCart } from './CartProvider';
import { Product } from '../types';

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
        let score = 0;
        
        // 1. Gender (30 points)
        if (gender === 'female') {
          score += product.gender === 'Female' ? 30 : (product.gender === 'Unisex' ? 22 : 0);
        } else if (gender === 'male') {
          score += product.gender === 'Male' ? 30 : (product.gender === 'Unisex' ? 22 : 0);
        } else {
          score += product.gender === 'Unisex' ? 30 : 15;
        }

        // 2. Occasion Vibe (25 points)
        const lowerDesc = (product.description || '').toLowerCase();
        const lowerName = product.name.toLowerCase();
        const lowerBrand = product.brand.toLowerCase();
        const families = (product.scentFamilies || []).map(f => f.toLowerCase());
        const accords = (product.accords || []).map(a => a.name.toLowerCase());

        let occasionMatched = false;
        if (occasion === 'everyday') {
          if (families.some(f => f.includes('свеж') || f.includes('цитр') || f.includes('мускус') || f.includes('цветоч') || f.includes('fresh') || f.includes('citrus') || f.includes('floral'))) occasionMatched = true;
          if (accords.some(a => a.includes('цитрус') || a.includes('свеж') || a.includes('мускус') || a.includes('зелен') || a.includes('чист') || a.includes('аква'))) occasionMatched = true;
          score += occasionMatched ? 25 : 10;
        } else if (occasion === 'date') {
          if (families.some(f => f.includes('восточ') || f.includes('гурман') || f.includes('прян') || f.includes('oriental') || f.includes('gourmand') || f.includes('spicy'))) occasionMatched = true;
          if (accords.some(a => a.includes('сладк') || a.includes('ванил') || a.includes('роза') || a.includes('тепл') || a.includes('прян') || a.includes('кокос') || a.includes('вишн'))) occasionMatched = true;
          score += occasionMatched ? 25 : 10;
        } else if (occasion === 'fresh') {
          if (families.some(f => f.includes('свеж') || f.includes('цитр') || f.includes('fresh') || f.includes('citrus'))) occasionMatched = true;
          if (accords.some(a => a.includes('цитрус') || a.includes('свеж') || a.includes('водн') || a.includes('морск') ||  a.includes('зелен'))) occasionMatched = true;
          score += occasionMatched ? 25 : 8;
        } else if (occasion === 'status') {
          if (families.some(f => f.includes('древес') || f.includes('кожан') || f.includes('шипр') || f.includes('woody') || f.includes('leather') || f.includes('chypre'))) occasionMatched = true;
          if (accords.some(a => a.includes('дерев') || a.includes('кожа') || a.includes('уд') || a.includes('амбр') || a.includes('дым') || a.includes('сандал'))) occasionMatched = true;
          score += occasionMatched ? 25 : 10;
        }

        // 3. Olfactory Families (25 points)
        let familyMatched = false;
        if (family === 'citrus_fresh') {
          if (families.some(f => f.includes('цитр') || f.includes('свеж') || f.includes('citrus') || f.includes('fresh')) ||
              accords.some(a => a.includes('цитрус') || a.includes('свеж') || a.includes('водн') || a.includes('морск') || a.includes('зелен'))) familyMatched = true;
        } else if (family === 'sweet_gourmand') {
          if (families.some(f => f.includes('гурман') || f.includes('сладк') || f.includes('gourmand') || f.includes('vanilla') || f.includes('ваниль')) ||
              accords.some(a => a.includes('сладк') || a.includes('ванил') || a.includes('карамел') || a.includes('шоколад') || a.includes('мед') || a.includes('мёд'))) familyMatched = true;
        } else if (family === 'woody_spicy') {
          if (families.some(f => f.includes('древес') || f.includes('прян') || f.includes('кожан') || f.includes('woody') || f.includes('spicy') || f.includes('leather')) ||
              accords.some(a => a.includes('дерев') || a.includes('кожа') || a.includes('прян') || a.includes('спец') || a.includes('сандал') || a.includes('кедр') || a.includes('табак') || a.includes('пачули'))) familyMatched = true;
        } else if (family === 'floral_powdery') {
          if (families.some(f => f.includes('цветоч') || f.includes('пудр') || f.includes('floral') || f.includes('powder')) ||
              accords.some(a => a.includes('цвет') || a.includes('пудр') || a.includes('роза') || a.includes('жасмин') || a.includes('пион') || a.includes('мускус'))) familyMatched = true;
        }
        score += familyMatched ? 25 : 8;

        // 4. Sillage / Longevity (20 points)
        if (intensity === 'subtle') {
          const isLight = (product.sillage || 3) <= 3 || (product.concentration && ['EDT', 'Cologne'].includes(product.concentration));
          score += isLight ? 20 : 10;
        } else if (intensity === 'moderate') {
          const isMod = (product.sillage || 3) === 3 || (product.sillage || 3) === 4 || product.concentration === 'EDP';
          score += isMod ? 20 : 12;
        } else if (intensity === 'bold') {
          const isBold = (product.sillage || 3) >= 4 || product.concentration === 'Parfum' || families.some(f => f.includes('восточ') || f.includes('amber')) || accords.some(a => a.includes('уд') || a.includes('кожа') || a.includes('амбр'));
          score += isBold ? 20 : 8;
        }

        const matchPercent = Math.round(68 + (score / 100) * 31);
        
        // Generate contextual explanation
        let explanation = '';
        let explanationBe = '';
        
        if (family === 'sweet_gourmand' && occasion === 'date') {
          explanation = 'Этот чувственный и томный шлейф с выраженной гурманской сладостью идеально дополнит атмосферу свидания и вечернего тепла.';
          explanationBe = 'Гэты пачуццёвы і млявы шлейф з выражанай гурманскай салодкасцю ідэальна дапоўніць атмасферу спаткання і вячэрняга цяпла.';
        } else if (family === 'citrus_fresh' && occasion === 'fresh') {
          explanation = 'Ультрасвежий взрыв цитрусов и легких акватических брызг подарит абсолютную легкость и тонус в течение дня.';
          explanationBe = 'Ультрасвежы выбух цытрусаў і лёгкіх акватычных пырскаў падорыць абсалютную лёгкасць і тонус на працягу дня.';
        } else if (family === 'woody_spicy' && occasion === 'status') {
          explanation = 'Благородная сухая древесина с глубокими дымными и кожаными нюансами подчеркнет безупречный статус и харизму.';
          explanationBe = 'Шляхетная сухая драўніна з глыбокімі дымнымі і скуранымі нюансамі падкрэсліць бездакорны статус і харызму.';
        } else if (family === 'floral_powdery' && occasion === 'everyday') {
          explanation = 'Деликатный цветочный букет с пудровым обволакивающим мускусом звучит невероятной нежностью утонченной «второй кожи».';
          explanationBe = 'Дэлікатны кветкавы букет з пудравым мускусам, які ахінае, гучыць неверагоднай пяшчотай вытанчанай «другой скуры».';
        } else {
          explanation = `Превосходно отвечает вашему запросу на аромат с преимущественно ${
            family === 'citrus_fresh' ? 'цитрусовой свежестью' :
            family === 'sweet_gourmand' ? 'томной сладостью' :
            family === 'woody_spicy' ? 'древесно-пряным авторитетом' : 'мягким цветочным характером'
          } для создания невероятного шлейфа.`;
          
          explanationBe = `Выдатна адказвае вашаму запыту на водар з пераважна ${
            family === 'citrus_fresh' ? 'цытрусавай свежасцю' :
            family === 'sweet_gourmand' ? 'млявай салодкасцю' :
            family === 'woody_spicy' ? 'драўняна-рэзкім аўтарытэтам' : 'мяккім кветкавым характарам'
          } для стварэння неверагоднага шлейфу.`;
        }

        return {
          product,
          match: Math.min(100, Math.max(72, matchPercent)),
          explanation,
          explanationBe
        };
      });

      // Sort by score desc, take top 3
      const top3 = scored.sort((a, b) => b.match - a.match).slice(0, 3);
      setResults(top3);
      setLoadingResults(false);
    }, 1200);
  };

  const handleAddScentToCart = (prod: Product) => {
    // Select first variant (usually 2ml decant) or fallback to any
    const variantId = prod.variants && prod.variants.length > 0 ? prod.variants[0].id : undefined;
    addToCart(prod, variantId);
    
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
              className="bg-brand-bg border border-brand-border/40 w-full max-w-2xl h-[90vh] md:h-auto max-h-[640px] flex flex-col justify-between shadow-2xl relative"
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
                        <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {results.map(({ product, match, explanation, explanationBe }, idx) => (
                            <div 
                              key={product.id}
                              className="border border-brand-border/40 p-4 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between text-left group hover:border-brand-accent/20 transition-all bg-white"
                            >
                              <div className="flex items-center gap-4">
                                {/* Matched % Badge */}
                                <div className="shrink-0 aspect-square w-16 h-16 relative overflow-hidden border border-brand-border/20 bg-brand-hover/10">
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-1 left-1 bg-brand-accent text-white text-[8px] font-bold px-1 font-sans">
                                    {match}%
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] tracking-wider text-brand-muted font-sans font-light leading-none mb-0.5">
                                    {product.brand}
                                  </p>
                                  <h4 className="font-serif text-sm font-medium text-brand-light leading-snug">
                                    {product.name}
                                  </h4>
                                  <p className="text-[10px] italic text-brand-accent font-sans">
                                    {language === 'be' ? explanationBe : explanation}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-border/20">
                                <span className="text-xs font-serif font-semibold text-brand-light whitespace-nowrap">
                                  {product.price} {t('currency')}
                                </span>
                                <button
                                  id={`quiz-add-to-cart-${product.id}`}
                                  onClick={() => handleAddScentToCart(product)}
                                  className="flex-1 sm:flex-initial bg-brand-accent text-white hover:bg-brand-accent-hover px-4 py-2.5 text-[10px] uppercase font-semibold tracking-wider transition-colors flex items-center justify-center gap-2"
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
