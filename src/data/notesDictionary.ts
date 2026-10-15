/**
 * Fragrance note translations EN -> RU/BE.
 * Keys are lowercase English note names as they appear in the reference
 * dataset (Parfumo-derived). Missing notes stay in English in the form
 * and can be translated by hand.
 */
export const NOTES_RU: Record<string, string> = {
  // citrus
  'bergamot': 'Бергамот', 'lemon': 'Лимон', 'lime': 'Лайм', 'grapefruit': 'Грейпфрут',
  'mandarin orange': 'Мандарин', 'mandarin': 'Мандарин', 'orange': 'Апельсин', 'bitter orange': 'Горький апельсин',
  'sweet orange': 'Сладкий апельсин', 'citrus': 'Цитрусы',
  'yuzu': 'Юдзу', 'petitgrain': 'Петитгрейн', 'neroli': 'Нероли', 'citruses': 'Цитрусы',
  'blood orange': 'Кровавый апельсин', 'bergamot leaf': 'Лист бергамота', 'clementine': 'Клементин',
  // fruits
  'apple': 'Яблоко', 'red apple': 'Красное яблоко', 'pear': 'Груша', 'peach': 'Персик',
  'apricot': 'Абрикос', 'plum': 'Слива', 'cherry': 'Вишня', 'sour cherry': 'Кислая вишня',
  'black cherry': 'Черешня', 'raspberry': 'Малина', 'blackberry': 'Ежевика', 'strawberry': 'Клубника',
  'blueberry': 'Черника', 'currants': 'Смородина', 'black currant': 'Чёрная смородина',
  'watermelon': 'Арбуз', 'melon': 'Дыня', 'pineapple': 'Ананас', 'mango': 'Манго',
  'papaya': 'Папайя', 'banana': 'Банан', 'coconut': 'Кокос', 'fig': 'Инжир',
  'pomegranate': 'Гранат', 'grapefruit blossom': 'Цвет грейпфрута', 'lychee': 'Личи',
  'passionfruit': 'Маракуйя', 'kiwi': 'Киви', 'quince': 'Айва', 'guava': 'Гуава',
  // flowers
  'rose': 'Роза', 'damask rose': 'Дамасская роза', 'may rose': 'Майская роза', 'jasmine': 'Жасмин',
  'sambac jasmine': 'Жасмин самбак', 'lily': 'Лилия', 'lily-of-the-valley': 'Ландыш',
  'peony': 'Пион', 'iris': 'Ирис', 'violet': 'Фиалка', 'tulip': 'Тюльпан',
  'magnolia': 'Магнолия', 'gardenia': 'Гардения', 'tuberose': 'Тубероза', 'orchid': 'Орхидея',
  'freesia': 'Фрезия', 'geranium': 'Герань', 'lavender': 'Лаванда', 'ylang-ylang': 'Иланг-иланг',
  'mimosa': 'Мимоза', 'honeysuckle': 'Жимолость', 'cyclamen': 'Цикламен', 'narcissus': 'Нарцисс',
  'osmanthus': 'Османтус', 'frangipani': 'Франжипани', 'hibiscus': 'Гибискус', 'lotus': 'Лотос',
  'chamomile': 'Ромашка', 'marigold': 'Ноготки', 'carnation': 'Гвоздика', 'wisteria': 'Глициния',
  'orange blossom': 'Флёрдоранж', 'elderflower': 'Бузина', 'acacia': 'Акация', 'hyacinth': 'Гиацинт',
  'heliotrope': 'Гелиотроп', 'immortelle': 'Бессмертник', 'sesame flower': 'Цветок кунжута',
  // white flowers
  'white flowers': 'Белые цветы', 'floral notes': 'Цветочные ноты', 'indolian flowers': 'Индольные цветы',
  // greens & herbs
  'mint': 'Мята', 'peppermint': 'Перечная мята', 'basil': 'Базилик', 'sage': 'Шалфей',
  'clary sage': 'Мускатный шалфей', 'thyme': 'Тимьян', 'rosemary': 'Розмарин', 'oregano': 'Орегано',
  'tarragon': 'Эстрагон', 'dill': 'Укроп', 'lavender absolute': 'Абсолют лаванды',
  'grass': 'Трава', 'green notes': 'Зелёные ноты', 'green leaves': 'Зелёные листья',
  'tea': 'Чай', 'green tea': 'Зелёный чай', 'black tea': 'Чёрный чай', 'white tea': 'Белый чай',
  'mate': 'Мате', 'bamboo': 'Бамбук', 'cucumber': 'Огурец', 'galbanum': 'Гальбанум',
  'fig leaf': 'Лист инжира', 'tomato leaf': 'Лист томата', 'violet leaf': 'Лист фиалки',
  'eucalyptus': 'Эвкалипт', 'pine tree needles': 'Хвоя сосны', 'fir': 'Пихта', 'spruce': 'Ель',
  // spices
  'cinnamon': 'Корица', 'cardamom': 'Кардамон', 'black cardamom': 'Чёрный кардамон',
  'pink pepper': 'Розовый перец', 'black pepper': 'Чёрный перец', 'white pepper': 'Белый перец',
  'pepper': 'Перец', 'nutmeg': 'Мускатный орех', 'clove': 'Гвоздика (специя)', 'ginger': 'Имбирь',
  'saffron': 'Шафран', 'vanilla': 'Ваниль', 'bourbon vanilla': 'Бурбонская ваниль',
  'anis': 'Анис', 'star anise': 'Бадьян', 'fennel': 'Фенхель', 'cumin': 'Кумин',
  'coriander': 'Кориандр', 'juniper berries': 'Можжевеловые ягоды', 'tonka bean': 'Бобы тонка',
  'bay leaf': 'Лавровый лист', 'licorice': 'Лакрица', 'liquorice': 'Лакрица', 'cacao': 'Какао',
  'caraway': 'Тмин', 'paprika': 'Паприка', 'curry': 'Карри', 'nut meg': 'Мускатный орех',
  // woods
  'sandalwood': 'Сандал', 'cedar': 'Кедр', 'cedarwood': 'Кедр', 'virginia cedar': 'Виргинский кедр',
  'cedrat': 'Цедра', 'patchouli': 'Пачули', 'vetiver': 'Ветивер', 'haitian vetiver': 'Гаитянский ветивер',
  'oud': 'Уд', 'agarwood': 'Агар', 'oak': 'Дуб', 'oakmoss': 'Дубовый мох', 'birch': 'Берёза',
  'birch tar': 'Берёзовый дёготь', 'guaiac wood': 'Гваяковое дерево', 'gaiac wood': 'Гваяковое дерево',
  'palo santo': 'Пало санто', 'ebony wood': 'Чёрное дерево', 'rosewood': 'Палисандр',
  'teak wood': 'Тик', 'bamboo wood': 'Бамбук', 'driftwood': 'Коряга', 'pinewood': 'Сосна',
  'cashmeran': 'Кашмеран', 'suede': 'Замша', 'leather': 'Кожа', 'suede accord': 'Аккорд замши',
  // resins & balsams
  'amber': 'Янтарь', 'ambergris': 'Амбра', 'ambroxan': 'Амброксан', 'benzoin': 'Бензоин',
  'labdanum': 'Лабданум', 'opoponax': 'Опопонакс', 'frankincense': 'Ладан', 'myrrh': 'Мирра',
  'incense': 'Благовония', 'elemi': 'Элеми', 'copal': 'Копал', 'peru balsam': 'Перуанский бальзам',
  'tolu balsam': 'Толуанский бальзам', 'storax': 'Стиракс', 'cashmere wood': 'Кашемировое дерево',
  'amberwood': 'Янтарное дерево', 'amberwood accord': 'Аккорд янтарного дерева',
  // musk & animalic
  'musk': 'Мускус', 'white musk': 'Белый мускус', 'ambrette': 'Амбретта', 'castoreum': 'Кастореум',
  'civet': 'Циветта', 'animalic notes': 'Анималистичные ноты',
  // gourmand
  'coffee': 'Кофе', 'espresso': 'Эспрессо', 'chocolate': 'Шоколад', 'dark chocolate': 'Тёмный шоколад',
  'caramel': 'Карамель', 'toffee': 'Тоффи', 'honey': 'Мёд', 'honeycomb': 'Медовые соты',
  'sugar': 'Сахар', 'vanilla orchid': 'Ванильная орхидея', 'cream': 'Сливки', 'milk': 'Молоко',
  'condensed milk': 'Сгущённое молоко', 'praline': 'Пралине', 'nougat': 'Нуга', 'marzipan': 'Марципан',
  'almond': 'Миндаль', 'hazelnut': 'Фундук', 'pistachio': 'Фисташки', 'walnut': 'Грецкий орех',
  'peanut butter': 'Арахисовая паста', 'rum': 'Ром', 'whiskey': 'Виски', 'cognac': 'Коньяк',
  'champagne': 'Шампанское', 'wine': 'Вино', 'red wine': 'Красное вино', 'brandy': 'Бренди',
  'liqueur': 'Ликёр', 'marshmallow': 'Зефир', 'meringue': 'Меренга', 'cupcake': 'Капкейк',
  'popcorn': 'Попкорн', 'panna cotta': 'Панна-котта', 'cheesecake': 'Чизкейк', 'macaron': 'Макарон',
  'candy': 'Конфеты', 'cotton candy': 'Сахарная вата', 'jam': 'Джем', 'marmalade': 'Мармелад',
  'cocoa': 'Какао', 'chocolate truffle': 'Шоколадный трюфель', 'coffee bean': 'Кофейные зёрна',
  'tiramisu': 'Тирамису', 'custard': 'Крем', 'whipped cream': 'Взбитые сливки',
  // boozy/smoky/other
  'smoky notes': 'Дымные ноты', 'smoke': 'Дым', 'tobacco': 'Табак', 'tobacco leaf': 'Лист табака',
  'rum absolute': 'Абсолют рома', 'gunpowder': 'Порох', 'gasoline': 'Бензин', 'rubber': 'Резина',
  'sea notes': 'Морские ноты', 'sea water': 'Морская вода', 'salt': 'Соль', 'sea salt': 'Морская соль',
  'ozone': 'Озон', 'rain': 'Дождь', 'petrichor': 'Петрикор', 'air notes': 'Воздушные ноты',
  'mineral notes': 'Минеральные ноты', 'stone': 'Камень', 'flint': 'Кремень', 'metal': 'Металл',
  'paper': 'Бумага', 'ink': 'Чернила', 'earth': 'Земля', 'wet earth': 'Влажная земля',
  'truffle': 'Трюфель', 'mushroom': 'Гриб', 'woody notes': 'Древесные ноты',
  'spicy notes': 'Пряные ноты', 'sweet notes': 'Сладкие ноты', 'fresh notes': 'Свежие ноты',
  'powdery notes': 'Пудровые ноты', 'aromatic notes': 'Ароматические ноты',
  'aquatic notes': 'Акватические ноты', 'gourmand notes': 'Гурманские ноты',
  'leathery notes': 'Кожаные ноты', 'smoky': 'Дымный', 'creamy': 'Сливочный',
  'aldehydes': 'Альдегиды', 'soapy notes': 'Мыльные ноты', 'yeast': 'Дрожжи',
  // accords
  'sweet': 'Сладкий', 'spicy': 'Пряный', 'woody': 'Древесный', 'fresh': 'Свежий',
  'citrusy': 'Цитрусовый', 'fruity': 'Фруктовый', 'floral': 'Цветочный', 'powdery': 'Пудровый',
  'leathery': 'Кожаный', 'smoky accord': 'Дымный', 'oriental': 'Восточный', 'aquatic': 'Акватический',
  'green': 'Зелёный', 'aromatic': 'Ароматический', 'gourmand': 'Гурманский', 'musky': 'Мускусный',
  'creamy accord': 'Сливочный', 'synthetic': 'Синтетический', 'warm spicy': 'Тёплый пряный',
  'balsamic': 'Бальзамический', 'earthy': 'Землистый', 'mineral': 'Минеральный',
  'tropical': 'Тропический', 'white floral': 'Белый цветочный', 'yellow floral': 'Жёлтый цветочный',
  'frankincense resin': 'Смола ладана', 'ambrette seed': 'Семена амбретты',
  'madagascar pepper': 'Мадагаскарский перец', 'chinotto': 'Кинотто', 'provençal lavender': 'Прованская лаванда',
  'coumarin': 'Кумарин', 'ambrofix': 'Амброфикс', 'akigalawood': 'Акигалавуд',
  'georgywood': 'Джордживуд', 'pepperwood': 'Перечное дерево', 'canary islands juniper': 'Можжевельник Канар',
  'gaiac': 'Гваяк', 'indonesian patchouli': 'Индонезийские пачули',
  'hawthorn': 'Боярышник', 'broom': 'Дрок', 'buckwheat': 'Гречиха', 'cypress': 'Кипарис',
  'juniper': 'Можжевельник', 'myrtle': 'Мирт', 'boxwood': 'Самшит', 'chestnut': 'Каштан',
  'almond tree': 'Миндальное дерево', 'olive tree': 'Оливковое дерево', 'fig tree': 'Инжирное дерево',
  'red berries': 'Красные ягоды', 'berries': 'Ягоды', 'wild berries': 'Лесные ягоды',
  'dried fruits': 'Сухофрукты', 'raisins': 'Изюм', 'dates': 'Финики', 'prune': 'Чернослив',
  'cognac absolute': 'Абсолют коньяка', 'beeswax': 'Пчелиный воск',  'hay': 'Сено', 'straw': 'Солома', 'tobacco blossom': 'Цвет табака', 'vanilla pod': 'Стручок ванили',
  // frequently missed variants
  'woods': 'Древесные ноты', 'wood': 'Древесина', 'woody accord': 'Древесный аккорд',
  'musk accord': 'Мускусный аккорд', 'amber accord': 'Янтарный аккорд',
  'green accord': 'Зелёный аккорд', 'spices': 'Специи', 'herbs': 'Травы',
  'citrus notes': 'Цитрусовые ноты', 'fruity notes': 'Фруктовые ноты',
  'red berries accord': 'Аккорд красных ягод', 'red fruits': 'Красные фрукты',
  'tonka': 'Тонка', 'ambrox': 'Амброкс', 'iso e super': 'Iso E Super',
  'hedione': 'Гедион', 'cashmeran velvet': 'Кашмеран', 'norlimbanol': 'Норлимбанол',
  'timbersilk': 'Тимберсилк', 'ketone musk': 'Мускусный кетон',
  'pear accord': 'Аккорд груши', 'litchi': 'Личи', 'lychee accord': 'Аккорд личи',
  'mandarin zest': 'Цедра мандарина', 'lemon zest': 'Цедра лимона',
  'calone': 'Калон', 'sea breeze accord': 'Аккорд морского бриза',
  'powdery iris': 'Пудровый ирис', 'iris butter': 'Ирисовый абсолют',
  'vanilla bourbon': 'Бурбонская ваниль', 'white chocolate': 'Белый шоколад',
  'pineapple accord': 'Аккорд ананаса', 'blackcurrant': 'Чёрная смородина',
  'black currant accord': 'Аккорд чёрной смородины', 'bergamot zest': 'Цедра бергамота',
  'fir resin': 'Смола пихты', 'pine resin': 'Сосновая смола', 'resins': 'Смолы',
  'tobacco accord': 'Табачный аккорд', 'coffee accord': 'Кофейный аккорд',
  'chocolate accord': 'Шоколадный аккорд', 'rum accord': 'Ромовый аккорд',
};

