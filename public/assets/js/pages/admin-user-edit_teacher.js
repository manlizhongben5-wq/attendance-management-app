// HTMLの読み込みが完了してから処理を開始する
document.addEventListener("DOMContentLoaded", () => {
  // ============================
  // 選択した教員名&番号表示、削除機能
  // ============================
  
  // ============================
  // URLから教員IDを取得
  // ============================
  const params = new URLSearchParams(window.location.search);
  const teacherId = params.get("id");

  // DOM取得
  const teacherIdEl = document.getElementById("teacher-id");// id="teacher-id"の要素を取得
  const teacherNameEl = document.getElementById("teacher-name");
  const deleteBtn = document.getElementById("delete-btn");

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
  fetch(`/attendance/backend/php/get_teacher_detail.php?id=${teacherId}`)
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
      teacherIdEl.textContent = teacher.teacher_id;
      teacherNameEl.textContent = teacher.teacher_name;
    })
    .catch(err => {
      console.error("取得エラー:", err);
      alert("データ取得に失敗しました");
    });

  // ============================
  // 削除処理
  // ============================
  deleteBtn.addEventListener("click", () => {

    // 確認ダイアログ（重要）
    const confirmDelete = confirm("この教員を削除します。本当によろしいですか？");

    if (!confirmDelete) return;

    fetch("/attendance/backend/php/delete_teacher.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        teacher_id: teacherIdNum // 数値で送る
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
      window.location.href = "admin_user-management.html";
    })
    .catch(err => {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    });

  });

});