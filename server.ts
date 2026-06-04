import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Fuse from 'fuse.js';
import compression from 'compression';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, ''));
  }
});
const upload = multer({ storage });

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev/preview compatibility
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.disable('x-powered-by');

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(uploadDir));

// Explicit favicon handles for robots
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.png'));
});
app.get('/apple-touch-icon.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.png'));
});
app.get('/apple-touch-icon-precomposed.png', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.png'));
});

// Simple in-memory session store
const activeTokens = new Set<string>();

// Auth Middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Initialize SQLite Database
let db: Database.Database;
try {
  db = new Database('perfume.db');
  // Test if it's corrupt
  db.pragma('integrity_check');
} catch (err: any) {
  console.error('Database is corrupt or failed to open, recreating...', err);
  if (fs.existsSync('perfume.db')) {
    fs.unlinkSync('perfume.db');
  }
  db = new Database('perfume.db');
}

// Register custom normalization function for accent-insensitive comparisons
try {
  db.function('normalize_text', (text) => {
    if (text === null || text === undefined) return '';
    return text.toString()
               .toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .trim();
  });
} catch (err) {
  console.error('Failed to register normalize_text UDF:', err);
}

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    price TEXT NOT NULL,
    topNotes TEXT NOT NULL,
    heartNotes TEXT NOT NULL,
    baseNotes TEXT NOT NULL,
    gender TEXT DEFAULT 'Unisex',
    scentFamilies TEXT DEFAULT '[]',
    concentration TEXT DEFAULT 'EDP',
    stockThreshold INTEGER DEFAULT 5,
    tags TEXT DEFAULT '[]',
    popularity INTEGER DEFAULT 0,
    longevity INTEGER DEFAULT 70,
    sillage INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    price TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    variant_type TEXT DEFAULT 'decant', -- decant (отливант), splitting (распив), full (флакон), tester (тестер), remainder (остаток)
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_region TEXT NOT NULL,
    total TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    tracking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    product_name TEXT NOT NULL,
    variant_size TEXT,
    quantity INTEGER NOT NULL,
    price TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    region TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    segment TEXT DEFAULT 'Regular'
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cms_pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_be TEXT,
    content TEXT NOT NULL,
    content_be TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS active_carts (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    items TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value REAL NOT NULL,
    min_order_amount REAL DEFAULT 0,
    valid_from DATETIME,
    valid_until DATETIME,
    usage_limit INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    applicable_brands TEXT DEFAULT '[]',
    excluded_brands TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS faq_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    question_be TEXT,
    answer TEXT NOT NULL,
    answer_be TEXT,
    sort_order INTEGER DEFAULT 0
  );
`);

// Seed default home config
const defaultHomeConfig = {
  announcement: { text: "Бесплатная доставка от 150 BYN", text_be: "Бясплатная дастаўка ад 150 BYN", active: true },
  hero: {
    slides: [
      {
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop",
        mobileImage: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop",
        title: "Искусство минимализма",
        title_be: "Мастацтва мінімалізму",
        subtitle: "Найдите свой идеальный аромат.",
        subtitle_be: "Знайдзіце свой ідэальны водар.",
        link: "/catalog"
      }
    ],
    hideTitles: false
  },
  featuredProductsTitle: "Новые поступления",
  featuredProductsTitle_be: "Новыя паступленні",
  featuredProductIds: [1, 2, 3],
  promoImages: [
    "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop"
  ],
  dynamicBlocks: [
    { type: 'New', title: 'Новинки', title_be: 'Навінкі', active: true },
    { type: 'BestSellers', title: 'Хиты продаж', title_be: 'Хіты продажаў', active: true },
    { type: 'Recommended', title: 'Рекомендуем', title_be: 'Рэкамендуем', active: true }
  ],
  popularBrands: [
    {
      name: 'Byredo',
      name_be: 'Byredo',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
      desc: 'Шведский авангард и поэзия',
      desc_be: 'Швэдскі авангард і паэзія',
      active: true
    },
    {
      name: 'Le Labo',
      name_be: 'Le Labo',
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
      desc: 'Индустриальная эстетика Нью-Йорка',
      desc_be: 'Індустрыяльная эстэтыка Нью-Ёрка',
      active: true
    },
    {
      name: 'Tom Ford',
      name_be: 'Tom Ford',
      image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=800&auto=format&fit=crop',
      desc: 'Роскошь, смелость и чувственность',
      desc_be: 'Раскоша, смеласць і пачуццёвасць',
      active: true
    },
    {
      name: 'Creed',
      name_be: 'Creed',
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
      desc: 'Монархическое величие и классика',
      desc_be: 'Манархічная веліч і класіка',
      active: true
    },
    {
      name: 'Kilian',
      name_be: 'Kilian',
      image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
      desc: 'Ночные тайны и парижский шик',
      desc_be: 'Начныя тайны і парыжскі шык',
      active: true
    },
    {
      name: 'Maison Francis Kurkdjian',
      name_be: 'Maison Francis Kurkdjian',
      image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
      desc: 'Ювелирная точность ароматов',
      desc_be: 'Ювелірная дакладнасць водараў',
      active: true
    }
  ],
  seoTitle: "АРХЕТИП | Элитная парфюмерия и отливанты в Беларуси",
  seoDescription: "Оригинальная нишевая и селективная парфюмерия. Распив (отливанты) в Гродно и с доставкой по Беларуси. Честные цены, только оригинал."
};
const defaultGeneralSettings = {
  aboutPhoto: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop",
  instagram: "https://instagram.com",
  telegram: "https://t.me/username",
  viber: "viber://chat?number=+375291234567",
  whatsapp: "https://wa.me/375291234567",
  email: "hello@arhetip.com",
  phone: "+375 (29) 123-45-67",
  workingHours: "Пн-Пт: 10:00 - 20:00, Сб-Вс: 11:00 - 18:00",
  workingHours_be: "Пн-Пт: 10:00 - 20:00, Сб-Нд: 11:00 - 18:00",
  address: "ул. Парфюмерная 123, Гродно, Беларусь",
  address_be: "вул. Парфумерная 123, Гродна, Беларусь",
  unp: "123456789",
  bankDetails: "IBAN: BY00 ABCD 0000 0000 0000 0000, BIC: ABCDBY2X",
  aboutTitle: "Наша история",
  aboutTitle_be: "Наша гісторыя",
  aboutDescription: "Путешествие в мир высокой парфюмерии, где мы собираем самые изысканные ароматы для современных людей.",
  aboutDescription_be: "Падарожжа ў свет высокай парфумерыі, дзе мы збіраем самыя вытанчаныя водары для сучасных людзей.",
  aboutArtTitle: "Искусство выбора",
  aboutArtTitle_be: "Мастацтва выбару",
  aboutArtText1: "Основанный в 2020 году, Arhetip родился из страсти к нишевой парфюмерии. Мы верим, что аромат — это больше, чем просто запах. Это невидимый аксессуар, триггер воспоминаний и глубокое выражение личности.",
  aboutArtText1_be: "Заснаваны ў 2020 годзе, Arhetip нарадзіўся з запалу да нішавай парфумерыі. Мы верым, што водар — гэта больш, чым проста пах. Гэта нябачны аксэсуар, трыгер успамінаў і глыбокае выяўленне асобы.",
  aboutArtText2: "Наша коллекция тщательно отобрана. Мы путешествуем по миру, чтобы найти независимых парфюмеров, которые ставят качество ингредиентов и инновационные композиции выше массовой привлекательности. Каждый флакон в нашем магазине был протестирован и полюблен нашей командой.",
  aboutArtText2_be: "Наша калекцыя старанна адабрана. Мы падарожнічаем па свеце, каб знайсці незалежных парфумераў, якія ставяць якасць інгрэдыентаў і інавацыйныя кампазіцыі вышэй за масавую прывабнасць. Кожны флакон у нашай краме быў пратэставаны і ўпадабаны нашай камандай.",
  stat1Value: "50+",
  stat1Label: "Уникальных ароматов",
  stat1Label_be: "Унікальных водараў",
  stat2Value: "12",
  stat2Label: "Нишевых брендов",
  stat2Label_be: "Нішавых брэндаў",
  stat3Value: "10k+",
  stat3Label: "Счастливых клиентов",
  stat3Label_be: "Шчаслівых кліентаў",
  seoTitle: "Arhetip Perfume",
  seoDescription: "Магазин нишевой парфюмерии Arhetip"
};

let initialHomeConfig = defaultHomeConfig;
try {
  const backupPath = path.join(__dirname, 'uploads', 'home_config_backup.json');
  if (fs.existsSync(backupPath)) {
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    initialHomeConfig = JSON.parse(backupContent);
    console.log('Loaded home_config from backup file!');
  }
} catch (e) {
  console.error('Failed to load home_config backup:', e);
}

let initialGeneralSettings = defaultGeneralSettings;
try {
  const backupPath = path.join(__dirname, 'uploads', 'general_settings_backup.json');
  if (fs.existsSync(backupPath)) {
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    initialGeneralSettings = JSON.parse(backupContent);
    console.log('Loaded general_settings from backup file!');
  }
} catch (e) {
  console.error('Failed to load general_settings backup:', e);
}

db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('home_config', JSON.stringify(initialHomeConfig));
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('general_settings', JSON.stringify(initialGeneralSettings));

// Migration for new columns
const migrations = [
  "ALTER TABLE products ADD COLUMN gender TEXT DEFAULT 'Unisex'",
  "ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN scentFamilies TEXT DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN concentration TEXT DEFAULT 'EDP'",
  "ALTER TABLE products ADD COLUMN stockThreshold INTEGER DEFAULT 5",
  "ALTER TABLE products ADD COLUMN tags TEXT DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN description_be TEXT",
  "ALTER TABLE products ADD COLUMN scentFamilies_be TEXT DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN tags_be TEXT DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN popularity INTEGER DEFAULT 0",
  "ALTER TABLE products ADD COLUMN longevity INTEGER DEFAULT 70",
  "ALTER TABLE products ADD COLUMN sillage INTEGER DEFAULT 60",
  "ALTER TABLE cms_pages ADD COLUMN title_be TEXT",
  "ALTER TABLE cms_pages ADD COLUMN content_be TEXT",
  "ALTER TABLE products ADD COLUMN slug TEXT",
  "ALTER TABLE products ADD COLUMN season TEXT DEFAULT '[]'",
  "ALTER TABLE products ADD COLUMN seo_title TEXT",
  "ALTER TABLE products ADD COLUMN seo_description TEXT",
  "ALTER TABLE users ADD COLUMN ltv REAL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN order_count INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN avg_order_value REAL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN loyalty_status TEXT DEFAULT 'Regular'",
  "ALTER TABLE users ADD COLUMN notes TEXT",
  "ALTER TABLE reviews ADD COLUMN admin_reply TEXT",
  "ALTER TABLE orders ADD COLUMN delivery_method TEXT",
  "ALTER TABLE orders ADD COLUMN delivery_address TEXT",
  "ALTER TABLE products ADD COLUMN accords TEXT DEFAULT '[]'",
  "ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'При получении'",
  "ALTER TABLE orders ADD COLUMN comment TEXT",
  "ALTER TABLE product_variants ADD COLUMN variant_type TEXT DEFAULT 'decant'",
  "ALTER TABLE products ADD COLUMN created_at DATETIME",
  "ALTER TABLE products ADD COLUMN updated_at DATETIME",
  "ALTER TABLE products ADD COLUMN topNotesDuration TEXT",
  "ALTER TABLE products ADD COLUMN topNotesDuration_be TEXT",
  "ALTER TABLE products ADD COLUMN heartNotesDuration TEXT",
  "ALTER TABLE products ADD COLUMN heartNotesDuration_be TEXT",
  "ALTER TABLE products ADD COLUMN baseNotesDuration TEXT",
  "ALTER TABLE products ADD COLUMN baseNotesDuration_be TEXT"
];

// Populate newly added fields
try {
  db.prepare("UPDATE products SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at IS NULL").run();
} catch (e) {
  // Ignored if column doesn't exist yet
}

function slugify(text: string) {
  const cyrillicToLatinMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'і': 'i', 'ў': 'u'
  };

  return text
    .toString()
    .toLowerCase()
    .trim()
    .split('')
    .map(char => cyrillicToLatinMap[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

for (const migration of migrations) {
  try {
    db.exec(migration);
  } catch (e) {
    // Column likely already exists
  }
}

// Seed CMS pages
const seedCMS = [
  { 
    id: 'delivery', 
    title: 'Доставка и оплата', 
    title_be: 'Дастаўка і аплата', 
    content: `### Доставка и оплата

