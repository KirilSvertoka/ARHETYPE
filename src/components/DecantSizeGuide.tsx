import React from 'react';
import { useLanguage } from './LanguageProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, Eye, Info, FlaskConical } from 'lucide-react';

interface DecantSizeGuideProps {
  selectedSize: string; // e.g. "2 мл", "5ml", "10 мл"
}

export default function DecantSizeGuide({ selectedSize }: DecantSizeGuideProps) {
  const { language } = useLanguage();

  // Helper to parse numeric volume from size string (e.g. "10мл", "5 ml" -> 5 or 10)
  const parseVolume = (sizeStr: string): number => {
    if (!sizeStr) return 5;
    const num = parseFloat(sizeStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 5 : num;
  };

  const volume = parseVolume(selectedSize);

  // Determine size category and metadata
  const getGuideInfo = (vol: number) => {
    if (vol <= 3) {
      return {
        sprays: vol * 15,
        durationRu: '1–2 недели регулярного использования',
        durationBe: '1–2 тыдні рэгулярнага выкарыстання',
        purposeRu: 'Для первого знакомства. Идеальный объем для раскрытия аромата при разной погоде и настроении без лишних затрат.',
        purposeBe: 'Для першага знаёмства. Ідэальны аб’ём для раскрыцця водару пры розным надвор’і і настроі без лішніх выдаткаў.',
        comparisonRu: 'размером с мини-помаду (легко поместится в визитницу)',
        comparisonBe: 'памерам з міні-памаду (лёгка змесціцца ў візітоўніцу)',
        comparisonShortRu: 'Мини-помада',
        comparisonShortBe: 'Міні-памада',
        spraysTextRu: '≈ 30 распылений',
        spraysTextBe: '≈ 30 распыленняў',
        liquidHeight: '28%',
        bottleHeight: '60px',
        bottleWidth: '16px',
        compareHeight: '52px',
        compareOffset: '14px'
      };
    } else if (vol <= 6) {
      return {
        sprays: vol * 15,
        durationRu: '3–4 недели регулярного использования',
        durationBe: '3–4 тыдні рэгулярнага выкарыстання',
        purposeRu: 'Для детального разнашивания. Хватит, чтобы полноценно прочувствовать шлейф, стойкость во всех фазах и решить, ваш ли это аромат.',
        purposeBe: 'Для дэталёвага разношвання. Хопіць, каб паўнавартасна адчуць шлейф, стойкасць ва ўсіх фазах і вырашыць, ці ваш гэта ворад.',
        comparisonRu: 'высотой с классический блеск для губ / зажигалку',
        comparisonBe: 'вышынёй з класічны бляск для вуснаў / запальнічку',
        comparisonShortRu: 'Классическая помада',
        comparisonShortBe: 'Класічная памада',
        spraysTextRu: '≈ 75 распылений',
        spraysTextBe: '≈ 75 распыленняў',
        liquidHeight: '52%',
        bottleHeight: '82px',
        bottleWidth: '18px',
        compareHeight: '75px',
        compareOffset: '8px'
      };
    } else if (vol <= 15) {
      return {
        sprays: vol * 15,
        durationRu: '1.5–2 месяца регулярного использования',
        durationBe: '1.5–2 месяцы рэгулярнага выкарыстання',
        purposeRu: 'Полноценный мини-флакон. Практичный сезонный объем — идеальный вариант для сумочки, отпуска или в качестве роскошного подарка.',
        purposeBe: 'Паўнавартасны міні-флакон. Практычны сезонны аб’ём — ідэальны варыянт для сумачкі, адпачынку ці ў якасці раскошнага падарунка.',
        comparisonRu: 'высотой со стандартную пластиковую банковскую карту',
        comparisonBe: 'вышынёй са стандартную пластыкавую банкаўскую карту',
        comparisonShortRu: 'Банковская карта',
        comparisonShortBe: 'Банкаўская карта',
        spraysTextRu: '≈ 150 распылений',
        spraysTextBe: '≈ 150 распыленняў',
        liquidHeight: '78%',
        bottleHeight: '105px',
        bottleWidth: '22px',
        compareHeight: '86px',
        compareOffset: '0px'
      };
    } else {
      // Larger decants/bottles (e.g. 20ml, 30ml, 100ml)
      const isFullBottle = vol >= 30;
      return {
        sprays: vol * 15,
        durationRu: `${Math.round(vol / 5)}–${Math.round(vol / 4)} мес. регулярного использования`,
        durationBe: `${Math.round(vol / 5)}–${Math.round(vol / 4)} мес. рэгулярнага выкарыстання`,
        purposeRu: isFullBottle 
          ? 'Полноразмерный оригинальный шедевр. Для истинных коллекционеров и тех, кто нашел свое идеальное парфюмерное «Я».'
          : 'Максимальный тревел-формат. Отличный объем для любимого парфюма на длительное время без необходимости частой покупки.',
        purposeBe: isFullBottle
          ? 'Поўнапамерны арыгінальны шэдэўр. Для сапраўдных калекцыянераў і тых, хто знайшоў сваё ідэальнае парфумернае «Я».'
          : 'Максімальны трэвел-фармат. Выдатны аб’ём для любімага парфуму на працяглы час без неабходнасці частай куплі.',
        comparisonRu: isFullBottle 
          ? 'полноформатный стеклянный флакон парфюмерного дома' 
          : 'высотой превосходит стандартную кредитную карту',
        comparisonBe: isFullBottle
          ? 'поўнапамерны шкляны флакон парфумернага дома'
          : 'вышынёй пераўзыходзіць стандартную крэдытную карту',
        comparisonShortRu: 'Пластиковая карта',
        comparisonShortBe: 'Пластыкавая карта',
        spraysTextRu: `≈ ${vol * 15} распылений`,
        spraysTextBe: `≈ ${vol * 15} распыленняў`,
        liquidHeight: '85%',
        bottleHeight: '120px',
        bottleWidth: isFullBottle ? '45px' : '28px',
        compareHeight: '86px',
        compareOffset: '0px'
      };
    }
  };

  const info = getGuideInfo(volume);

  return (
    <div className="mt-6 border border-brand-border/40 bg-brand-hover/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-brand-border/20">
        <FlaskConical className="w-3.5 h-3.5 text-brand-accent" />
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light">
          {language === 'be' ? 'Гід па аб\'ёмах адлівантаў' : 'Гид по объемам отливантов'}
        </h4>
        <span className="ml-auto text-[8px] font-mono text-brand-muted bg-brand-bg px-1.5 py-0.5 border border-brand-border/30">
          ARCHETYPE SPEC
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Dynamic Interactive Render comparison Column (4/12 width) */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center bg-brand-bg/60 border border-brand-border/30 p-3 relative overflow-hidden min-h-[160px] select-none">
          
          {/* Subtle Technical Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          {/* Graphic Side-by-Side Blueprint */}
          <div className="flex items-end justify-center gap-10 w-full relative h-[120px] pb-1">
            
            {/* Object Comparison Silhouette */}
            <div className="flex flex-col items-center justify-end relative transition-all duration-300">
              <div 
                className="border-2 border-brand-light/10 bg-brand-light/3 rounded-[3px] flex items-center justify-center opacity-40 transition-all duration-300"
                style={{
                  height: info.compareHeight,
                  width: info.comparisonShortRu.includes('карта') ? '54px' : '16px',
                  marginBottom: '1px'
                }}
              >
                <span className="text-[7px] text-center uppercase tracking-normal opacity-80 font-mono scale-[0.8] block px-1 leading-snug">
                  {language === 'be' ? info.comparisonShortBe : info.comparisonShortRu}
                </span>
              </div>
              <span className="text-[8px] font-mono text-brand-muted mt-1 opacity-60">
                {info.compareHeight === '86px' ? '86 мм' : info.compareHeight === '75px' ? '75 мм' : '52 мм'}
              </span>
            </div>

            {/* Height Connector Dotted Reference line */}
            <div className="absolute bottom-[20%] left-[25%] right-[25%] border-t border-dashed border-brand-accent/20 pointer-events-none" />
            <div className="absolute bottom-[60%] left-[25%] right-[25%] border-t border-dashed border-brand-accent/20 pointer-events-none" />

            {/* Atomizer Mockup */}
            <div className="flex flex-col items-center justify-end relative">
              
              {/* Atomizer Bottle Outer Frame */}
              <motion.div 
                layout
                className="border border-brand-accent bg-brand-bg/90 rounded-[2px] relative flex flex-col items-center justify-end overflow-hidden shadow-[0_0_15px_rgba(202,138,4,0.03)]"
                style={{
                  height: info.bottleHeight,
                  width: info.bottleWidth,
                }}
              >
                {/* Spray Cap (Metallic Top) */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-stone-200 to-stone-400 border-b border-stone-500 flex items-center justify-center select-none shadow-inner">
                  <div className="w-[1.5px] h-1.5 bg-black/70 rounded-full absolute right-1 top-1" />
                </div>

                {/* Fragrance Liquid (Dynamic height filled) */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: info.liquidHeight }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full bg-gradient-to-t from-brand-accent/50 to-brand-accent/15 relative bottom-0 rounded-b-[1px] border-t border-brand-accent/30 flex items-center justify-center"
                >
                  {/* Glowing core/shine */}
                  <div className="absolute inset-y-0 left-[20%] w-[1.5px] bg-white/20 blur-[0.5px]" />
                </motion.div>

                {/* Straw tube line */}
                <div className="absolute inset-y-4 w-[1px] bg-white/15 left-[50%] -translate-x-[50%] pointer-events-none" />

                {/* Title badge in micro font sizing */}
                <div className="absolute top-5 left-0 right-0 text-center select-none pointer-events-none opacity-40">
                  <p className="text-[5px] font-mono text-white/50 tracking-widest uppercase scale-75">ARCHETYPE</p>
                </div>
              </motion.div>

              {/* Tag/Info Label for Atomizer */}
              <motion.span 
                layout 
                className="text-[9px] font-mono text-brand-accent font-bold mt-1.5"
              >
                {selectedSize}
              </motion.span>
            </div>

          </div>
        </div>

        {/* Content & Descriptions Column (7/12 width) */}
        <div className="sm:col-span-7 flex flex-col justify-between h-full space-y-3.5">
          <div className="space-y-2">
            
            {/* Highlights metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-hover/10 p-2.5 border border-brand-border/30">
                <span className="text-[8px] font-mono text-brand-muted uppercase tracking-wider block">
                  {language === 'be' ? 'КЛАС ПАСАДЦЫ' : 'ОБЪЕМ РАСПЫЛЕНИЙ'}
                </span>
                <span className="text-sm font-semibold text-brand-light font-sans mt-0.5 block">
                  {language === 'be' ? info.spraysTextBe : info.spraysTextRu}
                </span>
              </div>
              <div className="bg-brand-hover/10 p-2.5 border border-brand-border/30">
                <span className="text-[8px] font-mono text-brand-muted uppercase tracking-wider block">
                  {language === 'be' ? 'НА СКОЛЬКІ ХОПІЦЬ' : 'ПРИМЕРНЫЙ СРОК'}
                </span>
                <span className="text-xs font-semibold text-brand-light font-sans mt-0.5 block leading-tight">
                  {language === 'be' ? info.durationBe : info.durationRu}
                </span>
              </div>
            </div>

            {/* Purpose and details */}
            <div className="mt-2.5 pt-1 space-y-1">
              <span className="text-[8px] font-bold text-brand-accent uppercase tracking-wider block">
                {language === 'be' ? 'УЛАСЦІВАСЦІ І ПРЫЗНАЧЭННЕ' : 'РЕКОМЕНДАЦИЯ ПАРФЮМЕРА'}
              </span>
              <p className="text-[11px] text-brand-light/90 leading-relaxed font-light font-serif italic text-balance">
                {language === 'be' ? info.purposeBe : info.purposeRu}
              </p>
            </div>

            {/* Scale comparison phrase */}
            <div className="text-[10px] text-brand-muted flex items-start gap-1.5 pt-1.5 border-t border-brand-border/20">
              <Info className="w-3 h-3 text-brand-accent shrink-0 mt-0.5" />
              <span>
                {language === 'be' 
                  ? `Атамайзер Archetype вышынёй ` 
                  : `Фирменный атомазер Archetype `}
                <strong>{language === 'be' ? info.comparisonBe : info.comparisonRu}</strong>.
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
