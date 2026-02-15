"""Service for creating and persisting messages."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Message, Thread


async def persist_assistant_message(
    thread: Thread,
    content: str,
    db: AsyncSession,
    *,
    content_json: dict | None = None,
) -> Message:
    """Create an assistant message with atomically allocated seq."""
    result = await db.execute(
        select(Thread).filter(Thread.id == thread.id).with_for_update()
    )
    locked_thread = result.scalars().first()

    allocated_seq = locked_thread.next_seq
    locked_thread.next_seq += 1
    locked_thread.updated_at = datetime.now(timezone.utc)

    msg = Message(
        thread_id=thread.id,
        seq=allocated_seq,
        role="assistant",
        content=content,
        content_json=content_json or {},
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
