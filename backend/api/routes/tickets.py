from fastapi import APIRouter, Query, status

from api.deps import TicketServiceDep, require_roles
from models.tickets import TicketPriority, TicketStatus
from models.users import UserRole
from schemas.tickets import TicketCreate, TicketPage, TicketRead, TicketStatusUpdate
from services.ticket_service import SortOrder, TicketSortField

router = APIRouter(prefix="/tickets", tags=["tickets"])
read_access = require_roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
write_access = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
delete_access = require_roles(UserRole.SUPER_ADMIN)


@router.get("", response_model=TicketPage, dependencies=[read_access])
async def list_tickets(
    service: TicketServiceDep,
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    priority: TicketPriority | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
    sort_by: TicketSortField = Query(default=TicketSortField.CREATED_AT),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> TicketPage:
    """List tickets with optional status/priority filters, title or customer
    search, sorting, and pagination."""
    tickets, total = await service.list_tickets(
        status=status_filter,
        priority=priority,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return TicketPage(
        items=[TicketRead.model_validate(ticket) for ticket in tickets],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=TicketRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[write_access],
)
async def create_ticket(payload: TicketCreate, service: TicketServiceDep) -> TicketRead:
    """Create a new ticket. New tickets always start with status Open."""
    ticket = await service.create_ticket(payload)
    return TicketRead.model_validate(ticket)


@router.get("/{ticket_id}", response_model=TicketRead, dependencies=[read_access])
async def get_ticket(ticket_id: int, service: TicketServiceDep) -> TicketRead:
    """Return full details for a single ticket."""
    ticket = await service.get_ticket(ticket_id)
    return TicketRead.model_validate(ticket)


@router.patch("/{ticket_id}", response_model=TicketRead, dependencies=[write_access])
async def update_ticket_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    service: TicketServiceDep,
) -> TicketRead:
    """Update a ticket's status and persist the change."""
    ticket = await service.update_status(ticket_id, payload.status)
    return TicketRead.model_validate(ticket)


@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[delete_access],
)
async def delete_ticket(ticket_id: int, service: TicketServiceDep) -> None:
    """Permanently delete a ticket."""
    await service.delete_ticket(ticket_id)