Мы стремимся сделать процесс покупки максимально удобным и прозрачным.

**Способы доставки**

1. **Доставка по Гродно**
   * Осуществляется в день заказа или на следующий день.
   * Стоимость доставки — 5 BYN.
   * **Бесплатно** при заказе на сумму от 150 BYN.
   * Время согласовывается индивидуально.

2. **Доставка по Беларуси (Европочта / Белпочта)**
   * Отправка в течение 1-2 рабочих дней после подтверждения заказа.
   * Срок доставки — 3-5 рабочих дней.
   * Стоимость доставки — согласно тарифам оператора (обычно от 4 до 10 BYN).
   * **Бесплатно** до отделения при заказе от 150 BYN.

**Способы оплаты**

* **Наличными или картой** при получении (курьеру в Гродно).
* **Наложенный платеж** при получении в отделениях почтовой связи.
* **Дистанционная оплата** (банковский перевод по реквизитам или через систему ЕРИП).

*Перед отправкой мы тщательно упаковываем каждый заказ в воздушно-пузырьковую пленку и коробку, чтобы вы получили свой аромат в целостности.*`,
    content_be: `### Дастаўка і аплата

Мы імкнемся зрабіць працэс пакупкі максімальна зручным і празрыстым.

**Спосабы дастаўкі**

1. **Дастаўка па Гродне**
   * Ажыццяўляецца ў дзень замовы або на наступны дзень.
   * Кошт дастаўкі — 5 BYN.
   * **Бясплатна** пры замове на суму ад 150 BYN.
   * Час узгадняецца індывідуальна.

2. **Дастаўка па Беларусі (Еўрапошта / Белпошта)**
   * Адпраўка на працягу 1-2 рабочых дзён пасля пацверджання замовы.
   * Тэрмін дастаўкі — 3-5 рабочых дзён.
   * Кошт дастаўкі — згодна з тарыфамі аператара (звычайна ад 4 да 10 BYN).
   * **Бясплатна** да аддзялення пры замове ад 150 BYN.

**Спосабы аплаты**

