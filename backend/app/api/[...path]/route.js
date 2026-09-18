import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { db } from '../../../lib/db.js';
import { body, fail, ok } from '../../../lib/http.js';
import { clearSession, getSession, requireAuth, setSession } from '../../../lib/auth.js';
import { ADMIN_ROLES, TABLES } from '../../../lib/tables.js';
import { saveFile } from '../../../lib/upload.js';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit.js';

const connection = () => db();

async function tableColumns(table) {
  const [rows] = await connection().query(`SHOW COLUMNS FROM \`${table}\``);
  return new Set(rows.map(r => r.Field));
}

function normalizeRole(role) {
  const map = { SUPER_ADMIN: 'SUPERADMIN', SUPERADMIN: 'SUPERADMIN', ADMIN: 'ADMIN', INSTRUCTOR: 'INSTRUKTUR', INSTRUKTUR: 'INSTRUKTUR', PARTICIPANT: 'PESERTA', PESERTA: 'PESERTA' };
  return map[String(role || '').toUpperCase()] || 'PESERTA';
}

function hasStrongPassword(password) {
  return password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9\s]/.test(password);
}

async function findUserByEmail(email) {
  const pool = connection();
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows[0]) return null;
    return rows[0];
  } catch {
    try {
      const [rows] = await pool.query(`SELECT u.*, GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',') AS resolved_role
        FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
        WHERE u.email=? GROUP BY u.id LIMIT 1`, [email]);
      return rows[0] || null;
    } catch {
      return null;
    }
  }
}

async function profileFor(user) {
  const pool = connection();
  if (normalizeRole(user.role) === 'PESERTA') {
    const [rows] = await pool.query('SELECT id, participant_number, full_name, phone, status FROM participants WHERE email = ? AND deleted_at IS NULL LIMIT 1', [user.email]);
    return rows[0] || null;
  }
  if (normalizeRole(user.role) === 'INSTRUKTUR') {
    const [rows] = await pool.query('SELECT id, full_name, phone, status FROM instructors WHERE email = ? AND deleted_at IS NULL LIMIT 1', [user.email]);
    return rows[0] || null;
  }
  return null;
}

async function login(request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`login:${ip}`, 10, 60);
  if (!rl.allowed) return fail(`Terlalu banyak percobaan login. Silakan tunggu ${rl.retryAfter} detik.`, 429);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  if (!email || !password) return fail('Email dan kata sandi wajib diisi.', 422);
  const user = await findUserByEmail(email);
  if (!user) return fail('Email atau kata sandi salah.', 401);
  if (user.status && !['ACTIVE', 'active'].includes(user.status)) return fail('Akun tidak aktif.', 403);
  if (user.lockout_until && new Date(user.lockout_until).getTime() > Date.now()) return fail('Akun sedang dikunci sementara.', 429);
  const valid = await bcrypt.compare(password, user.password_hash || '');
  if (!valid) {
    if ('failed_login_attempts' in user) {
      const attempts = Number(user.failed_login_attempts || 0) + 1;
      if (attempts >= 5) await connection().query('UPDATE users SET failed_login_attempts=?, lockout_until=DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id=?', [attempts, user.id]);
      else await connection().query('UPDATE users SET failed_login_attempts=? WHERE id=?', [attempts, user.id]);
    }
    return fail('Email atau kata sandi salah.', 401);
  }
  const role = normalizeRole(user.role || user.resolved_role?.split(',')[0]);
  if (role === 'PESERTA' && 'email_verified_at' in user && !user.email_verified_at) return fail('Silakan verifikasi email terlebih dahulu.', 403);
  if ('last_login_at' in user) await connection().query('UPDATE users SET last_login_at=NOW(), failed_login_attempts=0, lockout_until=NULL WHERE id=?', [user.id]);
  const safe = { id: user.id, email: user.email, role, status: user.status, name: user.name || null };
  await setSession(safe);
  return ok({ user: safe, profile: await profileFor(user) }, 'Login berhasil.');
}

async function dashboard() {
  await requireAuth(ADMIN_ROLES);
  const pool = connection();
  const queries = [
    pool.query("SELECT COUNT(*) total FROM participants WHERE deleted_at IS NULL").catch(() => [[{ total: 0 }]]),
    pool.query("SELECT COUNT(*) total FROM batches WHERE status='ACTIVE' AND deleted_at IS NULL").catch(() => [[{ total: 0 }]]),
    pool.query("SELECT COUNT(*) total FROM instructors WHERE status='ACTIVE' AND deleted_at IS NULL").catch(() => [[{ total: 0 }]])
  ];
  const [[p], [b], [i]] = await Promise.all(queries);
  return ok({ stats: { total_participants: Number(p[0]?.total || 0), active_batches: Number(b[0]?.total || 0), total_instructors: Number(i[0]?.total || 0) }, recent_activities: [] });
}

