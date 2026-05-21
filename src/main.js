import "./style.css";
import { api } from "./api.js";
import { initChatbot } from "./chatbot.js";
import { AuthController } from "./pages/auth.js";
import { HomePage } from "./pages/home.js";
import { CartController } from "./pages/cart.js";
import { OrderController } from "./pages/orders.js";
import { AdminController } from "./pages/admin.js";
import { ProductDetail } from "./pages/productDetail.js";
import { SearchController } from "./pages/search.js";
import { CheckoutPage } from "./pages/checkout.js";

document.addEventListener("DOMContentLoaded", () => {
  const navEl = document.querySelector("nav");

  // 1. Khởi tạo Cấu hình hệ thống (Logo, ...)
  initSystemSettings();

  // 2. Khởi tạo Widget Chatbot
  initChatbot();

  // 2. Tích hợp Quản lý Đăng nhập Auth
  new AuthController();

  // 3. Khởi tạo tính năng Trang chủ
  window.homePage = new HomePage();

  // 4. Khởi tạo Giỏ hàng
  window.cartController = new CartController();

  // 5. Khởi tạo Admin Dashboard
  new AdminController();

  // 6. Khởi tạo Trang Chi tiết Sản phẩm
  window.productDetail = new ProductDetail();

  // 7. Khởi tạo Tìm kiếm & Lọc
  window.searchController = new SearchController();

  // 8. Khởi tạo Trang Thanh toán
  window.checkoutPage = new CheckoutPage();

  // 9. Khởi tạo Trang Đơn hàng của tôi
  window.orderController = new OrderController();

  // 9. Routing Handler
  function handleLocation() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // --- CLEAN COMPONENT-BASED ROUTING ---
    // Every .show() method is now responsible for clearing #app-content and injecting its view.

    // Hide Admin Panel if we are not on /admin
    if (path !== "/admin" && window.adminController) {
      window.adminController.close(false);
    }

    if (path.startsWith("/product/")) {
      const productId = path.split("/").pop();
      if (window.productDetail) {
        window.productDetail.show(productId);
      }
      updateNavActive(null);
    } else if (path === "/admin") {
      // Client-side Guard: Redirect if not admin
      const user = api.getUser();
      const token = localStorage.getItem("auth_token");
      let isAdmin = false;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          isAdmin = payload.role === "admin";
        } catch (e) {}
      }

      if (!isAdmin) {
        console.warn(
          "[Security] Unauthorized access to /admin. Redirecting to home...",
        );
        window.history.replaceState({}, "", "/");
        if (window.homePage) window.homePage.show();
        updateNavActive("nav-home-link");
        return;
      }

      if (window.adminController) {
        window.adminController.open(false);
      }
      updateNavActive(null);
    } else if (path === "/checkout") {
      if (window.checkoutPage) {
        window.checkoutPage.show();
      }
      updateNavActive(null);
    } else if (
      params.get("q") ||
      params.get("category_id") ||
      params.get("brand_id") ||
      params.get("view") === "products" ||
      params.get("on_sale") === "true"
    ) {
      if (window.searchController) {
        window.searchController.showSearch();
      }
      updateNavActive("nav-products-link");
    } else if (path === "/orders") {
      if (window.orderController) {
        window.orderController.show();
      }
      updateNavActive("nav-orders-link");
    } else {
      // Default: Home Page
      if (window.homePage) {
        window.homePage.show();
      }
      updateNavActive("nav-home-link");
    }
  }

  function updateNavActive(activeId) {
    const links = ["nav-home-link", "nav-products-link"];
    links.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === activeId) {
        el.classList.add("text-[#1c69d4]");
        el.classList.remove("text-gray-500", "text-[#bbbbbb]");
      } else {
        el.classList.add("text-gray-500", "text-[#bbbbbb]");
        el.classList.remove("text-[#1c69d4]");
      }
    });
  }

  async function initSystemSettings() {
    try {
      const settings = await api.getSettings();
      /* 
            if (settings.logo_url) {
                // Update Nav Logo
                const navLogo = document.getElementById('nav-logo');
                if (navLogo) {
                    navLogo.innerHTML = `<img src="${settings.logo_url}" alt="Logo" class="h-12 w-auto object-contain transition-all duration-500 group-hover:scale-110">`;
                }
                // Update Footer Logo
                const footerLogo = document.getElementById('footer-logo-container');
                if (footerLogo) {
                    footerLogo.innerHTML = `<img src="${settings.logo_url}" alt="Logo" class="h-16 w-auto object-contain">`;
                }
            }
            */
    } catch (e) {
      console.error("Init settings failed", e);
    }
  }

  // 9. Điều hướng - Xử lý click các link trên Navbar
  const homeLink = document.getElementById("nav-home-link");
  const productsLink = document.getElementById("nav-products-link");
  const navLogo = document.getElementById("nav-logo");

  homeLink?.addEventListener("click", (e) => {
    e.preventDefault();
    window.history.pushState({}, "", "/");
    handleLocation();
  });

  productsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    window.history.pushState({}, "", "/?view=products");
    handleLocation();
  });

  navLogo?.addEventListener("click", () => {
    window.history.pushState({}, "", "/");
    handleLocation();
  });

  let lastScrollY = window.scrollY;
  let lastDirection = 0;
  const scrollThreshold = 6;
  const minOffset = 80;

  function updateNavVisibility() {
    if (!navEl) return;
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    if (Math.abs(delta) < scrollThreshold) return;

    if (currentY <= minOffset) {
      navEl.classList.remove("nav-hidden");
      lastDirection = 0;
    } else if (delta > 0 && lastDirection !== 1) {
      navEl.classList.add("nav-hidden");
      lastDirection = 1;
    } else if (delta < 0 && lastDirection !== -1) {
      navEl.classList.remove("nav-hidden");
      lastDirection = -1;
    }

    lastScrollY = currentY;
  }

  window.addEventListener("scroll", updateNavVisibility, { passive: true });

  // Initial load
  handleLocation();

  // Browser Back/Forward buttons handler
  window.addEventListener("popstate", () => {
    handleLocation();
  });

  // Expose handleLocation globally
  window.handleLocation = handleLocation;

  // Expose showProductDetail globally for components like ProductCard
  window.showProductDetail = (productId) => {
    window.history.pushState({ productId }, "", `/product/${productId}`);
    handleLocation();
  };
});
