from typing import AsyncGenerator
from urllib.parse import urlparse

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy import NullPool, QueuePool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import settings
from .models import Base, User


parsed_db_url = urlparse(settings.DATABASE_URL)

async_db_connection_url = (
    f"postgresql+asyncpg://{parsed_db_url.username}:{parsed_db_url.password}@"
    f"{parsed_db_url.hostname}{':' + str(parsed_db_url.port) if parsed_db_url.port else ''}"
    f"{parsed_db_url.path}"
)

# Configure connection pooling based on deployment type
poolclass_map = {
    "null": NullPool,  # Serverless (Vercel, Lambda) - new connection per request
    "queue": QueuePool,  # Traditional servers (Docker, VPS) - connection pool with reuse
}
poolclass = poolclass_map.get(settings.DATABASE_POOL_CLASS.lower(), NullPool)

# Engine configuration
engine_kwargs = {"poolclass": poolclass}

# Add QueuePool settings if using connection pooling
if poolclass == QueuePool:
    engine_kwargs.update({
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_pre_ping": True,  # Verify connections before use (prevents stale connections)
        "pool_recycle": settings.DATABASE_POOL_RECYCLE,
    })

engine = create_async_engine(async_db_connection_url, **engine_kwargs)

async_session_maker = async_sessionmaker(
    engine, expire_on_commit=settings.EXPIRE_ON_COMMIT
)


async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


def get_session_factory() -> async_sessionmaker:
    """Return the async session factory.

    Exposed as a dependency so tests can override it with a test-scoped factory.
    Used by streaming endpoints that need to create their own short-lived sessions
    (e.g. to persist data inside an SSE generator without leaking connections).
    """
    return async_session_maker


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)
