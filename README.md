# Ticket Dashboard

A full-stack support ticket dashboard built with a FastAPI backend and a
Next.js frontend. Users can authenticate, view tickets, create tickets, filter
and sort tickets, drag tickets between status columns, update ticket status from
the detail modal, and delete tickets with role-based permissions.

## 1. Technologies used

### Backend

- Python 3.12+
- FastAPI
- SQLAlchemy async
- Alembic migrations
- SQLite with `aiosqlite`
- Pydantic
- JWT authentication with PyJWT
- pytest and pytest-asyncio

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- lucide-react icons
- Browser `localStorage` for storing the JWT access token

### DevOps / tooling

- Docker
- Docker Compose
- ESLint

## 2. Installation instructions

### Option A: Docker installation

Requirements:

- Docker
- Docker Compose

From the project root:

```bash
docker compose up --build
```

This builds and starts both services:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- Swagger docs: <http://localhost:8000/docs>

Stop the containers:

```bash
docker compose down
```

Remove containers and the persisted database volume:

```bash
docker compose down -v
```

### Option B: Manual local installation

Backend requirements:

- Python 3.12+
- SQLite 3

Frontend requirements:

- Node.js 22+
- npm

Install backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
```

Install frontend:

```bash
cd frontend
npm install
```

Optional frontend environment file:

```bash
cd frontend
touch .env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

If this value is not set, the frontend defaults to
`http://localhost:8000/api`.

## 3. How to run the frontend and backend

### Run with Docker Compose

From the root directory:

```bash
docker compose up --build
```

Open:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>

### Run manually

Start the backend:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## 4. How to set up the database or seed sample data

### Database setup

The backend uses SQLite.

For local development, the default database URL is:

```env
DATABASE_URL=sqlite+aiosqlite:///./app.db
```

Run migrations from the `backend/` directory:

```bash
alembic upgrade head
```

Useful Alembic commands:

```bash
alembic revision --autogenerate -m "describe the change"
alembic check
alembic downgrade -1
```

### Seed sample data locally

From `backend/`:

```bash
python -m scripts.seed_users
python -m scripts.seed_tickets
```

### Seed sample data in Docker

With the backend container running:

```bash
docker compose exec backend python -m scripts.seed_users
docker compose exec backend python -m scripts.seed_tickets
```

### Seeded users

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `admin12345` |
| Super admin | `superadmin@example.com` | `superadmin12345` |
| User | `muhammad@example.com` | `muhammad12345` |

These credentials are for local development only.

## 5. How to run the automated tests

### Backend tests

From `backend/`:

```bash
source venv/bin/activate
pytest -q
```

If using the checked-in virtual environment path in this local project:

```bash
./venv/bin/pytest -q
```

### Frontend checks

From `frontend/`:

```bash
npm run lint
npx tsc --noEmit
```

## Main API routes

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/logout` | Authenticated |
| `GET` | `/api/auth/user-details` | Authenticated |
| `GET` | `/api/tickets` | Authenticated |
| `POST` | `/api/tickets` | Admin or super-admin |
| `GET` | `/api/tickets/{id}` | Authenticated |
| `PATCH` | `/api/tickets/{id}` | Admin or super-admin |
| `DELETE` | `/api/tickets/{id}` | Super-admin |

`GET /api/tickets` supports:

- `status=open|in_progress|resolved`
- `priority=low|medium|high`
- `search=<text>`
- `sort_by=created_at|priority`
- `sort_order=asc|desc`
- `page=<number>`
- `page_size=<number>`

## 6. Assumptions and technical trade-offs

- SQLite was used for simplicity and fast local setup. It is enough for a demo
  or small local deployment, but PostgreSQL would be a better production choice.
- JWTs are stored in `localStorage` on the frontend. This is simple for a demo,
  but an HTTP-only secure cookie would be safer in production.
- Logout clears the client-side token. Since the access token is stateless,
  server-side token revocation would require a token blacklist or refresh-token
  strategy.
- Role-based access is enforced in the backend:
  - normal users can read tickets;
  - admins can create/update tickets;
  - super-admins can delete tickets.
- The frontend uses native HTML5 drag-and-drop instead of a larger drag/drop
  library. This keeps dependencies small, but a library could provide better
  keyboard accessibility and smoother cross-device behavior.
- The current frontend fetches up to 100 tickets for the dashboard. This keeps
  the UI simple, but larger datasets should use server-side pagination or
  infinite scrolling.
- `NEXT_PUBLIC_API_URL` is browser-facing. In local Docker it points to
  `http://localhost:8000/api` so the browser can reach the backend through the
  published port.

## 7. What I would improve with more time

- Move authentication to secure HTTP-only cookies with refresh tokens.
- Add server-side token revocation or a proper refresh-token logout flow.
- Replace SQLite with PostgreSQL for production-style deployment.
- Add frontend unit/integration tests with React Testing Library or Playwright.
- Improve drag-and-drop accessibility for keyboard and screen-reader users.
- Add pagination/infinite scroll in the dashboard UI.
- Add optimistic UI rollback to create/delete flows with more detailed error
  states.
- Add ticket editing beyond status changes.