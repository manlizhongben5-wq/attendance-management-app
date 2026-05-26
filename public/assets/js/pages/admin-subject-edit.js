// =============================================
// admin-subject-edit.html 専用
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("subjectTableBody");

  /* =========================================
     教科データ
  ========================================= */
  const subjectData = [
    { name: "コンピュータ概論" },
    { name: "英語" }
  ];

  /* =========================================
     テーブル描画
  ========================================= */
  function renderTable() {
    tableBody.innerHTML = "";

    subjectData.forEach((subject) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${subject.name}</td>
        <td class="action-cell">
          <button class="change-subject-btn" type="button">教科設定変更</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    /* 見た目調整用の空行 */
    for (let i = 0; i < 2; i += 1) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td>&nbsp;</td>
        <td></td>
      `;
      tableBody.appendChild(emptyRow);
    }
  }

  /* 初期表示 */
  renderTable();
});