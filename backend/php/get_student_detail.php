<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// デバッグON
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ .'/../config/db.php';

try {
    $pdo = getDb();

    // ============================
    // パラメータ取得
    // ============================
    $id = $_GET['id'] ?? null;

    if (!$id) {
        throw new Exception("IDが指定されていません");
    }

    // ============================
    // 1件取得
    // ============================
    $sql = "
        SELECT
            student_id,
            name AS student_name,
            class_id
        FROM students 
        WHERE student_id = :id
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    // ============================
    // データ存在チェック
    // ============================
    if (!$student) {
        echo json_encode([
            'success' => false,
            'error' => '該当データが存在しません'
        ]);
        exit;
    }

    // ============================
    // 正常レスポンス
    // ============================
    echo json_encode([
        'success' => true,
        'student' => $student
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}