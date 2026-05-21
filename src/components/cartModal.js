import { api } from '../api.js';

// ===================================
// Cart Modal (Slide-out Panel)
// ===================================

export class CartModal {
    constructor() {
        this.isOpen = false;
        this._injectStyles();
        this._injectDOM();
        this._bindGlobalAddToCart();
    }

    // ---- Inject CSS (Toast + Panel) ----
    _injectStyles() {
        if (document.getElementById('cart-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'cart-modal-styles';
        style.textContent = `
            #cart-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                z-index: 9998; opacity: 0; pointer-events: none;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(4px);
            }
            #cart-overlay.open { opacity: 1; pointer-events: all; }

            #cart-panel {
                position: fixed; top: 0; right: 0; bottom: 0;
                width: 100%; max-width: 440px;
                background: #fff; z-index: 9999;
                transform: translateX(100%);
                transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; flex-direction: column;
                box-shadow: -20px 0 60px rgba(0,0,0,0.15);
            }
            #cart-panel.open { transform: translateX(0); }

            .cart-toast {
                position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
                background: #1a1a1a; color: #fff;
                padding: 14px 24px; border-radius: 100px;
                font-size: 14px; font-weight: 700; letter-spacing: 0.03em;
                z-index: 10000; opacity: 0; pointer-events: none;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; align-items: center; gap: 10px;
                white-space: nowrap; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            }
            .cart-toast.show {
                opacity: 1; transform: translateX(-50%) translateY(0);
            }
            .cart-toast.success { background: #1a1a1a; }
            .cart-toast.error { background: #dc2626; }

            .cart-qty-btn {
                width: 28px; height: 28px; border-radius: 8px;
                border: 1.5px solid #e2e8f0; background: #f8fafc;
                font-size: 16px; font-weight: 700; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.15s ease; color: #374151;
                flex-shrink: 0;
            }
            .cart-qty-btn:hover { background: #1c69d4; border-color: #1c69d4; color: white; }

            #cart-badge {
                position: absolute; top: -6px; right: -6px;
                background: #dc2626; color: white;
                width: 18px; height: 18px; border-radius: 50%;
                font-size: 10px; font-weight: 900;
                display: flex; align-items: center; justify-content: center;
                line-height: 1; border: 2px solid white;
                opacity: 0; transform: scale(0);
                transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            #cart-badge.visible { opacity: 1; transform: scale(1); }
        `;
        document.head.appendChild(style);
    }

    // ---- Inject HTML DOM ----
    _injectDOM() {
        if (document.getElementById('cart-panel')) return;

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.onclick = () => this.close();
        document.body.appendChild(overlay);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'cart-panel';
        panel.innerHTML = `
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-black text-gray-900 tracking-tight">Giỏ hàng của bạn</h2>
                    <p id="cart-count-text" class="text-xs text-gray-400 font-bold mt-0.5">0 sản phẩm</p>
                </div>
                <button onclick="window.cartModal.close()" 
                    class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- Items List -->
            <div id="cart-items-list" class="flex-1 overflow-y-auto p-6 space-y-4">
                <div class="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div class="text-6xl mb-4">🛒</div>
                    <p class="font-black text-gray-400 text-lg">Giỏ hàng trống</p>
                    <p class="text-gray-300 text-sm mt-1">Hãy thêm sản phẩm bạn thích!</p>
                </div>
            </div>

            <!-- Footer Summary -->
            <div id="cart-footer" class="p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 hidden">
                <div class="flex justify-between items-center mb-5">
                    <span class="text-sm font-bold text-gray-500 uppercase tracking-widest">Tổng cộng</span>
                    <span id="cart-total-price" class="text-2xl font-black text-gray-900 tracking-tight">0 ₫</span>
                </div>
                <button onclick="window.cartModal.checkout()"
                    class="w-full py-4 bg-[#1c69d4] hover:bg-[#1557b0] text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-blue-500/25">
                    Tiến hành thanh toán →
                </button>
                <button onclick="window.cartModal.clearAll()"
                    class="w-full py-3 mt-3 text-red-400 hover:text-red-600 font-bold text-sm uppercase tracking-widest transition-colors">
                    Xóa toàn bộ giỏ hàng
                </button>
            </div>
        `;
        document.body.appendChild(panel);

        // Toast container
        const toast = document.createElement('div');
        toast.id = 'cart-toast';
        toast.className = 'cart-toast';
        document.body.appendChild(toast);
    }

    // ---- Public API ----
    async open() {
        if (!api.isLoggedIn()) {
            this.showToast('Vui lòng đăng nhập để xem giỏ hàng', 'error');
            // Trigger login modal if available
            const loginBtn = document.getElementById('navbar-login-btn');
            if (loginBtn) loginBtn.click();
            return;
        }
        document.getElementById('cart-overlay').classList.add('open');
        document.getElementById('cart-panel').classList.add('open');
        this.isOpen = true;
        await this.load();
    }

    close() {
        document.getElementById('cart-overlay').classList.remove('open');
        document.getElementById('cart-panel').classList.remove('open');
        this.isOpen = false;
    }

    async load() {
        const list = document.getElementById('cart-items-list');
        list.innerHTML = `<div class="flex items-center justify-center py-16">
            <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>`;

        try {
            const data = await api.getCart();
            this._renderItems(data.items);
            this.updateBadge(data.items.reduce((sum, i) => sum + i.quantity, 0));
        } catch (e) {
            list.innerHTML = `<p class="text-center text-red-400 py-8 font-bold">Lỗi tải giỏ hàng</p>`;
        }
    }

    _renderItems(items) {
        const list = document.getElementById('cart-items-list');
        const footer = document.getElementById('cart-footer');
        const countText = document.getElementById('cart-count-text');
        const totalEl = document.getElementById('cart-total-price');

        if (!items || items.length === 0) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div class="text-6xl mb-4">🛒</div>
                    <p class="font-black text-gray-400 text-lg">Giỏ hàng trống</p>
                    <p class="text-gray-300 text-sm mt-1">Hãy thêm sản phẩm bạn thích!</p>
                </div>`;
            footer.classList.add('hidden');
            countText.textContent = '0 sản phẩm';
            return;
        }

        const totalQty = items.reduce((s, i) => s + i.quantity, 0);
        const totalPrice = items.reduce((s, i) => s + (parseFloat(i.Product?.price || 0) * i.quantity), 0);

        countText.textContent = `${totalQty} sản phẩm`;
        totalEl.textContent = new Intl.NumberFormat('vi-VN').format(Math.round(totalPrice)) + ' ₫';
        footer.classList.remove('hidden');

        list.innerHTML = items.map(item => {
            const product = item.Product || {};
            const price = parseFloat(product.price || 0);
            const img = product.image_url || `https://placehold.co/80x80/f1f5f9/94a3b8?text=${encodeURIComponent(product.name?.charAt(0) || '?')}`;
            return `
                <div class="flex gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all group" data-item-id="${item.id}">
                    <img src="${img}" alt="${product.name}" 
                        class="w-20 h-20 object-contain rounded-xl bg-gray-50 flex-shrink-0 cursor-pointer"
                        onclick="window.showProductDetail(${product.id}); window.cartModal.close()">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                           onclick="window.showProductDetail(${product.id}); window.cartModal.close()">
                            ${product.name}
                        </p>
                        <p class="font-black text-[#1c69d4] text-base mb-3">
                            ${new Intl.NumberFormat('vi-VN').format(Math.round(price))} ₫
                        </p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <button class="cart-qty-btn" onclick="window.cartModal.updateQty(${item.id}, ${item.quantity - 1})">−</button>
                                <span class="font-black text-gray-900 text-sm w-6 text-center">${item.quantity}</span>
                                <button class="cart-qty-btn" onclick="window.cartModal.updateQty(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <button onclick="window.cartModal.removeItem(${item.id})"
                                class="text-gray-300 hover:text-red-500 transition-colors p-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async updateQty(itemId, newQty) {
        if (newQty < 1) {
            return this.removeItem(itemId);
        }
        try {
            await api.updateCartItem(itemId, newQty);
            await this.load();
        } catch (e) {
            this.showToast('Lỗi cập nhật số lượng', 'error');
        }
    }

    async removeItem(itemId) {
        try {
            const result = await api.removeFromCart(itemId);
            await this.load();
            this.updateBadge(result.totalItems);
            this.showToast('Đã xóa sản phẩm khỏi giỏ hàng');
        } catch (e) {
            this.showToast('Lỗi xóa sản phẩm', 'error');
        }
    }

    async clearAll() {
        if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
        try {
            await api.clearCart();
            await this.load();
            this.updateBadge(0);
            this.showToast('Đã xóa toàn bộ giỏ hàng');
        } catch (e) {
            this.showToast('Lỗi xóa giỏ hàng', 'error');
        }
    }

    checkout() {
        this.close();
        window.history.pushState({}, '', '/?view=checkout');
        window.handleLocation?.();
    }

    // ---- Global addToCart handler (called from product cards) ----
    _bindGlobalAddToCart() {
        window.addToCart = async (productId) => {
            if (!api.isLoggedIn()) {
                this.showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'error');
                const loginBtn = document.getElementById('navbar-login-btn');
                if (loginBtn) loginBtn.click();
                return;
            }
            try {
                const result = await api.addToCart(productId, 1);
                this.updateBadge(result.totalItems);
                this.showToast('✓ Đã thêm vào giỏ hàng');
            } catch (e) {
                this.showToast('Lỗi thêm vào giỏ hàng', 'error');
            }
        };
    }

    // ---- Badge update ----
    updateBadge(count) {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;
        badge.textContent = count > 9 ? '9+' : count;
        if (count > 0) {
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    }

    async refreshBadge() {
        if (!api.isLoggedIn()) return;
        try {
            const data = await api.getCart();
            const total = data.items.reduce((s, i) => s + i.quantity, 0);
            this.updateBadge(total);
        } catch (e) { /* silent */ }
    }

    // ---- Toast Notification ----
    showToast(message, type = 'success') {
        const toast = document.getElementById('cart-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `cart-toast ${type}`;
        // Force reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }
}

export const cartModal = new CartModal();
