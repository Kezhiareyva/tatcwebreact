-- Migration: Tambah kolom availability_json pada tabel instructors
-- Jalankan sekali di database yang sudah ada

ALTER TABLE instructors
  ADD COLUMN IF NOT EXISTS availability_json TEXT DEFAULT NULL COMMENT 'Jadwal ketersediaan instruktur dalam format JSON' AFTER status;
