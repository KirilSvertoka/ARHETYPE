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
    
    // Check if it is a set product
    const isSetProduct = (product.setItems && product.setItems.length > 0) || 
                         (product.tags || []).some(t => t.toLowerCase() === 'set' || t.toLowerCase() === 'набор') || 
                         product.name.toLowerCase().includes('набор') || 
                         product.name.toLowerCase().includes('сет') || 
                         product.name.toLowerCase().includes('set');

    const brand = product.brand;
    const name = product.name;

    if (isSetProduct) {
      if (isBe) {
        let context = 'выдатна дапоўніць ваш вобраз';
        if (selectedOccasion === 'everyday') context = 'ідэальна падыходзіць на кожны дзень і для працы';
        else if (selectedOccasion === 'date') context = 'зачаруе і створыць рамантычную атмасферу вечарам';
        else if (selectedOccasion === 'fresh') context = 'падорыць доўгачаканую свежасць і прыліў бадзёрасці';
        else if (selectedOccasion === 'status') context = 'падкрэсліць вытанчаны стыль і асаблівы статус';

        let famStr = 'вытанчанага набору';
        if (selectedFamily === 'citrus_fresh') famStr = 'цудоўнай калекцыяй цытрусавых і свежых мотараў';
        else if (selectedFamily === 'sweet_gourmand') famStr = 'раскошным салодкім гурманскім спалучэннем';
        else if (selectedFamily === 'woody_spicy') famStr = 'высакароднымі драўняна-рэзкімі мініяцюрамі';
        else if (selectedFamily === 'floral_powdery') famStr = 'далікатным кветкава-пудравым букетам';

        return `Тэматычны сэт ${name} ад ${brand} аб'ядноўвае адборныя кампазіцыі, якія раскрываюцца ${famStr}. Гэты гатовы набор ${context}.`;
      } else {
        let context = 'великолепно подчеркнет ваш образ';
        if (selectedOccasion === 'everyday') context = 'создаст безупречный и деликатный офисный стиль на каждый день';
        else if (selectedOccasion === 'date') context = 'окружит вас притягательной, теплой атмосферой вечернего свидания';
        else if (selectedOccasion === 'fresh') context = 'подарит ощущение живительной прохлады, чистоты и легкости';
        else if (selectedOccasion === 'status') context = 'выгодно выделит ваш безупречный вкус и высокий статус';

        let famStr = 'изысканого парфюмерного сета';
        if (selectedFamily === 'citrus_fresh') famStr = 'потрясающим сочетанием цитрусовых и водных оттенков';
        else if (selectedFamily === 'sweet_gourmand') famStr = 'соблазнительными сладкими гурманскими мотивами';
        else if (selectedFamily === 'woody_spicy') famStr = 'благородными древесными и пряными аккордами';
        else if (selectedFamily === 'floral_powdery') famStr = 'изящным пудрово-цветочным букетом';

        return `Готовый сет ${name} от ${brand} объединяет культовые селективные композиции, раскрывающиеся ${famStr}. Этот аромабокс ${context}.`;
      }
    }

    // Extract notes
    const topNotes = (product.topNotes || []).slice(0, 2).map(n => isBe && n.name_be ? n.name_be.toLowerCase() : n.name.toLowerCase());
    const heartNotes = (product.heartNotes || []).slice(0, 2).map(n => isBe && n.name_be ? n.name_be.toLowerCase() : n.name.toLowerCase());
    const baseNotes = (product.baseNotes || []).slice(0, 2).map(n => isBe && n.name_be ? n.name_be.toLowerCase() : n.name.toLowerCase());
    const accords = (product.accords || []).slice(0, 2).map(a => isBe && a.name_be ? a.name_be.toLowerCase() : a.name.toLowerCase());

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
        const isSetProduct = (product.setItems && product.setItems.length > 0) || 
                             (product.tags || []).some(t => t.toLowerCase() === 'set' || t.toLowerCase() === 'набор') || 
                             product.name.toLowerCase().includes('набор') || 
                             product.name.toLowerCase().includes('сет') || 
                             product.name.toLowerCase().includes('set');

        // Retrieve sub-products information if it is a set
        let subProductsText = '';
        if (isSetProduct && product.setItems && product.setItems.length > 0) {
          product.setItems.forEach(item => {
            const matchedSub = allProducts.find(p => p.id === item.id || (p.name.toLowerCase() === item.name.toLowerCase() && p.brand.toLowerCase() === item.brand.toLowerCase()));
            if (matchedSub) {
              subProductsText += ' ' + [
                matchedSub.name,
                matchedSub.brand,
                matchedSub.description,
                matchedSub.description_be,
                ...(matchedSub.scentFamilies || []),
                ...(matchedSub.scentFamilies_be || []),
                ...(matchedSub.accords || []).map(a => a.name),
                ...(matchedSub.topNotes || []).map(n => n.name),
                ...(matchedSub.heartNotes || []).map(n => n.name),
                ...(matchedSub.baseNotes || []).map(n => n.name),
                ...(matchedSub.tags || []),
                ...(matchedSub.tags_be || [])
              ].map(t => (t || '').toLowerCase()).join(' ');
            }
          });
        }

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
          ...(product.tags_be || []),
          subProductsText
        ].map(t => (t || '').toLowerCase()).join(' ');

        const checkKeywords = (keywords: string[]) => keywords.some(kw => productText.includes(kw));

        // 1. Gender Filter & Match (Max 35 points)
        let genderScore = 0;
        if (gender === 'female') {
          if (product.gender === 'Female') genderScore = 35;
          else if (product.gender === 'Unisex') genderScore = 32; // Boosted so they recommend if matching other characteristics nicely
          else genderScore = -20; // Heavy penalty for opposite gender
        } else if (gender === 'male') {
          if (product.gender === 'Male') genderScore = 35;
          else if (product.gender === 'Unisex') genderScore = 32; // Boosted so they recommend if matching other characteristics nicely
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
      {/* Immersive Full-Screen Scent Quiz Poster (Light Theme Luxury Style) */}
      <section className="relative w-full h-[550px] md:h-[80vh] lg:h-screen min-h-[500px] overflow-hidden bg-brand-bg border-b border-brand-border/40 flex flex-col items-center justify-center select-none animate-fade-in">
        
        {/* Subtle, beautiful ambient image background */}
        <div className="absolute inset-0 z-0 opacity-15 mix-blend-multiply">
          <img
            src="https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1600&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover select-none pointer-events-none contrast-105 grayscale"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/90 to-brand-bg/40 z-0" />

        {/* Ambient warm glow of luxury */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/[0.02] rounded-full blur-[140px] pointer-events-none" />

        {/* Center content container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 md:space-y-8 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase font-mono tracking-[0.35em] text-brand-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
            {language === 'be' ? 'ІНТЭРАКТЫЎНЫ ПАДБОР' : 'ИНТЕРАКТИВНЫЙ ПОДБОР'}
          </span>
          
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-brand-light font-extralight tracking-[0.05em] uppercase leading-[1.15] max-w-3xl">
            {language === 'be' ? 'Знайдзіце свой парфумерны Архетып' : 'Найдите свой парфюмерный Архетип'}
          </h2>
          
          <p className="text-xs sm:text-sm md:text-base text-brand-muted font-extralight tracking-[0.02em] font-sans leading-relaxed max-w-2xl px-4">
            {language === 'be' 
              ? 'Пройдзеце кароткі тэст з 4 пытанняў, і нашы алгарытмы з дакладнасцю вызначаць 3 ідэальных для вас водару з калекцыі.'
              : 'Пройдите короткий тест из 4 вопросов, и наши алгоритмы с точностью определят 3 идеальных для вас аромата из коллекции.'}
          </p>

          <div className="pt-4 dynamic-button-wrapper">
            <button 
              id="start-scent-quiz-btn"
              onClick={() => { setIsOpen(true); resetQuiz(); }}
              className="group relative px-10 py-5 bg-transparent text-brand-light border border-brand-accent/40 hover:border-brand-accent hover:text-white text-xs font-semibold uppercase tracking-[0.25em] rounded-none transition-all duration-500 overflow-hidden flex items-center gap-3.5 cursor-pointer"
            >
              <div className="absolute inset-0 w-0 bg-brand-accent transition-all duration-300 ease-out group-hover:w-full" />
              <span className="relative z-10">{language === 'be' ? 'Падабраць водар' : 'Подобрать аромат'}</span>
              <ArrowRight className="w-4 h-4 relative z-10 text-brand-accent transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* QUIZ WIZARD DIALOG OVERLAY - RE-DESIGNED TO FIT PREMIUM LIGHT THEME */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-bg md:bg-black/80 md:backdrop-blur-md">
            <div className="fixed inset-0 hidden md:block" onClick={() => setIsOpen(false)} />
            
            <motion.div 
              id="scent-quiz-modal"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: 'spring', damping: 30, stiffness: 240 }}
              className="bg-brand-bg w-full h-[100dvh] md:h-[80vh] md:max-h-[660px] md:max-w-3xl md:border md:border-brand-border/60 flex flex-col justify-between shadow-2xl relative rounded-none z-10 overflow-hidden"
            >
              
              {/* Luxury Header */}
              <div className="p-6 md:p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-brand-accent font-semibold leading-none block">
                      {language === 'be' ? 'Водарны квіз' : 'Парфюмерный квиз'}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg sm:text-2xl font-light text-brand-light tracking-wide uppercase leading-tight">
                    {language === 'be' ? stepTitles[currentStep].be : stepTitles[currentStep].ru}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-brand-hover border border-transparent hover:border-brand-border transition-all duration-300 rounded-none cursor-pointer"
                >
                  <X className="w-5 h-5 text-brand-muted hover:text-brand-light" />
                </button>
              </div>

              {/* Progress Indicator for steps 1-4 */}
              {currentStep < 4 && (
                <div className="w-full bg-brand-border h-[2px]">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStep / 3) * 100}%` }}
                    className="bg-brand-accent h-[2px] transition-all duration-300"
                  />
                </div>
              )}

              {/* Steps Body */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar bg-brand-bg">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: GENDER */}
                  {currentStep === 0 && (
                    <motion.div 
                       key="step0"
                       initial={{ opacity: 0, x: 15 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -15 }}
                       className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
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
                              onClick={() => { setGender(opt.id); setTimeout(handleNext, 250); }}
                              className={`p-8 border text-center flex flex-col items-center justify-center gap-4 transition-all duration-300 relative cursor-pointer group rounded-none ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.03] shadow-xs' 
                                  : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-hover/30'
                              }`}
                            >
                              <div className={`p-4 rounded-none border transition-all duration-300 ${
                                selected 
                                  ? 'bg-brand-accent text-white border-brand-accent' 
                                  : 'border-brand-border bg-transparent text-brand-muted group-hover:text-brand-accent group-hover:border-brand-accent/40'
                              }`}>
                                <IconComp className="w-5 h-5 stroke-[1.25]" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-serif text-sm sm:text-base font-light tracking-widest text-brand-light uppercase">
                                  {language === 'be' ? opt.titleBe : opt.title}
                                </h4>
                                <p className="text-[10px] text-brand-muted font-sans font-light tracking-wide max-w-[160px] leading-relaxed">
                                  {language === 'be' ? opt.descBe : opt.desc}
                                </p>
                              </div>
                              {selected && (
                                <span className="absolute top-3 right-3 bg-brand-accent text-white p-0.5 rounded-none flex items-center justify-center">
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
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                        {[
                          { id: 'everyday', title: 'Офис / На каждый день', desc: 'Легкие, ненавязчивые спутники дня', titleBe: 'Офіс / На кожны дзень', descBe: 'Лёгкія, непатрабавальныя спадарожнікі дня', icon: Briefcase },
                          { id: 'date', title: 'Свидание / Вечер', desc: 'Чувственные сладковатые молекулы', titleBe: 'Спатканне / Вечар', descBe: 'Пачуццёвыя саладкавыя малекулы', icon: Flame },
                          { id: 'fresh', title: 'Спорт / Сорбет свежести', desc: 'Энергичный заряд цитрусов и воды', titleBe: 'Спорт / Сарбет свежасці', descBe: 'Энергічны зарад цытрусаў і вады', icon: Droplets },
                          { id: 'status', title: 'Особый случай / Status', desc: 'Глубокие кожаные и удовые ароматы', titleBe: 'Асаблівы выпадак / Status', descBe: 'Глыбокія скураныя і ўдавыя водары', icon: Crown }
                        ].map(opt => {
                          const IconComp = opt.icon;
                          const selected = occasion === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => { setOccasion(opt.id); setTimeout(handleNext, 250); }}
                              className={`p-6 border text-left flex items-start gap-4 transition-all duration-300 relative rounded-none cursor-pointer group ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.03]' 
                                  : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-hover/30'
                              }`}
                            >
                              <div className={`p-3 rounded-none border transition-colors duration-300 shrink-0 ${
                                selected 
                                  ? 'bg-brand-accent text-white border-brand-accent' 
                                  : 'border-brand-border bg-transparent text-brand-muted group-hover:text-brand-accent group-hover:border-brand-accent/40'
                              }`}>
                                <IconComp className="w-4 h-4 stroke-[1.25]" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-serif text-sm font-medium text-brand-light uppercase tracking-wider">
                                  {language === 'be' ? opt.titleBe : opt.title}
                                </h4>
                                <p className="text-[10px] text-brand-muted font-sans font-light tracking-wide leading-relaxed">
                                  {language === 'be' ? opt.descBe : opt.desc}
                                </p>
                              </div>
                              {selected && (
                                <span className="absolute top-3 right-3 bg-brand-accent text-white p-0.5 rounded-none flex items-center justify-center">
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
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
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
                              onClick={() => { setFamily(opt.id); setTimeout(handleNext, 250); }}
                              className={`p-6 border text-left flex flex-col justify-center gap-2 transition-all duration-300 relative rounded-none cursor-pointer group ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.03]' 
                                  : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-hover/30'
                              }`}
                            >
                              <h4 className="font-serif text-sm font-medium text-brand-light uppercase tracking-wider">
                                {language === 'be' ? opt.titleBe : opt.title}
                              </h4>
                              <p className="text-[10px] text-brand-muted font-sans font-light tracking-wide leading-relaxed">
                                {language === 'be' ? opt.descBe : opt.desc}
                              </p>
                              {selected && (
                                <span className="absolute top-3 right-3 bg-brand-accent text-white p-0.5 rounded-none flex items-center justify-center">
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
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
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
                              className={`p-6 border text-center flex flex-col items-center justify-center gap-3.5 transition-all duration-300 relative rounded-none cursor-pointer group ${
                                selected 
                                  ? 'border-brand-accent bg-brand-accent/[0.03]' 
                                  : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-hover/30'
                              }`}
                            >
                              <div className="flex gap-1 items-center justify-center">
                                {[...Array(opt.id === 'bold' ? 3 : opt.id === 'moderate' ? 2 : 1)].map((_, i) => (
                                  <span key={i} className="text-brand-accent font-serif text-[13px] leading-none">★</span>
                                ))}
                              </div>
                              <div>
                                <h4 className="font-serif text-sm font-medium text-brand-light uppercase tracking-wider mb-1">
                                  {language === 'be' ? opt.titleBe : opt.title}
                                </h4>
                                <p className="text-[10px] text-brand-muted font-sans font-light tracking-wide leading-relaxed max-w-[150px] mx-auto uppercase">
                                  {language === 'be' ? opt.descBe : opt.desc}
                                </p>
                              </div>
                              {selected && (
                                <span className="absolute top-3 right-3 bg-brand-accent text-white p-0.5 rounded-none flex items-center justify-center">
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
                          <div className="w-12 h-12 rounded-none border-2 border-brand-accent/20 border-t-brand-accent animate-spin" />
                          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-mono">
                            {language === 'be' ? 'Аналізуем інгрэдыенты калекцыі...' : 'Анализируем ингредиенты коллекции...'}
                          </p>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="text-center py-12 space-y-4 bg-brand-bg">
                          <p className="text-sm text-brand-muted">
                            {language === 'be' ? 'Выбачайце, па вашым запыце нічога не знойдзена.' : 'Извините, по вашему запросу ничего не найдено.'}
                          </p>
                          <button onClick={resetQuiz} className="text-[10px] uppercase font-bold tracking-widest text-brand-accent underline cursor-pointer">
                            {language === 'be' ? 'Пачаць наноў' : 'Начать заново'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {results.map(({ product, match, explanation, explanationBe }, idx) => (
                            <div 
                              key={product.id}
                              className="border border-brand-border p-5 flex flex-col md:flex-row gap-6 items-start md:items-stretch justify-between text-left group hover:border-brand-accent/35 transition-all bg-brand-bg relative rounded-none"
                            >
                              {/* Left column: image and description */}
                              <div className="flex flex-col sm:flex-row gap-5 flex-1 min-w-0 items-start">
                                {/* Product Image with match badge overlay */}
                                <div className="shrink-0 aspect-square w-24 h-24 sm:w-28 sm:h-28 relative overflow-hidden border border-brand-border bg-transparent shadow-xs">
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-1.5 left-1.5 bg-brand-accent text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 tracking-wider font-sans uppercase">
                                    {match}% Match
                                  </div>
                                </div>

                                {/* Texts: Brand, Name, Recommendation/Explanation */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] sm:text-xs tracking-widest text-brand-muted font-sans font-semibold uppercase">
                                      {product.brand}
                                    </span>
                                    {/* Set check badge */}
                                    {((product.setItems && product.setItems.length > 0) || (product.tags || []).some(t => t.toLowerCase() === 'set' || t.toLowerCase() === 'набор') || product.name.toLowerCase().includes('набор') || product.name.toLowerCase().includes('сет') || product.name.toLowerCase().includes('set')) && (
                                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-sky-800 bg-sky-500/5 px-2 py-0.5 border border-sky-500/15">
                                        {language === 'be' ? 'Гатовы набор / Арамасэт' : 'Готовый набор / Аромасет'}
                                      </span>
                                    )}
                                    {gender !== 'unisex' && product.gender === 'Unisex' && (
                                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-amber-800 bg-amber-500/5 px-2 py-0.5 border border-amber-500/15">
                                        {match >= 75 
                                          ? (language === 'be' ? 'Унісекс — падыходзіць для вас' : 'Унисекс — подходит для вас')
                                          : (language === 'be' ? 'Унісекс — выдатна падыходзіць' : 'Унисекс — отлично подходит')}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-serif text-base sm:text-lg font-semibold text-brand-light leading-snug">
                                    {product.name}
                                  </h4>
                                  
                                  {/* Explanation block */}
                                  <div className="pt-2">
                                    <p className="text-xs sm:text-[13px] text-brand-muted font-serif leading-relaxed pl-3 border-l-2 border-brand-accent/30">
                                      {language === 'be' ? explanationBe : explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right column: Action section */}
                              <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-stretch md:items-end justify-between sm:justify-start md:justify-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-brand-border/40">
                                {product.variants && product.variants.length > 0 && (
                                  <div className="relative w-full sm:w-48 md:w-[160px]">
                                    <span className="absolute -top-3.5 left-0 text-[9px] font-mono text-brand-muted uppercase tracking-wider block">
                                      {language === 'be' ? 'Аб’ём' : 'Объем'}
                                    </span>
                                    <select
                                      value={selectedVariants[product.id] || ''}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSelectedVariants(prev => ({ ...prev, [product.id]: val }));
                                      }}
                                      className="w-full text-xs uppercase font-semibold tracking-wider pr-8 pl-3 py-2.5 bg-brand-bg border border-brand-border hover:border-brand-accent/50 text-brand-light focus:outline-none focus:border-brand-accent appearance-none cursor-pointer rounded-none"
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
                                  <span className="text-base sm:text-lg font-sans font-semibold text-brand-light whitespace-nowrap sm:min-w-[70px] text-right lining-nums tabular-nums">
                                    {(product.variants?.find(v => v.id === selectedVariants[product.id])?.price || product.price)} {t('currency')}
                                  </span>
                                  <button
                                    id={`quiz-add-to-cart-${product.id}`}
                                    onClick={() => handleAddScentToCart(product)}
                                    disabled={product.variants?.find(v => v.id === selectedVariants[product.id])?.stock === 0}
                                    className="bg-brand-accent text-white hover:bg-brand-accent-hover h-11 px-6 text-xs uppercase font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-w-[125px] cursor-pointer rounded-none"
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
                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Wizard Footer Controls */}
              <div className="p-5 md:p-6 border-t border-brand-border bg-brand-bg flex justify-between items-center text-xs">
                {currentStep < 4 ? (
                  <>
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="px-5 py-3 border border-brand-border text-brand-muted hover:text-brand-light disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-[0.2em] text-[9px] rounded-none flex items-center gap-2 bg-transparent transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'be' ? 'Назад' : 'Назад'}</span>
                    </button>
                    
                    <span className="text-[10px] tracking-[0.25em] text-brand-muted font-mono font-medium uppercase text-center flex-1 sm:flex-initial">
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
                      className="px-6 py-3 bg-brand-light text-white hover:bg-brand-accent uppercase tracking-[0.2em] text-[9px] rounded-none flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <span>{language === 'be' ? 'Далей' : 'Далее'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full flex justify-between gap-4">
                    <button
                      onClick={resetQuiz}
                      className="px-5 py-3 border border-brand-border text-brand-light hover:text-brand-accent uppercase tracking-[0.2em] text-[9px] rounded-none bg-transparent transition-all cursor-pointer"
                    >
                      {language === 'be' ? 'Пачаць наноў' : 'Начать заново'}
                    </button>
                    
                    <button
                      onClick={() => { setIsOpen(false); setIsCartOpen(true); }}
                      className="px-6 py-3 bg-brand-accent text-white hover:bg-brand-accent-hover uppercase tracking-[0.2em] text-[9px] rounded-none transition-all cursor-pointer"
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
