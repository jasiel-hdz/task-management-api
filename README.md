# Task Management API

REST API for team task management. Users can be created with roles (administrator or member); tasks support multiple assignees, due dates, estimated/actual hours, status (active/finished), and cost. The API uses JWT authentication and role-based access for protected routes.

Built with **NestJS**, **TypeScript**, and **PostgreSQL**.

---

## Features

- **Auth:** Login with email/password; JWT issued for protected endpoints.
- **Users:** Create (admin only) and list users with filters (name, email, role). List response includes each user’s finished task count and total cost of finished tasks.
- **Tasks:** Full CRUD; assign multiple users; filters (title, due date, assignee by id/name/email); order by newest first. Dedicated endpoints to update task time and status. Analytics: total tasks, completed tasks, total cost.

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

Configure at least `DB_*` and `JWT_SECRET`. Optionally set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to auto-create an admin user on first run.

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
| Tasks     | PATCH  | `/tasks/:id/time`  | Update actual hours (member or admin) |
| Tasks     | PATCH  | `/tasks/:id/status`| Update status (member or admin) |
| Tasks     | DELETE | `/tasks/:id`       | Delete task (admin) |
| Tasks     | GET    | `/tasks/analytics` | Analytics: totalTasks, completedTasks, totalCost (admin) |

A Postman collection is available in **`postman/Task-Management-API.postman_collection.json`**. Import it and set `baseUrl` to `http://localhost:3000`. After **Login**, the token is saved automatically and used in the other requests.

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
