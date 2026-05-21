import { api } from "../api.js";

export class CartController {
  constructor() {
    this._items = []; // Local cache
    this.isOpen = false;
    this.GUEST_KEY = "guest_cart";

    this.initUI();
    this.bindEvents();
    this.loadBadge();

    // Expose global methods
    window.addToCart = this.addToCart.bind(this);
    window.cartController = this;
  }

  initUI() {
    const container = document.getElementById("cart-container");
    if (!container) return;
    container.innerHTML = `
            <!-- Backdrop -->
            <div id="cart-backdrop" class="fixed inset-0 bg-[#262626]/40 backdrop-blur-md z-[60] hidden opacity-0 transition-opacity duration-500"></div>
            
            <!-- Slide-over -->
            <div id="cart-panel" class="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[70] shadow-[0_0_100px_rgba(0,0,0,0.2)] transform translate-x-full transition-transform duration-500 flex flex-col">
                <div class="px-10 py-8 border-b border-gray-100 flex justify-between items-end bg-white">
                    <div>
                        <h2 class="text-4xl font-light text-[#262626] uppercase tracking-[-0.03em] leading-none">GIỎ HÀNG</h2>
                        <p id="cart-count-label" class="text-[10px] font-black text-[#757575] uppercase tracking-widest mt-2">0 SẢN PHẨM</p>
                    </div>
                    <button id="cart-close-btn" class="p-2 text-[#262626] hover:text-[#1c69d4] transition-colors">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div id="cart-items" class="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">
                    <!-- Items mapped here -->
                </div>
                
                <div class="px-10 py-6 border-t border-gray-100 bg-white shadow-[0_-15px_30px_rgba(0,0,0,0.03)] z-10">
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-[10px] font-black text-[#757575] uppercase tracking-widest">TỔNG ĐƠN HÀNG</span>
                        <span id="cart-total" class="text-2xl font-bold text-[#262626] tracking-tight">0 ₫</span>
                    </div>
                    
                    <button id="cart-checkout-btn" class="w-full h-14 bg-[#262626] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#1c69d4] transition-all duration-500 flex items-center justify-center gap-3">
                        TIẾN HÀNH THANH TOÁN
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </button>
                    <p class="text-center text-[8px] font-black text-[#bbbbbb] mt-4 uppercase tracking-[0.1em]">GIAO HÀNG TIÊU CHUẨN MIỄN PHÍ TRÊN TOÀN QUỐC</p>
                </div>
            </div>

            <!-- Toast Notification -->
            <div id="cart-toast-notif" style="
                position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
                background:#1a1a1a; color:#fff; padding:14px 24px; border-radius:100px;
                font-size:14px; font-weight:700; z-index:10000; opacity:0; pointer-events:none;
                transition:all 0.35s cubic-bezier(0.4,0,0.2,1); white-space:nowrap;
                box-shadow:0 8px 32px rgba(0,0,0,0.25); display:flex; align-items:center; gap:10px;
            "></div>
        `;

    this.panel = document.getElementById("cart-panel");
    this.backdrop = document.getElementById("cart-backdrop");
    this.itemsContainer = document.getElementById("cart-items");
    this.totalEl = document.getElementById("cart-total");
  }

  bindEvents() {
    document
      .getElementById("cart-toggle-btn")
      ?.addEventListener("click", () => this.toggleCart());
    document
      .getElementById("cart-close-btn")
      ?.addEventListener("click", () => this.toggleCart(false));
    this.backdrop?.addEventListener("click", () => this.toggleCart(false));

    document
      .getElementById("cart-checkout-btn")
      ?.addEventListener("click", () => {
        this.toggleCart(false);
        window.history.pushState({}, "", "/checkout");
        if (window.handleLocation) window.handleLocation();
      });
  }

