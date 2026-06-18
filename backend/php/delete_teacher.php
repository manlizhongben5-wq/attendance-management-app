<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=UTF-8");

// 開発用エラー表示
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ .'/../config/db.php';

try {

    // DB接続
    $pdo = getDb();

    // ============================
    // transaction開始
    // ============================
    $pdo->beginTransaction();

    // ============================
    // JSON受け取り
    // ============================
    $input = json_decode(file_get_contents("php://input"), true);

    // JSON形式チェック
    if (!is_array($input)) {
        throw new Exception("リクエスト形式が不正です");
    }

    // teacher_id確認
    if (!isset($input['teacher_id'])) {
        throw new Exception("IDが指定されていません");
    }

    // int型へ変換
    $teacherId = (int)$input['teacher_id'];

    // 不正値チェック
    if ($teacherId <= 0) {
        throw new Exception("IDが不正です");
    }

    // ============================
    // 存在確認
    // ============================
    $checkSql = "SELECT COUNT(*) FROM teachers WHERE teacher_id = :id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindValue(':id', $teacherId, PDO::PARAM_INT);
    $checkStmt->execute();

    // 存在しない場合
    if ($checkStmt->fetchColumn() == 0) {
        throw new Exception("対象の教員が存在しません");
    }

    // ============================
    // 削除処理
    // ============================
    $deleteSql = "DELETE FROM teachers WHERE teacher_id = :id";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->bindValue(':id', $teacherId, PDO::PARAM_INT);
    $deleteStmt->execute();

    // 削除件数確認
    if ($deleteStmt->rowCount() === 0) {
        throw new Exception("削除に失敗しました");
    }

    // ============================
    // transaction確定
    // ============================
    $pdo->commit();

    echo json_encode([
        "success" => true
    ]);

} catch (Throwable $e) {

    // transaction中なら取り消し
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // HTTPステータスも返す（デバッグしやすい）
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}