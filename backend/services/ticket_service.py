from enum import Enum

from sqlalchemy import case, func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import TicketNotFoundError
from core.logging import get_logger
from models.tickets import Ticket, TicketPriority, TicketStatus
from schemas.tickets import TicketCreate

logger = get_logger(__name__)

# Order priorities by urgency rather than alphabetically.
_PRIORITY_ORDER = case(
    {TicketPriority.LOW: 1, TicketPriority.MEDIUM: 2, TicketPriority.HIGH: 3},
    value=Ticket.priority,
)


class TicketSortField(str, Enum):
    CREATED_AT = "created_at"
    PRIORITY = "priority"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


_SORT_COLUMNS = {
    TicketSortField.CREATED_AT: Ticket.created_at,
    TicketSortField.PRIORITY: _PRIORITY_ORDER,
}


class TicketService:
    """Business logic for support tickets."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def _commit(self, failure_event: str, **context) -> None:
        """Commit the transaction, rolling back and re-raising on failure."""
        try:
            await self._db.commit()
        except SQLAlchemyError:
            await self._db.rollback()
            logger.exception(failure_event, **context)
            raise

    async def list_tickets(
        self,
        status: TicketStatus | None = None,
        priority: TicketPriority | None = None,
        search: str | None = None,
        sort_by: TicketSortField = TicketSortField.CREATED_AT,
        sort_order: SortOrder = SortOrder.DESC,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Ticket], int]:
        """Return one page of matching tickets and the total match count."""
        filters = self._build_filters(status=status, priority=priority, search=search)

        count_query = select(func.count()).select_from(Ticket)
        query = select(Ticket)
        for condition in filters:
            count_query = count_query.where(condition)
            query = query.where(condition)

        total = (await self._db.execute(count_query)).scalar_one()

        sort_column = _SORT_COLUMNS[sort_by]
        order_by = sort_column.asc() if sort_order is SortOrder.ASC else sort_column.desc()
        query = (
            query.order_by(order_by, Ticket.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await self._db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    def _build_filters(
        status: TicketStatus | None,
        priority: TicketPriority | None,
        search: str | None,
    ) -> list:
        """Translate the optional filter arguments into SQLAlchemy conditions."""
        filters = []
        if status is not None:
            filters.append(Ticket.status == status)
        if priority is not None:
            filters.append(Ticket.priority == priority)
        if search:
            pattern = f"%{search.strip()}%"
            filters.append(
                or_(Ticket.title.ilike(pattern), Ticket.customer_name.ilike(pattern))
            )
        return filters

    async def get_ticket(self, ticket_id: int) -> Ticket:
        """Return the ticket with the given id.

        Raises:
            TicketNotFoundError: if no ticket has that id.
        """
        ticket = await self._db.get(Ticket, ticket_id)
        if ticket is None:
            raise TicketNotFoundError(ticket_id)
        return ticket

    async def create_ticket(self, payload: TicketCreate) -> Ticket:
        """Persist a new ticket. New tickets always start with status Open."""
        ticket = Ticket(
            **payload.model_dump(),
            status=TicketStatus.OPEN,
        )
        self._db.add(ticket)
        await self._commit("ticket_create_failed")
        await self._db.refresh(ticket)

        logger.info("ticket_created", ticket_id=ticket.id, priority=ticket.priority.value)
        return ticket

    async def delete_ticket(self, ticket_id: int) -> None:
        """Permanently delete a ticket.

        Raises:
            TicketNotFoundError: if no ticket has that id.
        """
        ticket = await self.get_ticket(ticket_id)

        await self._db.delete(ticket)
        await self._commit("ticket_delete_failed", ticket_id=ticket_id)

        logger.info("ticket_deleted", ticket_id=ticket_id)

    async def update_status(self, ticket_id: int, status: TicketStatus) -> Ticket:
        """Set a ticket's status and persist the change.

        Raises:
            TicketNotFoundError: if no ticket has that id.
        """
        ticket = await self.get_ticket(ticket_id)
        previous_status = ticket.status

        ticket.status = status
        await self._commit("ticket_status_update_failed", ticket_id=ticket_id)
        await self._db.refresh(ticket)

        logger.info(
            "ticket_status_updated",
            ticket_id=ticket.id,
            from_status=previous_status.value,
            to_status=status.value,
        )
        return ticket
