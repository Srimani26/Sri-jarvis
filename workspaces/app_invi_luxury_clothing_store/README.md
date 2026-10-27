# Invi Creation - Luxury Cotton Kurthis & Ethnic Apparel E-Commerce Store

Autonomous luxury Indian ethnic clothing e-commerce store engineered by **J.A.R.V.I.S. 20-Agent Swarm**.
Tailored for **Invi Creation** (Erode cotton kurthis, Chanderi sarees, Mulberry silk gowns).

## Architecture
- **Backend API**: Pure Node.js REST API (`server.js`)
  - `GET /api/health` - Service uptime, store identity, and catalog size
  - `GET /api/metrics` - Live revenue, orders, and cart telemetry
  - `GET /api/products` - Full product catalog with size options and stock levels
  - `GET /api/products/:id` - Single piece details
  - `GET /api/cart` - Active shopping bag items and subtotal/shipping calculations
  - `POST /api/cart` - Add product to shopping bag with selected size
  - `DELETE /api/cart/:id` - Remove item from shopping bag
  - `GET /api/orders` - Retrieve all recorded customer orders
  - `POST /api/orders` - Checkout order and generate tracking ID
  - `GET /api/items`, `POST /api/items`, `DELETE /api/items/:id` - Backward compatibility endpoints
- **Frontend Storefront**: Responsive Haute Couture UI (`index.html` + `app.js`)
  - Luxury gold/emerald/obsidian theme
  - Real dynamic collection filters
  - Interactive size selection chips
  - Floating slide-over Shopping Bag drawer
  - 1-Click checkout modal with instant invoice generation
- **Automated Verification**: Self-contained integration test suite (`test.js`).

## Quickstart
```bash
npm test    # Run full verification suite on ephemeral test port
npm start   # Launch store on http://localhost:4200
```
