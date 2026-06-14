class ApiService {
  constructor() {
    this.baseUrl = "/api";
  }

  // Helper nội bộ xử lý fetch
  async _fetch(endpoint, options = {}) {
    const token = localStorage.getItem("auth_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Tự động xử lý nếu Token hết hạn hoặc không hợp lệ
        if (response.status === 401 || response.status === 403) {
          if (
            data.error &&
            (data.error.includes("Token") || data.error.includes("Thiếu"))
          ) {
            console.warn("[Session Expired] Logging out...");
            this.logout();
            // Chuyển hướng về home hoặc login nếu đang ở trang bảo mật
            if (
              window.location.pathname.startsWith("/admin") ||
              window.location.pathname.startsWith("/checkout")
            ) {
              window.location.href = "/";
            }
          }
        }
        throw new Error(data.error || "Server error");
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  }

  // -- Các API liên quan tới Sản phẩm --

  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this._fetch(`/products${query ? "?" + query : ""}`);
  }

  async getRecommendations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this._fetch(
      `/products/recommendations${query ? "?" + query : ""}`,
    );
  }

  async getBestSellers() {
    return await this._fetch("/products/best-sellers");
  }

  async getProductById(id) {
    return await this._fetch(`/products/${id}`);
  }

  async getRelatedProducts(productId) {
    return await this._fetch(`/products/${productId}/related`);
  }

  async getReviews(productId) {
    return await this._fetch(`/products/${productId}/reviews`);
  }

  async addReview(productId, rating, comment) {
    return await this._fetch(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  }

  async trackBehavior(productId, actionType = "view") {
    const token = localStorage.getItem("auth_token");
    if (!token) return; // Silent return for guests
    return await this._fetch(`/products/${productId}/track`, {
      method: "POST",
      body: JSON.stringify({ actionType }),
    });
  }

  // -- Các API dành riêng cho Admin --

  async getAdminStats() {
    return await this._fetch("/admin/stats");
  }

  async getAdminUsers() {
    return await this._fetch("/admin/users");
  }

  // -- Category API --
  async getCategories(tree = false) {
    return await this._fetch(`/categories?tree=${tree}`);
  }

  async createCategory(data) {
    return await this._fetch("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id, data) {
    return await this._fetch(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id) {
    return await this._fetch(`/categories/${id}`, { method: "DELETE" });
  }

  // -- Brand API --
  async getBrands(tree = false) {
    return await this._fetch(`/brands?tree=${tree}`);
  }

  async createBrand(data) {
    return await this._fetch("/brands", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBrand(id, data) {
    return await this._fetch(`/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteBrand(id) {
    return await this._fetch(`/brands/${id}`, { method: "DELETE" });
  }

  async updateUserRole(id, role) {
    return await this._fetch(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id) {
    return await this._fetch(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  // -- Các API liên quan tới Auth --

  async login(email, password) {
    const data = await this._fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_info", JSON.stringify(data.user));
    }

    return data;
  }

  async register(username, email, password, confirmPassword) {
    return await this._fetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, confirmPassword }),
    });
  }

  logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("ai_chat_history");
    localStorage.removeItem("ai_chat_open");
  }

  isLoggedIn() {
    return !!localStorage.getItem("auth_token");
  }

  getUser() {
    const info = localStorage.getItem("user_info");
    return info ? JSON.parse(info) : null;
  }

  // -- Management API (Units, Staff, Tasks, Evaluations) --

  // Units
  async getUnits() {
    return await this._fetch("/management/units");
  }
  async createUnit(data) {
    return await this._fetch("/management/units", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateUnit(id, data) {
    return await this._fetch(`/management/units/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteUnit(id) {
    return await this._fetch(`/management/units/${id}`, { method: "DELETE" });
  }

  // Staff
  async getStaff() {
    return await this._fetch("/management/staff");
  }
  async createStaff(member) {
    return await this._fetch("/management/staff", {
      method: "POST",
      body: JSON.stringify(member),
    });
  }
  async updateStaff(id, member) {
    return await this._fetch(`/management/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(member),
    });
  }
  async deleteStaff(id) {
    return await this._fetch(`/management/staff/${id}`, { method: "DELETE" });
  }

  // Tasks
  async getTasks() {
    return await this._fetch("/management/tasks");
  }
  async createTask(task) {
    return await this._fetch("/management/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }
  async updateTask(id, task) {
    return await this._fetch(`/management/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    });
  }
  async deleteTask(id) {
    return await this._fetch(`/management/tasks/${id}`, { method: "DELETE" });
  }

  // Evaluations
  async getEvaluations() {
    return await this._fetch("/management/evaluations");
  }
  async createEvaluation(evalData) {
    return await this._fetch("/management/evaluations", {
      method: "POST",
      body: JSON.stringify(evalData),
    });
  }
  async updateEvaluation(id, evalData) {
    return await this._fetch(`/management/evaluations/${id}`, {
      method: "PUT",
      body: JSON.stringify(evalData),
    });
  }
  async deleteEvaluation(id) {
    return await this._fetch(`/management/evaluations/${id}`, {
      method: "DELETE",
    });
  }

  // -- Giỏ hàng (Cart) --
  async getCart() {
    return await this._fetch("/cart");
  }
  async addToCart(productId, quantity = 1) {
    return await this._fetch("/cart/add", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }
  async updateCartItem(itemId, quantity) {
    return await this._fetch(`/cart/update/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  }
  async removeFromCart(itemId) {
    return await this._fetch(`/cart/${itemId}`, { method: "DELETE" });
  }
  async clearCart() {
    return await this._fetch("/cart", { method: "DELETE" });
  }

  // -- Đơn hàng (Orders) --
  async getMyOrders() {
    return await this._fetch("/orders/my-orders");
  }
  async getOrderById(id) {
    return await this._fetch(`/orders/${id}`);
  }
  async cancelOrder(id) {
    return await this._fetch(`/orders/${id}/cancel`, { method: "PUT" });
  }

  // -- System Settings & Uploads --
  async getSettings() {
    return await this._fetch("/settings");
  }

  async updateSettings(settings) {
    return await this._fetch("/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("auth_token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Không dùng _fetch vì _fetch mặc định set Content-Type: application/json
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Upload failed");
    return data;
  }
}

export const api = new ApiService();
