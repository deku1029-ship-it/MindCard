import { api } from '../api.js';
import { ProductCard } from '../components/productCard.js';

export class ProductDetail {
    constructor() {
        this.appContent = document.getElementById('app-content');
        this.reviews = [];
        this.userRating = 5;
        window.buyNow = this.buyNow.bind(this);
        window.submitReview = this.submitReview.bind(this);
        window.setRating = this.setRating.bind(this);
    }

    buyNow(productId) {
        if (window.cartController) {
            window.cartController.addToCart(productId, 1);
            setTimeout(() => {
                window.history.pushState({}, '', '/checkout');
                if (window.handleLocation) window.handleLocation();
            }, 100);
        }
    }

    async show(productId) {
        try {
            if (!this.appContent) return;

            // Show premium loading state
            this.appContent.innerHTML = `
                <div class="max-w-7xl mx-auto px-8 py-24 animate-pulse">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div class="aspect-square bg-gray-100"></div>
                        <div class="space-y-12">
                            <div class="h-16 bg-gray-100 w-3/4"></div>
                            <div class="h-8 bg-gray-100 w-1/4"></div>
                            <div class="h-32 bg-gray-100"></div>
                        </div>
                    </div>
                </div>
            `;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const [product, relatedData, reviewsData] = await Promise.all([
                api.getProductById(productId),
                api.getRelatedProducts(productId),
                api.getReviews(productId).catch(() => [])
            ]);

            this.currentProductId = productId;
            this.reviews = reviewsData;

            // Save for home page recommendation
            localStorage.setItem('last_viewed_product', JSON.stringify({
                id: product.id,
                category_id: product.category_id,
                brand_id: product.brand_id
            }));

            this.appContent.innerHTML = this.render(product, relatedData.products);

            // Track behavior for logged-in users
            if (api.isLoggedIn()) {
                api.trackBehavior(productId, 'view').catch(err => console.warn('[Tracking Error]', err));
            }

            // Add back button listener
            document.getElementById('detail-back-btn')?.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.history.pushState({}, '', '/');
                    if (window.handleLocation) window.handleLocation();
                }
            });

            // Re-init scroll reveal
            if (window.homePage && window.homePage.initScrollReveal) {
                window.homePage.initScrollReveal();
            }

        } catch (error) {
            console.error('Lỗi tải chi tiết sản phẩm:', error);
            this.appContent.innerHTML = `
                <div class="py-40 text-center bg-white border-t border-gray-100">
                    <h2 class="text-5xl font-light text-[#262626] mb-6 uppercase tracking-[-0.03em]">ỐI! CÓ LỖI XẢY RA</h2>
                    <p class="text-[#757575] font-black text-xs uppercase tracking-widest mb-12">${error.message}</p>
                    <button onclick="window.history.back()" class="bg-[#262626] text-white px-12 py-5 font-black uppercase tracking-widest hover:bg-[#1c69d4] transition-all">Quay lại</button>
                </div>
            `;
        }
    }

    setRating(rating) {
        this.userRating = rating;
        for (let i = 1; i <= 5; i++) {
            const star = document.getElementById(`star-${i}`);
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

    async submitReview(e) {
        e.preventDefault();
        const comment = document.getElementById('review-comment').value;
        const submitBtn = document.getElementById('submit-review-btn');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = 'Đang gửi...';
            submitBtn.disabled = true;

            await api.addReview(this.currentProductId, this.userRating, comment);

            // Re-render
            this.show(this.currentProductId);

        } catch (error) {
            console.error('Lỗi gửi đánh giá:', error);
            alert(error.message || 'Lỗi khi gửi đánh giá');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    renderStars(rating) {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.round(rating)) {
                starsHtml += `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
            } else {
                starsHtml += `<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
            }
        }
        return starsHtml;
    }

    render(product, relatedProducts) {
        const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;
        const categoryName = product.Category ? product.Category.name : (product.category || 'Sản phẩm');

        return `
            <div class="bg-white">
                <!-- Navigation & Breadcrumbs -->
                <nav class="border-b border-gray-100">
                    <div class="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-[#757575]">
                            <a href="/" onclick="window.history.pushState({}, '', '/'); window.handleLocation(); return false;" class="hover:text-[#1c69d4] transition-colors">Trang chủ</a>
                            <span class="text-gray-200">/</span>
                            <a href="/?view=products&category_id=${product.category_id}" onclick="window.history.pushState({}, '', '/?view=products&category_id=${product.category_id}'); window.handleLocation(); return false;" class="hover:text-[#1c69d4] transition-colors">${categoryName}</a>
                            <span class="text-gray-200">/</span>
                            <span class="text-[#262626] truncate max-w-[200px]">${product.name}</span>
                        </div>
                        <button id="detail-back-btn" class="flex items-center gap-3 text-[#262626] hover:text-[#1c69d4] transition-colors group text-[11px] font-black uppercase tracking-widest">
                            <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            QUAY LẠI
                        </button>
                    </div>
                </nav>

                <!-- Hero Product Section -->
                <section class="max-w-7xl mx-auto px-8 py-20 lg:py-32">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 xl:gap-32 items-center">
                        <!-- Product Image Gallery -->
                        <div class="relative bg-white border border-gray-100 p-12 lg:p-20 group">
                            <div class="aspect-square flex items-center justify-center overflow-hidden">
                                <img src="${product.image_url}" alt="${product.name}" class="max-w-full max-h-full object-contain transition-transform duration-1000 group-hover:scale-110">
                            </div>
                            
                            <!-- Badges -->
                            <div class="absolute top-10 left-10 flex flex-col gap-3">
                                ${discount > 0 ? `<span class="bg-[#e01a1a] text-white font-black px-4 py-2 text-[10px] uppercase tracking-widest shadow-2xl">-${discount}% OFF</span>` : ''}
                                <span class="bg-[#262626] text-white font-black px-4 py-2 text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 bg-[#00ff00] animate-pulse"></span>
                                    CHÍNH HÃNG
                                </span>
                            </div>
                        </div>

                        <!-- Product Content -->
                        <div class="flex flex-col">
                            <div class="mb-4">
                                <span class="text-[#1c69d4] text-[10px] font-black tracking-widest uppercase border-l-2 border-[#1c69d4] pl-4">
                                    ${product.Brand ? product.Brand.name : 'PREMIUM EDITION'}
                                </span>
                            </div>
                            <h1 class="text-5xl md:text-6xl lg:text-7xl font-light text-[#262626] mb-8 leading-none tracking-[-0.04em] uppercase">${product.name}</h1>
                            
                            <!-- Pricing Card -->
                            <div class="mb-12 border-t border-gray-100 pt-8">
                                <div class="flex items-baseline gap-6 mb-4">
                                    <span class="text-5xl font-black text-[#1c69d4] tracking-tight">${new Intl.NumberFormat('vi-VN').format(Math.round(product.price))}₫</span>
                                    ${product.original_price ? `<span class="text-gray-300 text-xl line-through font-light decoration-red-500">${new Intl.NumberFormat('vi-VN').format(Math.round(product.original_price))}₫</span>` : ''}
                                </div>
                                <div class="flex items-center gap-6 text-[11px] font-black text-[#757575] uppercase tracking-widest">
                                    <span class="flex items-center gap-1 text-[#1c69d4]">
                                        ${this.renderStars(product.rating || 0)}
                                        <span class="ml-2 font-black">${(product.rating || 0).toFixed(1)} / 5.0</span>
                                    </span>
                                    <span class="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span>Đã bán ${product.stock + 150} sản phẩm</span>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex flex-col sm:flex-row gap-4">
                                <button onclick="window.cartController.addToCart(${product.id}, 1)" class="flex-1 h-20 border-[1.5px] border-[#262626] text-[#262626] font-black uppercase tracking-widest text-[11px] hover:bg-[#262626] hover:text-white transition-all duration-300 flex items-center justify-center gap-3">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                    Thêm vào giỏ
                                </button>
                                <button onclick="window.buyNow(${product.id})" class="flex-[1.5] h-20 bg-[#1c69d4] text-white font-black uppercase tracking-widest text-[11px] hover:bg-[#154e9e] shadow-[0_20px_40px_rgba(28,105,212,0.3)] transition-all duration-300 flex items-center justify-center gap-3">
                                    Mua ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Technical Specs & Description Section -->
                <section class="bg-gray-50 py-32 border-t border-gray-100">
                    <div class="max-w-7xl mx-auto px-8">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-20">
                            <!-- Description -->
                            <div class="lg:col-span-7">
                                <div class="mb-12">
                                    <h2 class="text-4xl font-light text-[#262626] uppercase tracking-[-0.03em] mb-4">MÔ TẢ SẢN PHẨM</h2>
                                    <div class="w-12 h-1 bg-[#1c69d4]"></div>
                                </div>
                                <div class="prose prose-lg max-w-none text-[#555555] font-light leading-relaxed">
                                    ${product.description ?
                (product.description.split('\n').map(p => `<p class="mb-6">${p}</p>`).join('')) :
                `<p class="italic">Đang cập nhật nội dung chi tiết cho siêu phẩm này...</p>`
            }
                                </div>
                            </div>
                            
                            <!-- Specifications Table -->
                            <div class="lg:col-span-5">
                                <div class="bg-white p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div class="absolute top-0 right-0 p-8 opacity-5">
                                        <svg class="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                    </div>
                                    <h3 class="text-xl font-black mb-12 text-[#262626] uppercase tracking-[0.1em] border-b-2 border-gray-50 pb-6 italic">THÔNG SỐ KỸ THUẬT</h3>
                                    
                                    <div class="space-y-0 divide-y divide-gray-100 border-t border-gray-100">
                                        <div class="grid grid-cols-2 py-6">
                                            <div class="text-[10px] font-black text-[#757575] uppercase tracking-widest">Dòng máy</div>
                                            <div class="text-[12px] font-bold text-[#262626] uppercase">${product.Category ? product.Category.name : 'Đa năng'}</div>
                                        </div>
                                        <div class="grid grid-cols-2 py-6">
                                            <div class="text-[10px] font-black text-[#757575] uppercase tracking-widest">Thương hiệu</div>
                                            <div class="text-[12px] font-bold text-[#262626] uppercase">${product.Brand ? product.Brand.name : 'TECHNOLOGY'}</div>
                                        </div>
                                        <div class="grid grid-cols-2 py-6">
                                            <div class="text-[10px] font-black text-[#757575] uppercase tracking-widest">Tình trạng</div>
                                            <div class="text-[12px] font-bold text-[#262626] uppercase">${product.condition || 'MỚI NGUYÊN SEAL'}</div>
                                        </div>
                                        <div class="grid grid-cols-2 py-6">
                                            <div class="text-[10px] font-black text-[#757575] uppercase tracking-widest">Bảo hành</div>
                                            <div class="text-[12px] font-bold text-[#262626] uppercase">${product.warranty || '12 THÁNG HÃNG'}</div>
                                        </div>
                                        <div class="grid grid-cols-2 py-6">
                                            <div class="text-[10px] font-black text-[#757575] uppercase tracking-widest">Vận chuyển</div>
                                            <div class="text-[12px] font-bold text-[#1c69d4] uppercase">MIỄN PHÍ TOÀN QUỐC</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Reviews Section -->
                <section class="bg-white py-20 border-t border-gray-100">
                    <div class="max-w-7xl mx-auto px-8">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-20">
                            <!-- Reviews List -->
                            <div class="lg:col-span-7">
                                <h2 class="text-3xl font-light text-[#262626] uppercase tracking-[-0.03em] mb-12">ĐÁNH GIÁ TỪ KHÁCH HÀNG</h2>
                                <div class="space-y-8">
                                    ${this.reviews.length > 0 ? this.reviews.map(r => `
                                        <div class="border-b border-gray-100 pb-8">
                                            <div class="flex items-center gap-4 mb-4">
                                                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-[#262626] uppercase">
                                                    ${r.User?.username?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div class="text-[12px] font-black text-[#262626] uppercase">${r.User?.username || 'Khách hàng'}</div>
                                                    <div class="flex items-center gap-1 mt-1">
                                                        ${this.renderStars(r.rating)}
                                                        <span class="text-[10px] text-gray-400 ml-2">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p class="text-[14px] text-[#555555] font-light leading-relaxed">${r.comment || ''}</p>
                                        </div>
                                    `).join('') : '<p class="text-gray-400 italic">Chưa có đánh giá nào cho sản phẩm này.</p>'}
                                </div>
                            </div>
                            
                            <!-- Write Review -->
                            <div class="lg:col-span-5">
                                <div class="bg-gray-50 p-12">
                                    <h3 class="text-xl font-black mb-8 text-[#262626] uppercase tracking-[0.1em]">VIẾT ĐÁNH GIÁ</h3>
                                    ${api.isLoggedIn() ? `
                                        <form onsubmit="window.submitReview(event)" class="space-y-6">
                                            <div>
                                                <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest mb-3">Chất lượng sản phẩm</label>
                                                <div class="flex gap-2 cursor-pointer">
                                                    ${[1, 2, 3, 4, 5].map(i => `
                                                        <svg id="star-${i}" onclick="window.setRating(${i})" class="w-8 h-8 ${i <= this.userRating ? 'text-yellow-400' : 'text-gray-300'} transition-colors" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest mb-3">Bình luận của bạn</label>
                                                <textarea id="review-comment" required rows="4" class="w-full bg-white border border-gray-200 p-4 text-[13px] text-[#262626] outline-none focus:border-[#1c69d4] transition-colors" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."></textarea>
                                            </div>
                                            <button id="submit-review-btn" type="submit" class="w-full h-14 bg-[#262626] text-white font-black uppercase tracking-widest text-[11px] hover:bg-[#1c69d4] transition-colors">
                                                Gửi đánh giá
                                            </button>
                                        </form>
                                    ` : `
                                        <div class="text-center py-8">
                                            <p class="text-[13px] text-[#757575] mb-6">Bạn cần đăng nhập để gửi đánh giá.</p>
                                            <a href="/?view=login" onclick="window.history.pushState({}, '', '/?view=login'); window.handleLocation(); return false;" class="inline-block px-8 py-4 border-[1.5px] border-[#262626] text-[#262626] font-black uppercase tracking-widest text-[10px] hover:bg-[#262626] hover:text-white transition-all">Đăng nhập ngay</a>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Related Products Section -->
                <section class="max-w-7xl mx-auto px-8 py-32">
                    <div class="flex items-end justify-between mb-16 border-b border-gray-200 pb-8">
                        <div>
                            <h2 class="text-4xl md:text-5xl font-light text-[#262626] uppercase tracking-[-0.03em] leading-none mb-2">SIÊU PHẨM TƯƠNG TỰ</h2>
                            <p class="text-[11px] font-black text-[#757575] uppercase tracking-widest">Khám phá các lựa chọn đẳng cấp khác</p>
                        </div>
                        <a href="/?view=products" onclick="window.history.pushState({}, '', '/?view=products'); window.handleLocation(); return false;" class="text-[11px] font-black uppercase tracking-widest text-[#1c69d4] border-b-2 border-transparent hover:border-[#1c69d4] transition-all pb-1">XEM TẤT CẢ</a>
                    </div>
                    <div id="related-products-grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-[1px] bg-gray-100 border border-gray-100">
                        ${relatedProducts && relatedProducts.length > 0 ? relatedProducts.map(p => ProductCard(p)).join('') : '<p class="text-gray-400 col-span-full py-20 text-center uppercase tracking-widest text-[10px] font-black">Đang tối ưu hóa danh sách liên quan...</p>'}
                    </div>
                </section>
            </div>
        `;
    }
}