/** Belarusian translations for the most common notes; missing -> empty (falls back to RU). */
export const NOTES_BE: Record<string, string> = {
  'bergamot': 'Бергамот', 'lemon': 'Лімон', 'lime': 'Лайм', 'grapefruit': 'Грэйпфрут',
  'mandarin orange': 'Мандарын', 'orange': 'Апельсін', 'citrus': 'Цытрус', 'yuzu': 'Юдзу',
  'apple': 'Яблык', 'pear': 'Груша', 'peach': 'Персік', 'plum': 'Сліва', 'cherry': 'Вішня',
  'raspberry': 'Маліна', 'blackberry': 'Ажына', 'strawberry': 'Суніца', 'pineapple': 'Ананас',
  'mango': 'Манга', 'coconut': 'Какос', 'fig': 'Інжыр', 'pomegranate': 'Гранат',
  'rose': 'Ружа', 'jasmine': 'Ясмін', 'lily': 'Лілея', 'peony': 'Піён', 'iris': 'Ірыс',
  'violet': 'Фіялка', 'magnolia': 'Магнолія', 'gardenia': 'Гардэнія', 'tuberose': 'Тубероза',
  'geranium': 'Герань', 'lavender': 'Лаванда', 'ylang-ylang': 'Іланг-іланг', 'mimosa': 'Мімоза',
  'mint': 'Мята', 'basil': 'Базілік', 'sage': 'Шалфей', 'tea': 'Чай', 'green tea': 'Зялёны чай',
  'eucalyptus': 'Эўкаліпт', 'cinnamon': 'Карыца', 'cardamom': 'Кардамон', 'pink pepper': 'Ружовы перац',
  'black pepper': 'Чорны перац', 'nutmeg': 'Мускатны арэх', 'ginger': 'Імбір', 'saffron': 'Шафран',
  'vanilla': 'Ваніль', 'tonka bean': 'Бабы тонка', 'licorice': 'Лакрыца', 'liquorice': 'Лакрыца',
  'sandalwood': 'Сандал', 'cedar': 'Кедр', 'cedarwood': 'Кедр', 'patchouli': 'Пачулі',
  'vetiver': 'Вецівер', 'oud': 'Уд', 'oakmoss': 'Дубовы мох', 'leather': 'Скура', 'suede': 'Замша',
  'amber': 'Янтарь', 'ambergris': 'Амбра', 'ambroxan': 'Амброксан', 'benzoin': 'Бензоин',
  'labdanum': 'Лабданум', 'frankincense': 'Ладан', 'myrrh': 'Міра', 'incense': 'Фіміярам',
  'musk': 'Мускус', 'white musk': 'Белы мускус', 'coffee': 'Кава', 'chocolate': 'Шакалад',
  'caramel': 'Карамель', 'honey': 'Мёд', 'almond': 'Мігдаль', 'hazelnut': 'Ляшчына',
  'rum': 'Ром', 'whiskey': 'Віскі', 'cognac': 'Каньяк', 'champagne': 'Шампанскае',
  'tobacco': 'Тытунь', 'sea salt': 'Марская соль', 'smoke': 'Дым',
  'sweet': 'Салодкі', 'spicy': 'Рэзкі', 'woody': 'Драўняны', 'fresh': 'Свежы',
  'fruity': 'Фруктовы', 'floral': 'Кветкавы', 'powdery': 'Пудравы', 'leathery': 'Скураны',
  'oriental': 'Усходні', 'green': 'Зялёны', 'gourmand': 'Гурманскі',

  'woods': 'Драўняныя ноты', 'spices': 'Спецыі', 'tonka': 'Тонка',
};

