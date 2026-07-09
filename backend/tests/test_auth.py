from httpx import AsyncClient

REGISTER_PAYLOAD = {
    "email": "new.user@example.com",
    "full_name": "New User",
    "password": "supersecret1",
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


async def test_login_returns_usable_token(client: AsyncClient):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/api/auth/login",
        data={"username": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )

    assert response.status_code == 200
    token = response.json()["access_token"]

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == REGISTER_PAYLOAD["email"]


async def test_login_with_wrong_password_fails(client: AsyncClient):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/api/auth/login",
        data={"username": REGISTER_PAYLOAD["email"], "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


async def test_me_requires_authentication(client: AsyncClient):
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_me_rejects_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401
