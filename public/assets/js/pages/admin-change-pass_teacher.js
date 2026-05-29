// HTMLの読み込みが完了してから処理を開始する
document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // 選択した教員名&種別表示、パスワード変更機能
  // ============================
  

  // URLから教員IDを取得
  const params = new URLSearchParams(window.location.search);
  const teacherId = params.get("id");

  // type取得
  const type = params.get("user_type");
  console.log("usertype:",type);

  // teacher以外なら処理しない
  if (type !== "teacher") {
    return;
  }

  // DOM取得
  const teacherIdEl = document.getElementById("teacher-id");// id="teacher-id"の要素を取得
  const userNameEl = document.getElementById("user-name");
  const userTypeEl = document.getElementById("user-type");
  const deleteBtn = document.getElementById("delete-btn");
  
  const newPasswordEl = document.getElementById("new-password");
  const confirmPasswordEl = document.getElementById("confirm-password");
  const updatePasswordBtn = document.getElementById("update-password-btn");

  // IDが無ければ処理停止
  if (!teacherId) {
    alert("IDが取得できません");
    return;
  }

  // 数値に変換
  const teacherIdNum = Number(teacherId);

  if (Number.isNaN(teacherIdNum)) {
    alert("IDが不正です");
    return;
  }

  // ============================
  // 教員情報1件取得API
  // ============================
  fetch(`/attendance-management-app/backend/php/get_teacher_detail.php?id=${teacherId}`)
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

      if (!data.success) {
        throw new Error(data.error);
      }

    // APIの構造に合わせて調整
    const teacher = data.teacher || data;

    // 念のためnullチェック
    if (!teacher) {
      throw new Error("データが空です");
    }

    // 画面に表示
    userNameEl.textContent = teacher.teacher_name;

    userTypeEl.textContent = "教員";

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

    formData.append("role", "teacher");
    formData.append("user_id", teacherId);

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

    // 入力欄初期化
    newPasswordEl.value = "";
    confirmPasswordEl.value = "";

  } catch (error) {

    console.error(error);

    alert("パスワード変更に失敗しました");
  }
});

});