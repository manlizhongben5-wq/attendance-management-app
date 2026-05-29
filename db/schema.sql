-- =========================
-- admin テーブル
-- =========================
CREATE TABLE `admin` (
    `admin_id` VARCHAR(30) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- attendances_status テーブル
-- =========================
CREATE TABLE `attendances_status` (
    `status_id` TINYINT UNSIGNED NOT NULL,
    `status_name` VARCHAR(10) NOT NULL,
    PRIMARY KEY(`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- classes テーブル
-- =========================
CREATE TABLE `classes` (
    `class_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_name` VARCHAR(50) NOT NULL,
    PRIMARY KEY(`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- lessons テーブル
-- =========================
CREATE TABLE `lessons` (
    `lesson_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lesson_name` VARCHAR(50) NOT NULL,
    `lesson_count` TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY(`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- logs テーブル
-- =========================
CREATE TABLE `logs` (
    `log_id` CHAR(26) NOT NULL,
    `log_data` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- teachers テーブル
-- =========================
CREATE TABLE `teachers` (
    `teacher_id` CHAR(10) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `is_editor` TINYINT(1) UNSIGNED NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- students テーブル
-- =========================
CREATE TABLE `students` (
    `student_id` CHAR(6) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `class_id` INT UNSIGNED NOT NULL,
    `enrollment_year` CHAR(4) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`student_id`),
    FOREIGN KEY(`class_id`) REFERENCES `classes`(`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- attendances テーブル
-- =========================
CREATE TABLE `attendances` (
    `attendance_id` CHAR(26) NOT NULL,
    `student_id` CHAR(6) NOT NULL,
    `time` TINYINT UNSIGNED NOT NULL,
    `date` DATE NOT NULL,
    `lesson_id` INT UNSIGNED NOT NULL,
    `teacher_id` CHAR(10) NOT NULL,
    `status_id` TINYINT UNSIGNED NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`attendance_id`),
    FOREIGN KEY(`student_id`) REFERENCES `students`(`student_id`),
    FOREIGN KEY(`lesson_id`) REFERENCES `lessons`(`lesson_id`),
    FOREIGN KEY(`teacher_id`) REFERENCES `teachers`(`teacher_id`),
    FOREIGN KEY(`status_id`) REFERENCES `attendances_status`(`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
