import pytest
from fastapi import status
from sqlalchemy import select, insert
from app.models import App


class TestApps:
    @pytest.mark.asyncio(loop_scope="function")
    async def test_create_app(self, test_client, db_session, authenticated_user):
        """Test creating an app."""
        app_data = {"name": "Test App", "description": "Test Description"}
        create_response = await test_client.post(
            "/apps/", json=app_data, headers=authenticated_user["headers"]
        )

        assert create_response.status_code == status.HTTP_200_OK
        created_app = create_response.json()
        assert created_app["name"] == app_data["name"]
        assert created_app["description"] == app_data["description"]

        # Check if the app is in the database
        app = await db_session.execute(select(App).where(App.id == created_app["id"]))
        app = app.scalar()

        assert app is not None
        assert app.name == app_data["name"]
        assert app.description == app_data["description"]

    @pytest.mark.asyncio(loop_scope="function")
    async def test_read_apps(self, test_client, db_session, authenticated_user):
        """Test reading apps."""
        # Create multiple apps
        apps_data = [
            {
                "name": "First App",
                "description": "First Description",
                "user_id": authenticated_user["user"].id,
            },
            {
                "name": "Second App",
                "description": "Second Description",
                "user_id": authenticated_user["user"].id,
            },
        ]
        # create apps in the database
        for app_data in apps_data:
            await db_session.execute(insert(App).values(**app_data))

        await db_session.commit()  # Add commit to ensure apps are saved

        # Read apps - test pagination response
        read_response = await test_client.get(
            "/apps/", headers=authenticated_user["headers"]
        )
        assert read_response.status_code == status.HTTP_200_OK
        response_data = read_response.json()

        # Check pagination structure
        assert "items" in response_data
        assert "total" in response_data
        assert "page" in response_data
        assert "size" in response_data

        apps = response_data["items"]

        # Filter apps created in this test (to avoid interference from other tests)
        test_apps = [app for app in apps if app["name"] in ["First App", "Second App"]]

        assert len(test_apps) == 2
        assert any(app["name"] == "First App" for app in test_apps)
        assert any(app["name"] == "Second App" for app in test_apps)

    @pytest.mark.asyncio(loop_scope="function")
    async def test_delete_app(self, test_client, db_session, authenticated_user):
        """Test deleting an app."""
        # Create an app directly in the database
        app_data = {
            "name": "App to Delete",
            "description": "Will be deleted",
            "user_id": authenticated_user["user"].id,
        }
        await db_session.execute(insert(App).values(**app_data))

        # Get the created app from database
        db_app = (
            await db_session.execute(select(App).where(App.name == app_data["name"]))
        ).scalar()

        # Delete the app
        delete_response = await test_client.delete(
            f"/apps/{db_app.id}", headers=authenticated_user["headers"]
        )
        assert delete_response.status_code == status.HTTP_200_OK

        # Verify app is deleted from database
        db_check = (
            await db_session.execute(select(App).where(App.id == db_app.id))
        ).scalar()
        assert db_check is None

    @pytest.mark.asyncio(loop_scope="function")
    async def test_delete_nonexistent_app(self, test_client, authenticated_user):
        """Test deleting an app that doesn't exist."""
        # Try to delete non-existent app
        delete_response = await test_client.delete(
            "/apps/00000000-0000-0000-0000-000000000000",
            headers=authenticated_user["headers"],
        )
        assert delete_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio(loop_scope="function")
    async def test_get_single_app(self, test_client, db_session, authenticated_user):
        """Test getting a single app by ID."""
        app_data = {
            "name": "Single App",
            "description": "Get me",
            "user_id": authenticated_user["user"].id,
        }
        await db_session.execute(insert(App).values(**app_data))
        await db_session.commit()

        db_app = (
            await db_session.execute(select(App).where(App.name == "Single App"))
        ).scalar()

        response = await test_client.get(
            f"/apps/{db_app.id}", headers=authenticated_user["headers"]
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Single App"
        assert data["description"] == "Get me"
        assert data["id"] == str(db_app.id)

    @pytest.mark.asyncio(loop_scope="function")
    async def test_get_single_app_not_found(self, test_client, authenticated_user):
        """Test getting a non-existent app."""
        response = await test_client.get(
            "/apps/00000000-0000-0000-0000-000000000000",
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio(loop_scope="function")
    async def test_update_app(self, test_client, db_session, authenticated_user):
        """Test updating an app."""
        app_data = {
            "name": "Old Name",
            "description": "Old Description",
            "user_id": authenticated_user["user"].id,
        }
        await db_session.execute(insert(App).values(**app_data))
        await db_session.commit()

        db_app = (
            await db_session.execute(select(App).where(App.name == "Old Name"))
        ).scalar()

        response = await test_client.patch(
            f"/apps/{db_app.id}",
            json={"name": "New Name", "description": "New Description"},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "New Name"
        assert data["description"] == "New Description"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_update_app_partial(
        self, test_client, db_session, authenticated_user
    ):
        """Test partially updating an app (only name)."""
        app_data = {
            "name": "Partial Name",
            "description": "Keep This",
            "user_id": authenticated_user["user"].id,
        }
        await db_session.execute(insert(App).values(**app_data))
        await db_session.commit()

        db_app = (
            await db_session.execute(select(App).where(App.name == "Partial Name"))
        ).scalar()

        response = await test_client.patch(
            f"/apps/{db_app.id}",
            json={"name": "Changed Name"},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Changed Name"
        assert data["description"] == "Keep This"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_update_app_not_found(self, test_client, authenticated_user):
        """Test updating a non-existent app."""
        response = await test_client.patch(
            "/apps/00000000-0000-0000-0000-000000000000",
            json={"name": "Nope"},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio(loop_scope="function")
    async def test_unauthorized_read_apps(self, test_client):
        """Test reading apps without authentication."""
        response = await test_client.get("/apps/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio(loop_scope="function")
    async def test_unauthorized_create_app(self, test_client):
        """Test creating app without authentication."""
        app_data = {"name": "Unauthorized App", "description": "Should fail"}
        response = await test_client.post("/apps/", json=app_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio(loop_scope="function")
    async def test_unauthorized_delete_app(self, test_client):
        """Test deleting app without authentication."""
        response = await test_client.delete(
            "/apps/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio(loop_scope="function")
    async def test_create_app_with_config(self, test_client, authenticated_user):
        """Test creating an app with webhook and integration config."""
        app_data = {
            "name": "Configured App",
            "description": "Has integration config",
            "webhook_url": "https://example.com/webhook",
            "config_json": {
                "integration": {"mode": "webhook"},
                "webhook": {"timeout_ms": 5000},
            },
        }
        response = await test_client.post(
            "/apps/", json=app_data, headers=authenticated_user["headers"]
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["webhook_url"] == "https://example.com/webhook"
        assert data["config_json"]["integration"]["mode"] == "webhook"
        assert data["config_json"]["webhook"]["timeout_ms"] == 5000

    @pytest.mark.asyncio(loop_scope="function")
    async def test_update_app_config(self, test_client, db_session, authenticated_user):
        """Test updating app integration config."""
        # Create app
        create_response = await test_client.post(
            "/apps/",
            json={"name": "Plain App"},
            headers=authenticated_user["headers"],
        )
        app_id = create_response.json()["id"]

        # Update with config
        update_response = await test_client.patch(
            f"/apps/{app_id}",
            json={
                "webhook_url": "https://hook.example.com/api",
                "config_json": {
                    "integration": {"mode": "webhook"},
                    "simulator": {"scenario": "ecommerce_support"},
                },
            },
            headers=authenticated_user["headers"],
        )
        assert update_response.status_code == status.HTTP_200_OK
        data = update_response.json()
        assert data["webhook_url"] == "https://hook.example.com/api"
        assert data["config_json"]["integration"]["mode"] == "webhook"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_app_defaults_empty_config(self, test_client, authenticated_user):
        """Test that a new app defaults to empty config_json."""
        response = await test_client.post(
            "/apps/",
            json={"name": "Default App"},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["config_json"] == {}
        assert data["webhook_url"] is None


class TestAppSecretMasking:
    """Test that webhook_secret is properly masked in all API responses."""

    @pytest.mark.asyncio(loop_scope="function")
    async def test_create_app_with_secret_returns_masked(
        self, test_client, authenticated_user
    ):
        """Creating an app with webhook_secret returns masked value."""
        response = await test_client.post(
            "/apps/",
            json={
                "name": "Secret App",
                "description": "Has a secret",
                "webhook_secret": "real-secret-abc123",
            },
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["webhook_secret"] == "••••••"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_get_app_with_secret_returns_masked(
        self, test_client, db_session, authenticated_user
    ):
        """Getting an app with webhook_secret returns masked value."""
        # Create with secret
        create_resp = await test_client.post(
            "/apps/",
            json={
                "name": "Get Secret App",
                "webhook_secret": "get-test-secret-xyz",
            },
            headers=authenticated_user["headers"],
        )
        app_id = create_resp.json()["id"]

        # Fetch it
        response = await test_client.get(
            f"/apps/{app_id}",
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["webhook_secret"] == "••••••"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_update_app_with_secret_returns_masked(
        self, test_client, db_session, authenticated_user
    ):
        """Updating an app's webhook_secret returns masked value."""
        # Create without secret
        create_resp = await test_client.post(
            "/apps/",
            json={"name": "Update Secret App"},
            headers=authenticated_user["headers"],
        )
        app_id = create_resp.json()["id"]
        assert create_resp.json()["webhook_secret"] is None

        # Update with secret
        response = await test_client.patch(
            f"/apps/{app_id}",
            json={"webhook_secret": "new-secret-for-update"},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["webhook_secret"] == "••••••"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_list_apps_with_secret_returns_masked(
        self, test_client, db_session, authenticated_user
    ):
        """Listing apps masks webhook_secret for each app."""
        # Create app with secret
        await test_client.post(
            "/apps/",
            json={
                "name": "Listed Secret App",
                "webhook_secret": "listed-secret",
            },
            headers=authenticated_user["headers"],
        )

        response = await test_client.get(
            "/apps/",
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        items = response.json()["items"]
        secret_apps = [a for a in items if a["name"] == "Listed Secret App"]
        assert len(secret_apps) == 1
        assert secret_apps[0]["webhook_secret"] == "••••••"

    @pytest.mark.asyncio(loop_scope="function")
    async def test_app_without_secret_returns_null(
        self, test_client, authenticated_user
    ):
        """App without webhook_secret returns null (not masked)."""
        response = await test_client.post(
            "/apps/",
            json={"name": "No Secret App"},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["webhook_secret"] is None

    @pytest.mark.asyncio(loop_scope="function")
    async def test_clear_secret_returns_null(
        self, test_client, db_session, authenticated_user
    ):
        """Setting webhook_secret to null clears it."""
        # Create with secret
        create_resp = await test_client.post(
            "/apps/",
            json={
                "name": "Clear Secret App",
                "webhook_secret": "will-be-cleared",
            },
            headers=authenticated_user["headers"],
        )
        app_id = create_resp.json()["id"]
        assert create_resp.json()["webhook_secret"] == "••••••"

        # Clear secret
        response = await test_client.patch(
            f"/apps/{app_id}",
            json={"webhook_secret": None},
            headers=authenticated_user["headers"],
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["webhook_secret"] is None

    @pytest.mark.asyncio(loop_scope="function")
    async def test_secret_persists_in_database(
        self, test_client, db_session, authenticated_user
    ):
        """The real secret is stored in the DB, not the masked value."""
        create_resp = await test_client.post(
            "/apps/",
            json={
                "name": "Persisted Secret App",
                "webhook_secret": "real-persisted-secret-value",
            },
            headers=authenticated_user["headers"],
        )
        app_id = create_resp.json()["id"]

        # Verify in database directly
        result = await db_session.execute(select(App).where(App.id == app_id))
        db_app = result.scalar()
        assert db_app.webhook_secret == "real-persisted-secret-value"
