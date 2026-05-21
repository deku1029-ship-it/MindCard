import { api } from "../api.js";

export class CheckoutPage {
  constructor() {
    this.appContent = document.getElementById("app-content");
    this.GUEST_KEY = "guest_cart";
  }

  async show() {
    if (!this.appContent) return;

    // Premium loading state
    this.appContent.innerHTML = `
            <div class="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white">
                <div class="w-12 h-[2px] bg-gray-100 relative overflow-hidden">
                    <div class="absolute inset-0 bg-[#1c69d4] animate-pulse"></div>
                </div>
            </div>
        `;

    let cartData = [];
    try {
      if (api.isLoggedIn()) {
        const data = await api.getCart();
        cartData = (data.items || []).map((item) => ({
          ...item.Product,
          quantity: item.quantity,
          id: item.Product.id,
        }));
      } else {
        const guestCart = JSON.parse(
          localStorage.getItem(this.GUEST_KEY) || "[]",
        );
        for (const item of guestCart) {
          const product = await api._fetch(`/products/${item.product_id}`);
          cartData.push({ ...product, quantity: item.quantity });
        }
      }

      if (cartData.length === 0) {
        this.appContent.innerHTML = this.renderEmpty();
        return;
      }

      const total = cartData.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      this.currentTotal = total;
      this.currentCartItems = cartData;

      this.appContent.innerHTML = this.render(cartData, total);
      this.bindEvents();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Lỗi tải thông tin thanh toán:", error);
      this.appContent.innerHTML = `
                <div class="py-40 text-center bg-white border-t border-gray-100">
                    <h2 class="text-4xl font-light text-[#262626] uppercase mb-4 tracking-[-0.03em]">LỖI TẢI GIỎ HÀNG</h2>
                    <p class="text-[#757575] font-black text-xs uppercase tracking-widest mb-8">VUI LÒNG KIỂM TRA LẠI KẾT NỐI</p>
                    <button onclick="window.history.back()" class="bg-[#262626] text-white px-10 py-4 font-black uppercase tracking-widest hover:bg-[#1c69d4] transition-all">Quay lại</button>
                </div>
            `;
    }
  }

  renderEmpty() {
    return `
            <div class="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-white">
                <div class="w-24 h-24 border border-gray-100 flex items-center justify-center mb-10 text-gray-200">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <h2 class="text-5xl font-light text-[#262626] mb-4 uppercase tracking-[-0.03em]">GIỎ HÀNG TRỐNG</h2>
                <p class="text-[#757575] font-black text-[11px] uppercase tracking-widest mb-12">CHỌN SIÊU PHẨM TRƯỚC KHI THANH TOÁN</p>
                <a href="/" onclick="event.preventDefault(); window.history.pushState({}, '', '/'); window.handleLocation();" class="bg-[#262626] text-white px-12 py-5 font-black uppercase tracking-widest hover:bg-[#1c69d4] transition-all">KHÁM PHÁ NGAY</a>
            </div>
        `;
  }

