# Ticket Dashboard

A FastAPI backend for managing support tickets with JWT authentication,
role-based access control, filtering, sorting, pagination, and SQLite storage.

## Features

- User registration and email/password login
- JWT-based authentication
- User, admin, and super-admin roles
- Ticket creation, listing, search, filtering, sorting, and pagination
- Ticket status updates and role-restricted deletion
- Alembic database migrations
- Repeatable user and ticket seed scripts
- Docker and Docker Compose support

## Project structure

```text
ticket-dashboard/
├── backend/
│   ├── alembic/          # Database migrations
│   ├── api/              # FastAPI routes and dependencies
│   ├── core/             # Configuration, security, and logging
│   ├── db/               # SQLAlchemy base and session
│   ├── models/           # Database models
│   ├── schemas/          # Request and response schemas
│   ├── scripts/          # Seed scripts
│   ├── services/         # Business logic
│   ├── tests/            # API tests
│   ├── Dockerfile
│   └── main.py
└── docker-compose.yml
```

## Run with Docker Compose

Docker Compose builds the backend, applies pending migrations, and starts the
API. The SQLite database is stored in a persistent named volume.

```bash
docker compose up --build
```

The API is available at:

- API: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

To stop the service:

```bash
docker compose down
```

To also delete the persisted database:

```bash
docker compose down -v
```

### Seed the Docker database

With the backend service running:

```bash
docker compose exec backend python -m scripts.seed_users
docker compose exec backend python -m scripts.seed_tickets
```

Seeded administrator accounts are defined in
`backend/scripts/seed_users.py`. Change the example passwords outside local
development.

## Local development

### Requirements

- Python 3.12 or newer
- SQLite 3

### Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn main:app --reload
```

The default database URL is:

```env
DATABASE_URL=sqlite+aiosqlite:///./app.db
```

Relative SQLite paths are resolved from the directory in which the command is
run, so backend commands should be run from `backend/`.

### Seed local data

```bash
python -m scripts.seed_users
python -m scripts.seed_tickets
```

Both scripts are idempotent and can be run more than once.

## Database migrations

Run all Alembic commands from `backend/`:

```bash
# Apply migrations
alembic upgrade head

# Create a migration after changing a model
alembic revision --autogenerate -m "describe the change"

# Check for model/schema differences
alembic check

# Roll back one migration
alembic downgrade -1
```

## Tests

```bash
cd backend
source venv/bin/activate
pytest -q
```

## Main API routes

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/tickets` | Authenticated |
| `POST` | `/api/tickets` | Admin or super-admin |
| `GET` | `/api/tickets/{id}` | Authenticated |
| `PATCH` | `/api/tickets/{id}` | Admin or super-admin |
| `DELETE` | `/api/tickets/{id}` | Super-admin |

## Configuration

Configuration is read from environment variables and `backend/.env`. See
`backend/.env.example` for all available settings. Use a strong,
environment-specific `JWT_SECRET_KEY` in deployed environments and do not
commit `.env` files.
