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