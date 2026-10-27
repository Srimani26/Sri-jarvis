/**
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
    return '<button onclick="selectCategory(\'' + cat.replace(/'/g, "\\'") + '\')" class="px-4 py-2 rounded-full text-xs font-medium transition-all ' + activeClass + '">' + cat + '</button>';
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
      return '<button onclick="selectSize(\'' + p.id + '\', \'' + s + '\')" class="w-7 h-7 text-[10px] rounded-lg transition-all ' + cls + '">' + s + '</button>';
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
        '<button onclick="addToBag(\'' + p.id + '\')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 active:scale-[0.98]">' +
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
          '<button onclick="removeCartItem(\'' + item.id + '\')" class="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors">' +
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
