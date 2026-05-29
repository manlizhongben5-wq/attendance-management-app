// HTMLの読み込みが完了してから処理を開始する
document.addEventListener("DOMContentLoaded", () => {
  // =============================
  // 要素取得
  // =============================

  // テーブルのtbody（データを入れる場所）を取得
  const tableBody = document.getElementById("subjectTableBody");

  console.log(tableBody);
  
  // テーブルがなければ終了
  if (!tableBody) return;

  // =============================
  // 教科データ取得 & 描画処理
  // =============================
  function loadSubjects() {

    // APIのURL（固定）
    const url = "/attendance-management-app/backend/php/get_lessons.php";

    // APIにリクエストを送る（非同期通信）
    fetch(url)
      .then(res => {

        // HTTPステータスが正常でない場合はエラーにする
        if (!res.ok) throw new Error("通信エラー");

        // レスポンスをJSON形式に変換
        return res.json();
      })
      .then(data => {  

        // PHPのsuccessチェック
        if (!data.success) {
          throw new Error(data.message || "取得失敗");
        }
        
        // テーブルを一旦空にする（再描画のため）
        tableBody.innerHTML = "";

        // APIの返却形式に合わせる
        const subjects = data.lessons;

        // 教科データが0件のとき
        if (!subjects || subjects.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="2">教科が登録されていません</td>
            </tr>
          `;
          return;
        }

        // 配列の中身を1件ずつ取り出してテーブルに追加
        subjects.forEach(subject => {

          // PHPのキーに合わせる
          const id = subject.lesson_id;
          const name = subject.lesson_name;

          // テーブルの1行分のHTMLを作成
          const row = `
          <tr>
            <td>${escapeHtml(name)}</td>
            <td>
              <button class="edit-btn" data-id="${id}">
                編集
              </button>
              <button class="delete-btn" data-id="${id}">
                削除
              </button>
            </td>
          </tr>
        `;

          tableBody.insertAdjacentHTML("beforeend", row);
        });
      })

      // エラー処理
      .catch(err => {
            console.error(err);

            tableBody.innerHTML = `
              <tr>
                <td colspan="2">データ取得に失敗しました</td>
              </tr>
            `;
          });
      }

   // =============================
  // XSS対策（ユーザー画面と同じ）
  // =============================
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, match => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match]));
  }

  // =============================
  // ボタンイベント（イベント委譲）
  // =============================
  tableBody.addEventListener("click", (event) => {

    const target = event.target;
    const subjectId = target.dataset.id;

    if (!subjectId) return;

    // 編集
    if (target.classList.contains("edit-btn")) {
      location.href = `./admin_subject-edit.html?id=${subjectId}`;
    }

    // 削除
    if (target.classList.contains("delete-btn")) {

      const result = confirm("この教科を削除しますか？");
      if (!result) return;

      // ★本来はここでAPIを叩く（今は仮）
      alert("削除処理は未実装です");

    }
  });

  // =============================
  // 初期表示
  // =============================
  loadSubjects();
});