  // ---- Badge Management ----
  async loadBadge() {
    if (api.isLoggedIn()) {
      try {
        const data = await api.getCart();
        this._items = data.items;
        const count = this._items.reduce((s, i) => s + i.quantity, 0);
        this._setBadge(count);
      } catch (e) {
        this._setBadge(0);
      }
    } else {
      const guestCart = JSON.parse(
        localStorage.getItem(this.GUEST_KEY) || "[]",
      );
      const count = guestCart.reduce((s, i) => s + i.quantity, 0);
      this._setBadge(count);
    }
  }

  _setBadge(count) {
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
    const label = document.getElementById("cart-count-label");
    if (label) label.textContent = `${count} SẢN PHẨM`;
  }

  // ---- Add to Cart (Member vs Guest) ----
  async addToCart(productId, quantity = 1) {
    if (api.isLoggedIn()) {
      try {
        const result = await api.addToCart(parseInt(productId), quantity);
        this._setBadge(result.totalItems);
        this.showToast("✓ Đã thêm vào giỏ hàng");
      } catch (e) {
        this.showToast("Lỗi thêm vào giỏ hàng", "#dc2626");
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem(this.GUEST_KEY) || "[]");
      const existingIdx = guestCart.findIndex(
        (item) => item.product_id === parseInt(productId),
      );

      if (existingIdx > -1) {
        guestCart[existingIdx].quantity += quantity;
      } else {
        guestCart.push({ product_id: parseInt(productId), quantity });
      }

      localStorage.setItem(this.GUEST_KEY, JSON.stringify(guestCart));
      const count = guestCart.reduce((s, i) => s + i.quantity, 0);
      this._setBadge(count);
      this.showToast("✓ Đã thêm vào giỏ (Khách)");
    }

    // Track behavior anyway
    api.trackBehavior(productId, "add_to_cart").catch(() => {});
  }

  // ---- Update/Remove ----
  async removeFromCart(itemId, isGuest = false) {
    if (api.isLoggedIn() && !isGuest) {
      try {
        const result = await api.removeFromCart(itemId);
        this._setBadge(result.totalItems);
        await this.renderItems();
      } catch (e) {
        this.showToast("Lỗi xóa sản phẩm", "#dc2626");
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem(this.GUEST_KEY) || "[]");
      guestCart.splice(itemId, 1); // itemId is index for guest
      localStorage.setItem(this.GUEST_KEY, JSON.stringify(guestCart));
      await this.renderItems();
      const count = guestCart.reduce((s, i) => s + i.quantity, 0);
      this._setBadge(count);
    }
  }

  async updateQuantity(itemId, newQty, isGuest = false) {
    if (newQty < 1) return this.removeFromCart(itemId, isGuest);

    if (api.isLoggedIn() && !isGuest) {
      try {
        await api.updateCartItem(itemId, newQty);
        await this.renderItems();
      } catch (e) {
        this.showToast("Lỗi cập nhật số lượng", "#dc2626");
      }
    } else {
      let guestCart = JSON.parse(localStorage.getItem(this.GUEST_KEY) || "[]");
      if (guestCart[itemId]) {
        guestCart[itemId].quantity = newQty;
        localStorage.setItem(this.GUEST_KEY, JSON.stringify(guestCart));
        await this.renderItems();
        const count = guestCart.reduce((s, i) => s + i.quantity, 0);
        this._setBadge(count);
      }
    }
  }

  // ---- Cart Synchronization (Merge) ----
  async syncGuestCart() {
    const guestCart = JSON.parse(localStorage.getItem(this.GUEST_KEY) || "[]");
    if (guestCart.length === 0) return;

    console.log("[Cart] Syncing guest items...");
    for (const item of guestCart) {
      try {
        await api.addToCart(item.product_id, item.quantity);
      } catch (e) {
        console.error("Sync item failed:", item);
      }
    }

    localStorage.removeItem(this.GUEST_KEY);
    await this.loadBadge();
  }

