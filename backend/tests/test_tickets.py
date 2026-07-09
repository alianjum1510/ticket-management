from httpx import AsyncClient

from models.tickets import TicketPriority, TicketStatus
from tests.conftest import create_ticket

CREATE_PAYLOAD = {
    "title": "Printer on fire",
    "description": "The office printer is literally on fire.",
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "priority": "high",
}


class TestAccessControl:
    async def test_endpoints_require_authentication(self, client: AsyncClient):
        assert (await client.get("/api/tickets")).status_code == 401
        assert (await client.get("/api/tickets/1")).status_code == 401
        assert (await client.post("/api/tickets", json=CREATE_PAYLOAD)).status_code == 401
        assert (await client.patch("/api/tickets/1", json={"status": "resolved"})).status_code == 401
        assert (await client.delete("/api/tickets/1")).status_code == 401

    async def test_user_can_only_read(self, client: AsyncClient, user_headers):
        ticket = await create_ticket()

        assert (await client.get("/api/tickets", headers=user_headers)).status_code == 200
        assert (
            await client.get(f"/api/tickets/{ticket.id}", headers=user_headers)
        ).status_code == 200

        assert (
            await client.post("/api/tickets", json=CREATE_PAYLOAD, headers=user_headers)
        ).status_code == 403
        assert (
            await client.patch(
                f"/api/tickets/{ticket.id}", json={"status": "resolved"}, headers=user_headers
            )
        ).status_code == 403
        assert (
            await client.delete(f"/api/tickets/{ticket.id}", headers=user_headers)
        ).status_code == 403

    async def test_admin_can_do_everything_except_delete(self, client: AsyncClient, admin_headers):
        created = await client.post("/api/tickets", json=CREATE_PAYLOAD, headers=admin_headers)
        assert created.status_code == 201
        ticket_id = created.json()["id"]

        assert (await client.get("/api/tickets", headers=admin_headers)).status_code == 200
        assert (
            await client.patch(
                f"/api/tickets/{ticket_id}", json={"status": "in_progress"}, headers=admin_headers
            )
        ).status_code == 200

        assert (
            await client.delete(f"/api/tickets/{ticket_id}", headers=admin_headers)
        ).status_code == 403

    async def test_super_admin_can_delete(self, client: AsyncClient, super_admin_headers):
        ticket = await create_ticket()

        response = await client.delete(f"/api/tickets/{ticket.id}", headers=super_admin_headers)
        assert response.status_code == 204

        follow_up = await client.get(f"/api/tickets/{ticket.id}", headers=super_admin_headers)
        assert follow_up.status_code == 404


class TestCreate:
    async def test_new_ticket_starts_open(self, client: AsyncClient, admin_headers):
        response = await client.post("/api/tickets", json=CREATE_PAYLOAD, headers=admin_headers)

        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "open"
        assert body["title"] == CREATE_PAYLOAD["title"]
        assert body["created_at"].endswith("+00:00")

    async def test_create_validates_required_fields(self, client: AsyncClient, admin_headers):
        response = await client.post(
            "/api/tickets",
            json={"title": "", "description": "", "customer_name": "", "customer_email": "nope", "priority": "high"},
            headers=admin_headers,
        )
        assert response.status_code == 422


class TestStatusUpdate:
    async def test_update_persists(self, client: AsyncClient, admin_headers):
        ticket = await create_ticket()

        response = await client.patch(
            f"/api/tickets/{ticket.id}", json={"status": "resolved"}, headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "resolved"

        detail = await client.get(f"/api/tickets/{ticket.id}", headers=admin_headers)
        assert detail.json()["status"] == "resolved"

    async def test_update_missing_ticket_returns_404(self, client: AsyncClient, admin_headers):
        response = await client.patch(
            "/api/tickets/999", json={"status": "resolved"}, headers=admin_headers
        )
        assert response.status_code == 404

    async def test_update_rejects_unknown_status(self, client: AsyncClient, admin_headers):
        ticket = await create_ticket()
        response = await client.patch(
            f"/api/tickets/{ticket.id}", json={"status": "closed"}, headers=admin_headers
        )
        assert response.status_code == 422


class TestListFilters:
    async def test_filter_by_status_and_priority(self, client: AsyncClient, user_headers):
        await create_ticket(status=TicketStatus.OPEN, priority=TicketPriority.HIGH)
        await create_ticket(status=TicketStatus.RESOLVED, priority=TicketPriority.HIGH)
        await create_ticket(status=TicketStatus.OPEN, priority=TicketPriority.LOW)

        response = await client.get(
            "/api/tickets", params={"status": "open", "priority": "high"}, headers=user_headers
        )

        body = response.json()
        assert body["total"] == 1
        assert body["items"][0]["status"] == "open"
        assert body["items"][0]["priority"] == "high"

    async def test_search_matches_title_or_customer(self, client: AsyncClient, user_headers):
        await create_ticket(title="Broken login page", customer_name="Alice")
        await create_ticket(title="Billing issue", customer_name="Bob Loginson")
        await create_ticket(title="Unrelated", customer_name="Carol")

        response = await client.get(
            "/api/tickets", params={"search": "LOGIN"}, headers=user_headers
        )

        body = response.json()
        assert body["total"] == 2
        titles = {item["title"] for item in body["items"]}
        assert titles == {"Broken login page", "Billing issue"}


class TestPaginationAndSorting:
    async def test_pagination_returns_pages_and_total(self, client: AsyncClient, user_headers):
        for i in range(5):
            await create_ticket(title=f"Ticket {i}")

        page_1 = (
            await client.get(
                "/api/tickets", params={"page": 1, "page_size": 2}, headers=user_headers
            )
        ).json()
        page_3 = (
            await client.get(
                "/api/tickets", params={"page": 3, "page_size": 2}, headers=user_headers
            )
        ).json()

        assert page_1["total"] == 5
        assert len(page_1["items"]) == 2
        assert len(page_3["items"]) == 1
        assert page_3["page"] == 3

    async def test_sort_by_priority_uses_severity_order(self, client: AsyncClient, user_headers):
        await create_ticket(title="medium", priority=TicketPriority.MEDIUM)
        await create_ticket(title="high", priority=TicketPriority.HIGH)
        await create_ticket(title="low", priority=TicketPriority.LOW)

        response = await client.get(
            "/api/tickets",
            params={"sort_by": "priority", "sort_order": "desc"},
            headers=user_headers,
        )

        priorities = [item["priority"] for item in response.json()["items"]]
        assert priorities == ["high", "medium", "low"]

    async def test_sort_by_title_ascending(self, client: AsyncClient, user_headers):
        for title in ["banana", "Apple", "cherry"]:
            await create_ticket(title=title)

        response = await client.get(
            "/api/tickets",
            params={"sort_by": "title", "sort_order": "asc"},
            headers=user_headers,
        )

        titles = [item["title"] for item in response.json()["items"]]
        assert titles == ["Apple", "banana", "cherry"]
