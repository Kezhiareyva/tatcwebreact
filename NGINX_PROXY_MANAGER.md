# Setup TATC Web Platform dengan Nginx Proxy Manager (NPM)

Panduan konfigurasi deployment production untuk TATC Web Platform menggunakan **Nginx Proxy Manager (NPM)** dengan custom domain dan sertifikat SSL/TLS gratis (Let's Encrypt).

---

## 📋 Services yang Dijalankan

Setelah menjalankan `docker-compose up -d`, Anda memiliki services:

| Service | Container | Port Internal | Port Exposed di Host | Keterangan |
|---|---|---|---|---|
| **Frontend** | `tatc_frontend` | 80 | 3000 | Web React SPA + Nginx (sudah include proxy internal `/api/`) |
| **Backend API** | `tatc_backend` | 3001 | 3001 | Next.js API Server |
| **phpMyAdmin** | `tatc_phpmyadmin` | 80 | 5050 | Database GUI Admin |
| **MySQL** | `tatc_mysql` | 3306 | 3306 | Database Engine |

---

## 🌐 Konfigurasi Nginx Proxy Manager

### 1. Proxy Host untuk Frontend (Web Utama & Dashboard)

Di antarmuka Nginx Proxy Manager, tambahkan **Proxy Host** baru:

#### **Details Tab:**
- **Domain Names**: `tatc.yourdomain.com` (atau domain Anda)
- **Scheme**: `http`
- **Forward Hostname / IP**: `localhost` (atau IP server Docker)
- **Forward Port**: `3000`
- **Cache Assets**: ✅ *(Centang)*
- **Block Common Exploits**: ✅ *(Centang)*
- **Websockets Support**: ✅ *(Centang)*

#### **SSL Tab:**
- **SSL Certificate**: Request a new SSL Certificate (Let's Encrypt)
- **Force SSL**: ✅ *(Centang)*
- **HTTP/2 Support**: ✅ *(Centang)*
- **HSTS Enabled**: ✅ *(Centang)*
- **I Agree to the Let's Encrypt Terms**: ✅ *(Centang)*

#### **Advanced / Custom Nginx Configuration (Opsional):**
```nginx
# Security Headers Tambahan
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# Timeout buffers
client_max_body_size 64M;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

---

### 2. Proxy Host untuk phpMyAdmin (Opsional / Restricted Access)

Jika Anda ingin mengakses phpMyAdmin melalui subdomain (misal `db.tatc.yourdomain.com`):

- **Domain Names**: `db.tatc.yourdomain.com`
- **Scheme**: `http`
- **Forward Hostname / IP**: `localhost`
- **Forward Port**: `5050`
- **Block Common Exploits**: ✅
- **SSL**: Let's Encrypt (Force SSL)

> ⚠️ **Penting**: Disarankan menambahkan **Access List** (IP Whitelist atau HTTP Basic Auth) di NPM untuk melindungi halaman phpMyAdmin dari publik.

---

## 🔐 Security Best Practices untuk Production

1. **Gunakan Password yang Kuat:**
   - Ubah `DB_PASS`, `DB_ROOT_PASS`, dan `SESSION_SECRET` di `.env` sebelum deploy.
2. **Tutup Port Database dari Akses Publik:**
   - Jangan membuka port 3306 di firewall publik. Biarkan database hanya dapat diakses antar-container di dalam Docker network (`app-network`).
3. **Aktifkan SSL Otomatis:**
   - Pastikan opsi **Force SSL** dan **HSTS** selalu aktif di Nginx Proxy Manager.
4. **Regular Backup:**
   - Lakukan backup berkala pada volume `mysql_data` atau dump SQL via script/cron.
