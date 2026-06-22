import Database from 'better-sqlite3';
const db = new Database('perfume.db');
const variants = db.prepare("SELECT * FROM product_variants").all();
console.log("TOTAL VARIANTS:", variants.length);
variants.slice(0, 15).forEach((v: any) => {
  console.log(`Product ID: ${v.product_id} | Size: ${v.size} | Price: ${v.price} | Stock: ${v.stock} | Type: ${v.variant_type}`);
});
db.close();
