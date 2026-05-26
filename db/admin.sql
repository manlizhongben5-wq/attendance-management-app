CREATE TABLE `admin` (
    `admin_id` VARCHAR(30) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;