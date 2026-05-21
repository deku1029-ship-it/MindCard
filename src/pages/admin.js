import { api } from "../api.js";

export class AdminController {
  constructor() {
    this.isOpen = false;
    this.activeTab = "dashboard";

    // Product Management State
    this.productFilters = {
      page: 1,
      limit: 10,
      q: "",
      category_id: "",
      brand_id: "",
    };
    this.productTotalPages = 1;

    this.initUI();
    this.checkAdminRole();

    window.adminController = this;

    document.getElementById("nav-admin-btn")?.addEventListener("click", () => {
      this.open();
    });
  }

  open(shouldPushState = true) {
    this.isOpen = true;

    // Re-verify UI elements exist, re-init if they were lost/wiped
    if (!this.panel || !document.getElementById("admin-unit-form")) {
      console.log("[Admin] Re-initializing UI because forms were missing...");
      this.initUI();
    }

    this.panel.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    this.switchTab("dashboard");

    if (shouldPushState) {
      window.history.pushState({}, "", "/admin");
    }
  }

  /**
   * Safely resets a form by ID, checking for existence first to prevent Null Reference errors.
   */
  safeReset(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      return true;
    } else {
      console.warn(`[Admin] Form "${formId}" not found for reset.`);
      return false;
    }
  }

  close(shouldPushState = true) {
    this.isOpen = false;
    this.panel.classList.add("hidden");
    document.body.style.overflow = "";
    if (shouldPushState) {
      window.history.pushState({}, "", "/");
    }
  }

  checkAdminRole() {
    const token = localStorage.getItem("auth_token");
    const adminBtn = document.getElementById("nav-admin-btn");
    if (!adminBtn) return;

    let isAdmin = false;
    this.isSuperAdmin = false;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        isAdmin = payload.role === "admin" || payload.role === "staff";
        this.isSuperAdmin = payload.role === "admin";
      } catch (e) {}
    }

    if (isAdmin) {
      adminBtn.classList.remove("hidden");
      adminBtn.classList.add("md:flex");

      // Hide HR tabs for staff
      if (this.panel) {
        const adminOnlyEls = [
          "tab-btn-users",
          "hr-separator",
          "hr-divider",
          "tab-btn-units",
          "tab-btn-staff",
          "tab-btn-tasks",
          "tab-btn-evaluations",
        ];
        adminOnlyEls.forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.style.display = this.isSuperAdmin ? "" : "none";
          }
        });
      }
    } else {
      adminBtn.classList.add("hidden");
      adminBtn.classList.remove("md:flex");
    }
  }

  initUI() {
    const container = document.getElementById("admin-container");
    if (!container) return;

    container.innerHTML = `
            <div id="admin-panel" class="fixed inset-0 bg-gray-50 z-[100] hidden flex flex-col md:flex-row h-screen">
                <!-- Sidebar -->
                <div class="w-full md:w-72 bg-white flex flex-col border-r border-gray-100 shadow-xl">
                    <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div class="flex items-center gap-3 cursor-pointer" onclick="location.href='/'">
                            <span class="text-xl font-black tracking-tight text-gray-900 uppercase">MindCard Admin</span>
                        </div>
                        <button id="admin-close-btn" class="md:hidden text-gray-400 hover:text-gray-900 transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <nav class="flex-1 p-6 space-y-2 overflow-y-auto">
                        <button onclick="adminController.switchTab('dashboard')" id="tab-btn-dashboard" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                             Dashboard
                        </button>
                        <button onclick="adminController.switchTab('products')" id="tab-btn-products" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                             Sản phẩm
                        </button>
                        <button onclick="adminController.switchTab('categories')" id="tab-btn-categories" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                             Danh mục
                        </button>
                        <button onclick="adminController.switchTab('brands')" id="tab-btn-brands" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                             Thương hiệu
                        </button>
                        <button onclick="adminController.switchTab('orders')" id="tab-btn-orders" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                             Đơn hàng
                        </button>
                        <button onclick="adminController.switchTab('users')" id="tab-btn-users" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                             Khách hàng
                        </button>
                        <button onclick="adminController.switchTab('settings')" id="tab-btn-settings" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                             Cấu hình hệ thống
                        </button>
                        <hr id="hr-separator" class="border-gray-100 my-4">
                        <div id="hr-divider" class="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quản trị Nhân sự</div>
                        <button onclick="adminController.switchTab('units')" id="tab-btn-units" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                             Đơn vị / Phòng ban
                        </button>
                        <button onclick="adminController.switchTab('staff')" id="tab-btn-staff" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                             Nhân sự
                        </button>
                        <button onclick="adminController.switchTab('tasks')" id="tab-btn-tasks" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                             Công việc
                        </button>
                        <button onclick="adminController.switchTab('evaluations')" id="tab-btn-evaluations" class="sidebar-btn w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black transition-all">
                             <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                             Đánh giá nhân sự
                        </button>
                    </nav>
                    <div class="p-8 border-t border-gray-100">
                        <button id="admin-exit-btn" class="w-full text-center px-4 py-4 border border-gray-200 rounded-2xl text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-black uppercase tracking-wider">Thoát Quản trị</button>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="flex-1 overflow-y-auto p-6 md:p-10 relative bg-slate-50/50">
                    
                    <!-- 1. Dashboard Overview -->
                    <div id="admin-tab-dashboard" class="tab-content">
                        <h2 class="text-3xl font-black text-slate-900 mb-8">Tổng quan hệ thống</h2>
                        
                        <div id="admin-stats-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <!-- Stats Cards loaded via JS -->
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 class="font-bold text-slate-900 mb-4">Đơn hàng gần đây</h3>
                                <div id="dashboard-recent-orders" class="space-y-4">
                                    <p class="text-slate-400 text-sm">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Products Tab -->
                    <div id="admin-tab-products" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-3xl font-black text-slate-900">Quản lý Sản phẩm</h2>
                            <button onclick="adminController.openProductModal()" class="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Thêm sản phẩm mới
                            </button>
                        </div>

                        <!-- Filter Bar -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div class="md:col-span-2 relative">
                                <input type="text" id="admin-product-search" placeholder="Tìm tên sản phẩm..." 
                                    class="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 pl-12 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-sm"
                                    onkeypress="if(event.key === 'Enter') adminController.applyProductFilters()">
                                <svg class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <select id="admin-product-filter-cat" onchange="adminController.applyProductFilters()" class="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 outline-none font-bold text-sm">
                                <option value="">Tất cả danh mục</option>
                            </select>
                            <select id="admin-product-filter-brand" onchange="adminController.applyProductFilters()" class="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 outline-none font-bold text-sm">
                                <option value="">Tất cả nhãn hàng</option>
                            </select>
                        </div>

                        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm text-slate-600">
                                    <thead class="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Sản phẩm</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Giá niên yết</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-center">Tồn kho</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-product-tbody" class="divide-y divide-slate-50"></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Pagination -->
                        <div class="mt-6 flex justify-between items-center px-4">
                            <div class="text-xs font-bold text-slate-400 uppercase tracking-widest" id="admin-product-pagination-info">Đang hiển thị...</div>
                            <div class="flex gap-2" id="admin-product-pagination-controls">
                                <!-- Controls injected via JS -->
                            </div>
                        </div>
                    </div>

                    <!-- 3. Orders Tab -->
                    <div id="admin-tab-orders" class="tab-content hidden">
                        <h2 class="text-3xl font-black text-slate-900 mb-8">Quản lý Đơn hàng</h2>
                        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm text-slate-600">
                                    <thead class="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Mã đơn</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Khách hàng</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Tổng thanh toán</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Trình trạng</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Hoạt động</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-order-tbody" class="divide-y divide-slate-50"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- 4. Users Tab -->
                    <div id="admin-tab-users" class="tab-content hidden">
                        <h2 class="text-3xl font-black text-slate-900 mb-8">Quản lý Users</h2>
                        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm text-slate-600">
                                    <thead class="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Người dùng</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Email</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Phân quyền</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Ngày tạo</th>
                                            <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-user-tbody" class="divide-y divide-slate-50"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- 5. Categories Tab (New) -->
                    <div id="admin-tab-categories" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <div class="flex items-center gap-4">
                                <h2 class="text-3xl font-black text-slate-900">Quản lý Danh mục (Cây)</h2>
                                <span id="category-count-badge" class="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest hidden">Đã chọn: 0/12</span>
                            </div>
                            <button onclick="adminController.openCategoryModal()" class="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Thêm danh mục gốc
                            </button>
                        </div>
                        <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div id="category-tree-container" class="space-y-2">
                                <!-- Tree View list rendered here -->
                                <p class="text-slate-400">Đang tải cấu trúc danh mục...</p>
                            </div>
                        </div>
                    </div>

                    <!-- 6. Brands Tab (New) -->
                    <div id="admin-tab-brands" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-3xl font-black text-slate-900">Quản lý Nhãn hàng</h2>
                            <button onclick="adminController.openBrandModal()" class="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Thêm nhãn hàng
                            </button>
                        </div>
                        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Nhãn hàng</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Mô tả</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-brand-tbody" class="divide-y divide-slate-50"></tbody>
                            </table>
                        </div>
                    </div>
                    <!-- 7. Units Tab -->
                    <div id="admin-tab-units" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-3xl font-black text-slate-900">Đơn vị / Phòng ban</h2>
                            <button onclick="adminController.openUnitModal()" class="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Thêm đơn vị
                            </button>
                        </div>
                        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Tên đơn vị</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Mã</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Trực thuộc</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-unit-tbody" class="divide-y divide-slate-50"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 8. Staff Tab -->
                    <div id="admin-tab-staff" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-3xl font-black text-slate-900">Quản lý Nhân sự</h2>
                            <button onclick="adminController.openStaffModal()" class="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Thêm nhân sự
                            </button>
                        </div>
                        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Nhân sự</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Chức vụ</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Đơn vị</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Trạng thái</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-staff-tbody" class="divide-y divide-slate-50"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 9. Tasks Tab -->
                    <div id="admin-tab-tasks" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-3xl font-black text-slate-900">Quản lý Công việc</h2>
                            <button onclick="adminController.openTaskModal()" class="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Giao việc mới
                            </button>
                        </div>
                        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Công việc</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Người thực hiện</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Hạn chót</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-center">Trạng thái</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-task-tbody" class="divide-y divide-slate-50"></tbody>
                            </table>
                        </div>
                    </div>
                    <!-- 10. Evaluations Tab -->
                    <div id="admin-tab-evaluations" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-3xl font-black text-slate-900">Đánh giá Nhân sự</h2>
                            <button onclick="adminController.openEvaluationModal()" class="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg shadow-rose-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Đánh giá mới
                            </button>
                        </div>
                        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table class="w-full text-left text-sm text-slate-600">
                                <thead class="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Nhân sự</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-center">Điểm số</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter">Nhận xét</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-center">Ngày đánh giá</th>
                                        <th class="px-8 py-5 font-bold text-slate-900 uppercase tracking-tighter text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody id="admin-evaluation-tbody" class="divide-y divide-slate-50"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 11. Settings Tab -->
                    <div id="admin-tab-settings" class="tab-content hidden">
                        <h2 class="text-3xl font-black text-slate-900 mb-8">Cấu hình hệ thống</h2>
                        <div class="max-w-2xl bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                             <form id="admin-settings-form" class="space-y-8">
                                <div>
                                    <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Logo thương hiệu</label>
                                    <div class="flex items-center gap-8">
                                        <div class="w-32 h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                            <img id="settings-logo-preview" src="" class="w-full h-full object-contain hidden">
                                            <div id="settings-logo-placeholder" class="text-slate-300">
                                                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                            <div class="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer transition-all" onclick="document.getElementById('settings-logo-input').click()">
                                                <span class="text-white text-[10px] font-black uppercase tracking-widest">Thay đổi</span>
                                            </div>
                                        </div>
                                        <div class="flex-1 space-y-4">
                                            <input type="text" id="setting-logo-url" class="form-input" placeholder="URL Logo của bạn...">
                                            <input type="file" id="settings-logo-input" class="hidden" accept="image/*" onchange="adminController.handleLogoUpload(this)">
                                            <p class="text-[10px] text-slate-400 font-medium leading-relaxed">Khuyên dùng ảnh PNG trong suốt hoặc SVG, kích thước tỷ lệ 1:1 hoặc 4:1 để hiển thị tốt nhất trên Header.</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="pt-6 border-t border-slate-50 flex justify-end">
                                    <button type="submit" class="btn-primary px-10 py-4 shadow-xl shadow-orange-500/20 uppercase tracking-widest text-xs">Cập nhật cấu hình</button>
                                </div>
                             </form>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Detail Modal -->
            <div id="admin-detail-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[120] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div class="p-8 border-b border-slate-100 flex justify-between items-center">
                        <h3 id="detail-modal-title" class="text-2xl font-black text-slate-900">Chi tiết</h3>
                        <button onclick="adminController.closeDetailModal()" class="text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-full transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div id="detail-modal-content" class="flex-1 overflow-y-auto p-8"></div>
                </div>
            </div>

            <!-- Product Modal (Premium Redesign) -->
            <div id="admin-product-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                            </div>
                            <div>
                                <h3 id="product-modal-title" class="text-2xl font-black text-slate-900">Thêm Sản Phẩm</h3>
                                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Cập nhật kho hàng dân dã</p>
                            </div>
                        </div>
                        <button onclick="adminController.closeProductModal()" class="text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-full transition-all hover:rotate-90">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    
                    <form id="admin-product-form" class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <input type="hidden" id="pm-id">
                        
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <!-- Left: Form Fields -->
                            <div class="lg:col-span-2 space-y-10">
                                <!-- Section: Thông tin cơ bản -->
                                <div class="space-y-6">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                        <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">Thông tin cơ bản</h4>
                                    </div>
                                    <div class="grid grid-cols-1 gap-6">
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên sản phẩm *</label>
                                            <input type="text" id="pm-name" required class="form-input !py-4 rounded-2xl" placeholder="Ví dụ: Laptop Gaming Asus ROG">
                                        </div>
                                        <div class="grid grid-cols-2 gap-6">
                                            <div>
                                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Danh mục *</label>
                                                <select id="pm-category-id" required class="form-input !py-4 rounded-2xl">
                                                    <option value="">-- Chọn danh mục --</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nhãn hàng</label>
                                                <select id="pm-brand-id" class="form-input !py-4 rounded-2xl">
                                                    <option value="">-- Chọn nhãn hàng --</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Section: Giá & Kho -->
                                <div class="space-y-6">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                        <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">Thương mại & Tồn kho</h4>
                                    </div>
                                    <div class="grid grid-cols-3 gap-6">
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Giá bán *</label>
                                            <input type="number" id="pm-price" step="1" required class="form-input !py-4 rounded-2xl" placeholder="0">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Giá gốc</label>
                                            <input type="number" id="pm-original-price" step="1" class="form-input !py-4 rounded-2xl" placeholder="0">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tồn kho</label>
                                            <input type="number" id="pm-stock" step="1" value="10" required class="form-input !py-4 rounded-2xl">
                                        </div>
                                    </div>
                                </div>

                                <!-- Section: Thông số kỹ thuật -->
                                <div class="space-y-6">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                        <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">Thông số kỹ thuật</h4>
                                    </div>
                                    <div class="grid grid-cols-3 gap-6">
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bảo hành</label>
                                            <input type="text" id="pm-warranty" class="form-input !py-4 rounded-2xl" placeholder="12 tháng">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tình trạng</label>
                                            <input type="text" id="pm-condition" class="form-input !py-4 rounded-2xl" placeholder="Mới 100%">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Xuất xứ</label>
                                            <input type="text" id="pm-origin" class="form-input !py-4 rounded-2xl" placeholder="Chính hãng">
                                        </div>
                                    </div>
                                </div>

                                <!-- Section: Nội dung -->
                                <div class="space-y-6">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                                        <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">Mô tả & Hình ảnh</h4>
                                    </div>
                                    <div class="space-y-6">
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hình ảnh Sản phẩm *</label>
                                            <div class="flex gap-3">
                                                <input type="text" id="pm-img" class="form-input !py-4 rounded-2xl flex-1" placeholder="URL hoặc upload...">
                                                <input type="file" id="pm-img-file" class="hidden" accept="image/*" onchange="adminController.handleProductImageUpload(this)">
                                                <button type="button" onclick="document.getElementById('pm-img-file').click()" class="px-6 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs font-bold text-slate-700">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                    Tải lên
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mô tả chi tiết</label>
                                            <textarea id="pm-desc" rows="6" class="form-input !py-4 rounded-2xl resize-none" placeholder="Nhập mô tả sản phẩm tại đây..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Preview Card -->
                            <div class="lg:col-span-1">
                                <div class="sticky top-0 space-y-6">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="w-1.5 h-6 bg-slate-300 rounded-full"></span>
                                        <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">Xem trước</h4>
                                    </div>
                                    <div class="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 overflow-hidden group">
                                        <div class="aspect-square bg-white rounded-3xl mb-6 flex items-center justify-center overflow-hidden border border-slate-100">
                                            <img id="pm-preview-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='40' font-family='Arial,sans-serif' font-weight='bold' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3ENo Image%3C/text%3E%3C/svg%3E" class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110">
                                        </div>
                                        <div class="space-y-2">
                                            <div id="pm-preview-name" class="font-black text-slate-900 line-clamp-2">Tên sản phẩm</div>
                                            <div id="pm-preview-price" class="text-orange-600 font-extrabold text-xl">0 ₫</div>
                                        </div>
                                    </div>
                                    <div class="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                                        <svg class="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p class="text-[11px] text-orange-700 font-medium leading-relaxed">Đảm bảo tên sản phẩm có chứa từ khóa chính để bộ máy AI có thể đề xuất chính xác hơn cho khách hàng. Từ khóa chính là từ khóa mà khách hàng hỏi về sản phẩm ví dụ Iphone, Macbook...</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-4">
                            <button type="button" onclick="adminController.closeProductModal()" class="px-10 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Hủy bỏ</button>
                            <button type="submit" class="px-12 py-4 btn-primary shadow-2xl shadow-orange-500/30 uppercase tracking-widest text-xs">Lưu lại ngay</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Category Modal -->
            <div id="admin-category-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
                    <h3 id="category-modal-title" class="text-2xl font-black text-slate-900 mb-6">Danh mục</h3>
                    <form id="admin-category-form" class="space-y-4">
                        <input type="hidden" id="cm-id">
                        <input type="hidden" id="cm-parent-id">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên danh mục</label>
                            <input type="text" id="cm-name" required class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Biểu tượng (Icon/Image)</label>
                            <div class="flex gap-3 mb-3">
                                <input type="text" id="cm-icon" class="form-input flex-1" placeholder="URL hoặc chọn file...">
                                <input type="file" id="cm-icon-file" class="hidden" accept="image/*" onchange="adminController.handleCategoryIconUpload(this)">
                                <button type="button" onclick="document.getElementById('cm-icon-file').click()" class="px-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    Tải lên
                                </button>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                                <img id="cm-preview" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='12' font-family='Arial,sans-serif' font-weight='bold' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3EPreview%3C/text%3E%3C/svg%3E" class="w-16 h-16 object-contain rounded-lg shadow-sm mb-2">
                                <p class="text-[9px] text-slate-400 italic">Xem trước biểu tượng danh mục.</p>
                            </div>
                        </div>
                        <div id="cm-parent-info" class="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 hidden">
                            Danh mục cha: <span id="cm-parent-name" class="font-bold text-slate-900"></span>
                        </div>
                        <div class="pt-4 border-t border-slate-50">
                            <label class="relative inline-flex items-center cursor-pointer group">
                                <input type="checkbox" id="cm-show-on-home" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                <span class="ml-3 text-sm font-black text-slate-400 peer-checked:text-orange-600 uppercase tracking-tight transition-colors">Hiển thị tại trang chủ</span>
                            </label>
                        </div>
                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="adminController.closeCategoryModal()" class="px-6 py-2 text-slate-400 font-bold">Hủy</button>
                            <button type="submit" class="btn-primary px-6 py-2">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Brand Modal -->
            <div id="admin-brand-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
                    <h3 id="brand-modal-title" class="text-2xl font-black text-slate-900 mb-6">Nhãn hàng</h3>
                    <form id="admin-brand-form" class="space-y-4">
                        <input type="hidden" id="bm-id">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên nhãn hàng</label>
                            <input type="text" id="bm-name" required class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">URL Logo</label>
                            <input type="text" id="bm-logo" class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mô tả</label>
                            <textarea id="bm-desc" class="form-input"></textarea>
                        </div>
                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="adminController.closeBrandModal()" class="px-6 py-2 text-slate-400 font-bold">Hủy</button>
                            <button type="submit" class="btn-primary px-6 py-2">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Unit Modal -->
            <div id="admin-unit-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
                    <h3 id="unit-modal-title" class="text-2xl font-black text-slate-900 mb-6">Đơn vị</h3>
                    <form id="admin-unit-form" class="space-y-4">
                        <input type="hidden" id="um-id">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên đơn vị</label>
                            <input type="text" id="um-name" required class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mã đơn vị</label>
                            <input type="text" id="um-code" class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Đơn vị cha</label>
                            <select id="um-parent-id" class="form-input">
                                <option value="">-- Không có --</option>
                            </select>
                        </div>
                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="adminController.closeUnitModal()" class="px-6 py-2 text-slate-400 font-bold">Hủy</button>
                            <button type="submit" class="btn-primary px-6 py-2">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Staff Modal -->
            <div id="admin-staff-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
                    <h3 id="staff-modal-title" class="text-2xl font-black text-slate-900 mb-6">Nhân sự</h3>
                    <form id="admin-staff-form" class="space-y-4">
                        <input type="hidden" id="sm-id">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Họ tên</label>
                            <input type="text" id="sm-full-name" required class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email *</label>
                            <input type="email" id="sm-email" required class="form-input" placeholder="admin@tpee.com">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Số điện thoại</label>
                            <input type="text" id="sm-phone" class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Chức vụ</label>
                            <input type="text" id="sm-position" class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Đơn vị</label>
                            <select id="sm-unit-id" class="form-input">
                                <option value="">-- Chọn đơn vị --</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái</label>
                            <select id="sm-status" class="form-input">
                                <option value="active">Đang làm việc</option>
                                <option value="inactive">Đã nghỉ việc</option>
                            </select>
                        </div>
                        
                        <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <label class="relative inline-flex items-center cursor-pointer group">
                                <input type="checkbox" id="sm-create-account" onchange="adminController.toggleStaffAccountFields()" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                <span class="ml-3 text-sm font-black text-slate-400 peer-checked:text-orange-600 uppercase tracking-tight transition-colors">Kích hoạt tài khoản Đăng nhập</span>
                            </label>
                            
                            <div id="staff-account-fields" class="hidden space-y-4 pt-2">
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên đăng nhập (Username)</label>
                                    <input type="text" id="sm-username" class="form-input bg-white" placeholder="vd: vana_staff">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mật khẩu ban đầu</label>
                                    <input type="password" id="sm-password" class="form-input bg-white" placeholder="******">
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="adminController.closeStaffModal()" class="px-6 py-2 text-slate-400 font-bold">Hủy</button>
                            <button type="submit" class="btn-primary px-6 py-2 uppercase tracking-widest text-xs">Lưu nhân sự</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Task Modal -->
            <div id="admin-task-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
                    <h3 id="task-modal-title" class="text-2xl font-black text-slate-900 mb-6">Công việc</h3>
                    <form id="admin-task-form" class="space-y-4">
                        <input type="hidden" id="tm-id">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tiêu đề</label>
                            <input type="text" id="tm-title" required class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nhân sự thực hiện</label>
                            <select id="tm-staff-id" class="form-input">
                                <option value="">-- Chọn nhân sự --</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Hạn chót</label>
                            <input type="date" id="tm-deadline" class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trạng thái</label>
                            <select id="tm-status" class="form-input">
                                <option value="pending">Chờ xử lý</option>
                                <option value="ongoing">Đang thực hiện</option>
                                <option value="completed">Hoàn thành</option>
                            </select>
                        </div>
                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="adminController.closeTaskModal()" class="px-6 py-2 text-slate-400 font-bold">Hủy</button>
                            <button type="submit" class="btn-primary px-6 py-2">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Evaluation Modal -->
            <div id="admin-evaluation-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] hidden items-center justify-center p-4">
                <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8">
                    <h3 id="evaluation-modal-title" class="text-2xl font-black text-slate-900 mb-6">Đánh giá</h3>
                    <form id="admin-evaluation-form" class="space-y-4">
                        <input type="hidden" id="em-id">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nhân sự</label>
                            <select id="em-staff-id" required class="form-input">
                                <option value="">-- Chọn nhân sự --</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Điểm (1-10)</label>
                            <input type="number" id="em-score" min="1" max="10" required class="form-input">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nhận xét</label>
                            <textarea id="em-comment" class="form-input"></textarea>
                        </div>
                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="adminController.closeEvaluationModal()" class="px-6 py-2 text-slate-400 font-bold">Hủy</button>
                            <button type="submit" class="btn-primary px-6 py-2">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    this.panel = document.getElementById("admin-panel");
    document
      .getElementById("admin-close-btn")
      ?.addEventListener("click", () => this.close());
    document
      .getElementById("admin-exit-btn")
      ?.addEventListener("click", () => this.close());
    document
      .getElementById("admin-product-form")
      ?.addEventListener("submit", (e) => this.submitProduct(e));
    document
      .getElementById("admin-category-form")
      ?.addEventListener("submit", (e) => this.submitCategory(e));
    document
      .getElementById("admin-brand-form")
      ?.addEventListener("submit", (e) => this.submitBrand(e));
    document
      .getElementById("admin-unit-form")
      ?.addEventListener("submit", (e) => this.submitUnit(e));
    document
      .getElementById("admin-staff-form")
      ?.addEventListener("submit", (e) => this.submitStaff(e));
    document
      .getElementById("admin-task-form")
      ?.addEventListener("submit", (e) => this.submitTask(e));
    document
      .getElementById("admin-evaluation-form")
      ?.addEventListener("submit", (e) => this.submitEvaluation(e));
    document
      .getElementById("admin-settings-form")
      ?.addEventListener("submit", (e) => this.submitSettings(e));

    // Product Preview Listeners
    this.initProductPreview();

    window.adminController = this;
  }

  initProductPreview() {
    const nameInput = document.getElementById("pm-name");
    const priceInput = document.getElementById("pm-price");
    const imgInput = document.getElementById("pm-img");

    const previewName = document.getElementById("pm-preview-name");
    const previewPrice = document.getElementById("pm-preview-price");
    const previewImg = document.getElementById("pm-preview-img");

    nameInput?.addEventListener("input", (e) => {
      previewName.textContent = e.target.value || "Tên sản phẩm";
    });

    priceInput?.addEventListener("input", (e) => {
      const val = e.target.value;
      previewPrice.textContent = val
        ? new Intl.NumberFormat("vi-VN").format(Math.round(val)) + " ₫"
        : "0 ₫";
    });

    imgInput?.addEventListener("input", (e) => {
      const val = e.target.value;
      previewImg.src =
        val ||
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='40' font-family='Arial,sans-serif' font-weight='bold' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3ENo Image%3C/text%3E%3C/svg%3E";
    });
  }

  toggleAdmin() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.panel.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      this.switchTab("dashboard");
    } else {
      this.panel.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  async switchTab(tab) {
    // Fallback: restrict staff access to admin-only tabs
    const adminOnlyTabs = ["users", "units", "staff", "tasks", "evaluations"];
    if (this.isSuperAdmin === false && adminOnlyTabs.includes(tab)) {
      tab = "dashboard";
    }

    this.activeTab = tab;
    document
      .querySelectorAll(".tab-content")
      .forEach((el) => el.classList.add("hidden"));
    document.querySelectorAll(".sidebar-btn").forEach((el) => {
      el.classList.remove(
        "bg-orange-600",
        "text-white",
        "shadow-lg",
        "shadow-orange-500/20",
      );
      el.classList.add("text-gray-500", "bg-transparent", "hover:bg-gray-50");
    });

    document.getElementById(`admin-tab-${tab}`).classList.remove("hidden");
    const activeBtn = document.getElementById(`tab-btn-${tab}`);
    if (activeBtn) {
      activeBtn.classList.remove(
        "text-gray-500",
        "bg-transparent",
        "hover:bg-gray-50",
      );
      activeBtn.classList.add(
        "bg-orange-600",
        "text-white",
        "shadow-lg",
        "shadow-orange-500/20",
      );
    }

    switch (tab) {
      case "dashboard":
        this.loadDashboard();
        break;
      case "products":
        await this.initProductFilters();
        this.loadProducts();
        break;
      case "orders":
        this.loadOrders();
        break;
      case "users":
        this.loadUsers();
        break;
      case "categories":
        this.loadCategories();
        break;
      case "brands":
        this.loadBrands();
        break;
      case "units":
        this.loadUnits();
        break;
      case "staff":
        this.loadStaff();
        break;
      case "tasks":
        this.loadTasks();
        break;
      case "evaluations":
        this.loadEvaluations();
        break;
      case "settings":
        this.loadSettings();
        break;
    }
  }

  async loadSettings() {
    try {
      const settings = await api.getSettings();
      const logoUrl = settings.logo_url || "";
      document.getElementById("setting-logo-url").value = logoUrl;
      const preview = document.getElementById("settings-logo-preview");
      const placeholder = document.getElementById("settings-logo-placeholder");

      if (logoUrl) {
        preview.src = logoUrl;
        preview.classList.remove("hidden");
        placeholder.classList.add("hidden");
      } else {
        preview.classList.add("hidden");
        placeholder.classList.remove("hidden");
      }
    } catch (e) {
      console.error("Load settings failed", e);
    }
  }

  async handleLogoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = await api.uploadImage(file);
      document.getElementById("setting-logo-url").value = data.url;
      const preview = document.getElementById("settings-logo-preview");
      preview.src = data.url;
      preview.classList.remove("hidden");
      document
        .getElementById("settings-logo-placeholder")
        .classList.add("hidden");
    } catch (e) {
      alert("Lỗi tải ảnh: " + e.message);
    }
  }

  async submitSettings(e) {
    e.preventDefault();
    const logoUrl = document.getElementById("setting-logo-url").value;
    try {
      await api.updateSettings({ logo_url: logoUrl });
      alert("Cập nhật cấu hình hệ thống thành công!");
      // Reload all pages to see new logo (or just trigger a global event)
      window.location.reload();
    } catch (e) {
      alert("Lỗi lưu cấu hình: " + e.message);
    }
  }

  async handleProductImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = await api.uploadImage(file);
      document.getElementById("pm-img").value = data.url;
      // Trigger preview update
      const preview = document.getElementById("pm-preview-img");
      if (preview) preview.src = data.url;
    } catch (e) {
      alert("Lỗi tải ảnh: " + e.message);
    }
  }

  async handleCategoryIconUpload(input) {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = await api.uploadImage(file);
      document.getElementById("cm-icon").value = data.url;
      const preview = document.getElementById("cm-preview");
      if (preview) preview.src = data.url;
    } catch (e) {
      alert("Lỗi tải ảnh: " + e.message);
    }
  }

  getOrderStatusLabel(status) {
    const map = {
      pending: { label: "Chờ xử lý", class: "bg-slate-100 text-slate-500" },
      processing: {
        label: "Đang chuẩn bị",
        class: "bg-blue-100 text-blue-600",
      },
      shipped: { label: "Đang giao", class: "bg-amber-100 text-amber-600" },
      delivered: { label: "Đã giao", class: "bg-emerald-100 text-emerald-600" },
      cancelled: { label: "Đã hủy", class: "bg-rose-100 text-rose-600" },
    };
    return (
      map[status] || { label: status, class: "bg-slate-100 text-slate-500" }
    );
  }

  async loadDashboard() {
    try {
      const data = await api.getAdminStats();
      const grid = document.getElementById("admin-stats-grid");
      const recent = document.getElementById("dashboard-recent-orders");

      // Define icons and types for stats
      const statsConfig = [
        {
          title: "Tổng doanh thu",
          value: `${new Intl.NumberFormat("vi-VN").format(Math.round(data.stats.revenue))} ₫`,
          theme: "emerald",
          subtitle: "Từ các đơn hàng đã giao",
          icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        },
        {
          title: "Tổng đơn hàng",
          value: data.stats.totalOrders,
          theme: "blue",
          subtitle: "Đã xử lý thành công",
          icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
        },
        {
          title: "Khách hàng",
          value: data.stats.totalUsers,
          theme: "purple",
          subtitle: "Tổng số tài khoản thành viên",
          icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
        },
        {
          title: "Sản phẩm",
          value: data.stats.totalProducts,
          theme: "amber",
          subtitle: "Đang kinh doanh",
          icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>',
        },
      ];

      grid.innerHTML = statsConfig
        .map((s) =>
          this.renderStatCard(s.title, s.value, s.theme, s.subtitle, s.icon),
        )
        .join("");

      recent.innerHTML =
        data.recentOrders
          .map((o) => {
            const statusInfo = this.getOrderStatusLabel(o.status);
            return `
                    <div class="group flex items-center justify-between p-4 bg-white border border-slate-50 hover:border-orange-200 hover:shadow-md transition-all rounded-2xl cursor-pointer" onclick="adminController.openOrderDetails(${o.id})">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-slate-50 group-hover:bg-orange-50 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:text-orange-500 transition-colors">#${o.id}</div>
                            <div>
                                <div class="font-black text-slate-900 group-hover:text-orange-600 transition-colors">${o.customer_name}</div>
                                <div class="text-[10px] uppercase font-black tracking-widest text-slate-400">${new Date(o.createdAt).toLocaleDateString("vi-VN")}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-black text-slate-900 text-lg">${new Intl.NumberFormat("vi-VN").format(Math.round(o.total_price))}₫</div>
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 ${statusInfo.class} rounded-md">${statusInfo.label}</span>
                        </div>
                    </div>
                `;
          })
          .join("") ||
        '<p class="text-slate-400 text-sm italic p-4">Chưa có đơn hàng nào gần đây.</p>';
    } catch (e) {
      console.error("Failed to load dashboard", e);
    }
  }

  async loadUnits() {
    try {
      const units = await api.getUnits();
      const tbody = document.getElementById("admin-unit-tbody");
      const parentSelect = document.getElementById("um-parent-id");

      tbody.innerHTML = units
        .map(
          (u) => `
                <tr>
                    <td class="px-8 py-5 font-bold text-slate-900">${u.name}</td>
                    <td class="px-8 py-5 text-slate-500">${u.code || "-"}</td>
                    <td class="px-8 py-5 text-slate-500">${u.Parent ? u.Parent.name : "Gốc"}</td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="adminController.openUnitModal(${u.id})" class="text-blue-600 hover:underline mr-4">Sửa</button>
                        <button onclick="adminController.deleteUnit(${u.id})" class="text-red-600 hover:underline">Xóa</button>
                    </td>
                </tr>
            `,
        )
        .join("");

      // Update parent dropdown
      parentSelect.innerHTML =
        '<option value="">-- Không có --</option>' +
        units.map((u) => `<option value="${u.id}">${u.name}</option>`).join("");
    } catch (e) {
      alert("Lỗi khi tải danh sách đơn vị");
    }
  }

  async loadStaff() {
    try {
      const staff = await api.getStaff();
      const tbody = document.getElementById("admin-staff-tbody");
      const staffSelects = [
        document.getElementById("tm-staff-id"),
        document.getElementById("em-staff-id"),
      ];

      tbody.innerHTML = staff
        .map(
          (s) => `
                <tr>
                    <td class="px-8 py-5">
                        <div class="font-bold text-slate-900">${s.full_name}</div>
                        <div class="text-xs text-slate-400">${s.email || ""}</div>
                    </td>
                    <td class="px-8 py-5 text-slate-500">${s.position || "-"}</td>
                    <td class="px-8 py-5 text-slate-500">${s.Unit ? s.Unit.name : "-"}</td>
                    <td class="px-8 py-5 uppercase text-[10px] font-black tracking-widest ${s.status === "active" ? "text-emerald-500" : "text-rose-500"}">${s.status}</td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="adminController.openStaffModal(${s.id})" class="text-blue-600 hover:underline mr-4">Sửa</button>
                        <button onclick="adminController.deleteStaff(${s.id})" class="text-red-600 hover:underline">Xóa</button>
                    </td>
                </tr>
            `,
        )
        .join("");

      // Update staff dropdowns
      const staffOptions =
        '<option value="">-- Chọn nhân sự --</option>' +
        staff
          .map((s) => `<option value="${s.id}">${s.full_name}</option>`)
          .join("");
      staffSelects.forEach((sel) => {
        if (sel) sel.innerHTML = staffOptions;
      });
    } catch (e) {
      alert("Lỗi khi tải danh sách nhân sự");
    }
  }

  async loadTasks() {
    try {
      const tasks = await api.getTasks();
      const tbody = document.getElementById("admin-task-tbody");

      tbody.innerHTML = tasks
        .map(
          (t) => `
                <tr>
                    <td class="px-8 py-5">
                        <div class="font-bold text-slate-900">${t.title}</div>
                        <div class="text-xs text-slate-400 line-clamp-1">${t.description || ""}</div>
                    </td>
                    <td class="px-8 py-5 text-slate-500">${t.Staff ? t.Staff.full_name : "-"}</td>
                    <td class="px-8 py-5 text-slate-500">${t.deadline ? new Date(t.deadline).toLocaleDateString("vi-VN") : "-"}</td>
                    <td class="px-8 py-5 text-center">
                        <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                            ${
                              t.status === "completed"
                                ? "bg-emerald-50 text-emerald-600"
                                : t.status === "ongoing"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-slate-100 text-slate-600"
                            }">
                            ${t.status}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="adminController.openTaskModal(${t.id})" class="text-blue-600 hover:underline mr-4">Sửa</button>
                        <button onclick="adminController.deleteTask(${t.id})" class="text-red-600 hover:underline">Xóa</button>
                    </td>
                </tr>
            `,
        )
        .join("");
    } catch (e) {
      alert("Lỗi khi tải danh sách công việc");
    }
  }

  async loadEvaluations() {
    try {
      const evals = await api.getEvaluations();
      const tbody = document.getElementById("admin-evaluation-tbody");

      tbody.innerHTML = evals
        .map(
          (ev) => `
                <tr>
                    <td class="px-8 py-5 font-bold text-slate-900">${ev.Staff ? ev.Staff.full_name : "-"}</td>
                    <td class="px-8 py-5 text-center">
                        <span class="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg font-black">${ev.score}/10</span>
                    </td>
                    <td class="px-8 py-5 text-slate-500">${ev.comment || "-"}</td>
                    <td class="px-8 py-5 text-slate-500">${new Date(ev.evaluation_date).toLocaleDateString("vi-VN")}</td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="adminController.openEvaluationModal(${ev.id})" class="text-blue-600 hover:underline mr-4">Sửa</button>
                        <button onclick="adminController.deleteEvaluation(${ev.id})" class="text-red-600 hover:underline">Xóa</button>
                    </td>
                </tr>
            `,
        )
        .join("");
    } catch (e) {
      alert("Lỗi khi tải danh sách đánh giá");
    }
  }

  renderStatCard(title, value, theme, subtitle, iconHtml) {
    const themes = {
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
    };

    return `
            <div class="group relative bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-y-8 group-hover:translate-y-0"></div>
                
                <div class="flex justify-between items-start mb-6 relative">
                    <div class="w-14 h-14 ${themes[theme]} rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                        ${iconHtml}
                    </div>
                </div>
                
                <div class="relative">
                    <h4 class="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">${title}</h4>
                    <div class="text-3xl font-black text-slate-900 mb-2 tracking-tighter group-hover:text-orange-600 transition-colors">${value}</div>
                    <div class="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                        <span class="w-1.5 h-1.5 rounded-full ${themes[theme].split(" ")[1]}"></span>
                        ${subtitle}
                    </div>
                </div>
            </div>
        `;
  }

  async loadProducts() {
    try {
      const { q, category_id, brand_id, page, limit } = this.productFilters;
      const query = [
        `page=${page}`,
        `limit=${limit}`,
        q ? `q=${encodeURIComponent(q)}` : "",
        category_id ? `category_id=${category_id}` : "",
        brand_id ? `brand_id=${brand_id}` : "",
      ]
        .filter(Boolean)
        .join("&");

      const data = await api._fetch(`/products?${query}`);
      const tbody = document.getElementById("admin-product-tbody");

      tbody.innerHTML = data.products
        .map(
          (p) => `
                <tr class="hover:bg-gray-50/50 transition border-b border-gray-50">
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                            <img src="${p.image_url || "https://placehold.co/100"}" class="w-12 h-12 rounded-2xl object-cover shadow-sm">
                            <div>
                                <div class="font-bold text-gray-900">${p.name}</div>
                                <div class="text-xs text-gray-400 font-bold">${p.Category ? p.Category.name : p.category || "Không rõ"} | ${p.Brand ? p.Brand.name : "No Brand"}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-5 font-black text-gray-900 text-right">${new Intl.NumberFormat("vi-VN").format(Math.round(p.price))} ₫</td>
                    <td class="px-8 py-5 text-center">
                        <span class="px-3 py-1.5 ${p.stock > 5 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"} rounded-xl text-xs font-black">
                            ${p.stock}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <button onclick='adminController.editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="text-orange-600 hover:text-orange-800 font-bold transition mr-4">Sửa</button>
                        <button onclick="adminController.deleteProduct(${p.id})" class="text-red-400 hover:text-red-600 font-bold transition">Xóa</button>
                    </td>
                </tr>
            `,
        )
        .join("");

      this.updateProductPaginationControls(data.totalItems);
    } catch (error) {
      console.error("Failed to load products", error);
    }
  }

  async loadOrders() {
    try {
      const data = await api._fetch("/orders", { method: "GET" });
      const tbody = document.getElementById("admin-order-tbody");
      tbody.innerHTML = data
        .map(
          (o) => `
                <tr class="hover:bg-gray-50/50 transition border-b border-gray-50">
                    <td class="px-8 py-5 font-black text-gray-900">#${o.id}</td>
                    <td class="px-8 py-5">
                        <div class="text-gray-900 font-bold">${o.customer_name}</div>
                        <div class="text-xs text-gray-400 font-medium">${o.customer_phone}</div>
                    </td>
                    <td class="px-8 py-5 font-black text-orange-600 text-right">${new Intl.NumberFormat("vi-VN").format(Math.round(o.total_price))} ₫</td>
                    <td class="px-8 py-5">
                        <select onchange="adminController.updateOrderStatus(${o.id}, this.value)" class="text-xs font-black bg-gray-100 rounded-xl border-0 outline-none py-2 px-3 focus:ring-2 focus:ring-orange-500 cursor-pointer">
                            <option value="pending" ${o.status === "pending" ? "selected" : ""}>Chờ xử lý</option>
                            <option value="processing" ${o.status === "processing" ? "selected" : ""}>Đang chuẩn bị</option>
                            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Đang giao</option>
                            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Đã giao</option>
                            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Đã huỷ</option>
                        </select>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="adminController.openOrderDetails(${o.id})" class="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-900 hover:text-white transition">Chi tiết</button>
                    </td>
                </tr>
            `,
        )
        .join("");
    } catch (error) {
      console.error("Failed to load orders", error);
    }
  }

  async loadUsers() {
    try {
      const users = await api.getAdminUsers();
      const tbody = document.getElementById("admin-user-tbody");
      tbody.innerHTML = users
        .map(
          (u) => `
                <tr class="hover:bg-gray-50/50 transition border-b border-gray-50">
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 uppercase">${u.username[0]}</div>
                            <div class="font-bold text-gray-900">${u.username}</div>
                        </div>
                    </td>
                    <td class="px-8 py-5 text-gray-500 font-medium">${u.email}</td>
                    <td class="px-8 py-5">
                        <select onchange="adminController.updateUserRole(${u.id}, this.value)" class="text-xs font-black bg-white border border-gray-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-orange-500">
                            <option value="customer" ${u.role === "customer" ? "selected" : ""}>Khách hàng</option>
                            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Quản trị viên</option>
                        </select>
                    </td>
                    <td class="px-8 py-5 text-gray-400 text-xs">${new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="adminController.deleteUser(${u.id})" class="text-red-400 hover:text-red-600 transition">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `,
        )
        .join("");
    } catch (e) {
      console.error(e);
    }
  }

  // -- Category Tree Methods --
  async loadCategories() {
    try {
      const tree = await api.getCategories(true);
      const container = document.getElementById("category-tree-container");
      container.innerHTML = this.renderCategoryTree(tree);
      this.updateCategoryBadge();
    } catch (e) {
      console.error("Load categories failed", e);
    }
  }

  updateCategoryBadge() {
    const badge = document.getElementById("category-count-badge");
    if (!badge) return;
    const checkedCount = document.querySelectorAll(
      '.category-item-wrapper input[type="checkbox"]:checked',
    ).length;
    badge.textContent = `Đã chọn: ${checkedCount}/12`;
    badge.classList.remove("hidden");
    if (checkedCount > 12) {
      badge.classList.remove("bg-orange-100", "text-orange-600");
      badge.classList.add("bg-red-100", "text-red-600");
    } else {
      badge.classList.add("bg-orange-100", "text-orange-600");
      badge.classList.remove("bg-red-100", "text-red-600");
    }
  }

  renderCategoryTree(nodes, level = 0) {
    if (!nodes || nodes.length === 0)
      return level === 0
        ? '<p class="text-gray-400 italic">Chưa có danh mục nào.</p>'
        : "";

    return nodes
      .map(
        (node) => `
            <div class="category-item-wrapper mt-2">
                <div class="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-100 hover:border-orange-500 transition-all rounded-xl group">
                    <div class="flex items-center gap-3">
                        ${
                          node.children?.length
                            ? `
                        <button onclick="adminController.toggleCategoryNode(this)" class="text-gray-400 hover:text-orange-500 w-6 h-6 flex items-center justify-center transition-transform duration-200 rotate-0 bg-gray-50 hover:bg-orange-100 rounded-md">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        `
                            : `
                        <span class="w-6 h-6 text-gray-200 flex items-center justify-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </span>
                        `
                        }
                        <span class="font-bold text-gray-700">${node.name}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <label class="relative inline-flex items-center cursor-pointer hover:opacity-90" title="Hiển thị tại trang chủ">
                            <input type="checkbox" onchange="adminController.toggleCategoryHomeDisplay(${node.id}, this.checked, this)" class="sr-only peer" ${node.show_on_home ? "checked" : ""}>
                            <div class="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                            <span class="ml-2 text-xs font-bold text-gray-400 peer-checked:text-orange-600 hidden sm:block transition-colors">Trang chủ</span>
                        </label>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 border-l border-gray-200 pl-4">
                            <button onclick="adminController.openCategoryModal(null, null, ${node.id})" class="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Sửa">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="adminController.openCategoryModal(${node.id}, '${node.name}')" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Thêm con">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                            <button onclick="adminController.deleteCategory(${node.id})" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Xóa">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
                ${
                  node.children?.length
                    ? `
                <div class="category-children border-l-2 border-gray-100 ml-6 pl-4">
                    ${this.renderCategoryTree(node.children, level + 1)}
                </div>
                `
                    : ""
                }
            </div>
        `,
      )
      .join("");
  }

  async toggleCategoryHomeDisplay(id, checked, element) {
    if (checked) {
      const currentCheckedCount = document.querySelectorAll(
        '.category-item-wrapper input[type="checkbox"]:checked',
      ).length;
      if (currentCheckedCount > 12) {
        alert(
          "CHÚ Ý: Bạn chỉ có thể hiển thị tối đa 12 danh mục trên trang chủ!",
        );
        element.checked = false;
        return;
      }
    }

    try {
      await api.updateCategory(id, { show_on_home: checked });
      this.updateCategoryBadge();
    } catch (e) {
      alert("Cập nhật thất bại: " + e.message);
      this.loadCategories();
    }
  }

  toggleCategoryNode(btn) {
    const wrapper = btn.closest(".category-item-wrapper");
    const childrenContainer = wrapper.querySelector(
      ":scope > .category-children",
    );
    if (childrenContainer) {
      childrenContainer.classList.toggle("hidden");
      if (childrenContainer.classList.contains("hidden")) {
        btn.classList.add("-rotate-90");
      } else {
        btn.classList.remove("-rotate-90");
      }
    }
  }

  async loadBrands() {
    try {
      const brands = await api.getBrands();
      const tbody = document.getElementById("admin-brand-tbody");
      tbody.innerHTML = brands
        .map(
          (b) => `
                <tr class="hover:bg-gray-50/50 transition border-b border-gray-50">
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                            ${b.logo_url ? `<img src="${b.logo_url}" class="w-10 h-10 object-contain">` : '<div class="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-bold uppercase">' + b.name[0] + "</div>"}
                            <div class="font-bold text-gray-900">${b.name}</div>
                        </div>
                    </td>
                    <td class="px-8 py-5 text-gray-500 text-xs">${b.description || "-"}</td>
                    <td class="px-8 py-5 text-right">
                        <button onclick='adminController.openBrandModal(${JSON.stringify(b).replace(/'/g, "&#39;")})' class="text-orange-600 hover:text-orange-800 font-bold transition mr-4">Sửa</button>
                        <button onclick="adminController.deleteBrand(${b.id})" class="text-red-400 hover:text-red-600 font-bold transition">Xóa</button>
                    </td>
                </tr>
            `,
        )
        .join("");
    } catch (e) {
      console.error("Load brands failed", e);
    }
  }

  // -- Category Modal Logic --
  openCategoryModal(parentId = null, parentName = null, editId = null) {
    this.safeReset("admin-category-form");
    document.getElementById("cm-id").value = editId || "";
    document.getElementById("cm-parent-id").value = parentId || "";

    const parentInfo = document.getElementById("cm-parent-info");
    if (parentName) {
      parentInfo.classList.remove("hidden");
      document.getElementById("cm-parent-name").textContent = parentName;
    } else {
      parentInfo.classList.add("hidden");
    }

    if (editId) {
      document.getElementById("category-modal-title").textContent =
        "Sửa danh mục";
      // Pre-fill if editing
      api.getCategories().then((list) => {
        const cat = list.find((x) => x.id === editId);
        if (cat) {
          document.getElementById("cm-name").value = cat.name;
          document.getElementById("cm-icon").value = cat.icon || "";

          // Fix: Restore parent_id and parent name info
          if (cat.parent_id) {
            const parent = list.find((x) => x.id === cat.parent_id);
            document.getElementById("cm-parent-id").value = cat.parent_id;
            if (parent) {
              document
                .getElementById("cm-parent-info")
                .classList.remove("hidden");
              document.getElementById("cm-parent-name").textContent =
                parent.name;
            }
          } else {
            document.getElementById("cm-parent-id").value = "";
            document.getElementById("cm-parent-info").classList.add("hidden");
          }

          const showOnHomeEl = document.getElementById("cm-show-on-home");
          if (showOnHomeEl) {
            showOnHomeEl.checked = !!cat.show_on_home;
          }
          const preview = document.getElementById("cm-preview");
          if (preview)
            preview.src =
              cat.icon ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='12' font-family='Arial,sans-serif' font-weight='bold' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3EPreview%3C/text%3E%3C/svg%3E";
        }
      });
    } else {
      document.getElementById("category-modal-title").textContent = parentId
        ? "Thêm danh mục con"
        : "Thêm danh mục gốc";
    }

    document.getElementById("admin-category-modal").classList.remove("hidden");
    document.getElementById("admin-category-modal").classList.add("flex");
  }

  closeCategoryModal() {
    document.getElementById("admin-category-modal").classList.add("hidden");
    document.getElementById("admin-category-modal").classList.remove("flex");
  }

  async submitCategory(e) {
    e.preventDefault();
    const id = document.getElementById("cm-id").value;
    const show_on_home = document.getElementById("cm-show-on-home").checked;

    // Kiểm tra giới hạn 12 mục khi bật show_on_home
    if (show_on_home) {
      const currentCheckedCount = document.querySelectorAll(
        '.category-item-wrapper input[type="checkbox"]:checked',
      ).length;
      // Nếu là sửa (edit) và cái cũ chưa được tích, hoặc là thêm mới
      // Chúng ta load lại list để kiểm tra chính xác hơn hoặc đơn giản là check UI
      // Ở đây ta dùng logic đơn giản từ UI
      const isAlreadyCheckedInList =
        id &&
        document.querySelector(
          `.category-item-wrapper input[onchange*="${id}"]`,
        )?.checked;

      if (!isAlreadyCheckedInList && currentCheckedCount >= 12) {
        alert(
          "CHÚ Ý: Bạn chỉ có thể hiển thị tối đa 12 danh mục trên trang chủ!",
        );
        return;
      }
    }

    const payload = {
      name: document.getElementById("cm-name").value,
      parent_id: document.getElementById("cm-parent-id").value || null,
      icon: document.getElementById("cm-icon").value,
      show_on_home: show_on_home,
    };
    try {
      if (id) await api.updateCategory(id, payload);
      else await api.createCategory(payload);
      this.closeCategoryModal();
      this.loadCategories();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteCategory(id) {
    if (!confirm("Xóa danh mục này? Hệ thống sẽ kiểm tra ràng buộc.")) return;
    try {
      await api.deleteCategory(id);
      this.loadCategories();
    } catch (e) {
      alert("Lỗi: " + e.message);
    }
  }

  // -- Brand Modal Logic --
  openBrandModal(brand = null) {
    this.safeReset("admin-brand-form");
    if (brand) {
      document.getElementById("bm-id").value = brand.id;
      document.getElementById("bm-name").value = brand.name;
      document.getElementById("bm-logo").value = brand.logo_url || "";
      document.getElementById("bm-desc").value = brand.description || "";
      document.getElementById("brand-modal-title").textContent =
        "Sửa nhãn hàng";
    } else {
      document.getElementById("bm-id").value = "";
      document.getElementById("brand-modal-title").textContent =
        "Thêm nhãn hàng";
    }
    document.getElementById("admin-brand-modal").classList.remove("hidden");
    document.getElementById("admin-brand-modal").classList.add("flex");
  }

  closeBrandModal() {
    document.getElementById("admin-brand-modal").classList.add("hidden");
    document.getElementById("admin-brand-modal").classList.remove("flex");
  }

  async submitBrand(e) {
    e.preventDefault();
    const id = document.getElementById("bm-id").value;
    const payload = {
      name: document.getElementById("bm-name").value,
      logo_url: document.getElementById("bm-logo").value,
      description: document.getElementById("bm-desc").value,
    };
    try {
      if (id) await api.updateBrand(id, payload);
      else await api.createBrand(payload);
      this.closeBrandModal();
      this.loadBrands();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteBrand(id) {
    if (!confirm("Xóa nhãn hàng này?")) return;
    try {
      await api.deleteBrand(id);
      this.loadBrands();
    } catch (e) {
      alert("Lỗi: " + e.message);
    }
  }

  async openOrderDetails(id) {
    try {
      const orders = await api._fetch("/orders", { method: "GET" });
      const o = orders.find((x) => x.id === id);
      if (!o) return;

      const modal = document.getElementById("admin-detail-modal");
      const content = document.getElementById("detail-modal-content");
      document.getElementById("detail-modal-title").textContent =
        `Đơn hàng #${o.id}`;

      content.innerHTML = `
                <div class="space-y-8">
                    <div class="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Thông tin khách hàng</div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <div class="text-xs font-bold text-gray-500 uppercase mb-1">Người nhận</div>
                                <div class="font-black text-gray-900 text-lg">${o.customer_name}</div>
                            </div>
                            <div>
                                <div class="text-xs font-bold text-gray-500 uppercase mb-1">Điện thoại</div>
                                <div class="font-black text-gray-900 text-lg">${o.customer_phone}</div>
                            </div>
                            <div class="col-span-2 pt-2">
                                <div class="text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ giao hàng</div>
                                <div class="font-bold text-gray-800 leading-relaxed bg-white border border-gray-100 p-4 rounded-2xl">${o.shipping_address}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Sản phẩm đã chọn</div>
                        <div class="space-y-4">
                            ${o.OrderItems.map(
                              (item) => `
                                <div class="flex justify-between items-center bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                    <div class="flex items-center gap-5">
                                        <div class="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-200 text-xl">#</div>
                                        <div>
                                            <div class="font-black text-gray-900 leading-tight">${item.Product ? item.Product.name : "Sản phẩm đã xóa"}</div>
                                            <div class="text-sm font-bold text-orange-600 mt-1">${item.quantity} x ${new Intl.NumberFormat("vi-VN").format(Math.round(item.price))}₫</div>
                                        </div>
                                    </div>
                                    <div class="font-black text-gray-900 text-xl">${new Intl.NumberFormat("vi-VN").format(Math.round(item.price * item.quantity))}₫</div>
                                </div>
                            `,
                            ).join("")}
                        </div>
                    </div>

                    <div class="flex justify-between items-center border-t border-gray-100 pt-8 mt-10">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-widest">HT Thanh toán: <span class="text-gray-900 font-black">COD</span></div>
                        <div class="text-right">
                            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TỔNG CỘNG</div>
                            <div class="text-4xl font-black text-red-600 tracking-tighter">${new Intl.NumberFormat("vi-VN").format(Math.round(o.total_price))}₫</div>
                        </div>
                    </div>
                </div>
            `;

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";
    } catch (e) {
      console.error(e);
    }
  }

  closeDetailModal() {
    document.getElementById("admin-detail-modal").classList.add("hidden");
    document.getElementById("admin-detail-modal").classList.remove("flex");
    if (this.isOpen) document.body.style.overflow = "hidden";
  }

  async updateUserRole(id, role) {
    try {
      await api.updateUserRole(id, role);
    } catch (e) {
      alert("Lỗi: " + e.message);
      this.loadUsers();
    }
  }

  async deleteUser(id) {
    if (!confirm("Xóa tài khoản này?")) return;
    try {
      await api.deleteUser(id);
      this.loadUsers();
    } catch (e) {
      alert("Lỗi: " + e.message);
    }
  }

  async updateOrderStatus(id, status) {
    try {
      await api._fetch(`/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (this.activeTab === "dashboard") this.loadDashboard();
    } catch (e) {
      alert("Lỗi cập nhật trạng thái");
      this.loadOrders();
    }
  }

  async openProductModal() {
    this.safeReset("admin-product-form");
    document.getElementById("pm-id").value = "";
    document.getElementById("pm-warranty").value = "12 Tháng chính hãng";
    document.getElementById("pm-condition").value = "Mới 100% Nguyên seal";
    document.getElementById("pm-origin").value = "Nhập khẩu / Chính hãng";
    document.getElementById("product-modal-title").textContent =
      "Thêm Sản Phẩm";

    // Reset preview
    document.getElementById("pm-preview-name").textContent = "Tên sản phẩm";
    document.getElementById("pm-preview-price").textContent = "0 ₫";
    document.getElementById("pm-preview-img").src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='40' font-family='Arial,sans-serif' font-weight='bold' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3ENo Image%3C/text%3E%3C/svg%3E";

    await this.loadSelectOptions();

    document.getElementById("admin-product-modal").classList.remove("hidden");
    document.getElementById("admin-product-modal").classList.add("flex");
  }

  async editProduct(product) {
    document.getElementById("pm-id").value = product.id;
    document.getElementById("pm-name").value = product.name || "";

    await this.loadSelectOptions();
    document.getElementById("pm-category-id").value = product.category_id || "";
    document.getElementById("pm-brand-id").value = product.brand_id || "";

    document.getElementById("pm-stock").value = product.stock
      ? Math.round(product.stock)
      : 0;
    document.getElementById("pm-price").value = product.price
      ? Math.round(product.price)
      : 0;
    document.getElementById("pm-original-price").value = product.original_price
      ? Math.round(product.original_price)
      : "";
    document.getElementById("pm-img").value = product.image_url || "";
    document.getElementById("pm-desc").value = product.description || "";
    document.getElementById("pm-warranty").value = product.warranty || "";
    document.getElementById("pm-condition").value = product.condition || "";
    document.getElementById("pm-origin").value = product.origin || "";

    // Update Preview
    document.getElementById("pm-preview-name").textContent =
      product.name || "Tên sản phẩm";
    document.getElementById("pm-preview-price").textContent = product.price
      ? new Intl.NumberFormat("vi-VN").format(Math.round(product.price)) + " ₫"
      : "0 ₫";
    document.getElementById("pm-preview-img").src =
      product.image_url ||
      "https://placehold.co/400x400/f8fafc/cbd5e1?text=No+Image";

    document.getElementById("product-modal-title").textContent = "Sửa Sản Phẩm";
    document.getElementById("admin-product-modal").classList.remove("hidden");
    document.getElementById("admin-product-modal").classList.add("flex");
  }

  async loadSelectOptions() {
    try {
      const categories = await api.getCategories();
      const brands = await api.getBrands();

      const catSelect = document.getElementById("pm-category-id");
      const brandSelect = document.getElementById("pm-brand-id");

      catSelect.innerHTML =
        '<option value="">-- Chọn danh mục --</option>' +
        categories
          .map((c) => `<option value="${c.id}">${c.name}</option>`)
          .join("");

      brandSelect.innerHTML =
        '<option value="">-- Chọn nhãn hàng --</option>' +
        brands
          .map((b) => `<option value="${b.id}">${b.name}</option>`)
          .join("");
    } catch (e) {
      console.error("Select options failed", e);
    }
  }

  closeProductModal() {
    document.getElementById("admin-product-modal").classList.add("hidden");
    document.getElementById("admin-product-modal").classList.remove("flex");
  }

  async submitProduct(e) {
    e.preventDefault();
    const id = document.getElementById("pm-id").value;
    const payload = {
      name: document.getElementById("pm-name").value,
      category_id: document.getElementById("pm-category-id").value || null,
      brand_id: document.getElementById("pm-brand-id").value || null,
      stock: parseInt(document.getElementById("pm-stock").value) || 0,
      price: parseInt(document.getElementById("pm-price").value) || 0,
      original_price: document.getElementById("pm-original-price").value
        ? parseInt(document.getElementById("pm-original-price").value)
        : null,
      image_url: document.getElementById("pm-img").value,
      description: document.getElementById("pm-desc").value,
      warranty: document.getElementById("pm-warranty").value,
      condition: document.getElementById("pm-condition").value,
      origin: document.getElementById("pm-origin").value,
    };

    try {
      if (id) {
        await api._fetch(`/products/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api._fetch(`/products`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      this.closeProductModal();
      this.loadProducts();
    } catch (error) {
      alert("Lỗi lưu sản phẩm: " + error.message);
    }
  }

  async deleteProduct(id) {
    if (!confirm("Bạn có chắc chắn muốn xoá sản phẩm này?")) return;
    try {
      await api._fetch(`/products/${id}`, { method: "DELETE" });
      this.loadProducts();
    } catch (error) {
      alert("Lỗi xoá sản phẩm");
    }
  }

  // Units
  async openUnitModal(id = null) {
    this.safeReset("admin-unit-form");
    document.getElementById("um-id").value = "";
    document.getElementById("unit-modal-title").textContent = id
      ? "Sửa Đơn vị"
      : "Thêm Đơn vị";
    if (id) {
      const units = await api.getUnits();
      const u = units.find((x) => x.id === id);
      if (u) {
        document.getElementById("um-id").value = u.id;
        document.getElementById("um-name").value = u.name;
        document.getElementById("um-code").value = u.code || "";
        document.getElementById("um-parent-id").value = u.parent_id || "";
      }
    }
    document.getElementById("admin-unit-modal").classList.remove("hidden");
    document.getElementById("admin-unit-modal").classList.add("flex");
  }

  closeUnitModal() {
    document.getElementById("admin-unit-modal").classList.add("hidden");
    document.getElementById("admin-unit-modal").classList.remove("flex");
  }

  async submitUnit(e) {
    e.preventDefault();
    const id = document.getElementById("um-id").value;
    const payload = {
      name: document.getElementById("um-name").value,
      code: document.getElementById("um-code").value,
      parent_id: document.getElementById("um-parent-id").value || null,
    };
    try {
      if (id) await api.updateUnit(id, payload);
      else await api.createUnit(payload);
      this.closeUnitModal();
      this.loadUnits();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteUnit(id) {
    if (!confirm("Xóa đơn vị này?")) return;
    try {
      await api.deleteUnit(id);
      this.loadUnits();
    } catch (e) {
      alert(e.message);
    }
  }

  // Staff
  async openStaffModal(id = null) {
    this.safeReset("admin-staff-form");
    document.getElementById("sm-id").value = "";
    document.getElementById("sm-create-account").checked = false;
    this.toggleStaffAccountFields(); // Hide account fields by default

    document.getElementById("staff-modal-title").textContent = id
      ? "Sửa Nhân sự"
      : "Thêm Nhân sự";

    // Ensure units are loaded for the dropdown
    await this.loadUnits();

    if (id) {
      const staff = await api.getStaff();
      const s = staff.find((x) => x.id === id);
      if (s) {
        document.getElementById("sm-id").value = s.id;
        document.getElementById("sm-full-name").value = s.full_name;
        document.getElementById("sm-email").value = s.email || "";
        document.getElementById("sm-phone").value = s.phone || "";
        document.getElementById("sm-position").value = s.position || "";
        document.getElementById("sm-unit-id").value = s.unit_id || "";
        document.getElementById("sm-status").value = s.status || "active";

        if (s.user_id && s.User) {
          document.getElementById("sm-create-account").checked = true;
          this.toggleStaffAccountFields();
          document.getElementById("sm-username").value = s.User.username;
          document.getElementById("sm-password").placeholder =
            "Bỏ trống nếu không đổi pass";
        } else {
          document.getElementById("sm-create-account").checked = false;
          this.toggleStaffAccountFields();
          document.getElementById("sm-username").value = "";
          document.getElementById("sm-password").placeholder =
            "Nhập mật khẩu...";
        }
      }
    }
    document.getElementById("admin-staff-modal").classList.remove("hidden");
    document.getElementById("admin-staff-modal").classList.add("flex");
  }

  closeStaffModal() {
    document.getElementById("admin-staff-modal").classList.add("hidden");
    document.getElementById("admin-staff-modal").classList.remove("flex");
  }

  async submitStaff(e) {
    e.preventDefault();
    const id = document.getElementById("sm-id").value;
    const emailInput = document.getElementById("sm-email").value;

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      alert("Email không đúng định dạng. Vui lòng kiểm tra lại!");
      return;
    }

    const payload = {
      full_name: document.getElementById("sm-full-name").value,
      email: emailInput,
      phone: document.getElementById("sm-phone").value,
      position: document.getElementById("sm-position").value,
      unit_id: document.getElementById("sm-unit-id").value || null,
      status: document.getElementById("sm-status").value,
    };

    // Account logic
    if (document.getElementById("sm-create-account").checked) {
      payload.create_account = true;
      payload.username = document.getElementById("sm-username").value;
      payload.password = document.getElementById("sm-password").value;
    }

    try {
      if (id) await api.updateStaff(id, payload);
      else await api.createStaff(payload);
      this.closeStaffModal();
      this.loadStaff();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteStaff(id) {
    if (!confirm("Xóa nhân sự này?")) return;
    try {
      await api.deleteStaff(id);
      this.loadStaff();
    } catch (e) {
      alert(e.message);
    }
  }

  // Tasks
  async openTaskModal(id = null) {
    this.safeReset("admin-task-form");
    document.getElementById("tm-id").value = "";
    document.getElementById("task-modal-title").textContent = id
      ? "Cập nhật Công việc"
      : "Giao việc mới";

    await this.loadStaff(); // Load staff for dropdown

    if (id) {
      const tasks = await api.getTasks();
      const t = tasks.find((x) => x.id === id);
      if (t) {
        document.getElementById("tm-id").value = t.id;
        document.getElementById("tm-title").value = t.title;
        document.getElementById("tm-staff-id").value = t.staff_id || "";
        document.getElementById("tm-deadline").value = t.deadline
          ? t.deadline.split("T")[0]
          : "";
        document.getElementById("tm-status").value = t.status;
      }
    }
    document.getElementById("admin-task-modal").classList.remove("hidden");
    document.getElementById("admin-task-modal").classList.add("flex");
  }

  closeTaskModal() {
    document.getElementById("admin-task-modal").classList.add("hidden");
    document.getElementById("admin-task-modal").classList.remove("flex");
  }

  async submitTask(e) {
    e.preventDefault();
    const id = document.getElementById("tm-id").value;
    const payload = {
      title: document.getElementById("tm-title").value,
      staff_id: document.getElementById("tm-staff-id").value || null,
      deadline: document.getElementById("tm-deadline").value || null,
      status: document.getElementById("tm-status").value,
    };
    try {
      if (id) await api.updateTask(id, payload);
      else await api.createTask(payload);
      this.closeTaskModal();
      this.loadTasks();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteTask(id) {
    if (!confirm("Xóa công việc này?")) return;
    try {
      await api.deleteTask(id);
      this.loadTasks();
    } catch (e) {
      alert(e.message);
    }
  }

  // Evaluations
  async openEvaluationModal(id = null) {
    this.safeReset("admin-evaluation-form");
    document.getElementById("em-id").value = "";
    document.getElementById("evaluation-modal-title").textContent = id
      ? "Cập nhật Đánh giá"
      : "Đánh giá mới";

    await this.loadStaff(); // Load staff for dropdown

    if (id) {
      const evals = await api.getEvaluations();
      const ev = evals.find((x) => x.id === id);
      if (ev) {
        document.getElementById("em-id").value = ev.id;
        document.getElementById("em-staff-id").value = ev.staff_id || "";
        document.getElementById("em-score").value = ev.score;
        document.getElementById("em-comment").value = ev.comment || "";
      }
    }
    document
      .getElementById("admin-evaluation-modal")
      .classList.remove("hidden");
    document.getElementById("admin-evaluation-modal").classList.add("flex");
  }

  closeEvaluationModal() {
    document.getElementById("admin-evaluation-modal").classList.add("hidden");
    document.getElementById("admin-evaluation-modal").classList.remove("flex");
  }

  async submitEvaluation(e) {
    e.preventDefault();
    const id = document.getElementById("em-id").value;
    const payload = {
      staff_id: document.getElementById("em-staff-id").value || null,
      score: parseInt(document.getElementById("em-score").value),
      comment: document.getElementById("em-comment").value,
      evaluation_date: new Date().toISOString(),
    };
    try {
      if (id) await api.updateEvaluation(id, payload);
      else await api.createEvaluation(payload);
      this.closeEvaluationModal();
      this.loadEvaluations();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteEvaluation(id) {
    if (!confirm("Xóa đánh giá này?")) return;
    try {
      await api.deleteEvaluation(id);
      this.loadEvaluations();
    } catch (e) {
      alert(e.message);
    }
  }

  // --- Helpers ---
  safeReset(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  }

  // --- Product Pagination & Filters ---
  applyProductFilters() {
    this.productFilters.q =
      document.getElementById("admin-product-search")?.value || "";
    this.productFilters.category_id =
      document.getElementById("admin-product-filter-cat")?.value || "";
    this.productFilters.brand_id =
      document.getElementById("admin-product-filter-brand")?.value || "";
    this.productFilters.page = 1; // Reset to page 1 on search
    this.loadProducts();
  }

  goToProductPage(page) {
    if (page < 1 || page > this.productTotalPages) return;
    this.productFilters.page = page;
    this.loadProducts();
  }

  updateProductPaginationControls(total) {
    const info = document.getElementById("admin-product-pagination-info");
    const controls = document.getElementById(
      "admin-product-pagination-controls",
    );
    if (!info || !controls) return;

    this.productTotalPages = Math.ceil(total / this.productFilters.limit) || 1;

    info.innerHTML = `Trang <b>${this.productFilters.page}</b> / ${this.productTotalPages} (Tổng <b>${total}</b> sp)`;

    let html = "";
    html += `
            <button onclick="adminController.goToProductPage(${this.productFilters.page - 1})" 
                class="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30" 
                ${this.productFilters.page <= 1 ? "disabled" : ""}>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
        `;
    html += `
            <button onclick="adminController.goToProductPage(${this.productFilters.page + 1})" 
                class="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30" 
                ${this.productFilters.page >= this.productTotalPages ? "disabled" : ""}>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        `;
    controls.innerHTML = html;
  }

  toggleStaffAccountFields() {
    const checkbox = document.getElementById("sm-create-account");
    const fields = document.getElementById("staff-account-fields");
    if (checkbox && fields) {
      if (checkbox.checked) {
        fields.classList.remove("hidden");
        document.getElementById("sm-username").required = true;
        document.getElementById("sm-password").required = true;
      } else {
        fields.classList.add("hidden");
        document.getElementById("sm-username").required = false;
        document.getElementById("sm-password").required = false;
      }
    }
  }

  async initProductFilters() {
    const catSelect = document.getElementById("admin-product-filter-cat");
    const brandSelect = document.getElementById("admin-product-filter-brand");

    if (!catSelect || !brandSelect) return;

    // Only load if empty (except for the default option)
    if (catSelect.options.length <= 1) {
      try {
        const categories = await api.getCategories(); // flat list
        catSelect.innerHTML =
          '<option value="">Tất cả danh mục</option>' +
          categories
            .map((c) => `<option value="${c.id}">${c.name}</option>`)
            .join("");
      } catch (e) {
        console.error("Populate filter cat failed", e);
      }
    }

    if (brandSelect.options.length <= 1) {
      try {
        const brands = await api.getBrands();
        brandSelect.innerHTML =
          '<option value="">Tất cả nhãn hàng</option>' +
          brands
            .map((b) => `<option value="${b.id}">${b.name}</option>`)
            .join("");
      } catch (e) {
        console.error("Populate filter brand failed", e);
      }
    }
  }
}
