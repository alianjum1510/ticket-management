from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models.users import UserRole


class UserRegister(BaseModel):
    """Public registration payload.

    Role is intentionally not accepted: self-registered accounts are always
    plain users. Elevated roles are provisioned via the seed script.
    """

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
