# Leave Application System

Role-based leave management web app (Employee/Admin) using **Node.js, Express, PostgreSQL** with JWT auth, validation, and audit logging. Backend deploys on **Railway**, frontend on **Vercel**.

## Features
- Secure auth (JWT), roles: EMPLOYEE / ADMIN
- Employees: create/update/delete PENDING leave, view history
- Admin: list/filter all leaves, approve/reject with comments
- Audit logs for login and all leave mutations
- Simple admin metrics endpoint

## Tech
- Backend: Node.js, Express, pg, express-validator, bcrypt, jsonwebtoken
- Frontend: React (Vite)
- DB: PostgreSQL
- Deploy: Railway (API + DB), Vercel (UI)

## Local Setup

### Backend
```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL/JWT_SECRET/CORS_ORIGIN
npm install
# (optional) start Postgres via docker compose
npm run db:init
npm run db:seed
npm run dev
````

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_BASE=http://localhost:5000" > .env
npm run dev
```

## Deploy

* Railway: set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`; run `schema.sql` and `npm run db:seed`
* Vercel: set `VITE_API_BASE` to your Railway URL

## API (selected)

* `POST /api/auth/login` → { token, user }
* `GET /api/auth/me`
* `POST /api/auth/register` (ADMIN)
* `POST /api/leaves` (EMPLOYEE)
* `GET /api/leaves` (EMPLOYEE=own, ADMIN=all)
* `PUT /api/leaves/:id` (owner, PENDING)
* `DELETE /api/leaves/:id` (owner, PENDING)
* `POST /api/admin/leaves/:id/approve|reject` (ADMIN)
* `GET /api/admin/leaves/dashboard/metrics` (ADMIN)

```
