CREATE TABLE `logs` (
    `log_id` CHAR(26) NOT NULL,
    `log_data` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;