  render(cartWithData, total) {
    return `
            <div class="bg-white pt-10 pb-40">
                <div class="max-w-7xl mx-auto px-8">
                    <div class="mb-10 border-b border-gray-100 pb-6">
                        <h1 class="text-6xl font-light text-[#262626] uppercase tracking-[-0.03em] leading-none mb-4">THANH TOÁN</h1>
                    </div>

                    <div class="grid grid-cols-1 xl:grid-cols-12 gap-20 items-start">
                        <!-- Left: Customer Info -->
                        <div class="xl:col-span-7 space-y-16">
                            <section>
                                <div class="flex items-center justify-between mb-10 border-b border-[#262626] pb-6">
                                    <h3 class="text-2xl font-light text-[#262626] uppercase tracking-[-0.02em]">THÔNG TIN GIAO HÀNG</h3>
                                    <span class="text-[10px] font-black text-[#1c69d4] uppercase tracking-widest">BƯỚC 01</span>
                                </div>
                                
                                <form id="checkout-form" class="space-y-8">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div class="space-y-3">
                                            <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest">HỌ VÀ TÊN NGƯỜI NHẬN *</label>
                                            <input type="text" id="co-name" required class="w-full bg-white border border-gray-200 px-6 py-4 text-[13px] font-bold focus:border-[#1c69d4] outline-none transition-all placeholder:text-gray-200" placeholder="NGUYỄN VĂN A">
                                        </div>
                                        <div class="space-y-3">
                                            <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest">SỐ ĐIỆN THOẠI LIÊN LẠC *</label>
                                            <input type="tel" id="co-phone" required class="w-full bg-white border border-gray-200 px-6 py-4 text-[13px] font-bold focus:border-[#1c69d4] outline-none transition-all placeholder:text-gray-200" placeholder="0901 234 567">
                                        </div>
                                        <div class="md:col-span-2 space-y-3">
                                            <label class="block text-[10px] font-black text-[#757575] uppercase tracking-widest">ĐỊA CHỈ NHẬN ĐƠN HÀNG *</label>
                                            <textarea id="co-address" required rows="4" class="w-full bg-white border border-gray-200 px-6 py-4 text-[13px] font-bold focus:border-[#1c69d4] outline-none transition-all resize-none placeholder:text-gray-200" placeholder="SỐ NHÀ, TÊN ĐƯỜNG, PHƯỜNG/XÃ, QUẬN/HUYỆN, TỈNH/THÀNH PHỐ..."></textarea>
                                        </div>
                                    </div>
                                </form>
                            </section>

                            <section>
                                <div class="flex items-center justify-between mb-10 border-b border-[#262626] pb-6">
                                    <h3 class="text-2xl font-light text-[#262626] uppercase tracking-[-0.02em]">PHƯƠNG THỨC THANH TOÁN</h3>
                                    <span class="text-[10px] font-black text-[#1c69d4] uppercase tracking-widest">BƯỚC 02</span>
                                </div>
                                
                                <div class="border border-gray-200">
                                    <label class="relative flex items-center p-8 bg-white cursor-pointer group">
                                        <input type="radio" name="payment" value="cod" checked class="hidden peer">
                                        <div class="w-5 h-5 border border-gray-200 mr-6 flex items-center justify-center peer-checked:border-[#1c69d4] peer-checked:bg-[#1c69d4] transition-all">
                                            <div class="w-2 h-2 bg-white scale-0 peer-checked:scale-100 transition-transform"></div>
                                        </div>
                                        <div class="font-black text-[#262626] uppercase text-[11px] tracking-widest peer-checked:text-[#1c69d4] transition-colors">COD - THANH TOÁN KHI NHẬN HÀNG</div>
                                    </label>
                            </section>
                        </div>

                        <!-- Right: Summary Card -->
                        <div class="xl:col-span-5 sticky top-32">
                            <section class="bg-[#262626] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
                                <div class="flex justify-between items-baseline mb-12 border-b border-white/10 pb-8">
                                    <h3 class="text-2xl font-light text-white uppercase tracking-tight">TÓM TẮT ĐƠN HÀNG</h3>
                                    <span class="text-[10px] font-black text-[#1c69d4] tracking-widest uppercase">TỔNG: ${cartWithData.length} SẢN PHẨM</span>
                                </div>
                                
                                <div class="space-y-8 max-h-[40vh] overflow-y-auto custom-scrollbar-dark pr-6">
                                    ${cartWithData
                                      .map(
                                        (item) => `
                                        <div class="flex gap-6 group">
                                            <div class="w-20 h-20 bg-white flex-shrink-0 p-3">
                                                <img src="${item.image_url}" alt="${item.name}" class="w-full h-full object-contain">
                                            </div>
                                            <div class="flex-1 flex flex-col justify-center gap-2">
                                                <div class="font-bold text-white text-[11px] uppercase tracking-tight line-clamp-1 group-hover:text-[#1c69d4] transition-colors">${item.name}</div>
                                                <div class="flex justify-between items-baseline">
                                                    <span class="text-[10px] font-black text-white/30 tracking-widest">X${item.quantity}</span>
                                                    <span class="text-[#1c69d4] font-black text-[13px] tracking-widest">${new Intl.NumberFormat("vi-VN").format(Math.round(item.price * item.quantity))}₫</span>
                                                </div>
                                            </div>
                                        </div>
                                    `,
                                      )
                                      .join("")}
                                </div>

                                <div class="mt-12 space-y-5 pt-10 border-t border-white/10">
                                    <div class="flex justify-between text-white/30 font-black text-[10px] tracking-widest uppercase">
                                        <span>TỔNG ĐƠN HÀNG</span>
                                        <span>${new Intl.NumberFormat("vi-VN").format(Math.round(total))}₫</span>
                                    </div>
                                    <div class="flex justify-between text-white/30 font-black text-[10px] tracking-widest uppercase">
                                        <span>PHÍ VẬN CHUYỂN</span>
                                        <span class="text-[#00ff00]">MIỄN PHÍ</span>
                                    </div>
                                    <div class="flex justify-between items-center pt-8 border-t border-white/5">
                                        <span class="text-xl font-light text-white uppercase tracking-widest">TỔNG CỘNG</span>
                                        <span class="text-3xl font-black text-white tracking-widest">${new Intl.NumberFormat("vi-VN").format(Math.round(total))}₫</span>
                                    </div>
                                </div>

                                <button id="place-order-btn" class="w-full h-20 bg-[#1c69d4] hover:bg-[#154e9e] text-white font-black uppercase tracking-widest text-[11px] transition-all duration-300 shadow-[0_20px_40px_rgba(28,105,212,0.3)] mt-12 flex items-center justify-center gap-4">
                                    XÁC NHẬN ĐẶT HÀNG
                                    <svg class="w-5 h-5 shadow-inner" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </button>
                                
                                <p class="text-center text-[8px] font-black text-white/20 mt-8 uppercase tracking-[0.4em]">AUTHENTICITY & PRECISION GUARANTEED</p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  bindEvents() {
    document
      .getElementById("place-order-btn")
      ?.addEventListener("click", () => this.placeOrder());
  }

  async placeOrder() {
    const nameInput = document.getElementById("co-name");
    const phoneInput = document.getElementById("co-phone");
    const addressInput = document.getElementById("co-address");

    if (!nameInput.value || !phoneInput.value || !addressInput.value) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng!");
      return;
    }

    const payload = {
      customer_name: nameInput.value,
      customer_phone: phoneInput.value,
      shipping_address: addressInput.value,
      total_price: this.currentTotal,
      items: this.currentCartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const btn = document.getElementById("place-order-btn");
      btn.disabled = true;
      btn.innerHTML =
        '<span class="flex items-center gap-4 uppercase tracking-widest"><div class="w-4 h-4 border-2 border-white/30 border-t-white animate-spin"></div> ĐANG XỬ LÝ...</span>';

      await api._fetch("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Clear correct cart
      if (api.isLoggedIn()) {
        await api._fetch("/cart", { method: "DELETE" }).catch(() => {});
      } else {
        localStorage.removeItem(this.GUEST_KEY);
      }

      if (window.cartController) window.cartController.loadBadge();

      this.appContent.innerHTML = this.renderSuccess();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert("Lỗi đặt hàng: " + e.message);
      const btn = document.getElementById("place-order-btn");
      btn.disabled = false;
      btn.innerHTML = "XÁC NHẬN ĐẶT HÀNG";
    }
  }

  renderSuccess() {
    return `
            <div class="min-h-[90vh] flex flex-col items-center justify-center p-8 bg-white">
                <div class="w-32 h-32 border-[#00ff00] border flex items-center justify-center mb-12 text-[#00ff00] shadow-[0_20px_60px_rgba(0,255,0,0.1)]">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 class="text-6xl font-light text-[#262626] mb-6 uppercase tracking-[-0.03em] text-center">ĐẶT HÀNG THÀNH CÔNG</h2>
                <p class="text-[#757575] font-black text-[11px] uppercase tracking-widest text-center max-w-lg leading-loose mb-16">CHÚNG TÔI ĐÃ TIẾP NHẬN YÊU CẦU CỦA BẠN. ĐỘI NGŨ CHUYÊN GIA SẼ LIÊN HỆ XÁC NHẬN TRONG GIÂY LÁT.</p>
                <div class="flex gap-4 flex-wrap justify-center font-black text-[11px] uppercase tracking-widest">
                    <a href="/" onclick="event.preventDefault(); window.history.pushState({}, '', '/'); window.handleLocation();" 
                       class="bg-white border border-[#262626] text-[#262626] px-16 py-6 hover:bg-[#262626] hover:text-white transition-all">Trang chủ</a>
                    <a href="/orders" onclick="event.preventDefault(); window.history.pushState({}, '', '/orders'); window.handleLocation();" 
                       class="bg-[#262626] text-white px-16 py-6 hover:bg-[#1c69d4] transition-all">Xem đơn hàng của tôi</a>
                </div>
            </div>
        `;
  }
}
