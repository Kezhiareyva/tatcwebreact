# Deployment Production — TATC Web Platform

Dokumen ini menjelaskan setup production: Docker Compose + **Caddy** sebagai reverse proxy (HTTPS otomatis).

> **Catatan:** dokumen ini sengaja **tidak** mencantumkan domain, port, dan path server yang sebenarnya. Semua ditulis sebagai placeholder `<...>` atau nama variabel `.env`. Nilai aslinya hanya ada di `.env` dan Caddyfile di server (tidak di-commit ke git).

---

## 1. Arsitektur

```
Internet
   │  HTTPS (443) — sertifikat otomatis dari Caddy
   ▼
Caddy (berjalan langsung di host, bukan container)
   ├── <DOMAIN_FRONTEND> ──► 127.0.0.1:<FRONTEND_PORT1> ──► tatc_frontend (React SPA, `serve`, port <FRONTEND_PORT2>)
   └── <DOMAIN_API>      ──► 127.0.0.1:<BACKEND_PORT1>  ──► tatc_backend  (Next.js API, port <BACKEND_PORT2>)
                                                         │
                                         Docker network `app-network`
                                                         ▼
                                                   tatc_mysql (TIDAK di-expose)

tatc_phpmyadmin — mati secara default, hanya dinyalakan manual (profile `tools`),
                  diakses lewat SSH tunnel, TIDAK punya subdomain publik.
```

### Aturan port

| Service | Container | Port di host | Bisa diakses dari |
|---|---|---|---|
| Frontend | `tatc_frontend` | `127.0.0.1:<FRONTEND_PORT1>` | Hanya Caddy (host yang sama) |
| Backend API | `tatc_backend` | `127.0.0.1:<BACKEND_PORT1>` | Hanya Caddy (host yang sama) |
| MySQL | `tatc_mysql` | — (tidak di-publish) | Hanya container di `app-network` |
| phpMyAdmin | `tatc_phpmyadmin` | `127.0.0.1:<PMA_PORT2>` (saat dinyalakan) | Hanya via SSH tunnel |

Nomor port diambil dari `.env`, tetapi alamat bind `127.0.0.1` sengaja di-**hardcode** di `docker-compose.yml`. Alasannya:

- Docker menulis aturan iptables sendiri dan **mem-bypass UFW** — port yang di-publish ke `0.0.0.0` tetap terbuka ke internet walau UFW menutupnya.
- Kalau backend bisa diakses langsung (`http://IP-SERVER:<BACKEND_PORT1>`), orang bisa melewati HTTPS dan memalsukan header `X-Forwarded-For` untuk mengakali rate limit login.

> Variabel `BACKEND_BIND_IP`, `FRONTEND_BIND_IP`, `DB_BIND_IP`, dan `PMA_BIND_IP` di `.env` **tidak dipakai lagi** dan boleh dihapus.

---

## 2. Konfigurasi Caddy

File: `/etc/caddy/Caddyfile` (blok untuk TATC)

```caddy
<DOMAIN_FRONTEND> {
        reverse_proxy 127.0.0.1:<FRONTEND_PORT1>
}

<DOMAIN_API> {
        reverse_proxy 127.0.0.1:<BACKEND_PORT1>
}
```

Catatan penting:

- **Jangan** tambahkan blok untuk phpMyAdmin Karena Caddy berjalan di host, ia bisa menjangkau `127.0.0.1:<PMA_PORT2>` — subdomain itu akan membuat phpMyAdmin terbuka ke publik setiap kali dinyalakan.
- **Jangan** pakai `root * <PATH_PROJECT>` + `file_server`. Folder project berisi `.env` (password DB, `SESSION_SECRET`, SMTP). Salah urutan direktif sedikit saja bisa membuat file tersebut ter-download publik.
- Upstream ditulis `127.0.0.1`, bukan `0.0.0.0`. Ganti `<...>` dengan nilai yang sama seperti di `.env` server.
- Caddy (v2.5+) secara default mengabaikan `X-Forwarded-For` kiriman client dan menulis IP asli, sehingga rate limit backend akurat selama backend hanya bisa diakses lewat Caddy.

