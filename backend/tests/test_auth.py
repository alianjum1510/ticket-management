import pytest
from httpx import AsyncClient

REGISTER_PAYLOAD = {
    "email": "new.user@example.com",
    "full_name": "New User",
    "password": "SuperSecret1!",
}


async def test_register_creates_plain_user(client: AsyncClient):
    response = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == REGISTER_PAYLOAD["email"]
    assert body["role"] == "user"
    assert "password" not in body and "hashed_password" not in body


async def test_register_duplicate_email_conflicts(client: AsyncClient):
    assert (await client.post("/api/auth/register", json=REGISTER_PAYLOAD)).status_code == 201

    response = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


async def test_register_rejects_short_password(client: AsyncClient):
    response = await client.post(
        "/api/auth/register", json={**REGISTER_PAYLOAD, "password": "short"}
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("password", "missing_requirement"),
    [
        ("lowercase1!", "uppercase letter"),
        ("UPPERCASE1!", "lowercase letter"),
        ("NoNumbers!", "number"),
        ("NoSpecial1", "special character"),
    ],
)
async def test_register_rejects_weak_password(
    client: AsyncClient,
    password: str,
    missing_requirement: str,
):
    response = await client.post(
        "/api/auth/register",
        json={**REGISTER_PAYLOAD, "password": password},
    )

    assert response.status_code == 422
    assert missing_requirement in response.json()["detail"]


async def test_login_returns_usable_token(client: AsyncClient):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/api/auth/login",
        data={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )

    assert response.status_code == 200
    token = response.json()["access_token"]

    me = await client.get(
        "/api/auth/user-details", headers={"Authorization": f"Bearer {token}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == REGISTER_PAYLOAD["email"]


async def test_login_with_wrong_password_fails(client: AsyncClient):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/api/auth/login",
        data={"email": REGISTER_PAYLOAD["email"], "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


async def test_login_requires_email_field(client: AsyncClient):
    response = await client.post(
        "/api/auth/login",
        data={"username": REGISTER_PAYLOAD["email"], "password": "supersecret1"},
    )

    assert response.status_code == 422


async def test_user_details_requires_authentication(client: AsyncClient):
    assert (await client.get("/api/auth/user-details")).status_code == 401


async def test_user_details_rejects_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/auth/user-details", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401
