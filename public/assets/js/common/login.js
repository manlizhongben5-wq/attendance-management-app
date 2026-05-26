document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // 現在のページからロールを取得 (既存の関数を利用)
  function getRoleFromLoginPage() {
    const path = window.location.pathname;
    if (path.endsWith("/admin.html")) return "admin";
    if (path.endsWith("/student.html")) return "student";
    if (path.endsWith("/teacher.html")) return "teacher";
    return null;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userIdInput = document.getElementById("user-id");
    const passwordInput = document.getElementById("password");
    const expectedRole = getRoleFromLoginPage();

    if (!userIdInput || !passwordInput || !expectedRole) {
      alert("入力情報または権限情報が不足しています。");
      return;
    }

    // PHPへ送るデータの準備
    const formData = new FormData();
    formData.append("id", userIdInput.value.trim());
    formData.append("password", passwordInput.value.trim());
    formData.append("role", expectedRole);

    try {
      // login.php へのフェッチ処理
      const response = await fetch("/attendance/backend/php/login.php", { // パスは適宜調整してください
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("サーバーとの通信に失敗しました。");

      const result = await response.json();

      if (result.status === "success") {
        // ログイン成功時
        const loginUser = {
          id: userIdInput.value.trim(),
          name: result.name || "ユーザー", // PHP側で名前を返すようにすると親切です
          role: expectedRole
        };

        Auth.saveLogin(loginUser);
        Auth.redirectByRole(loginUser);
      } else {
        // ログイン失敗時（ID/パスワード間違いなど）
        alert(result.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("エラーが発生しました。しばらく経ってからやり直してください。");
    }
  });
});