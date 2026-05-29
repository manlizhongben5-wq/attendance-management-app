<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDb();

    $fiscalYear = isset($_GET['fiscal_year']) ? (int)$_GET['fiscal_year'] : 0;
    $grade      = isset($_GET['grade']) ? (int)$_GET['grade'] : 0;

    if ($fiscalYear <= 0 || $grade <= 0) {
        jsonResponse([
            'success' => false,
            'message' => 'fiscal_year, grade は必須です。'
        ], 400);
    }

    // 学年 -> 入学年度
    // 例:
    // 2025年度 1年 => 2025
    // 2025年度 2年 => 2024
    $enrollmentYear = (string)($fiscalYear - $grade + 1);

    // 同一年次の全コースの学生を取得
    $studentStmt = $pdo->prepare("
        SELECT
            s.student_id,
            s.name,
            s.class_id,
            s.enrollment_year,
            c.class_name
        FROM students s
        INNER JOIN classes c
            ON s.class_id = c.class_id
        WHERE s.enrollment_year = :enrollment_year
        ORDER BY c.class_id ASC, s.student_id ASC
    ");
    $studentStmt->execute([
        ':enrollment_year' => $enrollmentYear,
    ]);

    $studentRows = $studentStmt->fetchAll();

    if (!$studentRows) {
        jsonResponse([
            'success'    => true,
            'fiscalYear' => $fiscalYear,
            'grade'      => $grade,
            'months'     => [],
        ]);
    }

    $studentIds = array_map(
        static fn(array $row): string => (string)$row['student_id'],
        $studentRows
    );

    $months = [];

    // 4月〜翌3月
    for ($i = 0; $i < 12; $i++) {
        $baseMonth = 4 + $i;
        $year  = $baseMonth <= 12 ? $fiscalYear : $fiscalYear + 1;
        $month = $baseMonth <= 12 ? $baseMonth : $baseMonth - 12;

        $monthStart = sprintf('%04d-%02d-01', $year, $month);
        $monthEnd   = date('Y-m-t', strtotime($monthStart));

        $dates = buildMonthDates($monthStart, $monthEnd);

        // 月内出欠一覧を student_id/date 単位で取得
        $attendanceMap = fetchMonthAttendanceMap($pdo, $studentIds, $monthStart, $monthEnd);

        // 月内集計
        $monthlyCounts = calculateMonthlyCounts($attendanceMap);

        $students = [];

        foreach ($studentRows as $student) {
            $studentId = (string)$student['student_id'];

            $attendance = [];
            foreach ($dates as $dateInfo) {
                $date = $dateInfo['date'];
                $attendance[$date] = $attendanceMap[$studentId][$date] ?? [];
            }

            $students[] = [
                'studentId'           => $studentId,
                'studentName'         => (string)$student['name'],
                'gradeLabel'          => (string)$grade,
                'courseName'          => (string)$student['class_name'],
                'absentCount'         => $monthlyCounts[$studentId]['absentCount'] ?? 0,
                'officialAbsentCount' => $monthlyCounts[$studentId]['officialAbsentCount'] ?? 0,
                'attendance'          => $attendance,
            ];
        }

        $months[] = [
            'year'     => $year,
            'month'    => $month,
            'dates'    => $dates,
            'students' => $students,
        ];
    }

    jsonResponse([
        'success'    => true,
        'fiscalYear' => $fiscalYear,
        'grade'      => $grade,
        'months'     => $months,
    ]);

} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => '年度出欠帳票データの取得に失敗しました。',
        'error'   => $e->getMessage(),
    ], 500);
}

/**
 * 月内の日付一覧を作成
 */
function buildMonthDates(string $startDate, string $endDate): array
{
    $result = [];
    $current = strtotime($startDate);
    $end = strtotime($endDate);

    $weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    while ($current <= $end) {
        $result[] = [
            'date'    => date('Y-m-d', $current),
            'weekday' => $weekdays[(int)date('w', $current)],
        ];
        $current = strtotime('+1 day', $current);
    }

    return $result;
}

