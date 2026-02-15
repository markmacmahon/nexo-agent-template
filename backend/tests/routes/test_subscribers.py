"""Tests for subscriber endpoints."""

import pytest
from datetime import datetime, timezone
from sqlalchemy import insert

from app.models import Subscriber, App


class TestSubscribers:
    @pytest.mark.asyncio(loop_scope="function")
    async def test_list_subscribers_empty(
        self, test_client, db_session, authenticated_user
    ):
        """Test listing subscribers for an app (initially empty)."""
        # Create a test app
        app_data = {"name": "Test App", "user_id": authenticated_user["user"].id}
        result = await db_session.execute(insert(App).values(**app_data).returning(App))
        test_app = result.scalar()
        await db_session.commit()

        # List subscribers (should be empty)
        response = await test_client.get(
            f"/apps/{test_app.id}/subscribers",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 0

    @pytest.mark.asyncio(loop_scope="function")
    async def test_list_subscribers_unauthorized(self, test_client):
        """Test listing subscribers without authentication fails."""
        # Use a fake app ID - we expect 401 before the app lookup
        fake_app_id = "00000000-0000-0000-0000-000000000000"
        response = await test_client.get(f"/apps/{fake_app_id}/subscribers")
        assert response.status_code == 401

    @pytest.mark.asyncio(loop_scope="function")
    async def test_list_subscribers_wrong_app(
        self, test_client, authenticated_user
    ):
        """Test listing subscribers for non-existent app."""
        fake_app_id = "00000000-0000-0000-0000-000000000000"
        response = await test_client.get(
            f"/apps/{fake_app_id}/subscribers",
            headers=authenticated_user["headers"],
        )
        assert response.status_code == 404

    @pytest.mark.asyncio(loop_scope="function")
    async def test_get_subscriber_threads(
        self, test_client, db_session, authenticated_user
    ):
        """Test getting threads for a subscriber."""
        # Create a test app
        app_data = {"name": "Test App", "user_id": authenticated_user["user"].id}
        result = await db_session.execute(insert(App).values(**app_data).returning(App))
        test_app = result.scalar()
        await db_session.commit()

        # Create a subscriber
        subscriber = Subscriber(
            app_id=test_app.id,
            customer_id="test-customer-1",
            display_name="Test Customer",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(subscriber)
        await db_session.commit()
        await db_session.refresh(subscriber)

        # Get threads for this subscriber (should be empty initially)
        response = await test_client.get(
            f"/apps/{test_app.id}/subscribers/{subscriber.id}/threads",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] == 0

    @pytest.mark.asyncio(loop_scope="function")
    async def test_get_subscriber_detail(
        self, test_client, db_session, authenticated_user
    ):
        """Test getting subscriber detail."""
        # Create a test app
        app_data = {"name": "Test App", "user_id": authenticated_user["user"].id}
        result = await db_session.execute(insert(App).values(**app_data).returning(App))
        test_app = result.scalar()
        await db_session.commit()

        # Create a subscriber
        subscriber = Subscriber(
            app_id=test_app.id,
            customer_id="test-customer-2",
            display_name="Test Customer 2",
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(subscriber)
        await db_session.commit()
        await db_session.refresh(subscriber)

        # Get subscriber detail
        response = await test_client.get(
            f"/apps/{test_app.id}/subscribers/{subscriber.id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == "test-customer-2"
        assert data["display_name"] == "Test Customer 2"
