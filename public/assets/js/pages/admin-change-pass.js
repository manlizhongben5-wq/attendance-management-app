// =============================
// 共通モジュール読み込み
// =============================
 import { getCurrentRole, withRole } from "../common/role.js";

// HTMLの読み込みが完了してから処理を開始する
document.addEventListener("DOMContentLoaded", () => {

  // ============================
  // 選択したユーザー名&種別表示、パスワード変更機能
  // ============================
  

  // URLからユーザーIDを取得
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");
  const role = getCurrentRole();

  // DOM取得
  const userNameEl = document.getElementById("user-name");
  const userTypeEl = document.getElementById("user-type");
  
  const newPasswordEl = document.getElementById("new-password");
  const confirmPasswordEl = document.getElementById("confirm-password");
  const updatePasswordBtn = document.getElementById("update-password-btn");

  // IDが無ければ処理停止
  if (!userId) {
    alert("IDが取得できません");
    return;
  }

  // =============================
  // 前画面の同じroleに戻る
  // =============================
  const backBtn = document.getElementById("backBtn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = withRole(
        "/attendance-management-app/public/pages/admin/admin_user-management.html"
      );
    });
  }

  // ============================
  // ユーザー情報1件取得API
  // ============================
  const detailApi =
    role === "teacher"
      ? "/attendance-management-app/backend/php/get_teacher_detail.php"
      : "/attendance-management-app/backend/php/get_student_detail.php";

  fetch(`${detailApi}?id=${userId}`)
  
    .then(res => {
      if (!res.ok) {
        // サーバーエラー内容を確認
        return res.text().then(text => {
          console.error("サーバーエラー:", text);
          throw new Error("通信失敗");
        });
      }
      return res.json();
    })
    .then(data => {

      if (data.success === false) {
        throw new Error(data.error);
      }

    // APIの構造に合わせて調整
    const user =
      role === "teacher"
        ? data.teacher
        : data.student;

    // 念のためnullチェック
    if (!user) {
      throw new Error("データが空です");
    }

    // 画面に表示
    userNameEl.textContent =
      role === "teacher"
        ? user.teacher_name
        : user.student_name;

    userTypeEl.textContent =
      role === "teacher"
        ? "教員"
        : "学生";

    })
    .catch(err => {

      console.error("取得エラー:", err);

      alert("データ取得に失敗しました");
    });

  // ============================
  // パスワード変更処理API
  // ============================
  // パスワード変更ボタン
  updatePasswordBtn.addEventListener("click", async () => {

  const newPassword = newPasswordEl.value;
  const confirmPassword = confirmPasswordEl.value;

  // 未入力チェック
  if (!newPassword || !confirmPassword) {

    alert("未入力の項目があります");

    return;
  }

  // 一致チェック
  if (newPassword !== confirmPassword) {

    alert("パスワードが一致しません");

    return;
  }

  try {

    const formData = new FormData();

    formData.append("role", role);
    formData.append("user_id", userId);

    formData.append("new_password", newPassword);

    formData.append(
      "confirm_password",
      confirmPassword
    );

    const response = await fetch(
      "/attendance-management-app/backend/php/update_password.php",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!data.status || data.status !== "success") {

      throw new Error(
        data.message || "変更失敗"
      );
    }

    alert("パスワードを変更しました");
    window.location.href = withRole(
        "/attendance-management-app/public/pages/admin/admin_user-management.html"
      );

    // 入力欄初期化
    newPasswordEl.value = "";
    confirmPasswordEl.value = "";

  } catch (error) {

    console.error(error);

    alert("パスワード変更に失敗しました");
  }
});

});