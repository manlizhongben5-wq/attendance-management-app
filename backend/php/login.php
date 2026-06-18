<?php
// login.php
declare(strict_types=1);

require_once __DIR__ .'/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

$pdo = getDb();
session_start();

$id = $_POST['id'] ?? '';
$pass = $_POST['password'] ?? '';
$role = $_POST['role'] ?? ''; // 'admin', 'teacher', 'student'

// 役割に応じてテーブルとIDカラムを定義
$config = [
    'admin'   => [
        'table' => 'admin',
        'id_col' => 'admin_id',
        'pass_col' => 'password'
    ],
    'teacher' => [
        'table' => 'teachers',
        'id_col' => 'teacher_id',
        'pass_col' => 'password',
        'name_col' => 'name'
    ],
    'student' => [
        'table' => 'students',
        'id_col' => 'student_id',
        'pass_col' => 'password',
        'name_col' => 'name'
    ]
];

// roleチェック
if (!isset($config[$role])) {

    echo json_encode([
        'status' => 'error',
        'message' => '無効な役割です'
    ]);

    exit;
}

$c = $config[$role];

$nameSelect = '';

if (isset($c['name_col'])) {

    $nameSelect = ", {$c['name_col']}";
}

// SQLを実行してユーザーを取得
$sql = "
SELECT
    {$c['id_col']},
    {$c['pass_col']}
    {$nameSelect}
FROM {$c['table']}
WHERE {$c['id_col']} = ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$id]);
$user = $stmt->fetch();

// ログイン判定
if ($user) {

    $dbPassword = $user[$c['pass_col']];

    // ハッシュ照合
    $isValidPassword = password_verify($pass, $dbPassword);

    // 旧平文との互換（移行期間限定）
    if (!$isValidPassword && $pass === $dbPassword) {

        // ログイン成功扱い
        $isValidPassword = true;

        // 自動ハッシュ化
        $newHash = password_hash(
            $pass,
            PASSWORD_DEFAULT
        );

        $updateSql = "
        UPDATE {$c['table']}
        SET {$c['pass_col']} = ?
        WHERE {$c['id_col']} = ?
        ";

        $updateStmt = $pdo->prepare($updateSql);

        $updateStmt->execute([
            $newHash,
            $id
        ]);
    }

    if ($isValidPassword) {

    session_regenerate_id(true);

    $_SESSION['user_id'] = $id;
    $_SESSION['role'] = $role;

    $response = [
        'status' => 'success',
        'message' => 'ログイン成功'
    ];

    // 名前カラムがある場合のみ追加
    if (isset($c['name_col'])) {

        $response['name'] = $user[$c['name_col']];
    }

    echo json_encode($response);

    exit;
}
}

// 失敗
echo json_encode([
    'status' => 'error',
    'message' => 'IDまたはパスワードが正しくありません'
]);

exit;