/**
 * 月内の出欠データを取得して
 * [student_id][date] = [
 *   ['time' => 1, 'subject' => 'Java', 'status' => '○'],
 *   ...
 * ]
 * の形で返す
 */
function fetchMonthAttendanceMap(PDO $pdo, array $studentIds, string $monthStart, string $monthEnd): array
{
    if (empty($studentIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($studentIds), '?'));

    $sql = "
        SELECT
            a.student_id,
            a.date,
            a.time,
            COALESCE(l.lesson_name, '') AS lesson_name,
            COALESCE(ast.status_name, '') AS status_name
        FROM attendances a
        LEFT JOIN lessons l
            ON a.lesson_id = l.lesson_id
        LEFT JOIN attendances_status ast
            ON a.status_id = ast.status_id
        WHERE a.student_id IN ($placeholders)
          AND a.date BETWEEN ? AND ?
        ORDER BY a.student_id ASC, a.date ASC, a.time ASC, l.lesson_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    $params = [...$studentIds, $monthStart, $monthEnd];
    $stmt->execute($params);

    $rows = $stmt->fetchAll();

    $map = [];

    foreach ($rows as $row) {
        $studentId = (string)$row['student_id'];
        $date      = (string)$row['date'];
        $time      = (int)$row['time'];
        $subject   = trim((string)$row['lesson_name']);
        $status    = convertStatusToSymbol((string)$row['status_name']);

        if (!isset($map[$studentId])) {
            $map[$studentId] = [];
        }
        if (!isset($map[$studentId][$date])) {
            $map[$studentId][$date] = [];
        }

        $map[$studentId][$date][] = [
            'time'    => $time,
            'subject' => $subject,
            'status'  => $status,
        ];
    }

    // time → subject の順で並び替え
    foreach ($map as $studentId => $dateMap) {
        foreach ($dateMap as $date => $list) {
            usort($list, static function (array $a, array $b): int {
                $timeA = (int)($a['time'] ?? 0);
                $timeB = (int)($b['time'] ?? 0);

                if ($timeA !== $timeB) {
                    return $timeA <=> $timeB;
                }

                return strcmp((string)($a['subject'] ?? ''), (string)($b['subject'] ?? ''));
            });

            $map[$studentId][$date] = $list;
        }
    }

    return $map;
}

/**
 * 欠数 / 公欠数 を計算
 *
 * 欠数:
 *   欠席数 + floor((遅刻数 + 早退数) / 3)
 *
 * 公欠数:
 *   公欠数
 */
function calculateMonthlyCounts(array $attendanceMap): array
{
    $result = [];

    foreach ($attendanceMap as $studentId => $dateMap) {
        $absentRawCount = 0;
        $lateLeaveCount = 0;
        $officialAbsentCount = 0;

        foreach ($dateMap as $list) {
            foreach ($list as $cell) {
                $status = (string)($cell['status'] ?? '');

                if ($status === '×' || $status === '欠') {
                    $absentRawCount++;
                }

                if ($status === '遅' || $status === '早') {
                    $lateLeaveCount++;
                }

                if ($status === '公') {
                    $officialAbsentCount++;
                }
            }
        }

        $absentCount = $absentRawCount + intdiv($lateLeaveCount, 3);

        $result[$studentId] = [
            'absentCount'         => $absentCount,
            'officialAbsentCount' => $officialAbsentCount,
        ];
    }

    return $result;
}

/**
 * DBの状態名を帳票記号に変換
 */
function convertStatusToSymbol(string $statusName): string
{
    $normalized = trim($statusName);

    return match ($normalized) {
        '出席'   => '○',
        '欠席'   => '×',
        '公欠'   => '公',
        '遅刻'   => '遅',
        '早退'   => '早',
        '未選択' => '',
        default  => $normalized,
    };
}