async function generic(path, request, params) {
  const table = TABLES[path];
  if (!table) return fail('Endpoint tidak ditemukan.', 404);
  const method = request.method;
  const isPublicCms = path.startsWith('cms/') && method === 'GET';
  let session = null;
  if (!isPublicCms) {
    session = await requireAuth(ADMIN_ROLES);
  }
  const pool = connection();
  const cols = await tableColumns(table);
  const id = params.get('id');

  if (path === 'users') {
    if (method === 'GET') {
      const [rows] = await pool.query('SELECT id,email,role,status,last_login_at,created_at FROM users ORDER BY created_at DESC');
      return ok(rows);
    }
    if (method === 'DELETE' && session?.role !== 'SUPERADMIN') return fail('Hanya Superadmin yang boleh menghapus akun.', 403);
  }

  if (path === 'exam_results') {
    if (method === 'GET' && params.get('batch_id') && params.get('exam_id')) {
      const batchId = Number(params.get('batch_id'));
      const examId = Number(params.get('exam_id'));
      const [rows] = await pool.query(
        `SELECT bp.participant_id, p.full_name, p.participant_number, er.id as result_id, er.score, COALESCE(er.status, 'PENDING') as status, er.exam_date, er.notes 
         FROM batch_participants bp 
         JOIN participants p ON p.id = bp.participant_id 
         LEFT JOIN exam_results er ON er.participant_id = p.id AND er.exam_id = ? 
         WHERE bp.batch_id = ? AND p.deleted_at IS NULL 
         ORDER BY p.full_name`,
        [examId, batchId]
      );
      return ok(rows);
    }
  }

  if (path === 'cms/news' && method === 'GET' && params.get('slug')) {
    const [rows] = await pool.query('SELECT * FROM cms_news WHERE slug = ? LIMIT 1', [params.get('slug')]);
    return rows[0] ? ok(rows[0]) : fail('Berita tidak ditemukan.', 404);
  }

  if (path === 'participants' && method === 'GET') {
    if (id) {
      const [rows] = await pool.query(`SELECT * FROM \`participants\` WHERE id=? LIMIT 1`, [id]);
      return rows[0] ? ok(rows[0]) : fail('Data tidak ditemukan.', 404);
    }
    const search = params.get('search')?.trim();
    let sql = `
      SELECT p.*,
        (SELECT GROUP_CONCAT(CONCAT(prog.name, ' (', b.name, ')') SEPARATOR ', ')
         FROM batch_participants bp
         JOIN batches b ON b.id = bp.batch_id
         JOIN programs prog ON prog.id = b.program_id
         WHERE bp.participant_id = p.id AND b.deleted_at IS NULL) as enrolled_programs
      FROM \`participants\` p
    `;
    const values = [];
    const where = ['p.deleted_at IS NULL'];
    if (search) {
      where.push(`(p.full_name LIKE ? OR p.participant_number LIKE ? OR p.email LIKE ? OR p.phone LIKE ?)`);
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' WHERE ' + where.join(' AND ') + ' ORDER BY p.id DESC';
    const [rows] = await pool.query(sql, values);
    return ok(rows);
  }

  if (method === 'GET') {
    let resultRows = [];
    if (id) {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id=? LIMIT 1`, [id]);
      if (!rows[0]) return fail('Data tidak ditemukan.', 404);
      resultRows = rows;
    } else {
      const search = params.get('search')?.trim();
      const allowedSearch = ['full_name', 'name', 'email', 'code', 'participant_number', 'title', 'certificate_number'];
      let sql = `SELECT * FROM \`${table}\``;
      const values = [];
      const where = [];
      if (cols.has('deleted_at')) where.push('deleted_at IS NULL');
      if (search) {
        const fields = allowedSearch.filter(f => cols.has(f));
        if (fields.length) { where.push(`(${fields.map(f => `\`${f}\` LIKE ?`).join(' OR ')})`); fields.forEach(() => values.push(`%${search}%`)); }
      }
      const publicRead = isPublicCms || params.get('public') === 'true';
      if (publicRead && cols.has('status')) where.push('status=\'PUBLISHED\'');
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY id DESC';
      const limit = Math.min(Math.max(Number(params.get('limit') || 50), 1), 100);
      const page = Math.max(Number(params.get('page') || 1), 1);
      sql += ' LIMIT ? OFFSET ?'; values.push(limit, (page - 1) * limit);
      const [rows] = await pool.query(sql, values);
      resultRows = rows;
    }

    if (path.startsWith('cms/')) {
      resultRows.forEach(r => {
        if (r.logo_url && !r.logo_url.startsWith('/') && !r.logo_url.startsWith('http')) r.logo_url = '/uploads/' + r.logo_url;
        if (r.image_url && !r.image_url.startsWith('/') && !r.image_url.startsWith('http')) r.image_url = '/uploads/' + r.image_url;
      });
    }

    return id ? ok(resultRows[0]) : ok(resultRows);
  }

  const data = await body(request);

  if (path === 'exam_results' && method === 'POST' && Array.isArray(data.results)) {
    const examId = Number(data.exam_id);
    const examDate = data.exam_date || new Date().toISOString().split('T')[0];
    for (const item of data.results) {
      const participantId = Number(item.participant_id);
      if (!participantId) continue;
      const score = item.score === '' || item.score === null || item.score === undefined ? null : Number(item.score);
      const status = item.status || 'PENDING';
      const notes = item.notes || null;
      await pool.query(
        `INSERT INTO exam_results (exam_id, participant_id, score, status, exam_date, notes) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE score=VALUES(score), status=VALUES(status), exam_date=VALUES(exam_date), notes=VALUES(notes)`,
        [examId, participantId, score, status, examDate, notes]
      );
    }
    return ok(null, 'Nilai ujian berhasil disimpan.');
  }

  if (method === 'POST' || method === 'PUT') {
    const clean = {};
    for (const [key, value] of Object.entries(data)) if (cols.has(key) && key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'deleted_at') clean[key] = value === '' ? null : value;

    if (data.logo && typeof data.logo.arrayBuffer === 'function') {
      clean.logo_url = await saveFile(data.logo, 'uploads');
    }
    if (data.image && typeof data.image.arrayBuffer === 'function') {
      clean.image_url = await saveFile(data.image, 'uploads');
    }

    if (path === 'users' && clean.password) { clean.password_hash = await bcrypt.hash(clean.password, 12); delete clean.password; }
    if (path === 'users') {
      if (clean.role) clean.role = normalizeRole(clean.role);
      if (clean.role && ['SUPERADMIN', 'ADMIN'].includes(clean.role) && session?.role !== 'SUPERADMIN') {
        return fail('Hanya Superadmin yang berwenang menetapkan role Admin atau Superadmin.', 403);
      }
      const targetId = id || clean.id;
      if (targetId && session?.role !== 'SUPERADMIN') {
        const [targetUser] = await pool.query('SELECT role FROM users WHERE id = ? LIMIT 1', [targetId]);
        if (targetUser[0] && ['SUPERADMIN', 'ADMIN'].includes(normalizeRole(targetUser[0].role))) {
          return fail('Hanya Superadmin yang berwenang mengubah data akun Administrator.', 403);
        }
      }
    }

    if (path === 'certificates' && method === 'POST') {
      if (!clean.certificate_number) clean.certificate_number = `TATC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!clean.verification_code) clean.verification_code = crypto.randomBytes(8).toString('hex').toUpperCase();
      if (!clean.issue_date) clean.issue_date = new Date().toISOString().split('T')[0];
      if (!clean.status) clean.status = 'VALID';
    }

    if (!Object.keys(clean).length) return fail('Tidak ada field yang dapat disimpan.', 422);
    if (method === 'POST' && !id) {
      const keys = Object.keys(clean); const vals = keys.map(k => clean[k]);
      const [r] = await pool.query(`INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, vals);
      return ok({ id: r.insertId, certificate_number: clean.certificate_number, verification_code: clean.verification_code }, 'Data berhasil dibuat.');
    }
    const target = id || clean.id;
    if (!target) return fail('ID wajib diisi.', 422);
    const keys = Object.keys(clean); const vals = keys.map(k => clean[k]);
    await pool.query(`UPDATE \`${table}\` SET ${keys.map(k => `\`${k}\`=?`).join(',')} WHERE id=?`, [...vals, target]);
    return ok({ id: target }, 'Data berhasil diperbarui.');
  }

  if (method === 'DELETE') {
    if (!id) return fail('ID wajib diisi.', 422);
    if (cols.has('deleted_at')) await pool.query(`UPDATE \`${table}\` SET deleted_at=NOW()${cols.has('status') ? ", status='INACTIVE'" : ''} WHERE id=?`, [id]);
    else await pool.query(`DELETE FROM \`${table}\` WHERE id=?`, [id]);
    return ok(null, 'Data berhasil dihapus.');
  }
  return fail('Method tidak didukung.', 405);
}

