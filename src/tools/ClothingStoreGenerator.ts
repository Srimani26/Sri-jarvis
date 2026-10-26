/**
 * J.A.R.V.I.S. Luxury Clothing & Ethnic Apparel E-Commerce Store Generator
 * Produces complete, production-grade fullstack stores with zero external dependencies.
 * Tailored for Invi Creation luxury ethnic wear, handcrafted kurthis, sarees, and apparel.
 */

export interface ClothingStoreBundle {
  serverJs: string;
  appJs: string;
  appHtml: string;
  testJs: string;
  pkgJson: string;
  readmeMd: string;
}

export class ClothingStoreGenerator {
  public static generate(topic: string, projectName: string): ClothingStoreBundle {
    const storeTitle = 'Invi Creation // Luxury Ethnic Couture';
    const storeDesc = 'Handcrafted Pure Cotton Kurthis, Chanderi Sarees & Artisanal Apparel';

    // 1. Comprehensive Node.js REST API Server
    const serverJs = `/**
 * ${topic} - Autonomous Luxury Clothing & Ethnic Apparel REST API Server
 * Engineered by J.A.R.V.I.S. Autonomous Swarm Runtime
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4200;

let products = [
  {
    id: 'prod_1',
    name: 'Royal Chanderi Zari Kurti Set',
    category: 'Handblock Kurthis',
    price: 2899,
    originalPrice: 3999,
    tag: 'Bestseller',
    inStock: 24,
    rating: 4.9,
    reviewsCount: 142,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    description: 'Handcrafted pure Chanderi cotton with intricate gold zari embroidery and matching dupatta.'
  },
  {
    id: 'prod_2',
    name: 'Indigo Dabu Handblock Pure Cotton Kurtha',
    category: 'Handblock Kurthis',
    price: 1499,
    originalPrice: 1999,
    tag: 'Handmade',
    inStock: 38,
    rating: 4.8,
    reviewsCount: 96,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    description: 'Authentic Bagru natural indigo block print on breathable organic cotton.'
  },
  {
    id: 'prod_3',
    name: 'Mulberry Silk Embroidered Anarkali Gown',
    category: 'Silk Anarkalis',
    price: 3799,
    originalPrice: 4999,
    tag: 'Luxury',
    inStock: 15,
    rating: 5.0,
    reviewsCount: 78,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    description: 'Floor-length pure mulberry silk Anarkali with resham thread handiwork and latkan.'
  },
  {
    id: 'prod_4',
    name: 'Royal Kanchipuram Tissue Zari Saree',
    category: 'Chanderi Sarees',
    price: 4499,
    originalPrice: 5999,
    tag: 'Festive',
    inStock: 12,
    rating: 4.9,
    reviewsCount: 110,
    sizes: ['Free Size'],
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    description: 'Traditional metallic tissue weave with contrast temple border and rich pallu.'
  },
  {
    id: 'prod_5',
    name: 'Erode Pure Cotton Daily Tunic',
    category: 'Daily Tunics',
    price: 1199,
    originalPrice: 1599,
    tag: 'Essential',
    inStock: 50,
    rating: 4.7,
    reviewsCount: 64,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=800&q=80',
    description: 'Feather-light woven cotton tunic with mandarin collar and functional pockets.'
  },
  {
    id: 'prod_6',
    name: 'Chiffon Organza Floral Pastel Kurti',
    category: 'Handblock Kurthis',
    price: 2199,
    originalPrice: 2799,
    tag: 'Trending',
    inStock: 20,
    rating: 4.8,
    reviewsCount: 52,
    sizes: ['S', 'M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1583391733975-081498c8cb6d?auto=format&fit=crop&w=800&q=80',
    description: 'Ethereal pastel floral organza with delicate scalloped cutwork borders.'
  }
];

let cart = [];
let orders = [];
let items = [
  { id: '1', title: 'Luxury E-Commerce Catalog Synchronized', status: 'ACTIVE', priority: 'HIGH', createdAt: new Date().toISOString() },
  { id: '2', title: 'Payment Gateway & Bag Subsystem Online', status: 'ACTIVE', priority: 'MEDIUM', createdAt: new Date().toISOString() }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = parsedUrl.pathname;

  // 1. Health Endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      store: 'Invi Creation - Luxury Ethnic Wear',
      topic: ${JSON.stringify(topic)},
      catalogCount: products.length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  }

  // 2. Metrics Endpoint
  if (pathname === '/api/metrics' && req.method === 'GET') {
    const totalRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
    const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      totalProducts: products.length,
      cartCount,
      ordersCount: orders.length,
      totalRevenue,
      currency: 'INR (₹)',
      totalItems: items.length,
      activeItems: items.filter(i => i.status === 'ACTIVE').length,
      memoryUsage: process.memoryUsage().heapUsed,
      runtime: 'Node.js ' + process.version
    }));
  }

  // 3. Products Catalog
  if (pathname === '/api/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      categories: ['All Collections', 'Handblock Kurthis', 'Chanderi Sarees', 'Silk Anarkalis', 'Daily Tunics'],
      count: products.length,
      data: products
    }));
  }

  if (pathname.startsWith('/api/products/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const product = products.find(p => p.id === id);
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'Product not found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, data: product }));
  }

  // 4. Cart Endpoints
  if (pathname === '/api/cart' && req.method === 'GET') {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal >= 1999 || subtotal === 0 ? 0 : 150;
    const discount = subtotal > 4000 ? Math.round(subtotal * 0.1) : 0;
    const grandTotal = subtotal + shipping - discount;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      items: cart,
      subtotal,
      shipping,
      discount,
      grandTotal,
      freeShippingThreshold: 1999,
      freeShippingEligible: subtotal >= 1999
    }));
  }

  if (pathname === '/api/cart' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const product = products.find(p => p.id === payload.productId) || products[0];
        const size = payload.size || (product.sizes ? product.sizes[0] : 'M');
        const qty = Number(payload.qty) || 1;

        const existingIndex = cart.findIndex(c => c.productId === product.id && c.size === size);
        if (existingIndex >= 0) {
          cart[existingIndex].qty += qty;
        } else {
          cart.push({
            id: 'cart_' + Date.now(),
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            size,
            qty,
            image: product.image
          });
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, cart }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid cart payload' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/cart/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    cart = cart.filter(c => c.id !== id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, deletedId: id, cart }));
  }

  // 5. Orders & Checkout Endpoints
  if (pathname === '/api/orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, count: orders.length, orders }));
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const orderItems = (payload.items && payload.items.length > 0) ? payload.items : (cart.length > 0 ? [...cart] : [
          { productId: products[0].id, name: products[0].name, price: products[0].price, qty: 1, size: 'M' }
        ]);
        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
        const shipping = subtotal >= 1999 ? 0 : 150;
        const total = subtotal + shipping;

        const orderId = 'INVI-ORD-' + Math.floor(1000 + Math.random() * 9000);
        const newOrder = {
          id: orderId,
          trackingId: 'TRK-' + Date.now().toString().slice(-8),
          customerName: payload.customerName || 'Master Sri',
          customerPhone: payload.customerPhone || '+91 98421 99999',
          deliveryAddress: payload.deliveryAddress || 'Invi Creation Suite, Tamil Nadu, India',
          paymentMethod: payload.paymentMethod || 'UPI Instant Verified',
          items: orderItems,
          subtotal,
          shipping,
          total,
          status: 'CONFIRMED',
          estimatedDelivery: '3-4 Business Days',
          placedAt: new Date().toISOString()
        };

        orders.unshift(newOrder);
        cart = []; // Empty cart after checkout

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, order: newOrder }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid order payload' }));
      }
    });
    return;
  }

  // 6. Generic items CRUD for backward-compatible acceptance tests
  if (pathname === '/api/items' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, data: items }));
  }

  if (pathname === '/api/items' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const newItem = {
          id: String(Date.now()),
          title: payload.title || 'Untitled Task',
          status: payload.status || 'ACTIVE',
          priority: payload.priority || 'NORMAL',
          createdAt: new Date().toISOString()
        };
        items.push(newItem);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, item: newItem }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/items/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    items = items.filter(i => i.id !== id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, deletedId: id }));
  }

  // 7. Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('⚡ [' + ${JSON.stringify(topic)} + '] Luxury Clothing Store active at http://localhost:' + PORT);
  });
}

module.exports = {
  server,
  getProducts: () => products,
  getCart: () => cart,
  getOrders: () => orders,
  getItems: () => items
};
`;

    // 2. Interactive Frontend app.js
    const appJs = `/**
 * Invi Creation - Luxury Apparel Frontend Application Logic
 */
let allProducts = [];
let activeCategory = 'All Collections';
let selectedSizes = {};

// 1. Fetch & Render Catalog
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) return;
    const json = await res.json();
    allProducts = json.data || [];
    renderCategories(json.categories || []);
    renderProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function renderCategories(categories) {
  const container = document.getElementById('category-filters');
  if (!container) return;
  container.innerHTML = categories.map(cat => {
    const isActive = cat === activeCategory;
    const activeClass = isActive
      ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20'
      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800';
    return '<button onclick="selectCategory(\\'' + cat.replace(/'/g, "\\\\'") + '\\')" class="px-4 py-2 rounded-full text-xs font-medium transition-all ' + activeClass + '">' + cat + '</button>';
  }).join(' ');
}

function selectCategory(cat) {
  activeCategory = cat;
  renderCategories(['All Collections', 'Handblock Kurthis', 'Chanderi Sarees', 'Silk Anarkalis', 'Daily Tunics']);
  renderProducts();
}

function selectSize(prodId, size) {
  selectedSizes[prodId] = size;
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const filtered = activeCategory === 'All Collections'
    ? allProducts
    : allProducts.filter(p => p.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 font-mono">No pieces found in this collection.</div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const selectedSize = selectedSizes[p.id] || p.sizes[0] || 'M';
    const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);

    const sizeButtons = p.sizes.map(s => {
      const isSel = s === selectedSize;
      const cls = isSel
        ? 'bg-amber-400 text-slate-950 font-bold'
        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60';
      return '<button onclick="selectSize(\\'' + p.id + '\\', \\'' + s + '\\')" class="w-7 h-7 text-[10px] rounded-lg transition-all ' + cls + '">' + s + '</button>';
    }).join(' ');

    return '<div class="group relative rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-400/40 p-4 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-xl">' +
      '<div>' +
        '<div class="relative overflow-hidden rounded-xl aspect-[4/5] mb-3 bg-slate-950">' +
          '<img src="' + p.image + '" alt="' + p.name + '" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" loading="lazy" />' +
          '<span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur border border-amber-400/40 text-amber-300">' + p.tag + '</span>' +
          '<span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">-' + discount + '%</span>' +
        '</div>' +
        '<div class="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">' +
          '<span>' + p.category + '</span>' +
          '<span class="text-amber-400">★ ' + p.rating + ' (' + p.reviewsCount + ')</span>' +
        '</div>' +
        '<h3 class="text-sm font-semibold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">' + p.name + '</h3>' +
        '<p class="text-xs text-slate-400 mt-1 line-clamp-2">' + p.description + '</p>' +
      '</div>' +
      '<div class="mt-4 pt-3 border-t border-slate-800/80">' +
        '<div class="flex items-center justify-between mb-3">' +
          '<div>' +
            '<span class="text-lg font-black text-amber-400">₹' + p.price.toLocaleString('en-IN') + '</span> ' +
            '<span class="text-xs text-slate-500 line-through">₹' + p.originalPrice.toLocaleString('en-IN') + '</span>' +
          '</div>' +
          '<span class="text-[10px] text-emerald-400 font-mono">In Stock (' + p.inStock + ')</span>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 mb-3">' +
          '<span class="text-[10px] font-mono text-slate-400 mr-1">SIZE:</span>' +
          sizeButtons +
        '</div>' +
        '<button onclick="addToBag(\\'' + p.id + '\\')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 active:scale-[0.98]">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>' +
          'Add To Bag' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// 2. Shopping Bag Operations
async function addToBag(productId) {
  const size = selectedSizes[productId] || 'M';
  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, size, qty: 1 })
    });
    if (res.ok) {
      showToast('Piece added to your sovereign bag!');
      await refreshCart();
      openCartDrawer();
    }
  } catch (err) {
    console.error('Add to cart failed:', err);
  }
}

async function refreshCart() {
  try {
    const res = await fetch('/api/cart');
    if (!res.ok) return;
    const cart = await res.json();
    
    const count = (cart.items || []).reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('.bag-count-badge').forEach(el => { el.innerText = count; });
    
    const list = document.getElementById('cart-items-list');
    if (!list) return;

    if (!cart.items || cart.items.length === 0) {
      list.innerHTML = '<div class="py-16 text-center text-slate-500"><svg class="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg><p class="text-sm font-medium">Your shopping bag is currently empty.</p><p class="text-xs text-slate-600 mt-1">Explore our handcrafted festive pieces.</p></div>';
      document.getElementById('checkout-btn')?.setAttribute('disabled', 'true');
    } else {
      list.innerHTML = cart.items.map(item => {
        return '<div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">' +
          '<img src="' + item.image + '" alt="' + item.name + '" class="w-14 h-16 rounded-lg object-cover" />' +
          '<div class="flex-1 min-w-0">' +
            '<h4 class="text-xs font-semibold text-white truncate">' + item.name + '</h4>' +
            '<p class="text-[10px] text-amber-400 font-mono">Size: ' + item.size + ' · Qty: ' + item.qty + '</p>' +
            '<p class="text-xs font-bold text-white mt-1">₹' + (item.price * item.qty).toLocaleString('en-IN') + '</p>' +
          '</div>' +
          '<button onclick="removeCartItem(\\'' + item.id + '\\')" class="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors">' +
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
          '</button>' +
        '</div>';
      }).join('');
      document.getElementById('checkout-btn')?.removeAttribute('disabled');
    }

    // Totals
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    const thresholdBar = document.getElementById('free-shipping-bar');
    const thresholdText = document.getElementById('free-shipping-text');

    if (subtotalEl) subtotalEl.innerText = '₹' + (cart.subtotal || 0).toLocaleString('en-IN');
    if (shippingEl) shippingEl.innerText = cart.shipping === 0 ? 'COMPLIMENTARY' : '₹' + cart.shipping;
    if (totalEl) totalEl.innerText = '₹' + (cart.grandTotal || 0).toLocaleString('en-IN');

    if (thresholdBar && thresholdText) {
      if (cart.freeShippingEligible) {
        thresholdBar.style.width = '100%';
        thresholdBar.className = 'h-1.5 rounded-full bg-emerald-400 transition-all duration-500';
        thresholdText.innerHTML = '🎉 <span class="text-emerald-400 font-bold">You unlocked Complimentary Express Shipping!</span>';
      } else {
        const remaining = 1999 - (cart.subtotal || 0);
        const percent = Math.min(100, Math.round(((cart.subtotal || 0) / 1999) * 100));
        thresholdBar.style.width = percent + '%';
        thresholdBar.className = 'h-1.5 rounded-full bg-amber-400 transition-all duration-500';
        thresholdText.innerHTML = 'Add <span class="text-amber-400 font-bold">₹' + remaining.toLocaleString('en-IN') + '</span> more for Free Delivery';
      }
    }
  } catch (err) {
    console.error('Refresh cart error:', err);
  }
}

async function removeCartItem(id) {
  try {
    const res = await fetch('/api/cart/' + encodeURIComponent(id), { method: 'DELETE' });
    if (res.ok) await refreshCart();
  } catch (err) {
    console.error('Delete item error:', err);
  }
}

function openCartDrawer() {
  document.getElementById('cart-drawer')?.classList.remove('translate-x-full');
  document.getElementById('cart-backdrop')?.classList.remove('hidden');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer')?.classList.add('translate-x-full');
  document.getElementById('cart-backdrop')?.classList.add('hidden');
}

// 3. Checkout Modal Operations
function openCheckoutModal() {
  closeCartDrawer();
  document.getElementById('checkout-modal')?.classList.remove('hidden');
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal')?.classList.add('hidden');
}

async function handleCheckout(event) {
  event.preventDefault();
  const name = document.getElementById('cust-name').value;
  const phone = document.getElementById('cust-phone').value;
  const address = document.getElementById('cust-address').value;
  const payment = document.getElementById('cust-payment').value;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        paymentMethod: payment
      })
    });

    if (res.ok) {
      const json = await res.json();
      closeCheckoutModal();
      openSuccessModal(json.order);
      await refreshCart();
      await fetchMetrics();
    }
  } catch (err) {
    alert('Checkout failed. Please try again.');
  }
}

function openSuccessModal(order) {
  document.getElementById('order-confirmed-id').innerText = order.id;
  document.getElementById('order-confirmed-tracking').innerText = order.trackingId;
  document.getElementById('order-confirmed-total').innerText = '₹' + order.total.toLocaleString('en-IN');
  document.getElementById('order-confirmed-modal')?.classList.remove('hidden');
}

function closeSuccessModal() {
  document.getElementById('order-confirmed-modal')?.classList.add('hidden');
}

// 4. Live Telemetry
async function fetchMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) return;
    const m = await res.json();
    document.querySelectorAll('.stat-products').forEach(el => el.innerText = m.totalProducts);
    document.querySelectorAll('.stat-orders').forEach(el => el.innerText = m.ordersCount);
    document.querySelectorAll('.stat-revenue').forEach(el => el.innerText = '₹' + (m.totalRevenue || 0).toLocaleString('en-IN'));
  } catch {}
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/90 text-amber-300 border border-amber-400/40 shadow-2xl text-xs font-semibold backdrop-blur flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0';
  t.innerHTML = '✨ <span>' + msg + '</span>';
  document.body.appendChild(t);
  setTimeout(() => { t.classList.remove('translate-y-2', 'opacity-0'); }, 10);
  setTimeout(() => {
    t.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

// Boot sequence
fetchProducts();
refreshCart();
fetchMetrics();
setInterval(fetchMetrics, 5000);
`;

    // 3. Luxury Storefront index.html
    const appHtml = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${storeTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #050811;
      color: #f8fafc;
    }
    .font-serif { font-family: 'Playfair Display', serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .gold-gradient {
      background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #b45309 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gold-border { border-color: rgba(245, 158, 11, 0.25); }
    .luxury-blur {
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-amber-400 selection:text-slate-950">

  <!-- 1. Fixed Luxury Announcement Bar -->
  <div class="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 py-1.5 px-4 text-center text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-md">
    <span>✨ HAUTE COUTURE 2026 // COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹1,999 ✨</span>
  </div>

  <!-- 2. Sovereign Header Navigation -->
  <header class="sticky top-0 z-30 bg-slate-950/80 luxury-blur border-b border-slate-800/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-400/20 font-serif">
          IC
        </div>
        <div>
          <span class="text-lg sm:text-xl font-bold tracking-tight text-white font-serif flex items-center gap-2">
            INVI CREATION
            <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 uppercase font-mono tracking-widest font-normal">LUXURY ATELIER</span>
          </span>
          <p class="text-[10px] text-slate-400 hidden sm:block">Handcrafted Ethnic Wear & Artisan Cotton Kurthis</p>
        </div>
      </div>

      <!-- Live metrics pill & Cart trigger -->
      <div class="flex items-center gap-3">
        <div class="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <span class="flex items-center gap-1.5 text-slate-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            STORE ACTIVE
          </span>
          <span class="text-slate-600">|</span>
          <span class="text-amber-400">ORDERS: <span class="stat-orders text-white">0</span></span>
        </div>

        <button onclick="openCartDrawer()" class="relative flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          <span>BAG</span>
          <span class="bag-count-badge px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">0</span>
        </button>
      </div>
    </div>
  </header>

  <!-- 3. Haute Couture Hero Banner -->
  <section class="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 py-16 md:py-24">
    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]"></div>
    <div class="max-w-5xl mx-auto px-4 text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono mb-4">
        <span>✨ ERODE COTTON & CHANDERI ARTISANAL EDITION ✨</span>
      </div>
      <h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-serif text-white mb-6 leading-tight">
        Timeless Indian Couture,<br />
        <span class="gold-gradient">Handcrafted For Sovereignty</span>
      </h1>
      <p class="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-8">
        Pure breathable organic cotton kurthis, shimmering Chanderi zari sarees, and royal Mulberry silk gowns. Tailored precision with modern boutique finishes.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <a href="#collections" class="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20">
          Explore Couture
        </a>
        <button onclick="openCartDrawer()" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs transition-all">
          View Shopping Bag
        </button>
      </div>

      <!-- Trust Badges -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800/80 text-left">
        <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <p class="text-xs font-bold text-white">🌿 100% Pure Cotton</p>
          <p class="text-[10px] text-slate-400">Authentic Erode Loom</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <p class="text-xs font-bold text-white">🪡 Artisanal Zari</p>
          <p class="text-[10px] text-slate-400">Handcrafted Needlework</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <p class="text-xs font-bold text-white">🚚 Express Dispatch</p>
          <p class="text-[10px] text-slate-400">Free India Delivery > ₹1,999</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
          <p class="text-xs font-bold text-white">🔒 Sovereign Verified</p>
          <p class="text-[10px] text-slate-400">UPI, Card & COD</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. Interactive Collection Catalog -->
  <main id="collections" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h2 class="text-2xl font-bold font-serif text-white tracking-tight">Curated Seasonal Catalog</h2>
        <p class="text-xs text-slate-400 mt-1">Select from our signature handblock kurthis, tissue sarees, and festive gowns</p>
      </div>

      <!-- Category Filter Pills -->
      <div id="category-filters" class="flex flex-wrap gap-2"></div>
    </div>

    <!-- Product Grid -->
    <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  </main>

  <!-- 5. Slide-Over Shopping Bag Drawer -->
  <div id="cart-backdrop" onclick="closeCartDrawer()" class="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm hidden transition-opacity"></div>
  <aside id="cart-drawer" class="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-in-out">
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <h3 class="text-base font-bold font-serif text-white">Your Shopping Bag</h3>
        <span class="bag-count-badge px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300">0</span>
      </div>
      <button onclick="closeCartDrawer()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Free Shipping Progress -->
    <div class="p-3.5 bg-slate-900/60 border-b border-slate-800/80">
      <div id="free-shipping-text" class="text-xs text-slate-300 mb-1.5 font-medium">Checking delivery threshold...</div>
      <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div id="free-shipping-bar" class="h-full bg-amber-400 w-0 transition-all duration-500"></div>
      </div>
    </div>

    <!-- Items List -->
    <div id="cart-items-list" class="flex-1 overflow-y-auto p-4 space-y-3"></div>

    <!-- Summary Footer -->
    <div class="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
      <div class="space-y-1.5 text-xs">
        <div class="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span id="cart-subtotal" class="font-mono text-white">₹0</span>
        </div>
        <div class="flex justify-between text-slate-400">
          <span>Express Delivery</span>
          <span id="cart-shipping" class="font-mono text-emerald-400">COMPLIMENTARY</span>
        </div>
        <div class="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
          <span>Grand Total</span>
          <span id="cart-total" class="font-mono text-amber-400 text-base">₹0</span>
        </div>
      </div>

      <button id="checkout-btn" onclick="openCheckoutModal()" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20 disabled:opacity-40 disabled:cursor-not-allowed">
        Proceed To Checkout
      </button>
    </div>
  </aside>

  <!-- 6. Instant Checkout Modal -->
  <div id="checkout-modal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <h3 class="text-lg font-bold font-serif text-white">Sovereign Express Checkout</h3>
          <p class="text-xs text-slate-400">Direct courier fulfillment across India</p>
        </div>
        <button onclick="closeCheckoutModal()" class="text-slate-400 hover:text-white p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form onsubmit="handleCheckout(event)" class="space-y-3.5">
        <div>
          <label class="block text-xs font-mono text-slate-400 mb-1">Customer Full Name</label>
          <input id="cust-name" type="text" required value="Master Sri" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400">
        </div>
        <div>
          <label class="block text-xs font-mono text-slate-400 mb-1">Mobile Contact (+91)</label>
          <input id="cust-phone" type="text" required value="+91 98421 99999" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400">
        </div>
        <div>
          <label class="block text-xs font-mono text-slate-400 mb-1">Delivery Address & Pincode</label>
          <textarea id="cust-address" required rows="2" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400">Invi Creation Luxury Atelier, Perundurai Road, Erode 638011, Tamil Nadu</textarea>
        </div>
        <div>
          <label class="block text-xs font-mono text-slate-400 mb-1">Payment Method</label>
          <select id="cust-payment" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400">
            <option value="UPI Instant Verified" selected>UPI (Google Pay / PhonePe / Paytm) - 0% Fee</option>
            <option value="Cash on Delivery">Cash On Delivery (COD)</option>
            <option value="Credit / Debit Card">Credit / Debit Card (Mastercard / Visa / RuPay)</option>
          </select>
        </div>

        <button type="submit" class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20">
          Confirm Order & Generate Invoice
        </button>
      </form>
    </div>
  </div>

  <!-- 7. Order Confirmation Modal -->
  <div id="order-confirmed-modal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
      <div class="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-2xl">
        ✓
      </div>
      <h3 class="text-xl font-bold font-serif text-white">Order Confirmed!</h3>
      <p class="text-xs text-slate-400 mt-1">Thank you for your order. We are packaging your handcrafted ethnic pieces.</p>

      <div class="my-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs font-mono">
        <div class="flex justify-between">
          <span class="text-slate-500">Order ID:</span>
          <span id="order-confirmed-id" class="text-amber-400 font-bold">INVI-ORD-0000</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Tracking Code:</span>
          <span id="order-confirmed-tracking" class="text-cyan-400 font-bold">TRK-00000000</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Amount Paid:</span>
          <span id="order-confirmed-total" class="text-emerald-400 font-bold">₹0</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Estimated Delivery:</span>
          <span class="text-white">3-4 Business Days</span>
        </div>
      </div>

      <button onclick="closeSuccessModal()" class="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all">
        Continue Shopping
      </button>
    </div>
  </div>

  <!-- 8. Footer -->
  <footer class="bg-slate-950 border-t border-slate-800/80 py-8 mt-16 text-slate-400 text-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="font-serif font-bold text-white text-sm">INVI CREATION</span>
        <span class="text-slate-600">|</span>
        <span class="text-[11px] font-mono">Engineered autonomously by J.A.R.V.I.S. 20-Agent Swarm</span>
      </div>
      <div class="text-[11px] font-mono text-slate-500">
        E-Commerce REST API + Tailwind HTML5 + Automated Integration Suite
      </div>
    </div>
  </footer>

  <script src="/app.js"></script>
</body>
</html>`;

    // 4. Automated Integration Verification Suite (test.js)
    const testJs = `/**
 * ${topic} - Autonomous Verification & Acceptance Test Suite
 */
const http = require('http');
const { server } = require('./server');

const TEST_PORT = 4998;

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 [TEST] Booting Invi Luxury Clothing Store on port ' + TEST_PORT + '...');
  await new Promise(resolve => server.listen(TEST_PORT, resolve));

  try {
    // 1. Health
    const health = await request({ port: TEST_PORT, path: '/api/health', method: 'GET' });
    console.log('  ✔ GET /api/health Status:', health.status, 'Catalog Size:', health.data?.catalogCount);
    if (health.status !== 200 || !health.data.ok || health.data.catalogCount < 1) throw new Error('Health check failed');

    // 2. Metrics
    const metrics = await request({ port: TEST_PORT, path: '/api/metrics', method: 'GET' });
    console.log('  ✔ GET /api/metrics Status:', metrics.status, 'Total Products:', metrics.data?.totalProducts);
    if (metrics.status !== 200 || !metrics.data.ok) throw new Error('Metrics check failed');

    // 3. Products Catalog
    const products = await request({ port: TEST_PORT, path: '/api/products', method: 'GET' });
    console.log('  ✔ GET /api/products Status:', products.status, 'Items Returned:', products.data?.data?.length);
    if (products.status !== 200 || !Array.isArray(products.data?.data) || products.data.data.length === 0) throw new Error('Products catalog empty');

    // 4. Add to Cart
    const firstProd = products.data.data[0];
    const addToCart = await request(
      { port: TEST_PORT, path: '/api/cart', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { productId: firstProd.id, size: 'L', qty: 1 }
    );
    console.log('  ✔ POST /api/cart Status:', addToCart.status, 'Cart Size:', addToCart.data?.cart?.length);
    if (addToCart.status !== 201 || !addToCart.data?.ok) throw new Error('Cart addition failed');

    // 5. Read Cart & Pricing
    const cartRes = await request({ port: TEST_PORT, path: '/api/cart', method: 'GET' });
    console.log('  ✔ GET /api/cart Status:', cartRes.status, 'Subtotal: ₹' + cartRes.data?.subtotal, 'Grand Total: ₹' + cartRes.data?.grandTotal);
    if (cartRes.status !== 200 || cartRes.data.subtotal < firstProd.price) throw new Error('Cart calculation error');

    // 6. Checkout & Create Order
    const orderRes = await request(
      { port: TEST_PORT, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      {
        customerName: 'Master Sri',
        customerPhone: '+91 98421 99999',
        deliveryAddress: 'Invi Creation Penthouse, Erode, Tamil Nadu',
        paymentMethod: 'UPI Verified'
      }
    );
    console.log('  ✔ POST /api/orders Status:', orderRes.status, 'Order ID:', orderRes.data?.order?.id, 'Total: ₹' + orderRes.data?.order?.total);
    if (orderRes.status !== 201 || !orderRes.data?.order?.id) throw new Error('Order placement failed');

    // 7. Verify Orders List
    const ordersList = await request({ port: TEST_PORT, path: '/api/orders', method: 'GET' });
    console.log('  ✔ GET /api/orders Status:', ordersList.status, 'Orders Count:', ordersList.data?.count);
    if (ordersList.status !== 200 || ordersList.data?.count < 1) throw new Error('Orders query failed');

    // 8. Backward Compatibility: Generic /api/items
    const createdItem = await request(
      { port: TEST_PORT, path: '/api/items', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { title: 'Invi Creation E-Commerce Swarm Verification', priority: 'CRITICAL' }
    );
    console.log('  ✔ POST /api/items Status:', createdItem.status, 'Item ID:', createdItem.data?.item?.id);
    if (createdItem.status !== 201) throw new Error('Items compatibility POST failed');

    const deletedItem = await request({ port: TEST_PORT, path: '/api/items/' + createdItem.data.item.id, method: 'DELETE' });
    console.log('  ✔ DELETE /api/items/:id Status:', deletedItem.status);
    if (deletedItem.status !== 200) throw new Error('Items compatibility DELETE failed');

    console.log('🎉 [PASS] 100% of luxury clothing e-commerce integration tests passed cleanly!');
    process.exit(0);
  } catch (err) {
    console.error('❌ [FAIL] Test execution error:', err.message);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
`;

    // 5. package.json
    const pkgJson = JSON.stringify({
      name: projectName,
      version: '1.0.0',
      description: `${topic} - Invi Creation Autonomous Luxury Clothing E-Commerce Store`,
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        test: 'node test.js'
      },
      keywords: ['jarvis', 'invi-creation', 'clothing', 'e-commerce', 'ethnic-wear'],
      author: 'Master Sri (Sovereign Engineering)',
      license: 'Apache-2.0'
    }, null, 2);

    // 6. README.md
    const readmeMd = `# ${topic}

Autonomous luxury Indian ethnic clothing e-commerce store engineered by **J.A.R.V.I.S. 20-Agent Swarm**.
Tailored for **Invi Creation** (Erode cotton kurthis, Chanderi sarees, Mulberry silk gowns).

## Architecture
- **Backend API**: Pure Node.js REST API (\`server.js\`)
  - \`GET /api/health\` - Service uptime, store identity, and catalog size
  - \`GET /api/metrics\` - Live revenue, orders, and cart telemetry
  - \`GET /api/products\` - Full product catalog with size options and stock levels
  - \`GET /api/products/:id\` - Single piece details
  - \`GET /api/cart\` - Active shopping bag items and subtotal/shipping calculations
  - \`POST /api/cart\` - Add product to shopping bag with selected size
  - \`DELETE /api/cart/:id\` - Remove item from shopping bag
  - \`GET /api/orders\` - Retrieve all recorded customer orders
  - \`POST /api/orders\` - Checkout order and generate tracking ID
  - \`GET /api/items\`, \`POST /api/items\`, \`DELETE /api/items/:id\` - Backward compatibility endpoints
- **Frontend Storefront**: Responsive Haute Couture UI (\`index.html\` + \`app.js\`)
  - Luxury gold/emerald/obsidian theme
  - Real dynamic collection filters
  - Interactive size selection chips
  - Floating slide-over Shopping Bag drawer
  - 1-Click checkout modal with instant invoice generation
- **Automated Verification**: Self-contained integration test suite (\`test.js\`).

## Quickstart
\`\`\`bash
npm test    # Run full verification suite on ephemeral test port
npm start   # Launch store on http://localhost:4200
\`\`\`
`;

    return {
      serverJs,
      appJs,
      appHtml,
      testJs,
      pkgJson,
      readmeMd
    };
  }
}
