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
