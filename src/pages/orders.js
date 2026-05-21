import { api } from '../api.js';

export class OrderController {
    constructor() {
        this.appContent = document.getElementById('app-content');
    }

    async show() {
        if (!api.isLoggedIn()) {
            window.history.pushState({}, '', '/');
            window.handleLocation();
            return;
        }

        this.appContent.innerHTML = `
            <div class="px-4 md:px-12 py-12">
                <header class="mb-12">
                    <h2 class="text-4xl font-light text-[#262626] uppercase tracking-[-0.03em] leading-none mb-4">Lịch sử đơn hàng</h2>
                    <p class="text-[10px] font-black text-[#757575] uppercase tracking-widest">Theo dõi và quản lý các giao dịch của bạn</p>
                </header>

                <div id="orders-list-content" class="space-y-8 min-h-[400px] flex flex-col items-center justify-center">
                    <div class="w-12 h-12 border-4 border-[#1c69d4] border-t-transparent animate-spin rounded-full"></div>
                </div>
            </div>
        `;

        await this.loadOrders();
    }

    async loadOrders() {
        const container = document.getElementById('orders-list-content');
        try {
            const orders = await api.getMyOrders();
            this.renderOrders(orders, container);
        } catch (error) {
            container.innerHTML = `
                <div class="text-center py-20 bg-red-50 rounded-3xl w-full">
                    <p class="text-red-500 font-bold">Lỗi khi tải danh sách đơn hàng. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }

    renderOrders(orders, container) {
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-32 bg-gray-50 rounded-[40px] w-full border border-dashed border-gray-200">
                    <div class="mb-8 opacity-20 flex justify-center">
                        <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                    </div>
                    <h3 class="text-[11px] font-black text-[#262626] uppercase tracking-widest mb-4">Bạn chưa có đơn hàng nào</h3>
                    <button onclick="location.href='/?view=products'" class="text-[10px] font-black text-[#1c69d4] uppercase tracking-widest border-b border-[#1c69d4] pb-1">Khám phá sản phẩm ngay</button>
                </div>
            `;
            container.classList.remove('flex', 'flex-col', 'items-center', 'justify-center');
            return;
        }

        container.classList.remove('flex', 'items-center', 'justify-center');
        container.innerHTML = orders.map(order => this.renderOrderCard(order)).join('');
    }

