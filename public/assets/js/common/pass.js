// =============================================
// パスワード表示 / 非表示 切り替え処理
// =============================================
document.addEventListener("DOMContentLoaded", () => {

  // パスワード入力欄 + 目ボタンのセットを全部取得
  const passwordFields = document.querySelectorAll(".password-field");

  // 対象がなければ何もしない
  if (passwordFields.length === 0) {
    return;
  }

  passwordFields.forEach((field) => {
    const passwordInput = field.querySelector(".form-input");
    const toggleButton = field.querySelector(".eye-btn");

    // input または button がなければ、そのセットは処理しない
    if (!passwordInput || !toggleButton) {
      return;
    }

    // 目アイコンの状態を更新
    function updateToggleButton(isVisible) {
      
      // 非表示中なら「表示できる」目アイコン
      // 表示中なら「隠せる」アイコン
      toggleButton.textContent = isVisible ? "👁" : "🙈";

      // アクセシビリティ属性更新
      toggleButton.setAttribute("aria-pressed", String(isVisible));
      toggleButton.setAttribute(
        "aria-label",
        isVisible ? "パスワードを表示" : "パスワードを非表示"
      );
    }

    // 初期状態を反映
    updateToggleButton(passwordInput.type === "text");

    // ボタンクリックで表示切替
    toggleButton.addEventListener("click", () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden ? "text" : "password";
      updateToggleButton(isHidden);
    });
  });
});