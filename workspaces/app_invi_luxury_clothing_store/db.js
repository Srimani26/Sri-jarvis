/**
 * Invi Creation - Luxury Ethnic Wear
 * Real Persistent SQLite Database Layer
 * Built with native Node.js node:sqlite (zero external dependencies)
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      fabric TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      compare_at_price REAL,
      rating REAL DEFAULT 4.9,
      reviews_count INTEGER DEFAULT 128,
      image_url TEXT NOT NULL,
      badge TEXT DEFAULT 'BESTSELLER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 20,
      sku TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_code TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PAID',
      fulfillment_status TEXT NOT NULL DEFAULT 'PROCESSING',
      courier_partner TEXT DEFAULT 'BlueDart Express',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      change_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed authentic Invi Creation luxury apparel if table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  const insertProduct = db.prepare(`
    INSERT INTO products (name, handle, category, fabric, description, price, compare_at_price, rating, reviews_count, image_url, badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO variants (product_id, size, color, stock_quantity, sku)
    VALUES (?, ?, ?, ?, ?)
  `);

  const products = [
    {
      name: 'Royal Kanchipuram Pure Zari Silk Saree',
      handle: 'royal-kanchipuram-pure-zari-silk-saree',
      category: 'Sarees',
      fabric: 'Pure Mulberry Silk with 24K Gold Zari',
      description: 'Handwoven in Kanchipuram by generational master weavers. Features traditional peacock motifs, heavy contrast pallu, and silk mark certification.',
      price: 18500,
      compare_at_price: 24000,
      rating: 4.98,
      reviews_count: 242,
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      badge: 'ROYAL HERITAGE',
      sizes: ['Free Size (6.3m with blouse)'],
      colors: ['Deep Crimson Red', 'Peacock Blue', 'Emerald Green']
    },
    {
      name: 'Banarasi Kadwa Jangla Georgette Saree',
      handle: 'banarasi-kadwa-jangla-georgette-saree',
      category: 'Sarees',
      fabric: 'Handspun Khaddi Georgette with Silver Zari',
      description: 'Intricately handcrafted Kadwa weave from Varanasi. Adorned with delicate floral jaal and meenakari highlights for timeless royal gatherings.',
      price: 14200,
      compare_at_price: 19500,
      rating: 4.95,
      reviews_count: 188,
      image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      badge: 'BESTSELLER',
      sizes: ['Free Size (6.3m with blouse)'],
      colors: ['Vintage Rani Pink', 'Mustard Gold', 'Pastel Mint']
    },
    {
      name: 'Handcrafted Zardozi Velvet Anarkali Set',
      handle: 'handcrafted-zardozi-velvet-anarkali-set',
      category: 'Kurthis',
      fabric: 'Micro Velvet Kurti with Organza Dupatta',
      description: 'Floor-length flared silhouette embellished with dabka, gota patti, and French knot zardozi embroidery. Accompanied by silk churidar and scalloped dupatta.',
      price: 8900,
      compare_at_price: 12500,
      rating: 4.92,
      reviews_count: 145,
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      badge: 'FESTIVE EDIT',
      sizes: ['S (36)', 'M (38)', 'L (40)', 'XL (42)', 'XXL (44)'],
      colors: ['Wine Burgundy', 'Midnight Navy', 'Forest Green']
    },
    {
      name: 'Chanderi Silk Flared Kurti with Hand Embroidery',
      handle: 'chanderi-silk-flared-kurti-hand-embroidery',
      category: 'Kurthis',
      fabric: 'Pure Chanderi Silk with Mulmul Lining',
      description: 'Breezy yet regal daytime formal ensemble with subtle resham threadwork, wooden buttons, and pockets.',
      price: 4600,
      compare_at_price: 6200,
      rating: 4.88,
      reviews_count: 94,
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      badge: 'NEW ARRIVAL',
      sizes: ['S (36)', 'M (38)', 'L (40)', 'XL (42)', 'XXL (44)'],
      colors: ['Ivory Pearl', 'Peach Nectar', 'Powder Blue']
    },
    {
      name: 'Imperial Heritage Bridal Raw Silk Lehenga',
      handle: 'imperial-heritage-bridal-raw-silk-lehenga',
      category: 'Lehengas',
      fabric: 'Heavy Raw Silk with Double Can-Can',
      description: 'Statement wedding couture lehenga adorned with 32 panels of hand-beaded tilla and cutdana work. Includes double dupatta styling.',
      price: 36000,
      compare_at_price: 48000,
      rating: 5.0,
      reviews_count: 76,
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      badge: 'LIMITED COUTURE',
      sizes: ['Custom Tailored (S-XXL)'],
      colors: ['Royal Marwar Red', 'Rust Amber', 'Plum Wine']
    },
    {
      name: 'Mukaish Embellished Chiffon Festive Saree',
      handle: 'mukaish-embellished-chiffon-festive-saree',
      category: 'Sarees',
      fabric: 'Pure Viscose Chiffon with Silver Mukaish Dots',
      description: 'Feather-light drape with hand-flattened silver metallic badla wires. Paired with unstitched raw silk blouse piece.',
      price: 9800,
      compare_at_price: 13200,
      rating: 4.91,
      reviews_count: 112,
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      badge: 'TRENDING',
      sizes: ['Free Size (6.3m with blouse)'],
      colors: ['Lavender Mist', 'Sunset Coral', 'Sage Grey']
    }
  ];

  for (const p of products) {
    const res = insertProduct.run(
      p.name, p.handle, p.category, p.fabric, p.description,
      p.price, p.compare_at_price, p.rating, p.reviews_count, p.image_url, p.badge
    );
    const productId = res.lastInsertRowid;

    let variantIdx = 1;
    for (const size of p.sizes) {
      for (const color of p.colors) {
        const sku = `INVI-${p.category.slice(0, 3).toUpperCase()}-${productId}-${variantIdx++}`;
        insertVariant.run(productId, size, color, 15, sku);
      }
    }
  }

  // Seed sample verified customer order for live tracking demonstration
  const insertOrder = db.prepare(`
    INSERT INTO orders (tracking_code, customer_name, customer_email, customer_phone, shipping_address, city, state, postal_code, total_amount, payment_method, payment_status, fulfillment_status, courier_partner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const orderRes = insertOrder.run(
    'INVI-7821',
    'Master Sri (Srimanikandan K)',
    'srimanikandanece2000@gmail.com',
    '+91 98421 54321',
    'Sovereign Tower, Perundurai Road',
    'Erode',
    'Tamil Nadu',
    '638011',
    18500,
    'UPI (GooglePay)',
    'PAID',
    'HANDCRAFTED',
    'BlueDart Air Express (AWB: BLR-984021)'
  );

  insertOrderItem.run(
    orderRes.lastInsertRowid,
    1,
    'Royal Kanchipuram Pure Zari Silk Saree',
    'Free Size (6.3m with blouse)',
    1,
    18500,
    18500
  );
}

// Initialize on module load
initDatabase();

module.exports = {
  db,
  initDatabase,
};
