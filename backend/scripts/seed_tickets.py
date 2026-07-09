import asyncio

from sqlalchemy import select

from core.logging import configure_logging, get_logger
from db.session import AsyncSessionLocal, close_db_engine
from models.tickets import Ticket, TicketPriority, TicketStatus

logger = get_logger(__name__)

# title, description, customer name, customer email, status, priority
SEED_TICKETS = [
    ("Unable to reset account password", "Password reset emails are not arriving.", "Ayesha Khan", "ayesha.khan@example.com", TicketStatus.OPEN, TicketPriority.HIGH),
    ("Billing address needs updating", "Update the billing address before the next invoice.", "Daniel Lee", "daniel.lee@example.com", TicketStatus.IN_PROGRESS, TicketPriority.MEDIUM),
    ("Feature request for CSV export", "Add an option to export the ticket list as CSV.", "Sara Ahmed", "sara.ahmed@example.com", TicketStatus.OPEN, TicketPriority.LOW),
    ("Duplicate charge on subscription", "The monthly subscription payment appears twice.", "Michael Brown", "michael.brown@example.com", TicketStatus.RESOLVED, TicketPriority.HIGH),
    ("Dashboard loads slowly", "The dashboard takes over ten seconds to load.", "Fatima Noor", "fatima.noor@example.com", TicketStatus.IN_PROGRESS, TicketPriority.MEDIUM),
    ("Cannot upload profile photo", "Uploading a JPG image returns an error.", "Omar Shah", "omar.shah@example.com", TicketStatus.OPEN, TicketPriority.MEDIUM),
    ("Invoice PDF is blank", "Downloaded invoice PDFs contain no details.", "Emily Wilson", "emily.wilson@example.com", TicketStatus.OPEN, TicketPriority.HIGH),
    ("Change notification email", "Use the new finance address for notifications.", "Hassan Ali", "hassan.ali@example.com", TicketStatus.RESOLVED, TicketPriority.LOW),
    ("Mobile menu does not open", "The navigation menu is unresponsive on Android.", "Sophia Martin", "sophia.martin@example.com", TicketStatus.IN_PROGRESS, TicketPriority.HIGH),
    ("Incorrect timezone on reports", "Report timestamps display in the wrong timezone.", "Bilal Ahmed", "bilal.ahmed@example.com", TicketStatus.OPEN, TicketPriority.MEDIUM),
    ("Account locked after login attempts", "The account remains locked after the waiting period.", "Emma Davis", "emma.davis@example.com", TicketStatus.RESOLVED, TicketPriority.HIGH),
    ("Add dark mode support", "Please provide a dark theme for the dashboard.", "Usman Tariq", "usman.tariq@example.com", TicketStatus.OPEN, TicketPriority.LOW),
    ("Search returns old results", "Recently created tickets are missing from search.", "Olivia Taylor", "olivia.taylor@example.com", TicketStatus.IN_PROGRESS, TicketPriority.MEDIUM),
    ("Two-factor code expired", "Authentication codes expire immediately after delivery.", "Hamza Malik", "hamza.malik@example.com", TicketStatus.OPEN, TicketPriority.HIGH),
    ("Cancel annual subscription", "Cancel renewal at the end of the current term.", "Grace Moore", "grace.moore@example.com", TicketStatus.RESOLVED, TicketPriority.MEDIUM),
    ("Missing ticket notifications", "No email is sent when a ticket status changes.", "Zainab Raza", "zainab.raza@example.com", TicketStatus.IN_PROGRESS, TicketPriority.MEDIUM),
    ("Export contains duplicate rows", "CSV exports contain each ticket twice.", "James Anderson", "james.anderson@example.com", TicketStatus.OPEN, TicketPriority.HIGH),
    ("Update company name", "Change the company name shown on invoices.", "Mariam Iqbal", "mariam.iqbal@example.com", TicketStatus.RESOLVED, TicketPriority.LOW),
    ("API returns unauthorized", "Valid API tokens receive a 401 response.", "Noah Thomas", "noah.thomas@example.com", TicketStatus.IN_PROGRESS, TicketPriority.HIGH),
    ("Add custom ticket tags", "Allow teams to create and assign custom tags.", "Ali Rehman", "ali.rehman@example.com", TicketStatus.OPEN, TicketPriority.LOW),
    ("Receipt email not received", "Payment succeeded but no receipt was delivered.", "Ava Jackson", "ava.jackson@example.com", TicketStatus.RESOLVED, TicketPriority.MEDIUM),
    ("Browser session ends early", "Users are signed out after only a few minutes.", "Ahmed Saeed", "ahmed.saeed@example.com", TicketStatus.OPEN, TicketPriority.HIGH),
    ("Sort order resets", "The selected ticket sort order resets after refresh.", "Isabella White", "isabella.white@example.com", TicketStatus.IN_PROGRESS, TicketPriority.LOW),
    ("Cannot delete archived user", "Deleting an archived user produces a server error.", "Saad Qureshi", "saad.qureshi@example.com", TicketStatus.OPEN, TicketPriority.MEDIUM),
    ("Typo in welcome email", "The welcome email contains an incorrect support link.", "Mia Harris", "mia.harris@example.com", TicketStatus.RESOLVED, TicketPriority.LOW),
    ("Payment method rejected", "A valid corporate card is repeatedly rejected.", "Noman Farooq", "noman.farooq@example.com", TicketStatus.IN_PROGRESS, TicketPriority.HIGH),
    ("Report date filter ignored", "Reports include records outside the selected dates.", "Charlotte Clark", "charlotte.clark@example.com", TicketStatus.OPEN, TicketPriority.MEDIUM),
    ("Need additional admin seat", "Please add one more administrator seat.", "Hira Siddiqui", "hira.siddiqui@example.com", TicketStatus.RESOLVED, TicketPriority.LOW),
    ("Webhook delivery delayed", "Webhook events arrive approximately an hour late.", "Liam Lewis", "liam.lewis@example.com", TicketStatus.IN_PROGRESS, TicketPriority.HIGH),
    ("Knowledge base link broken", "The help menu links to a missing article.", "Mehwish Khan", "mehwish.khan@example.com", TicketStatus.OPEN, TicketPriority.LOW),
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for title, description, name, email, status, priority in SEED_TICKETS:
            ticket_id = await session.scalar(
                select(Ticket.id).where(Ticket.title == title)
            )
            if ticket_id is not None:
                logger.info("seed_ticket_exists", title=title)
                continue

            session.add(
                Ticket(
                    title=title,
                    description=description,
                    customer_name=name,
                    customer_email=email,
                    status=status,
                    priority=priority,
                )
            )
            await session.commit()
            logger.info(
                "seed_ticket_created",
                title=title,
                status=status.value,
                priority=priority.value,
            )

    await close_db_engine()


if __name__ == "__main__":
    configure_logging()
    asyncio.run(seed())
