<?php
declare(strict_types=1);

/* DB接続公開用サンプルファイル */
function getDb(): PDO
{
    // DB接続設定（サンプル）
    $host = 'localhost';
    $dbname = 'your_database';
    $user = 'your_user';
    $pass = 'your_password';
    $charset = 'utf8mb4';

    // DSN（接続情報）
    $dsn = "mysql:host={$host};dbname={$dbname};charset={$charset}";

    // PDOオプション
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // PDOインスタンス生成
    return new PDO($dsn, $user, $pass, $options);
}

/* JSONレスポンス */
function jsonResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(
        $data, 
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}