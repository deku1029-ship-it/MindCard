import { api } from "../api.js";
import { ProductCard } from "../components/productCard.js";

export class HomePage {
  constructor() {
    this.appContent = document.getElementById("app-content");
    this.currentSlide = 0;
    this.sliderInterval = null;
    this.flashTimer = null;
  }

  render() {
    return `
            <div id="home-content" class="bg-white">
                <!-- BMW Showroom Hero Slider -->
                <section class="reveal relative h-[60vh] md:h-[80vh] overflow-hidden bg-black">
                    <div id="hero-slider" class="relative h-full w-full">
                        
                        <!-- Slide 1: Ultimate Technology -->
                        <div class="hero-slide absolute inset-0 transition-opacity duration-1000 opacity-100">
                            <div class="absolute inset-0 bg-black/40 z-10"></div>
                            <img src="/assets/ecommerce_banner_1.png" class="w-full h-full object-cover brightness-75 transition-transform duration-[10s] scale-100" id="hero-img-0">
                            <div class="absolute inset-0 z-20 flex items-center">
                                <div class="max-w-7xl mx-auto px-8 md:px-16 w-full">
                                    <div class="max-w-2xl space-y-6">
                                        <h1 class="text-4xl md:text-7xl font-light text-white uppercase tracking-[-0.04em] leading-[0.9] reveal-item">
                                            TRẢI NGHIỆM <br/> 
                                            <span class="font-black text-[#1c69d4]">SỨC MẠNH CÔNG NGHỆ</span>
                                        </h1>
                                        <p class="text-white/80 font-normal text-sm md:text-lg max-w-md leading-relaxed reveal-item" style="transition-delay: 200ms;">
                                            Khám phá hệ sinh thái sản phẩm được chọn lọc với tiêu chuẩn khắt khe, mang lại trải nghiệm đỉnh cao cho cuộc sống hiện đại.
                                        </p>
                                        <div class="flex gap-4 pt-4 reveal-item" style="transition-delay: 400ms;">
                                            <button onclick="window.history.pushState({}, '', '/?view=products'); window.handleLocation();" 
                                                    class="px-10 py-4 bg-[#1c69d4] text-white font-black text-[12px] uppercase tracking-widest hover:brightness-110 shadow-none transition-all">
                                                KHÁM PHÁ NGAY
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Slide 2: Digital Luxury -->
                        <div class="hero-slide absolute inset-0 transition-opacity duration-1000 opacity-0 pointer-events-none">
                            <div class="absolute inset-0 bg-black/40 z-10"></div>
                            <img src="/assets/ecommerce_banner_2.png" class="w-full h-full object-cover brightness-75 scale-110" id="hero-img-1">
                            <div class="absolute inset-0 z-20 flex items-center">
                                <div class="max-w-7xl mx-auto px-8 md:px-16 w-full">
                                    <div class="max-w-2xl space-y-6">
                                        <h2 class="text-4xl md:text-7xl font-light text-white uppercase tracking-[-0.04em] leading-[0.9]">
                                            ĐẲNG CẤP <br/>
                                            <span class="font-black">SỐ HÓA HOÀN HẢO</span>
                                        </h2>
                                        <p class="text-white/80 font-normal text-sm md:text-lg max-w-md">
                                            Nâng tầm không gian làm việc và giải trí với những thiết bị công nghệ hàng đầu thế giới.
                                        </p>
                                        <div class="flex gap-4 pt-4">
                                            <button onclick="window.history.pushState({}, '', '/?view=products&on_sale=true'); window.handleLocation();" 
                                                    class="px-10 py-4 border border-white text-white font-black text-[12px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                                TÌM HIỂU THÊM
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Precision Indicators -->
                        <div class="absolute bottom-12 right-12 flex items-center gap-6 z-30">
                            <span id="slider-counter" class="text-white font-black text-sm tracking-widest">01 / 02</span>
                            <div class="flex gap-2">
                                <button onclick="window.homePage.goToSlide(0)" class="slider-dot w-12 h-0.5 bg-white transition-all opacity-100"></button>
                                <button onclick="window.homePage.goToSlide(1)" class="slider-dot w-6 h-0.5 bg-white transition-all opacity-40 hover:opacity-100"></button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Showroom Divider: Precision Benefits -->
                <section class="bg-[#262626] py-12 border-b border-white/10">
                    <div class="max-w-7xl mx-auto px-8">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div class="space-y-2 border-l border-white/20 pl-6">
                                <span class="text-[#1c69d4] font-black text-xs uppercase tracking-widest">Giao Hàng</span>
                                <h4 class="text-white font-light text-xl uppercase leading-none">Miễn Phí</h4>
                                <p class="text-[#757575] text-[11px] font-bold uppercase tracking-tight">Trên Toàn Quốc</p>
                            </div>
                            <div class="space-y-2 border-l border-white/20 pl-6 text-[#1c69d4]">
                                <span class="text-[#1c69d4] font-black text-xs uppercase tracking-widest">Bảo Hành</span>
                                <h4 class="text-white font-light text-xl uppercase leading-none">Chính hãng</h4>
                                <p class="text-[#757575] text-[11px] font-bold uppercase tracking-tight">Lên đến 24 tháng</p>
                            </div>
                            <div class="space-y-2 border-l border-white/20 pl-6">
                                <span class="text-[#1c69d4] font-black text-xs uppercase tracking-widest">Hỗ Trợ</span>
                                <h4 class="text-white font-light text-xl uppercase leading-none">Chuyên gia</h4>
                                <p class="text-[#757575] text-[11px] font-bold uppercase tracking-tight">Tư vấn 24/7</p>
                            </div>
                            <div class="space-y-2 border-l border-white/20 pl-6">
                                <span class="text-[#1c69d4] font-black text-xs uppercase tracking-widest">Đổi Trả</span>
                                <h4 class="text-white font-light text-xl uppercase leading-none">1-đổi-1</h4>
                                <p class="text-[#757575] text-[11px] font-bold uppercase tracking-tight">Trong vòng 30 ngày</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Flash Sale Segment: High Speed Deals -->
                <section class="showroom-light py-20 reveal overflow-hidden">
                    <div class="max-w-7xl mx-auto px-8">
                        <div class="flex flex-col md:flex-row items-baseline gap-8 mb-12">
                            <h2 class="text-5xl md:text-8xl font-black text-[#262626] uppercase -tracking-[0.05em] leading-[0.8]">
                                ƯU ĐÃI <br/> <span class="font-light">ĐỘT PHÁ</span>
                            </h2>
                            <div class="flex items-center gap-4 text-[#262626]">
                                <span class="font-black text-xs uppercase tracking-widest">Thời gian còn lại:</span>
                                <div class="flex gap-2 font-black text-2xl tracking-tighter">
                                    <span id="flash-hours" class="w-12 text-center">00</span>
                                    <span>:</span>
                                    <span id="flash-minutes" class="w-12 text-center">00</span>
                                    <span>:</span>
                                    <span id="flash-seconds" class="w-12 text-center">00</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="flash-sale-grid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
                            <!-- Flash sale products will be injected -->
                        </div>

                        <div class="flex justify-end border-t border-gray-200 mt-8 pt-8">
                            <button onclick="window.history.pushState({}, '', '/?view=products&on_sale=true'); window.handleLocation();" 
                                    class="group flex items-center gap-4 text-[#1c69d4] font-black text-sm uppercase tracking-widest">
                                Xem tất cả các ưu đãi 
                                <span class="w-10 h-[1px] bg-[#1c69d4] transition-all group-hover:w-16"></span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Showroom Grid: Popular Categories -->
                <section class="showroom-dark py-24 bg-[#262626] reveal">
                    <div class="max-w-7xl mx-auto px-8">
                        <div class="mb-16">
                            <h2 class="text-4xl md:text-6xl font-light text-white uppercase tracking-[-0.03em] leading-none mb-4">
                                DANH MỤC <br/> <span class="font-black">CHỌN LỌC</span>
                            </h2>
                        </div>
                        <div id="category-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[1px] bg-white/10 border border-white/10">
                            <!-- Injected categories as sharp tiles -->
                        </div>
                    </div>
                </section>

                <!-- Recommendation Showroom -->
                <section class="showroom-light py-24 reveal">
                    <div class="max-w-7xl mx-auto px-8">
                        <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div>
                                <h2 class="text-4xl md:text-6xl font-black text-[#262626] uppercase tracking-[-0.03em] leading-[1.02] mb-6">
                                    <span class="block">GỢI Ý</span>
                                    <span class="block font-light mt-1 md:mt-2">DÀNH CHO BẠN</span>
                                </h2>
                                <p class="text-[#757575] font-bold text-xs uppercase tracking-widest mt-4">Đề xuất dựa trên sở thích của bạn</p>
                            </div>
                        </div>
                        <div id="ai-recommended-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            <!-- Product Cards will be injected -->
                        </div>
                    </div>
                </section>

                <!-- Featured Category Sections -->
                <div id="featured-collections" class="space-y-24 pb-24">
                    <!-- Dynamic Sections -->
                    <section class="max-w-7xl mx-auto px-8 reveal">
                         <div class="flex items-center justify-between mb-12 border-b border-gray-200 pb-6">
                            <h2 class="text-2xl font-black text-[#262626] uppercase tracking-wider">THẾ GIỚI DI ĐỘNG</h2>
                            <button onclick="window.homePage.filterByCategory(2)" class="text-[11px] font-black text-[#1c69d4] uppercase tracking-widest hover:underline">Xem Tất Cả</button>
                        </div>
                        <div id="phones-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"></div>
                    </section>

                    <section class="bg-[#f6f6f6] py-24 reveal">
                        <div class="max-w-7xl mx-auto px-8">
                             <div class="flex items-center justify-between mb-12 border-b border-gray-200 pb-6">
                                <h2 class="text-2xl font-black text-[#262626] uppercase tracking-wider">SỨC KHỎE & LÀM ĐẸP</h2>
                                <button onclick="window.homePage.filterByCategory(6)" class="text-[11px] font-black text-[#1c69d4] uppercase tracking-widest hover:underline">Xem Tất Cả</button>
                            </div>
                            <div id="skincare-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"></div>
                        </div>
                    </section>

                    <section class="max-w-7xl mx-auto px-8 reveal">
                         <div class="flex items-center justify-between mb-12 border-b border-gray-200 pb-6">
                            <h2 class="text-2xl font-black text-[#262626] uppercase tracking-wider">THIẾT BỊ GIA DỤNG</h2>
                            <button onclick="window.homePage.filterByCategory(14)" class="text-[11px] font-black text-[#1c69d4] uppercase tracking-widest hover:underline">Xem Tất Cả</button>
                        </div>
                        <div id="appliances-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"></div>
                    </section>
                </div>
            </div>
        `;
  }

