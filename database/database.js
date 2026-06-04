/**
 * database.js
 * SQLite via sql.js — works on Node.js 20+ on Windows without native builds.
 * Bloom & Root Garden Shop
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'bloom-root-garden.db');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let db = null;

/** Save in-memory database to disk after writes */
function saveDatabase() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** Run a SELECT and return all rows as objects */
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** Run a SELECT and return the first row */
function queryGet(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

/** Run INSERT/UPDATE/DELETE and save to file */
function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return {
    changes: db.getRowsModified(),
    lastInsertRowid: queryGet('SELECT last_insert_rowid() AS id')?.id
  };
}

/** Open or create the database file */
async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  createTables();
  seedDatabase();
  saveDatabase();
  console.log('SQLite database ready.');
}

/** Create all required tables if they do not exist */
function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      base_price REAL NOT NULL,
      image TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(product_id)
    );

    CREATE TABLE IF NOT EXISTS market_rate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rate REAL NOT NULL DEFAULT 1.0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      eircode TEXT NOT NULL,
      total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
}

/** Seed from seed.sql when the products table is empty */
function seedDatabase() {
  const row = queryGet('SELECT COUNT(*) AS count FROM products');
  if (row && row.count > 0) return;

  const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
  db.exec(seedSql);
  saveDatabase();
  console.log('Database seeded with garden products and default market rate.');
}

function getMarketRate() {
  const row = queryGet('SELECT rate FROM market_rate ORDER BY id DESC LIMIT 1');
  return row ? row.rate : 1.0;
}

function setMarketRate(rate) {
  runQuery('INSERT INTO market_rate (rate) VALUES (?)', [rate]);
  return rate;
}

function applyMarketPrice(basePrice) {
  const rate = getMarketRate();
  return Math.round(basePrice * rate * 100) / 100;
}

function formatProduct(product) {
  if (!product) return null;
  return {
    ...product,
    base_price: product.base_price,
    price: applyMarketPrice(product.base_price),
    market_rate: getMarketRate()
  };
}

function getAllProducts() {
  const products = queryAll('SELECT * FROM products ORDER BY id');
  return products.map(formatProduct);
}

function getProductById(id) {
  const product = queryGet('SELECT * FROM products WHERE id = ?', [id]);
  return formatProduct(product);
}

function getCartItems() {
  const items = queryAll(`
    SELECT c.id AS cart_id, c.product_id, c.quantity,
           p.name, p.category, p.description, p.base_price, p.image, p.stock
    FROM cart c
    JOIN products p ON p.id = c.product_id
    ORDER BY c.id
  `);

  return items.map((item) => {
    const price = applyMarketPrice(item.base_price);
    return {
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      name: item.name,
      category: item.category,
      description: item.description,
      image: item.image,
      stock: item.stock,
      base_price: item.base_price,
      price,
      line_total: Math.round(price * item.quantity * 100) / 100
    };
  });
}

function getCartTotals() {
  const items = getCartItems();
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

function addToCart(productId, quantity = 1) {
  const product = queryGet('SELECT * FROM products WHERE id = ?', [productId]);
  if (!product) throw new Error('Product not found');

  const existing = queryGet('SELECT * FROM cart WHERE product_id = ?', [productId]);
  const newQty = existing ? existing.quantity + quantity : quantity;

  if (newQty > product.stock) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }

  if (existing) {
    runQuery('UPDATE cart SET quantity = ? WHERE product_id = ?', [newQty, productId]);
  } else {
    runQuery('INSERT INTO cart (product_id, quantity) VALUES (?, ?)', [productId, quantity]);
  }

  return getCartItems();
}

function updateCartItem(productId, quantity) {
  const product = queryGet('SELECT * FROM products WHERE id = ?', [productId]);
  if (!product) throw new Error('Product not found');

  if (quantity <= 0) {
    runQuery('DELETE FROM cart WHERE product_id = ?', [productId]);
    return getCartItems();
  }

  if (quantity > product.stock) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }

  const result = runQuery('UPDATE cart SET quantity = ? WHERE product_id = ?', [quantity, productId]);
  if (result.changes === 0) throw new Error('Item not in cart');

  return getCartItems();
}

function removeFromCart(productId) {
  runQuery('DELETE FROM cart WHERE product_id = ?', [productId]);
  return getCartItems();
}

function clearCart() {
  runQuery('DELETE FROM cart');
}

function createOrder(customerData) {
  const cartItems = getCartItems();
  if (cartItems.length === 0) throw new Error('Cart is empty');

  const totals = getCartTotals();

  try {
    db.run('BEGIN TRANSACTION');

    runQuery(
      `INSERT INTO orders (customer_name, email, phone, address, city, eircode, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerData.customer_name,
        customerData.email,
        customerData.phone,
        customerData.address,
        customerData.city,
        customerData.eircode,
        totals.total
      ]
    );

    const orderId = queryGet('SELECT last_insert_rowid() AS id').id;

    for (const item of cartItems) {
      runQuery(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      runQuery('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    runQuery('DELETE FROM cart');
    db.run('COMMIT');
    saveDatabase();

    return {
      orderId,
      total: totals.total,
      items: cartItems
    };
  } catch (err) {
    db.run('ROLLBACK');
    saveDatabase();
    throw err;
  }
}

module.exports = {
  initDatabase,
  getMarketRate,
  setMarketRate,
  applyMarketPrice,
  getAllProducts,
  getProductById,
  getCartItems,
  getCartTotals,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createOrder
};
