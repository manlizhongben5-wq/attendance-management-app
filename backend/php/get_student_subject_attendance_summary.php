<?php
declare(strict_types=1);

session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDb();

    $term = trim((string)($_GET['term'] ?? ''));
    $lessonId = isset($_GET['lesson_id']) ? (int)($_GET['lesson_id']) : 0;

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

    // ログイン中の学生IDを取得
    $studentId = getLoginStudentId();

    if ($studentId === '') {
        jsonResponse([
            'success' => false,
            'message' => 'ログイン情報が取得できません。',
        ], 401);
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

    $sql = "
        SELECT
            s.student_id,
            s.name AS student_name,
            SUM(CASE WHEN a.status_id = 1 THEN 1 ELSE 0 END) AS attended_classes,
            COUNT(*) AS completed_classes
        FROM students s
        LEFT JOIN attendances a
            ON a.student_id = s.student_id
           AND a.lesson_id = :lesson_id
           AND a.date BETWEEN :term_start AND :term_end
        WHERE s.student_id = :student_id
        GROUP BY s.student_id, s.name
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':lesson_id' => $lessonId,
        ':term_start' => $termStart,
        ':term_end' => $termEnd,
        ':student_id' => $studentId,
    ]);

    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse([
            'success' => false,
            'message' => '学生情報が見つかりません。',
        ], 404);
    }

    $attendedClasses = (int)$row['attended_classes'];
    $completedClasses = (int)$row['completed_classes'];
    $attendanceRate = $completedClasses > 0
        ? (int)round(($attendedClasses / $completedClasses) * 100)
        : 0;

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
        'student' => [
            'student_id' => $row['student_id'],
            'student_name' => $row['student_name'],
            'attended_classes' => $attendedClasses,
            'completed_classes' => $completedClasses,
            'total_classes' => $totalClasses,
            'attendance_rate' => $attendanceRate,
        ],
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '学生の教科別出欠集計の取得に失敗しました。',
        'error' => $e->getMessage(),
    ], 500);
}

/**
 * ログイン中の学生IDを返す
 * 実際のログイン処理に合わせて優先順を調整してください
 */
function getLoginStudentId(): string
{
    $candidateKeys = [
        'student_id',
        'user_id',
        'login_id',
    ];

    foreach ($candidateKeys as $key) {
        if (isset($_SESSION[$key]) && is_string($_SESSION[$key]) && $_SESSION[$key] !== '') {
            return $_SESSION[$key];
        }
    }

    return '';
}

/**
 * 今日の日付を基準に、選択された学期の集計期間を返す
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

    $end = $today < $endBase ? $today : $endBase;

    return [
        $start->format('Y-m-d'),
        $end->format('Y-m-d'),
        $today->format('Y-m-d'),
    ];
}