document.addEventListener("DOMContentLoaded", async () => {
  await Auth.init();
});

const Auth = {
  // =============================
  // 設定
  // =============================
  storageKey: "loginUser",

  // ログイン不要ページ
  publicPages: [
    "/attendance/public/pages/admin/admin.html",
    "/attendance/public/pages/student/student.html",
    "/attendance/public/pages/teacher/teacher.html"
  ],

  // ロールごとのログイン画面
  loginPageMap: {
    admin: "/attendance/public/pages/admin/admin.html",
    student: "/attendance/public/pages/student/student.html",
    teacher: "/attendance/public/pages/teacher/teacher.html"
  },

  // ロールごとのログイン後のメニュー画面
  menuPageMap: {
    admin: "/attendance/public/pages/admin/admin_dashboard.html",
    student: "/attendance/public/pages/student/student_dashboard.html",
    teacher: "/attendance/public/pages/teacher/teacher_dashboard.html"
  },

  // =============================
  // 初期化
  // =============================
  async init() {
    if (!this.isPublicPage()) {
      const session = await this.checkSession();

      if (!session) {
        const role = this.getRoleFromPath();

        window.location.href =
          this.loginPageMap[role] ||
          "/attendance/public/pages/student/student.html";
        return;
      }

      // サーバーのセッション情報をローカルに同期
      const localUser = this.getLoginUser();
      if (!localUser || localUser.role !== session.role) {
        this.saveLogin({
          id: session.user_id,
          role: session.role,
          name: localUser?.name || "ログインユーザー"
        });
      }
    }

    this.bindLogoutButton();
    this.bindBackButton();
    this.showLoginUserName();

    const pageRole = this.getRoleFromPath();
    if (pageRole && !this.isPublicPage()) {
      this.requireRole(pageRole);
    }
  },

  // =============================
  // セッション確認（サーバー側）
  // =============================
  async checkSession() {
    try {
      const response = await fetch(
        "/attendance/backend/php/check_session.php",
        {
          method: "GET",
          credentials: "same-origin"
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return null;
      }

      return data;
    } catch (error) {
      console.error("セッション確認エラー:", error);
      return null;
    }
  },

  // =============================
  // ローカル保存
  // =============================
  saveLogin(userData) {
    sessionStorage.setItem(this.storageKey, JSON.stringify(userData));
  },

  // =============================
  // ログイン情報を取得
  // =============================
  getLoginUser() {
    const user = sessionStorage.getItem(this.storageKey);

    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      console.error("ログイン情報の読み込みに失敗しました:", error);
      return null;
    }
  },

  // =============================
  // ログイン済みか判定
  // =============================
  isLoggedIn() {
    return this.getLoginUser() !== null;
  },

  // =============================
  // 現在ページがログイン不要ページか判定
  // =============================
  isPublicPage() {
    return this.publicPages.includes(window.location.pathname);
  },

  // =============================
  // 現在のパスから対象ロールを推定
  // =============================
  getRoleFromPath() {
    const path = window.location.pathname;

    if (path.startsWith("/attendance/public/pages/admin/")) return "admin";
    if (path.startsWith("/attendance/public/pages/student/")) return "student";
    if (path.startsWith("/attendance/public/pages/teacher/")) return "teacher";

    return null;
  },

  // =============================
  // ロールチェック
  // =============================
  requireRole(role) {
    const user = this.getLoginUser();

    if (!user) {
      window.location.href =
        this.loginPageMap[role] ||
        "/attendance/public/pages/student/student.html";
      return;
    }

    if (user.role !== role) {
      alert("このページにアクセスする権限がありません。");

      window.location.href =
        this.menuPageMap[user.role] ||
        "/attendance/public/pages/student/student_dashboard.html";
    }
  },

  // =============================
  // ログアウト
  // =============================
  async logout() {
    const user = this.getLoginUser();
    const role = user?.role;

    try {
      await fetch("/attendance/backend/php/logout.php", {
        method: "GET",
        credentials: "same-origin"
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    sessionStorage.removeItem(this.storageKey);

    window.location.href =
      this.loginPageMap[role] ||
      "/attendance/public/pages/student/student.html";
  },

  // =============================
  // ログイン後遷移
  // =============================
  redirectByRole(user) {
    if (!user || !user.role) {
      alert("ユーザー情報が不正です。");
      return;
    }

    window.location.href = this.menuPageMap[user.role];
  },

  // =============================
  // UI系
  // =============================
  bindBackButton() {
    const backBtn =
      document.getElementById("back-btn") ||
      document.querySelector(".back-btn");

    if (!backBtn) return;

    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  },

  bindLogoutButton() {
    const logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
      if (confirm("ログアウトしますか？")) {
        await this.logout();
      }
    });
  },

  showLoginUserName() {
    const el = document.getElementById("login-name");
    const user = this.getLoginUser();

    if (!el || !user) return;

    el.textContent = user.name;
  }
};