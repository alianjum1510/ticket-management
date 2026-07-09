from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from models.users import UserRole


class UserRegister(BaseModel):
    """Public registration payload.

    Role is intentionally not accepted: self-registered accounts are always
    plain users. Elevated roles are provisioned via the seed script.
    """

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(
        min_length=8,
        max_length=128,
        description=(
            "Must contain an uppercase letter, lowercase letter, number, "
            "and special character."
        ),
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        missing_requirements = []
        if not any(character.isupper() for character in password):
            missing_requirements.append("an uppercase letter")
        if not any(character.islower() for character in password):
            missing_requirements.append("a lowercase letter")
        if not any(character.isdigit() for character in password):
            missing_requirements.append("a number")
        if not any(
            not character.isalnum() and not character.isspace()
            for character in password
        ):
            missing_requirements.append("a special character")

        if missing_requirements:
            requirements = ", ".join(missing_requirements)
            raise ValueError(f"Password must contain {requirements}")

        return password


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
