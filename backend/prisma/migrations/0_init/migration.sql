-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NULL DEFAULT 'PESERTA',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `email_verified_at` DATETIME(0) NULL,
    `verification_token` VARCHAR(255) NULL,
    `last_login_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `reset_token` VARCHAR(255) NULL,
    `failed_login_attempts` INTEGER NULL DEFAULT 0,
    `lockout_until` DATETIME(0) NULL,
    `name` VARCHAR(255) NULL,
    `reset_token_expires_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_users_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `uq_roles_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,

    INDEX `fk_user_roles_role`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `uq_permissions_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` BIGINT NOT NULL,
    `permission_id` BIGINT NOT NULL,

    INDEX `fk_role_permissions_permission`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `participant_number` VARCHAR(100) NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `birth_place` VARCHAR(100) NULL,
    `birth_date` DATE NULL,
    `gender` VARCHAR(30) NULL,
    `marital_status` VARCHAR(50) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `nik` VARCHAR(20) NULL,
    `occupation` VARCHAR(150) NULL,
    `institution` VARCHAR(255) NULL,

    UNIQUE INDEX `uq_participants_number`(`participant_number`),
    INDEX `idx_participants_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructors` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_instructors_email`(`email`),
    INDEX `fk_instructors_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `passing_grade` DECIMAL(5, 2) NULL,
    `minimum_attendance_percent` DECIMAL(5, 2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `requirements` TEXT NULL,

    UNIQUE INDEX `uq_programs_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_modules_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_modules` (
    `program_id` BIGINT NOT NULL,
    `module_id` BIGINT NOT NULL,
    `sequence_no` INTEGER NULL,

    INDEX `fk_program_modules_module`(`module_id`),
    PRIMARY KEY (`program_id`, `module_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `program_id` BIGINT NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `registration_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,

    UNIQUE INDEX `uq_batches_program_code`(`program_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_participants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT NOT NULL,
    `participant_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
    `enrolled_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_batch_participants_participant`(`participant_id`),
    UNIQUE INDEX `uq_batch_participant`(`batch_id`, `participant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `capacity` INTEGER NULL,
    `location` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_rooms_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT NOT NULL,
    `module_id` BIGINT NULL,
    `room_id` BIGINT NULL,
    `title` VARCHAR(255) NOT NULL,
    `session_date` DATE NOT NULL,
    `start_time` VARCHAR(20) NOT NULL,
    `end_time` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sessions_schedule`(`session_date`, `start_time`, `end_time`),
    INDEX `fk_sessions_batch`(`batch_id`),
    INDEX `fk_sessions_module`(`module_id`),
    INDEX `fk_sessions_room`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_instructors` (
    `session_id` BIGINT NOT NULL,
    `instructor_id` BIGINT NOT NULL,

    INDEX `fk_session_instructors_instructor`(`instructor_id`),
    PRIMARY KEY (`session_id`, `instructor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT NOT NULL,
    `participant_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `notes` VARCHAR(500) NULL,
    `recorded_by` BIGINT NULL,
    `recorded_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_attendance_participant`(`participant_id`),
    INDEX `fk_attendance_recorder`(`recorded_by`),
    UNIQUE INDEX `uq_attendance_session_participant`(`session_id`, `participant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `program_id` BIGINT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    `passing_grade` DECIMAL(5, 2) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_exams_code`(`code`),
    INDEX `fk_exams_program`(`program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_results` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `exam_id` BIGINT NOT NULL,
    `participant_id` BIGINT NOT NULL,
    `score` DECIMAL(7, 2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `exam_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_exam_results_participant`(`participant_id`),
    UNIQUE INDEX `uq_exam_result`(`exam_id`, `participant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certification_results` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `participant_id` BIGINT NOT NULL,
    `batch_id` BIGINT NULL,
    `stage` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `decision_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_cert_results_participant`(`participant_id`),
    INDEX `fk_cert_results_batch`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `participant_id` BIGINT NOT NULL,
    `certificate_number` VARCHAR(150) NOT NULL,
    `verification_code` VARCHAR(150) NOT NULL,
    `issue_date` DATE NOT NULL,
    `expiry_date` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'VALID',
    `file_path` VARCHAR(500) NULL,
    `qr_payload` VARCHAR(500) NULL,
    `revoked_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_certificates_number`(`certificate_number`),
    UNIQUE INDEX `uq_certificates_verification`(`verification_code`),
    INDEX `fk_certificates_participant`(`participant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `participant_id` BIGINT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `subject` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `sent_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_notifications_participant`(`participant_id`),
    INDEX `fk_notifications_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_queue` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `notification_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `attempt_count` INTEGER NOT NULL DEFAULT 0,
    `scheduled_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `sent_at` DATETIME(0) NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notification_queue_status`(`status`, `scheduled_at`),
    INDEX `fk_notification_queue_notification`(`notification_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `source_type` VARCHAR(50) NOT NULL,
    `source_name` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `invalid_rows` INTEGER NOT NULL DEFAULT 0,
    `error_summary` TEXT NULL,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_import_logs_user`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `action` VARCHAR(100) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `record_type` VARCHAR(100) NULL,
    `record_id` VARCHAR(100) NULL,
    `before_data` LONGTEXT NULL,
    `after_data` LONGTEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_audit_module_record`(`module`, `record_type`, `record_id`),
    INDEX `idx_audit_created_at`(`created_at`),
    INDEX `fk_audit_logs_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_banners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `link_url` VARCHAR(500) NULL,
    `sequence_no` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_partners` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `logo_url` VARCHAR(500) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `sequence_no` INTEGER NULL DEFAULT 0,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `website_url` VARCHAR(500) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_news` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `content` LONGTEXT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `published_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_news_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participant_form_answers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `registration_id` BIGINT NOT NULL,
    `field_id` BIGINT NOT NULL,
    `answer_text` TEXT NULL,
    `file_url` VARCHAR(255) NULL,

    INDEX `fk_participant_form_answers_field`(`field_id`),
    INDEX `fk_participant_form_answers_registration`(`registration_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participant_registrations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `participant_id` BIGINT NOT NULL,
    `batch_id` BIGINT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_proof_url` VARCHAR(255) NULL,
    `payment_deadline` DATETIME(0) NULL,
    `submitted_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `reviewed_at` DATETIME(0) NULL,
    `reviewed_by` BIGINT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_participant_registrations_batch`(`batch_id`),
    INDEX `fk_participant_registrations_participant`(`participant_id`),
    INDEX `fk_participant_registrations_reviewed_by`(`reviewed_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_form_fields` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `program_id` BIGINT NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `field_type` VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    `options_json` TEXT NULL,
    `is_required` BOOLEAN NULL DEFAULT false,
    `allowed_extensions` VARCHAR(255) NULL,
    `order_index` INTEGER NULL DEFAULT 0,

    INDEX `fk_program_form_fields_program`(`program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructors` ADD CONSTRAINT `fk_instructors_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_modules` ADD CONSTRAINT `fk_program_modules_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_modules` ADD CONSTRAINT `fk_program_modules_program` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `fk_batches_program` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_participants` ADD CONSTRAINT `fk_batch_participants_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_participants` ADD CONSTRAINT `fk_batch_participants_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_sessions_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_sessions_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_sessions_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_instructors` ADD CONSTRAINT `fk_session_instructors_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_instructors` ADD CONSTRAINT `fk_session_instructors_session` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `fk_attendance_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `fk_attendance_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `fk_attendance_session` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `fk_exams_program` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `fk_exam_results_exam` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `fk_exam_results_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certification_results` ADD CONSTRAINT `fk_cert_results_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certification_results` ADD CONSTRAINT `fk_cert_results_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `fk_certificates_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_queue` ADD CONSTRAINT `fk_notification_queue_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `import_logs` ADD CONSTRAINT `fk_import_logs_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participant_form_answers` ADD CONSTRAINT `fk_participant_form_answers_field` FOREIGN KEY (`field_id`) REFERENCES `program_form_fields`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `participant_form_answers` ADD CONSTRAINT `fk_participant_form_answers_registration` FOREIGN KEY (`registration_id`) REFERENCES `participant_registrations`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `participant_registrations` ADD CONSTRAINT `fk_participant_registrations_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `participant_registrations` ADD CONSTRAINT `fk_participant_registrations_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `participant_registrations` ADD CONSTRAINT `fk_participant_registrations_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `program_form_fields` ADD CONSTRAINT `fk_program_form_fields_program` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

