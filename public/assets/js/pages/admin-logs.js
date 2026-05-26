document.addEventListener("DOMContentLoaded", () => {
  /* =============================
     画面で使う要素を取得
  ============================== */
  const radios = document.querySelectorAll('input[name="logType"]');
  const savePanel = document.getElementById("savePanel");
  const adminPanel = document.getElementById("adminPanel");
  const adminActions = document.getElementById("adminActions");

  const exportBtn = document.getElementById("exportBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!savePanel || !adminPanel || !adminActions || radios.length === 0) {
    return;
  }

  /**
   * 現在選択中のログ種別を取得
   * @returns {"save" | "admin"}
   */
  function getCurrentType() {
    const checkedRadio = document.querySelector('input[name="logType"]:checked');
    return checkedRadio ? checkedRadio.value : "save";
  }

  /**
   * 表示状態を切り替える
   * @param {string} type
   */
  function setView(type) {
    const isSave = type === "save";
    const isAdmin = type === "admin";

    // パネル切り替え
    savePanel.classList.toggle("is-hidden", !isSave);
    adminPanel.classList.toggle("is-hidden", !isAdmin);

    savePanel.setAttribute("aria-hidden", String(!isSave));
    adminPanel.setAttribute("aria-hidden", String(!isAdmin));

    // 管理者ボタン切り替え
    adminActions.classList.toggle("is-hidden", !isAdmin);
    adminActions.setAttribute("aria-hidden", String(!isAdmin));
  }

  /**
   * CSV用エスケープ
   */
  function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  /**
   * ファイルダウンロード
   */
  function downloadFile(filename, content) {
    const bom = "\uFEFF";
    const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  /**
   * 保存履歴をCSV出力
   */
  function exportSaveLog() {
    const table = savePanel.querySelector(".logs-table");
    if (!table) {
      alert("保存履歴テーブルが見つかりません。");
      return;
    }

    const rows = table.querySelectorAll("tr");
    const lines = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      const line = Array.from(cells).map((cell) => escapeCsv(cell.textContent.trim()));
      lines.push(line.join(","));
    });

    if (lines.length === 0) {
      alert("出力できるログがありません。");
      return;
    }

    downloadFile("save_logs.csv", lines.join("\n"));
  }

  /**
   * 管理者編集履歴をCSV出力
   */
  function exportAdminLog() {
    const desc = adminPanel.querySelector(".admin-log-desc");
    const items = adminPanel.querySelectorAll(".admin-log-lines li");
    const lines = [];

    if (desc) {
      lines.push(
        desc.textContent
          .split(",")
          .map((text) => escapeCsv(text.trim()))
          .join(",")
      );
    }

    items.forEach((item) => {
      lines.push(
        item.textContent
          .split(",")
          .map((text) => escapeCsv(text.trim()))
          .join(",")
      );
    });

    if (lines.length === 0) {
      alert("出力できるログがありません。");
      return;
    }

    downloadFile("admin_logs.csv", lines.join("\n"));
  }

  /**
   * エクスポート処理
   */
  function handleExport() {
    const currentType = getCurrentType();

    if (currentType === "save") {
      exportSaveLog();
    } else {
      exportAdminLog();
    }
  }

  /**
   * 保存履歴リセット
   */
  function resetSaveLog() {
    const tbody = savePanel.querySelector("tbody");
    if (!tbody) {
      return;
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="6">ログはありません</td>
      </tr>
    `;
  }

  /**
   * 管理者編集履歴リセット
   */
  function resetAdminLog() {
    const ul = adminPanel.querySelector(".admin-log-lines");
    if (!ul) {
      return;
    }

    ul.innerHTML = `<li>ログはありません</li>`;
  }

  /**
   * リセット処理
   */
  function handleReset() {
    const currentType = getCurrentType();
    const ok = window.confirm("現在表示中のログをリセットします。よろしいですか？");

    if (!ok) {
      return;
    }

    if (currentType === "save") {
      resetSaveLog();
    } else {
      resetAdminLog();
    }
  }

  /* =============================
     初期表示
  ============================== */
  setView(getCurrentType());

  /* =============================
     ラジオ変更時
  ============================== */
  radios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      setView(event.target.value);
    });
  });

  /* =============================
     ボタンイベント
  ============================== */
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExport);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", handleReset);
  }
});