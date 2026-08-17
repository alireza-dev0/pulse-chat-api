# Pulse Chat API

Real-time chat backend built with NestJS, PostgreSQL, Redis, and Socket.IO. Handles authentication via HTTP-only cookies, room management, live messaging, and member presence (online / offline / typing).

Looking to build the frontend? See **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** for REST + WebSocket integration details.

---

## Features

* **Auth** — signup, signin, logout, refresh token, current user (`/auth/me`)
* **Rooms** — list, create, delete; owner-only deletion
* **Messages** — history via REST, live delivery via WebSocket
* **Presence** — online, offline, and typing states (stored in Redis)
* **Real-time events** — room created/deleted, user joined/left, messages, status changes

---

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Framework  | NestJS 11                                  |
| Database   | PostgreSQL + Prisma                        |
| Cache      | Redis (via `@nestjs/cache-manager` + Keyv) |
| Auth       | JWT in HTTP-only cookies, Passport         |
| WebSocket  | Socket.IO                                  |
| Validation | class-validator                            |
| API docs   | Swagger (development only)                 |

---

## Prerequisites

* **Node.js** 20+
* **pnpm** (recommended) or npm
* **Docker** (for local PostgreSQL and Redis)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd api
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts:

* PostgreSQL on `5432` (user: `user`, password: `password`, db: `chat`)
* Redis on `6379`

### 3. Environment

Copy the example file and adjust if needed:

```bash
cp .env.example .env.development
```

Default values in `.env.development` already match `compose.yml`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/chat"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="secret"
BCRYPT_SALT_ROUNDS=10
PORT=3000
```

### 4. Database

```bash
pnpm exec prisma migrate dev
```

Or, if you prefer pushing the schema without migrations:

```bash
pnpm exec prisma db push
```

### 5. Run

```bash
pnpm start:dev
```

API runs at **[http://localhost:3000](http://localhost:3000)** (or whatever `PORT` you set).

In development, Swagger is available at **[http://localhost:3000/docs/swagger](http://localhost:3000/docs/swagger)**.

---

## Environment Variables

| Variable             | Description                            |
| -------------------- | -------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string           |
| `REDIS_URL`          | Redis connection string                |
| `JWT_SECRET`         | Secret for signing JWTs                |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds for passwords       |
| `PORT`               | HTTP server port                       |
| `NODE_ENV`           | `development`, `production`, or `test` |

---

## REST API Overview

All room endpoints require authentication (`access-token` cookie). Auth endpoints set or clear cookies automatically.

### Auth

| Method | Path                  | Auth           | Description                            |
| ------ | --------------------- | -------------- | -------------------------------------- |
| `POST` | `/auth/signup`        | —              | Register (`name`, `email`, `password`) |
| `POST` | `/auth/signin`        | —              | Login (`email`, `password`)            |
| `POST` | `/auth/logout`        | —              | Clear auth cookies                     |
| `POST` | `/auth/refresh-token` | refresh cookie | Refresh tokens                         |
| `GET`  | `/auth/me`            | access cookie  | Current user (`JwtPayload`)            |

### Rooms

| Method   | Path                 | Description                                           |
| -------- | -------------------- | ----------------------------------------------------- |
| `GET`    | `/room`              | List all rooms                                        |
| `POST`   | `/room`              | Create room (`name`) — creator becomes owner + member |
| `DELETE` | `/room/:id`          | Delete room (owner only)                              |
| `GET`    | `/room/:id/messages` | Message history (members only)                        |

### Cookies

| Cookie          | Lifetime   | Purpose              |
| --------------- | ---------- | -------------------- |
| `access-token`  | 15 minutes | API + WebSocket auth |
| `refresh-token` | 7 days     | Token refresh        |

Cookies are `httpOnly`, `sameSite: lax`, and `secure` in production.

---

## WebSocket

Socket.IO runs on the same host/port as the HTTP server. See **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** for:

* Connection setup (`withCredentials`)
* All client → server events
* All server → client events
* Payload shapes and recommended UI flows

---

## Development Notes

* **CORS** is enabled in development for `http://localhost:3000` with `credentials: true`. If your frontend runs on another origin (e.g. Vite on `5173`), update CORS in `src/main.ts` and the WebSocket gateway configs.
* **Validation errors** return Persian messages from `class-validator`.
* **Swagger** is only mounted when `NODE_ENV === 'development'`.

---

## Scripts

| Command           | Description           |
| ----------------- | --------------------- |
| `pnpm start:dev`  | Dev server with watch |
| `pnpm build`      | Production build      |
| `pnpm start:prod` | Run built app         |
| `pnpm lint`       | ESLint                |
| `pnpm test`       | Unit tests            |
| `pnpm test:e2e`   | E2E tests             |

---

## Project Structure

```text
src/
├── common/           # Guards, decorators (WsAuthGuard, @User)
├── modules/
│   ├── auth/         # Signup, signin, JWT strategies
│   ├── chat/         # Message WebSocket gateway + service
│   ├── room/         # Room REST + WebSocket gateway + presence
│   └── database/     # Prisma DatabaseService
├── prisma/generated/ # Prisma client output
├── app.module.ts
└── main.ts
prisma/
└── schema.prisma
```

---

## License

UNLICENSED — private project.