Setelah mengubah Caddyfile:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

---

## 3. Environment Variables (`.env` di root project)

Dipakai oleh `docker-compose.yml`. File ini **tidak** di-commit ke git.

| Variabel | Keterangan |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_ROOT_PASS` | Kredensial MySQL. Gunakan password kuat & unik. `DB_USER` bukan `root`. |
| `DB_HOST` | Harus `mysql` (nama service di Docker network). |
| `DB_PORT` | `3306` |
| `SESSION_SECRET` | Minimal 32 karakter acak: `openssl rand -base64 48`. Jangan pakai nilai contoh. |
| `FRONTEND_URL` | `https://<DOMAIN_FRONTEND>` (dipakai untuk link di email verifikasi/reset). |
| `CORS_ORIGIN` | `https://<DOMAIN_FRONTEND>` — wajib diisi karena API ada di subdomain lain. |
| `BACKEND_PORT1` / `BACKEND_PORT2` | **Wajib.** Port host / port container backend. `BACKEND_PORT1` harus sama dengan port di Caddyfile. |
| `FRONTEND_PORT1` / `FRONTEND_PORT2` | **Wajib.** Port host / port container frontend. `FRONTEND_PORT1` harus sama dengan port di Caddyfile. |
| `PMA_HOST`, `PMA_PORT1`, `PMA_PORT2`, `PMA_PORT3`, `PMA_UPLOAD_LIMIT` | Konfigurasi phpMyAdmin: host DB (`mysql`), port DB (`3306`), port host untuk tunnel, port container phpMyAdmin (`80`), batas upload (mis. `64M`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Pengiriman email. |

Frontend di-build dengan `VITE_API_BASE_URL=https://<DOMAIN_API>` (dibaca Vite dari `.env` saat build).

Kalau salah satu variabel bertanda **Wajib** kosong, `docker compose` akan langsung berhenti dengan pesan error, bukan diam-diam memakai nilai kosong.

---

## 4. Deploy / Update

```bash
cd <PATH_PROJECT>

# 1. Backup database dulu
docker exec tatc_mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' > ~/backup_tatc_$(date +%F_%H%M).sql

# 2. Ambil perubahan
git status            # pastikan tidak ada file yang diubah langsung di server
git pull

# 3. Build & jalankan ulang
docker compose up -d --build

# 4. Cek
docker compose ps
docker compose logs --tail=50 backend
```

---

## 5. Verifikasi Keamanan Setelah Deploy

Jalankan dari **laptop / luar server**:

```bash
curl -i http://IP-SERVER:<BACKEND_PORT1>/api/auth/me   # harus refused / timeout
curl -i http://IP-SERVER:<FRONTEND_PORT1>/              # harus refused / timeout
nc -zv IP-SERVER 3306                                   # harus refused / timeout
nc -zv IP-SERVER <PMA_PORT2>                            # harus refused / timeout
curl -i https://<DOMAIN_API>/api/auth/me                # harus 401 {"success":false,"message":"Unauthorized"}
```

Di server:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep tatc
# Semua port harus diawali 127.0.0.1 — tidak boleh ada 0.0.0.0
```

Terakhir: buka `https://<DOMAIN_FRONTEND>`, coba login.

---

## 6. phpMyAdmin (Hanya Saat Dibutuhkan)

```bash
# Di server: nyalakan
docker compose --profile tools up -d phpmyadmin

# Di laptop: SSH tunnel, lalu buka http://localhost:<PMA_PORT2>
ssh -L <PMA_PORT2>:127.0.0.1:<PMA_PORT2> user@IP-SERVER

# Di server: matikan lagi setelah selesai
docker compose stop phpmyadmin
```

---

## 7. Backup & Restore Database

Port MySQL tidak di-expose, jadi gunakan `docker exec`:

```bash
# Backup
docker exec tatc_mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' > backup_$(date +%F).sql

# Restore
docker exec -i tatc_mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backup.sql
```

Volume yang perlu ikut di-backup berkala: `mysql_data`, `tatc_uploads`, `tatc_documents`, `tatc_payments`.
