
/*
let start = Date.now();
let cnt = 1;

setInterval(() => {
  const elapsed = Date.now() - start;

  if (elapsed >= 5000) {
    
    // 5秒経過毎に処理を実行
    console.log(`5秒経過したため、${cnt}回目の処理を実行します。`);

    // リセット（ここ重要）
    start = Date.now();

    // 回数を計測
    cnt++;
  }
}, 1000);

*/

// 単純な時間計測
setInterval(() => {
  console.log("5秒経過しました。");
}, 5000);