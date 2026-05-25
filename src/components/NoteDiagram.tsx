import { Note } from '../types';
import { useLanguage } from './LanguageProvider';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Sparkles, Clock, Compass, HelpCircle, Droplet } from 'lucide-react';

interface NoteDiagramProps {
  topNotes: any[];
  heartNotes: any[];
  baseNotes: any[];
  topNotesDuration?: string;
  topNotesDuration_be?: string;
  heartNotesDuration?: string;
  heartNotesDuration_be?: string;
  baseNotesDuration?: string;
  baseNotesDuration_be?: string;
}

interface NoteMetadata {
  desc: string;
  glowBg: string;
  textColor: string;
}

const getNoteMetadata = (noteName: string, lang: 'be' | 'ru'): NoteMetadata => {
  const normalized = noteName.toLowerCase().trim();
  
  // Define metadata dictionary with keywords
  const dict = [
    {
      keywords: ['бергамот', 'bergamot'],
      descRu: 'Искристый, яркий цитрус с пикантной горчинкой, чайной свежестью и благородной терпкостью.',
      descBe: 'Іскрысты, яркі цытрус з пікантнай гарчынкай, гарбатнай свежасцю і шляхецкай даўкасцю.',
      glowBg: 'rgba(234, 179, 8, 0.08)',
      textColor: 'text-amber-400'
    },
    {
      keywords: ['сандал', 'sandalwood'],
      descRu: 'Благородный сливочно-древесный аккорд с мягкими молочными, теплыми и слегка бальзамическими нюансами.',
      descBe: 'Шляхетны сметанкова-драўняны акорд з мяккімі малочнымі, цёплымі і злёгку бальзамічнымі нюансамі.',
      glowBg: 'rgba(217, 119, 6, 0.08)',
      textColor: 'text-amber-500'
    },
    {
      keywords: ['мускус', 'musk'],
      descRu: 'Чувственный, теплый пудрово-телесный шлейф. Придает аромату ощущение невероятной чистоты, стойкости и эффекта «второй кожи».',
      descBe: 'Пачуццёвы, цёплы пудрава-цялесны шлейф. Надае водару адчуванне неверагоднай чысціні, стойкасці і эфекту «другой скуры».',
      glowBg: 'rgba(244, 63, 94, 0.08)',
      textColor: 'text-rose-400'
    },
    {
      keywords: ['амбра', 'amber'],
      descRu: 'Теплый, глубокий смолисто-сладковатый аккорд. Придает всей композиции невероятный объем, манящий восточный характер и стойкость.',
      descBe: 'Цёплы, глыбокі смаліста-саладкавы акорд. Надае ўсёй кампазіцыі неверагодны аб\'ём, вабны ўсходні характар і стойкасць.',
      glowBg: 'rgba(217, 119, 6, 0.1)',
      textColor: 'text-orange-400'
    },
    {
      keywords: ['ваниль', 'vanilla', 'ваніль'],
      descRu: 'Обволакивающий, томно-сладкий гурманский аккорд с теплыми древесно-пряными полутонами и уютной пудрой.',
      descBe: 'Ахінальны, млява-салодкі гурманскі акорд з цёплымі драўняна-рэзкімі паўтонамі і ўтульнай пудрай.',
      glowBg: 'rgba(234, 179, 8, 0.09)',
      textColor: 'text-yellow-400'
    },
    {
      keywords: ['кожа', 'leather', 'скура'],
      descRu: 'Глубокий, респектабельный анималистический аккорд с характером дорогого салона, благородной замши и дымного тепла.',
      descBe: 'Глыбокі, рэспектабельны анімалістычны акорд з характарам дарагога салона, шляхецкай замшы і дымнага цяпла.',
      glowBg: 'rgba(120, 113, 108, 0.12)',
      textColor: 'text-stone-400'
    },
    {
      keywords: ['роза', 'rose', 'ружа'],
      descRu: 'Королевский бархатистый цветочный аккорд — от свежей, утренней росистой бутоньерки до глубокой, медовой россыпи лепестков.',
      descBe: 'Каралеўскі аксаміцісты кветкавы акорд — ад свежай, ранішняй расістай бутаньеркі да глыбокага, мядовага россыпу пялёсткаў.',
      glowBg: 'rgba(236, 72, 103, 0.08)',
      textColor: 'text-pink-450 font-medium'
    },
    {
      keywords: ['жасмин', 'jasmine', 'ясмін', 'жасмін'],
      descRu: 'Пьянящий, чувственный белый цветок с выразительной медовой сладостью, легкой индольностью и весенней свежестью.',
      descBe: 'П\'янкі, пачуццёвы белы кветка з выразнай мядовай салодкасцю, лёгкай індальнасцю і вясновай свежасцю.',
      glowBg: 'rgba(255, 255, 255, 0.08)',
      textColor: 'text-slate-100 font-medium'
    },
    {
      keywords: ['табак', 'tobacco', 'тытунь'],
      descRu: 'Богатый, харизматичный аромат сухих листьев табака, благородных кубинских сигар, с оттенками сухофруктов, вишни и меда.',
      descBe: 'Багаты, харызматычны воні сухога лісця тытуню, шляхецкіх кубінскіх сігар, з адценнямі сухафруктаў, вішні і мёду.',
      glowBg: 'rgba(146, 64, 14, 0.11)',
      textColor: 'text-amber-600'
    },
    {
      keywords: ['уд', 'oud', 'удавае'],
      descRu: 'Редчайшая драгоценная парфюмерная смола. Обладает анималистичным, дымно-древесным, мистическим и невероятно глубоким характером.',
      descBe: 'Рэдкая каштоўная парфумерная смала. Валодае анімалістычным, дымна-драўняным, містычным і неверагодна глыбокім характарам.',
      glowBg: 'rgba(120, 53, 4, 0.12)',
      textColor: 'text-yellow-700 font-bold'
    },
    {
      keywords: ['инжир', 'fig', 'інжыр'],
      descRu: 'Свежий, молочно-зеленый аромат спелых плодов и зеленых листьев инжира. Дарит прохладу, природную терпкость и нежность.',
      descBe: 'Свежы, малочна-зялёны воні спелых пладоў і зялёных лісця інжыра. Дарыць прахалоду, прыродную даўкасць і нішчымнасць.',
      glowBg: 'rgba(16, 185, 129, 0.08)',
      textColor: 'text-emerald-400'
    },
    {
      keywords: ['пачули', 'patchouli', 'пачулі'],
      descRu: 'Глубокий влажно-землистый, немного горьковатый древесный аккорд с изысканным оттенком темного какао и винтажного благородства.',
      descBe: 'Глыбокі вільготна-землісты, крыху гаркаваты драўняны акорд з вытанчаным адценнем цёмнага какава і вінтажнага шляхецтва.',
      glowBg: 'rgba(139, 92, 246, 0.08)',
      textColor: 'text-violet-450 font-medium'
    },
    {
      keywords: ['ветивер', 'vetiver', 'ветывер'],
      descRu: 'Сухой землисто-древесный аккорд с легким дымным, травянистым оттенком и прохладными цитрусовыми нюансами.',
      descBe: 'Сухі зямліста-драўняны акорд з лёгкім дымным, травяністым адценнем і прахалоднымі цытрысавымі нюансамі.',
      glowBg: 'rgba(74, 222, 128, 0.08)',
      textColor: 'text-green-400'
    },
    {
      keywords: ['шафран', 'saffron'],
      descRu: '«Красное золото» парфюмерии: металлически-острый, благородный пряно-кожаный аккорд с теплыми йодистыми и сладкими тонами.',
      descBe: '«Чырвонае золата» парфумерыі: металічна-востры, шляхетны рэзка-скураны акорд з цёплымі ёдзістымі і салодкімі танамі.',
      glowBg: 'rgba(239, 68, 68, 0.08)',
      textColor: 'text-red-400'
    },
    {
      keywords: ['кардамон', 'cardamom'],
      descRu: 'Благородная, прохладная и острая специя с лимонно-эвкалиптовыми, камфорными нюансами и мягким пряным теплом.',
      descBe: 'Шляхетная, прахалодная і вострая спецыя з цытрынава-эўкаліптавымі, камфарнымі нюансамі і мяккім рэзкім цяплом.',
      glowBg: 'rgba(16, 185, 129, 0.08)',
      textColor: 'text-emerald-400'
    },
    {
      keywords: ['кедр', 'cedar', 'кедр'],
      descRu: 'Характерная чистая сухая древесина с хвойными, смолистыми и теплыми карандашно-древесными нюансами.',
      descBe: 'Характэрная чыстая сухая драўніна з іглічнымі, смалістымі і цёплымі алоўкава-драўнянымі нюансамі.',
      glowBg: 'rgba(245, 158, 11, 0.08)',
      textColor: 'text-amber-500'
    },
    {
      keywords: ['ирис', 'iris', 'ірыс'],
      descRu: 'Изысканный пудрово-цветочный аккорд с благородным землисто-корешковым оттенком, создающий ощущение элегантной замши.',
      descBe: 'Вытанчаны пудрава-кветкавы акорд з шляхецкім зямліста-карэньчыкавым адценнем, які стварае адчуванне элегантнай замшы.',
      glowBg: 'rgba(216, 180, 254, 0.09)',
      textColor: 'text-purple-300'
    },
    {
      keywords: ['лаванда', 'lavender'],
      descRu: 'Прохладный, чистый травянисто-цветочный аромат с мягким успокаивающим шлейфом, камфорными и древесными нюансами.',
      descBe: 'Прахалодны, чысты травяніста-кветкавы воні з мяккім заспакаяльным шлейфам, камфарнымі і драўнянымі нюансамі.',
      glowBg: 'rgba(129, 140, 248, 0.08)',
      textColor: 'text-indigo-400'
    },
    {
      keywords: ['миндаль', 'almond', 'міндаль'],
      descRu: 'Аппетитный гурманский аромат с благородной вишнево-косточковой горчинкой и мягкой кремовой сладостью.',
      descBe: 'Апетытны гурманскі воні з шляхецкай вішнёва-костачкавай гарчынкай і мяккай крэмавай салодкасцю.',
      glowBg: 'rgba(251, 146, 60, 0.08)',
      textColor: 'text-orange-300'
    },
    {
      keywords: ['слива', 'plum', 'сліва'],
      descRu: 'Густой, томный и бархатистый фруктовый аккорд темной медовой сливы с приятной пикантной кислинкой.',
      descBe: 'Густы, млявы і аксаміцісты фруктовы акорд цёмнай мядовай слівы з прыемнай пікантнай кіслінкай.',
      glowBg: 'rgba(168, 85, 247, 0.08)',
      textColor: 'text-purple-400'
    },
    {
      keywords: ['лайм', 'лимон', 'грейпфрут', 'цитрус', 'lime', 'lemon', 'grapefruit', 'citrus', 'лайм', 'лімон', 'грэйпфрут', 'цытрус'],
      descRu: 'Энергичный, брызжущий свежестью цитрусовый заряд, пробуждающий чувства яркой кислинкой и бодрящей терпкой цедрой.',
      descBe: 'Энергічны цытрусавы зарад, які абуджае пачуцці яркай кіслінкай і бадзёрай даўкай цэдрай.',
      glowBg: 'rgba(132, 204, 22, 0.08)',
      textColor: 'text-lime-400'
    },
    {
      keywords: ['мох', 'oakmoss', 'імшар'],
      descRu: 'Сырой или дубовый лесной мох придает композиции глубокий влажный лесной характер, классический шипровый дух, таинственную горечь.',
      descBe: 'Дубовы або лясны мох надае кампазіцыі глыбокі вільготны лясны характар, класічны шыправы дух, таямнічую горыч.',
      glowBg: 'rgba(101, 163, 80, 0.08)',
      textColor: 'text-green-500'
    },
    {
      keywords: ['нероли', 'neroli'],
      descRu: 'Благородный аромат цветов горького апельсина — солнечно-теплый, медовый, со свежей горчинкой цитрусовой листвы.',
      descBe: 'Шляхетны воні кветак горкага апельсіна — сонечна-цёплы, мядовы, са свежай гарчынкай цытрусавай лістоты.',
      glowBg: 'rgba(253, 224, 71, 0.08)',
      textColor: 'text-yellow-300'
    },
    {
      keywords: ['бобы тонка', 'tonka'],
      descRu: 'Сладкие тропические семена с многогранным гурманским характером — смесь теплого миндаля, свежескошенного сена, корицы и ванили.',
      descBe: 'Салодкія трапічныя насенне з шматгранным гурманскім характарам — сумесь цёплага міндаля, свежаскошанага сена, карыцы і ванілі.',
      glowBg: 'rgba(180, 83, 9, 0.1)',
      textColor: 'text-amber-500'
    },
    {
      keywords: ['малина', 'raspberry', 'маліна'],
      descRu: 'Яркий, сочный и жизнерадостный ягодный аккорд со сладким, бархатистым звучанием и легкой летней прохладой.',
      descBe: 'Яркі, сакавіты і жыццярадасны ягадны акорд з салодкім аксаміцістым гучаннем і лёгкай летняй прахалодай.',
      glowBg: 'rgba(244, 114, 182, 0.08)',
      textColor: 'text-pink-400'
    },
    {
      keywords: ['черная смородина', 'смородина', 'blackcurrant', 'парэчкі'],
      descRu: 'Терпкий, кисло-сладкий ягодный аккорд со свежим зеленым ароматом растертых смородиновых листьев.',
      descBe: 'Характэрны даўкі, кісла-салодкі ягадны акорд са свежым зялёным воні расцёртых смародзінавых лісця.',
      glowBg: 'rgba(109, 40, 217, 0.08)',
      textColor: 'text-violet-500'
    }
  ];

  for (const entry of dict) {
    if (entry.keywords.some(k => normalized.includes(k))) {
      return {
        desc: lang === 'be' ? entry.descBe : entry.descRu,
        glowBg: entry.glowBg,
        textColor: entry.textColor
      };
    }
  }

  // Fallback if not found
  return {
    desc: lang === 'be'
      ? `Каштоўны інгрэдыент «${noteName}», які стварае непаўторнае гучанне і дапамагае кампазіцыі раскрыцца ва ўсей прыгажосці.`
      : `Благородный ингредиент «${noteName}», который формирует индивидуальное звучание аромата и придает композиции объем.`,
    glowBg: 'rgba(255, 255, 255, 0.03)',
    textColor: 'text-brand-light'
  };
};

