<?php
declare(strict_types=1);

/**
 * check_session.php
 * 役割：
 * - PHPセッションの有無を確認する
 * - ログイン中なら user_id / role を返す
 * - 未ログインなら error を返す
 */

header('Content-Type: application/json; charset=UTF-8');

session_start();

if (
    isset($_SESSION['user_id']) &&
    isset($_SESSION['role']) &&
    $_SESSION['user_id'] !== '' &&
    $_SESSION['role'] !== ''
) {
    echo json_encode([
        'status'  => 'success',
        'message' => 'ログイン中です',
        'user_id' => $_SESSION['user_id'],
        'role'    => $_SESSION['role']
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(401);
echo json_encode([
    'status'  => 'error',
    'message' => 'ログインしてください'
], JSON_UNESCAPED_UNICODE);
exit;
?>