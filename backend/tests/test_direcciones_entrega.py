"""Tests for direcciones de entrega CRUD endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestDireccionesEntrega:
    """Test CRUD operations for direcciones_entrega."""

    @pytest.fixture
    async def auth_headers(self, async_client: AsyncClient) -> dict[str, str]:
        """Register a test user and return auth headers."""
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "direccion@test.com", "password": "TestPass123"},
        )
        assert resp.status_code == 201
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    async def admin_headers(self, async_client: AsyncClient) -> dict[str, str]:
        """Register an admin user and return auth headers."""
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "admin_dir@test.com", "password": "AdminPass123"},
        )
        assert resp.status_code == 201
        token = resp.json()["access_token"]
        # Promote to admin via DB directly - done in test if needed
        return {"Authorization": f"Bearer {token}"}

    async def test_auth_required(self, async_client: AsyncClient):
        """Unauthenticated requests return 401."""
        resp = await async_client.get("/api/v1/direcciones-entrega/")
        assert resp.status_code == 401

        resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={"direccion": "Test", "ciudad": "C", "provincia": "P"},
        )
        assert resp.status_code == 401

    async def test_list_empty(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """New user has no addresses."""
        resp = await async_client.get("/api/v1/direcciones-entrega/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create_direccion(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """Create a new delivery address."""
        resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={
                "direccion": "Av. Siempre Viva 742",
                "ciudad": "Springfield",
                "provincia": "BA",
                "codigo_postal": "1234",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["direccion"] == "Av. Siempre Viva 742"
        assert data["ciudad"] == "Springfield"
        assert data["provincia"] == "BA"
        assert data["codigo_postal"] == "1234"
        assert "id" in data
        assert "usuario_id" in data

    async def test_list_after_create(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """After creating, the address appears in the list."""
        await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={
                "direccion": "Calle Falsa 123",
                "ciudad": "Rosario",
                "provincia": "Santa Fe",
                "codigo_postal": "2000",
            },
            headers=auth_headers,
        )
        resp = await async_client.get("/api/v1/direcciones-entrega/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["direccion"] == "Calle Falsa 123"

    async def test_update_direccion(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """Update an existing address."""
        create_resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={
                "direccion": "Original 456",
                "ciudad": "Córdoba",
                "provincia": "Córdoba",
            },
            headers=auth_headers,
        )
        dir_id = create_resp.json()["id"]

        update_resp = await async_client.put(
            f"/api/v1/direcciones-entrega/{dir_id}",
            json={"direccion": "Actualizada 789", "codigo_postal": "5000"},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["direccion"] == "Actualizada 789"
        assert data["codigo_postal"] == "5000"
        assert data["ciudad"] == "Córdoba"

    async def test_delete_direccion(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """Delete an address."""
        create_resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={
                "direccion": "Para borrar",
                "ciudad": "Mendoza",
                "provincia": "Mendoza",
            },
            headers=auth_headers,
        )
        dir_id = create_resp.json()["id"]

        del_resp = await async_client.delete(
            f"/api/v1/direcciones-entrega/{dir_id}",
            headers=auth_headers,
        )
        assert del_resp.status_code == 204

        # Verify it's gone
        list_resp = await async_client.get("/api/v1/direcciones-entrega/", headers=auth_headers)
        assert list_resp.json() == []

    async def test_404_nonexistent(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """Accessing a non-existent address returns 404."""
        resp = await async_client.put(
            "/api/v1/direcciones-entrega/99999",
            json={"direccion": "Nueva"},
            headers=auth_headers,
        )
        assert resp.status_code == 404

        resp = await async_client.delete(
            "/api/v1/direcciones-entrega/99999",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_user_isolation(
        self, async_client: AsyncClient
    ):
        """Two different users cannot see each other's addresses."""
        # User 1
        r1 = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "user1_dir@test.com", "password": "TestPass1"},
        )
        h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}

        await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={"direccion": "User1 addr", "ciudad": "C1", "provincia": "P1"},
            headers=h1,
        )

        # User 2
        r2 = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "user2_dir@test.com", "password": "TestPass2"},
        )
        h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}

        # User 2 should see empty list
        list2 = await async_client.get("/api/v1/direcciones-entrega/", headers=h2)
        assert list2.json() == []

        # User 1 still sees theirs
        list1 = await async_client.get("/api/v1/direcciones-entrega/", headers=h1)
        assert len(list1.json()) == 1

    async def test_403_other_users_address(
        self, async_client: AsyncClient
    ):
        """Updating/deleting another user's address returns 403."""
        r1 = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "owner_dir@test.com", "password": "TestPass1"},
        )
        h1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}

        create_resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={"direccion": "Owner addr", "ciudad": "C", "provincia": "P"},
            headers=h1,
        )
        dir_id = create_resp.json()["id"]

        # User 2 tries to update/delete
        r2 = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "attacker_dir@test.com", "password": "TestPass2"},
        )
        h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}

        put_resp = await async_client.put(
            f"/api/v1/direcciones-entrega/{dir_id}",
            json={"direccion": "Hacked"},
            headers=h2,
        )
        assert put_resp.status_code == 403

        del_resp = await async_client.delete(
            f"/api/v1/direcciones-entrega/{dir_id}",
            headers=h2,
        )
        assert del_resp.status_code == 403

    async def test_create_without_optional_fields(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """codigo_postal is optional."""
        resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={
                "direccion": "Sin CP",
                "ciudad": "Ciudad",
                "provincia": "Provincia",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["codigo_postal"] is None

    async def test_create_empty_direccion_fails(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ):
        """Empty fields should fail validation."""
        resp = await async_client.post(
            "/api/v1/direcciones-entrega/",
            json={"direccion": "", "ciudad": "", "provincia": ""},
            headers=auth_headers,
        )
        assert resp.status_code == 422
