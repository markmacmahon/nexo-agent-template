from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi_pagination import Page
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc

from app.database import User, get_async_session
from app.dependencies import get_app_or_404, get_subscriber_in_app_or_404
from app.models import Subscriber, Thread, Message
from app.schemas import (
    SubscriberRead,
    SubscriberSummary,
    ThreadSummary,
)
from app.users import current_active_user

router = APIRouter(tags=["subscribers"])


@router.get("/apps/{app_id}/subscribers", response_model=Page[SubscriberSummary])
async def list_subscribers(
    app_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=200, description="Page size"),
    q: str | None = Query(None, description="Search customer_id and display_name"),
):
    """
    List subscribers for an app with pagination.

    Returns subscribers ordered by last_message_at DESC (most recent first),
    with thread count and optional last message preview.
    """
    # Verify app ownership
    await get_app_or_404(app_id, db, user)

    # Build query
    query = (
        select(
            Subscriber,
            func.count(Thread.id).label("thread_count"),
        )
        .outerjoin(Thread, Thread.subscriber_id == Subscriber.id)
        .filter(Subscriber.app_id == app_id)
        .group_by(Subscriber.id)
    )

    # Apply search filter
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            (Subscriber.customer_id.ilike(search_pattern))
            | (Subscriber.display_name.ilike(search_pattern))
        )

    # Order by last_message_at DESC NULLS LAST, then created_at DESC, then id DESC
    query = query.order_by(
        desc(Subscriber.last_message_at).nulls_last(),
        desc(Subscriber.created_at),
        desc(Subscriber.id),
    )

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Transform to SubscriberSummary
    items = [
        SubscriberSummary(
            id=row.Subscriber.id,
            app_id=row.Subscriber.app_id,
            customer_id=row.Subscriber.customer_id,
            display_name=row.Subscriber.display_name,
            created_at=row.Subscriber.created_at,
            last_seen_at=row.Subscriber.last_seen_at,
            last_message_at=row.Subscriber.last_message_at,
            thread_count=row.thread_count,
            last_message_preview=None,  # TODO: Add last message preview
        )
        for row in rows
    ]

    # Manual pagination
    total = len(items)
    start = (page - 1) * size
    end = start + size
    paginated_items = items[start:end]

    # Calculate total pages
    pages = (total + size - 1) // size if total > 0 else 0

    return Page(
        items=paginated_items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/apps/{app_id}/subscribers/{subscriber_id}", response_model=SubscriberRead)
async def get_subscriber(
    app_id: UUID,
    subscriber_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """Get subscriber detail."""
    subscriber = await get_subscriber_in_app_or_404(app_id, subscriber_id, db, user)
    return subscriber


@router.get(
    "/apps/{app_id}/subscribers/{subscriber_id}/threads",
    response_model=Page[ThreadSummary],
)
async def list_subscriber_threads(
    app_id: UUID,
    subscriber_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=200, description="Page size"),
):
    """
    List threads for a subscriber with pagination.

    Returns threads ordered by updated_at DESC (most recent first),
    with message count and optional last message preview.
    """
    # Verify subscriber belongs to app
    await get_subscriber_in_app_or_404(app_id, subscriber_id, db, user)

    # Build query
    query = (
        select(
            Thread,
            func.count(Message.id).label("message_count"),
            func.max(Message.created_at).label("last_message_at"),
        )
        .outerjoin(Message, Message.thread_id == Thread.id)
        .filter(
            Thread.app_id == app_id,
            Thread.subscriber_id == subscriber_id,
        )
        .group_by(Thread.id)
        .order_by(desc(Thread.updated_at))
    )

    # Execute query
    result = await db.execute(query)
    rows = result.all()

    # Transform to ThreadSummary
    items = [
        ThreadSummary(
            id=row.Thread.id,
            app_id=row.Thread.app_id,
            subscriber_id=row.Thread.subscriber_id,
            title=row.Thread.title,
            status=row.Thread.status,
            customer_id=row.Thread.customer_id,
            created_at=row.Thread.created_at,
            updated_at=row.Thread.updated_at,
            message_count=row.message_count,
            last_message_at=row.last_message_at,
            last_message_preview=None,  # TODO: Add last message preview
        )
        for row in rows
    ]

    # Manual pagination
    total = len(items)
    start = (page - 1) * size
    end = start + size
    paginated_items = items[start:end]

    # Calculate total pages
    pages = (total + size - 1) // size if total > 0 else 0

    return Page(
        items=paginated_items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
