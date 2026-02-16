#!/usr/bin/env python3
"""
Brief: Example showing how to query the database from an incubator script.

This demonstrates the pattern for scripts that need to access the application database.
Useful for data analysis, migrations, reporting, or one-off operations.

Usage:
    # From project root:
    cd backend && uv run python ../incubator/scripts/example-db-query.py

    # Or if you have backend venv activated:
    python incubator/scripts/example-db-query.py

Prerequisites:
    - Database running (make docker-up-db)
    - Backend dependencies (cd backend && uv sync)

Author: Template
Created: 2026-02-16
Status: Example Template
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to Python path so we can import app modules
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import select, func

from app.database import async_session_maker
from app.models import User, App


async def main():
    """Example queries showing how to interact with the database."""

    async with async_session_maker() as session:
        # Example 1: Count users
        result = await session.execute(select(func.count(User.id)))
        user_count = result.scalar_one()
        print(f"📊 Total users: {user_count}")

        # Example 2: Count apps
        result = await session.execute(select(func.count(App.id)))
        app_count = result.scalar_one()
        print(f"📱 Total apps: {app_count}")

        # Example 3: List users with their app counts
        print("\n👥 Users and their apps:")
        result = await session.execute(
            select(User.email, func.count(App.id).label('app_count'))
            .outerjoin(App, User.id == App.user_id)
            .group_by(User.id, User.email)
            .order_by(User.email)
        )

        for row in result:
            email, app_count = row
            print(f"  {email}: {app_count} app(s)")

        # Example 4: Get specific user's apps
        print("\n🔍 Example: Get test user's apps:")
        result = await session.execute(
            select(User).where(User.email == "tester@nexo.xyz")
        )
        test_user = result.scalar_one_or_none()

        if test_user:
            result = await session.execute(
                select(App).where(App.user_id == test_user.id)
            )
            apps = result.scalars().all()

            print(f"  User: {test_user.email}")
            for app in apps:
                print(f"    - {app.name} (ID: {app.id})")
        else:
            print("  Test user not found. Run 'make seed' first.")

    print("\n✅ Query examples completed!")


if __name__ == "__main__":
    asyncio.run(main())
