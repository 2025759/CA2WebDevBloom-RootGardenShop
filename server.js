/**
 * server.js
 * Express server for Bloom & Root Garden Shop — static files and REST API.
 */

const express = require('express');
const path = require('path');
const db = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sendError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

// --- Product routes ---

app.get('/api/products', (req, res) => {
  try {
    const products = db.getAllProducts();
    res.json({ success: true, products, market_rate: db.getMarketRate() });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.getProductById(Number(req.params.id));
    if (!product) return sendError(res, 404, 'Product not found');
    res.json({ success: true, product });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// --- Cart routes ---

app.get('/api/cart', (req, res) => {
  try {
    const items = db.getCartItems();
    const totals = db.getCartTotals();
    res.json({ success: true, items, ...totals, market_rate: db.getMarketRate() });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.post('/api/cart/add', (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return sendError(res, 400, 'productId is required');
    const items = db.addToCart(Number(productId), Number(quantity) || 1);
    const totals = db.getCartTotals();
    res.json({ success: true, message: 'Item added to cart', items, ...totals });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

app.post('/api/cart/update', (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return sendError(res, 400, 'productId and quantity are required');
    }
    const items = db.updateCartItem(Number(productId), Number(quantity));
    const totals = db.getCartTotals();
    res.json({ success: true, message: 'Cart updated', items, ...totals });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

app.post('/api/cart/remove', (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return sendError(res, 400, 'productId is required');
    const items = db.removeFromCart(Number(productId));
    const totals = db.getCartTotals();
    res.json({ success: true, message: 'Item removed', items, ...totals });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

app.delete('/api/cart/clear', (req, res) => {
  try {
    db.clearCart();
    res.json({ success: true, message: 'Cart cleared', items: [], subtotal: 0, total: 0, item_count: 0 });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// --- Checkout route ---

app.post('/api/checkout', (req, res) => {
  try {
    const {
      customer_name,
      email,
      phone,
      address,
      city,
      eircode,
      card_name,
      card_number
    } = req.body;

    const required = { customer_name, email, phone, address, city, eircode, card_name, card_number };
    for (const [field, value] of Object.entries(required)) {
      if (!value || String(value).trim() === '') {
        return sendError(res, 400, `${field.replace('_', ' ')} is required`);
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Invalid email format');
    }

    const phoneRegex = /^[\d\s+\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return sendError(res, 400, 'Invalid phone number format');
    }

    const cardDigits = String(card_number).replace(/\s/g, '');
    if (cardDigits.length < 13 || cardDigits.length > 19 || !/^\d+$/.test(cardDigits)) {
      return sendError(res, 400, 'Card number must be 13–19 digits');
    }

    const order = db.createOrder({
      customer_name: customer_name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      eircode: eircode.trim()
    });

    res.json({
      success: true,
      message: 'Order placed successfully! Thank you for shopping at Bloom & Root Garden Shop.',
      order: {
        orderId: order.orderId,
        total: order.total,
        itemCount: order.items.length
      }
    });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// --- Market rate routes ---

app.get('/api/market-rate', (req, res) => {
  res.json({ success: true, rate: db.getMarketRate() });
});

app.post('/api/market-rate', (req, res) => {
  try {
    const { rate } = req.body;
    const numRate = Number(rate);
    if (!rate || Number.isNaN(numRate) || numRate <= 0 || numRate > 3) {
      return sendError(res, 400, 'Rate must be a number between 0.01 and 3');
    }
    db.setMarketRate(numRate);
    res.json({
      success: true,
      message: 'Market rate updated. Product prices will reflect the new rate.',
      rate: numRate
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.status(404).send('Page not found — HTML pages coming in the next step.');
});

db.initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Bloom & Root Garden Shop running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start — database error:', err.message);
    process.exit(1);
  });
