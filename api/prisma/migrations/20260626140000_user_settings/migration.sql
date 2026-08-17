-- CreateTable
CREATE TABLE `user_settings` (
    `userId` VARCHAR(191) NOT NULL,
    `dailyReminders` BOOLEAN NOT NULL DEFAULT false,
    `soundEffects` BOOLEAN NOT NULL DEFAULT true,
    `darkMode` BOOLEAN NOT NULL DEFAULT true,
    `weeklyReportEmail` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
