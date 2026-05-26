// =============================================
// テーブルスクロールJS
// =============================================
document.addEventListener("DOMContentLoaded", () => {

  
  // テーブルのスクロールエリア
  const tableWrap = document.getElementById("studentTableWrap");

  // 上スクロールボタン
  const scrollUpBtn = document.getElementById("scrollUpBtn");

  // 下スクロールボタン
  const scrollDownBtn = document.getElementById("scrollDownBtn");

  /*
    どれかの要素が存在しない場合
    エラーを防ぐため処理を終了
  */
  if (!tableWrap || !scrollUpBtn || !scrollDownBtn) {
    return;
  }

  /* =============================
     スクロール量設定
     1回クリックしたときに
     何pxスクロールするか
  ============================== */
  const SCROLL_AMOUNT = 120;

  /**
   * テーブルを縦スクロールする関数
   *
   * @param {number} amount
   * 正の値 → 下へスクロール
   * 負の値 → 上へスクロール
   */
  function scrollTable(amount) {
    tableWrap.scrollBy({
      top: amount,
      behavior: "smooth"
    });
  }

  /* =============================
     上ボタン
  ============================== */
  scrollUpBtn.addEventListener("click", () => {
    scrollTable(-SCROLL_AMOUNT);
  });

  /* =============================
     下ボタン
  ============================== */
  scrollDownBtn.addEventListener("click", () => {
    scrollTable(SCROLL_AMOUNT);
  });
});