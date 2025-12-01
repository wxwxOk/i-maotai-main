-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(64) NOT NULL,
    `unionid` VARCHAR(64) NULL,
    `nickname` VARCHAR(64) NULL,
    `avatarUrl` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_openid_key`(`openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mt_accounts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `mt_user_id` VARCHAR(32) NULL,
    `token` TEXT NULL,
    `cookie` TEXT NULL,
    `device_id` VARCHAR(64) NULL,
    `province_name` VARCHAR(32) NULL,
    `city_name` VARCHAR(32) NULL,
    `lat` VARCHAR(32) NULL,
    `lng` VARCHAR(32) NULL,
    `address` VARCHAR(255) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `token_expire_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `mt_accounts_user_id_idx`(`user_id`),
    INDEX `mt_accounts_mobile_idx`(`mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_configs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT NOT NULL,
    `item_codes` VARCHAR(255) NULL,
    `shop_type` TINYINT NOT NULL DEFAULT 1,
    `reserve_minute` TINYINT NOT NULL DEFAULT 9,
    `random_minute` TINYINT NOT NULL DEFAULT 0,
    `auto_travel` TINYINT NOT NULL DEFAULT 1,
    `is_enabled` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reservation_configs_account_id_key`(`account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT NOT NULL,
    `item_id` VARCHAR(32) NULL,
    `item_name` VARCHAR(64) NULL,
    `shop_id` VARCHAR(32) NULL,
    `shop_name` VARCHAR(128) NULL,
    `status` TINYINT NULL,
    `result_msg` TEXT NULL,
    `reserve_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_logs_account_id_idx`(`account_id`),
    INDEX `reservation_logs_reserve_date_idx`(`reserve_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `item_id` VARCHAR(32) NOT NULL,
    `title` VARCHAR(128) NULL,
    `content` VARCHAR(255) NULL,
    `picture_url` VARCHAR(255) NULL,
    `price` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `items_item_id_key`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mt_accounts` ADD CONSTRAINT `mt_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_configs` ADD CONSTRAINT `reservation_configs_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `mt_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_logs` ADD CONSTRAINT `reservation_logs_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `mt_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