async function register(request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, 5, 900);
  if (!rl.allowed) return fail(`Terlalu banyak percobaan pendaftaran. Silakan tunggu ${rl.retryAfter} detik.`, 429);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const name = String(data.name || '').trim();

  if (!email) return fail('Email valid wajib diisi.', 422);
  if (!hasStrongPassword(password)) return fail('Kata sandi harus minimal 12 karakter dan mengandung huruf kecil, huruf besar, angka, serta simbol.', 422);
  if (!name) return fail('Nama lengkap wajib diisi.', 422);
  const exists = await findUserByEmail(email); if (exists) return fail('Email sudah terdaftar.', 409);
  const hash = await bcrypt.hash(password, 12); const pool = connection();
  const cols = await tableColumns('users');
  const payload = { email, password_hash: hash, role: 'PESERTA', status: 'ACTIVE' };

  let verifyToken = null;
  if (cols.has('email_verified_at')) {
    payload.email_verified_at = null;
    verifyToken = crypto.randomBytes(32).toString('hex');
    if (cols.has('verification_token')) payload.verification_token = verifyToken;
  }

  const keys = Object.keys(payload).filter(k => cols.has(k));
  const [r] = await pool.query(`INSERT INTO users (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map(k => payload[k]));

  const participantNumber = `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  await pool.query('INSERT INTO participants (participant_number, full_name, email, status) VALUES (?, ?, ?, ?)', [participantNumber, name, email, 'ACTIVE']);

  if (verifyToken) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT),
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL;
      const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;

      const mailPromise = transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Verifikasi Email Anda - TATC',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #dc2626;">Selamat Datang di TATC!</h2>
            <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda agar Anda bisa masuk (login):</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verifikasi Email Saya</a>
            </div>
            <p style="color: #666; font-size: 0.9em;">Jika tombol tidak berfungsi, salin tautan berikut ke browser Anda: <br/> <a href="${verifyUrl}">${verifyUrl}</a></p>
            <p style="color: #999; font-size: 0.8em; margin-top: 30px;">TATC Web App - Mohon jangan balas email ini.</p>
          </div>
        `
      });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Jaringan memblokir koneksi email (Timeout 5s)')), 5000));
      await Promise.race([mailPromise, timeoutPromise]);
    } catch (emailErr) {
      console.error("Gagal mengirim email verifikasi:", emailErr);
    }
  }

  return ok({ id: r.insertId }, 'Registrasi berhasil. Silakan cek kotak masuk email Anda (termasuk folder Spam) untuk memverifikasi akun Anda sebelum Log In.');
}

async function forgotPassword(request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`forgot:${ip}`, 3, 900);
  if (!rl.allowed) return fail(`Terlalu banyak permintaan reset kata sandi. Silakan tunggu ${rl.retryAfter} detik.`, 429);

  const data = await body(request); const email = String(data.email || '').trim().toLowerCase();
  if (!email) return fail('Email wajib diisi.', 422);
  const user = await findUserByEmail(email);
  // Always return a generic response to avoid account enumeration.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const cols = await tableColumns('users');
    const pool = connection();
    if (cols.has('reset_token')) await pool.query('UPDATE users SET reset_token=? WHERE id=?', [token, user.id]);
    if (cols.has('reset_token_expires_at')) await pool.query('UPDATE users SET reset_token_expires_at=DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id=?', [user.id]);
  }
  return ok(null, 'Jika email terdaftar, instruksi reset akan dikirim ke email tersebut.');
}

async function resetPassword(request) {
  const data = await body(request); const token = String(data.token || ''); const password = String(data.password || '');
  if (!token || password.length < 8) return fail('Token dan kata sandi minimal 8 karakter wajib diisi.', 422);
  const cols = await tableColumns('users');
  if (!cols.has('reset_token')) return fail('Fitur reset password belum dikonfigurasi pada database.', 503);
  const [rows] = await connection().query('SELECT * FROM users WHERE reset_token=? LIMIT 1', [token]);
  const user = rows[0]; if (!user) return fail('Token reset tidak valid atau sudah digunakan.', 400);
  if ('reset_token_expires_at' in user && user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) return fail('Token reset sudah kedaluwarsa.', 400);
  const hash = await bcrypt.hash(password, 12);
  const pool = connection();
  if (cols.has('reset_token_expires_at')) await pool.query('UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expires_at=NULL WHERE id=?', [hash, user.id]);
  else await pool.query('UPDATE users SET password_hash=?, reset_token=NULL WHERE id=?', [hash, user.id]);
  return ok(null, 'Kata sandi berhasil diubah.');
}

async function verifyEmail(params) {
  const token = params.get('token'); if (!token) return fail('Token verifikasi tidak ditemukan.', 422);
  const cols = await tableColumns('users');
  if (!cols.has('verification_token')) return fail('Verifikasi email belum dikonfigurasi pada database.', 503);
  const [rows] = await connection().query('SELECT id FROM users WHERE verification_token=? LIMIT 1', [token]);
  if (!rows[0]) return fail('Token verifikasi tidak valid.', 400);
  const pool = connection();
  if (cols.has('email_verified_at')) await pool.query('UPDATE users SET email_verified_at=NOW(), verification_token=NULL WHERE id=?', [rows[0].id]);
  else await pool.query('UPDATE users SET verification_token=NULL WHERE id=?', [rows[0].id]);
  return ok(null, 'Email berhasil diverifikasi.');
}

async function resendVerification(request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`resend:${ip}`, 3, 900);
  if (!rl.allowed) return fail(`Terlalu banyak permintaan kirim ulang verifikasi. Silakan tunggu ${rl.retryAfter} detik.`, 429);

  const data = await body(request);
  const email = String(data.email || '').trim().toLowerCase();
  if (!email) return fail('Email wajib diisi.', 422);

  const user = await findUserByEmail(email);
  if (!user) return ok(null, 'Jika email terdaftar, tautan verifikasi baru telah dikirim.');

  if (user.email_verified_at) return fail('Email ini sudah diverifikasi sebelumnya.', 400);

  const cols = await tableColumns('users');
  if (!cols.has('verification_token')) return fail('Verifikasi email belum dikonfigurasi pada database.', 503);

  const verifyToken = crypto.randomBytes(32).toString('hex');
  await connection().query('UPDATE users SET verification_token=? WHERE id=?', [verifyToken, user.id]);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT),
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}`;

    const mailPromise = transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Kirim Ulang: Verifikasi Email Anda - TATC',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #dc2626;">Verifikasi Email Anda</h2>
          <p>Anda baru saja meminta pengiriman ulang tautan verifikasi. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda agar Anda bisa masuk (login):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verifikasi Email Saya</a>
          </div>
          <p style="color: #666; font-size: 0.9em;">Jika tombol tidak berfungsi, salin tautan berikut ke browser Anda: <br/> <a href="${verifyUrl}">${verifyUrl}</a></p>
          <p style="color: #999; font-size: 0.8em; margin-top: 30px;">TATC Web App - Mohon jangan balas email ini.</p>
        </div>
      `
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Jaringan memblokir koneksi email (Timeout 5s)')), 5000));
    await Promise.race([mailPromise, timeoutPromise]);
  } catch (emailErr) {
    console.error("Gagal mengirim ulang email verifikasi:", emailErr);
  }

  return ok(null, 'Tautan verifikasi baru telah dikirim ke email Anda.');
}
async function verifyCertificate(params) {
  const code = params.get('code'); if (!code) return fail('Kode verifikasi wajib diisi.', 422);
  const [rows] = await connection().query('SELECT * FROM certificates WHERE verification_code=? LIMIT 1', [code]);
  return rows[0] ? ok(rows[0]) : fail('Sertifikat tidak ditemukan.', 404);
}


async function importCsv(route, request) {
  await requireAuth(ADMIN_ROLES);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file.text !== 'function') return fail('File CSV wajib dipilih.', 422);
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return fail('CSV tidak berisi data.', 422);
  const headers = lines.shift().split(',').map(v => v.trim().replace(/^"|"$/g, ''));
  const pool = connection();
  const target = route === 'participants/import' ? 'participants' : 'instructors';
  const allowed = new Set(target === 'participants' ? ['participant_number', 'full_name', 'email', 'phone', 'status'] : ['full_name', 'email', 'phone', 'status']);
  let imported = 0;
  for (const line of lines) {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    const clean = Object.fromEntries(Object.entries(row).filter(([k]) => allowed.has(k)));
    if (!clean.full_name) continue;
    const keys = Object.keys(clean); const vals = keys.map(k => clean[k] || null);
    await pool.query(`INSERT INTO ${target} (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, vals);
    imported++;
  }
  return ok({ imported }, `${imported} data berhasil diimpor.`);
}

