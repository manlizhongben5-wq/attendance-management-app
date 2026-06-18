<?php
declare(strict_types=1);

// CORS設定（どこからでもアクセス許可）
header("Access-Control-Allow-Origin: *");
// レスポンスはJSON形式で返す
header("Content-Type: application/json; charset=UTF-8");

// ==========================================
// DB接続ファイル読み込み
// ==========================================
require_once __DIR__ .'/../config/db.php';

try {

    // DB接続取得
    $pdo = getDb();

    // SQL文（学生一覧取得）
    $sql = "
        SELECT
            student_id,
            name AS student_name
        FROM students
        ORDER BY student_id ASC
    ";

    // SQLを準備（まだ実行されない）
    $stmt = $pdo->prepare($sql);

    // SQLを実行（プレースホルダがある場合はここで値を渡す）
    $stmt->execute();

    // 結果をすべて取得（連想配列形式）
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ======================================
    // 成功レスポンス
    // ======================================
    echo json_encode([
        'success' => true,
        'students' => $students
    ]);

} catch (Throwable $e) {

    // ======================================
    // エラー時レスポンス
    // ※本番では詳細エラーは出さない方が安全
    // ======================================
    echo json_encode([
        'success' => false,
        'message' => '取得失敗',
        'error' => $e->getMessage()
    ]);
}