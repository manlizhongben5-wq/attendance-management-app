document.addEventListener("DOMContentLoaded", () => {
  
    // =============================
  // 要素取得
  // =============================
  const userTypeRadios = document.querySelectorAll('input[name="userType"]');
  const courseArea = document.getElementById("courseArea");
  const course = document.getElementById("course");

  const userId = document.getElementById("userId");
  const userName = document.getElementById("userName");
  const password = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");

  // 必須要素がなければ終了
  if (
    userTypeRadios.length === 0 ||
    !courseArea ||
    !userId ||
    !userName ||
    !password ||
    !registerBtn
  ) {
    return;
  }

  // =============================
  // コース表示切替
  // =============================
  function toggleCourseArea() {
    
    const selected = document.querySelector('input[name="userType"]:checked');

    if (!selected) return;

    console.log("選択中:", selected.value);

    // 学生なら表示
    if (selected.value === "student") {
      courseArea.classList.remove("hidden");
    }
    // 教員なら非表示
    else if (selected.value === "teacher") {
      courseArea.classList.add("hidden");

      if (course) {
        course.value = "";
      }
    }
  }

  
  // ====================================
  // コース選択プルダウンにコース一覧を取得
  // ====================================
  async function loadClasses() {

    try {

      const response = await fetch(
        "/attendance/backend/php/get_classes.php"
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



  // =============================
  // 入力値取得
  // =============================
  function getFormData() {
    const selected = document.querySelector('input[name="userType"]:checked');

    return {
      role: selected ? selected.value : "",
      id: userId.value.trim(),
      name: userName.value.trim(),
      password: password.value.trim(),
      course: course ? course.value : ""
    };
  }

  // =============================
  // 入力チェック
  // =============================
  function validateForm(data) {
    if (!data.role) {
      alert("ユーザー種別を選択してください");
      return false;
    }

    if (!data.id) {
      alert("学生・教員番号を入力してください");
      userId.focus();
      return false;
    }

    if (!data.name) {
      alert("名前を入力してください");
      userName.focus();
      return false;
    }

    if (!data.password) {
      alert("パスワードを入力してください");
      password.focus();
      return false;
    }

    if (data.role === "student" && !data.course) {
      alert("コースを選択してください");
      if (course) course.focus();
      return false;
    }

    return true;
  }

  // =============================
  // 仮登録処理
  // =============================
  function registerUser() {
    const formData = getFormData();

    if (!validateForm(formData)) {
      return;
    }

    const newUser = {
      id: formData.id,
      name: formData.name,
      role: formData.role,
      password: formData.password,
      course: formData.role === "student" ? formData.course : null
    };

    console.log("登録データ:", newUser);

    sessionStorage.setItem("tempUser", JSON.stringify(newUser));

    alert("登録しました");

    if (formData.role === "teacher") {
      window.location.href = "/admin-user-list_teacher.html";
    } else {
      window.location.href = "/admin-user-list_student.html";
    }
  }

  // =============================
  // イベント設定
  // =============================
  userTypeRadios.forEach((radio) => {
    radio.addEventListener("change", toggleCourseArea);
  });

  registerBtn.addEventListener("click", registerUser);

  // 初期表示反映
  toggleCourseArea();
  
  // コース一覧取得
  loadClasses();
});