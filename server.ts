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

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    price REAL NOT NULL,
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
    sillage INTEGER DEFAULT 60
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_region TEXT NOT NULL,
    total REAL NOT NULL,
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
    price REAL NOT NULL,
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
    content TEXT NOT NULL,
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
`);

// Seed default home config
const defaultHomeConfig = {
  announcement: { text: "Бесплатная доставка от 150 BYN", text_be: "Бясплатная дастаўка ад 150 BYN", active: true },
  hero: {
    slides: [
      {
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000&auto=format&fit=crop",
        title: "Искусство минимализма",
        title_be: "Мастацтва мінімалізму",
        subtitle: "Найдите свой идеальный аромат.",
        subtitle_be: "Знайдзіце свой ідэальны водар.",
        link: "/catalog"
      }
    ]
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
  ]
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
  address: "ул. Парфюмерная 123, Минск, Беларусь",
  address_be: "вул. Парфумерная 123, Мінск, Беларусь",
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
  stat3Label_be: "Шчаслівых кліентаў"
};
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('home_config', JSON.stringify(defaultHomeConfig));
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('general_settings', JSON.stringify(defaultGeneralSettings));

// Seed CMS pages
const seedCMS = [
  { id: 'delivery', title: 'Доставка и оплата', title_be: 'Дастаўка і аплата', content: 'Информация о способах доставки по Минску и Беларуси. Оплата наличными, картой, ЕРИП.' },
  { id: 'returns', title: 'Гарантия и возврат', title_be: 'Гарантыя і вяртанне', content: 'Согласно постановлению Совета Министров РБ №778 парфюмерно-косметические товары надлежащего качества обмену и возврату не подлежат.' },
];
seedCMS.forEach(page => {
  db.prepare('INSERT OR IGNORE INTO cms_pages (id, title, title_be, content, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .run(page.id, page.title, page.title_be, page.content);
});

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
  "ALTER TABLE orders ADD COLUMN comment TEXT"
];

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
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /admin
Allow: /

Sitemap: ${domain}/sitemap.xml
Sitemap: ${domain}/api/feeds/yandex.xml
Sitemap: ${domain}/api/feeds/google.xml`);
});

