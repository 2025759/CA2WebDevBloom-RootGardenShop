/**
 * app.js
 * Client-side JavaScript for Bloom & Root Garden Shop.
 * API calls, dynamic product/cart rendering, checkout validation.
 */

const API = {
  products: '/api/products',
  product: (id) => `/api/products/${id}`,
  cart: '/api/cart',
  cartAdd: '/api/cart/add',
  cartUpdate: '/api/cart/update',
  cartRemove: '/api/cart/remove',
  cartClear: '/api/cart/clear',
  checkout: '/api/checkout',
  marketRate: '/api/market-rate'
};

/** Format number as Euro currency */
function formatPrice(amount) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/** Show a short message to the user */
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove('toast--visible'), 3500);
}

/** Update cart badge in navigation */
async function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  try {
    const res = await fetch(API.cart);
    const data = await res.json();
    badge.textContent = data.item_count || 0;
    badge.setAttribute('aria-label', `${data.item_count || 0} items in cart`);
  } catch {
    badge.textContent = '0';
  }
}

/** Fetch JSON from API */
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// --- Home: featured products ---

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  try {
    const data = await fetchJSON(API.products);
    const featured = data.products.slice(0, 4);

    container.innerHTML = featured.map((p) => `
      <article class="product-card" data-category="${p.category}">
        <div class="product-card__image">
          <img src="${p.image}" alt="${p.name}" width="200" height="160" loading="lazy">
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${p.category}</span>
          <h3 class="product-card__title">${p.name}</h3>
          <p class="product-card__price">${formatPrice(p.price)}</p>
          <button type="button" class="btn btn--primary btn--sm" data-add-cart="${p.id}">
            Add to Cart
          </button>
        </div>
      </article>
    `).join('');

    bindAddToCartButtons(container);
  } catch {
    container.innerHTML = '<p class="error-msg">Unable to load featured products.</p>';
  }
}

// --- Products page ---

let allProducts = [];

async function loadProductsPage() {
  const grid = document.getElementById('products-grid');
  const marketInfo = document.getElementById('market-rate-info');
  if (!grid) return;

  try {
    const data = await fetchJSON(API.products);
    allProducts = data.products;

    if (marketInfo) {
      marketInfo.textContent = `Current market rate: ×${data.market_rate.toFixed(2)} (prices adjusted from base)`;
    }

    renderProducts(allProducts);
    bindProductFilters();
  } catch {
    grid.innerHTML = '<p class="error-msg">Failed to load products. Please refresh the page.</p>';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No products match your search.</p>';
    return;
  }

  grid.innerHTML = products.map((p) => `
    <article class="product-card" data-category="${p.category}">
      <div class="product-card__image">
        <img src="${p.image}" alt="${p.name}" width="200" height="160" loading="lazy">
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${p.category}</span>
        <h3 class="product-card__title">${p.name}</h3>
        <p class="product-card__desc">${p.description}</p>
        <p class="product-card__price">${formatPrice(p.price)}</p>
        <p class="product-card__stock">${p.stock > 0 ? `In stock: ${p.stock}` : 'Out of stock'}</p>
        <button type="button" class="btn btn--primary" data-add-cart="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>
          Add to Cart
        </button>
      </div>
    </article>
  `).join('');

  bindAddToCartButtons(grid);
}

