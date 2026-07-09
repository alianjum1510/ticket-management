from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import EmailAlreadyRegisteredError, InvalidCredentialsError
from core.logging import get_logger
from core.security import hash_password, verify_password
from models.users import User, UserRole
from schemas.users import UserRegister

logger = get_logger(__name__)


class UserService:
    """Business logic for accounts and authentication."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_email(self, email: str) -> User | None:
        """Return the user with the given email, or None if no account exists."""
        result = await self._db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def register(self, payload: UserRegister, role: UserRole = UserRole.USER) -> User:
        """Create a new account with a hashed password.

        Raises:
            EmailAlreadyRegisteredError: if the email is already taken,
                including when a concurrent request wins the unique-email
                race between the pre-check and the commit.
        """
        if await self.get_by_email(payload.email) is not None:
            raise EmailAlreadyRegisteredError(payload.email)

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=role,
        )
        self._db.add(user)
        try:
            await self._db.commit()
        except IntegrityError:
            await self._db.rollback()
            raise EmailAlreadyRegisteredError(payload.email)
        except SQLAlchemyError:
            await self._db.rollback()
            logger.exception("user_registration_failed")
            raise
        await self._db.refresh(user)

        logger.info("user_registered", user_id=user.id, role=user.role.value)
        return user

    async def authenticate(self, email: str, password: str) -> User:
        """Verify an email/password pair and return the matching user.

        Raises:
            InvalidCredentialsError: if the email is unknown or the password
                does not match; callers cannot distinguish the two on purpose.
        """
        user = await self.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        return user
