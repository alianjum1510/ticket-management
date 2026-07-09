from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import decode_access_token
from db.session import get_db
from models.users import User, UserRole
from services.ticket_service import TicketService
from services.user_service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DbDep = Annotated[AsyncSession, Depends(get_db)]


def get_ticket_service(db: DbDep) -> TicketService:
    return TicketService(db)


def get_user_service(db: DbDep) -> UserService:
    return UserService(db)


TicketServiceDep = Annotated[TicketService, Depends(get_ticket_service)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DbDep) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise credentials_error

    user = await db.get(User, user_id)
    if user is None:
        raise credentials_error
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed_roles: UserRole):
    """Dependency factory restricting an endpoint to the given roles."""

    async def checker(current_user: CurrentUserDep) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return Depends(checker)
