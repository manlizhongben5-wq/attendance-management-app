<?php
declare(strict_types=1);

require_once __DIR__ .'/../config/db.php'; // jsonResponse()があるファイル

header("Content-Type: application/json; charset=UTF-8");

try {

    // =========================
    // DB接続
    // =========================
    $pdo = getDb();

    // =========================
    // JSON取得
    // =========================
    $input = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($input)) {
        jsonResponse([
            'success' => false,
            'message' => 'リクエスト形式が不正です'
        ], 400);
    }

    // =========================
    // 値取得
    // =========================
    $role = trim($input['role'] ?? '');
    $id = trim($input['id'] ?? '');
    $name = trim($input['name'] ?? '');
    $password = trim($input['password'] ?? '');

    // 学生のみ使用
    $course = trim((string)($input['course'] ?? ''));
    $enrollmentYear = trim(
        (string)($input['enrollmentYear'] ?? '')
    );

    // =========================
    // 共通バリデーション
    // =========================
    if ($role === '') {
        throw new Exception('ユーザー種別が不正です');
    }

    if ($id === '') {
        throw new Exception('IDを入力してください');
    }

    if ($name === '') {
        throw new Exception('名前を入力してください');
    }

    if ($password === '') {
        throw new Exception('パスワードを入力してください');
    }

    // ここから teacher / student の処理へ
    // ハッシュ化
    $hashedPassword = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    // ============================
    // transaction開始
    // ============================
    $pdo->beginTransaction();

    // =========================
    // 教員登録
    // =========================
    if ($role === 'teacher') {

        $checkSql = "
        SELECT 1
        FROM teachers
        WHERE teacher_id = :id
        ";

        // 重複チェック
        $checkStmt = $pdo->prepare($checkSql);

        $checkStmt->execute([
            ':id' => $id
        ]);

        if ($checkStmt->fetchColumn()) {
            throw new Exception('その教員番号は既に登録されています');
        }

        $sql = "
            INSERT INTO teachers (
                teacher_id,
                password,
                name,
                is_editor
            )
            VALUES (
                :teacher_id,
                :password,
                :name,
                0
            )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':teacher_id' => $id,
            ':password'   => $hashedPassword,
            ':name'       => $name
        ]);
    }
    // =========================
    // 学生登録
    // =========================
    elseif ($role === 'student') {

        $checkSql = "
        SELECT 1
        FROM students
        WHERE student_id = :id
        ";

        if ($course === '') {
            throw new Exception('コースを選択してください');
        }

        if (!preg_match('/^\d{4}$/', $enrollmentYear)) {
            throw new Exception('入学年度は4桁で入力してください');
        }

        // 重複チェック
        $checkStmt = $pdo->prepare($checkSql);

        $checkStmt->execute([
            ':id' => $id
        ]);

        if ($checkStmt->fetchColumn()) {
            throw new Exception('その学生番号は既に登録されています');
        }

        $sql = "
            INSERT INTO students (
                student_id,
                password,
                name,
                class_id,
                enrollment_year
            )
            VALUES (
                :student_id,
                :password,
                :name,
                :class_id,
                :enrollment_year
            )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':student_id'      => $id,
            ':password'        => $hashedPassword,
            ':name'            => $name,
            ':class_id'        => (int)$course,
            ':enrollment_year' => $enrollmentYear
        ]);

    }

    // roleの不正値チェック
    if (
    $role !== 'teacher' &&
    $role !== 'student'
    ) {
        throw new Exception(
            'ユーザー種別が不正です'
        );
    }

    // ============================
    // transaction確定
    // ============================
    $pdo->commit();

        // 登録成功
        jsonResponse([
        'success' => true,
        'message' => '登録しました'
        ]);

} catch (Throwable $e) {

     // transaction中なら取り消し
    if (
    isset($pdo)
     && $pdo->inTransaction()
     ) {
        $pdo->rollBack();
     }

    jsonResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 500);
}

