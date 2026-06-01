
-- ========================================
-- クラス
-- ========================================

INSERT INTO classes (
    class_id,
    class_name
) VALUES
(1, 'class_A'),
(2, 'class_B');



-- ========================================
-- 出欠状態
-- ========================================

INSERT INTO attendances_status (
    status_id,
    status_name
) VALUES
(1, '出席'),
(2, '欠席'),
(3, '遅刻'),
(4, '早退'),
(5, '公欠'),
(6, '別室');



-- ========================================
-- 教員
-- password: password
-- ========================================

INSERT INTO teachers (
    teacher_id,
    password,
    name,
    is_editor
) VALUES
('0000000001', 'password', 'teacher01', 1),
('0000000002', 'password', 'teacher02', 0);



-- ========================================
-- 生徒
-- password: password
-- ========================================

INSERT INTO students (
    student_id,
    password,
    name,
    class_id,
    enrollment_year
) VALUES
('000001', 'password', 'student01', 1, '2025'),
('000002', 'password', 'student02', 2, '2025'),
('000003', 'password', 'student03', 1, '2026'),
('000004', 'password', 'student04', 2, '2026');



-- ========================================
-- 管理者
-- password: password
-- ========================================

INSERT INTO admin (
    admin_id,
    password
) VALUES
('admin01', 'password');



-- ========================================
-- 授業
-- ========================================

INSERT INTO lessons (
    lesson_id,
    lesson_name,
    lesson_count
) VALUES
(1, 'PHP基礎', 16),
(2, 'JavaScript基礎', 16),
(3, 'DB基礎', 16);



-- ========================================
-- 出欠データ
-- ========================================

INSERT INTO attendances (
    attendance_id,
    student_id,
    time,
    date,
    lesson_id,
    teacher_id,
    status_id
) VALUES
(
    'attendance00000000000001',
    '000001',
    1,
    '2026-05-01',
    1,
    '0000000001',
    1
),
(
    'attendance00000000000002',
    '000002',
    1,
    '2026-05-01',
    1,
    '0000000001',
    2
),
(
    'attendance00000000000003',
    '000003',
    1,
    '2026-05-01',
    2,
    '0000000002',
    3
),
(
    'attendance00000000000004',
    '000004',
    1,
    '2026-05-01',
    2,
    '0000000002',
    4
);

