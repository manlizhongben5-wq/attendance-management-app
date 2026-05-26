CREATE TABLE `lessons` (
    `lesson_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lesson_name` VARCHAR(50) NOT NULL,
    `lesson_count` TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY(`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;