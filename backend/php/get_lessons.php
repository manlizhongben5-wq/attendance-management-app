<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
error_log('get_lessons.php called');

require_once __DIR__ . '/db.php';



try {
    $pdo = getDb();

    $sql = "
        SELECT
            lesson_id,
            lesson_name
        FROM lessons
        ORDER BY lesson_id ASC
    ";

    $stmt = $pdo->query($sql);
    $lessons = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'lessons' => $lessons,
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '科目一覧の取得に失敗しました。',
        'error' => $e->getMessage(),
    ], 500);
}