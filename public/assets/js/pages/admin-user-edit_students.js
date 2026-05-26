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

  // IDが無ければ処理停止
  if (!studentId) {
    alert("IDが取得できません");
    return;
  }

  // 数値に変換
  const studentIdNum = Number(studentId);

  if (Number.isNaN(studentIdNum)) {
    alert("IDが不正です");
    return;
  }

  // ============================
  // 学生情報1件取得API
  // ============================
  fetch(`/attendance/backend/php/get_student_detail.php?id=${studentId}`)
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

    // 画面に表示
      studentIdEl.textContent = student.student_id;
      studentNameEl.textContent = student.student_name;
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
    const confirmDelete = confirm("この学生を削除します。本当によろしいですか？");

    if (!confirmDelete) return;

    fetch("/attendance/backend/php/delete_student.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        student_id: studentIdNum // 数値で送る
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