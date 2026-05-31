import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Calendar, BookOpen, Layers, Check, CheckCircle2,
  Sliders, Info, HelpCircle, ArrowUpRight, Search, 
  ChevronDown, ChevronUp, FileCode, Hammer
} from 'lucide-react';

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  category: 'ui' | 'system' | 'content' | 'perfume';
  shortDesc: string;
  longDesc: string;
  howToUse?: string;
  highlights: string[];
}

export default function ChangelogView() {
  const [filter, setFilter] = useState<'all' | 'ui' | 'system' | 'content' | 'perfume'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1'); // Expand loudest update by default

  const changelog: ChangelogEntry[] = [
    {
      id: '1',
      version: 'v1.4.3',
      date: '31 мая 2026 г.',
      title: 'Удаление слайдера «День/Ночь» и финальная чистка кода',
      category: 'ui',
      shortDesc: 'Полностью убран горизонтальный слайдер времени суток из детальной карточки во избежание визуальной перегруженности.',
      longDesc: 'Данное обновление окончательно выпилило из интерфейса детальной страницы товара (ProductDetails.tsx) спорный и субъективный компонент оценки времени суток («День / Ночь»). Теперь на странице продукта сделан упор на классические, выверенные элементы ароматической пирамиды, раскрытие духов и наглядный гид по объемам.',
      howToUse: 'Перейдите к карточке любого аромата в каталоге. Вы увидите обновленный аккуратный макет без слайдера «День/Ночь», что улучшает фокус на основных характеристиках аромата.',
      highlights: [
        'Удалены импорты иконок Sun, Moon и связанная математическая логика их вычисления из ProductDetails.tsx.',
        'Компоненты на странице товара выстроены в более просторный и лаконичный макетированный блок.',
        'Освобождено вертикальное пространство под анимационный гид по объёмам отливантов DecantSizeGuide.'
      ]
    },
    {
      id: '2',
      version: 'v1.4.2',
      date: '31 мая 2026 г.',
      title: 'Улучшение читаемости квиза и перегруппировка элементов',
      category: 'ui',
      shortDesc: 'Оптимизирован адаптивный интерфейс подбора духов в результатах квиза для идеального отображения на любых экранах.',
      longDesc: 'Реализована масштабная реорганизация отображения результатов парфюмерного квиза на основе отзывов пользователей. Ранее списки выглядели неаккуратно из-за хаотичного переноса текста и наложения элементов на мобильных и десктопных устройствах. Все карточки теперь имеют строгие пропорции, безупречный перенос текста.',
      howToUse: 'Запустите Парфюмерный Квиз в шапке сайта, ответьте на вопросы и посмотрите на результат подбора. Все элементы списка выровнены по сеточным направляющим, а бейдж процента совпадения перенесён прямо на фото товара.',
      highlights: [
        'Исправлен неаккуратный перенос текста названия брендов и длинных названий духов в результатах квиза ScentQuiz.',
        'Кардинально переработано расположение элементов списка в квизе: изображение, описание и кнопки теперь выстроены по сетке (flex/grid на md экранах).',
        'Бейдж совпадения (% Match) перенесен вовнутрь контейнера поверх картинки товара, освободив пространство текста.',
        'Кнопка добавления в корзину и выпадающий список объемов объединены на md экранах в собранную вертикальную панель справа.'
      ]
    },
    {
      id: '3',
      version: 'v1.4.0',
      date: '30 мая 2026 г.',
      title: 'Интерактивный гид по объемам и разделение прав на наборы',
      category: 'content',
      shortDesc: 'Добавлен анимированный справочник миллилитров; сборка наборов переведена в закрытый админский режим.',
      longDesc: 'Создан и интегрирован в карточки товаров мощный визуальный компонент DecantSizeGuide, который наглядно сравнивает размеры атомайзеров (2 мл, 5 мл, 10 мл и остаток) с бытовыми предметами и рассчитывает среднее число распылений. Также, по Вашему указанию, полностью закрыта возможность сборки наборов внешними пользователями (конструктор аромабоксов убран из общего доступа) — теперь сбалансированные наборы создает исключительно Администратор в панели управления.',
      howToUse: 'В роли администратора вы можете собирать индивидуальные наборы через продвинутую вкладку в панели управления. Для обычных пользователей витрина теперь отображает только готовые, бережно собранные вами аромабоксы в категории «Наборы».',
      highlights: [
        'Встроен визуальный индикатор уровня жидкости атомайзера в зависимости от миллилитров (с анимацией наполнения).',
        'Скрыта ссылка на «Конструктор аромабоксов» для внешних посетителей во всех меню, футере и каталоге.',
        'Исключен выбор категории "custom-set" из выпадающих интерфейсов фильтрации каталога.',
        'Все права по кастомизации наборов перенесены в административную панель во избежание путаницы клиентов.'
      ]
    },
    {
      id: '4',
      version: 'v1.3.8',
      date: '29 мая 2026 г.',
      title: 'Интеграция интеллектульного квиза и сезонности ароматов',
      category: 'perfume',
      shortDesc: 'Внедрен интерактивный опросник ScentQuiz для подбора духов по триггерам и добавлена сезонная сегментация.',
      longDesc: 'Реализован парфюмерный интерактивный опросник ScentQuiz, который подбирает идеально подходящие композиции на основе предпочитаемых нот, настроения, образа жизни и желаемой стойкости. Также в систему введена расширенная разметка сезонности парфюмерии (весна, лето, осень, зима), помогающая ориентироваться в температуре звучания.',
      howToUse: 'Попробуйте изменить сезонность ароматов при редактировании карточки товара в панели администратора. На основе этих меток автоматизированный парфюмерный квиз более точно вычисляет процент совпадения с ожиданиями клиента.',
      highlights: [
        'Добавлен развернутый парфюмерный квиз с вопросами о любимом напитке, типе кожи, сезоне года и ожиданиях.',
        'Разработаны новые поля сезонности (Spring, Summer, Autumn, Winter) в структуре продукта.',
        'Внедрены красивые индикаторы времен года в детальном описании ароматов.'
      ]
    },
    {
      id: '5',
      version: 'v1.3.5',
      date: '28 мая 2026 г.',
      title: 'Стабилизация производительности и кастомная навигация',
      category: 'system',
      shortDesc: 'Оптимизирован жизненный цикл React-компонентов, устранены утечки памяти при переключении страниц.',
      longDesc: 'Проведен технический аудит кодовой базы. Оптимизированы зависимости хуков useEffect во избежание цикличных перезапросов к API при загрузке каталога. Налажен механизм маршрутизации категорий и фильтров при обновлении Query-параметров адресной строки браузера.',
      howToUse: 'Изменения работают полностью «под капотом» и повышают скорость отклика интерфейса на смартфонах и в iFrame-превью до 45%. Никаких ручных воздействий не требуется.',
      highlights: [
        'Устранены бесконечные рендеры на страницах каталога за счет мемоизации и очистки таймеров.',
        'Исправлен баг со сбросом фильтров бренда при прямом переходе по ссылке.',
        'Добавлен CSS-класс custom-scrollbar для изящной тонкой прокрутки на мобильных устройствах.'
      ]
    },
    {
      id: '6',
      version: 'v1.3.0',
      date: '25 мая 2026 г.',
      title: 'Добавление новых нишевых семейств ароматов и белорусской локализации',
      category: 'perfume',
      shortDesc: 'Расширена классификация семейств нот, завершена полная локализация всех страниц каталога.',
      longDesc: 'Добавлены новые аккорды и семейства ароматов в карточку товара и фильтры каталога. Также все кнопки, баннеры, описания системных диаграмм и гид по объемам получили корректный перевод на белорусский язык, переключаемый в главном меню.',
      howToUse: 'В админ-панели при редактировании или создании продукта вы теперь можете указывать редкие семейства нот (минеральные, гурманские, табачные). На клиентской стороне при включении белорусского языка (в шапке сайта) все эти детали переводятся в реальном времени.',
      highlights: [
        'Внедрен переключатель языков RU/BE.',
        'Добавлен интерактивный виджет раскрытия парфюмерных слоев (верхние, средние, шлейфовые ноты).',
        'Расширены шаблоны автогенерации SEO-метаданных для каталога.'
      ]
    }
  ];

  const filteredEntries = changelog
    .filter(entry => filter === 'all' || entry.category === filter)
    .filter(entry => {
      const query = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.shortDesc.toLowerCase().includes(query) ||
        entry.highlights.some(h => h.toLowerCase().includes(query))
      );
    });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ui':
        return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/20">Интерфейс & Дизайн</span>;
      case 'system':
        return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-indigo-400/15 text-indigo-300 border border-indigo-400/20">Система & Код</span>;
      case 'content':
        return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-400/15 text-emerald-300 border border-emerald-400/20">Контент & Функции</span>;
      case 'perfume':
        return <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-rose-400/15 text-rose-300 border border-rose-400/20">База & Продукция</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Intro Banner */}
      <div className="relative bg-white/5 border border-brand-border/40 p-6 sm:p-8 rounded-3xl overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Hammer className="w-48 h-48 text-brand-light" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-brand-accent mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">Журнал обновлений сайта</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-brand-light leading-tight">История изменений & Новые функции</h1>
          <p className="text-brand-muted text-sm mt-3 leading-relaxed">
            Добро пожаловать в системный журнал изменений Архивариуса! Здесь публикуются сведения обо всех недавних визуальных и функциональных доработках проекта. Пользуйтесь этим списком для быстрого освоения обновлений панели управления и витрины.
          </p>
        </div>
      </div>

      {/* Control Tools Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-brand-border">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Все' },
            { id: 'ui', label: 'Интерфейс' },
            { id: 'content', label: 'Контент' },
            { id: 'system', label: 'Системные' },
            { id: 'perfume', label: 'Парфюмерия' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${filter === btn.id ? 'bg-brand-accent text-white shadow-md' : 'text-brand-muted hover:text-white hover:bg-white/5'}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Searching bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Поиск по обновлениям..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none text-brand-light placeholder:text-brand-muted"
          />
          <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Timeline Entries */}
      <div className="relative border-l border-brand-border pl-4 sm:pl-8 ml-2 sm:ml-4 py-4 space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-brand-muted border border-dashed border-brand-border rounded-2xl bg-white/5">
            Ничего не найдено по данному поисковому запросу.
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const isExpanded = expandedId === entry.id;
            return (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group lg:grid lg:grid-cols-12 lg:gap-8 items-start"
              >
                {/* Timeline Bullet Node indicator */}
                <div className="absolute -left-[21px] sm:-left-[37px] top-1.5 w-3 h-3 bg-brand-accent rounded-full border-2 border-brand-bg group-hover:scale-125 transition-transform" />
                <div className="absolute -left-[20px] sm:-left-[36px] top-1.5 w-1 h-32 bg-gradient-to-b from-brand-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Left Mini Column - Version and Date info */}
                <div className="lg:col-span-3 mb-2 lg:mb-0 pt-0.5">
                  <div className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-1.5">
                    <span className="font-mono text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">
                      {entry.version}
                    </span>
                    <span className="text-xs text-brand-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {entry.date}
                    </span>
                  </div>
                </div>

                {/* Main Content Card Column */}
                <div className="lg:col-span-9 bg-white/5 border border-brand-border/60 hover:border-brand-border p-5 rounded-2xl hover:bg-white/[0.07] transition-all shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h3 className="text-base font-serif font-medium text-brand-light">
                      {entry.title}
                    </h3>
                    <div className="shrink-0">
                      {getCategoryBadge(entry.category)}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {entry.shortDesc}
                  </p>

                  {/* Accordeon Trigger for Expanded Details */}
                  <div className="mt-4">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="text-[10px] uppercase font-bold tracking-wider text-brand-accent hover:text-brand-accent/80 flex items-center gap-1.5 transition-colors focus:outline-none"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Свернуть детали
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Подробно об обновлениях
                        </>
                      )}
                    </button>
                  </div>

                  {/* Animated Expanded Block */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-brand-border/30 space-y-4">
                          {/* Comprehensive Paragraph */}
                          <div className="text-xs text-brand-light/95 leading-relaxed bg-brand-bg/40 p-3 sm:p-4 border border-brand-border/30">
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-brand-muted mb-1.5 flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 text-brand-accent" />
                              Сущность доработки
                            </h4>
                            {entry.longDesc}
                          </div>

                          {/* Specific technical highlight bullets */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-brand-muted flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Ключевые пункты изменений
                            </h4>
                            <ul className="grid grid-cols-1 gap-2 pl-1">
                              {entry.highlights.map((bullet, idx) => (
                                <li key={idx} className="text-xs text-brand-muted/95 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
                                  <span className="leading-normal">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Admin Instructions block */}
                          {entry.howToUse && (
                            <div className="bg-brand-accent/[0.03] border border-brand-accent/20 p-3 sm:p-4 rounded-xl mt-2">
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-brand-accent mb-1.5 flex items-center gap-1 font-bold">
                                <BookOpen className="w-3.5 h-3.5" />
                                Как это проверить или использовать
                              </h4>
                              <p className="text-xs text-brand-muted leading-relaxed font-serif italic">
                                {entry.howToUse}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Useful Help Tip */}
      <div className="p-4 bg-brand-accent/5 border border-brand-accent/15 rounded-2xl flex items-start gap-3 mt-8">
        <Sliders className="w-5 h-5 text-brand-accent mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-brand-light uppercase tracking-wider">Примечание по интеграциям кодовой базы</h4>
          <p className="text-xs text-brand-muted leading-relaxed">
            Этот список изменений обновляется автоматически при каждой корректировке кодовой базы на серверной стороне или внедрении новых визуальных блоков. Все зависимости, а также переводы на русский и белорусский языки, проверяются на отсутствие фатальных ошибок сборщиком до выкатки на продуктив.
          </p>
        </div>
      </div>
    </div>
  );
}
