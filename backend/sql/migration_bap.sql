-- ============================================================
-- Migration: Sistem Berita Acara Pembelajaran (BAP)
-- Jalankan sekali di database yang sudah ada
-- ============================================================

-- 1. Topik per modul (setiap topik = satu pertemuan)
CREATE TABLE IF NOT EXISTS module_topics (
  id            BIGINT(20)    NOT NULL AUTO_INCREMENT,
  module_id     BIGINT(20)    NOT NULL,
  title         VARCHAR(255)  NOT NULL COMMENT 'Judul topik, misal: Power Supplies: Lead Acid Batteries',
  description   TEXT          DEFAULT NULL,
  sequence_no   INT           NOT NULL DEFAULT 1 COMMENT 'Urutan pertemuan dalam modul',
  duration_hours DECIMAL(4,1) DEFAULT 2.0 COMMENT 'Estimasi durasi dalam jam',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_module_topics_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Tambah topic_id ke tabel sessions (nullable — tidak semua sesi wajib punya topik)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS topic_id BIGINT(20) DEFAULT NULL COMMENT 'FK ke module_topics',
  ADD CONSTRAINT fk_sessions_topic FOREIGN KEY (topic_id) REFERENCES module_topics (id) ON DELETE SET NULL;

-- 3. Dokumen BAP — satu BAP per instruktur per sesi
CREATE TABLE IF NOT EXISTS bap (
  id              BIGINT(20)    NOT NULL AUTO_INCREMENT,
  session_id      BIGINT(20)    NOT NULL,
  instructor_id   BIGINT(20)    NOT NULL,
  topic_id        BIGINT(20)    DEFAULT NULL COMMENT 'Snapshot topik saat BAP dibuat',
  teaching_date   DATE          NOT NULL,
  method          VARCHAR(30)   NOT NULL DEFAULT 'ONSITE' COMMENT 'ONSITE | ONLINE | HYBRID | SIMULATOR',
  duration_hours  DECIMAL(4,1)  DEFAULT 2.0 COMMENT 'Durasi aktual mengajar (jam)',
  location        VARCHAR(255)  DEFAULT NULL COMMENT 'Nama ruang / link meeting',
  notes           TEXT          DEFAULT NULL COMMENT 'Catatan instruktur',
  status          VARCHAR(20)   NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | SUBMITTED | REVISION_REQUESTED | APPROVED | REJECTED',
  submitted_at    DATETIME      DEFAULT NULL,
  reviewed_by     BIGINT(20)    DEFAULT NULL COMMENT 'FK ke users (admin)',
  reviewed_at     DATETIME      DEFAULT NULL,
  review_notes    TEXT          DEFAULT NULL COMMENT 'Catatan admin saat approve/reject',
  sync_attendance TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = kehadiran dari BAP ini sudah disync ke tabel attendance',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bap_session_instructor (session_id, instructor_id),
  CONSTRAINT fk_bap_session    FOREIGN KEY (session_id)    REFERENCES sessions    (id) ON DELETE CASCADE,
  CONSTRAINT fk_bap_instructor FOREIGN KEY (instructor_id) REFERENCES instructors (id) ON DELETE CASCADE,
  CONSTRAINT fk_bap_topic      FOREIGN KEY (topic_id)      REFERENCES module_topics (id) ON DELETE SET NULL,
  CONSTRAINT fk_bap_reviewer   FOREIGN KEY (reviewed_by)   REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Untuk database yang sudah menjalankan migrasi ini, status disimpan sebagai VARCHAR
-- sehingga tidak memerlukan perubahan struktur tambahan.

-- 4. Kehadiran peserta per BAP (snapshot, terpisah dari tabel attendance utama)
CREATE TABLE IF NOT EXISTS bap_attendance (
  id             BIGINT(20)   NOT NULL AUTO_INCREMENT,
  bap_id         BIGINT(20)   NOT NULL,
  participant_id BIGINT(20)   NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'PRESENT' COMMENT 'PRESENT | ABSENT | LATE | EXCUSED',
  notes          VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bap_attendance (bap_id, participant_id),
  CONSTRAINT fk_bap_att_bap         FOREIGN KEY (bap_id)         REFERENCES bap          (id) ON DELETE CASCADE,
  CONSTRAINT fk_bap_att_participant  FOREIGN KEY (participant_id)  REFERENCES participants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
