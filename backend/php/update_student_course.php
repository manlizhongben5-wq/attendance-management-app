<?php

/**
 * update_student_course.php
 *
 * 学生のコース情報を更新する処理
 *
 * 呼び出し元：
 * admin-user-edit_student.html
 *
 * 更新対象：
 * students.class_id
 *
 * 戻り値：
 * JSON
 */

declare(strict_types=1);

require_once __DIR__ .'/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

session_start();

$pdo = getDb();

// 管理者チェック
if (
    !isset($_SESSION['role']) ||
    $_SESSION['role'] !== 'admin'
) {

    echo json_encode([
        'status' => 'error',
        'message' => '権限がありません'
    ]);

    exit;
}

// POST取得
$studentId = $_POST['student_id'] ?? '';
$courseId = $_POST['course_id'] ?? '';

// 入力チェック
if (
    $studentId === '' ||
    $courseId === ''
) {

    echo json_encode([
        'status' => 'error',
        'message' => '未入力項目があります'
    ]);

    exit;
}

// UPDATE
$sql = "
UPDATE students
SET class_id = ?
WHERE student_id = ?
";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $courseId,
    $studentId
]);

// 成功レスポンス
echo json_encode([
    'status' => 'success',
    'message' => 'コースを変更しました'
]);

exit;