-- AlterTable
ALTER TABLE `sessions` ADD COLUMN `topic_id` BIGINT NULL;

-- CreateTable
CREATE TABLE `bap` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT NOT NULL,
    `instructor_id` BIGINT NOT NULL,
    `topic_id` BIGINT NULL,
    `teaching_date` DATE NOT NULL,
    `method` VARCHAR(30) NOT NULL DEFAULT 'ONSITE',
    `duration_hours` DECIMAL(4, 1) NULL DEFAULT 2.0,
    `location` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `submitted_at` DATETIME(0) NULL,
    `reviewed_by` BIGINT NULL,
    `reviewed_at` DATETIME(0) NULL,
    `review_notes` TEXT NULL,
    `sync_attendance` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_bap_instructor`(`instructor_id`),
    INDEX `fk_bap_reviewer`(`reviewed_by`),
    INDEX `fk_bap_topic`(`topic_id`),
    UNIQUE INDEX `uq_bap_session_instructor`(`session_id`, `instructor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bap_attendance` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `bap_id` BIGINT NOT NULL,
    `participant_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    `notes` VARCHAR(500) NULL,

    INDEX `fk_bap_att_participant`(`participant_id`),
    UNIQUE INDEX `uq_bap_attendance`(`bap_id`, `participant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_topics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `module_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `sequence_no` INTEGER NOT NULL DEFAULT 1,
    `duration_hours` DECIMAL(4, 1) NULL DEFAULT 2.0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_module_topics_module`(`module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `fk_sessions_topic` ON `sessions`(`topic_id`);

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_sessions_topic` FOREIGN KEY (`topic_id`) REFERENCES `module_topics`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bap` ADD CONSTRAINT `fk_bap_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bap` ADD CONSTRAINT `fk_bap_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bap` ADD CONSTRAINT `fk_bap_session` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bap` ADD CONSTRAINT `fk_bap_topic` FOREIGN KEY (`topic_id`) REFERENCES `module_topics`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bap_attendance` ADD CONSTRAINT `fk_bap_att_bap` FOREIGN KEY (`bap_id`) REFERENCES `bap`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bap_attendance` ADD CONSTRAINT `fk_bap_att_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `module_topics` ADD CONSTRAINT `fk_module_topics_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

