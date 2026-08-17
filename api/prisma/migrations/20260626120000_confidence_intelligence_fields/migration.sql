-- AlterTable
ALTER TABLE `speech_sessions` ADD COLUMN `topic` VARCHAR(191) NULL,
    ADD COLUMN `confidenceComponents` JSON NULL,
    ADD COLUMN `localMetrics` JSON NULL,
    ADD COLUMN `aiInsights` JSON NULL,
    ADD COLUMN `fillerBreakdown` JSON NULL;