export default function NoteDiagram({ 
  topNotes, 
  heartNotes, 
  baseNotes,
  topNotesDuration,
  topNotesDuration_be,
  heartNotesDuration,
  heartNotesDuration_be,
  baseNotesDuration,
  baseNotesDuration_be
}: NoteDiagramProps) {
  const { language } = useLanguage();
  const [activeTier, setActiveTier] = useState<'top' | 'heart' | 'base'>('top');
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

  const getNoteName = (n: any) => {
    if (!n) return '';
    if (typeof n === 'string') return n;
    return language === 'be' && n.name_be ? n.name_be : n.name;
  };

  const getCleanNotesList = (notesList: any[]) => {
    return (notesList || []).map(getNoteName).filter(Boolean);
  };

  const activeNotes = getCleanNotesList(
    activeTier === 'top' ? topNotes : activeTier === 'heart' ? heartNotes : baseNotes
  );

  const tierMetadata = {
    top: {
      titleRu: 'Верхние ноты',
      titleBe: 'Верхнія ноты',
      subtitleRu: 'Создают мгновенное первое впечатление',
      subtitleBe: 'Ствараюць імгненнае першае ўражанне',
      timeRu: topNotesDuration || 'Звучат первые 10–15 минут',
      timeBe: topNotesDuration_be || 'Гучаць першыя 10–15 хвілін',
      accentColor: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5',
      glow: 'rgba(234, 179, 8, 0.05)'
    },
    heart: {
      titleRu: 'Ноты сердца',
      titleBe: 'Сярэднія ноты',
      subtitleRu: 'Определяют истинный характер и темперамент',
      subtitleBe: 'Вызначаюць сапраўдны характар і тэмперамент',
      timeRu: heartNotesDuration || 'Звучат на протяжении 2–4 часов',
      timeBe: heartNotesDuration_be || 'Гучаць на працягу 2–4 гадзін',
      accentColor: 'border-pink-500/30 text-pink-450 bg-pink-500/5',
      glow: 'rgba(236, 72, 103, 0.05)'
    },
    base: {
      titleRu: 'Базовые ноты (Шлейф)',
      titleBe: 'Базавыя ноты (Шлейф)',
      subtitleRu: 'Мягко фиксируют аромат на вашей коже',
      subtitleBe: 'Мякка фіксуюць водар на вашай скуры',
      timeRu: baseNotesDuration || 'Шлейф раскрывается до 10–12 часов',
      timeBe: baseNotesDuration_be || 'Шлейф раскрываецца да 10–12 гадзін',
      accentColor: 'border-amber-500/30 text-amber-500 bg-amber-500/5',
      glow: 'rgba(217, 119, 6, 0.05)'
    }
  };

  const activeMeta = tierMetadata[activeTier];
  const info = hoveredNote ? getNoteMetadata(hoveredNote, language) : null;

  const getTopButtonText = () => {
    if (language === 'be') {
      if (topNotesDuration_be) {
        return topNotesDuration_be.replace(/^(Гучаць першыя|Гучаць на працягу|Шлейф раскрываецца да)\s+/gi, '').toUpperCase();
      }
      return '0–15 ХВІЛІН';
    } else {
      if (topNotesDuration) {
        return topNotesDuration.replace(/^(Звучат первые|Звучат на протяжении|Шлейф раскрывается до)\s+/gi, '').toUpperCase();
      }
      return '0–15 МИНУТ';
    }
  };

  const getHeartButtonText = () => {
    if (language === 'be') {
      if (heartNotesDuration_be) {
        return heartNotesDuration_be.replace(/^(Гучаць першыя|Гучаць на працягу|Шлейф раскрываецца да)\s+/gi, '').toUpperCase();
      }
      return '2–4 ГАДЗІНЫ';
    } else {
      if (heartNotesDuration) {
        return heartNotesDuration.replace(/^(Звучат первые|Звучат на протяжении|Шлейф раскрывается до)\s+/gi, '').toUpperCase();
      }
      return '2–4 ЧАСА';
    }
  };

  const getBaseButtonText = () => {
    if (language === 'be') {
      if (baseNotesDuration_be) {
        return baseNotesDuration_be.replace(/^(Гучаць першыя|Гучаць на працягу|Шлейф раскрываецца да)\s+/gi, '').toUpperCase();
      }
      return 'ДА 12 ГАДЗІН';
    } else {
      if (baseNotesDuration) {
        return baseNotesDuration.replace(/^(Звучат первые|Звучат на протяжении|Шлейф раскрывается до)\s+/gi, '').toUpperCase();
      }
      return 'ДО 12 ЧАСОВ';
    }
  };

  return (
    <motion.div
      className="border border-brand-border/60 bg-brand-hover/5 rounded-none p-6 md:p-8 relative overflow-hidden transition-all duration-500"
      style={{
        background: info
          ? `radial-gradient(circle at 50% 120%, ${info.glowBg} 0%, rgba(17,17,17,0.2) 70%, transparent 100%)`
          : `radial-gradient(circle at 50% 120%, ${activeMeta.glow} 0%, rgba(17,17,17,0.1) 75%, transparent 100%)`
      }}
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border/30">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-brand-accent" />
            {language === 'be' ? 'Эксклюзіўны аналіз водару' : 'Эксклюзивный анализ аромата'}
          </h3>
          <p className="text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">
            {language === 'be' ? 'Мультысенсарная піраміда' : 'Мультисенсорная пирамида раскрытия'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-muted bg-brand-bg px-2 py-0.5 border border-brand-border/40">
          <Clock className="w-3 h-3" />
          <span>{language === 'be' ? 'ЧАС РАСКРЫЦЦЯ' : 'ВРЕМЯ РАСКРЫТИЯ'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Pyramid Selector column */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative py-4">
          <div className="w-full flex flex-col gap-3 relative max-w-[280px]">
            {/* Pyramid Level 3 (Top) */}
            <button
               onClick={() => { setActiveTier('top'); setHoveredNote(null); }}
              className={`relative h-14 w-full flex flex-col items-center justify-center border transition-all duration-300 ${
                activeTier === 'top'
                  ? 'bg-yellow-500/10 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.15)] text-brand-light'
                  : 'bg-brand-bg/40 border-brand-border/60 text-brand-muted hover:border-yellow-500/30 hover:bg-brand-hover/5'
              }`}
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                paddingLeft: '20%',
                paddingRight: '20%'
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {language === 'be' ? 'ВЕРХНІЯ' : 'ВЕРХНИЕ'}
              </span>
              <span className="text-[8px] font-mono tracking-wider opacity-80 mt-1">
                {getTopButtonText()}
              </span>
            </button>

            {/* Pyramid Level 2 (Heart) */}
            <button
              onClick={() => { setActiveTier('heart'); setHoveredNote(null); }}
              className={`relative h-16 w-full flex flex-col items-center justify-center border transition-all duration-300 ${
                activeTier === 'heart'
                  ? 'bg-pink-500/10 border-pink-500/60 shadow-[0_0_15px_rgba(236,72,103,0.15)] text-brand-light'
                  : 'bg-brand-bg/40 border-brand-border/60 text-brand-muted hover:border-pink-500/30 hover:bg-brand-hover/5'
              }`}
              style={{
                clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                paddingLeft: '10%',
                paddingRight: '10%'
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {language === 'be' ? 'СЯРЭДНІЯ' : 'СЕРДЦЕ'}
              </span>
              <span className="text-[8px] font-mono tracking-wider opacity-80 mt-1">
                {getHeartButtonText()}
              </span>
            </button>

            {/* Pyramid Level 1 (Base) */}
            <button
              onClick={() => { setActiveTier('base'); setHoveredNote(null); }}
              className={`relative h-18 w-full flex flex-col items-center justify-center border transition-all duration-300 ${
                activeTier === 'base'
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_15px_rgba(217,119,6,0.15)] text-brand-light'
                  : 'bg-brand-bg/40 border-brand-border/60 text-brand-muted hover:border-amber-500/30 hover:bg-brand-hover/5'
              }`}
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {language === 'be' ? 'БАЗАВЫЯ' : 'БАЗА / ШЛЕЙФ'}
              </span>
              <span className="text-[8px] font-mono tracking-wider opacity-80 mt-1">
                {getBaseButtonText()}
              </span>
            </button>
          </div>
        </div>

        {/* Detailed Description Column */}
        <div className="md:col-span-7 space-y-5 flex flex-col justify-between h-full min-h-[220px]">
          <div>
            {/* Upper active tier status */}
            <div className="space-y-1">
              <span className={`inline-flex items-center px-2 py-0.5 border text-[9px] font-mono uppercase tracking-widest ${activeMeta.accentColor}`}>
                {language === 'be' ? activeMeta.titleBe : activeMeta.titleRu}
              </span>
              <p className="text-xs text-brand-light font-serif mt-1.5 leading-tight">
                {language === 'be' ? activeMeta.subtitleBe : activeMeta.subtitleRu}
              </p>
              <p className="text-[10px] text-brand-muted uppercase tracking-wider font-mono">
                {language === 'be' ? activeMeta.timeBe : activeMeta.timeRu}
              </p>
            </div>

            {/* List of active notes */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {activeNotes.map((name, idx) => (
                <button
                  key={idx}
                  onMouseEnter={() => setHoveredNote(name)}
                  onMouseLeave={() => setHoveredNote(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoveredNote(prev => prev === name ? null : name);
                  }}
                  className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] transition-all duration-200 flex items-center gap-1.5 border ${
                    hoveredNote === name
                      ? 'border-brand-accent bg-brand-accent/10 text-white scale-105'
                      : 'border-brand-border/60 bg-brand-bg hover:border-brand-light/40 text-brand-light/90'
                  }`}
                >
                  <Droplet className={`w-2.5 h-2.5 transition-all ${hoveredNote === name ? 'text-brand-accent scale-125' : 'text-brand-muted'}`} />
                  {name}
                </button>
              ))}
              {activeNotes.length === 0 && (
                <span className="text-xs text-brand-muted italic">
                  {language === 'be' ? 'Звесткі пра гэты ўзровень адсутнічаюць' : 'Информация на данном уровне отсутствует'}
                </span>
              )}
            </div>
          </div>

          {/* Interactive contextual footer displaying notes detail description */}
          <div className="border-t border-brand-border/30 pt-4 mt-auto">
            <AnimatePresence mode="wait">
              {hoveredNote && info ? (
                <motion.div
                  key={hoveredNote}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className="space-y-1"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-accent flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                    {hoveredNote}
                  </p>
                  <p className="text-[11px] text-brand-light leading-relaxed font-light font-serif italic">
                    {info.desc}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  className="flex items-start gap-2.5"
                >
                  <HelpCircle className="w-4 h-4 text-brand-muted/70 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-brand-muted leading-relaxed font-light">
                    {language === 'be'
                      ? 'Націсніце на любы інгрэдыент вышэй, каб акунуцца ў апісанне яго араматычных уласцівасцей і адчуць раскрыццё.'
                      : 'Нажмите на любой ингредиент выше, чтобы погрузиться в описание его ароматических свойств и почувствовать раскрытие.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
