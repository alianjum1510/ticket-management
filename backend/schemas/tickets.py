from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer

from models.tickets import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    """Payload for creating a ticket.

    Status is intentionally not accepted: new tickets always start as Open,
    which the service layer enforces.
    """

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    customer_name: str = Field(min_length=1, max_length=120)
    customer_email: EmailStr
    priority: TicketPriority


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    customer_name: str
    customer_email: EmailStr
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, value: datetime) -> str:
        # SQLite stores datetimes without tzinfo; timestamps are written as
        # UTC, so mark them explicitly for API consumers.
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()


class TicketPage(BaseModel):
    items: list[TicketRead]
    total: int
    page: int
    page_size: int
