# Backend Deployment Checklist

- [ ] Node.js 20+ runtime available
- [ ] `npm install` completed in backend
- [ ] `.env.local` / production environment configured
- [ ] `SESSION_SECRET` replaced with a long random value
- [ ] Database user has least-privilege permissions
- [ ] MySQL/MariaDB reachable from backend
- [ ] `npm run build` succeeds
- [ ] `npm start` runs successfully
- [ ] Reverse proxy `/api/*` → backend port
- [ ] HTTPS enabled
- [ ] React `dist/` points to the correct public host
- [ ] Legacy PHP API is not exposed as active API
