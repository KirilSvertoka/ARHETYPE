import React from 'react';
import { useLanguage } from './LanguageProvider';
import { motion } from 'motion/react';
import { Info, FlaskConical } from 'lucide-react';

interface DecantSizeGuideProps {
  selectedSize: string; // e.g. "2 мл", "5ml", "10 мл", "Остаток"
  variantType?: string;
}

export default function DecantSizeGuide({ selectedSize, variantType }: DecantSizeGuideProps) {
  const { language } = useLanguage();

  const isRemainder = 
    variantType === 'remainder' || 
    selectedSize.toLowerCase().includes('остаток') || 
    selectedSize.toLowerCase().includes('астатак');

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
        comparisonRu: 'размером с mini-помаду (легко поместится в визитницу)',
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
        purposeRu: 'Полноценный mini-флакон. Практичный сезонный объем — идеальный вариант для сумочки, отпуска или в качестве роскошного подарка.',
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
          : 'Максімальны трэвел-фармат. Выдатны аб’ём для любімага парфуму на працяглы час без неабходнасці частага куплі.',
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

  const info = isRemainder ? {
    sprays: 0,
    durationRu: 'Оригинал с коробкой',
    durationBe: 'Арыгінал з каробкай',
    purposeRu: 'Покупка остатка во флаконе — это способ приобрести частично заполненный оригинальный брендовый флакон (обычно с фирменной коробкой). Отличный выбор для коллекционеров и тех, кому эстетика оригинального флакона так же важна, как и сам аромат.',
    purposeBe: 'Купля астатку ва флаконе — гэта спосаб набыць часткова запоўнены арыгінальны брэндавы флакон (звычайна з фірмовай каробкай). Выдатны выбар для калекцыянераў і тых, каму эстэтыка арыгінальнага флакона гэтак жа важная, як і сам ворак.',
    comparisonRu: 'оригинальный стеклянный флакон парфюмерного дома',
    comparisonBe: 'арыгінальны шкляны флакон парфумернага дома',
    comparisonShortRu: 'Флакон бренда',
    comparisonShortBe: 'Флакон брэнда',
    spraysTextRu: 'Родной флакон',
    spraysTextBe: 'Родны флакон',
    liquidHeight: '40%',
    bottleHeight: '90px',
    bottleWidth: '52px',
    compareHeight: '86px',
    compareOffset: '0px'
  } : getGuideInfo(volume);

  return (
    <div className="mt-6 border border-brand-border/40 bg-brand-hover/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-brand-border/20">
        <FlaskConical className="w-3.5 h-3.5 text-brand-accent" />
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light">
          {isRemainder
            ? (language === 'be' ? 'Гід па астатках ва флаконах' : 'Гид по остаткам во флаконах')
            : (language === 'be' ? 'Гід па аб’ёмах адлівантаў' : 'Гид по объемам отливантов')
          }
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Visual Comparison Column */}
        <div className="sm:col-span-5 flex items-center justify-center bg-brand-bg/60 border border-brand-border/20 p-5 min-h-[140px] relative">
          <div className="flex items-end justify-center gap-8 relative h-[120px]">
            {/* Comparison Object */}
            <div className="flex flex-col items-center justify-end relative opacity-60">
              <div 
                className="border border-brand-light/35 border-dashed bg-brand-light/5 relative flex items-center justify-center text-center p-1"
                style={{
                  height: info.compareHeight,
                  width: '40px',
                  borderRadius: '4px',
                  marginBottom: '1px'
                }}
              >
                <span className="text-[7.5px] font-mono text-brand-muted tracking-tighter leading-none select-none">
                  {language === 'be' ? info.comparisonShortBe : info.comparisonShortRu}
                </span>
                <span className="absolute bottom-1 right-1 text-[6px] font-mono text-brand-muted">
                  {info.compareHeight === '86px' ? '86мм' : info.compareHeight === '75px' ? '75мм' : '52мм'}
                </span>
              </div>
              <span className="text-[8px] font-mono text-brand-muted mt-1 select-none whitespace-nowrap">
                {info.compareHeight === '86px' ? '86 мм' : info.compareHeight === '75px' ? '75 мм' : '52 мм'}
              </span>
            </div>

            {/* Connecting reference lines between bottle heights */}
            <div className="absolute left-[30px] right-[30px] bottom-[20px] border-t border-dashed border-brand-accent/25 z-0" />

            {/* Brand Bottle or Atomizer Mockup */}
            <div className="flex flex-col items-center justify-end relative z-10">
              <motion.div 
                layout
                className={`border-2 ${isRemainder ? 'border-brand-accent/85' : 'border-brand-accent'} bg-brand-bg/90 relative flex flex-col items-center justify-end overflow-hidden shadow-[0_0_15px_rgba(202,138,4,0.1)] transition-all duration-300`}
                style={{
                  height: info.bottleHeight,
                  width: info.bottleWidth,
                  borderRadius: isRemainder ? '6px' : '4px',
                  marginBottom: '1px'
                }}
              >
                {/* Cap for normal atomizer */}
                {!isRemainder && (
                  <div className="absolute top-0 left-0 right-0 h-4 bg-brand-accent/20 border-b border-brand-accent/30" />
                )}

                {/* Cap and shoulder design for Remainder Original Bottle */}
                {isRemainder && (
                  <>
                    <div className="absolute top-0 left-[35%] right-[35%] -mt-3 h-3 bg-brand-accent/30 border border-brand-accent/40 rounded-t-[2px]" />
                    <div className="absolute top-0 left-[20%] right-[20%] h-2.5 bg-brand-accent/20 border-b border-brand-accent/30" />
                  </>
                )}

                {/* Liquid fill visual */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: info.liquidHeight }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full bg-gradient-to-t from-brand-accent/30 to-brand-accent/15 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-accent/50 opacity-85" />
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(255,255,255,0.05)_50%,transparent_55%)] bg-[size:250%_250%] animate-pulse" />
                </motion.div>
                
                {/* Text overlay inside shape */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <span className="text-[9px] font-bold font-mono text-brand-light drop-shadow-md tracking-tighter uppercase whitespace-nowrap">
                    {isRemainder 
                      ? (language === 'be' ? 'Астатак' : 'Остаток') 
                      : `${volume} ml`}
                  </span>
                </div>
              </motion.div>

              <span className="text-[8px] font-mono text-brand-accent mt-1 select-none font-bold whitespace-nowrap">
                {isRemainder 
                  ? (language === 'be' ? 'Астатак' : 'Остаток') 
                  : (volume === 2 ? '75 мм' : volume === 5 ? '82 мм' : volume === 10 ? '105 мм' : info.bottleHeight)}
              </span>
            </div>
          </div>
        </div>

        {/* Content & Description Column */}
        <div className="sm:col-span-7 flex flex-col justify-between h-full space-y-3.5">
          <div className="space-y-2">
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-hover/10 p-2.5 border border-brand-border/30">
                <span className="text-[8px] font-mono text-brand-muted uppercase tracking-wider block">
                  {isRemainder ? (language === 'be' ? 'ФАРМАТ ВЫПУСКУ' : 'ФОРМАТ ВЫПУСКА') : (language === 'be' ? 'ОБ’ЁМ РАСПЫЛЕННЯЎ' : 'ОБЪЕМ РАСПЫЛЕНИЙ')}
                </span>
                <span className="text-sm font-semibold text-brand-light font-sans mt-0.5 block truncate">
                  {language === 'be' ? info.spraysTextBe : info.spraysTextRu}
                </span>
              </div>
              <div className="bg-brand-hover/10 p-2.5 border border-brand-border/30">
                <span className="text-[8px] font-mono text-brand-muted uppercase tracking-wider block">
                  {isRemainder ? (language === 'be' ? 'АСАБЛІВАСЦЬ' : 'ОСОБЕННОСТЬ') : (language === 'be' ? 'НА СКОЛЬКІ ХОПІЦЬ' : 'ПРИМЕРНЫЙ СРОК')}
                </span>
                <span className="text-xs font-semibold text-brand-light font-sans mt-0.5 block leading-tight truncate">
                  {language === 'be' ? info.durationBe : info.durationRu}
                </span>
              </div>
            </div>

            {/* Recommended Usage Description */}
            <div className="mt-2.5 pt-1 space-y-1">
              <span className="text-[8px] font-bold text-brand-accent uppercase tracking-wider block">
                {isRemainder ? (language === 'be' ? 'ПРА АСТАТАК ВА ФЛАКОНЕ' : 'ОБ ОСТАТКЕ ВО ФЛАКОНЕ') : (language === 'be' ? 'УЛАСЦІВАСЦІ І ПРЫЗНАЧЭННЕ' : 'РЕКОМЕНДАЦИЯ ПАРФЮМЕРА')}
              </span>
              <p className="text-[11px] text-brand-light/90 leading-relaxed font-light font-serif italic text-balance">
                {language === 'be' ? info.purposeBe : info.purposeRu}
              </p>
            </div>

            {/* Comparison Phrase */}
            <div className="text-[10px] text-brand-muted flex items-start gap-1.5 pt-1.5 border-t border-brand-border/20">
              <Info className="w-3 h-3 text-brand-accent shrink-0 mt-0.5" />
              <span>
                {isRemainder ? (
                  language === 'be' 
                    ? `Пастаўляецца ў арыгінальным шкляным флаконе першапачатковага аб'ёму брэнда (звычайна з фірмовай каробкай).` 
                    : `Поставляется в оригинальном стеклянном флаконе изначального объема бренда (обычно с фирменной коробкой).`
                ) : (
                  <>
                    {language === 'be' 
                      ? `Атамайзер Archetype вышынёй ` 
                      : `Фирменный атомайзер Archetype `}
                    <strong>{language === 'be' ? info.comparisonBe : info.comparisonRu}</strong>.
                  </>
                )}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
