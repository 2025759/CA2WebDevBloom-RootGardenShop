# Bloom & Root Garden Shop

Web Development CA — H.Dip. in Computing, CCT College Dublin

**Student ID:** 2025759  
**Name:** [FULL NAME]

## Links

- **GitHub:** https://github.com/2025759/CA2WebDevBloom-RootGardenShop
- **Video demo (Google Drive):** [paste your Google Drive link here]

---

## About the project

Bloom & Root is a small online garden shop selling indoor plants, outdoor seedlings, pots, compost, tools and plant care products. It was built for the Full Stack Website continuous assessment.

The front-end uses HTML, CSS and JavaScript. The back-end uses Node.js and Express. Products, the shopping cart and orders are stored in SQLite. Nothing important is hardcoded only in the HTML — prices and product lists come from the server API.

---

## How to run

```bash
cd WebDevAksaCA2
npm install
npm start
```

Open http://localhost:3000 in your browser.

On first run, the database file `database/bloom-root-garden.db` is created automatically and filled from `database/seed.sql`.

For development with auto-restart:

```bash
npm run dev
```

---

## Main features

- Browse products loaded from the database via REST API
- Search and filter by category on the Products page
- Add, remove and update quantity in the cart (stored on the server)
- Dynamic cart totals and badge count in the navigation
- Market rate multiplier: displayed price = base price × rate
- Checkout with client-side and server-side validation
- Order confirmation and cart cleared after successful checkout

---

## Methodology

I built the site in six steps using Git commits:

1. Project setup (`package.json`, folders, `.gitignore`)
2. Server and database (`server.js`, `database.js`, `seed.sql`, API routes)
3. HTML pages with shared navigation and semantic structure
4. JavaScript for dynamic content and cart/checkout
5. Full CSS styling and product images
6. README and final testing

I kept the front-end, server and database in separate layers. The HTML files do not contain product prices or cart logic — that stays on the server so the assessment requirement for server-managed content is met. I used sql.js instead of better-sqlite3 because it runs on Node 20 on Windows without needing native build tools.

I did not use React, Vue or Angular because the brief asked for plain HTML, CSS and JavaScript with Node and Express.

---

## Pages

| Page | File |
|------|------|
| Home | `public/index.html` |
| Products | `public/products.html` |
| Cart | `public/cart.html` |
| Checkout | `public/checkout.html` |
| About | `public/about.html` |

---

## Server and API

`server.js` serves static files from `public/` and exposes:

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | All products with market-adjusted prices |
| GET | `/api/products/:id` | Single product |
| GET | `/api/cart` | Current cart with totals |
| POST | `/api/cart/add` | Body: `{ productId, quantity }` |
| POST | `/api/cart/update` | Body: `{ productId, quantity }` |
| POST | `/api/cart/remove` | Body: `{ productId }` |
| DELETE | `/api/cart/clear` | Empty the cart |
| POST | `/api/checkout` | Place order (validated) |
| GET | `/api/market-rate` | Current rate |
| POST | `/api/market-rate` | Body: `{ rate }` (0.01–3) |

---

## Database

SQLite tables: `products`, `cart`, `market_rate`, `orders`, `order_items`.

Ten sample products are seeded (Monstera, Snake Plant, Lavender, Tomato Seedlings, Terracotta Pots, Herb Pot, Compost, Trowel Set, Watering Can, Plant Feed). Prices are in euros.

The project uses **sql.js** so SQLite works in pure JavaScript without native modules on Windows.

---

## Validation

**Client (checkout form):** required fields, email format, phone format (7–20 characters), card number 13–19 digits.

**Server (`POST /api/checkout`):** same checks before creating an order. Card details are validated but not stored — this is a demo site only.

---

## Design and accessibility

- Responsive layout for mobile and desktop
- Semantic HTML: `header`, `nav`, `main`, `section`, `article`, `footer`
- Skip link to main content
- ARIA labels on navigation and cart badge
- Focus styles on buttons and form inputs
- Warm green and cream colour scheme with good contrast
- `prefers-reduced-motion` respected for animations

---

## Assessment criteria (summary)

| Criterion | How it is covered |
|-----------|-------------------|
| Methodology (30%) | Iterative commits, separated layers, this README |
| Server (30%) | Express, REST API, static files, cart on server |
| Database (20%) | sql.js SQLite, dynamic products, orders, market rate |
| Design (20%) | Responsive CSS, JavaScript updates, hover effects |

---

## Presentation video (5–6 minutes)

Record an MP4 with your own voice covering:

1. What the site is and who it is for
2. How products load from the database
3. Cart add / update / remove on the server
4. Market rate changing prices
5. Checkout validation and order confirmation
6. Responsive design and accessibility choices

Upload to Google Drive (viewable link) — do not upload the video to Moodle; paste the link in your submission.

---

## References

Mozilla Developer Network (2024) *HTML*. https://developer.mozilla.org/en-US/docs/Web/HTML (Accessed 2 June 2026).

Mozilla Developer Network (2024) *CSS*. https://developer.mozilla.org/en-US/docs/Web/CSS (Accessed 2 June 2026).

Mozilla Developer Network (2024) *JavaScript*. https://developer.mozilla.org/en-US/docs/Web/JavaScript (Accessed 2 June 2026).

Node.js (2024) *Documentation*. https://nodejs.org/docs/ (Accessed 2 June 2026).

Express (2024) *Documentation*. https://expressjs.com/ (Accessed 2 June 2026).

SQLite (2024) *Documentation*. https://www.sqlite.org/docs.html (Accessed 2 June 2026).

W3C (2024) *Web Accessibility Initiative*. https://www.w3.org/WAI/ (Accessed 2 June 2026).