* **Наяўнымі або картай** пры атрыманні (кур'еру ў Гродне).
* **Накладзены плацёж** пры атрыманні ў аддзяленнях паштовай сувязі.
* **Дыстанцыйная аплата** (банкаўскі перавод па рэквізітах або праз сістэму АРІП).

*Перад адпраўкай мы старанна пакуем кожную замову ў паветрана-пузырковую пленку і каробку, каб вы атрымалі свой водар у цэласнасці.*`
  },
  { 
    id: 'returns', 
    title: 'Гарантия и возврат', 
    title_be: 'Гарантыя і вяртанне', 
    content: `### Гарантии и возврат

Мы ценим ваше доверие и строго соблюдаем законодательство Республики Беларусь в области защиты прав потребителей.

**1. Товары надлежащего качества**
В соответствии с Постановлением Совета Министров Республики Беларусь от 14.06.2002 № 778 «О мерах по реализации Закона Республики Беларусь "О защите прав потребителей"», **парфюмерно-косметические товары надлежащего качества обмену и возврату не подлежат.** 

Это означает, что если аромат вам не понравился, не подошел или вы ошиблись с выбором, мы не сможем принять товар обратно или обменять его после покупки. Мы рекомендуем перед приобретением полноразмерного флакона воспользоваться нашими услугами по распиву (отливантами), чтобы познакомиться с ароматом.

**2. Товары ненадлежащего качества**
Под товаром ненадлежащего качества подразумевается товар, который имеет производственные дефекты или не соответствует заявленным характеристикам (например: неисправный распылитель, протечка флакона, доставленный товар не соответствует заказанному).

В случае обнаружения дефекта вы имеете право на:
* Замену товара на аналогичный товар надлежащего качества.
* Соразмерное уменьшение покупной цены.
* Расторжение договора купли-продажи и возврат уплаченной денежной суммы.

**3. Порядок возврата**
При обнаружении признаков ненадлежащего качества товара в момент получения заказа, вы можете отказаться от него на месте. Если дефект обнаружен позже:
1. Сохраните чек и упаковку.
2. Свяжитесь с нами по телефону или в мессенджерах.
3. Опишите проблему и приложите фото дефекта.

**4. Проверка при получении**
Рекомендуем проверять состояние товара, целостность упаковки и соответствие заказа в присутствии курьера или сотрудника отделения службы доставки.

Мы гарантируем, что вся продукция в нашем магазине является оригинальной и хранится в надлежащих температурных условиях.`,
    content_be: `### Гарантыі і вяртанне

Мы цэнім ваш давер і строга выконваем заканадаўства Рэспублікі Беларусь у галіне абароны правоў спажыўцоў.

**1. Тавары належнай якасці**
У адпаведнасці з Пастановай Савета Міністраў Рэспублікі Беларусь ад 14.06.2002 № 778 «Аб мерах па рэалізацыі Закона Рэспублікі Беларусь "Аб абароне правоў спажыўцоў"», **парфумерна-касметычныя тавары належнай якасці абмену і вяртанню не падлягаюць.**

Гэта азначае, што калі водар вам не спадабаўся, не падышоў або вы памыліліся з выбарам, мы не зможам прыняць тавар назад або абмяняць яго пасля куплі. Мы рэкамендуем перад набыццём поўнапамернага флакона скарыстацца нашымі паслугамі па распіве (адлівантамі), каб пазнаёміцца з водарам.

**2. Тавары неналежнай якасці**
Пад таварам неналежнай якасці маецца на ўвазе тавар, які мае вытворчыя дэфекты або не адпавядае заяўленым характарыстыкам (напрыклад: няспраўны распыляльнік, працёк флакона, дастаўлены тавар не адпавядае замоўленаму).

У выпадку выяўлення дэфекту вы маеце права на:
* Замену тавара на аналагічны тавар належнай якасці.
* Суразмернае памяншэнне пакупной цаны.
* Разарванне дагавора куплі-продажу і вяртанне страчанай грашовай сумы.

**3. Парадак вяртання**
Пры выяўленні прыкмет неналежнай якасці тавара ў момант атрымання замовы, вы можаце адмовіцца ад яго на месцы. Калі дэфект выяўлены пазней:
1. Захавайце чэк і ўпакоўку.
2. Звяжыцеся з намі па тэлефоне або ў мэсенджарах.
3. Апішыце праблему і прыкладзіце фота дэфекту.

**4. Праверка пры атрыманні**
Рэкамендуем правяраць стан тавара, цэласнасць упакоўкі і адпаведнасць замовы ў прысутнасці кур'ера або супрацоўніка аддзялення службы дастаўкі.

Мы гарантуем, што ўся прадукцыя ў нашай краме з'яўляецца арыгінальнай і захоўваецца ў належных тэмпературных умовах.`
  },
];
seedCMS.forEach(page => {
  db.prepare('INSERT OR IGNORE INTO cms_pages (id, title, title_be, content, content_be, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .run(page.id, page.title, page.title_be, page.content, page.content_be);
  
  // Force update for existing records to reflect Grodno changes
  db.prepare('UPDATE cms_pages SET title = ?, title_be = ?, content = ?, content_be = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(page.title, page.title_be, page.content, page.content_be, page.id);
});

// Seed default FAQs if the table is empty
const faqCount = db.prepare('SELECT COUNT(*) as count FROM faq_items').get() as { count: number };
if (faqCount.count === 0) {
  const seedFAQs = [
    {
      question: 'У вас оригинальная парфюмерия?',
      question_be: 'У вас арыгінальная парфумерыя?',
      answer: 'Да, вся наша продукция исключительно оригинальная, сертифицированная и проходит тщательный контроль качества. Мы работаем только с надежными европейскими поставщиками и ценим доверие наших покупателей.',
      answer_be: 'Так, уся наша прадукцыя выключна арыгінальная, сертыфікаваная і праходзіць старанны кантроль якасці. Мы працуем толькі з надзейнымі еўрапейскімі пастаўшчыкамі і цэнім давер нашых пакупнікоў.',
      sort_order: 1
    },
    {
      question: 'Что такое отливанты (распив) и зачем они нужны?',
      question_be: 'Што такое адліванты (распіў) і навошта яны патрэбныя?',
      answer: 'Отливанты — это оригинальная парфюмерия, перелитая из оригинального фирменного флакона в меньшие по объему флакончики с распылителем (атомайзеры от 2 до 10 мл). Это отличная возможность полноценно опробовать нишевый или люксовый аромат в повседневной жизни, разносить его на коже и понять, подходит ли он вам, не покупая дорогой флакон целиком.',
      answer_be: 'Адліванты — гэта арыгінальная парфумерыя, пералітая з арыгінальнага фірмога флакона ў меншыя па аб\'ёме флакончыкі з распыляльнікам (атамайзеры ад 2 да 10 мл). Гэта выдатная магчымасць паўнавартасна апрабаваць нішавы або люксавы водар у паўсядзённым жыцці, разносіць яго на скуры і зразумець, ці падыходзіць ён вам, не купляючы дарагі флакон цалкам.',
      sort_order: 2
    },
    {
      question: 'Как осуществляется доставка и сколько она стоит?',
      question_be: 'Як ажыццяўляецца дастаўка і колькі яна каштуе?',
      answer: 'По Гродно мы отправляем курьером (бесплатно при сумме заказа от 150 BYN, для остальных заказов стоимость — 5 BYN). По Беларуси доставляем Белпочтой или Европочтой (до отделения или на дом). Срок отправки — всего 1-2 рабочих дня, доставка обычно занимает от 3 до 5 дней.',
      answer_be: 'Па Гродне мы адпраўляем кур\'ерам (бясплатна пры суме замовы ад 150 BYN, для астатніх замоў кошт — 5 BYN). Па Беларусі дастаўляем Белпоштай або Еўрапоштай (да аддзялення ці на дом). Тэрмін адпраўкі — усяго 1-2 працоўныя дні, дастаўка звычайна займае ад 3 да 5 дзён.',
      sort_order: 3
    }
  ];

  const insertFAQ = db.prepare('INSERT INTO faq_items (question, question_be, answer, answer_be, sort_order) VALUES (?, ?, ?, ?, ?)');
  seedFAQs.forEach(f => {
    insertFAQ.run(f.question, f.question_be, f.answer, f.answer_be, f.sort_order);
  });
}

// Update all products with new transliterated slugs
const allProducts = db.prepare('SELECT id, name, brand FROM products').all() as { id: number, name: string, brand: string }[];
for (const p of allProducts) {
  const fullSlug = slugify(`${p.brand}-${p.name}`);
  db.prepare('UPDATE products SET slug = ? WHERE id = ?').run(fullSlug, p.id);
}

// Insert some initial data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (count.count <= 2) {
  const insert = db.prepare(`
    INSERT INTO products (name, brand, description, imageUrl, price, topNotes, heartNotes, baseNotes, gender, scentFamilies)
    VALUES (@name, @brand, @description, @imageUrl, @price, @topNotes, @heartNotes, @baseNotes, @gender, @scentFamilies)
  `);
  
  if (count.count === 0) {
    insert.run({
      name: 'Santal 33',
      brand: 'Le Labo',
      description: 'Унисекс аромат, который передает дух американского Запада и личной свободы.',
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
      price: 320,
      topNotes: JSON.stringify([{name: 'Violet', value: 30}, {name: 'Cardamom', value: 70}]),
      heartNotes: JSON.stringify([{name: 'Iris', value: 40}, {name: 'Ambrox', value: 60}]),
      baseNotes: JSON.stringify([{name: 'Cedarwood', value: 50}, {name: 'Leather', value: 50}]),
      gender: 'Unisex',
      scentFamilies: JSON.stringify(['Woody'])
    });

    insert.run({
      name: 'Baccarat Rouge 540',
      brand: 'Maison Francis Kurkdjian',
      description: 'Светящийся и утонченный, Baccarat Rouge 540 ложится на кожу как амбровый, цветочный и древесный бриз.',
      imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
      price: 325,
      topNotes: JSON.stringify([{name: 'Saffron', value: 60}, {name: 'Jasmine', value: 40}]),
      heartNotes: JSON.stringify([{name: 'Amberwood', value: 80}, {name: 'Ambergris', value: 20}]),
      baseNotes: JSON.stringify([{name: 'Fir Resin', value: 40}, {name: 'Cedar', value: 60}]),
      gender: 'Unisex',
      scentFamilies: JSON.stringify(['Oriental', 'Floral'])
    });
  }

  // Add 8 more test products
  insert.run({
    name: 'Gypsy Water',
    brand: 'Byredo',
    description: 'Гламуризация цыганского образа жизни. Аромат свежей земли, густых лесов и костров.',
    imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
    price: 290,
    topNotes: JSON.stringify([{name: 'Bergamot', value: 40}, {name: 'Lemon', value: 60}]),
    heartNotes: JSON.stringify([{name: 'Pine Needle', value: 50}, {name: 'Orris', value: 50}]),
    baseNotes: JSON.stringify([{name: 'Amber', value: 40}, {name: 'Sandalwood', value: 60}]),
    gender: 'Unisex',
    scentFamilies: JSON.stringify(['Woody', 'Fresh'])
  });

  insert.run({
    name: 'Oud Wood',
    brand: 'Tom Ford',
    description: 'Редкий, экзотический, отличительный. Один из самых редких, драгоценных и дорогих ингредиентов в арсенале парфюмера.',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
    price: 395,
    topNotes: JSON.stringify([{name: 'Rosewood', value: 50}, {name: 'Cardamom', value: 50}]),
    heartNotes: JSON.stringify([{name: 'Oud Wood', value: 70}, {name: 'Sandalwood', value: 30}]),
    baseNotes: JSON.stringify([{name: 'Tonka Bean', value: 40}, {name: 'Amber', value: 60}]),
    gender: 'Male',
    scentFamilies: JSON.stringify(['Woody', 'Oriental'])
  });

  insert.run({
    name: 'Aventus',
    brand: 'Creed',
    description: 'Начальные ноты просто невероятны. Очень уверенный и мужественный аромат, привлекающий внимание.',
    imageUrl: 'https://images.unsplash.com/photo-1615397323734-20a2234d2081?q=80&w=800&auto=format&fit=crop',
    price: 495,
    topNotes: JSON.stringify([{name: 'Pineapple', value: 40}, {name: 'Bergamot', value: 60}]),
    heartNotes: JSON.stringify([{name: 'Birch', value: 60}, {name: 'Patchouli', value: 40}]),
    baseNotes: JSON.stringify([{name: 'Musk', value: 50}, {name: 'Oakmoss', value: 50}]),
    gender: 'Male',
    scentFamilies: JSON.stringify(['Fresh', 'Woody'])
  });

  insert.run({
    name: 'Portrait of a Lady',
    brand: 'Frederic Malle',
    description: 'Огромная доза турецкой розы — 400 цветов на 100 мл флакон, не меньше. Под ней — сердце пачули, пропитанное сандалом и ладаном.',
    imageUrl: 'https://images.unsplash.com/photo-1595425970377-c9703bc48b12?q=80&w=800&auto=format&fit=crop',
    price: 390,
    topNotes: JSON.stringify([{name: 'Rose', value: 80}, {name: 'Clove', value: 20}]),
    heartNotes: JSON.stringify([{name: 'Patchouli', value: 60}, {name: 'Sandalwood', value: 40}]),
    baseNotes: JSON.stringify([{name: 'Frankincense', value: 50}, {name: 'Musk', value: 50}]),
    gender: 'Female',
    scentFamilies: JSON.stringify(['Floral', 'Oriental'])
  });

  insert.run({
    name: 'Lost Cherry',
    brand: 'Tom Ford',
    description: 'Полнотелое путешествие в некогда запретное; контрастный аромат, раскрывающий соблазнительную дихотомию игривого, конфетного блеска снаружи и сочной мякоти внутри.',
    imageUrl: 'https://images.unsplash.com/photo-1616934807977-170c05c75ea7?q=80&w=800&auto=format&fit=crop',
    price: 395,
    topNotes: JSON.stringify([{name: 'Black Cherry', value: 70}, {name: 'Bitter Almond', value: 30}]),
    heartNotes: JSON.stringify([{name: 'Rose Absolute', value: 40}, {name: 'Jasmine', value: 60}]),
    baseNotes: JSON.stringify([{name: 'Peru Balsam', value: 50}, {name: 'Roasted Tonka', value: 50}]),
    gender: 'Unisex',
    scentFamilies: JSON.stringify(['Gourmand', 'Oriental'])
  });

  insert.run({
    name: 'Delina',
    brand: 'Parfums de Marly',
    description: 'Очень нюансированный аромат, одновременно сладкий и чувственный. Парфюмерная вода наслаждается своими цветочными аккордами, в которых доминируют турецкая роза, ландыш и пион.',
    imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=800&auto=format&fit=crop',
    price: 355,
    topNotes: JSON.stringify([{name: 'Rhubarb', value: 50}, {name: 'Lychee', value: 50}]),
    heartNotes: JSON.stringify([{name: 'Turkish Rose', value: 60}, {name: 'Peony', value: 40}]),
    baseNotes: JSON.stringify([{name: 'Vanilla', value: 40}, {name: 'White Musk', value: 60}]),
    gender: 'Female',
    scentFamilies: JSON.stringify(['Floral'])
  });

  insert.run({
    name: 'Black Phantom',
    brand: 'Kilian',
    description: 'Смертельный кофе с каплей рома. Аромат открывается аккордом рома с Мартиники, похожим на «пиратскую воду», который пронзает аромат крепкого кофе в самом сердце.',
    imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?q=80&w=800&auto=format&fit=crop',
    price: 295,
    topNotes: JSON.stringify([{name: 'Rum', value: 60}, {name: 'Sugar Cane', value: 40}]),
    heartNotes: JSON.stringify([{name: 'Coffee', value: 70}, {name: 'Vetiver', value: 30}]),
    baseNotes: JSON.stringify([{name: 'Cyanide', value: 30}, {name: 'Sandalwood', value: 70}]),
    gender: 'Unisex',
    scentFamilies: JSON.stringify(['Gourmand', 'Oriental'])
  });

  insert.run({
    name: 'Mojave Ghost',
    brand: 'Byredo',
    description: 'Древесная композиция, вдохновленная душевной красотой пустыни Мохаве. В этой засушливой глуши редко встречаются растения, которые осмеливаются цвести.',
    imageUrl: 'https://images.unsplash.com/photo-1622618991746-fe6004db3a47?q=80&w=800&auto=format&fit=crop',
    price: 290,
    topNotes: JSON.stringify([{name: 'Ambrette', value: 50}, {name: 'Nesberry', value: 50}]),
    heartNotes: JSON.stringify([{name: 'Magnolia', value: 40}, {name: 'Sandalwood', value: 60}]),
    baseNotes: JSON.stringify([{name: 'Cedarwood', value: 50}, {name: 'Chantilly Musk', value: 50}]),
    gender: 'Unisex',
    scentFamilies: JSON.stringify(['Woody', 'Floral'])
  });

  // Add a test product with all variant types
  insert.run({
    name: 'Test All Variants',
    brand: 'Test Brand',
    description: 'Специальный тестовый товар со всеми возможными вариантами объемов (отливанты, флаконы, тестеры).',
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
    price: 15,
    topNotes: JSON.stringify([{name: 'Test', value: 50}]),
    heartNotes: JSON.stringify([{name: 'Test', value: 50}]),
    baseNotes: JSON.stringify([{name: 'Test', value: 50}]),
    gender: 'Unisex',
    scentFamilies: JSON.stringify(['Fresh'])
  });

  // Add variants to the test product
  const testProductId = (db.prepare('SELECT id FROM products WHERE name = ?').get('Test All Variants') as any)?.id;
  if (testProductId) {
    const insertVariant = db.prepare('INSERT INTO product_variants (product_id, size, price, stock, sku) VALUES (?, ?, ?, ?, ?)');
    // Отливанты (<= 20ml)
    insertVariant.run(testProductId, '2ml', 15, 100, 'TEST-2ML');
    insertVariant.run(testProductId, '5ml', 35, 100, 'TEST-5ML');
    insertVariant.run(testProductId, '10ml', 65, 100, 'TEST-10ML');
    insertVariant.run(testProductId, '15ml', 90, 100, 'TEST-15ML');
    // Флаконы (> 20ml)
    insertVariant.run(testProductId, '30ml', 150, 50, 'TEST-30ML');
    insertVariant.run(testProductId, '50ml', 220, 30, 'TEST-50ML');
    insertVariant.run(testProductId, '100ml', 380, 20, 'TEST-100ML');
    // Тестеры
    insertVariant.run(testProductId, 'Tester 100ml', 320, 10, 'TEST-TST-100ML');
  }

  // Add test users if none exist
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (email, name, phone, region, segment) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('nexus3641@gmail.com', 'Nexus User', '+375291112233', 'Minsk', 'VIP');
    insertUser.run('ivan@example.com', 'Иван Иванов', '+375290000000', 'Brest', 'Regular');
    insertUser.run('maria@example.com', 'Мария Петрова', '+375441234567', 'Gomel', 'Regular');
  }

  // Add test orders if none exist
  const orderCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, customer_region, total, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);
    const lastMonth = new Date(now); lastMonth.setDate(now.getDate() - 30);

    insertOrder.run(1, 'Nexus User', 'nexus3641@gmail.com', '+375291112233', 'Minsk', 645, 'Delivered', lastMonth.toISOString());
    insertOrder.run(2, 'Иван Иванов', 'ivan@example.com', '+375290000000', 'Brest', 320, 'Shipped', lastWeek.toISOString());
    insertOrder.run(3, 'Мария Петрова', 'maria@example.com', '+375441234567', 'Gomel', 290, 'New', yesterday.toISOString());
    insertOrder.run(1, 'Nexus User', 'nexus3641@gmail.com', '+375291112233', 'Minsk', 325, 'New', now.toISOString());

    // Add order items
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertOrderItem.run(1, 1, 'Santal 33', 1, 320);
    insertOrderItem.run(1, 2, 'Baccarat Rouge 540', 1, 325);
    insertOrderItem.run(2, 1, 'Santal 33', 1, 320);
    insertOrderItem.run(3, 3, 'Gypsy Water', 1, 290);
    insertOrderItem.run(4, 2, 'Baccarat Rouge 540', 1, 325);
  }

  // Add test product views if none exist
  const viewCount = (db.prepare('SELECT COUNT(*) as count FROM product_views').get() as any).count;
  if (viewCount === 0) {
    const insertView = db.prepare('INSERT INTO product_views (product_id, viewed_at) VALUES (?, ?)');
    const productsList = db.prepare('SELECT id FROM products').all() as {id: number}[];
    for (const p of productsList) {
      for (let i = 0; i < 10; i++) {
        const viewDate = new Date();
        viewDate.setDate(viewDate.getDate() - Math.floor(Math.random() * 30));
        insertView.run(p.id, viewDate.toISOString());
      }
    }
  }
}

// Update existing records to have genders if they were created before the migration
db.exec(`
  UPDATE products SET gender = 'Male' WHERE name IN ('Oud Wood', 'Aventus') AND gender IS NULL;
  UPDATE products SET gender = 'Female' WHERE name IN ('Portrait of a Lady', 'Delina') AND gender IS NULL;
  UPDATE products SET gender = 'Unisex' WHERE gender IS NULL;
  
  -- Seed concentrations for testing
  UPDATE products SET concentration = 'Parfum' WHERE name IN ('Baccarat Rouge 540', 'Black Phantom');
  UPDATE products SET concentration = 'EDT' WHERE name IN ('Gypsy Water', 'Mojave Ghost');
  UPDATE products SET concentration = 'EDC' WHERE name IN ('Aventus');
  UPDATE products SET concentration = 'Oil' WHERE name IN ('Santal 33');
`);

