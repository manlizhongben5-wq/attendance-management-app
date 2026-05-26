document.addEventListener("DOMContentLoaded", () => {
  // =============================
  // 要素取得
  // =============================
  const form = document.querySelector(".password-change-form");
  const subjectNameInput = document.getElementById("number");
  const totalLessonsInput = document.getElementById("name");
  const submitBtn = document.querySelector(".submit-btn");

  // 必須要素がなければ終了
  if (!form || !subjectNameInput || !totalLessonsInput || !submitBtn) {
    return;
  }

  // =============================
  // 入力値取得
  // =============================
  function getFormData() {
    return {
      subjectName: subjectNameInput.value.trim(),
      totalLessons: totalLessonsInput.value.trim()
    };
  }

  // =============================
  // 入力チェック
  // =============================
  function validateForm(data) {
    // 教科名必須
    if (!data.subjectName) {
      alert("追加する教科名を入力してください");
      subjectNameInput.focus();
      return false;
    }

    // 総コマ数は未入力OKにする場合
    if (data.totalLessons !== "") {
      // 半角数字のみチェック
      if (!/^\d+$/.test(data.totalLessons)) {
        alert("総コマ数は半角数字で入力してください");
        totalLessonsInput.focus();
        return false;
      }

      // 0以下を禁止
      if (Number(data.totalLessons) <= 0) {
        alert("総コマ数は1以上で入力してください");
        totalLessonsInput.focus();
        return false;
      }
    }

    return true;
  }

  // =============================
  // 仮登録処理
  // =============================
  function registerSubject() {
    const formData = getFormData();

    if (!validateForm(formData)) {
      return;
    }

    const newSubject = {
      subjectName: formData.subjectName,
      totalLessons: formData.totalLessons === "" ? null : Number(formData.totalLessons)
    };

    // デバッグ確認用
    console.log("登録データ:", newSubject);

    // 仮保存
    sessionStorage.setItem("tempSubject", JSON.stringify(newSubject));

    alert("教科を登録しました");

    // 一覧画面へ戻る
    window.location.href = "admin_subject-management.html";
  }

  // =============================
  // イベント設定
  // =============================
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    registerSubject();
  });
});