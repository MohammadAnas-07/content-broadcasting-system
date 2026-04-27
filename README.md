# Content Broadcasting System

A production-grade REST API backend that enables schools to manage and broadcast content to students and displays. Teachers upload image-based content, principals review and approve it, and a public rotation engine serves the currently active item for each subject — cycling through approved content on a configurable time schedule.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 20 LTS |
| Framework | Express.js | ^4.21 |
| Database | PostgreSQL | 16 |
| ORM | Prisma | ^5.22 |
| Auth | JWT (jsonwebtoken) + bcrypt | ^9 / ^5 |
| File Upload | Multer | ^1.4 |
| Validation | Zod | ^3.23 |
| Caching | Redis via ioredis | ^5.4 |
| Rate Limiting | express-rate-limit | ^7.4 |
| API Docs | swagger-jsdoc + swagger-ui-express | ^6 / ^5 |
| Logging | Morgan (HTTP) + custom logger | ^1.10 |
| Env | dotenv | ^16 |

---

## Features

- **Role-based access control** — TEACHER and PRINCIPAL roles with middleware enforcement
- **Content upload** — multipart image upload with dual MIME/extension validation and UUID filenames
- **Approval workflow** — principal review queue with PENDING → APPROVED/REJECTED state machine
- **Time-based rotation engine** — deterministic, clock-driven content rotation per subject (the core of the system)
- **Public broadcast endpoint** — no auth, CORS-enabled, returns active content for any teacher
- **Redis caching** — 30-second cache on broadcast responses with graceful Redis-down fallback
- **Rate limiting** — 60 req/min on broadcast, 20 req/min on login
- **Pagination and filtering** — all list endpoints support page, limit, status, subject filters
- **Swagger UI** — full OpenAPI 3 docs at `/api/docs`
- **Static file serving** — uploaded images served at `/uploads/<filename>` with Cache-Control
- **Health check** — `/health` for platform liveness probes
- **Graceful shutdown** — SIGTERM handler for clean deployments
- **Timing-attack resistant login** — identical response for wrong email and wrong password

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for Postgres + Redis)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd content-broadcasting-system

# 2. Copy the environment file and edit it
cp .env.example .env
# Edit .env — at minimum, set JWT_SECRET to a strong random string

# 3. Start Postgres and Redis
docker compose up -d
# Wait ~10 seconds for Postgres to become healthy

# 4. Install dependencies
npm install

# 5. Run the database migration
npx prisma migrate dev --name init

# 6. Seed the database (creates users and sample content)
npm run seed

# 7. Start the development server
npm run dev
```

The server starts at `http://localhost:3000`. Swagger UI is at `http://localhost:3000/api/docs`.

---

## Environment Variables

| Variable | Example | Description |
|---|---|---|
| `NODE_ENV` | `development` | `production` disables debug logs and stack traces in responses |
| `PORT` | `3000` | HTTP server port |
| `DATABASE_URL` | `postgresql://cbs:cbs@localhost:5432/cbs` | Prisma connection string |
| `JWT_SECRET` | `replace-with-strong-random-string` | Must be at least 32 characters |
| `JWT_EXPIRES_IN` | `24h` | JWT expiry (any value parsable by the `ms` package) |
| `REDIS_URL` | `redis://localhost:6379` | ioredis connection string. App works without Redis |
| `UPLOAD_DIR` | `./uploads` | Directory where uploaded files are saved |
| `MAX_FILE_SIZE_MB` | `10` | Maximum upload file size in megabytes |

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a TEACHER or PRINCIPAL |
| `POST` | `/api/auth/login` | None | Login, receive JWT |
| `GET` | `/api/auth/me` | Bearer | Current user info |

**Register body:**
```json
{ "name": "Alice", "email": "alice@school.edu", "password": "Password123", "role": "TEACHER" }
```

**Login body:**
```json
{ "email": "principal@cbs.local", "password": "Password123" }
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Principal Admin", "email": "...", "role": "PRINCIPAL" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Content (Teacher)

All content routes require a TEACHER JWT.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/content/upload` | Upload an image. Multipart form. |
| `GET` | `/api/content/my-content` | List own content. Query: `page`, `limit`, `status`, `subject` |
| `GET` | `/api/content/:id` | Single content item (own only for teachers) |

**Upload form fields:**