app.get('/sitemap.xml', (req, res) => {
  try {
    const domain = req.protocol + '://' + req.get('host');
    const products = db.prepare('SELECT slug FROM products').all() as { slug: string }[];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/catalog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/contacts</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/reviews</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    products.forEach(product => {
      if (product.slug) {
        xml += `
  <url>
    <loc>${domain}/catalog/${product.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      }
    });

    xml += `\n</urlset>`;
    
    res.type('application/xml');
    res.send(xml);
  } catch (error) {
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

app.get('/api/settings/home', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('home_config') as { value: string };
    if (row) {
      res.json(JSON.parse(row.value));
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

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    // Remove exact LIKE search, we'll do it in memory with fuse.js later
    // if (search) {
    //   query += ' AND (name LIKE ? OR brand LIKE ?)';
    //   params.push(`%${search}%`, `%${search}%`);
    // }

    if (brand && brand !== 'All') {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (gender && gender !== 'All') {
      query += ' AND gender = ?';
      params.push(gender);
    }

    if (category && category !== 'All') {
      if (category === 'decant') {
        query += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
        params.push('%отливант%', '%отливант%', '%отливант%');
      } else {
        let concentration = '';
        switch (category) {
          case 'perfume': concentration = 'Parfum'; break;
          case 'eau_de_toilette': concentration = 'EDT'; break;
          case 'cologne': concentration = 'EDC'; break;
          case 'oil': concentration = 'Oil'; break;
        }
        if (concentration) {
          query += ' AND concentration = ?';
          params.push(concentration);
        }
      }
    }

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
      products = products.filter((p: any) => {
        const pFamilies = JSON.parse(p.scentFamilies || '[]');
        return pFamilies.some((f: string) => familyList.includes(f));
      });
    }

    // In-memory filtering for accords
    if (accords) {
      const accordList = (accords as string).split(',');
      products = products.filter((p: any) => {
        try {
          const pAccords = JSON.parse(p.accords || '[]');
          return pAccords.some((a: any) => accordList.includes(a.name));
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
        const getPrice = (p: any) => p.variants && p.variants.length > 0 ? Math.min(...p.variants.map((v: any) => v.price)) : p.price;
        switch (sort) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'price-asc': return getPrice(a) - getPrice(b);
          case 'price-desc': return getPrice(b) - getPrice(a);
          case 'popularity': return (b.popularity || 0) - (a.popularity || 0);
          default: return 0;
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
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
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset).map((u: any) => ({
      ...u,
      createdAt: u.created_at,
      loyaltyStatus: u.loyalty_status,
      notes: u.notes
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

app.post('/api/products/:id/reviews', (req, res) => {
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
    res.status(201).json({ success: true });
  } catch (error) {
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
  const { name, brand, description, description_be, imageUrl, images, price, topNotes, heartNotes, baseNotes, accords, gender, scentFamilies, scentFamilies_be, concentration, stockThreshold, tags, tags_be, season, seoTitle, seoDescription, variants, longevity, sillage } = req.body;
  const slug = slugify(`${brand}-${name}`);
  
  try {
    const insert = db.prepare(`
      INSERT INTO products (name, brand, description, description_be, imageUrl, images, price, topNotes, heartNotes, baseNotes, accords, gender, scentFamilies, scentFamilies_be, concentration, stockThreshold, tags, tags_be, slug, season, seo_title, seo_description, longevity, sillage)
      VALUES (@name, @brand, @description, @description_be, @imageUrl, @images, @price, @topNotes, @heartNotes, @baseNotes, @accords, @gender, @scentFamilies, @scentFamilies_be, @concentration, @stockThreshold, @tags, @tags_be, @slug, @season, @seoTitle, @seoDescription, @longevity, @sillage)
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
      slug
    });
    
    const productId = result.lastInsertRowid;
    
    if (variants && Array.isArray(variants)) {
      const insertVariant = db.prepare('INSERT INTO product_variants (product_id, size, price, stock, sku) VALUES (?, ?, ?, ?, ?)');
      for (const v of variants) {
        insertVariant.run(productId, v.size, v.price, v.stock, v.sku);
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
  const { name, brand, description, description_be, imageUrl, images, price, topNotes, heartNotes, baseNotes, accords, gender, scentFamilies, scentFamilies_be, concentration, stockThreshold, tags, tags_be, season, seoTitle, seoDescription, variants, longevity, sillage } = req.body;
  const slug = slugify(`${brand}-${name}`);
  
  try {
    db.prepare(`
      UPDATE products 
      SET name = @name, brand = @brand, description = @description, description_be = @description_be, imageUrl = @imageUrl, images = @images,
          price = @price, topNotes = @topNotes, heartNotes = @heartNotes, baseNotes = @baseNotes, accords = @accords, gender = @gender,
          scentFamilies = @scentFamilies, scentFamilies_be = @scentFamilies_be, concentration = @concentration, stockThreshold = @stockThreshold, tags = @tags, tags_be = @tags_be, slug = @slug, season = @season, seo_title = @seoTitle, seo_description = @seoDescription, longevity = @longevity, sillage = @sillage
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
      slug
    });

    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
    if (variants && Array.isArray(variants)) {
      const insertVariant = db.prepare('INSERT INTO product_variants (product_id, size, price, stock, sku) VALUES (?, ?, ?, ?, ?)');
      for (const v of variants) {
        insertVariant.run(id, v.size, v.price, v.stock, v.sku);
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
    const { customer_name, customer_phone, items, total, delivery_method, delivery_address, comment } = req.body;
    
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
      INSERT INTO orders (customer_name, customer_email, customer_phone, customer_region, total, status, delivery_method, delivery_address, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertOrder.run(customer_name, '', customer_phone, '', total, 'New', delivery_method || '', delivery_address || '', comment || '');
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

// SiteMap generation rules
app.get('/sitemap.xml', (req, res) => {
  try {
    const products = db.prepare('SELECT slug, updated_at FROM products').all() as any[];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- static pages -->
  <url><loc>https://archetype.by/</loc><priority>1.0</priority></url>
  <url><loc>https://archetype.by/catalog</loc><priority>0.9</priority></url>
  <url><loc>https://archetype.by/about</loc><priority>0.8</priority></url>
  <url><loc>https://archetype.by/contacts</loc><priority>0.8</priority></url>
  
  <!-- dynamic products -->
`;

    products.forEach(p => {
      xml += `  <url>
    <loc>https://archetype.by/catalog/${p.slug}</loc>
    <priority>0.7</priority>
  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
