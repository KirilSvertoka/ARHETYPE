// One-time migration: convert raster files in the uploads dir to WebP and
// rewrite /uploads/... references in the database. Idempotent — files that
// already exist as .webp are skipped. Run from the project root:
//   node scripts/convert-uploads.mjs
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(__dirname);
const uploadDir = process.env.UPLOAD_DIR || path.join(root, 'uploads');
const db = new Database(process.env.DATABASE_PATH || path.join(root, 'perfume.db'));

const RASTER = new Set(['.jpg', '.jpeg', '.png', '.gif', '.avif']);
const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
let converted = 0, skipped = 0, failed = 0;

for (const name of files) {
  const ext = path.extname(name).toLowerCase();
  if (!RASTER.has(ext)) continue;
  const base = name.slice(0, -ext.length);
  const webpName = base + '.webp';
  const src = path.join(uploadDir, name);
  const dst = path.join(uploadDir, webpName);
  try {
    if (!fs.existsSync(dst)) {
      await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dst);
    }
    // Keep the original until the WebP is proven non-empty.
    if (fs.existsSync(dst) && fs.statSync(dst).size > 0) {
      fs.rmSync(src, { force: true });
      converted++;
    } else {
      skipped++;
    }
  } catch (e) {
    console.error(`Failed: ${name}`, e.message);
    failed++;
  }
}
console.log(`Files: converted ${converted}, skipped ${skipped}, failed ${failed}`);

// Rewrite DB references. Products keep old URLs only if the webp is missing.
const uploadUrl = (u) => typeof u === 'string' && u.startsWith('/uploads/') ? u : null;
const toWebpUrl = (u) => uploadUrl(u)?.replace(/\.[^.]+$/, '.webp');

const products = db.prepare('SELECT id, imageUrl, images FROM products').all();
const updProduct = db.prepare('UPDATE products SET imageUrl = ?, images = ? WHERE id = ?');
let productUpdates = 0;
for (const p of products) {
  let images = [];
  try { images = JSON.parse(p.images || '[]'); } catch {}
  const mapUrl = (u) => {
    const w = toWebpUrl(u);
    return w && fs.existsSync(path.join(uploadDir, path.basename(w))) ? w : u;
  };
  const newMain = mapUrl(p.imageUrl);
  const newList = Array.isArray(images) ? images.map(mapUrl) : images;
  if (newMain !== p.imageUrl || JSON.stringify(newList) !== JSON.stringify(images)) {
    updProduct.run(newMain, JSON.stringify(newList), p.id);
    productUpdates++;
  }
}
console.log(`Products updated: ${productUpdates}`);

// CMS pages may embed uploads in markdown content (ru and be).
const pages = db.prepare('SELECT id, content, content_be FROM cms_pages').all();
const updPage = db.prepare('UPDATE cms_pages SET content = ?, content_be = ? WHERE id = ?');
let pageUpdates = 0;
for (const pg of pages) {
  const rewrite = (text) => {
    if (!text) return text;
    return text.replace(/\/uploads\/([A-Za-z0-9._-]+)/g, (m, name) => {
      const webp = name.replace(/\.[^.]+$/, '.webp');
      return fs.existsSync(path.join(uploadDir, webp)) ? `/uploads/${webp}` : m;
    });
  };
  const newContent = rewrite(pg.content);
  const newContentBe = rewrite(pg.content_be);
  if (newContent !== pg.content || newContentBe !== pg.content_be) {
    updPage.run(newContent, newContentBe, pg.id);
    pageUpdates++;
  }
}
console.log(`CMS pages updated: ${pageUpdates}`);

db.close();