/** Word-level fallback for compound names not in the dictionary. */
const WORDS_RU: Record<string, string> = {
  'red': 'Красное', 'pink': 'Розовый', 'black': 'Чёрный', 'white': 'Белый',
  'green': 'Зелёное', 'blue': 'Голубое', 'golden': 'Золотое', 'wild': 'Лесное',
  'sweet': 'Сладкое', 'sour': 'Кислое', 'fresh': 'Свежее', 'bitter': 'Горькое',
  'apple': 'яблоко', 'pepper': 'перец', 'blossom': 'цвет', 'flower': 'цветок',
  'flowers': 'цветы', 'leaf': 'лист', 'leaves': 'листья', 'seed': 'семена',
  'wood': 'дерево', 'woods': 'древесина', 'tree': 'дерево', 'resin': 'смола',
  'musk': 'мускус', 'vanilla': 'ваниль', 'sugar': 'сахар', 'salt': 'соль',
  'sea': 'морская', 'water': 'вода', 'smoke': 'дым', 'leather': 'кожа',
  'amber': 'янтарь', 'rose': 'роза', 'jasmine': 'жасмин', 'tea': 'чай',
  'coffee': 'кофе', 'chocolate': 'шоколад', 'honey': 'мёд', 'mint': 'мята',
  'cedar': 'кедр', 'sandalwood': 'сандал', 'patchouli': 'пачули', 'vetiver': 'ветивер',
  'oud': 'уд', 'orange': 'апельсин', 'lemon': 'лимон', 'berry': 'ягода',
  'berries': 'ягоды', 'fruit': 'фрукт', 'fruits': 'фрукты', 'cream': 'сливки',
  'blossoms': 'цветы', 'zest': 'цедра', 'accord': 'аккорд', 'notes': 'ноты',
  'peppermint': 'перечная мята', 'lavender': 'лаванда', 'iris': 'ирис',
  'violet': 'фиалка', 'mimosa': 'мимоза', 'cocoa': 'какао', 'caramel': 'карамель',
  'absolute': 'абсолют', 'essence': 'эссенция', 'oil': 'масло',
};

export function translateNote(en: string, lang: 'ru' | 'be'): string {
  const key = (en || '').trim().toLowerCase();
  if (!key) return en;
  const ru = NOTES_RU[key];
  if (ru) return lang === 'be' ? (NOTES_BE[key] || ru) : ru;
  // Word-by-word fallback: translate known words, keep unknown as-is.
  const words = key.replace(/-/g, ' ').split(/\s+/);
  const translated = words.map(w => NOTES_RU[w] || WORDS_RU[w] || (lang === 'be' ? (NOTES_BE[w] || w) : w));
  const out = translated.join(' ');
  return out.charAt(0).toUpperCase() + out.slice(1);
}
