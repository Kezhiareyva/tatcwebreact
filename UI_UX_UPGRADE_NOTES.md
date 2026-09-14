# TATC UI/UX + Architecture Upgrade v2

## Architecture
- Frontend: React + Vite.
- Backend: Next.js App Router + Node.js.
- Database: MySQL/MariaDB through mysql2.
- PHP API moved to `legacy_php_api/` for reference only; it is no longer the active API.
- Development proxy: Vite `/api` -> Next backend `localhost:3001`.

## Security changes
- Removed client-trusted `requester_role` as the authorization source.
- Authentication now uses an HttpOnly, signed session cookie.
- Password verification uses bcryptjs.
- Backend performs role checks.
- Dynamic CRUD columns are checked against `SHOW COLUMNS` before SQL construction.
- Login failure lockout is preserved when legacy fields exist.

## UX changes
- Admin shell refreshed: navigation hierarchy, mobile drawer, sticky topbar, profile menu, responsive grids.
- Added consistent form controls, focus states, loading states, reduced-motion support, and better spacing.
- Frontend no longer persists authentication identity in localStorage.

## Important deployment change
The earlier project constraint said CyberPanel has no Node.js. This version explicitly uses a Node.js/Next.js backend, so production hosting must provide a supported Node.js runtime (or the backend must be hosted separately). The React frontend can still be built to static files.

## Database compatibility
The backend targets the current `tatc_web` application tables used by the source project. Before production cutover, reconcile these with the normalized foundation schema from `TATC_Database_Foundation_v1` rather than silently changing legacy data.
