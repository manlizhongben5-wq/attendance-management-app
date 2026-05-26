<?php
declare(strict_types=1);

session_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/db.php';
// require_once __DIR__ . '/auth_check.php'; // 必要なら有効化

/**
 * 26文字の attendance_id を生成
 */
function generateAttendanceId(): string
{
    return bin2hex(random_bytes(13));
}

try {
    $pdo = getDb();

    // -----------------------------
    // JSON受信
    // -----------------------------
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);

    if (!is_array($input)) {
        jsonResponse([
            'success' => false,
            'message' => 'JSONの読み取りに失敗しました。'
        ], 400);
    }

    // -----------------------------
    // JSから受け取る想定
    // {
    //   date: '2026-03-18',
    //   period: 1,
    //   lesson_id: 1,
    //   confirm_overwrite: false,
    //   items: [
    //     { student_id: 'S00001', status: 'present' },
    //     ...
    //   ]
    // }
    // -----------------------------
    $date = $input['date'] ?? '';
    $period = isset($input['period']) ? (int)$input['period'] : 0;
    $lessonId = isset($input['lesson_id']) ? (int)$input['lesson_id'] : 0;
    $items = $input['items'] ?? [];
    $confirmOverwrite = isset($input['confirm_overwrite']) ? (bool)$input['confirm_overwrite'] : false;

    // セッションから教員IDを取得
    $teacherId = $_SESSION['user_id'] ?? null;

    // -----------------------------
    // JSのstatus文字列 → DBのstatus_idへ変換
    // -----------------------------
    $statusMap = [
        'present'   => 1, // 出席
        'absent'    => 2, // 欠席
        'late'      => 3, // 遅刻
        'leave'     => 4, // 早退
        'official'  => 5, // 公欠
        'separate'  => 6, // 別室
    ];

    // -----------------------------
    // バリデーション
    // -----------------------------
    $errors = [];

    if ($date === '') {
        $errors[] = '日付が指定されていません。';
    }

    if ($period <= 0) {
        $errors[] = '時限が指定されていません。';
    }

    if ($lessonId <= 0) {
        $errors[] = '科目が指定されていません。';
    }

    if ($teacherId === null || $teacherId === '') {
        $errors[] = '教員セッションが切れています。再ログインしてください。';
    }

    if (!is_array($items) || empty($items)) {
        $errors[] = '出欠データが送信されていません。';
    } else {
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                $errors[] = ($index + 1) . '件目のデータ形式が不正です。';
                continue;
            }

            if (!isset($item['student_id']) || $item['student_id'] === '' || $item['student_id'] === null) {
                $errors[] = ($index + 1) . '件目の student_id がありません。';
            }

            if (!array_key_exists('status', $item)) {
                $errors[] = ($index + 1) . '件目の status がありません。';
                continue;
            }

            $status = (string)$item['status'];

            if ($status !== 'unselected' && !isset($statusMap[$status])) {
                $errors[] = ($index + 1) . '件目の status が不正です。';
            }
        }
    }

    if (!empty($errors)) {
        jsonResponse([
            'success' => false,
            'message' => '入力内容に不備があります。',
            'details' => $errors
        ], 400);
    }

    // -----------------------------
    // 確認用：既存データとの差分チェック
    //
    // 条件:
    // - 判定キーは student_id + date + time
    // - lesson_id は既存判定に使わない
    // - 差分がある場合のみ confirm_required を返す
    //   1) 既存あり + 今回 unselected → 削除対象
    //   2) 既存あり + status_id が違う → 上書き対象
    //   3) 既存あり + lesson_id が違う → 上書き対象
    // - 件数は「生徒件数」で返す
    // - 登録済み科目は既存レコード側の科目名を重複排除して返す
    // -----------------------------
    if (!$confirmOverwrite) {
        $confirmCheckSql = "
            SELECT
                a.attendance_id,
                a.lesson_id,
                a.status_id,
                l.lesson_name
            FROM attendances a
            LEFT JOIN lessons l
                ON a.lesson_id = l.lesson_id
            WHERE a.student_id = :student_id
              AND a.date = :date
              AND a.time = :time
            ORDER BY a.attendance_id ASC
        ";
        $confirmCheckStmt = $pdo->prepare($confirmCheckSql);

        $affectedStudentIds = [];
        $existingLessonNames = [];

        foreach ($items as $item) {
            $studentId = (string)$item['student_id'];
            $statusKey = (string)$item['status'];

            $confirmCheckStmt->execute([
                ':student_id' => $studentId,
                ':date' => $date,
                ':time' => $period,
            ]);

            $existingRows = $confirmCheckStmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($existingRows)) {
                continue;
            }

            $hasDifference = false;

            if ($statusKey === 'unselected') {
                // 既存あり + unselected → 削除対象
                $hasDifference = true;
            } else {
                $newStatusId = $statusMap[$statusKey];

                foreach ($existingRows as $row) {
                    $existingStatusId = (int)$row['status_id'];
                    $existingLessonId = (int)$row['lesson_id'];

                    if ($existingStatusId !== $newStatusId || $existingLessonId !== $lessonId) {
                        $hasDifference = true;
                    }

                    $lessonName = trim((string)($row['lesson_name'] ?? ''));
                    if ($lessonName !== '') {
                        $existingLessonNames[$lessonName] = true;
                    }
                }
            }

            if ($statusKey === 'unselected') {
                foreach ($existingRows as $row) {
                    $lessonName = trim((string)($row['lesson_name'] ?? ''));
                    if ($lessonName !== '') {
                        $existingLessonNames[$lessonName] = true;
                    }
                }
            }

            if ($hasDifference) {
                $affectedStudentIds[$studentId] = true;
            }
        }

        $affectedCount = count($affectedStudentIds);

        if ($affectedCount > 0) {
            $lessonNames = array_keys($existingLessonNames);
            sort($lessonNames, SORT_NATURAL | SORT_FLAG_CASE);

            jsonResponse([
                'success' => true,
                'confirm_required' => true,
                'message' => 'すでに登録されている出欠データがあります。更新しますか？',
                'affected_count' => $affectedCount,
                'existing_lessons' => $lessonNames,
            ]);
        }
    }

    // -----------------------------
    // SQL準備
    //
    // 新仕様:
    // 同じ student_id / date / time があれば同一レコード扱い
    // lesson_id が違っていても上書きする
    //
    // - 既存あり + status != unselected → UPDATE
    // - 既存あり + status == unselected → DELETE
    // - 既存なし + status != unselected → INSERT
    // - 既存なし + status == unselected → 何もしない
    //
    // ※DB制約を変更しないため、過去データに重複がある場合も考慮して
    //   同一 student_id/date/time の既存行をすべて拾う
    // -----------------------------
    $findSql = "
        SELECT attendance_id
        FROM attendances
        WHERE student_id = :student_id
          AND date = :date
          AND time = :time
        ORDER BY attendance_id ASC
    ";
    $findStmt = $pdo->prepare($findSql);

    $updateSql = "
        UPDATE attendances
        SET
            lesson_id = :lesson_id,
            teacher_id = :teacher_id,
            status_id = :status_id
        WHERE attendance_id = :attendance_id
    ";
    $updateStmt = $pdo->prepare($updateSql);

    $insertSql = "
        INSERT INTO attendances
        (
            attendance_id,
            student_id,
            time,
            date,
            lesson_id,
            teacher_id,
            status_id
        )
        VALUES
        (
            :attendance_id,
            :student_id,
            :time,
            :date,
            :lesson_id,
            :teacher_id,
            :status_id
        )
    ";
    $insertStmt = $pdo->prepare($insertSql);

    $deleteSql = "
        DELETE FROM attendances
        WHERE attendance_id = :attendance_id
    ";
    $deleteStmt = $pdo->prepare($deleteSql);

    $pdo->beginTransaction();

    $savedCount = 0;
    $insertedCount = 0;
    $updatedCount = 0;
    $deletedCount = 0;
    $skippedCount = 0;
    $deduplicatedCount = 0;

    foreach ($items as $item) {
        $studentId = (string)$item['student_id'];
        $statusKey = (string)$item['status'];

        // 既存レコード検索（同じ日・同じ時限・同じ生徒）
        $findStmt->execute([
            ':student_id' => $studentId,
            ':date' => $date,
            ':time' => $period,
        ]);

        $existingRows = $findStmt->fetchAll(PDO::FETCH_ASSOC);
        $existingCount = count($existingRows);

        // ---------------------------------
        // 未選択なら既存レコードを削除
        // ---------------------------------
        if ($statusKey === 'unselected') {
            if ($existingCount > 0) {
                foreach ($existingRows as $row) {
                    $deleteStmt->execute([
                        ':attendance_id' => $row['attendance_id'],
                    ]);
                    $deletedCount++;
                }
                $savedCount++;
            } else {
                $skippedCount++;
            }
            continue;
        }

        $statusId = $statusMap[$statusKey];

        // ---------------------------------
        // 既存なし → INSERT
        // ---------------------------------
        if ($existingCount === 0) {
            $insertStmt->execute([
                ':attendance_id' => generateAttendanceId(),
                ':student_id' => $studentId,
                ':time' => $period,
                ':date' => $date,
                ':lesson_id' => $lessonId,
                ':teacher_id' => $teacherId,
                ':status_id' => $statusId,
            ]);

            $insertedCount++;
            $savedCount++;
            continue;
        }

        // ---------------------------------
        // 既存あり → 先頭1件を正としUPDATE
        //            2件目以降は重複として削除
        // ---------------------------------
        $primaryAttendanceId = $existingRows[0]['attendance_id'];

        $updateStmt->execute([
            ':lesson_id' => $lessonId,
            ':teacher_id' => $teacherId,
            ':status_id' => $statusId,
            ':attendance_id' => $primaryAttendanceId,
        ]);

        $updatedCount++;
        $savedCount++;

        if ($existingCount > 1) {
            for ($i = 1; $i < $existingCount; $i++) {
                $deleteStmt->execute([
                    ':attendance_id' => $existingRows[$i]['attendance_id'],
                ]);
                $deletedCount++;
                $deduplicatedCount++;
            }
        }
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'confirm_required' => false,
        'message' => '出欠情報を保存しました。',
        'saved_count' => $savedCount,
        'inserted_count' => $insertedCount,
        'updated_count' => $updatedCount,
        'deleted_count' => $deletedCount,
        'skipped_count' => $skippedCount,
        'deduplicated_count' => $deduplicatedCount
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => '保存に失敗しました。',
        'error' => $e->getMessage()
    ], 500);
}