import { api } from "../api.js";
import { ProductCard } from "../components/productCard.js";

export class SearchController {
  constructor() {
    this.appContent = document.getElementById("app-content");
    this.searchTimer = null;
    this.currentQuery = "";
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.onSale = false;

    this.currentPage = 1;
    this.isLoading = false;

    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    this.searchInput = document.getElementById("main-search-input");
    if (this.searchInput) {
      this.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const value = e.target.value.trim();
          if (value) {
            this.currentQuery = value;
            this.syncURL();
            if (window.handleLocation) window.handleLocation();
          }
        }
      });

      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          this.searchInput.focus();
        }
      });
    }
  }

  render() {
    return `
            <section id="search-results-section" class="bg-white min-h-[60vh] pt-28 pb-24">
                <div class="max-w-7xl mx-auto px-8">
                    <div class="flex flex-col md:flex-row gap-16">
                        <!-- Sidebar Filters -->
                        <aside class="w-full md:w-72 flex-shrink-0">
                            <div class="sticky top-32 space-y-12">
                                <div class="pb-6 border-b border-[#262626]">
                                    <h2 class="text-3xl font-light text-[#262626] uppercase tracking-[-0.03em] leading-none">BỘ LỌC <br/><span class="font-black text-sm tracking-widest text-[#757575]">PRECISION TOOLS</span></h2>
                                </div>

                                <!-- Categories -->
                                <div class="space-y-4">
                                    <h3 class="text-[11px] font-black text-[#262626] uppercase tracking-widest">Danh mục</h3>
                                    <div id="filter-categories" class="flex flex-col gap-[2px] max-h-80 overflow-y-auto pr-4 custom-scrollbar"></div>
                                </div>

                                <!-- Brands -->
                                <div class="space-y-4">
                                    <h3 class="text-[11px] font-black text-[#262626] uppercase tracking-widest text-[#757575]">Thương hiệu</h3>
                                    <div id="filter-brands" class="flex flex-col gap-[2px] max-h-80 overflow-y-auto pr-4 custom-scrollbar"></div>
                                </div>

                                <!-- Price Range -->
                                <div class="space-y-6 pt-4 border-t border-gray-100">
                                    <h3 class="text-[11px] font-black text-[#262626] uppercase tracking-widest">Khoảng giá</h3>
                                    <div class="grid grid-cols-2 gap-[1px] bg-gray-200 border border-gray-200">
                                        <input type="number" id="min-price" placeholder="TỪ" class="bg-white px-4 py-3 text-[12px] font-bold outline-none focus:bg-gray-50 text-[#262626]" />
                                        <input type="number" id="max-price" placeholder="ĐẾN" class="bg-white px-4 py-3 text-[12px] font-bold outline-none focus:bg-gray-50 text-[#262626]" />
                                    </div>
                                    <button id="apply-filters-btn" class="w-full py-4 bg-[#262626] text-white text-[12px] font-black uppercase tracking-widest hover:bg-[#1c69d4] transition-all">LỌC KẾT QUẢ</button>
                                </div>

                                <!-- Sort -->
                                <div class="space-y-4">
                                    <h3 class="text-[11px] font-black text-[#262626] uppercase tracking-widest">Sắp xếp</h3>
                                    <div class="relative">
                                        <select id="sort-select" class="w-full bg-white border border-gray-200 px-4 py-3 text-[12px] font-bold outline-none appearance-none cursor-pointer focus:border-[#1c69d4]">
                                            <option value="newest">MỚI NHẤT</option>
                                            <option value="popular">BÁN CHẠY</option>
                                            <option value="price_asc">GIÁ TĂNG DẦN</option>
                                            <option value="price_desc">GIÁ GIẢM DẦN</option>
                                        </select>
                                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg class="w-3 h-3 text-[#757575]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <!-- Results Grid -->
                        <div class="flex-1">
                            <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h2 id="search-title" class="text-4xl md:text-5xl font-light text-[#262626] uppercase tracking-[-0.03em] leading-none mb-2">LOADING...</h2>
                                    <p id="search-stats" class="text-[11px] font-black text-[#757575] uppercase tracking-widest">Đang tải dữ liệu tinh hoa</p>
                                </div>
                            </div>
                            
                            <div id="search-grid" class="grid grid-cols-2 lg:grid-cols-3 gap-[1px] bg-gray-100 border border-gray-100"></div>
                            
                            <!-- Pagination Controls -->
                            <div id="search-pagination-container" class="mt-16 flex justify-center items-center gap-2 flex-wrap"></div>
                            
                            <!-- Loading Indicator -->
                            <div id="infinite-loading" class="py-20 flex flex-col items-center justify-center gap-4 opacity-0 transition-opacity">
                                <div class="w-12 h-[2px] bg-gray-200 relative overflow-hidden">
                                    <div class="absolute inset-0 bg-[#1c69d4] animate-loading-bar"></div>
                                </div>
                                <span class="text-[11px] font-black text-[#757575] uppercase tracking-widest">Đang tối ưu hóa kết quả</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
  }

  async init() {
    this.resultsGrid = document.getElementById("search-grid");
    this.searchTitle = document.getElementById("search-title");
    this.searchStats = document.getElementById("search-stats");
    this.filterCategoriesContainer =
      document.getElementById("filter-categories");
    this.filterBrandsContainer = document.getElementById("filter-brands");
    this.minPriceInput = document.getElementById("min-price");
    this.maxPriceInput = document.getElementById("max-price");
    this.sortSelect = document.getElementById("sort-select");
    this.applyFiltersBtn = document.getElementById("apply-filters-btn");
    this.paginationContainer = document.getElementById(
      "search-pagination-container",
    );
    this.infiniteLoader = document.getElementById("infinite-loading");

    if (this.applyFiltersBtn) {
      this.applyFiltersBtn.addEventListener("click", () => {
        this.currentPage = 1;
        this.performSearch();
        this.syncURL();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", () => {
        this.currentPage = 1;
        this.performSearch();
        this.syncURL();
      });
    }

    await Promise.all([this.loadFilterCategories(), this.loadFilterBrands()]);

    this.syncFilterUI();
  }

  syncURL() {
    const url = new URL(window.location.origin + "/");
    if (this.currentQuery) url.searchParams.set("q", this.currentQuery);
    if (this.selectedCategory)
      url.searchParams.set("category_id", this.selectedCategory);
    if (this.selectedBrand)
      url.searchParams.set("brand_id", this.selectedBrand);
    if (this.minPriceInput?.value)
      url.searchParams.set("min_price", this.minPriceInput.value);
    if (this.maxPriceInput?.value)
      url.searchParams.set("max_price", this.maxPriceInput.value);
    if (this.sortSelect?.value && this.sortSelect.value !== "newest")
      url.searchParams.set("sort", this.sortSelect.value);
    if (this.onSale) url.searchParams.set("on_sale", "true");

    if (!this.currentQuery && !this.onSale) {
      url.searchParams.set("view", "products");
    }

    window.history.pushState({}, "", url.toString());
  }

  loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    this.currentQuery = params.get("q") || "";
    this.selectedCategory = params.get("category_id");
    this.selectedBrand = params.get("brand_id");
    this.onSale = params.get("on_sale") === "true";

    if (
      this.currentQuery ||
      params.get("view") === "products" ||
      this.selectedCategory ||
      this.selectedBrand ||
      this.onSale
    ) {
      if (this.searchInput) this.searchInput.value = this.currentQuery;
      this.showSearch();
    }
  }

  async showSearch() {
    if (!this.appContent) return;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const params = new URLSearchParams(window.location.search);
    this.currentQuery = params.get("q") || "";
    this.selectedCategory = params.get("category_id");
    this.selectedBrand = params.get("brand_id");
    this.onSale = params.get("on_sale") === "true";
    if (this.searchInput) this.searchInput.value = this.currentQuery;

    this.appContent.innerHTML = this.render();
    await this.init();
    this.performSearch();

    if (params.get("min_price"))
      this.minPriceInput.value = params.get("min_price");
    if (params.get("max_price"))
      this.maxPriceInput.value = params.get("max_price");
    if (params.get("sort")) this.sortSelect.value = params.get("sort");

    this.syncFilterUI();
  }

  renderTree(items, container, namePrefix, level = 0) {
    let html = "";
    items.forEach((item) => {
      const indent = level * 12;
      const hasChildren = item.children && item.children.length > 0;

      html += `
                <div class="tree-item-group" data-id="${item.id}">
                    <div class="flex items-center gap-2 group hover:bg-[#1c69d4]/5 pr-4" style="padding-left: ${indent}px">
                        <label class="flex items-center gap-4 cursor-pointer flex-1 py-3">
                            <input type="radio" name="${namePrefix}-filter" value="${item.id}" class="hidden peer">
                            <div class="w-1 h-4 bg-transparent peer-checked:bg-[#1c69d4] transition-all"></div>
                            <span class="text-[12px] font-bold text-[#262626] uppercase tracking-wider peer-checked:text-[#1c69d4] transition-colors">${item.name}</span>
                        </label>
                        ${
                          hasChildren
                            ? `
                            <button class="tree-toggle-icon text-[#757575] hover:text-[#262626]" onclick="window.searchController.toggleBranch(this, ${item.id})">
                                <svg class="w-3 h-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                        `
                            : ""
                        }
                    </div>
                    
                    ${
                      hasChildren
                        ? `
                        <div class="tree-children-wrapper hidden overflow-hidden border-l border-gray-100 ml-1" id="children-${namePrefix}-${item.id}">
                            ${this.renderTree(item.children, null, namePrefix, level + 1)}
                        </div>
                    `
                        : ""
                    }
                </div>
            `;
    });
    if (container) container.innerHTML = html;
    return html;
  }

  toggleBranch(btn, id) {
    const wrapper = btn
      .closest(".tree-item-group")
      .querySelector(".tree-children-wrapper");
    if (wrapper) {
      const isHidden = wrapper.classList.toggle("hidden");
      btn.classList.toggle("rotate-180", !isHidden);
    }
  }

  async loadFilterCategories() {
    try {
      const categories = await api.getCategories(true);
      this.filterCategoriesContainer.innerHTML =
        `
                <label class="flex items-center gap-4 cursor-pointer group hover:bg-[#1c69d4]/5 pr-4">
                    <input type="radio" name="category-filter" value="" class="hidden peer" checked>
                    <div class="w-1 h-4 bg-transparent peer-checked:bg-[#1c69d4] transition-all"></div>
                    <span class="text-[12px] font-black uppercase text-[#757575] peer-checked:text-[#1c69d4] transition-colors tracking-widest py-3">Tất cả sản phẩm</span>
                </label>
            ` + this.renderTree(categories, null, "category");

      this.filterCategoriesContainer
        .querySelectorAll("input")
        .forEach((input) => {
          input.addEventListener("change", (e) => {
            this.selectedCategory = e.target.value;
            this.currentQuery = "";
            this.searchInput.value = "";
            this.currentPage = 1;
            this.performSearch();
            this.syncURL();
          });
        });
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    }
  }

  async loadFilterBrands() {
    try {
      const brands = await api.getBrands(true);
      this.filterBrandsContainer.innerHTML =
        `
                <label class="flex items-center gap-4 cursor-pointer group hover:bg-[#1c69d4]/5 pr-4">
                    <input type="radio" name="brand-filter" value="" class="hidden peer" checked>
                    <div class="w-1 h-4 bg-transparent peer-checked:bg-[#1c69d4] transition-all"></div>
                    <span class="text-[12px] font-black uppercase text-[#757575] peer-checked:text-[#1c69d4] transition-colors tracking-widest py-3">Tất cả thương hiệu</span>
                </label>
            ` + this.renderTree(brands, null, "brand");

      this.filterBrandsContainer.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", (e) => {
          this.selectedBrand = e.target.value;
          this.currentQuery = "";
          this.searchInput.value = "";
          this.currentPage = 1;
          this.performSearch();
          this.syncURL();
        });
      });
    } catch (err) {
      console.error("Lỗi tải thương hiệu:", err);
    }
  }

  async performSearch() {
    if (this.isLoading) return;

    this.resultsGrid.innerHTML = `
                <div class="col-span-full py-32 flex flex-col items-center justify-center gap-6">
                    <div class="w-16 h-16 border-2 border-gray-100 border-t-[#1c69d4] animate-spin"></div>
                    <p class="text-[#757575] font-black text-[11px] uppercase tracking-widest">Đang tối ưu hóa tinh hoa</p>
                </div>
            `;
    if (this.paginationContainer) {
      this.paginationContainer.innerHTML = "";
    }

    this.isLoading = true;
    if (this.infiniteLoader) this.infiniteLoader.classList.add("opacity-100");

    if (this.onSale) {
      this.searchTitle.textContent = "ƯU ĐÃI ĐỘT PHÁ";
    } else if (this.currentQuery) {
      this.searchTitle.textContent = `KẾT QUẢ: ${this.currentQuery.toUpperCase()}`;
    } else if (this.selectedCategory || this.selectedBrand) {
      const catName =
        this.filterCategoriesContainer?.querySelector("input:checked")
          ?.nextElementSibling?.nextElementSibling?.textContent;
      const brandName =
        this.filterBrandsContainer?.querySelector("input:checked")
          ?.nextElementSibling?.nextElementSibling?.textContent;
      this.searchTitle.textContent = (
        catName ||
        brandName ||
        "KẾT QUẢ"
      ).toUpperCase();
    } else {
      this.searchTitle.textContent = "TOÀN BỘ KHO HÀNG";
    }

    try {
      const params = {
        q: this.currentQuery,
        category_id: this.selectedCategory,
        brand_id: this.selectedBrand,
        min_price: this.minPriceInput?.value,
        max_price: this.maxPriceInput?.value,
        sort: this.sortSelect?.value,
        on_sale: this.onSale,
        limit: 12,
        page: this.currentPage,
      };

      const response = await api.getProducts(params);
      this.renderResults(response.products);
      this.searchStats.textContent = `TÌM THẤY ${response.totalItems} SẢN PHẨM TINH HOA`;

      this.renderPagination(response.totalPages);
    } catch (err) {
      this.resultsGrid.innerHTML = `<p class="col-span-full text-center text-[#1c69d4] font-black py-20 uppercase tracking-widest">Lỗi hệ thống: ${err.message}</p>`;
    } finally {
      this.isLoading = false;
      if (this.infiniteLoader)
        this.infiniteLoader.classList.remove("opacity-100");
    }
  }

  renderResults(products) {
    if (!products || products.length === 0) {
      this.resultsGrid.innerHTML = `
                <div class="col-span-full py-40 text-center">
                    <h3 class="text-4xl font-light text-[#262626] mb-4 uppercase tracking-tighter">KHÔNG TÌM THẤY</h3>
                    <p class="text-[11px] font-black text-[#757575] uppercase tracking-widest">Thử một từ khóa khác hoặc lọc lại kết quả</p>
                </div>
            `;
      return;
    }

    const cardsHTML = products.map((p) => ProductCard(p)).join("");
    this.resultsGrid.innerHTML = cardsHTML;
    this.initScrollReveal();
  }

  renderPagination(totalPages) {
    if (!this.paginationContainer) return;

    if (totalPages <= 1) {
      this.paginationContainer.innerHTML = "";
      return;
    }

    let html = "";

    html += `
            <button onclick="window.searchController.changePage(${this.currentPage - 1})"
                class="px-4 py-3 border-[1.5px] border-[#262626] text-[#262626] font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all ${this.currentPage === 1 ? "opacity-30 pointer-events-none" : ""}">
                Trước
            </button>
        `;

    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `
                <button onclick="window.searchController.changePage(1)"
                    class="px-5 py-3 border-[1.5px] border-[#262626] text-[#262626] font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all">
                    1
                </button>
            `;
      if (startPage > 2) {
        html += `<span class="px-3 text-[#757575] font-black text-[10px] tracking-widest">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === this.currentPage) {
        html += `
                    <button class="px-5 py-3 bg-[#1c69d4] text-white border-[1.5px] border-[#1c69d4] font-black text-[10px] uppercase tracking-widest cursor-default">
                        ${i}
                    </button>
                `;
      } else {
        html += `
                    <button onclick="window.searchController.changePage(${i})"
                        class="px-5 py-3 border-[1.5px] border-[#262626] text-[#262626] font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all">
                        ${i}
                    </button>
                `;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="px-3 text-[#757575] font-black text-[10px] tracking-widest">...</span>`;
      }
      html += `
                <button onclick="window.searchController.changePage(${totalPages})"
                    class="px-5 py-3 border-[1.5px] border-[#262626] text-[#262626] font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all">
                    ${totalPages}
                </button>
            `;
    }

    html += `
            <button onclick="window.searchController.changePage(${this.currentPage + 1})"
                class="px-4 py-3 border-[1.5px] border-[#262626] text-[#262626] font-black text-[10px] uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all ${this.currentPage === totalPages ? "opacity-30 pointer-events-none" : ""}">
                Sau
            </button>
        `;

    this.paginationContainer.innerHTML = html;
  }

  initScrollReveal() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    this.resultsGrid
      .querySelectorAll(".reveal")
      .forEach((el) => observer.observe(el));
  }

  changePage(page) {
    this.currentPage = page;
    this.performSearch();
    const searchSection = document.getElementById("search-results-section");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  syncFilterUI() {
    if (!this.filterCategoriesContainer || !this.filterBrandsContainer) return;

    if (this.selectedCategory) {
      const radio = this.filterCategoriesContainer.querySelector(
        `input[name="category-filter"][value="${this.selectedCategory}"]`,
      );
      if (radio) radio.checked = true;
    } else {
      const allRadio = this.filterCategoriesContainer.querySelector(
        'input[name="category-filter"][value=""]',
      );
      if (allRadio) allRadio.checked = true;
    }

    if (this.selectedBrand) {
      const radio = this.filterBrandsContainer.querySelector(
        `input[name="brand-filter"][value="${this.selectedBrand}"]`,
      );
      if (radio) radio.checked = true;
    } else {
      const allRadio = this.filterBrandsContainer.querySelector(
        'input[name="brand-filter"][value=""]',
      );
      if (allRadio) allRadio.checked = true;
    }
  }
}
