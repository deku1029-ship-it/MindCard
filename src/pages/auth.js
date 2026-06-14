import { api } from "../api.js";
import { getAuthModalHTML } from "../components/authModal.js";

export class AuthController {
  constructor() {
    this.isLoginMode = true;
    this.init();
  }

  init() {
    // Render Modal vào DOM
    document.getElementById("auth-modal-container").innerHTML =
      getAuthModalHTML();

    // Cache DOM elements
    this.modal = document.getElementById("auth-modal");
    this.backdrop = document.getElementById("auth-backdrop");
    this.box = document.getElementById("auth-box");

    this.form = document.getElementById("auth-form");
    this.title = document.getElementById("auth-title");
    this.submitBtn = document.getElementById("auth-submit-btn");
    this.switchBtn = document.getElementById("auth-switch-btn");
    this.switchText = document.getElementById("auth-switch-text");
    this.registerFields = document.getElementById("register-fields");
    this.alertBox = document.getElementById("alert-box");

    this.usernameInput = document.getElementById("auth-username");
    this.emailInput = document.getElementById("auth-email");
    this.passwordInput = document.getElementById("auth-password");
    this.confirmPasswordInput = document.getElementById(
      "auth-confirm-password",
    );

    this.navLoginBtn = document.getElementById("nav-login-btn");

    this.bindEvents();
    this.updateNavUI();
  }

  bindEvents() {
    // Toggle Modal
    this.navLoginBtn?.addEventListener("click", () => {
      if (api.isLoggedIn()) {
        if (confirm("Bạn có muốn đăng xuất không?")) {
          api.logout();
          window.resetAIChat?.();
          this.updateNavUI();
        }
      } else {
        this.isLoginMode = true;
        this.updateModalUI();
        this.openModal();
      }
    });

    document
      .getElementById("nav-register-btn")
      ?.addEventListener("click", () => {
        this.isLoginMode = false;
        this.updateModalUI();
        this.openModal();
      });

    document
      .getElementById("close-auth")
      .addEventListener("click", () => this.closeModal());
    this.backdrop.addEventListener("click", () => this.closeModal());

    // Toggle Login / Register
    this.switchBtn.addEventListener("click", () => {
      this.isLoginMode = !this.isLoginMode;
      this.updateModalUI();
    });

    // Submit Form
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  openModal() {
    this.modal.classList.remove("hidden");
    // Kích hoạt animation ở frame kế tiếp
    requestAnimationFrame(() => {
      this.backdrop.classList.remove("opacity-0");
      this.box.classList.remove("opacity-0", "scale-95");
    });
  }

  closeModal() {
    this.backdrop.classList.add("opacity-0");
    this.box.classList.add("opacity-0", "scale-95");
    setTimeout(() => {
      this.modal.classList.add("hidden");
      this.hideAlert();
    }, 300);
  }

  updateModalUI() {
    this.hideAlert();
    if (this.isLoginMode) {
      this.title.textContent = "Đăng Nhập";
      this.submitBtn.textContent = "Đăng Nhập";
      this.switchText.textContent = "Chưa có tài khoản?";
      this.switchBtn.textContent = "Đăng ký ngay";
      this.registerFields.classList.add("hidden");
      this.usernameInput.required = false;
      this.confirmPasswordInput.required = false;
      this.confirmPasswordInput.value = "";
    } else {
      this.title.textContent = "Đăng Ký Tài Khoản";
      this.submitBtn.textContent = "Đăng Ký";
      this.switchText.textContent = "Đã có tài khoản?";
      this.switchBtn.textContent = "Đăng nhập";
      this.registerFields.classList.remove("hidden");
      this.usernameInput.required = true;
      this.confirmPasswordInput.required = true;
    }
  }

  updateNavUI() {
    if (!this.navLoginBtn) return;

    const registerBtn = document.getElementById("nav-register-btn");
    const authDivider = document.getElementById("auth-divider");
    const headerOrdersBtn = document.getElementById("header-orders-btn");

    if (api.isLoggedIn()) {
      const user = api.getUser();
      this.navLoginBtn.textContent = `Chào, ${user.username || "User"}`;
      this.navLoginBtn.classList.replace("btn-primary", "bg-slate-100");
      this.navLoginBtn.classList.add("text-slate-900");

      // Show history buttons when logged in
      registerBtn?.classList.add("hidden");
      authDivider?.classList.add("hidden");
      headerOrdersBtn?.classList.remove("hidden");
    } else {
      this.navLoginBtn.textContent = "Đăng nhập";
      this.navLoginBtn.classList.replace("bg-slate-100", "btn-primary");
      this.navLoginBtn.classList.remove("text-slate-900");

      // Show register stuff when logged out
      registerBtn?.classList.remove("hidden");
      authDivider?.classList.remove("hidden");
      headerOrdersBtn?.classList.add("hidden");
    }

    // Sync Admin button visibility
    window.adminController?.checkAdminRole();
  }

  showAlert(message, isError = true) {
    this.alertBox.textContent = message;
    this.alertBox.className = `mb-4 p-3 rounded-lg text-sm font-medium ${isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`;
    this.alertBox.classList.remove("hidden");
  }

  hideAlert() {
    this.alertBox.classList.add("hidden");
  }

  async handleSubmit() {
    const email = this.emailInput.value;
    const password = this.passwordInput.value;
    const username = this.usernameInput.value;
    const confirmPassword = this.confirmPasswordInput?.value || "";

    this.submitBtn.disabled = true;
    this.submitBtn.innerHTML =
      '<span class="animate-pulse">Đang xử lý...</span>';

    try {
      if (this.isLoginMode) {
        await api.login(email, password);
        window.resetAIChat?.();
        // Sync cart if exists
        if (window.cartController) await window.cartController.syncGuestCart();
        this.closeModal();
        this.updateNavUI();
      } else {
        if (password !== confirmPassword) {
          this.showAlert("Mật khẩu nhập lại không khớp");
          return;
        }

        await api.register(username, email, password, confirmPassword);
        this.showAlert("Đăng ký thành công! Đang tự động đăng nhập...", false);
        // Auto login after register
        setTimeout(async () => {
          await api.login(email, password);
          window.resetAIChat?.();
          // Sync cart if exists
          if (window.cartController)
            await window.cartController.syncGuestCart();
          this.closeModal();
          this.updateNavUI();
        }, 1500);
      }
    } catch (error) {
      this.showAlert(error.message);
    } finally {
      if (this.isLoginMode) {
        this.submitBtn.textContent = "Đăng Nhập";
      } else {
        this.submitBtn.textContent = "Đăng Ký";
      }
      this.submitBtn.disabled = false;
    }
  }
}
