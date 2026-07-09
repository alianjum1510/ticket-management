from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from api.deps import CurrentUserDep, UserServiceDep
from core.security import create_access_token
from schemas.users import Token, UserRead, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, service: UserServiceDep) -> UserRead:
    """Register a new account. Self-registered accounts always get the user role."""
    user = await service.register(payload)
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: UserServiceDep,
) -> Token:
    """Exchange email (as username) and password for a JWT access token."""
    user = await service.authenticate(form_data.username, form_data.password)
    return Token(access_token=create_access_token(user.id, user.role.value))


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: CurrentUserDep) -> UserRead:
    """Return the profile of the currently authenticated user."""
    return UserRead.model_validate(current_user)
