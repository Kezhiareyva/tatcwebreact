-- Migration: Tambah kolom profil peserta
-- Jalankan sekali di database yang sudah ada

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS nik         VARCHAR(20)  DEFAULT NULL COMMENT 'Nomor Induk Kependudukan (16 digit KTP)',
  ADD COLUMN IF NOT EXISTS occupation  VARCHAR(150) DEFAULT NULL COMMENT 'Pekerjaan / jabatan',
  ADD COLUMN IF NOT EXISTS institution VARCHAR(255) DEFAULT NULL COMMENT 'Instansi atau perusahaan tempat bekerja';
