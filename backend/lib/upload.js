import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Maximum allowed upload size: 5 MB
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Whitelist of safe extensions and their corresponding MIME signatures
export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp'
]);

/**
 * Validates and saves an uploaded file to storage.
 * @param {File} file - Web File object
 * @param {string} folder - Subdirectory name (e.g., 'documents', 'payments', 'uploads')
 * @param {string[]|null} customAllowedExts - Optional custom extension list (e.g., ['pdf', 'png'])
 * @returns {Promise<string>} Public relative URL of the saved file
 */
export async function saveFile(file, folder = 'uploads', customAllowedExts = null) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw Object.assign(new Error('File tidak valid.'), { status: 400 });
  }

  // 1. File Size Validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw Object.assign(new Error('Ukuran file melebihi batas maksimal 5 MB.'), { status: 413 });
  }

  // 2. Extension Validation
  const rawExt = path.extname(file.name || '').toLowerCase();
  if (!rawExt || !ALLOWED_EXTENSIONS.has(rawExt)) {
    throw Object.assign(new Error(`Tipe file "${rawExt}" tidak diizinkan. Hanya menerima PDF, JPG, PNG, dan WEBP.`), { status: 400 });
  }

  if (customAllowedExts && customAllowedExts.length > 0) {
    const normalizedCustom = customAllowedExts.map(e => (e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`));
    if (!normalizedCustom.includes(rawExt)) {
      throw Object.assign(new Error(`Tipe file harus salah satu dari: ${normalizedCustom.join(', ')}`), { status: 400 });
    }
  }

  // 3. MIME Type Validation
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    throw Object.assign(new Error(`MIME type "${file.type}" tidak valid atau tidak didukung.`), { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${crypto.randomUUID()}${rawExt}`;

  // 4. Primary storage: backend/public/<folder> (served directly by Next.js & Nginx)
  const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public');
  const targetDir = path.join(baseUploadDir, folder);
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, fileName);
  await fs.writeFile(targetPath, buffer);

  // 5. Fallback storage for local monorepo Vite dev environment if root/public exists
  try {
    const monorepoPublic = path.join(process.cwd(), '..', 'public', folder);
    await fs.mkdir(monorepoPublic, { recursive: true });
    await fs.writeFile(path.join(monorepoPublic, fileName), buffer);
  } catch {
    // Ignore error if running in standalone container where ../public is not used
  }

  return `/${folder}/${fileName}`;
}
