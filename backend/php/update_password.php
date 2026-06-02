<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

session_start();

$pdo = getDb();


// POST受け取り
$userId = $_POST['user_id'] ?? '';
$role = $_POST['role'] ?? '';
$newPassword = $_POST['new_password'] ?? ''; // 新しいパスワード
$confirmPassword = $_POST['confirm_password'] ?? ''; // 新しいパスワード（確認）
    // 前後空白除去
$newPassword = trim($newPassword);
$confirmPassword = trim($confirmPassword);

// 管理者以外アクセス禁止
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

// 未入力チェック
if (
    $userId === '' ||
    $newPassword === '' ||
    $confirmPassword === ''
) {

    echo json_encode([
        'status' => 'error',
        'message' => '未入力の項目があります'
    ]);

    exit;
}

// パスワード文字数チェック
if (
    mb_strlen($newPassword) < 8 ||
    mb_strlen($newPassword) > 72
) {

    echo json_encode([
        'status' => 'error',
        'message' => 'パスワードは8〜72文字で入力してください'
    ]);

    exit;
}

// 一致チェック
if ($newPassword !== $confirmPassword) {

    echo json_encode([
        'status' => 'error',
        'message' => 'パスワードが一致しません'
    ]);

    exit;
}


// ハッシュ化
$passwordHash = password_hash(
    $newPassword,
    PASSWORD_DEFAULT
);


// UPDATE
if ($role === 'teacher') {

    $sql = "
    UPDATE teachers
    SET password = ?
    WHERE teacher_id = ?
    ";

} elseif ($role === 'student') {

    $sql = "
    UPDATE students
    SET password = ?
    WHERE student_id = ?
    ";

} else {

    echo json_encode([
        'status' => 'error',
        'message' => '対象ユーザー種別が不正です'
    ]);

    exit;
}

$stmt = $pdo->prepare($sql);

$stmt->execute([
    $passwordHash,
    $userId
]);


// 成功
echo json_encode([
    'status' => 'success',
    'message' => 'パスワードを変更しました'
]);

exit;