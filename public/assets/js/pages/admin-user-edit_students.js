// =============================
// 共通モジュール読み込み
// =============================
 import { getCurrentRole, withRole } from "../common/role.js";

// HTMLの読み込みが完了してから処理を開始する
document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // 選択し学生名&番号表示、削除機能
  // ============================
  
  // ============================
  // URLから学生IDを取得
  // ============================

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");


  // DOM取得
  const studentIdEl = document.getElementById("student-id");// id="student-id"の要素を取得
  const studentNameEl = document.getElementById("student-name");
  const deleteBtn = document.getElementById("delete-btn");
  const registerBtn = document.getElementById("submit-btn");

  // IDが無ければ処理停止
  if (!studentId) {
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
  // 学生情報1件取得API
  // ============================
  fetch(`/attendance-management-app/backend/php/get_student_detail.php?id=${studentId}`)
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
    const student = data.student || data;

    // 念のためnullチェック
    if (!student) {
      throw new Error("データが空です");
    }

    window.currentClassId = student.class_id;

    // 画面に表示
      studentIdEl.textContent = student.student_id;
      studentNameEl.textContent = student.student_name;

    // 学生情報取得後にコース一覧取得
    loadClasses();
    
    })
    .catch(err => {
      console.error("取得エラー:", err);
      alert("データ取得に失敗しました");
    });

  // ====================================
  // コース選択プルダウンにコース一覧を取得
  // ====================================
  async function loadClasses() {

    try {

      const response = await fetch(
        "/attendance-management-app/backend/php/get_classes.php"
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error("クラス取得失敗");
      }

      const select = document.getElementById("course");

      // 初期化
      select.innerHTML =
        '<option value="">選択してください</option>';

      result.classes.forEach(classItem => {

        const option = document.createElement("option");

        option.value = classItem.class_id;
        option.textContent = classItem.class_name;

        // 現在所属コースなら選択状態にする
        if (
            Number(classItem.class_id) ===
            Number(window.currentClassId)
        ) {
            option.selected = true;
        }

        select.appendChild(option);

      });

    } catch (error) {

      console.error("クラス取得エラー:", error);

      alert("クラス一覧の取得に失敗しました");
    }
  }

  // ============================
  // 削除処理
  // ============================
  deleteBtn.addEventListener("click", () => {

    // 確認ダイアログ（重要）
    const confirmDelete = confirm("この学生を削除します。本当によろしいですか？");

    if (!confirmDelete) return;

    fetch("/attendance-management-app/backend/php/delete_student.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        student_id: studentId  // 文字列型に変換し、phpに渡している。
      })
    })
     .then(res => {
      if (!res.ok) {
        return res.text().then(text => {
          console.error("削除APIエラー:", text);
          throw new Error("削除通信失敗");
        });
      }
      return res.json();
    })
    .then(data => {

      if (!data.success) {
        throw new Error(data.error);
      }

      alert("削除しました");
      window.location.href = withRole(
        "/attendance-management-app/public/pages/admin/admin_user-management.html"
      );
    })
    .catch(err => {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    });

  });

  // ============================
  // 登録処理(コース変更)
  // ============================
registerBtn.addEventListener("click", async () => {

  try {

    const courseSelect =
      document.getElementById("course");

    const formData = new FormData();

    formData.append("student_id", studentId);
    formData.append("course_id", courseSelect.value);

    const response = await fetch(
      "/attendance-management-app/backend/php/update_student_course.php",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();

    if (result.status !== "success") {
      throw new Error(result.message);
    }

    alert(result.message);

    window.location.href = withRole(
      "/attendance-management-app/public/pages/admin/admin_user-management.html"
    );

  } catch (error) {

    console.error(error);

    alert("コース変更に失敗しました");
  }

});

});