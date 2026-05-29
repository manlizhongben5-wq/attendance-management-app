<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=UTF-8");

// 開発用エラー表示
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/db.php';

try {

    // DB接続
    $pdo = getDb();

    // ============================
    // JSON受け取り
    // ============================
    $input = json_decode(file_get_contents("php://input"), true);

    // JSON形式チェック
    if (!is_array($input)) {
        throw new Exception("リクエスト形式が不正です");
    }

    // student_id確認
    if (!isset($input['student_id'])) {
        throw new Exception("IDが指定されていません");
    }

    // int型へ変換
    $studentId = (int)$input['student_id'];

    // 不正値チェック
    if ($studentId <= 0) {
        throw new Exception("IDが不正です");
    }

    // ============================
    // 存在確認
    // ============================
    $checkSql = "
        SELECT 1
        FROM students
        WHERE student_id = :id
        LIMIT 1
    ";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindValue(':id', $studentId, PDO::PARAM_INT);
    $checkStmt->execute();

    // 存在しない場合
    if ($checkStmt->fetchColumn() == 0) {
        throw new Exception("対象の学生が存在しません");
    }

    // ============================
    // transaction開始
    // ============================
    $pdo->beginTransaction();

    // ============================
    // 削除処理
    // ============================
    $deleteSql = "DELETE FROM students WHERE student_id = :id";
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->bindValue(':id', $studentId, PDO::PARAM_INT);
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