    renderOrderCard(order) {
        const date = new Date(order.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusMap = {
            'pending': { label: 'Đang chờ duyệt', color: 'bg-amber-500' },
            'processing': { label: 'Đang xử lý', color: 'bg-blue-500' },
            'shipped': { label: 'Đang giao hàng', color: 'bg-indigo-500' },
            'delivered': { label: 'Đã giao hàng', color: 'bg-emerald-500' },
            'cancelled': { label: 'Đã hủy', color: 'bg-red-500' }
        };

        const status = statusMap[order.status] || { label: order.status, color: 'bg-gray-500' };

        return `
            <div class="bg-white border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-700 group">
                <div class="p-8 md:p-10 border-b border-gray-50 flex flex-wrap justify-between items-center gap-6">
                    <div class="space-y-2">
                        <div class="flex items-center gap-3">
                            <span class="text-[11px] font-black text-[#757575] uppercase tracking-widest">Đơn hàng</span>
                            <span class="text-lg font-black text-[#262626]">#${order.id}</span>
                        </div>
                        <p class="text-[14px] text-[#757575] font-light">${date}</p>
                    </div>

                    <div class="flex items-center gap-6">
                        <div class="flex flex-col items-end mr-4">
                            <span class="text-[10px] font-black text-[#757575] uppercase tracking-widest mb-1">Trạng thái</span>
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full ${status.color} animate-pulse"></div>
                                <span class="text-[12px] font-black uppercase tracking-widest text-[#262626]">${status.label}</span>
                            </div>
                        </div>
                        <div class="h-12 w-[1px] bg-gray-100 hidden md:block"></div>
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] font-black text-[#757575] uppercase tracking-widest mb-1 text-right">Tổng thanh toán</span>
                            <span class="text-2xl font-light text-[#1c69d4] tracking-tight">${new Intl.NumberFormat('vi-VN').format(Math.round(order.total_price))} ₫</span>
                        </div>
                    </div>
                </div>

                <div class="p-8 md:p-10 bg-gray-50/30">
                    <div class="space-y-6">
                        ${order.OrderItems.map(item => `
                            <div class="flex items-center gap-8 group/item">
                                <div class="w-20 h-20 bg-white rounded-2xl p-3 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover/item:border-[#1c69d4] transition-colors duration-500">
                                    <img src="${item.Product?.image_url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='32' font-family='Arial,sans-serif' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3E${(item.Product?.name || 'P').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`}" 
                                         class="max-w-full max-h-full object-contain" alt="${item.Product?.name}">
                                </div>
                                <div class="flex-grow min-w-0">
                                    <h4 class="text-[14px] font-black text-[#262626] uppercase tracking-tight line-clamp-1 group-hover/item:text-[#1c69d4] transition-colors mb-1">${item.Product?.name || 'Sản phẩm đã gỡ bỏ'}</h4>
                                    <div class="flex items-center gap-4 text-[12px] font-light text-[#757575]">
                                        <span>Số lượng: <span class="font-black text-[#262626]">${item.quantity}</span></span>
                                        <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>Đơn giá: <span class="font-black text-[#262626]">${new Intl.NumberFormat('vi-VN').format(Math.round(item.price))} ₫</span></span>
                                    </div>
                                </div>
                                <div class="text-right hidden sm:block">
                                    <span class="text-[14px] font-black text-[#262626]">${new Intl.NumberFormat('vi-VN').format(Math.round(item.price * item.quantity))} ₫</span>
                                    ${order.status === 'delivered' ? `
                                    <button onclick="window.orderController.openReviewModal(${item.product_id}, '${(item.Product?.name || '').replace(/'/g, "\\'")}')" class="mt-2 text-[10px] text-[#1c69d4] hover:text-[#154e9e] border-b border-transparent hover:border-[#1c69d4] transition-all font-black uppercase tracking-widest block text-right w-full">Đánh giá sản phẩm</button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="px-8 py-6 bg-white border-t border-gray-50 flex flex-wrap justify-between items-center gap-4 opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-700">
                    <p class="text-[12px] text-[#757575] italic leading-tight max-w-md">
                        <span class="font-black uppercase tracking-widest text-[10px] block not-italic mb-1">Địa chỉ nhận hàng:</span>
                        ${order.shipping_address || 'Không có thông tin'}
                    </p>
                    <div class="flex gap-4">
                        <button onclick="window.orderController.handleViewDetails(${order.id})" class="px-6 py-2 border border-[#262626] text-[10px] font-black uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all duration-300">Chi tiết hóa đơn</button>
                        ${order.status === 'pending' ? `
                            <button onclick="window.orderController.handleCancelOrder(${order.id})" class="px-6 py-2 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all duration-300">Hủy đơn hàng</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async handleCancelOrder(orderId) {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

        try {
            await api.cancelOrder(orderId);
            alert('Hủy đơn hàng thành công');
            this.loadOrders();
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    }

    async handleViewDetails(orderId) {
        try {
            const order = await api.getOrderById(orderId);
            this.showOrderDetailModal(order);
        } catch (error) {
            alert('Lỗi khi lấy thông tin chi tiết: ' + error.message);
        }
    }

    showOrderDetailModal(order) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300';
        modal.id = 'order-detail-modal';
        
        const date = new Date(order.createdAt).toLocaleString('vi-VN');
        
        modal.innerHTML = `
            <div class="bg-white rounded-[40px] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <header class="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 class="text-2xl font-black text-[#262626] mb-1">CHI TIẾT ĐƠN HÀNG #${order.id}</h3>
                        <p class="text-[12px] font-medium text-[#757575] uppercase tracking-widest">Ngày đặt: ${date}</p>
                    </div>
                    <button onclick="document.getElementById('order-detail-modal').remove()" class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:shadow-lg transition-all text-[#757575]">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </header>
                
                <div class="flex-grow overflow-y-auto p-8 md:p-10 space-y-12">
                    <!-- Thông tin khách hàng -->
                    <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 class="text-[10px] font-black text-[#757575] uppercase tracking-widest mb-4">Thông tin nhận hàng</h4>
                            <div class="space-y-3">
                                <p class="text-[15px] font-bold text-[#262626]">${order.customer_name}</p>
                                <p class="text-[14px] text-[#757575]">${order.customer_phone}</p>
                                <p class="text-[14px] text-[#757575] leading-relaxed">${order.shipping_address}</p>
                            </div>
                        </div>
                        <div class="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                            <h4 class="text-[10px] font-black text-[#757575] uppercase tracking-widest mb-4">Trạng thái thanh toán</h4>
                            <div class="flex items-center gap-3 mb-4">
                                <div class="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-widest rounded-full">Thanh toán khi nhận hàng (COD)</div>
                            </div>
                            <p class="text-[13px] text-[#757575] italic">Ghi chú: Đơn hàng sẽ được vận chuyển và bạn sẽ thanh toán trực tiếp cho nhân viên giao hàng.</p>
                        </div>
                    </section>

                    <!-- Danh sách sản phẩm -->
                    <section>
                        <h4 class="text-[10px] font-black text-[#757575] uppercase tracking-widest mb-6">Sản phẩm đã chọn</h4>
                        <div class="border border-gray-100 rounded-[32px] overflow-hidden">
                            <table class="w-full text-left">
                                <thead class="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th class="px-6 py-4 text-[10px] font-black text-[#757575] uppercase tracking-widest">Sản phẩm</th>
                                        <th class="px-6 py-4 text-[10px] font-black text-[#757575] uppercase tracking-widest text-center">SL</th>
                                        <th class="px-6 py-4 text-[10px] font-black text-[#757575] uppercase tracking-widest text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50">
                                    ${order.OrderItems.map(item => {
                                        const fallbackImg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-family='Arial,sans-serif' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3E${(item.Product?.name || 'P').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                                        return `
                                        <tr>
                                            <td class="px-6 py-5">
                                                <div class="flex items-center gap-4">
                                                    <div class="w-12 h-12 bg-gray-50 rounded-xl p-1 flex-shrink-0 border border-gray-100">
                                                        <img src="${item.Product?.image_url || fallbackImg}" 
                                                             class="w-full h-full object-contain" 
                                                             alt="${item.Product?.name || ''}">
                                                    </div>
                                                    <div class="flex flex-col">
                                                        <span class="text-[13px] font-bold text-[#262626] line-clamp-1">${item.Product?.name || 'Sản phẩm đã gỡ bỏ'}</span>
                                                        ${order.status === 'delivered' ? `
                                                            <button onclick="window.orderController.openReviewModal(${item.product_id}, '${(item.Product?.name || '').replace(/'/g, "\\'")}')" class="mt-1 text-[10px] text-[#1c69d4] hover:underline font-bold uppercase tracking-widest text-left w-fit">Đánh giá sản phẩm</button>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-5 text-center text-[13px] text-[#262626]">${item.quantity}</td>
                                            <td class="px-6 py-5 text-right text-[13px] font-bold text-[#262626]">${new Intl.NumberFormat('vi-VN').format(Math.round(item.price * item.quantity))} ₫</td>
                                        </tr>
                                    `;}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
                
                <footer class="p-8 md:p-10 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="text-center md:text-left">
                         <p class="text-[11px] font-bold text-[#757575] uppercase tracking-widest mb-1">Mã tra cứu đơn hàng</p>
                         <p class="text-[16px] font-black text-[#1c69d4] tracking-widest">VTP-${order.id}${Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-black text-[#757575] uppercase tracking-widest mb-1">Tổng cộng</p>
                        <p class="text-4xl font-light text-[#1c69d4] tracking-tighter">${new Intl.NumberFormat('vi-VN').format(Math.round(order.total_price))} ₫</p>
                    </div>
                </footer>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Đóng khi click ra ngoài
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    openReviewModal(productId, productName) {
        this.currentReviewProductId = productId;
        this.currentReviewRating = 5;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300';
        modal.id = 'order-review-modal';
        
        modal.innerHTML = `
            <div class="bg-white rounded-[40px] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <header class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 class="text-xl font-black text-[#262626] mb-1">ĐÁNH GIÁ SẢN PHẨM</h3>
                        <p class="text-[11px] font-medium text-[#757575] uppercase tracking-widest line-clamp-1">${productName}</p>
                    </div>
                    <button onclick="document.getElementById('order-review-modal').remove()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition-all text-[#757575]">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </header>
                
                <div class="p-8">
                    <form onsubmit="window.orderController.submitOrderReview(event)" class="space-y-6">
                        <div>
                            <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest mb-3 text-center">Chất lượng sản phẩm</label>
                            <div class="flex gap-3 justify-center cursor-pointer" id="order-review-stars">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <svg id="order-star-${i}" onclick="window.orderController.setOrderReviewRating(${i})" class="w-10 h-10 ${i <= 5 ? 'text-yellow-400' : 'text-gray-300'} transition-colors" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest mb-3">Bình luận của bạn</label>
                            <textarea id="order-review-comment" required rows="4" class="w-full bg-gray-50 rounded-2xl border-none p-5 text-[13px] text-[#262626] outline-none focus:ring-2 focus:ring-[#1c69d4]/20 transition-all" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."></textarea>
                        </div>
                        <button id="order-submit-review-btn" type="submit" class="w-full h-14 bg-[#262626] text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-[#1c69d4] shadow-lg hover:shadow-xl transition-all">
                            Gửi đánh giá
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    setOrderReviewRating(rating) {
        this.currentReviewRating = rating;
        for (let i = 1; i <= 5; i++) {
            const star = document.getElementById(`order-star-${i}`);
            if (star) {
                if (i <= rating) {
                    star.classList.remove('text-gray-300');
                    star.classList.add('text-yellow-400');
                } else {
                    star.classList.remove('text-yellow-400');
                    star.classList.add('text-gray-300');
                }
            }
        }
    }

    async submitOrderReview(e) {
        e.preventDefault();
        const comment = document.getElementById('order-review-comment').value;
        const submitBtn = document.getElementById('order-submit-review-btn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = 'ĐANG GỬI...';
            submitBtn.disabled = true;
            
            await api.addReview(this.currentReviewProductId, this.currentReviewRating, comment);
            
            alert('Cảm ơn bạn đã đánh giá sản phẩm!');
            document.getElementById('order-review-modal').remove();
            
        } catch (error) {
            console.error('Lỗi gửi đánh giá:', error);
            alert(error.message || 'Lỗi khi gửi đánh giá');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}