// Update any existing picsum.photos to unsplash
db.prepare(`
  UPDATE products 
  SET imageUrl = CASE 
    WHEN name = 'Santal 33' THEN 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Baccarat Rouge 540' THEN 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Gypsy Water' THEN 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Oud Wood' THEN 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Aventus' THEN 'https://images.unsplash.com/photo-1615397323734-20a2234d2081?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Portrait of a Lady' THEN 'https://images.unsplash.com/photo-1595425970377-c9703bc48b12?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Lost Cherry' THEN 'https://images.unsplash.com/photo-1616934807977-170c05c75ea7?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Delina' THEN 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Black Phantom' THEN 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?q=80&w=800&auto=format&fit=crop'
    WHEN name = 'Mojave Ghost' THEN 'https://images.unsplash.com/photo-1622618991746-fe6004db3a47?q=80&w=800&auto=format&fit=crop'
    ELSE imageUrl
  END
  WHERE imageUrl LIKE '%picsum.photos%'
`).run();

// SEO Endpoints

app.get('/robots.txt', (req, res) => {
  const domain = req.protocol + '://' + req.get('host');
  const adminPathEnv = process.env.VITE_ADMIN_PATH || 'admin';
  const cleanAdminPath = adminPathEnv.startsWith('/') ? adminPathEnv : `/${adminPathEnv}`;
  
  res.type('text/plain');
  res.send(`User-agent: Yandex
Disallow: /api/
Disallow: /forbidden
Disallow: /502
Disallow: /500
Disallow: ${cleanAdminPath}
Disallow: ${cleanAdminPath}/
Disallow: /admin
Disallow: /admin/
Disallow: /wishlist
Disallow: /cart
Disallow: /*?*sort=
Disallow: /*?*search=
Disallow: /*?*token=
Disallow: /*?*utm_
Disallow: /*?*gclid=
Disallow: /*?*yclid=
Clean-param: sort&search&token&utm_source&utm_medium&utm_campaign&gclid&yclid /catalog/
Clean-param: sort&search&token&utm_source&utm_medium&utm_campaign&gclid&yclid /catalog

User-agent: *
Disallow: /api/
Disallow: /forbidden
Disallow: /502
Disallow: /500
Disallow: ${cleanAdminPath}
Disallow: ${cleanAdminPath}/
Disallow: /admin
Disallow: /admin/
Disallow: /wishlist
Disallow: /cart
Disallow: /*?*sort=
Disallow: /*?*search=
Disallow: /*?*token=
Disallow: /*?*utm_
Disallow: /*?*gclid=
Disallow: /*?*yclid=

Sitemap: ${domain}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  try {
    const domain = req.protocol + '://' + req.get('host');
    
    // Helper to format dates to YYYY-MM-DD
    const formatSitemapDate = (dbDate?: string | null) => {
      if (!dbDate) return new Date().toISOString().split('T')[0];
      try {
        const normalized = dbDate.includes(' ') && !dbDate.includes('T')
          ? dbDate.replace(' ', 'T') + 'Z'
          : dbDate;
        const d = new Date(normalized);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch (e) {
        // fallback
      }
      return new Date().toISOString().split('T')[0];
    };

    // Query all products with their latest modified or created dates
    const products = db.prepare("SELECT slug, COALESCE(updated_at, created_at) as mdate FROM products WHERE slug IS NOT NULL AND slug != ''").all() as { slug: string; mdate?: string }[];
    
    // Query all dynamic CMS pages with their updated dates
    const cmsPages = db.prepare('SELECT id, updated_at FROM cms_pages').all() as { id: string; updated_at?: string }[];

    // Determine the overall latest dates in the DB to represent the last time content changed
    let latestProductDateStr = null;
    let latestPageDateStr = null;
    let latestReviewDateStr = null;

    try {
      const pMax = db.prepare('SELECT MAX(COALESCE(updated_at, created_at)) as latest FROM products').get() as { latest?: string };
      latestProductDateStr = pMax?.latest;
    } catch (e) {}

    try {
      const cMax = db.prepare('SELECT MAX(updated_at) as latest FROM cms_pages').get() as { latest?: string };
      latestPageDateStr = cMax?.latest;
    } catch (e) {}

    try {
      const rMax = db.prepare('SELECT MAX(created_at) as latest FROM reviews WHERE status = "Approved"').get() as { latest?: string };
      latestReviewDateStr = rMax?.latest;
    } catch (e) {}

    const productLastMod = formatSitemapDate(latestProductDateStr);
    const pageLastMod = formatSitemapDate(latestPageDateStr);
    const reviewLastMod = formatSitemapDate(latestReviewDateStr || latestProductDateStr);

    // Site overall lastmod is the max of pages and products
    const siteLastMod = new Date(productLastMod) > new Date(pageLastMod) ? productLastMod : pageLastMod;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${siteLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/catalog</loc>
    <lastmod>${productLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/about</loc>
    <lastmod>${pageLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/contacts</loc>
    <lastmod>${pageLastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/reviews</loc>
    <lastmod>${reviewLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Append dynamic CMS Pages
    cmsPages.forEach(page => {
      const pageDate = formatSitemapDate(page.updated_at);
      xml += `
  <url>
    <loc>${domain}/p/${page.id}</loc>
    <lastmod>${pageDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Append dynamic Products (automatically updated when new products are added!)
    products.forEach(product => {
      const prodDate = formatSitemapDate(product.mdate);
      xml += `
  <url>
    <loc>${domain}/catalog/${product.slug}</loc>
    <lastmod>${prodDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    
    res.type('application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/api/feeds/yandex.xml', (req, res) => {
  try {
    const domain = `${req.protocol}://${req.get('host')}`;
    const products = db.prepare('SELECT p.*, (SELECT MIN(price) FROM product_variants WHERE product_id = p.id) as min_price FROM products p').all() as any[];
    const variants = db.prepare('SELECT * FROM product_variants').all() as any[];
    const settings = JSON.parse(db.prepare('SELECT value FROM settings WHERE key = ?').get('general_settings')?.value || '{}');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE yml_catalog SYSTEM "shops.dtd">
<yml_catalog date="${new Date().toISOString()}">
  <shop>
    <name>Arhetip</name>
    <company>Arhetip - Нишевая парфюмерия</company>
    <url>${domain}</url>
    <currencies>
      <currency id="BYN" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Парфюмерия</category>
    </categories>
    <offers>`;

    products.forEach(p => {
      const pVariants = variants.filter(v => v.product_id === p.id);
      
      pVariants.forEach(v => {
        const stock = v.stock > 0;
        const scentFamilies = JSON.parse(p.scentFamilies || '[]');
        const category = scentFamilies.length > 0 ? scentFamilies[0] : 'Парфюмерия';

        xml += `
      <offer id="${v.sku || `v${v.id}`}" available="${stock}">
        <url>${domain}/catalog/${p.slug || p.id}</url>
        <price>${v.price}</price>
        <currencyId>BYN</currencyId>
        <categoryId>1</categoryId>
        <picture>${p.imageUrl.startsWith('http') ? p.imageUrl : domain + p.imageUrl}</picture>
        <vendor>${p.brand}</vendor>
        <model>${p.name} (${v.size})</model>
        <description>${p.description.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":"&apos;",'"':'&quot;'}[c]))}</description>
        <delivery>true</delivery>
        <param name="Пол">${p.gender || 'Unisex'}</param>
        <param name="Объем">${v.size}</param>
        <param name="Концентрация">${p.concentration || 'EDP'}</param>
      </offer>`;
      });
    });

    xml += `
    </offers>
  </shop>
</yml_catalog>`;

    res.type('application/xml');
    res.send(xml);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating YML feed');
  }
});

app.get('/api/feeds/google.xml', (req, res) => {
  try {
    const domain = `${req.protocol}://${req.get('host')}`;
    const products = db.prepare('SELECT * FROM products').all() as any[];
    const variants = db.prepare('SELECT * FROM product_variants').all() as any[];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Arhetip - Нишевая парфюмерия</title>
    <link>${domain}</link>
    <description>Элитная нишевая парфюмерия в Беларуси</description>`;

    products.forEach(p => {
      const pVariants = variants.filter(v => v.product_id === p.id);
      
      pVariants.forEach(v => {
        xml += `
    <item>
      <g:id>${v.sku || `v${v.id}`}</g:id>
      <g:title>${p.brand} ${p.name} ${v.size}</g:title>
      <g:link>${domain}/catalog/${p.slug || p.id}</g:link>
      <g:image_link>${p.imageUrl.startsWith('http') ? p.imageUrl : domain + p.imageUrl}</g:image_link>
      <g:description>${p.description}</g:description>
      <g:price>${v.price} BYN</g:price>
      <g:availability>${v.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:brand>${p.brand}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Perfume &amp; Cologne</g:google_product_category>
      <g:gender>${p.gender === 'Male' ? 'male' : p.gender === 'Female' ? 'female' : 'unisex'}</g:gender>
      <g:shipping>
        <g:country>BY</g:country>
        <g:service>Standard</g:service>
        <g:price>5.00 BYN</g:price>
      </g:shipping>
      <g:return_policy_label>unconditional_14_days</g:return_policy_label>
    </item>`;
      });
    });

    xml += `
  </channel>
</rss>`;

    res.type('application/xml');
    res.send(xml);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating Google feed');
  }
});

// Search Console / Yandex Webmaster Verification file endpoints
app.get('/yandex_:code.html', (req, res) => {
  try {
    const code = req.params.code;
    const settingsVal = db.prepare('SELECT value FROM settings WHERE key = ?').get('general_settings')?.value as string || '{}';
    const genSet = JSON.parse(settingsVal);
    if (code && genSet.yandexVerification && genSet.yandexVerification.trim().toLowerCase().includes(code.toLowerCase())) {
      res.type('text/html').send(`<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body>Verification: yandex_${code}</body></html>`);
    } else {
      res.status(404).send('Not Found');
    }
  } catch (e) {
    res.status(500).send('Error verifying');
  }
});

app.get('/google:code.html', (req, res) => {
  try {
    const code = req.params.code;
    const settingsVal = db.prepare('SELECT value FROM settings WHERE key = ?').get('general_settings')?.value as string || '{}';
    const genSet = JSON.parse(settingsVal);
    if (code && genSet.googleVerification && genSet.googleVerification.trim().toLowerCase().includes(code.toLowerCase())) {
      res.type('text/html').send(`google-site-verification: google${code}.html`);
    } else {
      res.status(404).send('Not Found');
    }
  } catch (e) {
    res.status(500).send('Error verifying');
  }
});

app.post('/api/upload/chunk', requireAuth, express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, chunkData, filename } = req.body;
    const buffer = Buffer.from(chunkData, 'base64');
    const tempPath = path.join(uploadDir, `temp-${uploadId}`);
    
    fs.appendFileSync(tempPath, buffer);
    
    if (Number(chunkIndex) === Number(totalChunks) - 1) {
      const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '');
      const finalName = `${Date.now()}-${sanitizedName}`;
      const finalPath = path.join(uploadDir, finalName);
      fs.renameSync(tempPath, finalPath);
      res.json({ url: `/uploads/${finalName}` });
    } else {
      res.json({ success: true });
    }
  } catch (err) {
    console.error('Chunk upload error:', err);
    res.status(500).json({ error: 'Failed to upload chunk' });
  }
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

// API Routes
app.get('/api/brands', (req, res) => {
  try {
    const brands = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand ASC').all();
    res.json(brands.map((b: any) => b.brand));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

app.get('/api/scent-families', (req, res) => {
  try {
    const products = db.prepare('SELECT scentFamilies FROM products').all() as { scentFamilies: string }[];
    const allFamilies = new Set<string>();
    products.forEach(p => {
      try {
        const fams = JSON.parse(p.scentFamilies || '[]');
        fams.forEach((f: string) => {
          if (f) allFamilies.add(f);
        });
      } catch (e) {}
    });
    res.json(Array.from(allFamilies));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scent families' });
  }
});

app.get('/api/settings/home', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('home_config') as { value: string };
    if (row) {
      const config = JSON.parse(row.value);
      if (!config.popularBrands) {
        config.popularBrands = defaultHomeConfig.popularBrands;
      }
      res.json(config);
    } else {
      res.status(404).json({ error: 'Config not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.put('/api/settings/home', requireAuth, (req, res) => {
  try {
    const config = req.body;
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(JSON.stringify(config), 'home_config');
    try {
      fs.writeFileSync(path.join(__dirname, 'uploads', 'home_config_backup.json'), JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write backup config file:', e);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

app.get('/api/settings/general', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('general_settings') as { value: string };
    if (row) {
      res.json(JSON.parse(row.value));
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings/general', requireAuth, (req, res) => {
  try {
    const settings = req.body;
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(JSON.stringify(settings), 'general_settings');
    try {
      fs.writeFileSync(path.join(__dirname, 'uploads', 'general_settings_backup.json'), JSON.stringify(settings, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write general settings backup file:', e);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'password123';

  if (username === adminUser && password === adminPass) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeTokens.delete(token);
  }
  res.status(204).send();
});

app.get('/api/products/:slug', (req, res) => {
  const { slug } = req.params;
  try {
    const product = db.prepare('SELECT * FROM products WHERE slug = ? OR id = ?').get(slug, slug) as any;
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
    const result = {
      ...product,
      images: JSON.parse(product.images || '[]'),
      scentFamilies: JSON.parse(product.scentFamilies || '[]'),
      scentFamilies_be: JSON.parse(product.scentFamilies_be || '[]'),
      topNotes: JSON.parse(product.topNotes),
      heartNotes: JSON.parse(product.heartNotes),
      baseNotes: JSON.parse(product.baseNotes),
      accords: JSON.parse(product.accords || '[]'),
      tags: JSON.parse(product.tags || '[]'),
      tags_be: JSON.parse(product.tags_be || '[]'),
      variants
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/accords', (req, res) => {
  try {
    const products = db.prepare('SELECT accords FROM products WHERE accords IS NOT NULL').all() as any[];
    const accordsSet = new Set<string>();
    products.forEach(p => {
      try {
        const parsed = JSON.parse(p.accords);
        parsed.forEach((a: any) => {
          if (a.name) accordsSet.add(a.name);
        });
      } catch (e) {
        // ignore JSON parse errors
      }
    });
    res.json(Array.from(accordsSet).sort());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accords' });
  }
});

app.get('/api/suggestions', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.json([]);
    }

    const allProducts = db.prepare('SELECT id, name, brand FROM products').all() as any[];
    
    // Create searchable items array combining both brands and actual product names
    const searchableItems: { type: string, text: string, id?: number }[] = [];
    const brandsSet = new Set<string>();
    
    allProducts.forEach(p => {
      searchableItems.push({ type: 'product', text: p.name, id: p.id });
      if (p.brand && !brandsSet.has(p.brand)) {
        brandsSet.add(p.brand);
        searchableItems.push({ type: 'brand', text: p.brand });
      }
    });

    const fuse = new Fuse(searchableItems, {
      keys: ['text'],
      threshold: 0.4, // Allows typos
      distance: 100
    });

    const results = fuse.search(q).slice(0, 5).map(res => res.item);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const { search, brand, gender, families, accords, sort, category } = req.query;

    let query = 'SELECT DISTINCT p.* FROM products p';
    let joins = '';
    let where = ' WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'All') {
      if (category === 'decant') {
        joins += ' JOIN product_variants v_cat ON p.id = v_cat.product_id';
        where += " AND (v_cat.size LIKE '%ml' AND CAST(v_cat.size AS INTEGER) <= 20)";
      } else if (category === 'set') {
        joins += ' JOIN product_variants v_cat ON p.id = v_cat.product_id';
        where += " AND (v_cat.size LIKE '%set%' OR v_cat.size LIKE '%Сет%' OR v_cat.size LIKE '%набор%' OR p.tags LIKE '%set%' OR p.tags LIKE '%набор%')";
      } else {
        let concentrationValues: string[] = [];
        switch (category) {
          case 'perfume': concentrationValues = ['Parfum', 'Extrait de Parfum', 'Pure Perfume', 'EDP', 'Eau de Parfum']; break;
          case 'eau_de_toilette': concentrationValues = ['EDT', 'Eau de Toilette']; break;
          case 'cologne': concentrationValues = ['EDC', 'Cologne', 'Eau de Cologne']; break;
          case 'oil': concentrationValues = ['Oil', 'Perfume Oil']; break;
        }
        if (concentrationValues.length > 0) {
          where += ` AND p.concentration IN (${concentrationValues.map(() => '?').join(',')})`;
          params.push(...concentrationValues);
        }
      }
    }

    if (brand && brand !== 'All') {
      where += ' AND (LOWER(p.brand) = LOWER(?) OR normalize_text(p.brand) = normalize_text(?))';
      params.push(brand, brand);
    }

    if (gender && gender !== 'All') {
      where += ' AND p.gender = ?';
      params.push(gender);
    }

    query += joins + where;

    let products = db.prepare(query).all(...params) as any[];

    // In-memory fuzzy search using Fuse.js
    if (search && typeof search === 'string' && search.trim() !== '') {
      const fuse = new Fuse(products, {
        keys: [
          { name: 'name', weight: 0.6 },
          { name: 'brand', weight: 0.3 },
          { name: 'tags', weight: 0.1 }
        ],
        threshold: 0.4, // Allows for some typos
        distance: 100
      });
      products = fuse.search(search).map(result => result.item);
    }

    // In-memory filtering for scent families
    if (families) {
      const familyList = (families as string).split(',');
      const normalizedFamilyList = familyList.map(f => f.startsWith('family') ? f : `family${f}`);
      products = products.filter((p: any) => {
        const pFamilies = JSON.parse(p.scentFamilies || '[]');
        return pFamilies.some((f: string) => normalizedFamilyList.includes(f));
      });
    }

    // In-memory filtering for accords
    if (accords) {
      const accordList = (accords as string).split(',');
      products = products.filter((p: any) => {
        try {
          const pAccords = JSON.parse(p.accords || '[]');
          return pAccords.some((a: any) => {
            const name = typeof a === 'string' ? a : a.name;
            return accordList.includes(name);
          });
        } catch (e) {
          return false;
        }
      });
    }

    let result = products.map((p: any) => {
      const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
      return {
        ...p,
        images: JSON.parse(p.images || '[]'),
        scentFamilies: JSON.parse(p.scentFamilies || '[]'),
        scentFamilies_be: JSON.parse(p.scentFamilies_be || '[]'),
        topNotes: JSON.parse(p.topNotes),
        heartNotes: JSON.parse(p.heartNotes),
        baseNotes: JSON.parse(p.baseNotes),
        accords: JSON.parse(p.accords || '[]'),
        tags: JSON.parse(p.tags || '[]'),
        tags_be: JSON.parse(p.tags_be || '[]'),
        season: JSON.parse(p.season || '[]'),
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
        variants
      };
    });

    // Sorting
    if (sort) {
      result.sort((a: any, b: any) => {
        const getPrice = (p: any) => {
          if (p.variants && p.variants.length > 0) {
            const prices = p.variants.map((v: any) => parseFloat(String(v.price)));
            return Math.min(...prices.filter((pr: number) => !isNaN(pr)));
          }
          return parseFloat(String(p.price));
        };
        switch (sort) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'price-asc': return getPrice(a) - getPrice(b);
          case 'price-desc': return getPrice(b) - getPrice(a);
          case 'popularity': return (b.popularity || 0) - (a.popularity || 0);
          case 'newest': return b.id - a.id;
          default: return 0;
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch products' });
  }
});

// Advanced Admin Dashboard Stats
app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const salesToday = db.prepare("SELECT SUM(total) as total FROM orders WHERE date(created_at) = ? AND status != 'Cancelled'").get(today) as any;
    const salesWeek = db.prepare("SELECT SUM(total) as total FROM orders WHERE created_at >= date('now', '-7 days') AND status != 'Cancelled'").get() as any;
    const salesMonth = db.prepare("SELECT SUM(total) as total FROM orders WHERE created_at >= date('now', '-30 days') AND status != 'Cancelled'").get() as any;
    
    const activeCarts = db.prepare("SELECT COUNT(*) as count FROM active_carts WHERE updated_at >= date('now', '-1 hour')").get() as any;
    
    const totalViews = db.prepare("SELECT COUNT(*) as count FROM product_views WHERE viewed_at >= date('now', '-30 days')").get() as any;
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE created_at >= date('now', '-30 days')").get() as any;
    const conversion = totalViews.count > 0 ? (totalOrders.count / totalViews.count) * 100 : 0;

    const lowStock = db.prepare(`
      SELECT p.name, v.size, v.stock, p.stockThreshold 
      FROM product_variants v 
      JOIN products p ON v.product_id = p.id 
      WHERE v.stock <= p.stockThreshold
    `).all();

    const recentReviews = db.prepare("SELECT * FROM reviews WHERE status = 'Pending' ORDER BY created_at DESC LIMIT 5").all();

    const salesTrend = db.prepare(`
      SELECT date(created_at) as name, SUM(total) as sales
      FROM orders
      WHERE created_at >= date('now', '-7 days') AND status != 'Cancelled'
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all();

    res.json({
      metrics: {
        salesToday: salesToday?.total || 0,
        salesWeek: salesWeek?.total || 0,
        salesMonth: salesMonth?.total || 0,
        activeCarts: activeCarts.count,
        conversion: conversion.toFixed(2)
      },
      alerts: {
        lowStock,
        pendingReviews: recentReviews.length
      },
      salesTrend
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Sales Reports API (Daily, Weekly, Monthly metrics for Recharts)
app.get('/api/admin/reports/sales', requireAuth, (req, res) => {
  try {
    // 1. Daily Trend (Last 30 days)
    const dailyData = db.prepare(`
      SELECT 
        date(created_at) as label,
        SUM(CAST(total AS REAL)) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE created_at >= date('now', '-30 days') AND status != 'Cancelled'
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all() as any[];

    const processedDaily = dailyData.map(d => ({
      label: d.label,
      revenue: parseFloat(d.revenue.toFixed(2)),
      profit: parseFloat((d.revenue * 0.65).toFixed(2)), // 65% profit margin
      orders: d.orders
    }));

    // 2. Weekly Trend (Last 12 weeks)
    const weeklyData = db.prepare(`
      SELECT 
        strftime('%Y-W%W', created_at) as label,
        SUM(CAST(total AS REAL)) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE created_at >= date('now', '-90 days') AND status != 'Cancelled'
      GROUP BY strftime('%Y-W%W', created_at)
      ORDER BY strftime('%Y-W%W', created_at) ASC
    `).all() as any[];

    const processedWeekly = weeklyData.map(w => ({
      label: w.label,
      revenue: parseFloat(w.revenue.toFixed(2)),
      profit: parseFloat((w.revenue * 0.65).toFixed(2)),
      orders: w.orders
    }));

    // 3. Monthly Trend (Last 12 months)
    const monthlyData = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as label,
        SUM(CAST(total AS REAL)) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE created_at >= date('now', '-365 days') AND status != 'Cancelled'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY strftime('%Y-%m', created_at) ASC
    `).all() as any[];

    const processedMonthly = monthlyData.map(m => {
      // Map '2026-05' to readable format if desired, or let frontend do it
      return {
        label: m.label,
        revenue: parseFloat(m.revenue.toFixed(2)),
        profit: parseFloat((m.revenue * 0.65).toFixed(2)),
        orders: m.orders
      };
    });

    // 4. Overall metrics for selected range (last 90 days total)
    const overall = db.prepare(`
      SELECT 
        SUM(CAST(total AS REAL)) as totalRevenue,
        COUNT(id) as totalOrders
      FROM orders
      WHERE status != 'Cancelled'
    `).get() as any;

    const totalRevenue = overall?.totalRevenue || 0;
    const totalOrders = overall?.totalOrders || 0;
    const totalProfit = totalRevenue * 0.65;
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    // 5. Popular categories / brands by sales
    const topProducts = db.prepare(`
      SELECT 
        product_name as name,
        SUM(quantity) as quantity,
        SUM(CAST(price AS REAL) * quantity) as revenue
      FROM order_items
      JOIN orders ON order_items.order_id = orders.id
      WHERE orders.status != 'Cancelled'
      GROUP BY product_name
      ORDER BY revenue DESC
      LIMIT 5
    `).all() as any[];

    res.json({
      daily: processedDaily,
      weekly: processedWeekly,
      monthly: processedMonthly,
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        totalOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
      },
      topProducts: topProducts.map(tp => ({
        name: tp.name,
        quantity: tp.quantity,
        revenue: parseFloat(tp.revenue.toFixed(2))
      }))
    });
  } catch (error) {
    console.error('Failed to compile sales report data', error);
    res.status(500).json({ error: 'Failed to compile report stats' });
  }
});

// Orders Management
app.get('/api/admin/orders', requireAuth, (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    const result = orders.map((o: any) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
      return { ...o, items };
    });
    res.json({ data: result, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/api/admin/orders/:id', requireAuth, (req, res) => {
  const { status, tracking_number } = req.body;
  try {
    db.prepare('UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?')
      .run(status, tracking_number, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Users Management
app.get('/api/admin/users', requireAuth, (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const users = db.prepare(`
      SELECT u.*, 
             COUNT(o.id) as orderCount, 
             SUM(o.total) as ltv,
             AVG(o.total) as avgOrderValue
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id 
                         OR (u.phone != '' AND o.customer_phone = u.phone) 
                         OR (u.email != '' AND o.customer_email = u.email)
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset).map((u: any) => ({
      ...u,
      createdAt: u.created_at,
      loyaltyStatus: u.loyalty_status,
      notes: u.notes,
      orderCount: u.orderCount || 0,
      ltv: u.ltv || 0,
      avgOrderValue: u.avgOrderValue || 0
    }));
    res.json({ data: users, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Reviews Management
app.get('/api/admin/reviews', requireAuth, (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM reviews').get() as any;
    const reviews = db.prepare(`
      SELECT r.*, p.name as productName 
      FROM reviews r 
      JOIN products p ON r.product_id = p.id 
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset).map((r: any) => ({
      ...r,
      userName: r.user_name,
      productId: r.product_id,
      createdAt: r.created_at,
      adminReply: r.admin_reply
    }));
    res.json({ data: reviews, total: total.count, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.put('/api/admin/reviews/:id', requireAuth, (req, res) => {
  const { status } = req.body;
  try {
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.put('/api/admin/reviews/:id/reply', requireAuth, (req, res) => {
  const { adminReply } = req.body;
  try {
    db.prepare('UPDATE reviews SET admin_reply = ? WHERE id = ?').run(adminReply, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// CMS Pages
app.get('/api/pages/:id', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM cms_pages WHERE id = ?').get(req.params.id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

app.get('/api/admin/cms', requireAuth, (req, res) => {
  try {
    const pages = db.prepare('SELECT * FROM cms_pages').all();
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CMS pages' });
  }
});

app.post('/api/admin/cms', requireAuth, (req, res) => {
  const { id, title, title_be, content, content_be } = req.body;
  
  if (!id || !title) {
    return res.status(400).json({ error: 'ID and title are required' });
  }

  try {
    db.prepare('INSERT INTO cms_pages (id, title, title_be, content, content_be, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .run(id, title, title_be || null, content || '', content_be || null);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return res.status(400).json({ error: 'Page with this ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create CMS page' });
  }
});

app.put('/api/admin/cms/:id', requireAuth, (req, res) => {
  const { title, title_be, content, content_be } = req.body;
  try {
    db.prepare('INSERT OR REPLACE INTO cms_pages (id, title, title_be, content, content_be, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .run(req.params.id, title, title_be || null, content, content_be || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CMS page' });
  }
});

app.delete('/api/admin/cms/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM cms_pages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete CMS page' });
  }
});

// FAQ API Endpoints
app.get('/api/faq', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM faq_items ORDER BY sort_order ASC, id ASC').all();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get FAQ' });
  }
});

app.get('/api/admin/faq', requireAuth, (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM faq_items ORDER BY sort_order ASC, id ASC').all();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get FAQ' });
  }
});

app.post('/api/admin/faq', requireAuth, (req, res) => {
  const { question, question_be, answer, answer_be, sort_order } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }
  try {
    const result = db.prepare('INSERT INTO faq_items (question, question_be, answer, answer_be, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(question, question_be || null, answer, answer_be || null, isNaN(parseInt(sort_order, 10)) ? 0 : parseInt(sort_order, 10));
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create FAQ item' });
  }
});

app.put('/api/admin/faq/:id', requireAuth, (req, res) => {
  const { question, question_be, answer, answer_be, sort_order } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }
  try {
    db.prepare('UPDATE faq_items SET question = ?, question_be = ?, answer = ?, answer_be = ?, sort_order = ? WHERE id = ?')
      .run(question, question_be || null, answer, answer_be || null, isNaN(parseInt(sort_order, 10)) ? 0 : parseInt(sort_order, 10), req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FAQ item' });
  }
});

app.delete('/api/admin/faq/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM faq_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ item' });
  }
});

app.post('/api/products/:id/view', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    db.prepare('INSERT INTO product_views (product_id) VALUES (?)').run(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to log view' });
  }
});

app.get('/api/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as productName 
      FROM reviews r 
      JOIN products p ON r.product_id = p.id 
      WHERE r.status = 'Approved' 
      ORDER BY r.created_at DESC
    `).all();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/products/:id/reviews', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const reviews = db.prepare("SELECT * FROM reviews WHERE product_id = ? AND status = 'Approved' ORDER BY created_at DESC").all(id);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { user_name, rating, comment } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  if (!user_name || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }

  try {
    db.prepare('INSERT INTO reviews (product_id, user_name, rating, comment) VALUES (?, ?, ?, ?)')
      .run(id, user_name, ratingNum, comment);

    // Send Telegram Notification on new review
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      try {
        const product = db.prepare('SELECT brand, name FROM products WHERE id = ?').get(id) as any;
        const productName = product ? `${product.brand} ${product.name}` : `ID ${id}`;
        const stars = '⭐️'.repeat(ratingNum);
        const text = `📬 *Новый отзыв на сайте*\n\n📦 *Товар:* ${productName}\n👤 *Автор:* ${user_name}\n⭐ *Оценка:* ${ratingNum}/5 ${stars}\n💬 *Комментарий:* ${comment}`;
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgError) {
        console.error('Failed to send Telegram review notification:', tgError);
      }
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

app.get('/api/stats/views', requireAuth, (req, res) => {
  const { period } = req.query;
  let dateFilter = '';
  if (period === '7days') {
    dateFilter = "AND viewed_at >= date('now', '-7 days')";
  } else if (period === '30days') {
    dateFilter = "AND viewed_at >= date('now', '-30 days')";
  }

  try {
    const stats = db.prepare(`
      SELECT p.id, p.name, p.brand, COUNT(v.id) as views
      FROM products p
      LEFT JOIN product_views v ON p.id = v.product_id ${dateFilter}
      GROUP BY p.id
      ORDER BY views DESC
    `).all();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/stats/views-over-time', requireAuth, (req, res) => {
  const { period } = req.query;
  let dateFilter = '';
  if (period === '7days') {
    dateFilter = "WHERE viewed_at >= date('now', '-7 days')";
  } else if (period === '30days') {
    dateFilter = "WHERE viewed_at >= date('now', '-30 days')";
  }

  try {
    const stats = db.prepare(`
      SELECT date(viewed_at) as date, COUNT(id) as views
      FROM product_views
      ${dateFilter}
      GROUP BY date(viewed_at)
      ORDER BY date(viewed_at) ASC
    `).all();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time stats' });
  }
});

app.post('/api/products', requireAuth, (req, res) => {
  const { name, brand, description, description_be, imageUrl, images, price, topNotes, heartNotes, baseNotes, accords, gender, scentFamilies, scentFamilies_be, concentration, stockThreshold, tags, tags_be, season, seoTitle, seoDescription, variants, longevity, sillage, topNotesDuration, topNotesDuration_be, heartNotesDuration, heartNotesDuration_be, baseNotesDuration, baseNotesDuration_be } = req.body;
  const slug = slugify(`${brand}-${name}`);
  
  try {
    const insert = db.prepare(`
      INSERT INTO products (name, brand, description, description_be, imageUrl, images, price, topNotes, heartNotes, baseNotes, accords, gender, scentFamilies, scentFamilies_be, concentration, stockThreshold, tags, tags_be, slug, season, seo_title, seo_description, longevity, sillage, topNotesDuration, topNotesDuration_be, heartNotesDuration, heartNotesDuration_be, baseNotesDuration, baseNotesDuration_be, created_at, updated_at)
      VALUES (@name, @brand, @description, @description_be, @imageUrl, @images, @price, @topNotes, @heartNotes, @baseNotes, @accords, @gender, @scentFamilies, @scentFamilies_be, @concentration, @stockThreshold, @tags, @tags_be, @slug, @season, @seoTitle, @seoDescription, @longevity, @sillage, @topNotesDuration, @topNotesDuration_be, @heartNotesDuration, @heartNotesDuration_be, @baseNotesDuration, @baseNotesDuration_be, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = insert.run({
      name, brand, description, description_be: description_be || null, imageUrl, 
      images: JSON.stringify(images || []),
      price,
      topNotes: JSON.stringify(topNotes || []),
      heartNotes: JSON.stringify(heartNotes || []),
      baseNotes: JSON.stringify(baseNotes || []),
      accords: JSON.stringify(accords || []),
      gender,
      scentFamilies: JSON.stringify(scentFamilies || []),
      scentFamilies_be: JSON.stringify(scentFamilies_be || []),
      concentration,
      stockThreshold,
      tags: JSON.stringify(tags || []),
      tags_be: JSON.stringify(tags_be || []),
      season: JSON.stringify(season || []),
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      longevity: longevity !== undefined ? longevity : 70,
      sillage: sillage !== undefined ? sillage : 60,
      topNotesDuration: topNotesDuration || null,
      topNotesDuration_be: topNotesDuration_be || null,
      heartNotesDuration: heartNotesDuration || null,
      heartNotesDuration_be: heartNotesDuration_be || null,
      baseNotesDuration: baseNotesDuration || null,
      baseNotesDuration_be: baseNotesDuration_be || null,
      slug
    });
    
    const productId = result.lastInsertRowid;
    
    if (variants && Array.isArray(variants)) {
      const insertVariant = db.prepare('INSERT INTO product_variants (product_id, size, price, stock, sku, variant_type) VALUES (?, ?, ?, ?, ?, ?)');
      for (const v of variants) {
        insertVariant.run(productId, v.size, v.price, v.stock, v.sku, v.variant_type || 'decant');
      }
    }
    
    res.status(201).json({ id: productId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.put('/api/products/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, brand, description, description_be, imageUrl, images, price, topNotes, heartNotes, baseNotes, accords, gender, scentFamilies, scentFamilies_be, concentration, stockThreshold, tags, tags_be, season, seoTitle, seoDescription, variants, longevity, sillage, topNotesDuration, topNotesDuration_be, heartNotesDuration, heartNotesDuration_be, baseNotesDuration, baseNotesDuration_be } = req.body;
  const slug = slugify(`${brand}-${name}`);
  
  try {
    db.prepare(`
      UPDATE products 
      SET name = @name, brand = @brand, description = @description, description_be = @description_be, imageUrl = @imageUrl, images = @images,
          price = @price, topNotes = @topNotes, heartNotes = @heartNotes, baseNotes = @baseNotes, accords = @accords, gender = @gender,
          scentFamilies = @scentFamilies, scentFamilies_be = @scentFamilies_be, concentration = @concentration, stockThreshold = @stockThreshold, tags = @tags, tags_be = @tags_be, slug = @slug, season = @season, seo_title = @seoTitle, seo_description = @seoDescription, longevity = @longevity, sillage = @sillage,
          topNotesDuration = @topNotesDuration, topNotesDuration_be = @topNotesDuration_be, heartNotesDuration = @heartNotesDuration, heartNotesDuration_be = @heartNotesDuration_be, baseNotesDuration = @baseNotesDuration, baseNotesDuration_be = @baseNotesDuration_be,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({
      id, name, brand, description, description_be: description_be || null, imageUrl,
      images: JSON.stringify(images || []),
      price,
      topNotes: JSON.stringify(topNotes || []),
      heartNotes: JSON.stringify(heartNotes || []),
      baseNotes: JSON.stringify(baseNotes || []),
      accords: JSON.stringify(accords || []),
      gender,
      scentFamilies: JSON.stringify(scentFamilies || []),
      scentFamilies_be: JSON.stringify(scentFamilies_be || []),
      concentration,
      stockThreshold,
      tags: JSON.stringify(tags || []),
      tags_be: JSON.stringify(tags_be || []),
      season: JSON.stringify(season || []),
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      longevity: longevity !== undefined ? longevity : 70,
      sillage: sillage !== undefined ? sillage : 60,
      topNotesDuration: topNotesDuration || null,
      topNotesDuration_be: topNotesDuration_be || null,
      heartNotesDuration: heartNotesDuration || null,
      heartNotesDuration_be: heartNotesDuration_be || null,
      baseNotesDuration: baseNotesDuration || null,
      baseNotesDuration_be: baseNotesDuration_be || null,
      slug
    });

    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
    if (variants && Array.isArray(variants)) {
      const insertVariant = db.prepare('INSERT INTO product_variants (product_id, size, price, stock, sku, variant_type) VALUES (?, ?, ?, ?, ?, ?)');
      for (const v of variants) {
        insertVariant.run(id, v.size, v.price, v.stock, v.sku, v.variant_type || 'decant');
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Abandoned Carts
app.get('/api/admin/abandoned-carts', requireAuth, (req, res) => {
  try {
    const carts = db.prepare(`
      SELECT ac.*, u.name as userName, u.email as userEmail
      FROM active_carts ac
      LEFT JOIN users u ON ac.user_id = u.id
      WHERE ac.updated_at < datetime('now', '-1 hour')
      ORDER BY ac.updated_at DESC
    `).all().map((c: any) => ({
      ...c,
      items: JSON.parse(c.items || '[]'),
      updatedAt: c.updated_at
    }));
    res.json(carts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch abandoned carts' });
  }
});

// Promo Codes
app.get('/api/promo-codes', requireAuth, (req, res) => {
  try {
    const codes = db.prepare('SELECT * FROM promo_codes ORDER BY id DESC').all();
    res.json(codes.map((c: any) => ({
      ...c,
      applicableBrands: JSON.parse(c.applicable_brands || '[]'),
      excludedBrands: JSON.parse(c.excluded_brands || '[]'),
      discountType: c.discount_type,
      discountValue: c.discount_value,
      minOrderAmount: c.min_order_amount,
      validFrom: c.valid_from,
      validUntil: c.valid_until,
      usageLimit: c.usage_limit,
      usedCount: c.used_count
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

app.post('/api/promo-codes', requireAuth, (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, validFrom, validUntil, usageLimit, status, applicableBrands, excludedBrands } = req.body;
  try {
    const insert = db.prepare(`
      INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, valid_from, valid_until, usage_limit, status, applicable_brands, excluded_brands)
      VALUES (@code, @discountType, @discountValue, @minOrderAmount, @validFrom, @validUntil, @usageLimit, @status, @applicableBrands, @excludedBrands)
    `);
    const result = insert.run({
      code, discountType, discountValue, minOrderAmount: minOrderAmount || 0,
      validFrom: validFrom || null, validUntil: validUntil || null,
      usageLimit: usageLimit || 0, status: status || 'Active',
      applicableBrands: JSON.stringify(applicableBrands || []),
      excludedBrands: JSON.stringify(excludedBrands || [])
    });
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

app.put('/api/promo-codes/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { code, discountType, discountValue, minOrderAmount, validFrom, validUntil, usageLimit, status, applicableBrands, excludedBrands } = req.body;
  try {
    db.prepare(`
      UPDATE promo_codes 
      SET code = @code, discount_type = @discountType, discount_value = @discountValue, min_order_amount = @minOrderAmount,
          valid_from = @validFrom, valid_until = @validUntil, usage_limit = @usageLimit, status = @status,
          applicable_brands = @applicableBrands, excluded_brands = @excludedBrands
      WHERE id = @id
    `).run({
      id, code, discountType, discountValue, minOrderAmount: minOrderAmount || 0,
      validFrom: validFrom || null, validUntil: validUntil || null,
      usageLimit: usageLimit || 0, status: status || 'Active',
      applicableBrands: JSON.stringify(applicableBrands || []),
      excludedBrands: JSON.stringify(excludedBrands || [])
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

app.delete('/api/promo-codes/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    db.prepare('DELETE FROM promo_codes WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Export Routes
app.get('/api/admin/export/:type', requireAuth, (req, res) => {
  const { type } = req.params;
  try {
    let data;
    if (type === 'products') {
      data = db.prepare('SELECT * FROM products').all();
    } else if (type === 'orders') {
      data = db.prepare('SELECT * FROM orders').all();
    } else if (type === 'users') {
      data = db.prepare('SELECT * FROM users').all();
    } else {
      return res.status(400).json({ error: 'Invalid export type' });
    }

    if (req.query.format === 'csv') {
      if (data.length === 0) return res.send('');
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: any) => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      res.type('text/csv');
      res.attachment(`${type}_export.csv`);
      return res.send(`${headers}\n${rows}`);
    }

    res.type('application/json');
    res.attachment(`${type}_export.json`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.post('/api/orders', async (req, res) => {
    const { customer_name, customer_phone, items, total, delivery_method, delivery_address, comment, payment_method } = req.body;
    
    // Update popularity for products in the order
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const productId = item.id || item.product_id;
        if (productId) {
          db.prepare('UPDATE products SET popularity = popularity + ? WHERE id = ?').run(item.quantity || 1, productId);
        }
      }
    }

    try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, customer_phone, customer_region, total, status, delivery_method, delivery_address, comment, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertOrder.run(customer_name, '', customer_phone, '', total, 'New', delivery_method || '', delivery_address || '', comment || '', payment_method || 'При получении');
    const orderId = result.lastInsertRowid;
    
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_size, quantity, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of items) {
      insertOrderItem.run(
        orderId, 
        item.id || item.product_id, 
        item.selectedVariantId || null, 
        item.name || item.product_name, 
        item.selectedVariantSize || null, 
        item.quantity, 
        item.price
      );
    }
    
    // Telegram Notification
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (botToken && chatId) {
      const itemsText = items.map((item: any) => {
        const variantInfo = item.selectedVariantSize ? ` (${item.selectedVariantSize})` : '';
        return `• ${item.name}${variantInfo} x${item.quantity} (${item.price} BYN)`;
      }).join('\n');
      
      let text = `🛍 *Новый заказ #${orderId}*\n\n👤 *Клиент:* ${customer_name}\n📞 *Телефон:* ${customer_phone}\n`;
      if (delivery_method) text += `🚚 *Доставка:* ${delivery_method}\n`;
      if (delivery_address) text += `📍 *Адрес:* ${delivery_address}\n`;
      if (payment_method) text += `💳 *Оплата:* ${payment_method}\n`;
      if (comment) text += `💬 *Комментарий:* ${comment}\n`;
      text += `\n📦 *Товары:*\n${itemsText}\n\n💰 *Итого:* ${total} BYN`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
    }
    
    res.status(201).json({ success: true, orderId });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/callback', async (req, res) => {
  const { name, phone, message } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured. Simulating success.');
    return res.status(200).json({ success: true, simulated: true });
  }

  const text = `🔔 *Новая заявка на звонок*\n\n👤 *Имя:* ${name}\n📞 *Телефон:* ${phone}\n💬 *Сообщение:* ${message || 'Нет сообщения'}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send Telegram message');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Telegram error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// SiteMap generation rules should be top-level routes

async function startServer() {
  const PORT = 3000;

  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom', // change to custom so we can process HTML
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist'), { index: false })); // disable index serving to intercept /
    app.use(express.static(path.join(__dirname, 'public')));
  }

  app.get('*', async (req, res, next) => {
    try {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return next();
      }

      let htmlPath = process.env.NODE_ENV !== 'production' 
        ? path.join(__dirname, 'index.html') 
        : path.join(__dirname, 'dist', 'index.html');
        
      if (!fs.existsSync(htmlPath)) {
        return res.status(404).send('Not found');
      }

      let html = fs.readFileSync(htmlPath, 'utf-8');

      const domain = `${req.protocol}://${req.get('host')}`;
      let ldJson: any[] = [];
      const genSetStr = db.prepare('SELECT value FROM settings WHERE key = ?').get('general_settings')?.value as string || '{}';
      const genSet = JSON.parse(genSetStr);

      const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "АРХЕТИП",
        "url": domain,
        "logo": `${domain}/favicon.png`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Grodno",
          "addressCountry": "BY",
          "postalCode": "230005",
          "streetAddress": "ул. Парфюмерная 123"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": genSet.phone || "+37529XXXXXXX",
          "contactType": "customer service"
        }
      };

      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "АРХЕТИП",
        "url": domain,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${domain}/catalog?search={search_term_string}`
        }
      };
      ldJson.push(orgSchema, websiteSchema);

      let customTitle = genSet.seoTitle || "АРХЕТИП | Нишевая парфюмерия в Гродно и Беларуси — Купить оригинальные духи на распив";
      let customDescription = genSet.seoDescription || "Эксклюзивная оригинальная нишевая и селективная парфюмерия в Гродно на распив (отливанты) и в оригинальных флаконах с доставкой по Минску, Гродно и всей Беларуси. Гарантия оригинальности.";
      let customKeywords = "нишевый парфюм гродно, купить парфюм в гродно, нишевая парфюмерия беларусь, селективные духи, распив парфюмерии, отливанты купить беларусь, оригинальные духи гродно, интернет магазин духов гродно";
      let customImage = `${domain}/favicon.png`;

      if (req.path.startsWith('/catalog/')) {
        try {
          const slug = req.path.split('/').pop();
          if (slug) {
            const product = db.prepare('SELECT * FROM products WHERE slug = ? OR id = ?').get(slug, slug) as any;
            if (product) {
              const pVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id) as any[];
              let lowestPrice = Infinity;
              pVariants.forEach(v => {
                const val = parseFloat(v.price);
                if (!isNaN(val) && val < lowestPrice) lowestPrice = val;
              });
              if (lowestPrice === Infinity) lowestPrice = parseFloat(product.price) || 0;

              let inStock = pVariants.some(v => v.stock > 0);

              const productReviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? AND status = "Approved"').all(product.id) as any[];
              
              const productSchema: any = {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": `${product.brand} ${product.name}`,
                "image": [
                  (product.imageUrl || '').startsWith('http') ? product.imageUrl : domain + (product.imageUrl || '/favicon.png')
                ],
                "description": product.description || '',
                "sku": product.id.toString(),
                "brand": {
                  "@type": "Brand",
                  "name": product.brand
                },
                "offers": {
                  "@type": "Offer",
                  "url": `${domain}/catalog/${slug}`,
                  "priceCurrency": "BYN",
                  "price": lowestPrice,
                  "itemCondition": "https://schema.org/NewCondition",
                  "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "priceValidUntil": "2027-12-31",
                  "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                      "@type": "MonetaryAmount",
                      "value": 5,
                      "currency": "BYN"
                    },
                    "shippingDestination": {
                      "@type": "DefinedRegion",
                      "addressCountry": "BY"
                    },
                    "deliveryTime": {
                      "@type": "ShippingDeliveryTime",
                      "handlingTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 0,
                        "maxValue": 1,
                        "unitCode": "DAY"
                      },
                      "transitTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 1,
                        "maxValue": 5,
                        "unitCode": "DAY"
                      }
                    }
                  },
                  "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "applicableCountry": "BY",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "merchantReturnDays": 14,
                    "returnMethod": "https://schema.org/ReturnByMail",
                    "returnFees": "https://schema.org/FreeReturn",
                    "merchantReturnLink": `${domain}/page/returns`
                  }
                }
              };

              if (productReviews.length > 0) {
                const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
                productSchema.aggregateRating = {
                  "@type": "AggregateRating",
                  "ratingValue": avgRating.toFixed(1),
                  "reviewCount": productReviews.length
                };
                productSchema.review = productReviews.map(r => ({
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": String(r.user_name || '').trim() || "Покупатель"
                  },
                  "datePublished": r.created_at || "2024-01-01",
                  "reviewBody": String(r.comment || '').trim() || "Прекрасный аромат.",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": r.rating
                  }
                }));
              } else {
                productSchema.aggregateRating = {
                  "@type": "AggregateRating",
                  "ratingValue": "5.0",
                  "reviewCount": "1"
                };
                productSchema.review = {
                  "@type": "Review",
                  "author": {
                    "@type": "Person",
                    "name": "Клиент"
                  },
                  "datePublished": "2024-01-01",
                  "reviewBody": "Прекрасный оригинальный аромат. Рекомендую!",
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5"
                  }
                };
              }

              const breadcrumbSchema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Главная",
                    "item": domain
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Каталог",
                    "item": `${domain}/catalog`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": `${product.brand} ${product.name}`,
                    "item": `${domain}/catalog/${slug}`
                  }
                ]
              };
              ldJson.push(productSchema, breadcrumbSchema);
              
              customTitle = `${product.brand} ${product.name} — Купить отливант на распив и оригинал в Гродно | АРХЕТИП`;
              customDescription = `Купить оригинальные духи ${product.brand} ${product.name} на распив (отливанты от 2 мл) в Гродно с быстрой доставкой по всей Беларуси. ${product.description ? product.description.substring(0, 140).trim() + '...' : ''}`;
              customKeywords = `${product.brand} ${product.name} купить, оригинальные духи гродно, распив парфюмерии гродно, отливант ${product.name}, парфюм ${product.brand} беларусь`;
              customImage = (product.imageUrl || '').startsWith('http') ? product.imageUrl : domain + (product.imageUrl || '/favicon.png');
            }
          }
        } catch (error) {
          console.error('Failed to inject Product SEO schema/meta', error);
        }
      } else if (req.path === '/p/faq' || req.path.startsWith('/p/faq')) {
        try {
          const faqs = db.prepare('SELECT * FROM faq_items ORDER BY sort_order ASC, id ASC').all() as any[];
          if (faqs && faqs.length > 0) {
            const faqSchema = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            };
            const faqBreadcrumb = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Главная",
                  "item": domain
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Вопросы и ответы",
                  "item": `${domain}/p/faq`
                }
              ]
            };
            ldJson.push(faqSchema, faqBreadcrumb);
            
            customTitle = "Часто задаваемые вопросы (FAQ) о распиве и оригинальной парфюмерии | АРХЕТИП";
            customDescription = "Ответы на популярные вопросы о подборе оригинальной нишевой парфюмерии, доставке по Беларуси, отличии отливантов от тестеров в магазине Archetype.";
            customKeywords = "faq, вопросы и ответы, парфюмерия беларусь отзывы, доставка отливантов, оригинальный парфюм";
          }
        } catch (error) {
          console.error('Failed to inject FAQ Schema', error);
        }
      } else if (req.path === '/catalog' || req.path === '/catalog/') {
        const brand = req.query.brand ? String(req.query.brand) : '';
        const search = req.query.search ? String(req.query.search) : '';
        const category = req.query.category ? String(req.query.category) : '';
        const gender = req.query.gender ? String(req.query.gender) : '';
        const scentFamily = req.query.family ? String(req.query.family) : '';
        
        let filterParts = [];
        if (brand) filterParts.push(brand);
        if (category) {
          const catMap: Record<string, string> = {
            'decants': 'отливанты',
            'full': 'флаконы',
            'boxes': 'боксы',
            'sets': 'наборы'
          };
          filterParts.push(catMap[category.toLowerCase()] || category);
        }
        if (gender) {
          const genderStr = gender === 'Male' ? 'для мужчин' : gender === 'Female' ? 'для женщин' : gender === 'Unisex' ? 'унисекс' : gender;
          filterParts.push(genderStr);
        }
        if (scentFamily) filterParts.push(`${scentFamily} ароматы`);
        if (search) filterParts.push(`поиск: "${search}"`);
        
        if (filterParts.length > 0) {
          const suffix = filterParts.join(', ');
          customTitle = `${suffix} — купить оригинальный парфюм на распив в Гродно | АРХЕТИП`;
          customDescription = `Вся оригинальная селективная парфюмерия (${suffix}) в магазине АРХЕТИП. Только оригиналы, удобный распив на выбор, быстрая доставка по Гродно, Минску и всей Беларуси.`;
        } else {
          customTitle = "Каталог селективного и нишевого парфюма в Гродно — Купить отливанты с доставкой | АРХЕТИП";
          customDescription = "Каталог оригинальных селективных духов от лучших нишевых брендов (Tom Ford, Byredo, Kilian, Le Labo) в Гродно. Удобный распив в проверенные отливанты. Быстрая доставка по Беларуси.";
        }
        customKeywords = "каталог парфюма гродно, нишевые бренды гродно, оригинальные духи купить в беларуси, заказать отливанты гродно, селективная парфюмерия каталог, распив духи";

        const catalogBreadcrumb = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Главная",
              "item": domain
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Каталог",
              "item": `${domain}/catalog`
            }
          ]
        };
        ldJson.push(catalogBreadcrumb);
      } else if (req.path === '/contacts' || req.path === '/contacts/') {
        customTitle = "Контакты интернет-магазина АРХЕТИП — Нишевая парфюмерия в Беларуси";
        customDescription = "Свяжитесь с нами для консультации и заказа оригинальной селективной парфюмерии: телефон, Telegram, Instagram. Быстрая доставка по Гродно, Минску и РБ.";
        customKeywords = "контакты, заказать парфюм, оригинальные духи беларусь, архетип контакты";

        const contactsBreadcrumb = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Главная",
              "item": domain
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Контакты",
              "item": `${domain}/contacts`
            }
          ]
        };
        ldJson.push(contactsBreadcrumb);
      } else if (req.path === '/about' || req.path === '/about/') {
        customTitle = "О магазине АРХЕТИП — Эксклюзивный парфюм и селективная парфюмерия на распив";
        customDescription = "АРХЕТИП — ваш надежный путеводитель в мире селективных ароматов. Мы предлагаем 100% оригинальную продукцию, парфюмерные боксы и удобный распив духов.";
        customKeywords = "о магазине, о нас, оригинальная парфюмерия, архетип духи";

        const aboutBreadcrumb = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Главная",
              "item": domain
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "О магазине",
              "item": `${domain}/about`
            }
          ]
        };
        ldJson.push(aboutBreadcrumb);
      } else if (req.path === '/reviews' || req.path === '/reviews/') {
        customTitle = "Отзывы покупателей о магазине АРХЕТИП — Оригинальные духи и отливанты";
        customDescription = "Искренние отзывы клиентов о покупке оригинальной нишевой парфюмерии и качестве обслуживания в магазине АРХЕТИП. Оценки шлейфа, стойкости духов.";
        customKeywords = "отзывы, парфюм отзывы, оригинальные духи отзывы, архетип отзывы клиентов";

        const reviewsBreadcrumb = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Главная",
              "item": domain
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Отзывы",
              "item": `${domain}/reviews`
            }
          ]
        };
        ldJson.push(reviewsBreadcrumb);
      } else if (req.path.startsWith('/p/')) {
        const id = req.path.split('/').pop();
        if (id) {
          try {
            const page = db.prepare('SELECT * FROM cms_pages WHERE id = ?').get(id) as any;
            if (page) {
              customTitle = `${page.title} | АРХЕТИП — Нишевая парфюмерия в Беларуси`;
              const cleanContent = (page.content || '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              customDescription = cleanContent.substring(0, 160).trim() + "...";
              customKeywords = `${page.title.toLowerCase()}, архетип, нишевая парфюмерия беларусь`;

              const pageBreadcrumb = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Главная",
                    "item": domain
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": page.title,
                    "item": `${domain}/p/${id}`
                  }
                ]
              };
              ldJson.push(pageBreadcrumb);
            }
          } catch (e) {
            console.error('Failed to inject CMS page seo', e);
          }
        }
      } else if (req.path === '/' || req.path === '/index.html') {
        const homeBreadcrumb = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Главная",
              "item": domain
            }
          ]
        };
        ldJson.push(homeBreadcrumb);
      }

      // Check if current page should be hidden from search engines (NoIndex)
      const adminPathEnv = process.env.VITE_ADMIN_PATH || 'admin';
      const cleanAdminPath = adminPathEnv.startsWith('/') ? adminPathEnv : `/${adminPathEnv}`;
      const isNoIndex = req.path === cleanAdminPath || 
                        req.path.startsWith(cleanAdminPath + '/') || 
                        req.path === '/admin' ||
                        req.path.startsWith('/admin/') ||
                        req.path === '/wishlist' ||
                        req.path === '/wishlist/' ||
                        req.path === '/cart' ||
                        req.path === '/cart/' ||
                        req.path === '/forbidden' ||
                        req.path === '/502' ||
                        req.path === '/500';

      // Build optimized canonical URL to allow indexation of key category/brand pages while avoiding duplicate garbage parameters
      let canonicalUrl = `${domain}${req.path}`;
      if (req.path === '/catalog' || req.path === '/catalog/') {
        const canonicalParams = new URLSearchParams();
        const brand = req.query.brand ? String(req.query.brand) : '';
        const category = req.query.category ? String(req.query.category) : '';
        const gender = req.query.gender ? String(req.query.gender) : '';
        const family = req.query.family ? String(req.query.family) : '';
        
        if (brand) canonicalParams.set('brand', brand);
        if (category) canonicalParams.set('category', category);
        if (gender) canonicalParams.set('gender', gender);
        if (family) canonicalParams.set('family', family);
        
        const queryString = canonicalParams.toString();
        canonicalUrl = queryString ? `${domain}/catalog?${queryString}` : `${domain}/catalog`;
      }

      // Check for search engine verification codes in config
      const yandexMetaTag = genSet.yandexVerification ? `\n        <meta name="yandex-verification" content="${genSet.yandexVerification.trim()}" />` : '';
      const googleMetaTag = genSet.googleVerification ? `\n        <meta name="google-site-verification" content="${genSet.googleVerification.trim()}" />` : '';

      // Check and build Yandex.Metrika tracking counter
      let yandexMetricaScript = '';
      if (genSet.yandexMetrica && genSet.yandexMetrica.trim()) {
        const metricaId = parseInt(genSet.yandexMetrica.trim(), 10);
        if (!isNaN(metricaId)) {
          yandexMetricaScript = `
        <!-- Yandex.Metrika counter -->
        <script type="text/javascript" >
           (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
           m[i].l=1*new Date();
           for (var j = 0; j < t.length; j++) {if (t[j].name === r) { return; }}
           k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
           (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

           ym(${metricaId}, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
           });
        </script>
        <noscript><div><img src="https://mc.yandex.ru/watch/${metricaId}" style="position:absolute; left:-9999px;" alt="" referrerPolicy="no-referrer" /></div></noscript>
        <!-- /Yandex.Metrika counter -->
          `;
        }
      }

      // Replace duplicate-prone elements
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${customTitle}</title>`);
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${customDescription}" />`);

      const robotsMeta = isNoIndex ? '\n        <meta name="robots" content="noindex, nofollow" />' : '';

      const finalMetaTags = `
        <meta name="keywords" content="${customKeywords}" />${robotsMeta}${yandexMetaTag}${googleMetaTag}${yandexMetricaScript}
        <meta property="og:title" content="${customTitle}" />
        <meta property="og:description" content="${customDescription}" />
        <meta property="og:image" content="${customImage}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${domain}${req.path}" />
        <link rel="canonical" href="${canonicalUrl}" />
        <link rel="icon" href="${domain}/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="${domain}/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="${domain}/favicon.png" />
      `;

      html = html.replace('</head>', `${finalMetaTags}</head>`);

      const scriptTag = `<script type="application/ld+json">${JSON.stringify(ldJson)}</script>`;
      html = html.replace('</head>', `${scriptTag}</head>`);

      if (process.env.NODE_ENV !== 'production' && vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
