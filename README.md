# Docker & Development Deployment untuk TATC Web Platform

Setup lengkap untuk aplikasi **TATC Web Platform** dengan **React frontend (Vite)**, **Next.js / Node.js API backend**, **Prisma ORM**, **MySQL Database**, dan **phpMyAdmin** dalam orchestration Docker Compose.

---

## 📋 Arsitektur

Aplikasi ini terdiri dari 4 services:

1. **mysql** — Database server (MySQL 8.0) dengan auto-initialization schema & seed
2. **phpmyadmin** — Web database management GUI (port 5050)
3. **backend** — Next.js App Router API Server + Prisma ORM (port 3001)
4. **frontend** — React 19 SPA served with Nginx + API Reverse Proxy (port 3000)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Docker Desktop & Docker Compose v3.8+ (untuk deployment Docker)
- MySQL / XAMPP (untuk direct local development)

---

### Cara 1: Menjalankan via Docker Compose (Rekomendasi)

1. **Build dan start semua services:**
   ```bash
   docker-compose up --build
   ```

2. **Atau jalankan di background (detached mode):**
   ```bash
   docker-compose up -d --build
   ```

3. **Akses aplikasi:**
   - **Frontend App:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)
   - **phpMyAdmin:** [http://localhost:5050](http://localhost:5050) *(User: `root` / `tatc_user`, Pass: `rootpassword` / `tatc_password`)*

> **Note**: Untuk deployment production (Caddy reverse proxy, domain, SSL, aturan port, backup), lihat [DEPLOYMENT.md](DEPLOYMENT.md).

---

### Cara 2: Menjalankan Langsung di Host (Local Development)

#### Laragon dan XAMPP dalam satu kodebase

Tidak perlu mengubah URL atau konfigurasi database di source code saat berpindah
antara Laragon dan XAMPP. Konfigurasi lokal disimpan di file yang tidak masuk Git.
Untuk developer baru yang belum memiliki file `.env`, buat dari template:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Jangan menyalin template di atas ke file `.env` yang sudah ada karena itu akan
menimpa konfigurasi dan secret lokal. Keduanya menggunakan `127.0.0.1:3306`
secara default, yang sesuai untuk setup
standar Laragon maupun XAMPP. Jika MySQL salah satu anggota tim menggunakan port,
nama database, user, atau password lain, hanya ia yang mengubah
`backend/.env` miliknya (serta `DATABASE_URL` agar nilainya sama). File `.env`
tidak dikomit, sehingga perubahan tersebut tidak memengaruhi anggota tim lain.

Frontend selalu memanggil `/api` pada origin yang sama. Saat `npm run dev`, Vite
meneruskan request itu ke `VITE_BACKEND_TARGET` (default `http://127.0.0.1:3001`).
Jadi nilai tersebut adalah koneksi internal dev server, bukan URL yang perlu
ditanam di kode. Isi `VITE_API_BASE_URL` hanya bila frontend dan API memang
berada di origin publik yang berbeda.

1. **Install seluruh dependencies (Root + Backend):**
   ```bash
   npm run install:all
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Jalankan Frontend & Backend sekaligus (Single Command):**
   ```bash
   npm run dev
   ```
   - Frontend Vite: [http://localhost:5173](http://localhost:5173) (otomatis proxy `/api` ke port 3001)
   - Backend Next.js API: [http://localhost:3001](http://localhost:3001)

4. **Atau jalankan secara terpisah:**
   ```bash
   # Terminal 1 (Backend)
   npm run backend

   # Terminal 2 (Frontend)
   npm run frontend
   ```

---

## 🗄️ Prisma ORM & Database Commands

Skrip Prisma ORM dapat dijalankan langsung dari root workspace:

```bash
# Generate Prisma Client setelah mengubah schema.prisma
npm run prisma:generate

# Push schema langsung ke database (tanpa migration file)
npm run prisma:push

# Buat dan jalankan database migration
npm run prisma:migrate

# Buka Prisma Studio (Database GUI visual browser)
npm run prisma:studio
```

Schema file terletak di: `backend/prisma/schema.prisma`

---

## 🛠️ Mengelola Docker Services

**Lihat status containers:**
```bash
docker-compose ps
```

**Lihat logs:**
```bash
# Semua services
docker-compose logs

# Service tertentu
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mysql

# Follow logs (real-time)
docker-compose logs -f
```

**Stop services:**
```bash
docker-compose down
```

**Stop dan hapus volumes (reset data database):**
```bash
docker-compose down -v
```

**Rebuild specific service:**
```bash
docker-compose up --build frontend
docker-compose up --build backend
```

---

## 📁 Struktur File

```
TATC_Web_React/
├── docker-compose.yml          # Orchestration semua services (MySQL, phpMyAdmin, Backend, Frontend)
├── Dockerfile                  # Multi-stage build untuk React SPA + Nginx
├── nginx.conf                  # Nginx config untuk SPA routing & /api/ reverse proxy
├── .dockerignore
├── .env.example
├── package.json                # Root runner (concurrently, prisma, install:all)
├── src/                        # React frontend source code
│   ├── pages/
│   ├── components/
│   ├── layouts/
│   └── context/
├── backend/                    # Next.js API Backend
│   ├── Dockerfile              # Backend container build
│   ├── .dockerignore
│   ├── package.json
│   ├── prisma.config.ts        # Prisma configuration
│   ├── prisma/
│   │   └── schema.prisma       # 26 Model entitas database TATC
│   ├── lib/
│   │   ├── prisma.js           # Singleton PrismaClient
│   │   ├── db.js               # Raw MySQL connection pool
│   │   ├── auth.js             # Session management & security
│   │   └── http.js
│   └── app/api/[...path]/
│       └── route.js            # API route handlers
└── NGINX_PROXY_MANAGER.md      # Panduan setup production Nginx Proxy Manager
```

---

## 🔧 Konfigurasi Environment Variables

File `.env` di root dan `backend/.env` dapat disesuaikan:

| Variable | Default (Docker) | Keterangan |
|---|---|---|
| `DB_NAME` | `tatc_web` | Nama database |
| `DB_USER` | `tatc_user` | User database MySQL |
| `DB_PASS` | `tatc_password` | Password user database |
| `DB_ROOT_PASS` | `rootpassword` | Root password MySQL |
| `PMA_PORT` | `5050` | Port expose phpMyAdmin |
| `BACKEND_PORT` | `3001` | Port expose Next.js API |
| `FRONTEND_PORT` | `3000` | Port expose React Nginx |
| `DATABASE_URL` | `mysql://tatc_user:tatc_password@mysql:3306/tatc_web` | Prisma Connection String |
| `SESSION_SECRET` | *(Random secret 32+ chars)* | Kunci rahasia HttpOnly session cookie |

---

## 🐛 Troubleshooting

**Frontend tidak bisa memanggil API backend (502 / Network Error):**
- Pastikan backend container running: `docker-compose ps`
- Cek log backend: `docker-compose logs backend`
- Pastikan port 3001 tidak bentrok dengan aplikasi lain di host.

**Koneksi Database Gagal:**
- Cek log MySQL: `docker-compose logs mysql`
- Pastikan credential di `.env` dan `backend/.env` sesuai.

**Prisma Client Error (Cannot find module '@prisma/client'):**
- Jalankan: `npm run prisma:generate`
- Rebuild backend container: `docker-compose up --build backend`
