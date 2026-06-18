document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // 要素取得
  // =============================
  const userTypeRadios = document.querySelectorAll('input[name="userType"]');
  const courseArea = document.getElementById("courseArea");
  const course = document.getElementById("course");

  const userIdInput = document.getElementById("number");
  const userNameInput = document.getElementById("name");
  const yearArea = document.getElementById("yearArea");
  const password = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");

  const enrollmentYear = document.getElementById("enrollmentYear");

  // =============================
  // URLパラメータ取得（1回だけ）
  // =============================
  const params = new URLSearchParams(window.location.search);
  const initialRole = params.get("role") ?? "teacher";

  // =============================
  // ラジオボタン初期化
  // =============================
  const radio = document.querySelector(
    `input[name="userType"][value="${initialRole}"]`
  );

  if (radio) radio.checked = true;

  // =============================
  // 現在のroleを取得する
  // =============================
  function getCurrentRole() {
    const selected = document.querySelector('input[name="userType"]:checked');
    return selected ? selected.value : "teacher";
  }
  // =============================
  // 戻るリンク
  // =============================
  function updateBackLink() {
    const role = getCurrentRole();

    const backLink = document.getElementById("backLink");

    if (backLink) {
      backLink.href =
        `/attendance-management-app/public/pages/admin/admin_user-management.html?role=${role}`;
    }
  }

  // 必須要素がなければ終了
  if (
    userTypeRadios.length === 0 ||
    !courseArea ||
    !course ||
    !userIdInput ||
    !userNameInput ||
    !yearArea ||
    !enrollmentYear ||
    !password ||
    !registerBtn
  ) {
    return;
  }

  // =============================
  // コース表示切替
  // =============================
  function toggleCourseArea() {

    const selected = document.querySelector(
      'input[name="userType"]:checked'
    );

    if (!selected) return;

    // 学生なら表示
    if (selected.value === "student") {
      courseArea.classList.remove("hidden");
      yearArea.classList.remove("hidden");
    }
    // 教員なら非表示
    else if (selected.value === "teacher") {
      courseArea.classList.add("hidden");
      yearArea.classList.add("hidden");

      course.value = "";
      enrollmentYear.value = "";
    }
  }

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


  // =============================
  // 入力値取得
  // =============================
  function getFormData() {
    const selected = document.querySelector(
    'input[name="userType"]:checked'
  );

    return {
      role: selected.value,
      id: userIdInput.value.trim(),
      name: userNameInput.value.trim(),
      password: password.value.trim(),
      course: course.value,
      enrollmentYear: enrollmentYear.value.trim()
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
      userIdInput.focus();
      return false;
    }

    if (!data.name) {
      alert("名前を入力してください");
      userNameInput.focus();
      return false;
    }

    if (!data.password) {
      alert("パスワードを入力してください");
      password.focus();
      return false;
    }

    if (data.role === "student" && !data.course) {
      alert("コースを選択してください");

      if (course) {
        course.focus();
      }

      return false;
    }

    if (data.role === "student" && !data.enrollmentYear) {
      alert("入学年度を入力してください");
      enrollmentYear.focus();
      return false;
    }

    if (data.role === "student" &&
      !/^\d{4}$/.test(data.enrollmentYear)
    ) {
      alert("入学年度は4桁で入力してください");
      enrollmentYear.focus();
      return false;
    }

    return true;
  }

  // =============================
  // 登録処理
  // =============================
  async function registerUser() {

    const formData = getFormData();

    if (!validateForm(formData)) {
      return;
    }

    const newUser = {
      id: formData.id,
      name: formData.name,
      role: formData.role,
      password: formData.password,
      course: formData.role === "student"
        ? formData.course
        : null,
      enrollmentYear: formData.role === "student"
        ? formData.enrollmentYear
        : null
    };

    try {

      const response = await fetch(
        "/attendance-management-app/backend/php/add_user.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newUser)
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      alert("登録しました");

      // 登録成功後は、現在選択中のroleに戻す
      const role = getCurrentRole();

      window.location.href =
        `/attendance-management-app/public/pages/admin/admin_user-management.html?role=${role}`;

    } catch (error) {

      console.error("登録エラー");

      console.error(error);

      alert(error.message);

    }
  }

  // =============================
  // ラジオ変更時
  // =============================
  userTypeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      toggleCourseArea();
      updateBackLink();
    });
  });

  registerBtn.addEventListener("click", registerUser);

  // 初期表示反映
  toggleCourseArea();

  updateBackLink();

  // コース一覧取得
  loadClasses();
});