| Field | Required | Notes |
|---|---|---|
| `file` | ✅ | JPEG, PNG, or GIF. Max 10MB. |
| `title` | ✅ | 2–200 characters |
| `subject` | ✅ | Stored lowercase |
| `description` | ❌ | Max 1000 chars |
| `startTime` | ❌ | ISO-8601. Required with `endTime`. |
| `endTime` | ❌ | ISO-8601. Must be after `startTime`. Required with `startTime`. |
| `rotationDurationMinutes` | ❌ | Integer 1–1440. Default: 5 |

Note: content without `startTime`/`endTime` is approved but **never served** by the broadcast endpoint.

---

### Approval (Principal)

All approval routes require a PRINCIPAL JWT.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/approval/pending` | Pending content queue. Query: `page`, `limit` |
| `GET` | `/api/approval/all` | All content. Query: `page`, `limit`, `status`, `subject`, `teacherId` |
| `PATCH` | `/api/approval/:id/approve` | Approve content. Returns 409 if not PENDING. |
| `PATCH` | `/api/approval/:id/reject` | Reject with reason. Body: `{ "rejectionReason": "..." }` |

---

### Broadcast (Public)

No authentication required. Rate limited to 60 req/min per IP.

| Method | Path | Description |
|---|---|---|
| `GET` | `/content/live` | Discovery — usage instructions and examples |
| `GET` | `/content/live/teacher-:id` | Active content for a teacher |
| `GET` | `/content/live/teacher-:id?subject=maths` | Active content for one subject |

**Response on hit:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "title": "Algebra Worksheet 1",
      "subject": "maths",
      "fileUrl": "/uploads/abc123.png",
      "description": "Introduction to linear equations",
      "rotationOrder": 2,
      "totalInRotation": 4,
      "secondsRemainingInSlot": 143
    }
  ]
}
```

**Response on miss (empty):**
```json
{
  "success": true,
  "data": [],
  "message": "No content available"
}
```

This endpoint NEVER returns 404 or an error shape.

---

### Health

| Method | Path | Auth |
|---|---|---|
| `GET` | `/health` | None |

```json
{ "status": "ok", "uptime": 3721.4, "timestamp": "2026-04-27T01:00:00.000Z" }
```

---

## Demo Credentials

These are created by `npm run seed`. Safe to use for evaluation and demos.

| Role | Email | Password |
|---|---|---|
| Principal | `principal@cbs.local` | `Password123` |
| Teacher 1 | `teacher1@cbs.local` | `Password123` |
| Teacher 2 | `teacher2@cbs.local` | `Password123` |

Teacher 1 has 3 pre-seeded APPROVED content items (maths × 2, science × 1) with a
broad time window (2025–2030) so the broadcast endpoint returns data immediately
on a fresh clone.

---

## Folder Structure

```
content-broadcasting-system/
├── src/
│   ├── config/
│   │   ├── db.js              # Prisma client singleton
│   │   ├── redis.js           # Redis client singleton
│   │   └── swagger.js         # Swagger/OpenAPI spec config
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── content.controller.js
│   │   ├── approval.controller.js
│   │   └── broadcast.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── content.routes.js
│   │   ├── approval.routes.js
│   │   ├── broadcast.routes.js
│   │   └── health.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── content.service.js
│   │   ├── approval.service.js
│   │   ├── scheduler.service.js   # ← the rotation engine
│   │   └── cache.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── error.middleware.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── content.validator.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   ├── logger.js
│   │   └── asyncHandler.js
│   ├── app.js
│   └── server.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── uploads/
│   └── .gitkeep
├── postman/
│   └── ContentBroadcasting.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── architecture-notes.txt
└── docker-compose.yml
```

---

## Time Zone Handling

The API accepts ISO-8601 strings for `startTime` and `endTime`. Both formats are valid:
- `2026-04-27T10:00:00Z` (UTC explicit)
- `2026-04-27T15:30:00+05:30` (IST offset)

Prisma automatically normalises both to UTC when storing in Postgres. The scheduler
operates entirely in UTC. There is no timezone conversion in the application code.

---

## Key Design Decisions

