// HTMLの読み込みが完了してから処理を開始する
document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // 要素取得
  // =============================

  // =============================
  // URLパラメータから初期role設定
  // =============================
  const params = new URLSearchParams(window.location.search);
  const initialRole = params.get("role");

  if (initialRole === "teacher" || initialRole === "student") {

    const radio = document.querySelector(
      `input[name="userType"][value="${initialRole}"]`
    );

    if (radio) {
      radio.checked = true;
    }
  }

  // 「教員 / 学生」のラジオボタンをすべて取得
  const userTypeRadios = document.querySelectorAll('input[name="userType"]');

  // テーブルのtbody（データを入れる場所）を取得
  const tableBody = document.getElementById("userTableBody");

  // 追加ボタンの情報取得
  const addUserBtn = document.getElementById("addUserBtn");

  // 必要な要素がなければ処理を止める（エラー防止）
  if (!tableBody || userTypeRadios.length === 0) {
    return;
  }

  // =============================
  // 現在のroleを取得する
  // =============================
  function getCurrentRole() {
    const selected = document.querySelector(
      'input[name="userType"]:checked'
    );
    return selected ? selected.value : "teacher";
  }

  // =============================
  // ユーザー取得 & 描画処理
  // =============================
  function loadUsers(type) {

    // ラジオボタンの選択によって呼び出すAPIを切り替える
    const url = type === "teacher"
      ? "/attendance-management-app/backend/php/get_teacher.php"  // 教員API
      : "/attendance-management-app/backend/php/get_students_all.php"; // 学生API

    // APIにリクエストを送る（非同期通信）
    fetch(url)
      .then(res => {

        // HTTPステータスが正常でない場合はエラーにする
        if (!res.ok) throw new Error("通信エラー");

        // レスポンスをJSON形式に変換
        return res.json();
      })
      .then(data => {

        // テーブルを一旦空にする（再描画のため）
        tableBody.innerHTML = "";

        // 教員か学生かで取得するデータのキーを切り替え
        const users = type === "teacher"
          ? data.teachers
          : data.students;

        // データが0件の場合の表示
        if (!users || users.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="3">ユーザーが登録されていません</td>
            </tr>
          `;
          return;
        }

        // 配列の中身を1件ずつ取り出してテーブルに追加
        users.forEach(user => {

          // 教員と学生でIDのキーが違うため両方に対応
          const id = user.id || user.student_id;

          // 名前も同様にキーが違うため対応
          const name = user.name || user.student_name;

          // テーブルの1行分のHTMLを作成
          const row = `
            <tr>
              <!-- XSS対策をして名前を表示 -->
              <td>${escapeHtml(name)}</td>

              <!-- ユーザー種別を表示 -->
              <td>${type === "teacher" ? "教員" : "学生"}</td>

              <!-- 操作ボタン -->
              <td>
                <!-- data-id にユーザーIDを保持 -->
                <button class="edit-btn" data-id="${id}">
                  ユーザー設定変更
                </button>
                <button class="password-btn" data-id="${id}">
                  パスワード変更
                </button>
              </td>
            </tr>
          `;

          // テーブルの末尾に追加
          tableBody.insertAdjacentHTML("beforeend", row);
        });
      })
      .catch(err => {

        // エラーが発生した場合はコンソールに出力
        console.error(err);

        // 画面にもエラーメッセージを表示
        tableBody.innerHTML = `
          <tr>
            <td colspan="3">データ取得に失敗しました</td>
          </tr>
        `;
      });
  }

  // =============================
  // XSS対策関数
  // =============================
  function escapeHtml(str) {

    // 文字列に変換して、危険な文字を安全な文字に置き換える
    return String(str).replace(/[&<>"']/g, match => ({
      '&': '&amp;',   // & → &amp;
      '<': '&lt;',    // < → &lt;
      '>': '&gt;',    // > → &gt;
      '"': '&quot;',  // " → &quot;
      "'": '&#39;'    // ' → &#39;
    }[match]));
  }

  // =============================
  // ラジオボタン変更時の処理
  // =============================
  userTypeRadios.forEach(radio => {

    // ラジオボタンが切り替わったとき
    radio.addEventListener("change", () => {

      // 選択された値（teacher or student）で再読み込み
      loadUsers(radio.value);
    });
  });

  // =============================
  // ボタンイベント（イベント委譲）
  // =============================
  tableBody.addEventListener("click", (event) => {

    // button取得
    const target = event.target.closest("button");

    // button以外なら終了
    if (!target) return;

    // 現在選択されているユーザー種別（教員 or 学生）
    const type = getCurrentRole();

    // ボタンに埋め込まれたユーザーIDを取得
    const userId = target.dataset.id;

    // IDが無ければ終了
    if (!userId) return;

    // =============================
    // ユーザー設定変更ボタン
    // =============================
    if (target.classList.contains("edit-btn")) {

      // ユーザー種別によって遷移先を変更
      if (type === "teacher") {
        location.href = 
          `./admin_user-edit_teacher.html?id=${userId}&role=${type}`;  // ユーザー追加(教員)画面へ
      } else {
        location.href = 
          `./admin_user-edit_student.html?id=${userId}&role=${type}`;  // ユーザー追加(学生)画面へ
      }
    }

    // =============================
    // パスワード変更ボタン
    // =============================
    if (target.classList.contains("password-btn")) {
      location.href = 
        `./admin_change-pass.html?id=${userId}&role=${type}`;
    }
  });

  // =============================
  // 初期表示（ページ読み込み時）
  // =============================

  // もし存在すれば、その種類のデータを表示
  loadUsers(getCurrentRole());

  // =============================
  // ユーザー追加ボタン
  // =============================
  if (addUserBtn) {

    addUserBtn.addEventListener("click", () => {

      const role = getCurrentRole();

      location.href =
        `./admin_user-add.html?role=${role}`;
    });
  }

});