async function portal(route, request, params) {
  const session = await getSession();
  if (!session) return fail('Unauthorized', 401);
  const pool = connection();
  if (route === 'portal/instructor_dashboard') {
    let instructorId;
    if (['SUPERADMIN', 'ADMIN'].includes(session.role) && params.get('instructor_id')) {
      instructorId = Number(params.get('instructor_id'));
    } else {
      if (normalizeRole(session.role) !== 'INSTRUKTUR') return fail('Akses ditolak. Khusus instruktur.', 403);
      const user = await findUserByEmail(session.email);
      const profile = user ? await profileFor(user) : null;
      if (!profile) return fail('Profil instruktur tidak ditemukan.', 404);
      instructorId = profile.id;
    }
    const [rows] = await pool.query(`SELECT s.*, b.name batch_name, m.name module_name, r.name room_name
      FROM sessions s JOIN batches b ON b.id=s.batch_id LEFT JOIN modules m ON m.id=s.module_id LEFT JOIN rooms r ON r.id=s.room_id
      JOIN session_instructors si ON si.session_id=s.id WHERE si.instructor_id=? AND s.session_date >= CURDATE() ORDER BY s.session_date, s.start_time LIMIT 30`, [instructorId]).catch(() => [[]]);
    return ok({ upcoming_sessions: rows });
  }
  if (route === 'portal/student_dashboard') {
    let participantId;
    if (['SUPERADMIN', 'ADMIN'].includes(session.role) && params.get('participant_id')) {
      participantId = Number(params.get('participant_id'));
    } else {
      const user = await findUserByEmail(session.email);
      const profile = user ? await profileFor(user) : null;
      if (!profile) return fail('Profil peserta tidak ditemukan.', 404);
      participantId = profile.id;
    }
    const [batches] = await pool.query(`
      SELECT b.*, p.name program_name, p.code program_code, p.description as program_description, bp.status as enrollment_status 
      FROM batch_participants bp 
      JOIN batches b ON b.id=bp.batch_id 
      JOIN programs p ON p.id=b.program_id 
      WHERE bp.participant_id=? AND b.deleted_at IS NULL 
      ORDER BY b.start_date DESC
    `, [participantId]).catch(() => [[]]);

    const [sessions] = await pool.query(`
      SELECT s.*, b.name batch_name, b.code batch_code, p.name program_name, p.id as program_id, m.name module_name, r.name room_name,
             (SELECT GROUP_CONCAT(i.full_name SEPARATOR ', ') FROM session_instructors si JOIN instructors i ON i.id=si.instructor_id WHERE si.session_id=s.id) as instructor_name
      FROM batch_participants bp 
      JOIN batches b ON b.id=bp.batch_id 
      JOIN programs p ON p.id=b.program_id 
      JOIN sessions s ON s.batch_id=b.id 
      LEFT JOIN modules m ON m.id=s.module_id 
      LEFT JOIN rooms r ON r.id=s.room_id 
      WHERE bp.participant_id=? AND s.session_date>=CURDATE() 
      ORDER BY s.session_date ASC, s.start_time ASC LIMIT 50
    `, [participantId]).catch(() => [[]]);

    const [openPrograms] = await pool.query(`
      SELECT b.id as batch_id, b.code as batch_code, b.name as batch_name, b.start_date, b.end_date, b.registration_fee,
             p.id as program_id, p.code as program_code, p.name as program_name, p.description, p.requirements
      FROM batches b
      JOIN programs p ON p.id = b.program_id
      WHERE b.status = 'ACTIVE' AND b.deleted_at IS NULL AND p.deleted_at IS NULL
        AND b.id NOT IN (SELECT batch_id FROM batch_participants WHERE participant_id=?)
      ORDER BY b.start_date DESC, b.created_at DESC
    `, [participantId]).catch(() => [[]]);

    const [att] = await pool.query(`SELECT status, COUNT(*) total FROM attendance WHERE participant_id=? GROUP BY status`, [participantId]).catch(() => [[]]);
    const attendance_stats = Object.fromEntries(att.map(x => [x.status, Number(x.total)]));
    return ok({ batches, upcoming_sessions: sessions, open_programs: openPrograms, attendance_stats, materials: [] });
  }
  if (route === 'portal/attendance') {
    if (request.method === 'GET') {
      const sessionId = Number(params.get('session_id') || 0);
      const [rows] = await pool.query(`SELECT bp.participant_id, p.full_name, p.participant_number, COALESCE(a.status,'ABSENT') status, COALESCE(a.notes,'') notes FROM sessions s JOIN batch_participants bp ON bp.batch_id=s.batch_id JOIN participants p ON p.id=bp.participant_id LEFT JOIN attendance a ON a.session_id=s.id AND a.participant_id=p.id WHERE s.id=? ORDER BY p.full_name`, [sessionId]).catch(() => [[]]);
      return ok(rows);
    }
    if (request.method === 'POST') {
      if (!['SUPERADMIN', 'ADMIN', 'INSTRUKTUR'].includes(session.role)) {
        return fail('Hanya instruktur atau admin yang berhak mencatat presensi.', 403);
      }
      const data = await body(request); const items = Array.isArray(data.attendances) ? data.attendances : [];
      const sessionId = Number(data.session_id || 0);
      for (const item of items) await pool.query(`INSERT INTO attendance(session_id,participant_id,status,notes,recorded_by) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),notes=VALUES(notes),recorded_by=VALUES(recorded_by)`, [sessionId, item.participant_id, item.status, item.notes || null, session.id]);
      return ok(null, 'Presensi berhasil disimpan.');
    }
  }
  if (route === 'portal/materials') {
    return ok([]);
  }
  return fail('Portal endpoint tidak ditemukan.', 404);
}

