<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDb();

    $date = $_GET['date'] ?? '';
    $period = isset($_GET['period']) ? (int)$_GET['period'] : 0;
    $lessonId = isset($_GET['lesson_id']) ? (int)$_GET['lesson_id'] : 0;

    if ($date === '' || $period <= 0 || $lessonId <= 0) {
        jsonResponse([
            'success' => true,
            'attendances' => [],
        ]);
        exit;
    }

    // DBのstatus_id → JSのstatus文字列
    $statusMap = [
        1 => 'present',
        2 => 'absent',
        3 => 'late',
        4 => 'leave',
        5 => 'official',
        6 => 'separate',
    ];

    $sql = "
        SELECT
            student_id,
            status_id
        FROM attendances
        WHERE date = :date
          AND time = :time
          AND lesson_id = :lesson_id
        ORDER BY student_id ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':date' => $date,
        ':time' => $period,
        ':lesson_id' => $lessonId,
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $attendances = [];

    foreach ($rows as $row) {
        $statusId = (int)$row['status_id'];

        $attendances[] = [
            'student_id' => (string)$row['student_id'],
            'status' => $statusMap[$statusId] ?? 'unselected',
        ];
    }

    jsonResponse([
        'success' => true,
        'attendances' => $attendances,
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '出欠情報の取得に失敗しました。',
        'error' => $e->getMessage(),
    ], 500);
}