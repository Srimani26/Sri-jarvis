/**
 * Invi Creation - Unified Cart & Navigation Manager
 */

const InviCart = {
  KEY: 'invi_luxury_cart_items',

  getItems() {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addItem(product, size = 'Standard', quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(i => i.productId === product.id && i.size === size);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        fabric: product.fabric,
        price: product.price,
        imageUrl: product.image_url,
        size: size,
        quantity: quantity
      });
    }

    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
    return items;
  },

  updateQuantity(productId, size, newQty) {
    let items = this.getItems();
    if (newQty <= 0) {
      items = items.filter(i => !(i.productId === productId && i.size === size));
    } else {
      const item = items.find(i => i.productId === productId && i.size === size);
      if (item) item.quantity = newQty;
    }
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
    return items;
  },

  removeItem(productId, size) {
    let items = this.getItems().filter(i => !(i.productId === productId && i.size === size));
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
    return items;
  },

  clearCart() {
    localStorage.removeItem(this.KEY);
    this.updateBadge();
  },

  getTotalCount() {
    return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge-count');
    const count = this.getTotalCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  InviCart.updateBadge();
});