- **PENDING only** — "uploaded" and "pending" are the same state. The file and the DB row are created in the same request.
- **Rejected is final** — once rejected, a content row stays rejected forever. Teachers re-upload, not re-submit.
- **409 on double-action** — approving or rejecting already-processed content returns 409 Conflict.
- **Rotation epoch = earliest createdAt** — avoids phase shifts when new items are added with different startTimes.
- **Bare filename in DB** — only the UUID filename (no path prefix) is stored. Makes storage backend swappable.
- **Never 404 on broadcast** — the broadcast endpoint always returns 200, even with empty data.
- **Redis is optional** — the server starts and runs fully without Redis; caching just degrades gracefully.

---

## Assumptions and Skipped Items

1. **No email sending** — approval/rejection notifications exist only as in-response data.
2. **Local disk storage** — uploads are ephemeral on Render free tier (documented in Deployment section). S3 swap is a one-file change.
3. **No tests** — unit and integration tests were skipped to focus on shipping a complete, correct implementation.
4. **No WebSocket** — the rotation is poll-based. Clients poll `/content/live/teacher-:id` on an interval.
5. **ContentSlot/ContentSchedule** — these tables exist to satisfy the minimum schema requirement. They are not read by the runtime. See `architecture-notes.txt`.
6. **Single upload per request** — Multer is configured for `upload.single('file')`. Batch upload is not supported.

---

## Postman Collection

Import `postman/ContentBroadcasting.postman_collection.json` into Postman.

The **Login as Principal** and **Login as Teacher 1** requests include a test script
that automatically stores the JWT token in the `cbs_token` collection variable.
All protected requests use `{{cbs_token}}` as the Bearer token, so you only need to
log in once per session.

---

## Swagger UI

After starting the server, browse to:

```
http://localhost:3000/api/docs
```

Click "Authorize" and paste your JWT token (without "Bearer "). All protected
endpoints will include the token automatically.

---

## Deployment (Render)

1. Push the repo to GitHub.
2. Create a **Web Service** on Render pointing at the repo.
3. Add a **PostgreSQL** add-on. Copy the `DATABASE_URL` into environment variables.
4. Optionally add a **Redis** add-on. Copy `REDIS_URL`. The app works without it.
5. **Build command:**
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
6. **Start command:**
   ```
   npm run seed && npm start
   ```
   The seed is idempotent (`upsert`) so it is safe to run on every deploy.
7. Set environment variables:
   - `JWT_SECRET` — a strong random string (32+ characters)
   - `NODE_ENV=production`
   - `DATABASE_URL` — from the Postgres add-on
   - `REDIS_URL` — from the Redis add-on (optional)

**Note on uploads:** Render's free tier uses an ephemeral filesystem. Uploaded files
are lost on each deploy or restart. For a persistent production deployment, swap
Multer's disk storage for S3 (or Cloudinary). The code change is isolated to
`src/middlewares/upload.middleware.js` and `src/services/content.service.js`.

---

## Demo Video Checklist

Use this checklist to structure your demo recording. Target: 4–5 minutes.

- [ ] **0:00 – 0:15** — Show the GitHub repo and folder structure. Point out `scheduler.service.js` as the centerpiece.
- [ ] **0:15 – 0:45** — Open `architecture-notes.txt`, briefly scroll through Section 5 (Scheduling and Rotation Logic) and the worked example.
- [ ] **0:45 – 1:05** — In Postman, run "Login as Principal." Show the JWT stored in the collection variable.
- [ ] **1:05 – 1:45** — Switch to Teacher 1 login. Run "Upload Content (Image)" with a real image file, startTime/endTime set. Show the 201 response with `status: PENDING`.
- [ ] **1:45 – 2:25** — Switch back to Principal. Run "List Pending Content" to see the new upload. Approve one item. Reject another with a reason. Show the 409 response when trying to approve an already-approved item.
- [ ] **2:25 – 2:55** — Hit `/content/live/teacher-1` in Postman. Show the active rotation response with `rotationOrder`, `totalInRotation`, and `secondsRemainingInSlot`.
- [ ] **2:55 – 3:25** — Wait for `secondsRemainingInSlot` to expire (or temporarily reduce `rotationDurationMinutes` to 1 in the seed and re-seed). Hit the endpoint again. Show that `rotationOrder` has incremented to the next item.
- [ ] **3:25 – 3:40** — Hit `/content/live/teacher-2`. Show the empty response: `{ "success": true, "data": [], "message": "No content available" }`.
- [ ] **3:40 – 3:55** — Open a browser, navigate to `http://localhost:3000/api/docs`. Briefly show the Swagger UI listing all endpoints.
- [ ] **3:55 – 4:00** — Done.
