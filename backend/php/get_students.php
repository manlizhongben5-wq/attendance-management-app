<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDb();

    $enrollment_year = $_GET['enrollment_year'] ?? '';
    $class_id = $_GET['class_id'] ?? '';

    if ($enrollment_year === '' || $class_id === '') {
        jsonResponse([
            'success' => false,
            'message' => 'enrollment_year と class_id は必須です。'
        ], 400);
        exit;
    }

    $sql = "
        SELECT
            student_id,
            student_id AS student_number,
            name AS student_name,
            enrollment_year,
            class_id
        FROM students
        WHERE enrollment_year = :enrollment_year
          AND class_id = :class_id
        ORDER BY student_id ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':enrollment_year' => $enrollment_year,
        ':class_id' => $class_id
    ]);

    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'students' => $students
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '学生一覧の取得に失敗しました。',
        'error' => $e->getMessage()
    ], 500);
}