  async toggleCart(forceOpen = null) {
    this.isOpen = forceOpen !== null ? forceOpen : !this.isOpen;
    if (this.isOpen) {
      this.backdrop.classList.remove("hidden");
      setTimeout(() => {
        this.backdrop.classList.remove("opacity-0");
        this.panel.classList.remove("translate-x-full");
      }, 10);
      await this.renderItems();
    } else {
      this.backdrop.classList.add("opacity-0");
      this.panel.classList.add("translate-x-full");
      setTimeout(() => {
        this.backdrop.classList.add("hidden");
      }, 500);
    }
  }

  async renderItems() {
    if (!this.itemsContainer) return;
    this.itemsContainer.innerHTML = `<div class="flex justify-center py-20"><div class="w-8 h-8 border-4 border-[#1c69d4] border-t-transparent animate-spin"></div></div>`;

    let itemsWithData = [];
    let total = 0;

    try {
      if (api.isLoggedIn()) {
        const data = await api.getCart();
        this._items = data.items || [];
        itemsWithData = this._items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: item.Product,
          isGuest: false,
        }));
      } else {
        const guestCart = JSON.parse(
          localStorage.getItem(this.GUEST_KEY) || "[]",
        );
        for (let i = 0; i < guestCart.length; i++) {
          const product = await api._fetch(
            `/products/${guestCart[i].product_id}`,
          );
          itemsWithData.push({
            id: i, // Use index for guest items
            quantity: guestCart[i].quantity,
            product: product,
            isGuest: true,
          });
        }
      }

      if (itemsWithData.length === 0) {
        this.itemsContainer.innerHTML = `<div class="text-center py-20 text-[11px] font-black text-gray-400 uppercase tracking-widest">GIỎ HÀNG TRỐNG</div>`;
        this.totalEl.textContent = "0 ₫";
        this._setBadge(0);
        return;
      }

      let html = "";
      itemsWithData.forEach((item) => {
        const p = item.product || {};
        const price = p.price || 0;
        total += price * item.quantity;
        const img =
          p.image_url ||
          `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' font-size='36' font-family='Arial,sans-serif' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dominant-baseline='central'%3E${(p.name || "?").charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

        html += `
                    <div class="flex gap-4 items-center py-4 border-b border-gray-50 last:border-0 group">
                        <div class="w-16 h-16 bg-gray-50 flex-shrink-0 p-1">
                            <img src="${img}" class="w-full h-full object-contain" alt="${p.name}">
                        </div>
                        <div class="flex-1 flex justify-between items-center gap-4">
                            <div class="min-w-0">
                                <h4 class="text-[11px] font-black text-gray-900 line-clamp-1 uppercase tracking-tight mb-0.5">${p.name || "Sản phẩm"}</h4>
                                <p class="text-[11px] text-[#1c69d4] font-black">${new Intl.NumberFormat("vi-VN").format(price)} ₫</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center border border-gray-100 bg-white">
                                    <button onclick="window.cartController.updateQuantity(${item.id}, ${item.quantity - 1}, ${item.isGuest})" class="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-50 transition-colors">−</button>
                                    <span class="text-[10px] font-bold w-6 text-center">${item.quantity}</span>
                                    <button onclick="window.cartController.updateQuantity(${item.id}, ${item.quantity + 1}, ${item.isGuest})" class="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-50 transition-colors">+</button>
                                </div>
                                <button onclick="window.cartController.removeFromCart(${item.id}, ${item.isGuest})" class="text-gray-300 hover:text-red-500 transition-colors p-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
      });

      this.itemsContainer.innerHTML = html;
      this.totalEl.textContent =
        new Intl.NumberFormat("vi-VN").format(total) + " ₫";
      this._setBadge(itemsWithData.reduce((s, i) => s + i.quantity, 0));
    } catch (e) {
      console.error(e);
      this.itemsContainer.innerHTML = `<p class="text-center text-red-400 py-10 font-bold text-xs">LỖI TẢI DỮ LIỆU</p>`;
    }
  }

  showToast(message, color = "#1a1a1a") {
    const toast = document.getElementById("cart-toast-notif");
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = color;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
  }
}
