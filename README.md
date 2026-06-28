# DevPulse 🚼

**Internal Tech Issue & Feature Tracker** — A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| GitHub Repo | `https://github.com/parety308/DevPulse_A2-Express_SQL-` |
| Live API | `https://dev-pulse-sigma-one.vercel.app` |
| Interview Video | `https://drive.google.com/...` |

---

## ✨ Features

- JWT-based authentication with role-based access control
- User roles: `contributor` and `maintainer` with distinct permissions
- Create, read, update, and delete issue reports (bugs & feature requests)
- Issue filtering by `type` and `status`, sorting by newest/oldest
- Password hashing with bcrypt
- Raw SQL with PostgreSQL (no ORM, no JOINs)
- Modular Express architecture with TypeScript

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js (LTS 24.x) | Runtime |
| TypeScript | Type-safe development |
| Express.js | HTTP server & routing |
| PostgreSQL | Relational database |
| Raw SQL (`pg`) | Direct pool queries, no ORM |
| bcrypt | Password hashing (salt rounds 8–12) |
| jsonwebtoken | JWT generation & verification |
| http-status-codes | Consistent HTTP status references |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 24.x or higher
- PostgreSQL database (NeonDB / Supabase / ElephantSQL recommended)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/devpulse.git
cd devpulse

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in your values (see Environment Variables below)

# 4. Run database migrations
npm run migrate

# 5. Start development server
npm run dev

# 6. Build for production
npm run build
npm start
```

### Environment Variables

```env
PORT=5000
CONNECTING_STRING=postgresql://neondb_owner:npg_UIAowF0glGO8@ep-polished-forest-aqfuuy8x-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
AccessTokeSecret_JWT=feybyltynhgvbtm;biujmuyntbyvgybgvvuhtm
```

---

## 🗄️ Database Schema

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR | NOT NULL |
| `email` | VARCHAR | NOT NULL, UNIQUE |
| `password` | VARCHAR | NOT NULL (hashed) |
| `role` | VARCHAR | DEFAULT `contributor`, CHECK (`contributor` \| `maintainer`) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | AUTO-UPDATED |

### `issues`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | SERIAL | PRIMARY KEY |
| `title` | VARCHAR(150) | NOT NULL |
| `description` | TEXT | NOT NULL, MIN 20 chars |
| `type` | VARCHAR | CHECK (`bug` \| `feature_request`) |
| `status` | VARCHAR | DEFAULT `open`, CHECK (`open` \| `in_progress` \| `resolved`) |
| `reporter_id` | INTEGER | References `users.id` (app-level validation) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | AUTO-UPDATED |

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |

### Issues

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/issues` | Authenticated | Create a new issue |
| GET | `/api/issues` | Public | Get all issues (with filters) |
| GET | `/api/issues/:id` | Public | Get a single issue |
| PATCH | `/api/issues/:id` | Authenticated | Update an issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete an issue |

### Query Parameters for `GET /api/issues`

| Param | Values | Default |
|-------|--------|---------|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | — |
| `status` | `open`, `in_progress`, `resolved` | — |

**Example:** `GET /api/issues?sort=oldest&type=bug&status=open`

---

## 📋 Request & Response Examples

### POST `/api/auth/signup`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "role": "contributor",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
}
```

### POST `/api/auth/login`

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "name": "John Doe", "email": "john.doe@devpulse.com", "role": "contributor" }
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
```

---

## 👥 Roles & Permissions

| Action | Contributor | Maintainer |
|--------|:-----------:|:----------:|
| Register / Login | ✅ | ✅ |
| View all issues | ✅ | ✅ |
| Create issues | ✅ | ✅ |
| Update own open issues | ✅ | ✅ |
| Update any issue | ❌ | ✅ |
| Change issue status | ❌ | ✅ |
| Delete any issue | ❌ | ✅ |

---

## 📁 Project Structure

```
devpulse/
├── src/
│   ├── config/          # DB pool, env config
│   ├── modules/
│   │   ├── auth/        # signup, login routes & controllers
│   │   └── issues/      # issue routes & controllers
│   ├── middleware/      # auth, role-check, error handler
│   ├── utils/           # response helpers, SQL helpers
│   └── app.ts           # Express app entry point
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔐 Authorization Header

Protected routes require the JWT token in the `Authorization` header:

```
Authorization: <JWT_TOKEN>
```

---

## 📄 License

This project was built as an academic assignment for Apollo Level 2 Web Development.
