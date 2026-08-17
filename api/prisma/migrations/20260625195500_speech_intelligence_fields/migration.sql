ALTER TABLE `speech_sessions`
  ADD COLUMN `sentenceCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `repetitionScore` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `pauseFrequency` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `languageMix` JSON NULL,
  ADD COLUMN `coachingFeedback` JSON NULL,
  ADD COLUMN `personalizedSuggestions` JSON NULL,
  ADD COLUMN `miniMission` VARCHAR(191) NULL,
  ADD COLUMN `analysisMeta` JSON NULL;
