<?php
declare(strict_types=1);

// JSONで返す設定
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';

try {
    $pdo = getDb();


// 教員のデータ取得
    $sql = "
        SELECT
            teacher_id AS id,
            name
        FROM teachers 
        ORDER BY teacher_id ASC
    ";

    // SQL実行
    $stmt = $pdo->query($sql);

    // データ取得
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // JSONで返す
    jsonResponse([
        'success' => true,
        'teachers' => $teachers
    ]);

} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '教員一覧の取得に失敗しました。',
        'error' => $e->getMessage()
    ], 500);
}