<?php
declare(strict_types=1);

// エラー表示設定（デバッグ時のみ。本番はoffにしてください）
ini_set('display_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ .'/../config/db.php';
$pdo = getDb();
session_start();

header("Content-Type: application/json; charset=UTF-8");

// 共通レスポンス関数（定義されていない場合のエラーを防ぐためここで定義）
function sendJsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$userId = $_SESSION['user_id'] ?? null;
$action = $_GET['action'] ?? '';

if (!$userId) {
    sendJsonResponse(['success' => false, 'message' => 'セッション切れ'], 401);
}

try {
    if ($action === 'status') {
        // 現在の編集者を取得
        $stmt = $pdo->prepare("SELECT `teacher_id`, `name` FROM `teachers` WHERE `is_editor` = 1 LIMIT 1");
        $stmt->execute();
        $editor = $stmt->fetch();

        sendJsonResponse([
            'success' => true,
            'is_someone_editing' => (bool)$editor,
            'editor_name' => $editor ? $editor['name'] : null,
            'is_me' => $editor ? ($editor['teacher_id'] === $userId) : false
        ]);
    } 
    elseif ($action === 'lock') {
        // 編集を開始する（自分が1になる）
        // すでに誰かが編集中でないかチェック（自分以外）
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `teachers` WHERE `is_editor` = 1 AND `teacher_id` != ?");
        $stmt->execute([$userId]);
        if ($stmt->fetchColumn() > 0) {
            sendJsonResponse(['success' => false, 'message' => '他の先生が編集中です'], 403);
        }

        $stmt = $pdo->prepare("UPDATE `teachers` SET `is_editor` = 1 WHERE `teacher_id` = ?");
        $stmt->execute([$userId]);
        sendJsonResponse(['success' => true]);
    } 
    elseif ($action === 'unlock') {
        // 編集を終了する（全員0にする、または自分を0にする）
        // 安全のため自分を0にする
        $stmt = $pdo->prepare("UPDATE `teachers` SET `is_editor` = 0 WHERE `teacher_id` = ?");
        $stmt->execute([$userId]);
        sendJsonResponse(['success' => true]);
    }
    else {
        sendJsonResponse(['success' => false, 'message' => '無効なアクション'], 400);
    }

} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'message' => 'サーバーエラー: ' . $e->getMessage()], 500);
}