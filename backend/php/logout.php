<?php
/**
 * logout.php
 * 役割：セッションを破棄し、ログイン画面へリダイレクトする
 */

// 1. セッションを開始（破棄するためにはまず開始する必要がある） 
session_start();

// 2. セッション変数をすべて空にする
$_SESSION = array();

// 3. ブラウザ側のセッションクッキーも削除する（セキュリティ向上）
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 4. サーバー側のセッションデータを完全に破棄
session_destroy();

// 5. auth.jsにjson形式でstatusを渡す
echo json_encode(['status' => 'success']);
exit;