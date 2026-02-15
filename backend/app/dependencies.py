"""Shared FastAPI dependencies for authorization and resource access."""

from uuid import UUID
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import User, get_async_session
from app.models import App, Thread, Subscriber
from app.users import current_active_user


async def get_app_or_404(
    app_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
) -> App:
    """Get app by ID and verify ownership."""
    result = await db.execute(
        select(App).filter(App.id == app_id, App.user_id == user.id)
    )
    app = result.scalars().first()

    if not app:
        raise HTTPException(status_code=404, detail="ERROR_APP_NOT_FOUND")

    return app


async def get_subscriber_in_app_or_404(
    app_id: UUID,
    subscriber_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
) -> Subscriber:
    """Get subscriber by ID and verify it belongs to the app owned by user."""
    # First verify app ownership
    await get_app_or_404(app_id, db, user)

    # Then get subscriber
    result = await db.execute(
        select(Subscriber).filter(
            Subscriber.id == subscriber_id, Subscriber.app_id == app_id
        )
    )
    subscriber = result.scalars().first()

    if not subscriber:
        raise HTTPException(status_code=404, detail="ERROR_SUBSCRIBER_NOT_FOUND")

    return subscriber


async def get_thread_in_app_or_404(
    app_id: UUID,
    thread_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
) -> Thread:
    """Get thread by ID and verify it belongs to the app owned by user."""
    result = await db.execute(
        select(Thread)
        .join(App)
        .filter(Thread.id == thread_id, Thread.app_id == app_id, App.user_id == user.id)
        .options(selectinload(Thread.app))
    )
    thread = result.scalars().first()

    if not thread:
        raise HTTPException(status_code=404, detail="ERROR_THREAD_NOT_FOUND")

    return thread
