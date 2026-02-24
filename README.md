# Task Management API

REST API for team task management. Users can be created with roles (administrator or member); tasks support multiple assignees, due dates, estimated/actual hours, status (active/finished), cost, and completion timestamp. The API uses JWT authentication and role-based access; members can only update time and status on tasks assigned to them.

Built with **NestJS**, **TypeScript**, and **PostgreSQL**.

**Postman:** The repo includes a Postman collection (APIs JSON) to import and test all endpoints. File: **`postman/Task-Management-API.postman_collection.json`**. In Postman: Import → Upload that file; then run **Login** and use the rest of the requests (the token is stored automatically).

---

## Features

- **Auth:** Login with email/password; JWT issued for protected endpoints. Passport (JWT + local strategies).
- **Users:** Create (admin only) and list users with filters (name, email, role). List response includes each user’s **finished task count** and **total cost of finished tasks**.
- **Tasks:** Full CRUD; assign multiple users; **due date**, **estimated hours**, **actual hours** (tracked via PATCH `/tasks/:id/time`), **status** (active/finished), **cost**, **completedAt** (set when status becomes finished). List: order by newest first; filters by due date, title, assignee (id, name, or email); filters combinable. **Members can only update time and status for tasks they are assigned to;** admins can update any task.
- **Analytics:** Total/active/completed tasks, completion rate, overdue tasks, total and average cost, estimated vs actual hours, total assignments, total users, users with assignments, **top user by completed tasks** (with count and cost).
- **CORS** configurable via `CORS_ORIGIN` (default: allow any origin). **Validation** via global ValidationPipe and DTOs (class-validator). **Admin seed:** if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, an admin user is created on first API start.

---

## Tech stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL (Docker)
- Passport (JWT + local strategies), bcrypt

---

## Getting started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- npm

### 1. Environment

Copy the example env file and set your values:

```bash
cp .env.example .env
```

Configure at least `DB_*` and `JWT_SECRET`. Optional: `ADMIN_EMAIL` and `ADMIN_PASSWORD` (admin created on first run); `CORS_ORIGIN` (restrict allowed origin; unset = any).

### 2. Database

Start PostgreSQL:

```bash
docker compose up -d
```

The database is exposed on port **5434** on the host. Use `DB_HOST=localhost` and `DB_PORT=5434` in `.env` (see `.env.example`).

### 3. Run the API

```bash
npm install
npm run start:dev
```

When the app is ready, the API is available at **http://localhost:3000**.

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, the first time the API starts it creates an administrator with that email and password (if it does not already exist).

### 4. Authentication

Most endpoints require a JWT. Log in first:

- **POST** `http://localhost:3000/auth/login`
- Body: `{ "email": "your-admin@example.com", "password": "your-password" }`
- Response: `{ "access_token": "..." }`
- Use the token in the header: `Authorization: Bearer <access_token>`

---

## API overview

| Resource   | Method | Path               | Description |
|-----------|--------|--------------------|-------------|
| Auth      | POST   | `/auth/login`      | Login; returns `access_token` |
| Users     | POST   | `/users`           | Create user (admin only). Body: name, email, password, role |
| Users     | GET    | `/users`           | List users. Query: `name`, `email`, `role` |
| Tasks     | POST   | `/tasks`           | Create task (admin). Body: title, description, estimatedHours, dueDate, status, cost, assigneeIds |
| Tasks     | GET    | `/tasks`           | List tasks (newest first). Query: `title`, `dueDate`, `assigneeId`, `assigneeName`, `assigneeEmail` |
| Tasks     | GET    | `/tasks/:id`       | Get one task |
| Tasks     | PUT    | `/tasks/:id`       | Full update (admin) |
| Tasks     | PATCH  | `/tasks/:id`       | Partial update (admin) |
| Tasks     | PATCH  | `/tasks/:id/time`  | Update actual hours. Member: only if assigned; admin: any. Body: `{ "actualHours": number }` |
| Tasks     | PATCH  | `/tasks/:id/status`| Update status. Member: only if assigned; admin: any. Body: `{ "status": "active" \| "finished" }` |
| Tasks     | DELETE | `/tasks/:id`       | Delete task (admin) |
| Tasks     | GET    | `/tasks/analytics` | Analytics (admin). See below. |

**Analytics response** (GET `/tasks/analytics`): `totalTasks`, `activeTasks`, `completedTasks`, `completionRate`, `overdueTasks`, `totalCost`, `averageCostPerTask`, `totalEstimatedHours`, `totalActualHours`, `averageActualHoursPerCompletedTask`, `totalAssignments`, `totalUsers`, `usersWithAssignments`, `topUserByCompletedTasks` (userId, userName, userEmail, completedCount, totalCostFromCompleted).

A **Postman collection** (APIs JSON) is included: **`postman/Task-Management-API.postman_collection.json`**. In Postman, go to **Import** → upload this file. The collection uses `baseUrl` = `http://localhost:3000`. Run **Login** first; the token is saved automatically and sent on subsequent requests.

---

## Permissions (summary)

| Role            | Create/update/delete users | Create/update/delete tasks | List users/tasks | Update task time/status | Analytics |
|-----------------|----------------------------|----------------------------|------------------|--------------------------|-----------|
| Administrator   | Yes                        | Yes                        | Yes              | Any task                 | Yes       |
| Member          | No                         | No                         | Yes              | Only assigned tasks      | No        |

---

## Database

There are no manual migrations. In development, TypeORM creates/updates the schema from entities when the API starts. For production, consider using migrations and disabling `synchronize`.

---

## Scripts

```bash
npm run start:dev    # development with watch
npm run start:prod   # production
npm run test         # unit tests
npm run test:e2e     # e2e tests
npm run test:cov     # coverage
```

---

## Project structure

```
src/
├── main.ts
├── app.module.ts
├── config/
├── common/        # enums, guards, decorators
├── database/
└── modules/
    ├── auth/      # login, JWT strategies
    ├── users/     # users CRUD, filters, per-user metrics
    └── tasks/     # tasks CRUD, assignments, filters, analytics
```

---

## License

MIT.
