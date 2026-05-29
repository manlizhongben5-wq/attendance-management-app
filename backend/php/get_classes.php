<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $pdo = getDb();

    $stmt = $pdo->query("
        SELECT class_id, class_name
        FROM classes
        ORDER BY class_id ASC
    ");

    $classes = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'classes' => $classes,
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '学科一覧の取得に失敗しました。',
        'error' => $e->getMessage(),
    ], 500);
}