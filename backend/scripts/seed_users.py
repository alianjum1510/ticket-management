import asyncio

from core.logging import configure_logging, get_logger
from core.security import hash_password
from db.session import AsyncSessionLocal, close_db_engine
from models.users import User, UserRole
from services.user_service import UserService

logger = get_logger(__name__)

SEED_USERS = [
    {
        "email": "admin@example.com",
        "full_name": "Admin",
        "password": "admin12345",
        "role": UserRole.ADMIN,
    },
    {
        "email": "superadmin@example.com",
        "full_name": "Super Admin",
        "password": "superadmin12345",
        "role": UserRole.SUPER_ADMIN,
    },
    {
        "email": "muhammad@example.com",
        "full_name": "Muhammad Ali",
        "password": "muhammad12345",
        "role": UserRole.USER,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        service = UserService(session)
        for entry in SEED_USERS:
            if await service.get_by_email(entry["email"]) is not None:
                logger.info("seed_user_exists", email=entry["email"])
                continue

            session.add(
                User(
                    email=entry["email"],
                    full_name=entry["full_name"],
                    hashed_password=hash_password(entry["password"]),
                    role=entry["role"],
                )
            )
            await session.commit()
            logger.info("seed_user_created", email=entry["email"], role=entry["role"].value)

    await close_db_engine()


if __name__ == "__main__":
    configure_logging()
    asyncio.run(seed())
