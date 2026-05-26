CREATE TABLE `attendances_status` (
    `status_id` TINYINT UNSIGNED NOT NULL,
    `status_name` VARCHAR(10) NOT NULL,
    PRIMARY KEY(`status_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;