  async show() {
    if (!this.appContent) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.appContent.innerHTML = this.render();

    this.gridContainer = document.getElementById("ai-recommended-grid");
    this.categoryContainer = document.getElementById("category-grid");

    window.filterByCategory = this.filterByCategory.bind(this);

    await Promise.all([
      this.loadProducts(),
      this.loadCategories(),
      this.loadFlashSaleProducts(),
      this.loadCategoryProducts(2, "phones-grid"),
      this.loadCategoryProducts(6, "skincare-grid"),
      this.loadCategoryProducts(14, "appliances-grid"),
    ]);

    this.initScrollReveal();
    this.startHeroSlider();
    this.startFlashSaleTimer();
  }

  startFlashSaleTimer() {
    if (this.flashTimer) clearInterval(this.flashTimer);
    const updateTimer = () => {
      const now = new Date();
      const secondsPassedInDay =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const cycleSeconds = 2 * 3600;
      const remainingSeconds =
        cycleSeconds - (secondsPassedInDay % cycleSeconds);

      const h = Math.floor(remainingSeconds / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const s = Math.floor(remainingSeconds % 60);

      const parts = {
        "flash-hours": h,
        "flash-minutes": m,
        "flash-seconds": s,
      };

      Object.entries(parts).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val.toString().padStart(2, "0");
      });

      if (!document.getElementById("flash-hours"))
        clearInterval(this.flashTimer);
    };
    updateTimer();
    this.flashTimer = setInterval(updateTimer, 1000);
  }

  startHeroSlider() {
    if (this.sliderInterval) clearInterval(this.sliderInterval);
    this.sliderInterval = setInterval(() => {
      this.goToSlide((this.currentSlide + 1) % 2);
    }, 8000);
  }

  goToSlide(index) {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".slider-dot");
    const counter = document.getElementById("slider-counter");
    const imgs = [
      document.getElementById("hero-img-0"),
      document.getElementById("hero-img-1"),
    ];

    if (!slides.length) return;

    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.remove("opacity-0", "pointer-events-none");
        slide.classList.add("opacity-100");
        if (imgs[i]) imgs[i].style.transform = "scale(1)";
      } else {
        slide.classList.add("opacity-0", "pointer-events-none");
        slide.classList.remove("opacity-100");
        if (imgs[i]) imgs[i].style.transform = "scale(1.1)";
      }
    });

    dots.forEach((dot, i) => {
      if (i === index) dot.classList.replace("opacity-40", "opacity-100");
      else dot.classList.replace("opacity-100", "opacity-40");
    });

    if (counter) counter.textContent = `0${index + 1} / 02`;
    this.currentSlide = index;
  }

  initScrollReveal() {
    if (!this.revealObserver) {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      };
      this.revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            this.revealObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);
    }
    // Observe all .reveal elements that aren't already active
    document
      .querySelectorAll(".reveal:not(.active)")
      .forEach((el) => this.revealObserver.observe(el));
  }

  async filterByCategory(categoryId) {
    window.history.pushState(
      {},
      "",
      `/?view=products&category_id=${categoryId}`,
    );
    window.handleLocation();
  }

  renderProductList(products, container) {
    if (!container) return;
    container.innerHTML = "";
    if (products && products.length > 0) {
      products.forEach((product) => {
        container.innerHTML += ProductCard(product);
      });
      // Update reveal observer for newly added items
      this.initScrollReveal();
    } else {
      container.innerHTML =
        '<div class="col-span-full py-20 flex justify-center text-[#757575] font-bold text-xs uppercase tracking-widest">Không có dữ liệu hiển thị</div>';
    }
  }

  async loadProducts() {
    try {
      // Request API với limit=12
      const data = await api.getRecommendations({ _t: Date.now(), limit: 12 });
      if (data && data.products) {
        this.renderProductList(data.products, this.gridContainer);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  }

  async loadFlashSaleProducts() {
    const container = document.getElementById("flash-sale-grid");
    if (!container) return;
    try {
      // Lấy sản phẩm đang giảm giá
      const data = await api.getProducts({ on_sale: "true", limit: 5 });
      this.renderProductList(data.products, container);
    } catch (error) {
      console.error("Error loading flash sale:", error);
    }
  }

  getCategoryIcon(name) {
    const n = name.toLowerCase();
    const icons = {
      "âm thanh":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>',
      "chăm sóc da":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.638.319a4 4 0 01-1.833.435H6.5C4.567 16 3 14.433 3 12.5S4.567 9 6.5 9H9a4 4 0 011.833.435l.638.319a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l3.361-3.361A2.25 2.25 0 0121 7.25v9.5c0 .61-.242 1.163-.639 1.561l-3.361-3.361z"></path></svg>',
      "dụng cụ nhà bếp":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>',
      "giày dép":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>',
      laptop:
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>',
      "nhà cửa & đời sống":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>',
      "nước hoa":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>',
      "phụ kiện":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      "quần áo":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"></path></svg>',
      "sắc đẹp & sức khỏe":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>',
      "thiết bị gia dụng":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
      "thời trang & lifestyle":
        '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"></path></svg>',
    };

    const key = Object.keys(icons).find((k) => n.includes(k));
    return icons[key] || icons["thiết bị gia dụng"]; // Default to bolt if no match
  }

  async loadCategories() {
    if (!this.categoryContainer) return;
    try {
      const allCategories = await api.getCategories();
      if (allCategories && allCategories.length > 0) {
        // 1. Lọc các danh mục được phép hiển thị ở trang chủ
        const featured = allCategories.filter((cat) => !!cat.show_on_home);

        // 2. Giới hạn hiển thị (tối đa 12)
        const displayList = featured.slice(0, 12);

        this.categoryContainer.innerHTML = displayList
          .map((cat, index) => {
            const isImageUrl =
              cat.icon &&
              (cat.icon.startsWith("/") || cat.icon.startsWith("http"));
            const iconContent = isImageUrl
              ? `<div class="w-28 h-28 overflow-hidden rounded-sm border border-white/10">
                             <img src="${cat.icon}" class="w-full h-full object-cover" alt="${cat.name}">
                           </div>`
              : `<div class="w-20 h-20 flex items-center justify-center text-white/40 group-hover:text-[#1c69d4] transition-colors transition-transform group-hover:scale-110">
                             ${cat.icon || this.getCategoryIcon(cat.name)}
                           </div>`;

            return `
                        <div class="group bg-[#262626] flex flex-col items-center justify-center p-6 aspect-square cursor-pointer border border-white/5 hover:bg-[#333333] transition-all relative overflow-hidden" 
                             onclick="window.homePage.filterByCategory(${cat.id})">
                            <div class="mb-4">
                                ${iconContent}
                            </div>
                            <span class="text-[12px] font-black text-white uppercase tracking-widest text-center group-hover:translate-y-1 transition-transform z-10">${cat.name}</span>
                            <div class="absolute inset-x-0 bottom-0 h-1 bg-[#1c69d4] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </div>
                    `;
          })
          .join("");
      } else {
        this.categoryContainer.innerHTML =
          '<p class="text-white/20 text-xs uppercase tracking-widest col-span-full text-center py-10">Không có danh mục hiển thị</p>';
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      this.categoryContainer.innerHTML =
        '<p class="text-red-400 text-xs col-span-full text-center py-10">Lỗi tải danh mục</p>';
    }
  }

  async loadCategoryProducts(categoryId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const data = await api.getProducts({
        category_id: categoryId,
        limit: 10,
      });
      this.renderProductList(data.products, container);
    } catch (error) {
      console.error(`Lỗi tải sp danh mục ${categoryId}:`, error);
    }
  }
}
