from collections.abc import AsyncGenerator
from datetime import datetime
import os

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-with-at-least-32-chars")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from core.security import create_access_token, hash_password
from db.base import Base
from db.session import get_db
from main import app
from models.tickets import Ticket, TicketPriority, TicketStatus
from models.users import User, UserRole

test_engine = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client

    app.dependency_overrides.clear()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


async def create_user(email: str, role: UserRole, password: str = "password123") -> User:
    async with TestSessionLocal() as session:
        user = User(
            email=email,
            full_name="Test User",
            hashed_password=hash_password(password),
            role=role,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


async def create_ticket(
    title: str = "Sample ticket",
    customer_name: str = "Jane Doe",
    status: TicketStatus = TicketStatus.OPEN,
    priority: TicketPriority = TicketPriority.MEDIUM,
    created_at: datetime | None = None,
) -> Ticket:
    async with TestSessionLocal() as session:
        ticket = Ticket(
            title=title,
            description="Test description",
            customer_name=customer_name,
            customer_email="customer@example.com",
            status=status,
            priority=priority,
            **({"created_at": created_at} if created_at is not None else {}),
        )
        session.add(ticket)
        await session.commit()
        await session.refresh(ticket)
        return ticket


def auth_header(user: User) -> dict[str, str]:
    token = create_access_token(user.id, user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def user_headers(client: AsyncClient) -> dict[str, str]:
    return auth_header(await create_user("user@test.com", UserRole.USER))


@pytest_asyncio.fixture
async def admin_headers(client: AsyncClient) -> dict[str, str]:
    return auth_header(await create_user("admin@test.com", UserRole.ADMIN))


@pytest_asyncio.fixture
async def super_admin_headers(client: AsyncClient) -> dict[str, str]:
    return auth_header(await create_user("superadmin@test.com", UserRole.SUPER_ADMIN))