function bindProductFilters() {
  const searchInput = document.getElementById('product-search');
  const categorySelect = document.getElementById('category-filter');

  function filterProducts() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const category = categorySelect?.value || 'all';

    const filtered = allProducts.filter((p) => {
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || p.category === category;
      return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
  }

  searchInput?.addEventListener('input', filterProducts);
  categorySelect?.addEventListener('change', filterProducts);
}

function bindAddToCartButtons(container) {
  container.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const productId = btn.getAttribute('data-add-cart');
      btn.disabled = true;
      try {
        await fetchJSON(API.cartAdd, {
          method: 'POST',
          body: JSON.stringify({ productId: Number(productId), quantity: 1 })
        });
        showToast('Added to cart!');
        updateCartBadge();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// --- Cart page ---

async function loadCartPage() {
  const tbody = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');
  if (!tbody) return;

  try {
    const data = await fetchJSON(API.cart);

    if (data.items.length === 0) {
      tbody.innerHTML = '';
      emptyMsg?.classList.remove('hidden');
      summary?.classList.add('hidden');
      updateCartBadge();
      return;
    }

    emptyMsg?.classList.add('hidden');
    summary?.classList.remove('hidden');

    tbody.innerHTML = data.items.map((item) => `
      <tr data-product-id="${item.product_id}">
        <td class="cart-item__product">
          <img src="${item.image}" alt="" width="48" height="48">
          <span>${item.name}</span>
        </td>
        <td>${item.category}</td>
        <td>${formatPrice(item.price)}</td>
        <td>
          <div class="qty-controls">
            <button type="button" class="btn btn--icon" data-qty-minus="${item.product_id}" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button type="button" class="btn btn--icon" data-qty-plus="${item.product_id}" aria-label="Increase quantity">+</button>
          </div>
        </td>
        <td>${formatPrice(item.line_total)}</td>
        <td>
          <button type="button" class="btn btn--danger btn--sm" data-remove="${item.product_id}">Remove</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('cart-subtotal').textContent = formatPrice(data.subtotal);
    document.getElementById('cart-total').textContent = formatPrice(data.total);

    bindCartControls();
    updateCartBadge();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="error-msg">${err.message}</td></tr>`;
  }
}

function bindCartControls() {
  document.querySelectorAll('[data-qty-minus]').forEach((btn) => {
    btn.addEventListener('click', () => updateQuantity(btn.getAttribute('data-qty-minus'), -1));
  });
  document.querySelectorAll('[data-qty-plus]').forEach((btn) => {
    btn.addEventListener('click', () => updateQuantity(btn.getAttribute('data-qty-plus'), 1));
  });
  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await fetchJSON(API.cartRemove, {
          method: 'POST',
          body: JSON.stringify({ productId: Number(btn.getAttribute('data-remove')) })
        });
        showToast('Item removed');
        loadCartPage();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

async function updateQuantity(productId, delta) {
  const row = document.querySelector(`tr[data-product-id="${productId}"]`);
  const qtyEl = row?.querySelector('.qty-value');
  const current = parseInt(qtyEl?.textContent || '1', 10);
  const newQty = current + delta;

  try {
    if (newQty <= 0) {
      await fetchJSON(API.cartRemove, {
        method: 'POST',
        body: JSON.stringify({ productId: Number(productId) })
      });
    } else {
      await fetchJSON(API.cartUpdate, {
        method: 'POST',
        body: JSON.stringify({ productId: Number(productId), quantity: newQty })
      });
    }
    loadCartPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Checkout ---

function validateCheckoutForm(form) {
  const errors = [];
  const fields = {
    customer_name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    eircode: 'Eircode',
    card_name: 'Name on card',
    card_number: 'Card number'
  };

  for (const [id, label] of Object.entries(fields)) {
    const input = form.querySelector(`#${id}`);
    const value = input?.value.trim();
    if (!value) {
      errors.push(`${label} is required.`);
      input?.classList.add('input--error');
    } else {
      input?.classList.remove('input--error');
    }
  }

  const email = form.email.value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
    form.email.classList.add('input--error');
  }

  const phone = form.phone.value.trim();
  if (phone && !/^[\d\s+\-()]{7,20}$/.test(phone)) {
    errors.push('Please enter a valid phone number (7–20 digits).');
    form.phone.classList.add('input--error');
  }

  const cardDigits = form.card_number.value.replace(/\s/g, '');
  if (cardDigits && (cardDigits.length < 13 || cardDigits.length > 19 || !/^\d+$/.test(cardDigits))) {
    errors.push('Card number must be 13–19 digits.');
    form.card_number.classList.add('input--error');
  }

  return errors;
}

function initCheckoutPage() {
  const form = document.getElementById('checkout-form');
  const confirmation = document.getElementById('order-confirmation');
  const errorBox = document.getElementById('checkout-errors');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.innerHTML = '';
    errorBox.classList.add('hidden');
    confirmation?.classList.add('hidden');

    const errors = validateCheckoutForm(form);
    if (errors.length > 0) {
      errorBox.innerHTML = errors.map((msg) => `<p>${msg}</p>`).join('');
      errorBox.classList.remove('hidden');
      return;
    }

    const payload = {
      customer_name: form.customer_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      city: form.city.value.trim(),
      eircode: form.eircode.value.trim(),
      card_name: form.card_name.value.trim(),
      card_number: form.card_number.value.replace(/\s/g, '')
    };

    try {
      const data = await fetchJSON(API.checkout, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      form.classList.add('hidden');
      confirmation.classList.remove('hidden');
      confirmation.innerHTML = `
        <div class="confirmation-box">
          <h2>Order Confirmed!</h2>
          <p>${data.message}</p>
          <p><strong>Order ID:</strong> #${data.order.orderId}</p>
          <p><strong>Total paid:</strong> ${formatPrice(data.order.total)}</p>
          <a href="products.html" class="btn btn--primary">Continue Shopping</a>
        </div>
      `;
      updateCartBadge();
    } catch (err) {
      errorBox.innerHTML = `<p>${err.message}</p>`;
      errorBox.classList.remove('hidden');
    }
  });
}

// --- Market rate (products page) ---

function initMarketRateControl() {
  const form = document.getElementById('market-rate-form');
  if (!form) return;

  const rateInput = document.getElementById('market-rate-input');

  fetchJSON(API.marketRate).then((data) => {
    if (rateInput) rateInput.value = data.rate;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const rate = parseFloat(rateInput.value);
      await fetchJSON(API.marketRate, {
        method: 'POST',
        body: JSON.stringify({ rate })
      });
      showToast('Market rate updated. Reloading prices…');
      loadProductsPage();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// --- Mobile navigation ---

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-menu');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });
}

// --- Initialise by page ---

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  updateCartBadge();

  const page = document.body.dataset.page;

  switch (page) {
    case 'home':
      loadFeaturedProducts();
      break;
    case 'products':
      loadProductsPage();
      initMarketRateControl();
      break;
    case 'cart':
      loadCartPage();
      break;
    case 'checkout':
      initCheckoutPage();
      break;
    default:
      break;
  }
});
