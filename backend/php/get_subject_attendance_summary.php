<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';

try {
    $pdo = getDb();

    $term = trim((string)($_GET['term'] ?? ''));
    $lessonId = isset($_GET['lesson_id']) ? (int)$_GET['lesson_id'] : 0;

    if ($term === '' || !in_array($term, ['前期', '後期'], true)) {
        jsonResponse([
            'success' => false,
            'message' => '学期が不正です。',
        ], 400);
    }

    if ($lessonId <= 0) {
        jsonResponse([
            'success' => false,
            'message' => '科目が不正です。',
        ], 400);
    }

    [$termStart, $termEnd, $today] = getTermRange($term);

    $lessonSql = "
        SELECT
            lesson_id,
            lesson_name,
            lesson_count
        FROM lessons
        WHERE lesson_id = :lesson_id
        LIMIT 1
    ";

    $lessonStmt = $pdo->prepare($lessonSql);
    $lessonStmt->execute([
        ':lesson_id' => $lessonId,
    ]);

    $lesson = $lessonStmt->fetch();

    if (!$lesson) {
        jsonResponse([
            'success' => false,
            'message' => '科目が見つかりません。',
        ], 404);
    }

    $totalClasses = (int)$lesson['lesson_count'];
    $requiredClasses = (int)ceil($totalClasses * 2 / 3);

    $sql = "
        SELECT
            s.student_id,
            s.name AS student_name,
            SUM(CASE WHEN a.status_id = 1 THEN 1 ELSE 0 END) AS attended_classes,
            COUNT(*) AS completed_classes
        FROM attendances a
        INNER JOIN students s
            ON s.student_id = a.student_id
        WHERE a.lesson_id = :lesson_id
          AND a.date BETWEEN :term_start AND :term_end
        GROUP BY s.student_id, s.name
        ORDER BY s.student_id ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':lesson_id' => $lessonId,
        ':term_start' => $termStart,
        ':term_end' => $termEnd,
    ]);

    $rows = $stmt->fetchAll();

    $students = array_map(
        static function (array $row) use ($totalClasses, $requiredClasses): array {
            $attendedClasses = (int)$row['attended_classes'];
            $completedClasses = (int)$row['completed_classes'];
            $attendanceRate = $completedClasses > 0
                ? (int)round(($attendedClasses / $completedClasses) * 100)
                : 0;

            return [
                'student_id' => $row['student_id'],
                'student_name' => $row['student_name'],
                'attended_classes' => $attendedClasses,
                'completed_classes' => $completedClasses,
                'total_classes' => $totalClasses,
                'required_classes' => $requiredClasses,
                'attendance_rate' => $attendanceRate,
            ];
        },
        $rows
    );

    jsonResponse([
        'success' => true,
        'term' => $term,
        'term_start' => $termStart,
        'term_end' => $termEnd,
        'today' => $today,
        'lesson' => [
            'lesson_id' => (int)$lesson['lesson_id'],
            'lesson_name' => $lesson['lesson_name'],
            'lesson_count' => $totalClasses,
        ],
        'students' => $students,
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '教科別出欠集計の取得に失敗しました。',
        'error' => $e->getMessage(),
    ], 500);
}

/**
 * 今日の日付を基準に、選択された学期の集計期間を返す
 *
 * 例:
 * - 今日が 2026-03-19
 *   前期 => 2025-04-01 ～ 2025-09-30
 *   後期 => 2025-10-01 ～ 2026-03-19
 *
 * - 今日が 2026-07-10
 *   前期 => 2026-04-01 ～ 2026-07-10
 *   後期 => 2026-10-01 ～ 2027-03-31（未来なので実質0件）
 */
function getTermRange(string $term): array
{
    $today = new DateTimeImmutable('today');
    $year = (int)$today->format('Y');
    $month = (int)$today->format('n');

    // 年度開始年（4月始まり）
    $fiscalYear = ($month >= 4) ? $year : ($year - 1);

    if ($term === '前期') {
        $start = new DateTimeImmutable(sprintf('%04d-04-01', $fiscalYear));
        $endBase = new DateTimeImmutable(sprintf('%04d-09-30', $fiscalYear));
    } else {
        $start = new DateTimeImmutable(sprintf('%04d-10-01', $fiscalYear));
        $endBase = new DateTimeImmutable(sprintf('%04d-03-31', $fiscalYear + 1));
    }

    // 実施済コマ数は「今日時点まで」
    $end = $today < $endBase ? $today : $endBase;

    return [
        $start->format('Y-m-d'),
        $end->format('Y-m-d'),
        $today->format('Y-m-d'),
    ];
}