export async function GET(request, context) {
  try {
    const { path = [] } = await context.params; const route = path.join('/'); const params = new URL(request.url).searchParams;
    if (route === 'auth/me') { const session = await getSession(); if (!session) return fail('Unauthorized', 401); const user = await findUserByEmail(session.email); return ok({ ...session, role: normalizeRole(user?.role || user?.resolved_role?.split(',')[0] || session.role), profile: user ? await profileFor(user) : null }); }
    if (route === 'dashboard/stats') return await dashboard();
    if (route === 'public/open-programs') {
      const pool = connection();
      const [rows] = await pool.query(`
        SELECT b.id as batch_id, b.code as batch_code, b.name as batch_name, b.start_date, b.end_date, b.status as batch_status,
               p.id as program_id, p.code as program_code, p.name as program_name, p.description, p.requirements
        FROM batches b
        JOIN programs p ON p.id = b.program_id
        WHERE b.status = 'ACTIVE' AND b.deleted_at IS NULL AND p.deleted_at IS NULL
        ORDER BY b.start_date DESC, b.created_at DESC
      `);
      return ok(rows);
    }
    if (route === 'public/verify') return await verifyCertificate(params);
    if (route === 'auth/verify-email') return await verifyEmail(params);
    if (route.match(/^admin\/programs\/\d+\/fields$/)) {
      await requireAuth(ADMIN_ROLES);
      const programId = route.split('/')[2];
      const pool = connection();
      const [rows] = await pool.query('SELECT * FROM program_form_fields WHERE program_id=? ORDER BY order_index', [programId]).catch(() => [[]]);
      return ok(rows);
    }
    if (route === 'admin/registrations') {
      await requireAuth(ADMIN_ROLES);
      const pool = connection();
      const [rows] = await pool.query(`SELECT pr.*, p.full_name, p.participant_number, p.phone, p.email, b.name as batch_name, prog.name as program_name
        FROM participant_registrations pr
        JOIN participants p ON p.id = pr.participant_id
        JOIN batches b ON b.id = pr.batch_id
        JOIN programs prog ON prog.id = b.program_id
        ORDER BY pr.submitted_at DESC`).catch(() => [[]]);
      return ok(rows);
    }
    if (route.match(/^portal\/programs\/\d+\/form$/)) {
      const programId = route.split('/')[2];
      const pool = connection();
      const [rows] = await pool.query('SELECT * FROM program_form_fields WHERE program_id=? ORDER BY order_index', [programId]).catch(() => [[]]);
      return ok(rows);
    }
    if (route === 'portal/registrations') {
      const session = await getSession();
      if (!session) return fail('Unauthorized', 401);
      const user = await findUserByEmail(session.email);
      let profile = user ? await profileFor(user) : null;
      if (!profile && user) {
        const participantNumber = `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
        const [r] = await connection().query('INSERT INTO participants (participant_number, full_name, email, status) VALUES (?, ?, ?, ?)', [participantNumber, user.name || user.email.split('@')[0], user.email, 'ACTIVE']);
        profile = { id: r.insertId, participant_number: participantNumber, full_name: user.name || user.email.split('@')[0], email: user.email, status: 'ACTIVE' };
      }
      if (!profile) return fail('Participant profile not found', 404);
      const pool = connection();
      const [rows] = await pool.query(`SELECT pr.*, b.name as batch_name, b.code as batch_code, prog.name as program_name, prog.id as program_id 
        FROM participant_registrations pr 
        JOIN batches b ON b.id = pr.batch_id 
        JOIN programs prog ON prog.id = b.program_id 
        WHERE pr.participant_id=? ORDER BY pr.submitted_at DESC`, [profile.id]).catch(() => [[]]);
      return ok(rows);
    }

    if (route.startsWith('portal/')) return await portal(route, request, params);
    return await generic(route, request, params);
  } catch (e) { return fail(e.message || 'Server error.', e.status || 500); }
}

export async function POST(request, context) {
  try {
    const { path = [] } = await context.params; const route = path.join('/');
    if (route === 'auth/login') return await login(request);
    if (route === 'auth/logout') { await clearSession(); return ok(null, 'Logout berhasil.'); }
    if (route === 'register') return await register(request);
    if (route === 'auth/resend-verification') return await resendVerification(request);
    if (route === 'auth/forgot-password') return await forgotPassword(request);
    if (route === 'auth/reset-password') return await resetPassword(request);
    if (route === 'participants/import' || route === 'instructors/import') return await importCsv(route, request);
    if (route === 'auth/me') { const session = await getSession(); if (!session) return fail('Unauthorized', 401); const user = await findUserByEmail(session.email); return ok({ ...session, role: normalizeRole(user?.role || user?.resolved_role?.split(',')[0] || session.role), profile: user ? await profileFor(user) : null }); }
    if (route.match(/^admin\/programs\/\d+\/fields$/)) {
      await requireAuth(ADMIN_ROLES);
      const programId = route.split('/')[2];
      const data = await body(request);
      const pool = connection();
      await pool.query('DELETE FROM program_form_fields WHERE program_id=?', [programId]);
      if (Array.isArray(data.fields)) {
        for (let i = 0; i < data.fields.length; i++) {
          const f = data.fields[i];
          await pool.query('INSERT INTO program_form_fields (program_id, label, field_type, options_json, is_required, allowed_extensions, order_index) VALUES (?,?,?,?,?,?,?)',
            [programId, f.label, f.field_type, f.options_json || null, f.is_required ? 1 : 0, f.allowed_extensions || null, i]);
        }
      }
      return ok(null, 'Form fields saved.');
    }
    if (route === 'portal/registrations') {
      const session = await getSession();
      if (!session) return fail('Unauthorized', 401);
      const user = await findUserByEmail(session.email);
      let profile = user ? await profileFor(user) : null;
      if (!profile && user) {
        const participantNumber = `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
        const [r] = await connection().query('INSERT INTO participants (participant_number, full_name, email, status) VALUES (?, ?, ?, ?)', [participantNumber, user.name || user.email.split('@')[0], user.email, 'ACTIVE']);
        profile = { id: r.insertId, participant_number: participantNumber, full_name: user.name || user.email.split('@')[0], email: user.email, status: 'ACTIVE' };
      }
      if (!profile) return fail('Participant profile not found', 404);
      const data = await body(request);
      const batchId = data.batch_id;
      const pool = connection();
      const [batchRows] = await pool.query('SELECT b.*, p.id as prog_id FROM batches b JOIN programs p ON p.id=b.program_id WHERE b.id=?', [batchId]);
      if (!batchRows[0]) return fail('Batch not found', 404);
      const batch = batchRows[0];
      const fee = Number(batch.registration_fee) || 0;
      // Convert to MySQL compatible datetime (UTC)
      const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const deadline = d.toISOString().slice(0, 19).replace('T', ' ');
      const [res] = await pool.query(`INSERT INTO participant_registrations (participant_id, batch_id, status, total_amount, payment_deadline) VALUES (?,?,?,?,?)`,
        [profile.id, batch.id, fee > 0 ? 'PENDING_PAYMENT' : 'UNDER_REVIEW', fee, deadline]);
      const regId = res.insertId;
      for (const key of Object.keys(data)) {
        if (key.startsWith('field_')) {
          const fieldId = key.split('_')[1];
          const val = data[key];
          if (val && typeof val.arrayBuffer === 'function') {
            const url = await saveFile(val, 'documents');
            await pool.query('INSERT INTO participant_form_answers (registration_id, field_id, file_url) VALUES (?,?,?)', [regId, fieldId, url]);
          } else {
            await pool.query('INSERT INTO participant_form_answers (registration_id, field_id, answer_text) VALUES (?,?,?)', [regId, fieldId, val]);
          }
        }
      }
      return ok({ id: regId }, 'Registration submitted successfully.');
    }
    if (route.match(/^portal\/registrations\/\d+\/payment$/)) {
      const session = await getSession();
      if (!session) return fail('Unauthorized', 401);
      const regId = route.split('/')[2];
      const user = await findUserByEmail(session.email);
      const profile = user ? await profileFor(user) : null;
      if (!profile && !['SUPERADMIN', 'ADMIN'].includes(session.role)) return fail('Profil peserta tidak ditemukan.', 404);
      const pool = connection();
      const [regRows] = await pool.query('SELECT * FROM participant_registrations WHERE id=?', [regId]);
      if (!regRows[0]) return fail('Pendaftaran tidak ditemukan.', 404);
      if (!['SUPERADMIN', 'ADMIN'].includes(session.role) && regRows[0].participant_id !== profile.id) {
        return fail('Akses ditolak: Anda bukan pemilik pendaftaran ini.', 403);
      }
      const data = await body(request);
      if (!data.payment_proof || typeof data.payment_proof.arrayBuffer !== 'function') return fail('Payment proof required', 400);
      const url = await saveFile(data.payment_proof, 'payments');
      await pool.query('UPDATE participant_registrations SET status=?, payment_proof_url=? WHERE id=?', ['UNDER_REVIEW', url, regId]);
      return ok(null, 'Payment proof uploaded.');
    }
    if (route.match(/^admin\/registrations\/\d+\/verify$/)) {
      await requireAuth(ADMIN_ROLES);
      const regId = route.split('/')[2];
      const data = await body(request);
      const status = data.status;
      const notes = data.notes || null;
      const pool = connection();
      const [regRows] = await pool.query('SELECT * FROM participant_registrations WHERE id=?', [regId]);
      if (!regRows[0]) return fail('Registration not found', 404);
      const reg = regRows[0];
      const session = await getSession();
      await pool.query('UPDATE participant_registrations SET status=?, notes=?, reviewed_at=NOW(), reviewed_by=? WHERE id=?', [status, notes, session.id, regId]);
      if (status === 'ACCEPTED') {
        await pool.query('INSERT IGNORE INTO batch_participants (batch_id, participant_id, status) VALUES (?,?,?)', [reg.batch_id, reg.participant_id, 'ENROLLED']);
      }
      return ok(null, 'Registration verified.');
    }

    return await generic(route, request, new URL(request.url).searchParams);
  } catch (e) { return fail(e.message || 'Server error.', e.status || 500); }
}

export async function PUT(request, context) {
  try { const { path = [] } = await context.params; return await generic(path.join('/'), request, new URL(request.url).searchParams); }
  catch (e) { return fail(e.message || 'Server error.', e.status || 500); }
}
export async function DELETE(request, context) {
  try { const { path = [] } = await context.params; return await generic(path.join('/'), request, new URL(request.url).searchParams); }
  catch (e) { return fail(e.message || 'Server error.', e.status || 500); }
}

export async function OPTIONS() {
  const origin = process.env.CORS_ORIGIN || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': origin === '*' ? 'false' : 'true',
      'Access-Control-Max-Age': '86400'
    }
  });
}
