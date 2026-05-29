<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $pdo = getDb();

    // =========================================
    // 1. リクエスト取得
    // =========================================
    $date = trim((string)($_GET['date'] ?? ''));
    $grade = trim((string)($_GET['grade'] ?? ''));
    $classIdRaw = $_GET['class_id'] ?? '';

    if ($date === '' || $grade === '' || $classIdRaw === '') {
        jsonResponse([
            'success' => false,
            'message' => 'date / grade / class_id は必須です。'
        ], 400);
    }

    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt || $dt->format('Y-m-d') !== $date) {
        jsonResponse([
            'success' => false,
            'message' => 'date は Y-m-d 形式で指定してください。'
        ], 400);
    }

    if (!in_array($grade, ['1', '2'], true)) {
        jsonResponse([
            'success' => false,
            'message' => 'grade は 1 または 2 を指定してください。'
        ], 400);
    }

    $classId = filter_var($classIdRaw, FILTER_VALIDATE_INT);
    if ($classId === false || $classId <= 0) {
        jsonResponse([
            'success' => false,
            'message' => 'class_id は正の整数で指定してください。'
        ], 400);
    }

    // =========================================
    // 2. class_id の存在確認 + class_name取得
    // =========================================
    $stmtClass = $pdo->prepare("
        SELECT class_id, class_name
        FROM classes
        WHERE class_id = :class_id
        LIMIT 1
    ");
    $stmtClass->bindValue(':class_id', $classId, PDO::PARAM_INT);
    $stmtClass->execute();

    $classRow = $stmtClass->fetch();

    if (!$classRow) {
        jsonResponse([
            'success' => false,
            'message' => '指定された class_id は存在しません。'
        ], 404);
    }

    $className = (string)$classRow['class_name'];

    // =========================================
    // 3. 指定日から年度を算出（4月始まり）
    //    例:
    //    2026-04-01 ～ 2027-03-31 => 2026年度
    // =========================================
    $year = (int)$dt->format('Y');
    $month = (int)$dt->format('m');
    $academicYear = ($month >= 4) ? $year : ($year - 1);

    // grade=1 -> 当年度入学
    // grade=2 -> 前年度入学
    $enrollmentYear = ($grade === '1')
        ? (string)$academicYear
        : (string)($academicYear - 1);

    // =========================================
    // 4. 対象学生一覧取得
    // students:
    // - student_id
    // - name
    // - class_id
    // - enrollment_year
    // =========================================
    $stmtStudents = $pdo->prepare("
        SELECT
            student_id,
            name
        FROM students
        WHERE enrollment_year = :enrollment_year
          AND class_id = :class_id
        ORDER BY student_id ASC
    ");
    $stmtStudents->bindValue(':enrollment_year', $enrollmentYear, PDO::PARAM_STR);
    $stmtStudents->bindValue(':class_id', $classId, PDO::PARAM_INT);
    $stmtStudents->execute();

    $studentRows = $stmtStudents->fetchAll();

    if (!$studentRows) {
        jsonResponse([
            'success' => true,
            'date' => $date,
            'grade' => (int)$grade,
            'classId' => $classId,
            'className' => $className,
            'periods' => [1, 2, 3, 4],
            'students' => [],
        ]);
    }

    $studentIds = array_column($studentRows, 'student_id');

    // =========================================
    // 5. IN句生成
    // =========================================
    $placeholders = [];
    $params = [
        ':date' => $date,
    ];

    foreach ($studentIds as $i => $studentId) {
        $key = ":student_id_{$i}";
        $placeholders[] = $key;
        $params[$key] = $studentId;
    }

    $inClause = implode(', ', $placeholders);

    // =========================================
    // 6. 出欠取得
    // attendances:
    // - student_id
    // - time
    // - date
    // - lesson_id
    // - status_id
    // - updated_at
    //
    // lessons:
    // - lesson_id
    // - lesson_name
    //
    // attendances_status:
    // - status_id
    // - status_name
    //
    // 同一 student_id + date + time で複数件ある場合は
    // updated_at DESC の先頭を採用
    // =========================================
    $sqlAttendances = "
        SELECT
            a.student_id,
            a.time,
            l.lesson_name,
            ast.status_name,
            a.updated_at
        FROM attendances a
        INNER JOIN lessons l
            ON l.lesson_id = a.lesson_id
        INNER JOIN attendances_status ast
            ON ast.status_id = a.status_id
        WHERE a.date = :date
          AND a.student_id IN ({$inClause})
          AND a.time BETWEEN 1 AND 4
        ORDER BY a.student_id ASC, a.time ASC, a.updated_at DESC
    ";

    $stmtAttendances = $pdo->prepare($sqlAttendances);

    foreach ($params as $key => $value) {
        $stmtAttendances->bindValue($key, $value, PDO::PARAM_STR);
    }

    $stmtAttendances->execute();
    $attendanceRows = $stmtAttendances->fetchAll();

    // =========================================
    // 7. レスポンス用初期化
    // =========================================
    $resultStudents = [];

    foreach ($studentRows as $student) {
        $sid = (string)$student['student_id'];

        $resultStudents[$sid] = [
            'studentId' => $sid,
            'studentName' => (string)$student['name'],
            'attendance' => [
                '1' => ['subject' => '', 'status' => ''],
                '2' => ['subject' => '', 'status' => ''],
                '3' => ['subject' => '', 'status' => ''],
                '4' => ['subject' => '', 'status' => ''],
            ],
        ];
    }

    // =========================================
    // 8. ステータス表示変換
    // 必要に応じてここは追加調整
    // =========================================
    $statusMap = [
        '出席'   => '○',
        '欠席'   => '欠',
        '遅刻'   => '遅',
        '早退'   => '早',
        '公欠'   => '公',
        '忌引'   => '忌',
        '出停'   => '停',
        '別室'   => '別',
        '未選択' => '',
    ];

    $usedKeys = [];

    foreach ($attendanceRows as $row) {
        $sid = (string)$row['student_id'];
        $period = (string)$row['time'];
        $uniqueKey = $sid . '_' . $period;

        if (isset($usedKeys[$uniqueKey])) {
            continue;
        }

        if (!isset($resultStudents[$sid])) {
            continue;
        }

        $lessonName = (string)($row['lesson_name'] ?? '');
        $statusName = trim((string)($row['status_name'] ?? ''));
        $statusLabel = $statusMap[$statusName] ?? $statusName;

        $resultStudents[$sid]['attendance'][$period] = [
            'subject' => $lessonName,
            'status' => $statusLabel,
        ];

        $usedKeys[$uniqueKey] = true;
    }

    // =========================================
    // 9. レスポンス返却
    // =========================================
    jsonResponse([
        'success' => true,
        'date' => $date,
        'grade' => (int)$grade,
        'classId' => $classId,
        'className' => $className,
        'periods' => [1, 2, 3, 4],
        'students' => array_values($resultStudents),
    ]);

} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '出欠データの取得に失敗しました。',
        'error' => $e->getMessage(),
    ], 500);
}